<?php

namespace App\Http\Controllers\Bnb;

use App\Http\Controllers\Controller;
use App\Models\BnbReview;
use App\Models\BnbProperty;
use App\Models\BnbBooking;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class BnbReviewController extends Controller
{
    /**
     * Display a listing of the BNB reviews (owner sees reviews on their properties).
     */
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();

        $query = BnbReview::with(['property', 'guest', 'booking'])
            ->whereHas('property', fn ($q) => $q->where('owner_id', $user->id));

        if ($request->property_id) {
            $query->where('property_id', $request->property_id);
        }

        if ($request->rating && $request->rating !== 'all') {
            $query->where('rating', $request->rating);
        }

        if ($request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('comment', 'like', "%{$search}%")
                    ->orWhereHas('guest', function ($gq) use ($search) {
                        $gq->where('first_name', 'like', "%{$search}%")
                            ->orWhere('last_name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    })
                    ->orWhereHas('property', fn ($pq) => $pq->where('title', 'like', "%{$search}%"));
            });
        }

        if ($request->verified) {
            $query->where('verified', true);
        }

        $sortBy = $request->sort_by ?? 'created_at';
        $sortOrder = $request->sort_order ?? 'desc';
        $query->orderBy($sortBy, $sortOrder);

        $reviews = $query->paginate($request->per_page ?? 20);

        return response()->json([
            'data' => collect($reviews->items())->map(function (BnbReview $review) {
                $guest = $review->guest;
                $name = $guest
                    ? (trim(($guest->first_name ?? '') . ' ' . ($guest->last_name ?? '')) ?: $guest->email)
                    : 'Guest';

                return [
                    'id' => $review->id,
                    'property_id' => $review->property_id,
                    'property_title' => $review->property->title ?? 'Property',
                    'guest_name' => $name,
                    'rating' => $review->rating,
                    'comment' => $review->comment,
                    'response' => $review->response,
                    'created_at' => optional($review->created_at)?->toDateString(),
                    'booking_id' => $review->booking_id,
                    'verified' => (bool) $review->verified,
                ];
            })->values(),
            'meta' => [
                'current_page' => $reviews->currentPage(),
                'last_page' => $reviews->lastPage(),
                'per_page' => $reviews->perPage(),
                'total' => $reviews->total(),
            ],
        ]);
    }

    /**
     * Guest submits a review for a completed stay (auth required).
     */
    public function store(Request $request): JsonResponse
    {
        if (! Auth::id()) {
            return response()->json(['message' => 'Please log in to leave a review.'], 401);
        }

        $validator = Validator::make($request->all(), [
            'property_id' => 'required|exists:bnb_properties,id',
            'booking_id' => 'required|exists:bnb_bookings,id',
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'required|string|min:10|max:1000',
            'private_feedback' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $booking = BnbBooking::where('id', $request->booking_id)
            ->where('guest_id', Auth::id())
            ->where('status', 'completed')
            ->whereDate('check_out', '<=', now()->toDateString())
            ->first();

        if (! $booking) {
            return response()->json([
                'message' => 'You can only review properties after a completed stay linked to your account.',
            ], 422);
        }

        if ((int) $booking->property_id !== (int) $request->property_id) {
            return response()->json(['message' => 'Booking does not match this property.'], 422);
        }

        $existingReview = BnbReview::where('booking_id', $request->booking_id)
            ->where('guest_id', Auth::id())
            ->first();

        if ($existingReview) {
            return response()->json([
                'message' => 'You have already reviewed this stay.',
            ], 422);
        }

        $review = BnbReview::create([
            'property_id' => $request->property_id,
            'booking_id' => $request->booking_id,
            'guest_id' => Auth::id(),
            'rating' => $request->rating,
            'comment' => $request->comment,
            'private_feedback' => $request->private_feedback,
            'verified' => true,
        ]);

        return response()->json([
            'message' => 'Review submitted successfully',
            'data' => $review->load(['property', 'guest', 'booking']),
        ], 201);
    }

    public function myReviews(Request $request): JsonResponse
    {
        $reviews = BnbReview::with(['property', 'booking'])
            ->where('guest_id', Auth::id())
            ->orderByDesc('created_at')
            ->paginate($request->per_page ?? 20);

        return response()->json([
            'data' => $reviews->items(),
            'meta' => [
                'current_page' => $reviews->currentPage(),
                'last_page' => $reviews->lastPage(),
                'per_page' => $reviews->perPage(),
                'total' => $reviews->total(),
            ],
        ]);
    }

    /**
     * Display the specified BNB review.
     */
    public function respond(Request $request, BnbReview $review): JsonResponse
    {
        $review->loadMissing('property');
        if ($review->property->owner_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'response' => 'required|string|min:10|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $review->response = $request->response;
        $review->response_date = now();
        $review->save();

        return response()->json([
            'message' => 'Response added successfully',
            'data' => $review->load(['property', 'guest']),
        ]);
    }

    public function markHelpful(BnbReview $review): JsonResponse
    {
        $review->increment('helpful_count');

        return response()->json([
            'message' => 'Review marked as helpful',
            'data' => $review->fresh(),
        ]);
    }

    public function show(BnbReview $review): JsonResponse
    {
        $user = Auth::user();
        $isGuest = (int) $review->guest_id === (int) $user->id;
        $isOwner = (int) ($review->property?->owner_id) === (int) $user->id;

        if (! $isGuest && ! $isOwner) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json([
            'data' => $review->load(['property', 'guest', 'booking']),
        ]);
    }

    /**
     * Get reviews for a specific property.
     */
    public function propertyReviews(Request $request, $propertyId): JsonResponse
    {
        $query = BnbReview::with(['guest'])
            ->where('property_id', $propertyId)
            ->whereNotNull('comment')
            ->orderBy('created_at', 'desc');

        if ($request->rating && $request->rating !== 'all') {
            $query->where('rating', $request->rating);
        }

        if ($request->verified) {
            $query->where('verified', true);
        }

        $reviews = $query->paginate($request->per_page ?? 10);

        return response()->json([
            'data' => $reviews->items(),
            'meta' => [
                'current_page' => $reviews->currentPage(),
                'last_page' => $reviews->lastPage(),
                'per_page' => $reviews->perPage(),
                'total' => $reviews->total(),
            ],
            'stats' => [
                'average_rating' => BnbReview::getAverageRatingForProperty($propertyId),
                'total_reviews' => BnbReview::getReviewCountForProperty($propertyId),
                'rating_distribution' => BnbReview::getRatingDistributionForProperty($propertyId),
            ],
        ]);
    }

    /**
     * Get review analytics for the authenticated user.
     */
    public function analytics(): JsonResponse
    {
        $reviews = BnbReview::where('guest_id', Auth::id())->get();

        return response()->json([
            'data' => [
                'total_reviews' => $reviews->count(),
                'average_rating' => $reviews->avg('rating') ?? 0,
                'verified_reviews' => $reviews->where('verified', true)->count(),
                'recent_reviews' => $reviews->orderBy('created_at', 'desc')->take(5)->get(),
                'rating_distribution' => [
                    1 => $reviews->where('rating', 1)->count(),
                    2 => $reviews->where('rating', 2)->count(),
                    3 => $reviews->where('rating', 3)->count(),
                    4 => $reviews->where('rating', 4)->count(),
                    5 => $reviews->where('rating', 5)->count(),
                ],
            ],
        ]);
    }
}

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
     * Display a listing of the BNB reviews.
     */
    public function index(Request $request): JsonResponse
    {
        $query = BnbReview::with(['property', 'guest', 'booking'])
            ->where('guest_id', Auth::id());

        // Apply filters
        if ($request->property_id) {
            $query->where('property_id', $request->property_id);
        }

        if ($request->rating && $request->rating !== 'all') {
            $query->where('rating', $request->rating);
        }

        if ($request->verified) {
            $query->where('verified', true);
        }

        // Apply sorting
        $sortBy = $request->sort_by ?? 'created_at';
        $sortOrder = $request->sort_order ?? 'desc';
        $query->orderBy($sortBy, $sortOrder);

        $reviews = $query->paginate($request->per_page ?? 10);

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
     * Store a newly created BNB review.
     */
    public function store(Request $request): JsonResponse
    {
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

        // Verify that the user actually stayed at the property
        $booking = BnbBooking::where('id', $request->booking_id)
            ->where('guest_id', Auth::id())
            ->where('status', 'completed')
            ->where('check_out', '<', now())
            ->first();

        if (!$booking) {
            return response()->json([
                'message' => 'You can only review properties you have actually stayed at',
            ], 422);
        }

        // Check if review already exists
        $existingReview = BnbReview::where('booking_id', $request->booking_id)
            ->where('guest_id', Auth::id())
            ->first();

        if ($existingReview) {
            return response()->json([
                'message' => 'You have already reviewed this property',
            ], 422);
        }

        $review = new BnbReview([
            'property_id' => $request->property_id,
            'booking_id' => $request->booking_id,
            'guest_id' => Auth::id(),
            'rating' => $request->rating,
            'comment' => $request->comment,
            'private_feedback' => $request->private_feedback,
            'verified' => true, // Auto-verify for completed bookings
        ]);

        $review->save();

        return response()->json([
            'message' => 'Review submitted successfully',
            'data' => $review->load(['property', 'guest', 'booking']),
        ], 201);
    }

    /**
     * Display the specified BNB review.
     */
    public function show(BnbReview $bnbReview): JsonResponse
    {
        if ($bnbReview->guest_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $review = $bnbReview->load(['property', 'guest', 'booking']);

        return response()->json([
            'data' => $review,
        ]);
    }

    /**
     * Respond to a BNB review.
     */
    public function respond(Request $request, BnbReview $bnbReview): JsonResponse
    {
        if ($bnbReview->property->owner_id !== Auth::id()) {
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

        $bnbReview->response = $request->response;
        $bnbReview->response_date = now();
        $bnbReview->save();

        return response()->json([
            'message' => 'Response added successfully',
            'data' => $bnbReview->load(['property', 'guest']),
        ]);
    }

    /**
     * Mark a review as helpful.
     */
    public function markHelpful(BnbReview $bnbReview): JsonResponse
    {
        $bnbReview->increment('helpful_count');

        return response()->json([
            'message' => 'Review marked as helpful',
            'data' => $bnbReview->fresh(),
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

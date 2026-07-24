<?php

namespace App\Http\Controllers\Bnb;

use App\Http\Controllers\Controller;
use App\Models\BnbBooking;
use App\Models\BnbProperty;
use App\Models\Notification;
use App\Models\User;
use App\Services\BnbPaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Validator;
use Laravel\Sanctum\PersonalAccessToken;

class BnbBookingController extends Controller
{
    /**
     * Owner listing of bookings for their BNB properties (also includes guest view if same user).
     */
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();

        $query = BnbBooking::with(['property', 'guest', 'review'])
            ->where(function ($q) use ($user) {
                $q->where('guest_id', $user->id)
                    ->orWhereHas('property', function ($propertyQuery) use ($user) {
                        $propertyQuery->where('owner_id', $user->id);
                    });
            });

        if ($request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->whereHas('property', function ($subQuery) use ($search) {
                    $subQuery->where('title', 'like', "%{$search}%")
                        ->orWhere('location', 'like', "%{$search}%");
                })
                    ->orWhereHas('guest', function ($subQuery) use ($search) {
                        $subQuery->where('first_name', 'like', "%{$search}%")
                            ->orWhere('last_name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    })
                    ->orWhere('notes', 'like', "%{$search}%");
            });
        }

        if ($request->status && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->property_id) {
            $query->where('property_id', $request->property_id);
        }

        $sortBy = $request->sort_by ?? 'created_at';
        $sortOrder = $request->sort_order ?? 'desc';
        $query->orderBy($sortBy, $sortOrder);

        $bookings = $query->paginate($request->per_page ?? 20);

        return response()->json([
            'data' => collect($bookings->items())->map(fn (BnbBooking $b) => $this->formatBooking($b))->values(),
            'meta' => [
                'current_page' => $bookings->currentPage(),
                'last_page' => $bookings->lastPage(),
                'per_page' => $bookings->perPage(),
                'total' => $bookings->total(),
            ],
        ]);
    }

    /**
     * Create a booking (authenticated users only). Payment is required separately.
     */
    public function store(Request $request): JsonResponse
    {
        $user = Auth::user();
        if (! $user) {
            return response()->json([
                'message' => 'Please sign in or create an account to book this stay.',
                'requires_auth' => true,
            ], 401);
        }

        $validator = Validator::make($request->all(), [
            'property_id' => 'required|exists:bnb_properties,id',
            'property_title' => 'nullable|string|max:255',
            'customer_name' => 'nullable|string|max:255',
            'customer_email' => 'nullable|email|max:255',
            'customer_phone' => 'required|string|max:20',
            'check_in' => 'required|date|after_or_equal:today',
            'check_out' => 'required|date|after:check_in',
            'guest_count' => 'nullable|integer|min:1|max:20',
            'guests' => 'nullable|integer|min:1|max:20',
            'special_requests' => 'nullable|string|max:2000',
            'total_amount' => 'nullable|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $property = BnbProperty::findOrFail($request->property_id);

        if (! $property->owner_id) {
            return response()->json([
                'message' => 'This property is not properly configured for bookings',
            ], 422);
        }

        if (($property->status ?? 'available') === 'maintenance') {
            return response()->json([
                'message' => 'This property is temporarily unavailable for bookings.',
            ], 422);
        }

        if ((int) $property->owner_id === (int) $user->id) {
            return response()->json([
                'message' => 'You cannot book your own property.',
            ], 422);
        }

        $guestCount = (int) ($request->guest_count ?? $request->guests ?? 1);
        if ($property->max_guests && $guestCount > (int) $property->max_guests) {
            return response()->json([
                'message' => "This property allows a maximum of {$property->max_guests} guests.",
            ], 422);
        }

        $nights = max(1, (int) round(
            (strtotime($request->check_out) - strtotime($request->check_in)) / 86400
        ));

        if ($property->min_stay && $nights < (int) $property->min_stay) {
            return response()->json([
                'message' => "Minimum stay is {$property->min_stay} night(s).",
            ], 422);
        }

        if (! $property->isAvailableForDates($request->check_in, $request->check_out)) {
            return response()->json([
                'message' => 'Those dates are not available. Please choose different check-in / check-out dates.',
            ], 422);
        }

        $total = $request->filled('total_amount')
            ? (float) $request->total_amount
            : (float) $property->calculateTotalPrice($request->check_in, $request->check_out);

        $guestName = trim((string) ($request->customer_name ?: trim(($user->first_name ?? '') . ' ' . ($user->last_name ?? ''))));
        $guestEmail = strtolower(trim((string) ($request->customer_email ?: $user->email)));
        $guestPhone = trim((string) $request->customer_phone);

        $status = 'pending';

        $notes = sprintf(
            'Booking by: %s (%s, %s)',
            $guestName ?: 'Guest',
            $guestEmail,
            $guestPhone
        );

        $special = $request->special_requests
            ? [$request->special_requests]
            : null;

        $bnbBooking = BnbBooking::create([
            'property_id' => $property->id,
            'guest_id' => $user->id,
            'check_in' => $request->check_in,
            'check_out' => $request->check_out,
            'guests' => $guestCount,
            'total_price' => $total,
            'status' => $status,
            'special_requests' => $special,
            'payment_status' => 'pending',
            'notes' => $notes,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Booking created. Complete payment to confirm your stay.',
            'data' => [
                'booking_id' => $bnbBooking->id,
                'property_id' => $property->id,
                'property_title' => $property->title,
                'check_in' => $request->check_in,
                'check_out' => $request->check_out,
                'guests' => $guestCount,
                'total_amount' => $total,
                'total_price' => $total,
                'status' => $status,
                'payment_status' => 'pending',
                'requires_payment' => true,
            ],
        ], 201);
    }

    public function initiatePayment(Request $request, BnbBooking $booking): JsonResponse
    {
        $user = Auth::user();
        if ((int) $booking->guest_id !== (int) $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'payment_mode' => 'required|in:mobile_money,bank',
            'phone_number' => 'required_if:payment_mode,mobile_money|nullable|string|min:10|max:13',
            'provider' => 'required_if:payment_mode,mobile_money|nullable|string|in:tigo,mpesa,airtel,halopesa,TIGO,MPESA,AIRTEL,HALOPESA,HALOPES',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $service = app(BnbPaymentService::class);

        if ($request->payment_mode === 'bank') {
            $result = $service->initiateBank(
                $user,
                $booking,
                $request->phone_number ?: $user->phone,
            );
        } else {
            $result = $service->initiateMobile(
                $user,
                $booking,
                (string) $request->phone_number,
                (string) $request->provider,
            );
        }

        if (! ($result['success'] ?? false)) {
            return response()->json([
                'success' => false,
                'message' => $result['message'] ?? 'Payment initiation failed',
                'data' => $result['data'] ?? null,
            ], 422);
        }

        return response()->json([
            'success' => true,
            'message' => $result['message'],
            'data' => $result['data'],
        ]);
    }

    public function checkPaymentStatus(string $orderId): JsonResponse
    {
        $result = app(BnbPaymentService::class)->checkStatus($orderId, Auth::user());

        if (! ($result['success'] ?? false)) {
            return response()->json([
                'success' => false,
                'message' => $result['message'] ?? 'Unable to check payment status',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => $result['message'] ?? null,
            'data' => [
                'payment_status' => $result['payment_status'],
                'booking_id' => $result['booking_id'] ?? null,
            ],
        ]);
    }

    /** @deprecated Public booking removed — returns auth required */
    public function storePublic(Request $request): JsonResponse
    {
        return response()->json([
            'message' => 'Please sign in or create an account to book this stay.',
            'requires_auth' => true,
        ], 401);
    }

    /**
     * Authenticated guest: list my BNB stays.
     */
    public function myBookings(Request $request): JsonResponse
    {
        $user = Auth::user();

        $query = BnbBooking::with(['property', 'review'])
            ->where('guest_id', $user->id)
            ->orderByDesc('created_at');

        if ($request->status && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        $bookings = $query->paginate($request->per_page ?? 20);

        return response()->json([
            'data' => collect($bookings->items())->map(fn (BnbBooking $b) => $this->formatBooking($b))->values(),
            'meta' => [
                'current_page' => $bookings->currentPage(),
                'last_page' => $bookings->lastPage(),
                'per_page' => $bookings->perPage(),
                'total' => $bookings->total(),
            ],
        ]);
    }

    public function show(BnbBooking $booking): JsonResponse
    {
        $user = Auth::user();
        $isGuest = (int) $booking->guest_id === (int) $user->id;
        $isOwner = BnbProperty::where('id', $booking->property_id)
            ->where('owner_id', $user->id)
            ->exists();

        if (! $isGuest && ! $isOwner) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json([
            'data' => $this->formatBooking($booking->load(['property', 'guest', 'review'])),
        ]);
    }

    public function updateStatus(Request $request, BnbBooking $booking): JsonResponse
    {
        $user = Auth::user();
        $isGuest = (int) $booking->guest_id === (int) $user->id;
        $isOwner = BnbProperty::where('id', $booking->property_id)
            ->where('owner_id', $user->id)
            ->exists();

        if (! $isGuest && ! $isOwner) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'status' => 'required|in:pending,confirmed,cancelled,completed',
            'cancellation_reason' => 'nullable|string|max:500',
        ]);

        $newStatus = $request->status;

        // Guests may only cancel their own upcoming bookings.
        if ($isGuest && ! $isOwner) {
            if ($newStatus !== 'cancelled') {
                return response()->json(['message' => 'Guests can only cancel bookings.'], 403);
            }
            if (! $booking->canBeCancelled()) {
                return response()->json(['message' => 'This booking can no longer be cancelled.'], 422);
            }
        }

        $booking->status = $newStatus;

        if ($newStatus === 'cancelled') {
            $booking->cancellation_reason = $request->cancellation_reason;
            $booking->payment_status = 'refunded';
        }

        $booking->save();

        $booking->load(['property', 'guest']);

        if ($isOwner && $booking->guest_id) {
            $title = match ($newStatus) {
                'confirmed' => 'Stay confirmed',
                'cancelled' => 'Stay cancelled',
                'completed' => 'Stay completed — leave a review',
                default => 'Booking updated',
            };
            $this->notifyGuest(
                $booking->guest_id,
                $title,
                "Your booking for " . ($booking->property->title ?? 'a stay') . " is now {$newStatus}.",
                'bnb_booking_' . $newStatus
            );
        }

        if ($isGuest && $newStatus === 'cancelled' && $booking->property?->owner_id) {
            $this->notifyGuest(
                $booking->property->owner_id,
                'Guest cancelled a booking',
                ($booking->guest?->email ?? 'A guest') . ' cancelled booking #' . $booking->id,
                'bnb_booking_cancelled'
            );
        }

        return response()->json([
            'message' => 'Booking status updated successfully',
            'data' => $this->formatBooking($booking),
        ]);
    }

    public function cancelMine(Request $request, BnbBooking $booking): JsonResponse
    {
        $request->merge(['status' => 'cancelled']);

        return $this->updateStatus($request, $booking);
    }

    private function resolveGuestUser(Request $request): ?User
    {
        $user = Auth::user() ?? $request->user('sanctum');
        if ($user) {
            return $user;
        }

        $token = $request->bearerToken();
        if (! $token) {
            return null;
        }

        try {
            $accessToken = PersonalAccessToken::findToken($token);

            return $accessToken?->tokenable instanceof User ? $accessToken->tokenable : null;
        } catch (\Throwable $e) {
            Log::warning('Failed to resolve sanctum user for BNB booking', ['error' => $e->getMessage()]);

            return null;
        }
    }

    private function notifyOwnerOfBooking(BnbProperty $property, BnbBooking $booking, string $guestName): void
    {
        if (! Schema::hasTable('notifications') || ! $property->owner_id) {
            return;
        }

        try {
            Notification::create([
                'user_id' => $property->owner_id,
                'title' => 'New BNB booking request',
                'message' => "{$guestName} requested {$property->title} ({$booking->check_in->format('d M')} – {$booking->check_out->format('d M')}).",
                'type' => 'bnb_booking_request',
            ]);
        } catch (\Throwable $e) {
            Log::warning('Failed to notify BNB owner of booking', ['error' => $e->getMessage()]);
        }
    }

    private function notifyGuest(int $userId, string $title, string $message, string $type): void
    {
        if (! Schema::hasTable('notifications')) {
            return;
        }

        try {
            Notification::create([
                'user_id' => $userId,
                'title' => $title,
                'message' => $message,
                'type' => $type,
            ]);
        } catch (\Throwable $e) {
            Log::warning('Failed to create BNB notification', ['error' => $e->getMessage()]);
        }
    }

    private function formatBooking(BnbBooking $booking): array
    {
        $guest = $booking->guest;
        $guestName = $guest
            ? (trim(($guest->first_name ?? '') . ' ' . ($guest->last_name ?? '')) ?: $guest->email)
            : $this->parseGuestNameFromNotes($booking->notes);

        return [
            'id' => $booking->id,
            'property_id' => $booking->property_id,
            'guest_id' => $booking->guest_id,
            'check_in' => optional($booking->check_in)?->toDateString(),
            'check_out' => optional($booking->check_out)?->toDateString(),
            'guests' => $booking->guests,
            'total_price' => (float) $booking->total_price,
            'status' => $booking->status,
            'payment_status' => $booking->payment_status,
            'payment_method' => $booking->payment_method,
            'transaction_id' => $booking->transaction_id,
            'special_requests' => $booking->special_requests,
            'notes' => $booking->notes,
            'cancellation_reason' => $booking->cancellation_reason,
            'can_cancel' => $booking->canBeCancelled(),
            'can_review' => $booking->canBeReviewed(),
            'created_at' => optional($booking->created_at)?->toIso8601String(),
            'property' => $booking->property ? [
                'id' => $booking->property->id,
                'title' => $booking->property->title,
                'location' => $booking->property->location,
                'price' => (float) $booking->property->price,
                'images' => $booking->property->images ?? [],
                'main_image' => $booking->property->main_image ?? null,
            ] : null,
            'guest' => [
                'id' => $guest?->id,
                'name' => $guestName,
                'email' => $guest?->email,
                'phone' => $guest?->phone,
            ],
            'guest_name' => $guestName,
            'review' => $booking->relationLoaded('review') && $booking->review ? [
                'id' => $booking->review->id,
                'rating' => $booking->review->rating,
                'comment' => $booking->review->comment,
            ] : null,
        ];
    }

    private function parseGuestNameFromNotes(?string $notes): string
    {
        if (! $notes) {
            return 'Guest';
        }
        if (preg_match('/Booking by:\s*([^(]+)/i', $notes, $m)) {
            return trim($m[1]);
        }

        return 'Guest';
    }
}

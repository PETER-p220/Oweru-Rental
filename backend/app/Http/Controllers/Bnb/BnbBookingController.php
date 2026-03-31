<?php

namespace App\Http\Controllers\Bnb;

use App\Http\Controllers\Controller;
use App\Models\BnbBooking;
use App\Models\BnbProperty;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class BnbBookingController extends Controller
{
    /**
     * Display a listing of the BNB bookings.
     */
    public function index(Request $request): JsonResponse
    {
        $query = BnbBooking::with(['property', 'guest'])
            ->where('guest_id', Auth::id());

        // Apply filters
        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->whereHas('property', function ($subQuery) use ($request) {
                    $subQuery->where('title', 'like', "%{$request->search}%")
                          ->orWhere('location', 'like', "%{$request->search}%");
                })
                ->orWhereHas('guest', function ($subQuery) use ($request) {
                    $subQuery->where('name', 'like', "%{$request->search}%")
                          ->orWhere('email', 'like', "%{$request->search}%");
                });
            });
        }

        if ($request->status && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->property_id) {
            $query->where('property_id', $request->property_id);
        }

        if ($request->start_date && $request->end_date) {
            $query->whereBetween('check_in', [$request->start_date, $request->end_date])
                  ->orWhereBetween('check_out', [$request->start_date, $request->end_date]);
        }

        // Apply sorting
        $sortBy = $request->sort_by ?? 'created_at';
        $sortOrder = $request->sort_order ?? 'desc';
        $query->orderBy($sortBy, $sortOrder);

        $bookings = $query->paginate($request->per_page ?? 10);

        return response()->json([
            'data' => $bookings->items(),
            'meta' => [
                'current_page' => $bookings->currentPage(),
                'last_page' => $bookings->lastPage(),
                'per_page' => $bookings->perPage(),
                'total' => $bookings->total(),
            ],
        ]);
    }

    /**
     * Store a newly created BNB booking.
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'property_id' => 'required|exists:bnb_properties,id',
            'check_in' => 'required|date|after:today',
            'check_out' => 'required|date|after:check_in',
            'guests' => 'required|integer|min:1|max:20',
            'special_requests' => 'array',
            'special_requests.*' => 'string',
            'payment_method' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $property = BnbProperty::findOrFail($request->property_id);

        // Check if property is available for the requested dates
        if (!$property->isAvailableForDates($request->check_in, $request->check_out)) {
            return response()->json([
                'message' => 'Property is not available for the selected dates',
            ], 422);
        }

        // Check if max guests is not exceeded
        if ($request->guests > $property->max_guests) {
            return response()->json([
                'message' => 'Number of guests exceeds maximum capacity',
            ], 422);
        }

        // Calculate total price
        $totalPrice = $property->calculateTotalPrice($request->check_in, $request->check_out);

        $booking = new BnbBooking([
            'property_id' => $property->id,
            'guest_id' => Auth::id(),
            'check_in' => $request->check_in,
            'check_out' => $request->check_out,
            'guests' => $request->guests,
            'total_price' => $totalPrice,
            'status' => 'pending',
            'special_requests' => $request->special_requests ?? [],
            'payment_status' => 'pending',
            'payment_method' => $request->payment_method,
        ]);

        $booking->save();

        return response()->json([
            'message' => 'Booking created successfully',
            'data' => $booking->load(['property', 'guest']),
        ], 201);
    }

    /**
     * Display the specified BNB booking.
     */
    public function show(BnbBooking $bnbBooking): JsonResponse
    {
        if ($bnbBooking->guest_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $booking = $bnbBooking->load(['property', 'guest', 'review']);

        return response()->json([
            'data' => $booking,
        ]);
    }

    /**
     * Update the specified BNB booking status.
     */
    public function updateStatus(Request $request, BnbBooking $bnbBooking): JsonResponse
    {
        if ($bnbBooking->guest_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'status' => 'required|in:pending,confirmed,cancelled,completed',
            'cancellation_reason' => 'required_if:status,cancelled|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $bnbBooking->status = $request->status;

        if ($request->status === 'cancelled') {
            $bnbBooking->cancellation_reason = $request->cancellation_reason;
            
            // Calculate refund amount
            $refundAmount = $bnbBooking->calculateRefundAmount();
            
            // Process refund logic here (integrate with payment gateway)
            // This would typically involve calling a payment gateway API
            
            $bnbBooking->payment_status = 'refunded';
        }

        $bnbBooking->save();

        return response()->json([
            'message' => 'Booking status updated successfully',
            'data' => $bnbBooking->load(['property', 'guest']),
        ]);
    }
}

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
        // For public bookings, allow different fields
        $validator = Validator::make($request->all(), [
            'property_id' => 'required|exists:properties,id',
            'property_title' => 'required|string',
            'customer_name' => 'required|string|max:255',
            'customer_email' => 'required|email|max:255',
            'customer_phone' => 'required|string|max:20',
            'check_in' => 'required|date|after_or_equal:today',
            'check_out' => 'required|date|after:check_in',
            'guest_count' => 'required|integer|min:1|max:20',
            'special_requests' => 'nullable|string',
            'total_amount' => 'required|numeric|min:0',
            'status' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        // Use regular Property model since we're booking regular properties as BnB
        $property = \App\Models\Property::findOrFail($request->property_id);

        // Create booking record (using a simple table or leads table)
        // For now, we'll create it as a lead with booking information
        $bookingData = [
            'property_id' => $property->id,
            'agent_id' => $property->agent_id ?? $property->owner_id ?? null, // Use agent_id or owner_id from property
            'name' => $request->customer_name,
            'email' => $request->customer_email,
            'phone' => $request->customer_phone,
            'message' => "BnB Booking Request:\n" .
                       "Property: {$request->property_title}\n" .
                       "Check-in: {$request->check_in}\n" .
                       "Check-out: {$request->check_out}\n" .
                       "Guests: {$request->guest_count}\n" .
                       "Total Amount: TZS " . number_format($request->total_amount) . "\n" .
                       "Special Requests: " . ($request->special_requests ?: 'None'),
            'type' => 'bnb_booking',
            'status' => 'pending',
        ];

        // Create as a lead (or you could create a dedicated booking table)
        $lead = \App\Models\Lead::create($bookingData);

        return response()->json([
            'success' => true,
            'message' => 'Booking request submitted successfully! The property owner will contact you soon.',
            'data' => [
                'booking_id' => $lead->id,
                'property_title' => $request->property_title,
                'check_in' => $request->check_in,
                'check_out' => $request->check_out,
                'total_amount' => $request->total_amount,
                'status' => 'pending',
            ],
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

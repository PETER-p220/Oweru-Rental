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
        $user = Auth::user();
        
        // Debug: Log user info
        \Log::info('BnbBookingController::index - User info:', [
            'user_id' => $user->id,
            'user_type' => $user->user_type,
            'user_exists' => $user ? true : false,
            'all_attributes' => $user->toArray()
        ]);
        
        // Get bookings where user is either the guest or the owner of the property
        $query = BnbBooking::with(['property', 'guest'])
            ->where(function ($q) use ($user) {
                // Bookings where user is the guest
                $q->where('guest_id', $user->id)
                // OR bookings where user owns the property
                ->orWhereHas('property', function ($propertyQuery) use ($user) {
                    $propertyQuery->where('owner_id', $user->id);
                });
            });

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
            'property_id' => 'required|exists:bnb_properties,id',
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

        // Use BnbProperty model for BnB bookings
        $property = \App\Models\BnbProperty::findOrFail($request->property_id);

        // Check if property has an owner
        if (!$property->owner_id) {
            \Log::error('BnbBookingController::store - Property has no owner_id', [
                'property_id' => $property->id,
                'property_title' => $property->title
            ]);
            return response()->json([
                'message' => 'This property is not properly configured for bookings',
            ], 422);
        }

        // Create actual BnbBooking record for owner to see in their BnB bookings
        \Log::info('BnbBookingController::store - Creating BnbBooking:', [
            'property_id' => $property->id,
            'property_owner_id' => $property->owner_id,
            'request_data' => $request->all()
        ]);
        
        $bnbBooking = \App\Models\BnbBooking::create([
            'property_id' => $property->id,
            'guest_id' => null, // No authenticated user for public bookings
            'check_in' => $request->check_in,
            'check_out' => $request->check_out,
            'guests' => $request->guest_count,
            'total_price' => $request->total_amount,
            'status' => 'pending', // Pending owner confirmation
            'special_requests' => $request->special_requests ? [$request->special_requests] : null,
            'payment_status' => 'pending',
            'notes' => "Public booking by: {$request->customer_name} ({$request->customer_email}, {$request->customer_phone})",
        ]);
        
        \Log::info('BnbBookingController::store - BnbBooking created:', [
            'booking_id' => $bnbBooking->id,
            'property_id' => $bnbBooking->property_id,
            'status' => $bnbBooking->status
        ]);

        // Also create a lead for the agent/owner to follow up
        $leadData = [
            'property_id' => $property->id,
            'agent_id' => $property->agent_id ?? $property->owner_id ?? null,
            'name' => $request->customer_name,
            'email' => $request->customer_email,
            'phone' => $request->customer_phone,
            'message' => "BnB Booking Request:\n" .
                       "Property: {$request->property_title}\n" .
                       "Check-in: {$request->check_in}\n" .
                       "Check-out: {$request->check_out}\n" .
                       "Guests: {$request->guest_count}\n" .
                       "Total Amount: TZS " . number_format($request->total_amount) . "\n" .
                       "Special Requests: " . ($request->special_requests ?: 'None') .
                       "\n\nBooking ID: #{$bnbBooking->id}",
            'type' => 'bnb_booking',
            'status' => 'pending',
        ];

        // Create lead for follow-up
        $lead = \App\Models\Lead::create($leadData);

        return response()->json([
            'success' => true,
            'message' => 'Booking request submitted successfully! The property owner will contact you soon.',
            'data' => [
                'booking_id' => $bnbBooking->id,
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
    $user = Auth::user();
    
    // Debug: Log authorization check
    \Log::info('BnbBookingController::updateStatus - Authorization check:', [
        'booking_id' => $bnbBooking->id,
        'property_id' => $bnbBooking->property_id,
        'user_id' => $user->id,
        'user_type' => $user->user_type,
        'booking_guest_id' => $bnbBooking->guest_id,
        'is_guest' => $bnbBooking->guest_id === $user->id,
    ]);
    
    // Allow: the guest, OR the property owner
    $isGuest = $bnbBooking->guest_id === $user->id;
    $isOwner = \App\Models\BnbProperty::where('id', $bnbBooking->property_id)
                 ->where('owner_id', $user->id)
                 ->exists();

    \Log::info('BnbBookingController::updateStatus - Owner check:', [
        'is_owner' => $isOwner,
        'bnb_property_exists' => \App\Models\BnbProperty::where('id', $bnbBooking->property_id)->exists(),
        'bnb_property_owner' => \App\Models\BnbProperty::where('id', $bnbBooking->property_id)->value('owner_id'),
    ]);

    if (!$isGuest && !$isOwner) {
        return response()->json(['message' => 'Unauthorized'], 403);
    }

    // Validate status
    $request->validate([
        'status' => 'required|in:pending,confirmed,cancelled,completed'
    ]);

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

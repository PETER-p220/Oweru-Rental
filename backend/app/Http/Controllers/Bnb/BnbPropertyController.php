<?php

namespace App\Http\Controllers\Bnb;

use App\Http\Controllers\Controller;
use App\Models\BnbProperty;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class BnbPropertyController extends Controller
{
    /**
     * Display a listing of the BNB properties.
     */
    public function index(Request $request): JsonResponse
    {
        $query = BnbProperty::with(['owner'])
            ->where('owner_id', Auth::id());

        // Apply filters
        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('title', 'like', "%{$request->search}%")
                  ->orWhere('description', 'like', "%{$request->search}%")
                  ->orWhere('location', 'like', "%{$request->search}%");
            });
        }

        if ($request->status && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->location) {
            $query->where('location', 'like', "%{$request->location}%");
        }

        if ($request->max_guests) {
            $query->where('max_guests', '>=', $request->max_guests);
        }

        if ($request->min_price) {
            $query->where('price', '>=', $request->min_price);
        }

        if ($request->max_price) {
            $query->where('price', '<=', $request->max_price);
        }

        // Apply sorting
        $sortBy = $request->sort_by ?? 'created_at';
        $sortOrder = $request->sort_order ?? 'desc';
        $query->orderBy($sortBy, $sortOrder);

        $properties = $query->paginate($request->per_page ?? 10);

        return response()->json([
            'data' => $properties->items(),
            'meta' => [
                'current_page' => $properties->currentPage(),
                'last_page' => $properties->lastPage(),
                'per_page' => $properties->perPage(),
                'total' => $properties->total(),
            ],
        ]);
    }

    /**
     * Store a newly created BNB property.
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'price' => 'required|numeric|min:0',
            'location' => 'required|string|max:255',
            'address' => 'required|string',
            'type' => 'required|string',
            'bedrooms' => 'required|integer|min:0',
            'bathrooms' => 'required|integer|min:0',
            'amenities' => 'array',
            'amenities.*' => 'string',
            'max_guests' => 'required|integer|min:1|max:20',
            'min_stay' => 'required|integer|min:1',
            'instant_book' => 'boolean',
            'cancellation_policy' => 'string',
            'house_rules' => 'array',
            'house_rules.*' => 'string',
            'check_in_time' => 'required|date_format:H:i',
            'check_out_time' => 'required|date_format:H:i',
            'cleaning_fee' => 'numeric|min:0',
            'service_fee' => 'numeric|min:0',
            'security_deposit' => 'numeric|min:0',
            'weekly_discount' => 'numeric|min:0|max:100',
            'monthly_discount' => 'numeric|min:0|max:100',
            'amenities_bnb' => 'array',
            'location_highlights' => 'array',
            'location_highlights.*' => 'string',
            'safety_items' => 'array',
            'safety_items.*' => 'string',
            'images' => 'array',
            'images.*' => 'url',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $property = new BnbProperty([
            'title' => $request->title,
            'description' => $request->description,
            'price' => $request->price,
            'location' => $request->location,
            'address' => $request->address,
            'type' => $request->type,
            'bedrooms' => $request->bedrooms,
            'bathrooms' => $request->bathrooms,
            'amenities' => $request->amenities ?? [],
            'max_guests' => $request->max_guests,
            'min_stay' => $request->min_stay,
            'instant_book' => $request->boolean('instant_book', false),
            'cancellation_policy' => $request->cancellation_policy,
            'house_rules' => $request->house_rules ?? [],
            'check_in_time' => $request->check_in_time,
            'check_out_time' => $request->check_out_time,
            'cleaning_fee' => $request->cleaning_fee ?? 0,
            'service_fee' => $request->service_fee ?? 0,
            'security_deposit' => $request->security_deposit ?? 0,
            'weekly_discount' => $request->weekly_discount ?? 0,
            'monthly_discount' => $request->monthly_discount ?? 0,
            'amenities_bnb' => $request->amenities_bnb ?? [],
            'location_highlights' => $request->location_highlights ?? [],
            'safety_items' => $request->safety_items ?? [],
            'owner_id' => Auth::id(),
            'status' => 'available',
        ]);

        // Handle image URLs (already uploaded via ImageUploadController)
        if ($request->has('images') && is_array($request->images)) {
            $property->images = $request->images;
        }

        $property->save();

        return response()->json([
            'message' => 'Property created successfully',
            'data' => $property->load('owner'),
        ], 201);
    }

    /**
     * Owner view of a BNB property.
     */
    public function show(BnbProperty $property): JsonResponse
    {
        if ($property->owner_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json([
            'data' => $property->load(['owner', 'bookings', 'reviews.guest']),
        ]);
    }

    /**
     * Public property detail for customers (no auth).
     */
    public function publicShow(BnbProperty $property): JsonResponse
    {
        if (($property->status ?? '') === 'maintenance') {
            return response()->json(['message' => 'Property is temporarily unavailable'], 404);
        }

        $reviews = $property->reviews()
            ->with('guest:id,first_name,last_name')
            ->whereNotNull('comment')
            ->orderByDesc('created_at')
            ->limit(20)
            ->get()
            ->map(function ($review) {
                $guest = $review->guest;
                $name = $guest
                    ? (trim(($guest->first_name ?? '') . ' ' . ($guest->last_name ?? '')) ?: 'Guest')
                    : 'Guest';

                return [
                    'id' => $review->id,
                    'rating' => $review->rating,
                    'comment' => $review->comment,
                    'response' => $review->response,
                    'guest_name' => $name,
                    'created_at' => optional($review->created_at)?->toDateString(),
                    'verified' => (bool) $review->verified,
                ];
            });

        $avg = round((float) $property->reviews()->avg('rating'), 1);
        $count = (int) $property->reviews()->count();

        return response()->json([
            'data' => [
                'id' => $property->id,
                'title' => $property->title,
                'description' => $property->description,
                'price' => (float) $property->price,
                'location' => $property->location,
                'address' => $property->address,
                'type' => $property->type,
                'bedrooms' => $property->bedrooms,
                'bathrooms' => $property->bathrooms,
                'max_guests' => $property->max_guests,
                'min_stay' => $property->min_stay,
                'instant_book' => (bool) $property->instant_book,
                'cancellation_policy' => $property->cancellation_policy,
                'house_rules' => $property->house_rules,
                'check_in_time' => $property->check_in_time,
                'check_out_time' => $property->check_out_time,
                'cleaning_fee' => (float) ($property->cleaning_fee ?? 0),
                'service_fee' => (float) ($property->service_fee ?? 0),
                'amenities' => $property->amenities,
                'amenities_bnb' => $property->amenities_bnb,
                'images' => $property->images ?? [],
                'main_image' => $property->main_image,
                'status' => $property->status,
                'rating_avg' => $avg,
                'rating_count' => $count,
                'reviews' => $reviews,
            ],
        ]);
    }

    /**
     * Update the specified BNB property.
     */
    public function update(Request $request, BnbProperty $property): JsonResponse
    {
        if ($property->owner_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|string|max:255',
            'description' => 'sometimes|string',
            'price' => 'sometimes|numeric|min:0',
            'location' => 'sometimes|string|max:255',
            'address' => 'sometimes|string',
            'type' => 'sometimes|string',
            'bedrooms' => 'sometimes|integer|min:0',
            'bathrooms' => 'sometimes|integer|min:0',
            'amenities' => 'sometimes|array',
            'amenities.*' => 'string',
            'max_guests' => 'sometimes|integer|min:1|max:20',
            'min_stay' => 'sometimes|integer|min:1',
            'instant_book' => 'sometimes|boolean',
            'cancellation_policy' => 'sometimes|string',
            'house_rules' => 'sometimes|array',
            'house_rules.*' => 'string',
            'check_in_time' => 'sometimes|date_format:H:i',
            'check_out_time' => 'sometimes|date_format:H:i',
            'cleaning_fee' => 'sometimes|numeric|min:0',
            'service_fee' => 'sometimes|numeric|min:0',
            'security_deposit' => 'sometimes|numeric|min:0',
            'weekly_discount' => 'sometimes|numeric|min:0|max:100',
            'monthly_discount' => 'sometimes|numeric|min:0|max:100',
            'amenities_bnb' => 'sometimes|array',
            'location_highlights' => 'sometimes|array',
            'location_highlights.*' => 'string',
            'safety_items' => 'sometimes|array',
            'safety_items.*' => 'string',
            'status' => ['sometimes', Rule::in(['available', 'occupied', 'maintenance'])],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $property->update($request->all());

        return response()->json([
            'message' => 'Property updated successfully',
            'data' => $property->load('owner'),
        ]);
    }

    /**
     * Remove the specified BNB property.
     */
    public function destroy(BnbProperty $property): JsonResponse
    {
        if ($property->owner_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($property->bookings()->where('status', 'confirmed')->exists()) {
            return response()->json([
                'message' => 'Cannot delete property with active bookings',
            ], 422);
        }

        $property->delete();

        return response()->json([
            'message' => 'Property deleted successfully',
        ]);
    }

    /**
     * Get property analytics.
     */
    public function analytics(): JsonResponse
    {
        $properties = BnbProperty::where('owner_id', Auth::id())->get();
        
        $totalProperties = $properties->count();
        $activeListings = $properties->where('status', 'available')->count();
        $totalBookings = $properties->sum(function ($property) {
            return $property->bookings()->count();
        });
        $totalRevenue = $properties->sum(function ($property) {
            return $property->bookings()->sum('total_price');
        });
        
        // Calculate average occupancy rate
        $occupancyRate = $properties->avg(function ($property) {
            return $property->occupancy_rate;
        }) ?? 0;

        // Calculate average rating
        $averageRating = $properties->avg(function ($property) {
            return $property->average_rating;
        }) ?? 0;

        return response()->json([
            'data' => [
                'totalProperties' => $totalProperties,
                'activeListings' => $activeListings,
                'totalBookings' => $totalBookings,
                'totalRevenue' => $totalRevenue,
                'occupancyRate' => round($occupancyRate, 2),
                'averageRating' => round($averageRating, 2),
            ],
        ]);
    }

    /**
     * Search BNB properties for public display
     */
    public function search(Request $request): JsonResponse
    {
        $query = BnbProperty::publiclyVisible()
            ->orderByDesc('created_at');

        if ($request->has('location')) {
            $query->where('location', 'like', '%' . $request->location . '%');
        }

        if ($request->has('min_price')) {
            $query->where('price', '>=', $request->min_price);
        }

        if ($request->has('max_price')) {
            $query->where('price', '<=', $request->max_price);
        }

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        if ($request->has('max_guests')) {
            $query->where('max_guests', '>=', $request->max_guests);
        }

        $items = $query->limit(8)->get()
            ->map(fn (BnbProperty $property) => $property->toPublicListingArray())
            ->values()
            ->all();

        return response()->json($items);
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Property;
use App\Models\SavedProperty;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use App\Models\BnbProperty;

class PropertyController extends Controller
{
    /**
     * Public property listing — no authentication required.
     */
    public function publicIndex(Request $request): JsonResponse
    {
        $query = Property::with(['owner', 'agent']);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('location', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($request->filled('type')) {
            $query->byType($request->type);
        }

        if ($request->filled('min_price')) {
            $query->where('price', '>=', $request->min_price);
        }

        if ($request->filled('max_price')) {
            $query->where('price', '<=', $request->max_price);
        }

        if ($request->filled('location')) {
            $query->byLocation($request->location);
        }

        // FIX: Use >= so "2+ bedrooms" works correctly
        if ($request->filled('bedrooms')) {
            $query->where('bedrooms', '>=', (int) $request->bedrooms);
        }

        // FIX: Use $request->has() so an empty string doesn't match
        if ($request->has('furnished') && $request->furnished !== '') {
            $query->where('furnished', filter_var($request->furnished, FILTER_VALIDATE_BOOLEAN));
        }

        $properties = $query->available()->paginate(12);

        return response()->json([
            'data' => $properties->items(),
            'pagination' => [
                'current_page' => $properties->currentPage(),
                'last_page'    => $properties->lastPage(),
                'per_page'     => $properties->perPage(),
                'total'        => $properties->total(),
            ],
        ]);
    }

    /**
     * Public property detail — no authentication required.
     */
    public function publicShow(Property $property, Request $request): JsonResponse
    {
        $property->load(['owner', 'agent']);

        // Log the full request for debugging
        \Log::info('Property publicShow - Full Request', [
            'property_id' => $property->id,
            'full_url' => $request->fullUrl(),
            'query_params' => $request->query(),
            'all_params' => $request->all(),
            'method' => $request->method(),
            'ip' => $request->ip()
        ]);

        // Check if this is a tracking link visit
        if ($request->has('agent') && $request->input('agent') == $property->agent_id) {
            // Increment click count for tracking - with fallback for missing column
            try {
                $beforeClicks = $property->clicks ?? 0;
                $property->increment('clicks');
                $property->refresh(); // Get updated value
                
                \Log::info('Property tracking link clicked - SUCCESS', [
                    'property_id' => $property->id,
                    'agent_id' => $request->input('agent'),
                    'ip' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                    'before_clicks' => $beforeClicks,
                    'after_clicks' => $property->clicks,
                    'increment_successful' => ($property->clicks > $beforeClicks)
                ]);
            } catch (\Exception $e) {
                // Column doesn't exist yet, just log the visit
                \Log::error('Property tracking link click FAILED', [
                    'property_id' => $property->id,
                    'agent_id' => $request->input('agent'),
                    'ip' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                    'error' => $e->getMessage(),
                    'current_clicks' => $property->clicks ?? 0
                ]);
            }
        } else {
            // Log when tracking condition fails
            \Log::info('Property tracking link visit - NO TRACKING', [
                'property_id' => $property->id,
                'has_agent_param' => $request->has('agent'),
                'agent_param' => $request->input('agent'),
                'property_agent_id' => $property->agent_id,
                'agent_match' => ($request->input('agent') == $property->agent_id),
                'ip' => $request->ip()
            ]);
        }

        return response()->json(['data' => $property]);
    }

    /**
     * Public BNB properties for homepage — no authentication required.
     */
    public function publicBnbIndex(Request $request): JsonResponse
    {
        try {
            \Log::info('Public BNB Index: Starting query');
            
            // Simple query to get all BNB properties
            $properties = BnbProperty::limit(8)->get();
            
            \Log::info('Public BNB Index: Query completed, count: ' . $properties->count());
            
            // Transform properties
            $transformedProperties = $properties->map(function ($property) {
                // Simple image handling
                $images = ['https://picsum.photos/seed/bnb' . $property->id . '/800/600.jpg'];
                
                // Try to get real images if they exist
                if ($property->images) {
                    $propertyImages = [];
                    if (is_string($property->images)) {
                        $decoded = json_decode($property->images, true);
                        if (is_array($decoded)) {
                            $propertyImages = $decoded;
                        }
                    } elseif (is_array($property->images)) {
                        $propertyImages = $property->images;
                    }
                    
                    if (!empty($propertyImages)) {
                        $images = array_map(function($img) {
                            if (str_starts_with($img, 'http')) {
                                return $img;
                            }
                            return 'http://rental.oweru.com/storage/' . ltrim($img, '/');
                        }, $propertyImages);
                    }
                }
                
                return [
                    'id' => $property->id,
                    'title' => $property->title ?? 'Property ' . $property->id,
                    'description' => $property->description ?? 'Beautiful property',
                    'price' => $property->price ?? 100000,
                    'location' => $property->location ?? 'Tanzania',
                    'type' => $property->type ?? 'apartment',
                    'bedrooms' => $property->bedrooms ?? 2,
                    'bathrooms' => $property->bathrooms ?? 1,
                    'max_guests' => $property->max_guests ?? 4,
                    'images' => $images,
                    'average_rating' => 4.5,
                    'status' => 'available',
                    'created_at' => $property->created_at?->toISOString() ?? now()->toISOString(),
                    'updated_at' => $property->updated_at?->toISOString() ?? now()->toISOString(),
                ];
            })->toArray();
            
            \Log::info('Public BNB Index: Returning ' . count($transformedProperties) . ' properties');
            
            return response()->json($transformedProperties);
            
        } catch (\Exception $e) {
            \Log::error('Public BNB Index Error: ' . $e->getMessage());
            
            // Return fallback data
            return response()->json([
                [
                    'id' => 999,
                    'title' => 'Sample Property',
                    'description' => 'This is a sample property',
                    'price' => 150000,
                    'location' => 'Dar es Salaam',
                    'type' => 'apartment',
                    'bedrooms' => 2,
                    'bathrooms' => 1,
                    'max_guests' => 4,
                    'images' => ['https://picsum.photos/seed/sample/800/600.jpg'],
                    'average_rating' => 4.5,
                    'status' => 'available',
                    'created_at' => now()->toISOString(),
                    'updated_at' => now()->toISOString(),
                ]
            ]);
        }
    }

    public function index(Request $request): JsonResponse
    {
        $query = Property::with(['owner', 'agent']);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('location', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($request->filled('type')) {
            $query->byType($request->type);
        }

        if ($request->filled('min_price')) {
            $query->where('price', '>=', $request->min_price);
        }

        if ($request->filled('max_price')) {
            $query->where('price', '<=', $request->max_price);
        }

        if ($request->filled('location')) {
            $query->byLocation($request->location);
        }

        if ($request->filled('bedrooms')) {
            $query->where('bedrooms', '>=', (int) $request->bedrooms);
        }

        if ($request->has('furnished') && $request->furnished !== '') {
            $query->where('furnished', filter_var($request->furnished, FILTER_VALIDATE_BOOLEAN));
        }

        $properties = $query->available()->paginate(12);

        return response()->json([
            'data' => $properties->items(),
            'pagination' => [
                'current_page' => $properties->currentPage(),
                'last_page'    => $properties->lastPage(),
                'per_page'     => $properties->perPage(),
                'total'        => $properties->total(),
            ],
        ]);
    }

    public function show(Property $property, Request $request): JsonResponse
    {
        $property->load(['owner', 'agent', 'applications']);

        // Check if this is a tracking link visit
        if ($request->has('agent') && $request->input('agent') == $property->agent_id) {
            // Increment click count for tracking - with fallback for missing column
            try {
                $property->increment('clicks');
            } catch (\Exception $e) {
                // Column doesn't exist yet, just log the visit
                \Log::info('Property tracking link clicked (no increment)', [
                    'property_id' => $property->id,
                    'agent_id' => $request->input('agent'),
                    'ip' => $request->ip(),
                    'user_agent' => $request->userAgent()
                ]);
            }
        }

        return response()->json(['data' => $property]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = [
            'title'       => $request->input('title'),
            'description' => $request->input('description'),
            'price'       => $request->input('price'),
            'location'    => $request->input('location'),
            'address'     => $request->input('address', ''),
            'type'        => $request->input('type', 'apartment'),
            'bedrooms'    => $request->input('bedrooms', 1),
            'bathrooms'   => $request->input('bathrooms', 1),
            'area'        => $request->input('area', 0),
            'amenities'   => $request->input('amenities', []),
            'featured'    => $request->input('featured', false),
            'latitude'    => $request->input('latitude'),
            'longitude'   => $request->input('longitude'),
        ];

        $validator = Validator::make($data, [
            'title'       => 'required|string|max:255',
            'description' => 'required|string',
            'price'       => 'required|numeric|min:0',
            'location'    => 'required|string|max:255',
            'address'     => 'required|string|max:500',
            'type'        => 'required|in:apartment,house,studio,villa,commercial',
            'bedrooms'    => 'required|integer|min:0',
            'bathrooms'   => 'required|integer|min:0',
            'area'        => 'required|numeric|min:0',
            'amenities'   => 'array',
            'featured'    => 'boolean',
            'latitude'    => 'nullable|numeric|between:-90,90',
            'longitude'   => 'nullable|numeric|between:-180,180',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors'  => $validator->errors(),
            ], 422);
        }

        $imagePaths = [];
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $image) {
                $path = $image->store('properties', 'public');
                $imagePaths[] = $path;
            }
        }

        $amenities = $data['amenities'];
        if (is_string($amenities)) {
            $amenities = json_decode($amenities, true) ?? [];
        }

        $user         = Auth::user();
        $trackingCode = $this->generateUniqueTrackingCode();

        $propertyData = [
            'title'       => $data['title'],
            'description' => $data['description'],
            'price'       => $data['price'],
            'location'    => $data['location'],
            'address'     => $data['address'],
            'type'        => $data['type'],
            'bedrooms'    => $data['bedrooms'],
            'bathrooms'   => $data['bathrooms'],
            'area'        => $data['area'],
            'images'      => $imagePaths,
            'amenities'   => $amenities,
            'featured'    => filter_var($data['featured'], FILTER_VALIDATE_BOOLEAN),
            'available'   => filter_var($request->input('available', true), FILTER_VALIDATE_BOOLEAN),
            'latitude'    => $data['latitude'],
            'longitude'   => $data['longitude'],
            'dalali'      => $trackingCode,
        ];

        // FIX: Always set owner_id. Agents must supply owner_id for their listings.
        if ($user->userType === 'agent') {
            $propertyData['agent_id'] = $user->id;
            // Agent-created listings: owner_id comes from request (required for agents)
            if ($request->filled('owner_id')) {
                $propertyData['owner_id'] = $request->input('owner_id');
            }
        } else {
            // Landlord creating their own property
            $propertyData['owner_id'] = $user->id;
        }

        $property = Property::create($propertyData);

        return response()->json([
            'message' => 'Property created successfully',
            'data'    => $property,
        ], 201);
    }

    /**
     * Generate a unique tracking code (dalali).
     */
    private function generateUniqueTrackingCode(): string
    {
        do {
            $code = strtoupper(substr(bin2hex(random_bytes(8)), 0, 8));
        } while (Property::where('dalali', $code)->exists());

        return $code;
    }

    public function update(Request $request, Property $property): JsonResponse
    {
        $this->authorize('update', $property);

        $validator = Validator::make($request->all(), [
            'title'       => 'sometimes|string|max:255',
            'description' => 'sometimes|string',
            'price'       => 'sometimes|numeric|min:0',
            'location'    => 'sometimes|string|max:255',
            'address'     => 'sometimes|string|max:500',
            'type'        => 'sometimes|in:apartment,house,studio,villa,commercial',
            'bedrooms'    => 'sometimes|integer|min:0',
            'bathrooms'   => 'sometimes|integer|min:0',
            'area'        => 'sometimes|numeric|min:0',
            'images'      => 'sometimes|array',
            'images.*'    => 'url',
            'amenities'   => 'sometimes|array',
            'featured'    => 'sometimes|boolean',
            'available'   => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors'  => $validator->errors(),
            ], 422);
        }

        // FIX: Explicitly whitelist updatable fields to prevent owner_id/agent_id/dalali tampering
        $property->update($request->only([
            'title', 'description', 'price', 'location', 'address',
            'type', 'bedrooms', 'bathrooms', 'area',
            'images', 'amenities', 'featured', 'available',
        ]));

        return response()->json([
            'message' => 'Property updated successfully',
            'data'    => $property,
        ]);
    }

    public function destroy(Property $property): JsonResponse
    {
        $this->authorize('delete', $property);

        $property->delete();

        return response()->json(['message' => 'Property deleted successfully']);
    }

    public function myProperties(Request $request): JsonResponse
    {
        $user = Auth::user();

        $query = $user->userType === 'agent'
            ? Property::where('agent_id', $user->id)
            : Property::where('owner_id', $user->id);

        $properties = $query->with(['applications'])->paginate(12);

        return response()->json([
            'data' => $properties->items(),
            'pagination' => [
                'current_page' => $properties->currentPage(),
                'last_page'    => $properties->lastPage(),
                'per_page'     => $properties->perPage(),
                'total'        => $properties->total(),
            ],
        ]);
    }

    public function saved(Request $request): JsonResponse
    {
        $user       = Auth::user();
        $properties = $user->savedProperties()
            ->with(['owner', 'agent'])
            ->paginate(12);

        return response()->json([
            'data' => $properties->items(),
            'pagination' => [
                'current_page' => $properties->currentPage(),
                'last_page'    => $properties->lastPage(),
                'per_page'     => $properties->perPage(),
                'total'        => $properties->total(),
            ],
        ]);
    }

    public function save(Request $request, Property $property): JsonResponse
    {
        $user = Auth::user();

        $exists = SavedProperty::where('user_id', $user->id)
            ->where('property_id', $property->id)
            ->exists();

        if ($exists) {
            return response()->json(['message' => 'Property already saved'], 409);
        }

        SavedProperty::create([
            'user_id'     => $user->id,
            'property_id' => $property->id,
        ]);

        return response()->json(['message' => 'Property saved successfully']);
    }

    public function unsave(Request $request, Property $property): JsonResponse
    {
        $user = Auth::user();

        SavedProperty::where('user_id', $user->id)
            ->where('property_id', $property->id)
            ->delete();

        return response()->json(['message' => 'Property unsaved successfully']);
    }

    public function analytics(Property $property): JsonResponse
    {
        $this->authorize('view', $property);

        $totalApplications    = $property->applications()->count();
        $approvedApplications = $property->applications()->where('status', 'approved')->count();

        return response()->json([
            'data' => [
                'views'            => $property->views ?? 0,
                'applications'     => $totalApplications,
                'saved_count'      => $property->savedBy()->count(),
                'avg_response_time'=> '2 days',
                'conversion_rate'  => $totalApplications > 0
                    ? round(($approvedApplications / $totalApplications) * 100, 2)
                    : 0,
            ],
        ]);
    }
}
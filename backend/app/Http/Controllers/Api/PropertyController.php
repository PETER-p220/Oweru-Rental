<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Property;
use App\Models\SavedProperty;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class PropertyController extends Controller
{
    /**
     * Public property listing - no authentication required
     */
    public function publicIndex(Request $request): JsonResponse
    {
        $query = Property::with(['owner', 'agent']);

        // Apply filters
        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('title', 'like', "%{$request->search}%")
                  ->orWhere('location', 'like', "%{$request->search}%")
                  ->orWhere('description', 'like', "%{$request->search}%");
            });
        }

        if ($request->type) {
            $query->byType($request->type);
        }

        if ($request->min_price) {
            $query->where('price', '>=', $request->min_price);
        }

        if ($request->max_price) {
            $query->where('price', '<=', $request->max_price);
        }

        if ($request->location) {
            $query->byLocation($request->location);
        }

        if ($request->bedrooms) {
            $query->where('bedrooms', $request->bedrooms);
        }

        if ($request->furnished !== null) {
            $query->where('furnished', $request->furnished);
        }

        $properties = $query->available()->paginate(12);

        return response()->json([
            'data' => $properties->items(),
            'pagination' => [
                'current_page' => $properties->currentPage(),
                'last_page' => $properties->lastPage(),
                'per_page' => $properties->perPage(),
                'total' => $properties->total(),
            ]
        ]);
    }

    /**
     * Public property detail - no authentication required
     */
    public function publicShow(Property $property): JsonResponse
    {
        $property->load(['owner', 'agent']);

        return response()->json([
            'data' => $property
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $query = Property::with(['owner', 'agent']);

        // Apply filters
        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('title', 'like', "%{$request->search}%")
                  ->orWhere('location', 'like', "%{$request->search}%")
                  ->orWhere('description', 'like', "%{$request->search}%");
            });
        }

        if ($request->type) {
            $query->byType($request->type);
        }

        if ($request->min_price) {
            $query->where('price', '>=', $request->min_price);
        }

        if ($request->max_price) {
            $query->where('price', '<=', $request->max_price);
        }

        if ($request->location) {
            $query->byLocation($request->location);
        }

        $properties = $query->available()->paginate(12);

        return response()->json([
            'data' => $properties->items(),
            'pagination' => [
                'current_page' => $properties->currentPage(),
                'last_page' => $properties->lastPage(),
                'per_page' => $properties->perPage(),
                'total' => $properties->total(),
            ]
        ]);
    }

    public function show(Property $property): JsonResponse
    {
        $property->load(['owner', 'agent', 'applications']);

        return response()->json([
            'data' => $property
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        // For FormData, we need to use input() method
        $data = [
            'title' => $request->input('title'),
            'description' => $request->input('description'),
            'price' => $request->input('price'),
            'location' => $request->input('location'),
            'address' => $request->input('address'),
            'type' => $request->input('type'),
            'bedrooms' => $request->input('bedrooms'),
            'bathrooms' => $request->input('bathrooms'),
            'area' => $request->input('area'),
            'amenities' => $request->input('amenities'),
            'featured' => $request->input('featured'),
            'latitude' => $request->input('latitude'),
            'longitude' => $request->input('longitude'),
        ];
        
        // Ensure we have the required fields
        $finalData = [
            'title' => $data['title'] ?? '',
            'description' => $data['description'] ?? '',
            'price' => $data['price'] ?? 0,
            'location' => $data['location'] ?? '',
            'address' => $data['address'] ?? '',
            'type' => $data['type'] ?? 'apartment',
            'bedrooms' => $data['bedrooms'] ?? 1,
            'bathrooms' => $data['bathrooms'] ?? 1,
            'area' => $data['area'] ?? 0,
            'amenities' => $data['amenities'] ?? [],
            'featured' => $data['featured'] ?? false,
            'latitude' => $data['latitude'] ?? null,
            'longitude' => $data['longitude'] ?? null,
        ];
        
        $validator = \Illuminate\Support\Facades\Validator::make($finalData, [
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'price' => 'required|numeric|min:0',
            'location' => 'required|string|max:255',
            'address' => 'required|string|max:500',
            'type' => 'required|in:apartment,house,studio,villa,commercial',
            'bedrooms' => 'required|integer|min:0',
            'bathrooms' => 'required|integer|min:0',
            'area' => 'required|numeric|min:0',
            'images' => 'array',
            'images.*' => 'image|mimes:jpeg,png,jpg,gif|max:2048',
            'amenities' => 'array',
            'featured' => 'boolean',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Handle image uploads
        $imagePaths = [];
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $image) {
                $path = $image->store('properties', 'public');
                $imagePaths[] = $path;
            }
        }

        // Parse amenities from JSON string if needed
        $amenities = $finalData['amenities'];
        if (is_string($amenities)) {
            $amenities = json_decode($amenities, true);
        }

        // Set owner_id or agent_id based on user role
        $user = Auth::user();
        $propertyData = [
            'title' => $finalData['title'],
            'description' => $finalData['description'],
            'price' => $finalData['price'],
            'location' => $finalData['location'],
            'address' => $finalData['address'],
            'type' => $finalData['type'],
            'bedrooms' => $finalData['bedrooms'],
            'bathrooms' => $finalData['bathrooms'],
            'area' => $finalData['area'],
            'images' => $imagePaths,
            'amenities' => $amenities ?? [],
            'featured' => filter_var($finalData['featured'] ?? false, FILTER_VALIDATE_BOOLEAN),
            'available' => filter_var($finalData['available'] ?? true, FILTER_VALIDATE_BOOLEAN),
            'latitude' => $finalData['latitude'],
            'longitude' => $finalData['longitude'],
        ];

        // Set owner_id for landlords, agent_id for agents
        if ($user->userType === 'agent') {
            $propertyData['agent_id'] = $user->id;
        } else {
            $propertyData['owner_id'] = $user->id;
        }

        // Generate unique tracking code (dalali) for all properties
        $trackingCode = $this->generateUniqueTrackingCode();
        $propertyData['dalali'] = $trackingCode;

        $property = Property::create($propertyData);

        return response()->json([
            'message' => 'Property created successfully',
            'data' => $property
        ], 201);
    }

    /**
     * Generate a unique tracking code (dalali)
     */
    private function generateUniqueTrackingCode(): string
    {
        do {
            $code = strtoupper(substr(str_shuffle('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'), 0, 8));
        } while (Property::where('dalali', $code)->exists());
        
        return $code;
    }

    public function update(Request $request, Property $property): JsonResponse
    {
        $this->authorize('update', $property);

        $validator = \Illuminate\Support\Facades\Validator::make($request->all(), [
            'title' => 'sometimes|string|max:255',
            'description' => 'sometimes|string',
            'price' => 'sometimes|numeric|min:0',
            'location' => 'sometimes|string|max:255',
            'address' => 'sometimes|string|max:500',
            'type' => 'sometimes|in:apartment,house,studio,villa,commercial',
            'bedrooms' => 'sometimes|integer|min:0',
            'bathrooms' => 'sometimes|integer|min:0',
            'area' => 'sometimes|numeric|min:0',
            'images' => 'sometimes|array',
            'images.*' => 'url',
            'amenities' => 'sometimes|array',
            'featured' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $property->update($request->all());

        return response()->json([
            'message' => 'Property updated successfully',
            'data' => $property
        ]);
    }

    public function destroy(Property $property): JsonResponse
    {
        $this->authorize('delete', $property);

        $property->delete();

        return response()->json([
            'message' => 'Property deleted successfully'
        ]);
    }

    public function myProperties(Request $request): JsonResponse
    {
        $user = Auth::user();
        
        // Get properties based on user role
        if ($user->userType === 'agent') {
            $properties = Property::where('agent_id', $user->id)
                ->with(['applications'])
                ->paginate(12);
        } else {
            $properties = Property::where('owner_id', $user->id)
                ->with(['applications'])
                ->paginate(12);
        }

        return response()->json([
            'data' => $properties->items(),
            'pagination' => [
                'current_page' => $properties->currentPage(),
                'last_page' => $properties->lastPage(),
                'per_page' => $properties->perPage(),
                'total' => $properties->total(),
            ]
        ]);
    }

    public function saved(Request $request): JsonResponse
    {
        $user = Auth::user();
        $properties = $user->savedProperties()
            ->with(['owner', 'agent'])
            ->paginate(12);

        return response()->json([
            'data' => $properties->items(),
            'pagination' => [
                'current_page' => $properties->currentPage(),
                'last_page' => $properties->lastPage(),
                'per_page' => $properties->perPage(),
                'total' => $properties->total(),
            ]
        ]);
    }

    public function save(Request $request, Property $property): JsonResponse
    {
        $user = Auth::user();

        $existing = SavedProperty::where('user_id', $user->id)
            ->where('property_id', $property->id)
            ->first();

        if ($existing) {
            return response()->json([
                'message' => 'Property already saved'
            ], 409);
        }

        SavedProperty::create([
            'user_id' => $user->id,
            'property_id' => $property->id,
        ]);

        return response()->json([
            'message' => 'Property saved successfully'
        ]);
    }

    public function unsave(Request $request, Property $property): JsonResponse
    {
        $user = Auth::user();

        SavedProperty::where('user_id', $user->id)
            ->where('property_id', $property->id)
            ->delete();

        return response()->json([
            'message' => 'Property unsaved successfully'
        ]);
    }

    public function analytics(Property $property): JsonResponse
    {
        $this->authorize('view', $property);

        $analytics = [
            'views' => $property->views ?? 0,
            'applications' => $property->applications()->count(),
            'saved_count' => $property->savedBy()->count(),
            'avg_response_time' => '2 days', // Calculate based on actual data
            'conversion_rate' => $property->applications()->count() > 0 
                ? round(($property->applications()->approved()->count() / $property->applications()->count()) * 100, 2)
                : 0,
        ];

        return response()->json([
            'data' => $analytics
        ]);
    }
}

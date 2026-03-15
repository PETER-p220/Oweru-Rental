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
        $validator = \Illuminate\Support\Facades\Validator::make($request->all(), [
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
            'images.*' => 'url',
            'amenities' => 'array',
            'featured' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $property = Property::create([
            'title' => $request->title,
            'description' => $request->description,
            'price' => $request->price,
            'location' => $request->location,
            'address' => $request->address,
            'type' => $request->type,
            'bedrooms' => $request->bedrooms,
            'bathrooms' => $request->bathrooms,
            'area' => $request->area,
            'images' => $request->images ?? [],
            'amenities' => $request->amenities ?? [],
            'featured' => $request->featured ?? false,
            'owner_id' => Auth::id(),
        ]);

        return response()->json([
            'message' => 'Property created successfully',
            'data' => $property
        ], 201);
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
        $properties = Property::where('owner_id', $user->id)
            ->with(['applications'])
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

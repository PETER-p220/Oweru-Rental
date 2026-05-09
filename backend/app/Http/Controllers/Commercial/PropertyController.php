<?php

namespace App\Http\Controllers\Commercial;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use App\Models\Property;
use App\Models\PropertyImage;
use App\Models\Amenity;
use Carbon\Carbon;

class PropertyController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
    }

    /**
     * Get user's commercial properties
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        
        $query = Property::where('user_id', $user->id)
            ->where('type', '!=', 'residential')
            ->with(['images', 'amenities']);
        
        // Search
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhere('location', 'like', "%{$search}%");
            });
        }
        
        // Status filter
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }
        
        // Type filter
        if ($request->has('type') && $request->type !== 'all') {
            $query->where('type', $request->type);
        }
        
        // Pagination
        $perPage = $request->get('per_page', 10);
        $properties = $query->latest()->paginate($perPage);
        
        return response()->json([
            'data' => $properties->items(),
            'current_page' => $properties->currentPage(),
            'last_page' => $properties->lastPage(),
            'per_page' => $properties->perPage(),
            'total' => $properties->total(),
        ]);
    }

    /**
     * Store a new property
     */
    public function store(Request $request)
    {
        $user = Auth::user();
        
        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'type' => 'required|in:residential,commercial,office,retail,warehouse,industrial',
            'location' => 'required|string|max:255',
            'address' => 'required|string|max:500',
            'price' => 'required|numeric|min:0',
            'price_type' => 'required|in:monthly,yearly,sale',
            'area' => 'required|numeric|min:0',
            'bedrooms' => 'nullable|integer|min:0',
            'bathrooms' => 'nullable|integer|min:0',
            'parking_spaces' => 'nullable|integer|min:0',
            'furnished' => 'boolean',
            'available_from' => 'required|date',
            'images' => 'array',
            'images.*' => 'image|mimes:jpeg,png,jpg,gif|max:2048',
            'amenities' => 'array',
            'amenities.*' => 'exists:amenities,id',
            'contact_phone' => 'required|string|max:20',
            'contact_email' => 'required|email|max:255',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric'
        ]);

        // Create property
        $property = Property::create([
            'user_id' => $user->id,
            'title' => $request->title,
            'description' => $request->description,
            'type' => $request->type,
            'location' => $request->location,
            'address' => $request->address,
            'price' => $request->price,
            'price_type' => $request->price_type,
            'area' => $request->area,
            'bedrooms' => $request->bedrooms,
            'bathrooms' => $request->bathrooms,
            'parking_spaces' => $request->parking_spaces,
            'furnished' => $request->furnished ?? false,
            'available_from' => $request->available_from,
            'contact_phone' => $request->contact_phone,
            'contact_email' => $request->contact_email,
            'latitude' => $request->latitude,
            'longitude' => $request->longitude,
            'status' => 'pending', // Requires admin approval
            'featured' => false,
            'views' => 0
        ]);

        // Handle images upload
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $index => $image) {
                $path = $image->store('properties', 'public');
                
                PropertyImage::create([
                    'property_id' => $property->id,
                    'image_path' => $path,
                    'is_primary' => $index === 0 // First image is primary
                ]);
            }
        }

        // Attach amenities
        if ($request->has('amenities')) {
            $property->amenities()->attach($request->amenities);
        }

        return response()->json([
            'message' => 'Property created successfully and is pending approval',
            'property' => $property->load(['images', 'amenities'])
        ], 201);
    }

    /**
     * Update a property
     */
    public function update(Request $request, $id)
    {
        $user = Auth::user();
        
        $property = Property::where('user_id', $user->id)->findOrFail($id);
        
        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'type' => 'required|in:residential,commercial,office,retail,warehouse,industrial',
            'location' => 'required|string|max:255',
            'address' => 'required|string|max:500',
            'price' => 'required|numeric|min:0',
            'price_type' => 'required|in:monthly,yearly,sale',
            'area' => 'required|numeric|min:0',
            'bedrooms' => 'nullable|integer|min:0',
            'bathrooms' => 'nullable|integer|min:0',
            'parking_spaces' => 'nullable|integer|min:0',
            'furnished' => 'boolean',
            'available_from' => 'required|date',
            'contact_phone' => 'required|string|max:20',
            'contact_email' => 'required|email|max:255',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric'
        ]);

        $property->update([
            'title' => $request->title,
            'description' => $request->description,
            'type' => $request->type,
            'location' => $request->location,
            'address' => $request->address,
            'price' => $request->price,
            'price_type' => $request->price_type,
            'area' => $request->area,
            'bedrooms' => $request->bedrooms,
            'bathrooms' => $request->bathrooms,
            'parking_spaces' => $request->parking_spaces,
            'furnished' => $request->furnished ?? false,
            'available_from' => $request->available_from,
            'contact_phone' => $request->contact_phone,
            'contact_email' => $request->contact_email,
            'latitude' => $request->latitude,
            'longitude' => $request->longitude,
            'status' => 'pending' // Reset to pending when updated
        ]);

        // Update amenities
        if ($request->has('amenities')) {
            $property->amenities()->sync($request->amenities);
        }

        return response()->json([
            'message' => 'Property updated successfully and is pending approval',
            'property' => $property->load(['images', 'amenities'])
        ]);
    }

    /**
     * Delete a property
     */
    public function destroy($id)
    {
        $user = Auth::user();
        
        $property = Property::where('user_id', $user->id)->findOrFail($id);
        
        // Delete property images
        foreach ($property->images as $image) {
            Storage::disk('public')->delete($image->image_path);
            $image->delete();
        }
        
        $property->delete();
        
        return response()->json([
            'message' => 'Property deleted successfully'
        ]);
    }

    /**
     * Upload property images
     */
    public function uploadImages(Request $request, $id)
    {
        $user = Auth::user();
        
        $property = Property::where('user_id', $user->id)->findOrFail($id);
        
        $request->validate([
            'images' => 'required|array',
            'images.*' => 'image|mimes:jpeg,png,jpg,gif|max:2048'
        ]);

        $uploadedImages = [];
        
        foreach ($request->file('images') as $image) {
            $path = $image->store('properties', 'public');
            
            $propertyImage = PropertyImage::create([
                'property_id' => $property->id,
                'image_path' => $path,
                'is_primary' => false
            ]);
            
            $uploadedImages[] = $propertyImage;
        }

        return response()->json([
            'message' => 'Images uploaded successfully',
            'images' => $uploadedImages
        ]);
    }

    /**
     * Delete property image
     */
    public function deleteImage($propertyId, $imageId)
    {
        $user = Auth::user();
        
        $property = Property::where('user_id', $user->id)->findOrFail($propertyId);
        $image = PropertyImage::where('property_id', $property->id)->findOrFail($imageId);
        
        // Delete file from storage
        Storage::disk('public')->delete($image->image_path);
        
        // If this was primary, set another image as primary
        if ($image->is_primary) {
            $newPrimary = PropertyImage::where('property_id', $property->id)
                ->where('id', '!=', $image->id)
                ->first();
            
            if ($newPrimary) {
                $newPrimary->update(['is_primary' => true]);
            }
        }
        
        $image->delete();
        
        return response()->json([
            'message' => 'Image deleted successfully'
        ]);
    }

    /**
     * Set primary image
     */
    public function setPrimaryImage($propertyId, $imageId)
    {
        $user = Auth::user();
        
        $property = Property::where('user_id', $user->id)->findOrFail($propertyId);
        $image = PropertyImage::where('property_id', $property->id)->findOrFail($imageId);
        
        // Remove primary from all images
        PropertyImage::where('property_id', $property->id)->update(['is_primary' => false]);
        
        // Set new primary
        $image->update(['is_primary' => true]);
        
        return response()->json([
            'message' => 'Primary image set successfully',
            'image' => $image
        ]);
    }

    /**
     * Get available amenities
     */
    public function getAmenities()
    {
        $amenities = Amenity::orderBy('name')->get();
        
        return response()->json($amenities);
    }

    /**
     * Toggle property status (active/inactive)
     */
    public function toggleStatus($id)
    {
        $user = Auth::user();
        
        $property = Property::where('user_id', $user->id)->findOrFail($id);
        
        // Only allow toggling if property is approved
        if ($property->status === 'pending') {
            return response()->json([
                'message' => 'Cannot toggle status of pending property'
            ], 400);
        }
        
        $newStatus = $property->status === 'active' ? 'inactive' : 'active';
        $property->update(['status' => $newStatus]);
        
        return response()->json([
            'message' => "Property status changed to {$newStatus}",
            'property' => $property
        ]);
    }

    /**
     * Get property analytics
     */
    public function analytics($id)
    {
        $user = Auth::user();
        
        $property = Property::where('user_id', $user->id)->findOrFail($id);
        
        // Basic stats
        $views = $property->views ?? 0;
        $applications = $property->applications()->count();
        $favorites = $property->favorites ?? 0;
        
        // Views by day (last 30 days)
        $viewsByDay = [];
        for ($i = 29; $i >= 0; $i--) {
            $date = now()->subDays($i)->format('Y-m-d');
            $viewsByDay[] = [
                'date' => $date,
                'views' => rand(0, 50) // Placeholder - implement actual tracking
            ];
        }
        
        return response()->json([
            'property' => $property,
            'stats' => [
                'total_views' => $views,
                'total_applications' => $applications,
                'total_favorites' => $favorites,
                'views_by_day' => $viewsByDay
            ]
        ]);
    }
}

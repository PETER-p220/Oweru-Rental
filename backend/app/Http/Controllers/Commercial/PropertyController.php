<?php

namespace App\Http\Controllers\Commercial;

use App\Http\Controllers\Controller;
use App\Models\Amenity;
use App\Models\Property;
use App\Models\PropertyImage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

// NOTE: Laravel 11 removed controller-based middleware() calls.
// Auth is enforced by the auth:sanctum middleware applied to these
// routes in routes/api.php — no __construct needed here.

class PropertyController extends Controller
{
    // =========================================================================
    // LIST  —  GET /api/commercial/properties
    // =========================================================================

    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();

        $query = Property::where('owner_id', $user->id)
            ->with(['images', 'amenities']);

        // ── Search ────────────────────────────────────────────────────────────
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title',       'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhere('location',   'like', "%{$search}%")
                  ->orWhere('address',    'like', "%{$search}%");
            });
        }

        // ── Status filter (ignore 'all') ───────────────────────────────────
        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // ── Type filter (ignore 'all') ────────────────────────────────────
        if ($request->filled('type') && $request->type !== 'all') {
            $query->where('type', $request->type);
        }

        $perPage    = (int) $request->get('per_page', 10);
        $properties = $query->latest()->paginate($perPage);

        // Return the standard Laravel paginator shape:
        // { data: [...], current_page, last_page, per_page, total }
        // This is exactly what Properties.tsx expects.
        return response()->json($properties);
    }

    // =========================================================================
    // SHOW  —  GET /api/commercial/properties/{id}
    // =========================================================================

    public function show($id): JsonResponse
    {
        $property = Property::where('owner_id', Auth::id())
            ->with(['images', 'amenities'])
            ->findOrFail($id);

        return response()->json($property);
    }

    // =========================================================================
    // STORE  —  POST /api/commercial/properties
    // =========================================================================

    public function store(Request $request): JsonResponse
    {
        $user = Auth::user();

        $request->validate([
            'title'          => 'required|string|max:255',
            'description'    => 'required|string',
            'type'           => 'required|in:residential,commercial,office,retail,warehouse,industrial',
            'location'       => 'required|string|max:255',
            'address'        => 'required|string|max:500',
            'price'          => 'required|numeric|min:0',
            'price_type'     => 'required|in:monthly,yearly,sale',
            'area'           => 'required|numeric|min:0',
            'bedrooms'       => 'nullable|integer|min:0',
            'bathrooms'      => 'nullable|integer|min:0',
            'parking_spaces' => 'nullable|integer|min:0',
            // 'furnished' arrives as '1'/'0' from FormData — cast manually below
            'furnished'      => 'nullable',
            'available_from' => 'required|date',
            'contact_phone'  => 'required|string|max:20',
            'contact_email'  => 'required|email|max:255',
            'latitude'       => 'nullable|numeric',
            'longitude'      => 'nullable|numeric',
            // Images arrive as images[0], images[1], …
            'images'         => 'nullable|array',
            'images.*'       => 'image|mimes:jpeg,png,jpg,gif,webp|max:5120',
            // Amenities arrive as amenities[] array of IDs
            'amenities'      => 'nullable|array',
            'amenities.*'    => 'integer|exists:amenities,id',
        ]);

        $property = Property::create([
            'owner_id'        => $user->id,
            'title'          => $request->title,
            'description'    => $request->description,
            'type'           => $request->type,
            'location'       => $request->location,
            'address'        => $request->address,
            'price'          => $request->price,
            'price_type'     => $request->price_type,
            'area'           => $request->area,
            'bedrooms'       => $request->bedrooms       ?? 0,
            'bathrooms'      => $request->bathrooms      ?? 0,
            'parking_spaces' => $request->parking_spaces ?? 0,
            // FormData sends booleans as '1'/'0' strings — normalise properly
            'furnished'      => filter_var($request->input('furnished', false), FILTER_VALIDATE_BOOLEAN),
            'available_from' => $request->available_from,
            'contact_phone'  => $request->contact_phone,
            'contact_email'  => $request->contact_email,
            'latitude'       => $request->latitude  ?? null,
            'longitude'      => $request->longitude ?? null,
            'status'         => 'pending',  // requires admin approval
            'featured'       => false,
            'views'          => 0,
        ]);

        // ── Images ────────────────────────────────────────────────────────────
        // The React form appends files as images[0], images[1], …
        // hasFile('images') returns true when at least one file was sent.
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $index => $image) {
                $path = $image->store('properties', 'public');

                PropertyImage::create([
                    'property_id' => $property->id,
                    'image_path'  => $path,
                    'is_primary'  => $index === 0, // first image is primary
                ]);
            }
        }

        // ── Amenities ─────────────────────────────────────────────────────────
        if ($request->filled('amenities')) {
            $property->amenities()->sync($request->amenities);
        }

        return response()->json([
            'message'  => 'Property created successfully and is pending approval',
            'property' => $property->load(['images', 'amenities']),
        ], 201);
    }

    // =========================================================================
    // UPDATE  —  POST /api/commercial/properties/{id}
    // =========================================================================
    // NOTE: EditProperty.tsx sends a POST (not PUT) with FormData because
    // multipart/form-data doesn't support PUT natively in some browsers.
    // Make sure your route is:
    //   Route::post('/commercial/properties/{id}', [..., 'update']);
    // OR use Route::put and add _method=PUT to the FormData in the frontend.

    public function update(Request $request, $id): JsonResponse
    {
        $user = Auth::user();

        $property = Property::where('owner_id', $user->id)->findOrFail($id);

        $request->validate([
            'title'            => 'required|string|max:255',
            'description'      => 'required|string',
            'type'             => 'required|in:residential,commercial,office,retail,warehouse,industrial',
            'location'         => 'required|string|max:255',
            'address'          => 'required|string|max:500',
            'price'            => 'required|numeric|min:0',
            'price_type'       => 'required|in:monthly,yearly,sale',
            'area'             => 'required|numeric|min:0',
            'bedrooms'         => 'nullable|integer|min:0',
            'bathrooms'        => 'nullable|integer|min:0',
            'parking_spaces'   => 'nullable|integer|min:0',
            'furnished'        => 'nullable',
            'available_from'   => 'required|date',
            'contact_phone'    => 'required|string|max:20',
            'contact_email'    => 'required|email|max:255',
            'latitude'         => 'nullable|numeric',
            'longitude'        => 'nullable|numeric',
            'images'           => 'nullable|array',
            'images.*'         => 'image|mimes:jpeg,png,jpg,gif,webp|max:5120',
            'amenities'        => 'nullable|array',
            'amenities.*'      => 'integer|exists:amenities,id',
            // IDs of existing images the user removed in the edit form
            'deleted_images'   => 'nullable|array',
            'deleted_images.*' => 'integer',
        ]);

        $property->update([
            'title'          => $request->title,
            'description'    => $request->description,
            'type'           => $request->type,
            'location'       => $request->location,
            'address'        => $request->address,
            'price'          => $request->price,
            'price_type'     => $request->price_type,
            'area'           => $request->area,
            'bedrooms'       => $request->bedrooms       ?? 0,
            'bathrooms'      => $request->bathrooms      ?? 0,
            'parking_spaces' => $request->parking_spaces ?? 0,
            'furnished'      => filter_var($request->input('furnished', false), FILTER_VALIDATE_BOOLEAN),
            'available_from' => $request->available_from,
            'contact_phone'  => $request->contact_phone,
            'contact_email'  => $request->contact_email,
            'latitude'       => $request->latitude  ?? null,
            'longitude'      => $request->longitude ?? null,
            'status'         => 'pending', // reset to pending on every edit
        ]);

        // ── Remove images the user deleted ────────────────────────────────────
        if ($request->filled('deleted_images')) {
            $toDelete = PropertyImage::whereIn('id', $request->deleted_images)
                ->where('property_id', $property->id)
                ->get();

            foreach ($toDelete as $img) {
                Storage::disk('public')->delete($img->image_path);
                $img->delete();
            }
        }

        // ── Add new images ─────────────────────────────────────────────────
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $image) {
                $path = $image->store('properties', 'public');
                PropertyImage::create([
                    'property_id' => $property->id,
                    'image_path'  => $path,
                    'is_primary'  => false,
                ]);
            }

            // Ensure there is always a primary image
            $hasPrimary = PropertyImage::where('property_id', $property->id)
                ->where('is_primary', true)
                ->exists();

            if (!$hasPrimary) {
                PropertyImage::where('property_id', $property->id)
                    ->first()
                    ?->update(['is_primary' => true]);
            }
        }

        // ── Amenities ─────────────────────────────────────────────────────────
        if ($request->has('amenities')) {
            $property->amenities()->sync($request->amenities ?? []);
        }

        return response()->json([
            'message'  => 'Property updated successfully and is pending approval',
            'property' => $property->fresh(['images', 'amenities']),
        ]);
    }

    // =========================================================================
    // DELETE  —  DELETE /api/commercial/properties/{id}
    // =========================================================================

    public function destroy($id): JsonResponse
    {
        $property = Property::where('owner_id', Auth::id())->findOrFail($id);

        foreach ($property->images as $image) {
            Storage::disk('public')->delete($image->image_path);
            $image->delete();
        }

        $property->delete();

        return response()->json(['message' => 'Property deleted successfully']);
    }

    // =========================================================================
    // TOGGLE STATUS  —  PATCH /api/commercial/properties/{id}/toggle-status
    // =========================================================================

    public function toggleStatus($id): JsonResponse
    {
        $property = Property::where('owner_id', Auth::id())->findOrFail($id);

        if ($property->status === 'pending') {
            return response()->json(
                ['message' => 'Cannot toggle status of a property that is still pending approval'],
                400
            );
        }

        if ($property->status === 'rejected') {
            return response()->json(
                ['message' => 'Cannot toggle status of a rejected property'],
                400
            );
        }

        $newStatus = $property->status === 'active' ? 'inactive' : 'active';
        $property->update(['status' => $newStatus]);

        return response()->json([
            'message'  => "Property status changed to {$newStatus}",
            'property' => $property->fresh(),
        ]);
    }

    // =========================================================================
    // ANALYTICS  —  GET /api/commercial/properties/{id}/analytics
    // =========================================================================

    public function analytics($id): JsonResponse
    {
        $property = Property::where('owner_id', Auth::id())
            ->with(['images', 'amenities'])
            ->findOrFail($id);

        $views        = $property->views ?? 0;
        $applications = method_exists($property, 'applications')
            ? $property->applications()->count()
            : 0;

        // Views by day for the last 30 days
        // Replace rand() with real tracking data when available.
        $viewsByDay = [];
        for ($i = 29; $i >= 0; $i--) {
            $viewsByDay[] = [
                'date'  => now()->subDays($i)->format('Y-m-d'),
                'views' => 0,
            ];
        }

        return response()->json([
            'property' => $property,
            'stats'    => [
                'total_views'        => $views,
                'total_applications' => $applications,
                'views_by_day'       => $viewsByDay,
            ],
        ]);
    }

    // =========================================================================
    // IMAGE HELPERS
    // =========================================================================

    /**
     * POST /api/commercial/properties/{id}/images
     */
    public function uploadImages(Request $request, $id): JsonResponse
    {
        $property = Property::where('owner_id', Auth::id())->findOrFail($id);

        $request->validate([
            'images'   => 'required|array',
            'images.*' => 'image|mimes:jpeg,png,jpg,gif,webp|max:5120',
        ]);

        $uploaded = [];
        foreach ($request->file('images') as $image) {
            $path = $image->store('properties', 'public');
            $uploaded[] = PropertyImage::create([
                'property_id' => $property->id,
                'image_path'  => $path,
                'is_primary'  => false,
            ]);
        }

        // Ensure a primary exists
        $hasPrimary = PropertyImage::where('property_id', $property->id)
            ->where('is_primary', true)->exists();
        if (!$hasPrimary) {
            PropertyImage::where('property_id', $property->id)
                ->first()?->update(['is_primary' => true]);
        }

        return response()->json([
            'message' => 'Images uploaded successfully',
            'images'  => $uploaded,
        ]);
    }

    /**
     * DELETE /api/commercial/properties/{propertyId}/images/{imageId}
     */
    public function deleteImage($propertyId, $imageId): JsonResponse
    {
        $property = Property::where('owner_id', Auth::id())->findOrFail($propertyId);
        $image    = PropertyImage::where('property_id', $property->id)->findOrFail($imageId);

        Storage::disk('public')->delete($image->image_path);

        if ($image->is_primary) {
            $next = PropertyImage::where('property_id', $property->id)
                ->where('id', '!=', $image->id)
                ->first();
            $next?->update(['is_primary' => true]);
        }

        $image->delete();

        return response()->json(['message' => 'Image deleted successfully']);
    }

    /**
     * PATCH /api/commercial/properties/{propertyId}/images/{imageId}/primary
     */
    public function setPrimaryImage($propertyId, $imageId): JsonResponse
    {
        $property = Property::where('owner_id', Auth::id())->findOrFail($propertyId);
        $image    = PropertyImage::where('property_id', $property->id)->findOrFail($imageId);

        PropertyImage::where('property_id', $property->id)
            ->update(['is_primary' => false]);

        $image->update(['is_primary' => true]);

        return response()->json([
            'message' => 'Primary image updated',
            'image'   => $image,
        ]);
    }

    // =========================================================================
    // AMENITIES  —  GET /api/commercial/amenities
    // =========================================================================

    public function getAmenities(): JsonResponse
    {
        return response()->json(Amenity::orderBy('name')->get());
    }
}
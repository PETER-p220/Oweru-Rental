<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\Property;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class ApplicationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();
        
        $applications = Application::with(['property', 'property.owner'])
            ->where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->paginate(12);

        return response()->json([
            'data' => $applications->items(),
            'pagination' => [
                'current_page' => $applications->currentPage(),
                'last_page' => $applications->lastPage(),
                'per_page' => $applications->perPage(),
                'total' => $applications->total(),
            ]
        ]);
    }

    public function show(Application $application): JsonResponse
    {
        $this->authorize('view', $application);
        
        $application->load(['property', 'property.owner', 'user']);

        return response()->json([
            'data' => $application
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'property_id' => 'required|exists:properties,id',
            'message' => 'nullable|string|max:1000',
            'offered_rent' => 'nullable|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = Auth::user();
        $property = Property::findOrFail($request->property_id);

        // Check if user already applied
        $existingApplication = Application::where('user_id', $user->id)
            ->where('property_id', $property->id)
            ->first();

        if ($existingApplication) {
            return response()->json([
                'message' => 'You have already applied for this property'
            ], 409);
        }

        $application = Application::create([
            'user_id' => $user->id,
            'property_id' => $property->id,
            'message' => $request->message,
            'offered_rent' => $request->offered_rent,
            'applied_at' => now(),
        ]);

        return response()->json([
            'message' => 'Application submitted successfully',
            'data' => $application
        ], 201);
    }

    public function update(Request $request, Application $application): JsonResponse
    {
        $this->authorize('update', $application);

        $user = Auth::user();
        
        // Only property owners can update applications
        if ($application->property->owner_id !== $user->id) {
            return response()->json([
                'message' => 'Unauthorized'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'status' => 'required|in:pending,approved,rejected,withdrawn',
            'landlord_notes' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $application->update([
            'status' => $request->status,
            'landlord_notes' => $request->landlord_notes,
            'responded_at' => now(),
        ]);

        return response()->json([
            'message' => 'Application updated successfully',
            'data' => $application
        ]);
    }
}

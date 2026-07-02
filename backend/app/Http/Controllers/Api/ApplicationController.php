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
        'property_id'    => 'required|exists:properties,id',
        'message'        => 'nullable|string|max:1000',
        'offered_rent'   => 'nullable|numeric|min:0',
        // payment fields — all nullable so both flows work
        'owner_id'       => 'nullable|integer',
        'service_fee'    => 'nullable|numeric',
        'payment_status' => 'nullable|string',
        'payment_method' => 'nullable|string',
        'transaction_id' => 'nullable|string',
    ]);

    if ($validator->fails()) {
        return response()->json([
            'message' => 'Validation failed',
            'errors'  => $validator->errors()
        ], 422);
    }

    $user     = Auth::user();
    $property = Property::findOrFail($request->property_id);

    // Check for duplicate — but allow re-apply if previous was withdrawn
    $existingApplication = Application::where('user_id', $user->id)
        ->where('property_id', $property->id)
        ->whereNotIn('status', ['withdrawn', 'rejected'])
        ->first();

    if ($existingApplication) {
        return response()->json([
            'message' => 'You have already applied for this property',
            'data'    => $existingApplication
        ], 409);
    }

    if ($property->agent_id && $request->payment_status === 'paid') {
        return response()->json([
            'message' => 'Site visit payment must be completed through the payment gateway.',
        ], 422);
    }

    $application = Application::create([
        'user_id'        => $user->id,
        'property_id'    => $property->id,
        'owner_id'       => $request->owner_id ?? $property->owner_id,
        'message'        => $request->message ?? (
            $property->agent_id
                ? "Site visit request for {$property->title}"
                : "Rental application for {$property->title}"
        ),
        'offered_rent'   => $request->offered_rent,
        'service_fee'    => $property->agent_id ? $request->service_fee : null,
        'payment_status' => $property->agent_id
            ? ($request->payment_status ?? 'pending')
            : ($request->payment_status ?? 'waived'),
        'payment_method' => $request->payment_method,
        'transaction_id' => $request->transaction_id,
        'applied_at'     => now(),
    ]);

    return response()->json([
        'message' => 'Application submitted successfully',
        'data'    => $application
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

    public function approve(Application $application): JsonResponse
    {
        $this->authorize('update', $application);
        
        $user = Auth::user();
        
        // Only property owners can approve applications
        if ($application->property->owner_id !== $user->id) {
            return response()->json([
                'message' => 'Unauthorized'
            ], 403);
        }

        // Update application status to approved
        $application->update([
            'status' => 'approved',
            'responded_at' => now(),
        ]);

        // Create tenant record
        try {
            // Check if tenant already exists
            $existingTenant = \App\Models\Tenant::where('user_id', $application->user_id)
                ->where('property_id', $application->property_id)
                ->first();

            if (!$existingTenant) {
                // Create tenant record with correct schema
                $tenant = \App\Models\Tenant::create([
                    'user_id' => $application->user_id,
                    'property_id' => $application->property_id,
                    'move_in_date' => now(),
                    'status' => 'active',
                ]);

                // Create contract record with correct schema
                \App\Models\Contract::create([
                    'tenant_id' => $tenant->id,
                    'property_id' => $application->property_id,
                    'start_date' => now(),
                    'end_date' => null, // Ongoing contract
                    'rent_amount' => $application->property->price,
                    'status' => 'active',
                    'terms' => 'Standard rental agreement created from approved application',
                ]);
            }
        } catch (\Exception $e) {
            // Log error but don't fail the approval
            \Log::error('Failed to create tenant record: ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'Application approved and tenant created successfully',
            'data' => $application->fresh()
        ]);
    }
}

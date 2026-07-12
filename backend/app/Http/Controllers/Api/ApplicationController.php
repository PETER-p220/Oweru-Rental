<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\Contract;
use App\Models\Notification;
use App\Models\Property;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
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
            ],
        ]);
    }

    public function show(Application $application): JsonResponse
    {
        $this->authorize('view', $application);

        $application->load(['property', 'property.owner', 'user']);

        return response()->json([
            'data' => $application,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'property_id' => 'required|exists:properties,id',
            'message' => 'nullable|string|max:1000',
            'offered_rent' => 'nullable|numeric|min:0',
            'owner_id' => 'nullable|integer',
            'service_fee' => 'nullable|numeric',
            'payment_status' => 'nullable|string',
            'payment_method' => 'nullable|string',
            'transaction_id' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = Auth::user();
        $property = Property::findOrFail($request->property_id);

        if ($property->available === false) {
            return response()->json([
                'message' => 'This property is no longer available for applications.',
            ], 422);
        }

        if (Application::where('property_id', $property->id)->where('rent_payment_status', 'paid')->exists()) {
            if ($property->available !== false) {
                $property->update(['available' => false]);
            }

            return response()->json([
                'message' => 'This property has already been rented.',
            ], 422);
        }

        $existingApplication = Application::where('user_id', $user->id)
            ->where('property_id', $property->id)
            ->whereNotIn('status', ['withdrawn', 'rejected'])
            ->first();

        if ($existingApplication) {
            return response()->json([
                'message' => 'You have already applied for this property',
                'data' => $existingApplication,
            ], 409);
        }

        if ($property->agent_id && $request->payment_status === 'paid') {
            return response()->json([
                'message' => 'Site visit payment must be completed through the payment gateway.',
            ], 422);
        }

        $application = Application::create([
            'user_id' => $user->id,
            'property_id' => $property->id,
            'owner_id' => $request->owner_id ?? $property->owner_id,
            'message' => $request->message ?? (
                $property->agent_id
                    ? "Site visit request for {$property->title}"
                    : "Rental application for {$property->title}"
            ),
            'offered_rent' => $request->offered_rent,
            'service_fee' => $property->agent_id ? $request->service_fee : null,
            'payment_status' => $property->agent_id
                ? ($request->payment_status ?? 'pending')
                : ($request->payment_status ?? 'waived'),
            'payment_method' => $request->payment_method,
            'transaction_id' => $request->transaction_id,
            'applied_at' => now(),
            'status' => 'pending',
        ]);

        $this->notifyPropertyOwner($application->fresh(['user', 'property']));

        return response()->json([
            'message' => 'Application submitted successfully',
            'data' => $application,
        ], 201);
    }

    public function update(Request $request, Application $application): JsonResponse
    {
        $this->authorize('update', $application);

        $user = Auth::user();

        if ($application->property->owner_id !== $user->id) {
            return response()->json([
                'message' => 'Unauthorized',
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'status' => 'required|in:pending,approved,rejected,withdrawn',
            'landlord_notes' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $application->update([
            'status' => $request->status,
            'landlord_notes' => $request->landlord_notes,
            'responded_at' => now(),
        ]);

        return response()->json([
            'message' => 'Application updated successfully',
            'data' => $application,
        ]);
    }

    public function approve(Application $application): JsonResponse
    {
        $this->authorize('update', $application);

        $user = Auth::user();

        if ($application->property->owner_id !== $user->id) {
            return response()->json([
                'message' => 'Unauthorized',
            ], 403);
        }

        return $this->approveOwnedApplication($application);
    }

    /**
     * Commercial owner: list applications for their properties.
     * Flat fields + top-level pagination keys for commercial Applications.tsx.
     */
    public function getCommercialApplications(Request $request): JsonResponse
    {
        $user = Auth::user();
        $perPage = min((int) $request->get('per_page', 10), 50);

        $query = Application::with(['user', 'property'])
            ->where(function ($q) use ($user) {
                $q->where('owner_id', $user->id)
                    ->orWhereHas('property', fn ($pq) => $pq->where('owner_id', $user->id));
            });

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('message', 'like', "%{$search}%")
                    ->orWhereHas('property', function ($pq) use ($search) {
                        $pq->where('title', 'like', "%{$search}%")
                            ->orWhere('location', 'like', "%{$search}%");
                    })
                    ->orWhereHas('user', function ($uq) use ($search) {
                        $uq->where('first_name', 'like', "%{$search}%")
                            ->orWhere('last_name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    });
            });
        }

        $applications = $query->orderBy('created_at', 'desc')->paginate($perPage);

        $items = collect($applications->items())->map(function (Application $app) {
            $applicant = $app->user;
            $property = $app->property;
            $name = trim(($applicant->first_name ?? '') . ' ' . ($applicant->last_name ?? ''));

            return [
                'id' => $app->id,
                'property_id' => $app->property_id,
                'property_title' => $property->title ?? 'Property',
                'property_type' => $property->type ?? 'commercial',
                'property_location' => $property->location ?? ($property->address ?? ''),
                'applicant_name' => $name !== '' ? $name : ($applicant->email ?? 'Tenant'),
                'applicant_email' => $applicant->email ?? '',
                'applicant_phone' => $applicant->phone ?? '',
                'message' => $app->message ?? '',
                'status' => $app->status ?? 'pending',
                'created_at' => optional($app->created_at)?->toIso8601String(),
                'updated_at' => optional($app->updated_at)?->toIso8601String(),
            ];
        })->values();

        return response()->json([
            'data' => $items,
            'current_page' => $applications->currentPage(),
            'last_page' => $applications->lastPage(),
            'per_page' => $applications->perPage(),
            'total' => $applications->total(),
        ]);
    }

    public function approveCommercialApplication(Application $application): JsonResponse
    {
        $user = Auth::user();
        $application->loadMissing('property', 'user');

        if (! $this->ownsApplication((int) $user->id, $application)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return $this->approveOwnedApplication($application);
    }

    public function rejectCommercialApplication(Request $request, Application $application): JsonResponse
    {
        $user = Auth::user();
        $application->loadMissing('property', 'user');

        if (! $this->ownsApplication((int) $user->id, $application)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $reason = $request->input('rejection_reason', 'Application rejected by property owner.');

        $application->update([
            'status' => 'rejected',
            'rejection_reason' => $reason,
            'responded_at' => now(),
        ]);

        try {
            if (Schema::hasTable('notifications') && $application->user_id) {
                Notification::create([
                    'user_id' => $application->user_id,
                    'title' => 'Application Rejected',
                    'message' => 'Your application for ' . ($application->property->title ?? 'a property') . ' was rejected.',
                    'type' => 'application_rejected',
                ]);
            }
        } catch (\Throwable $e) {
            Log::warning('Failed to notify tenant of rejection', ['error' => $e->getMessage()]);
        }

        return response()->json(['message' => 'Application rejected successfully']);
    }

    private function ownsApplication(int $userId, Application $application): bool
    {
        if ((int) $application->owner_id === $userId) {
            return true;
        }

        return (int) ($application->property?->owner_id) === $userId;
    }

    private function approveOwnedApplication(Application $application): JsonResponse
    {
        $application->update([
            'status' => 'approved',
            'responded_at' => now(),
        ]);

        $tenantId = null;

        if (Schema::hasTable('tenants')) {
            try {
                $tenant = Tenant::firstOrCreate(
                    [
                        'user_id' => $application->user_id,
                        'property_id' => $application->property_id,
                    ],
                    [
                        'move_in_date' => now(),
                        'status' => 'active',
                    ]
                );
                $tenantId = $tenant->id;

                if (Schema::hasTable('contracts')) {
                    $contractExists = Contract::where('tenant_id', $tenant->id)
                        ->where('property_id', $application->property_id)
                        ->exists();

                    if (! $contractExists) {
                        Contract::create([
                            'tenant_id' => $tenant->id,
                            'property_id' => $application->property_id,
                            'start_date' => now(),
                            'end_date' => now()->addYear(),
                            'rent_amount' => $application->property->price ?? 0,
                            'status' => 'active',
                            'terms' => 'Standard rental agreement created from approved application',
                        ]);
                    }
                }
            } catch (\Throwable $e) {
                Log::error('Failed to create tenant/contract on approval', [
                    'application_id' => $application->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        try {
            if (Schema::hasTable('notifications') && $application->user_id) {
                Notification::create([
                    'user_id' => $application->user_id,
                    'title' => 'Application Approved!',
                    'message' => 'Your rental application for ' . ($application->property->title ?? 'a property') . ' has been approved.',
                    'type' => 'application_approved',
                ]);
            }
        } catch (\Throwable $e) {
            // non-blocking
        }

        return response()->json([
            'message' => 'Application approved successfully',
            'data' => $application->fresh(['user', 'property']),
            'tenant_id' => $tenantId,
        ]);
    }

    private function notifyPropertyOwner(Application $application): void
    {
        $ownerId = $application->owner_id ?: $application->property?->owner_id;
        if (! $ownerId || ! Schema::hasTable('notifications')) {
            return;
        }

        $tenant = $application->user;
        $tenantName = trim(($tenant->first_name ?? '') . ' ' . ($tenant->last_name ?? ''))
            ?: ($tenant->email ?? 'A tenant');
        $title = $application->property->title ?? 'your property';

        try {
            Notification::create([
                'user_id' => $ownerId,
                'title' => 'New Application',
                'message' => "{$tenantName} applied for {$title}. Review and approve or reject in Applications.",
                'type' => 'new_application',
            ]);
        } catch (\Throwable $e) {
            Log::warning('Failed to notify property owner of new application', [
                'owner_id' => $ownerId,
                'error' => $e->getMessage(),
            ]);
        }
    }
}

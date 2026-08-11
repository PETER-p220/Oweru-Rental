<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\ComplianceRequest;
use App\Models\Payment;
use App\Models\Property;
use App\Models\Tenant;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class ComplianceRequestController extends Controller
{
    public function tenantIndex(Request $request): JsonResponse
    {
        if (! $this->tableReady()) {
            return response()->json(['data' => [], 'stats' => $this->emptyStats()]);
        }

        $user = Auth::user();
        $query = ComplianceRequest::with(['property:id,title,location,address'])
            ->where('tenant_user_id', $user->id)
            ->latest();

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        return response()->json([
            'data' => $query->get()->map(fn (ComplianceRequest $r) => $this->format($r, 'tenant')),
            'stats' => $this->statsForTenant($user->id),
            'properties' => $this->eligiblePropertiesForTenant($user),
        ]);
    }

    public function tenantStore(Request $request): JsonResponse
    {
        if (! $this->tableReady()) {
            return response()->json(['message' => 'Compliance module is not available yet.'], 503);
        }

        $validator = Validator::make($request->all(), [
            'property_id' => 'required|integer|exists:properties,id',
            'category' => ['required', Rule::in(ComplianceRequest::CATEGORIES)],
            'priority' => ['required', Rule::in(ComplianceRequest::PRIORITIES)],
            'title' => 'required|string|min:5|max:180',
            'description' => 'required|string|min:20|max:5000',
            'location_in_property' => 'nullable|string|max:120',
            'preferred_date' => 'nullable|date|after_or_equal:today',
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Validation failed', 'errors' => $validator->errors()], 422);
        }

        $user = Auth::user();
        $property = Property::findOrFail((int) $request->property_id);

        if (! $this->tenantCanSubmitForProperty($user, $property)) {
            return response()->json([
                'message' => 'You can only submit compliance requests for properties you are actively renting.',
            ], 403);
        }

        if (! $property->owner_id) {
            return response()->json(['message' => 'This property has no assigned owner.'], 422);
        }

        $compliance = ComplianceRequest::create([
            'reference' => $this->nextReference(),
            'tenant_user_id' => $user->id,
            'property_id' => $property->id,
            'owner_id' => $property->owner_id,
            'category' => $request->category,
            'priority' => $request->priority,
            'status' => 'submitted',
            'title' => $request->title,
            'description' => $request->description,
            'location_in_property' => $request->location_in_property,
            'preferred_date' => $request->preferred_date,
        ]);

        $compliance->load(['property:id,title,location', 'tenantUser:id,first_name,last_name,email']);

        $tenantName = $compliance->tenantUser?->fullName() ?? 'A tenant';
        app(NotificationService::class)->notifyOwner(
            (int) $property->owner_id,
            'New compliance request',
            "{$tenantName} submitted \"{$compliance->title}\" for {$property->title}. Reference {$compliance->reference}.",
            'compliance_request',
        );

        return response()->json([
            'message' => 'Your request has been submitted to the property owner.',
            'data' => $this->format($compliance, 'tenant'),
        ], 201);
    }

    public function tenantShow(ComplianceRequest $complianceRequest): JsonResponse
    {
        $this->assertTenantOwns($complianceRequest);

        return response()->json([
            'data' => $this->format($complianceRequest->load(['property', 'owner']), 'tenant'),
        ]);
    }

    public function ownerIndex(Request $request): JsonResponse
    {
        if (! $this->tableReady()) {
            return response()->json(['data' => [], 'stats' => $this->emptyStats()]);
        }

        $ownerId = Auth::id();
        $query = ComplianceRequest::with(['property:id,title,location', 'tenantUser:id,first_name,last_name,email,phone'])
            ->where('owner_id', $ownerId)
            ->latest();

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }
        if ($request->filled('property_id')) {
            $query->where('property_id', (int) $request->property_id);
        }
        if ($request->filled('priority') && $request->priority !== 'all') {
            $query->where('priority', $request->priority);
        }

        return response()->json([
            'data' => $query->get()->map(fn (ComplianceRequest $r) => $this->format($r, 'owner')),
            'stats' => $this->statsForOwner($ownerId),
        ]);
    }

    public function ownerShow(ComplianceRequest $complianceRequest): JsonResponse
    {
        $this->assertOwnerOwns($complianceRequest);

        return response()->json([
            'data' => $this->format($complianceRequest->load(['property', 'tenantUser']), 'owner'),
        ]);
    }

    public function ownerUpdate(Request $request, ComplianceRequest $complianceRequest): JsonResponse
    {
        $this->assertOwnerOwns($complianceRequest);

        return $this->applyOwnerUpdate($request, $complianceRequest);
    }

    private function applyOwnerUpdate(Request $request, ComplianceRequest $complianceRequest): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'status' => ['sometimes', Rule::in(ComplianceRequest::STATUSES)],
            'owner_response' => 'nullable|string|max:3000',
            'resolution_notes' => 'nullable|string|max:3000',
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Validation failed', 'errors' => $validator->errors()], 422);
        }

        $updates = [];
        if ($request->has('owner_response')) {
            $updates['owner_response'] = $request->owner_response;
        }
        if ($request->has('resolution_notes')) {
            $updates['resolution_notes'] = $request->resolution_notes;
        }

        if ($request->filled('status')) {
            $status = $request->status;
            $updates['status'] = $status;

            if ($status === 'acknowledged' && ! $complianceRequest->acknowledged_at) {
                $updates['acknowledged_at'] = now();
            }
            if (in_array($status, ['resolved', 'closed'], true)) {
                $updates['resolved_at'] = now();
            }
            if (in_array($status, ['submitted', 'in_progress'], true)) {
                $updates['resolved_at'] = null;
            }
        }

        $complianceRequest->update($updates);
        $complianceRequest->refresh()->load(['property', 'tenantUser']);

        if ($request->filled('status') || $request->filled('owner_response')) {
            $propertyTitle = $complianceRequest->property?->title ?? 'your property';
            app(NotificationService::class)->notifyUser(
                $complianceRequest->tenant_user_id,
                'Compliance request updated',
                "Your request {$complianceRequest->reference} for {$propertyTitle} is now \""
                . str_replace('_', ' ', $complianceRequest->status) . '".',
                'compliance_update',
            );
        }

        return response()->json([
            'message' => 'Compliance request updated.',
            'data' => $this->format($complianceRequest, 'owner'),
        ]);
    }

    public function adminIndex(Request $request): JsonResponse
    {
        if (! $this->tableReady()) {
            return response()->json(['data' => [], 'stats' => $this->emptyStats()]);
        }

        $query = ComplianceRequest::with(['property:id,title,location,type', 'tenantUser:id,first_name,last_name,email,phone', 'owner:id,first_name,last_name'])
            ->whereHas('property', fn ($q) => $q->where('type', 'oweru_rental'))
            ->latest();

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        return response()->json([
            'data' => $query->get()->map(fn (ComplianceRequest $r) => $this->format($r, 'admin')),
            'stats' => $this->statsForOweru(),
        ]);
    }

    public function adminShow(ComplianceRequest $complianceRequest): JsonResponse
    {
        $this->assertOweruProperty($complianceRequest);

        return response()->json([
            'data' => $this->format($complianceRequest->load(['property', 'tenantUser', 'owner']), 'admin'),
        ]);
    }

    public function adminUpdate(Request $request, ComplianceRequest $complianceRequest): JsonResponse
    {
        $this->assertOweruProperty($complianceRequest);

        return $this->applyOwnerUpdate($request, $complianceRequest);
    }

    private function tableReady(): bool
    {
        return Schema::hasTable('compliance_requests');
    }

    private function emptyStats(): array
    {
        return [
            'total' => 0,
            'open' => 0,
            'in_progress' => 0,
            'resolved' => 0,
        ];
    }

    private function statsForTenant(int $userId): array
    {
        $rows = ComplianceRequest::where('tenant_user_id', $userId);

        return [
            'total' => (clone $rows)->count(),
            'open' => (clone $rows)->whereIn('status', ['submitted', 'acknowledged', 'in_progress'])->count(),
            'in_progress' => (clone $rows)->where('status', 'in_progress')->count(),
            'resolved' => (clone $rows)->whereIn('status', ['resolved', 'closed'])->count(),
        ];
    }

    private function statsForOwner(int $ownerId): array
    {
        $rows = ComplianceRequest::where('owner_id', $ownerId);

        return [
            'total' => (clone $rows)->count(),
            'open' => (clone $rows)->whereIn('status', ['submitted', 'acknowledged', 'in_progress'])->count(),
            'in_progress' => (clone $rows)->where('status', 'in_progress')->count(),
            'resolved' => (clone $rows)->whereIn('status', ['resolved', 'closed'])->count(),
        ];
    }

    private function statsForOweru(): array
    {
        $rows = ComplianceRequest::whereHas('property', fn ($q) => $q->where('type', 'oweru_rental'));

        return [
            'total' => (clone $rows)->count(),
            'open' => (clone $rows)->whereIn('status', ['submitted', 'acknowledged', 'in_progress'])->count(),
            'in_progress' => (clone $rows)->where('status', 'in_progress')->count(),
            'resolved' => (clone $rows)->whereIn('status', ['resolved', 'closed'])->count(),
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function eligiblePropertiesForTenant(User $user): array
    {
        $fromPayments = Payment::where('user_id', $user->id)
            ->whereIn('type', ['first_month_rent', 'monthly_rent', 'rent', 'rent_payment'])
            ->whereIn('status', ['completed', 'paid'])
            ->pluck('property_id');

        $fromApps = Application::where('user_id', $user->id)
            ->where('rent_payment_status', 'paid')
            ->pluck('property_id');

        $fromTenants = Tenant::where('user_id', $user->id)->pluck('property_id');

        $ids = $fromPayments->merge($fromApps)->merge($fromTenants)->unique()->filter()->values();

        return Property::whereIn('id', $ids)
            ->get(['id', 'title', 'location', 'address'])
            ->map(fn (Property $p) => [
                'id' => $p->id,
                'title' => $p->title,
                'location' => $p->location,
                'address' => $p->address,
            ])
            ->values()
            ->all();
    }

    private function tenantCanSubmitForProperty(User $user, Property $property): bool
    {
        $eligibleIds = collect($this->eligiblePropertiesForTenant($user))->pluck('id');

        return $eligibleIds->contains($property->id);
    }

    private function assertTenantOwns(ComplianceRequest $request): void
    {
        if ((int) $request->tenant_user_id !== (int) Auth::id()) {
            abort(403, 'Unauthorized');
        }
    }

    private function assertOwnerOwns(ComplianceRequest $request): void
    {
        if ((int) $request->owner_id !== (int) Auth::id()) {
            abort(403, 'Unauthorized');
        }
    }

    private function assertOweruProperty(ComplianceRequest $request): void
    {
        $request->loadMissing('property');
        if ($request->property?->type !== 'oweru_rental') {
            abort(403, 'This compliance request is not for an Oweru-managed property.');
        }
    }

    private function nextReference(): string
    {
        $prefix = 'CMP-' . now()->format('Ymd');
        $latest = ComplianceRequest::where('reference', 'like', $prefix . '%')
            ->orderByDesc('id')
            ->value('reference');

        $seq = 1;
        if ($latest && preg_match('/-(\d+)$/', $latest, $m)) {
            $seq = ((int) $m[1]) + 1;
        }

        return sprintf('%s-%04d', $prefix, $seq);
    }

    private function format(ComplianceRequest $request, string $viewer): array
    {
        $request->loadMissing(['property', 'tenantUser', 'owner']);

        return [
            'id' => $request->id,
            'reference' => $request->reference,
            'category' => $request->category,
            'priority' => $request->priority,
            'status' => $request->status,
            'title' => $request->title,
            'description' => $request->description,
            'location_in_property' => $request->location_in_property,
            'preferred_date' => optional($request->preferred_date)?->toDateString(),
            'owner_response' => $request->owner_response,
            'resolution_notes' => $request->resolution_notes,
            'acknowledged_at' => optional($request->acknowledged_at)?->toIso8601String(),
            'resolved_at' => optional($request->resolved_at)?->toIso8601String(),
            'created_at' => optional($request->created_at)?->toIso8601String(),
            'updated_at' => optional($request->updated_at)?->toIso8601String(),
            'property' => $request->property ? [
                'id' => $request->property->id,
                'title' => $request->property->title,
                'location' => $request->property->location,
                'address' => $request->property->address,
            ] : null,
            'tenant' => $request->tenantUser ? [
                'id' => $request->tenantUser->id,
                'name' => $request->tenantUser->fullName(),
                'email' => $request->tenantUser->email,
                'phone' => $request->tenantUser->phone,
            ] : null,
            'owner' => match ($viewer) {
                'tenant' => $request->owner ? ['name' => $request->owner->fullName()] : null,
                'admin' => $request->owner ? ['name' => $request->owner->fullName()] : null,
                default => null,
            },
        ];
    }
}

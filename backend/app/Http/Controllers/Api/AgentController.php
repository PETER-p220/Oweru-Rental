<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Property;
use App\Models\Message;
use App\Models\Application;
use App\Models\Tenant;
use App\Models\Contract;
use App\Models\Notification;
use App\Models\Commission;
use App\Models\SavedProperty;
use App\Models\BnbProperty;
use App\Models\BnbBooking;
use App\Models\BnbReview;
use App\Models\Lead;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

class AgentController extends Controller
{
    public function getDashboard(): JsonResponse
    {
        $user = Auth::user();

        try {
            return response()->json(['data' => [
                'total_listings'     => Property::where('agent_id', $user->id)->count(),
                'active_listings'    => Property::where('agent_id', $user->id)->where('available', true)->count(),
                'total_leads'        => Lead::where('agent_id', $user->id)->count(),
                'total_commissions'  => $this->commissionTablesAvailable()
                    ? Commission::where('agent_id', $user->id)->sum('amount')
                    : 0,
            ]]);
        } catch (\Exception $e) {
            Log::error('Failed to get dashboard data: ' . $e->getMessage());
            return response()->json(['data' => [
                'total_listings'     => 0,
                'active_listings'    => 0,
                'total_leads'        => 0,
                'total_commissions'  => 0,
            ]]);
        }
    }

    public function getMyListings(): JsonResponse
    {
        $user = Auth::user();
        $properties = Property::with('owner')
            ->where('agent_id', $user->id)
            ->orderBy('created_at', 'desc')
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

    public function createListing(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'title'          => 'required|string|max:255',
            'description'    => 'required|string|max:2000',
            'price'          => 'required|numeric|min:0',
            'location'       => 'required|string|max:255',
            'type'           => 'sometimes|in:Master-bedroom,house,Single-room',
            'bedrooms'       => 'required|integer|min:0',
            'bathrooms'      => 'required|integer|min:0',
            'area'           => 'sometimes|integer|min:0',
            'owner_id'       => 'required|exists:users,id',
            'images'         => 'sometimes|array',
            'images.*'       => 'image|mimes:jpeg,png,jpg,gif|max:5048',
            'amenities'      => 'sometimes|array',
            'amenities.*'    => 'string|max:100',
            'landlord_name'  => 'sometimes|string|max:255',
            'landlord_phone' => 'sometimes|string|max:20',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors'  => $validator->errors(),
            ], 422);
        }

        // ── Handle image uploads ──────────────────────────────────────────────
        $imagePaths = [];
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $image) {
                $path = $image->store('properties', 'public');
                $imagePaths[] = $path;
            }
        }

        // ── Handle amenities (may come as JSON string or array) ───────────────
        $amenities = [];
        if ($request->has('amenities')) {
            $raw = $request->input('amenities');
            if (is_string($raw)) {
                $amenities = json_decode($raw, true) ?? [];
            } elseif (is_array($raw)) {
                $amenities = $raw;
            }
        }

        $user         = Auth::user();
        $trackingCode = $this->generateUniqueTrackingCode();

        $property = Property::create([
            'title'          => $request->title,
            'description'    => $request->description,
            'price'          => $request->price,
            'location'       => $request->location,
            'address'        => $request->address ?? '',
            'type'           => $request->type,
            'bedrooms'       => $request->bedrooms,
            'bathrooms'      => $request->bathrooms,
            'area'           => $request->area,
            'owner_id'       => $request->owner_id,
            'agent_id'       => $user->id,
            'available'      => true,
            'featured'       => false,
            'dalali'         => $trackingCode,
            'landlord_name'  => $request->landlord_name,
            'landlord_phone' => $request->landlord_phone,
            'images'         => $imagePaths,   // ← FIXED: was missing before
            'amenities'      => $amenities,    // ← FIXED: was missing before
        ]);

        return response()->json([
            'message' => 'Property listed successfully',
            'data'    => $property->load('owner'),
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

    public function updateListing(Request $request, Property $property): JsonResponse
    {
        $user = Auth::user();

        if ($property->agent_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'title'       => 'sometimes|string|max:255',
            'description' => 'sometimes|string|max:2000',
            'price'       => 'sometimes|numeric|min:0',
            'location'    => 'sometimes|string|max:255',
            'type'        => 'sometimes|in:Master-bedroom,house,Single-room',
            'bedrooms'    => 'sometimes|integer|min:0',
            'bathrooms'   => 'sometimes|integer|min:0',
            'area'        => 'sometimes|integer|min:0',
            'available'   => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors'  => $validator->errors(),
            ], 422);
        }

        $property->update($request->only([
            'title', 'description', 'price', 'location', 'type',
            'bedrooms', 'bathrooms', 'area', 'available',
        ]));

        return response()->json([
            'message' => 'Property updated successfully',
            'data'    => $property->load('owner'),
        ]);
    }

    public function deleteListing(Property $property): JsonResponse
    {
        $user = Auth::user();

        if ($property->agent_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $property->delete();

        return response()->json(['message' => 'Property deleted successfully']);
    }

    public function getPropertyAnalytics(Property $property): JsonResponse
    {
        $user = Auth::user();

        if ($property->agent_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json(['data' => [
            'views'             => $property->views ?? 0,
            'inquiries'         => Application::where('property_id', $property->id)->count(),
            'applications'      => Application::where('property_id', $property->id)->count(),
            'conversion_rate'   => $this->calculateConversionRate($property),
            'avg_response_time' => 2.5,
        ]]);
    }

    public function getLinkedOwners(): JsonResponse
    {
        $user = Auth::user();

        try {
            // Get all properties for this agent that have landlord contact details
            $properties = Property::where('agent_id', $user->id)
                ->where(function ($query) {
                    $query->whereNotNull('landlord_name')
                          ->where('landlord_name', '!=', '')
                          ->orWhere(function ($q) {
                              $q->whereNotNull('landlord_phone')
                                ->where('landlord_phone', '!=', '');
                          });
                })
                ->with('owner')
                ->get();

            // Group by owner to match the expected data structure
            $owners = collect();
            $properties->groupBy('owner_id')->each(function ($props, $ownerId) use ($owners) {
                $owner = User::find($ownerId);
                if (!$owner) return;

                $propertiesWithLandlord = $props->map(function ($p) {
                    return [
                        'id'             => $p->id,
                        'title'          => $p->title,
                        'location'       => $p->location,
                        'landlord_name'  => $p->landlord_name,
                        'landlord_phone' => $p->landlord_phone,
                    ];
                });

                $owners->push([
                    'id'                => $owner->id,
                    'first_name'        => $owner->first_name,
                    'last_name'         => $owner->last_name,
                    'email'             => $owner->email,
                    'properties_count'  => $props->count(),
                    'properties_list'   => $propertiesWithLandlord,
                    'has_landlord_info' => true,
                ]);
            });

        } catch (\Exception $e) {
            \Log::error('Error fetching linked owners: ' . $e->getMessage());
            $owners = collect();
        }

        return response()->json(['data' => $owners]);
    }

    public function linkOwner(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'owner_id'        => 'required|exists:users,id',
            'commission_rate' => 'required|numeric|min:0|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors'  => $validator->errors(),
            ], 422);
        }

        $owner = User::findOrFail($request->owner_id);

        if ($owner->user_type !== 'landlord') {
            return response()->json(['message' => 'User is not a landlord'], 422);
        }

        $user = Auth::user();

        if (Schema::hasTable('agent_owner_links')) {
            \DB::table('agent_owner_links')->updateOrInsert(
                ['agent_id' => $user->id, 'owner_id' => $owner->id],
                ['commission_rate' => $request->commission_rate, 'updated_at' => now(), 'created_at' => now()]
            );
        } else {
            Property::where('owner_id', $owner->id)
                ->whereNull('agent_id')
                ->update(['agent_id' => $user->id]);
        }

        return response()->json(['message' => 'Owner linked successfully']);
    }

    public function getTrackingLinks(): JsonResponse
    {
        $user       = Auth::user();
        $properties = Property::where('agent_id', $user->id)->get();

        $links = $properties->map(function ($property) use ($user) {
            $trackingUrl = url("/property/{$property->id}?agent={$user->id}");

            try {
                $clicks = $property->clicks ?? 0;
                $shares = $property->shares ?? 0;
            } catch (\Exception $e) {
                $clicks = 0;
                $shares = 0;
            }

            return [
                'id'           => $property->id,
                'title'        => $property->title,
                'tracking_url' => $trackingUrl,
                'qr_code_url'  => url("/api/agent/qr-codes/{$property->id}"),
                'shares'       => $shares,
                'clicks'       => $clicks,
                'created_at'   => $property->created_at,
                'property'     => $property,
            ];
        });

        return response()->json(['data' => $links]);
    }

    public function trackShare(Request $request): JsonResponse
    {
        $request->validate([
            'property_id' => 'required|exists:properties,id'
        ]);

        $property = Property::find($request->input('property_id'));
        $user     = Auth::user();

        if ($property->agent_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        try {
            $property->increment('shares');
        } catch (\Exception $e) {
            \Log::info('Property shared (no increment)', [
                'property_id' => $property->id,
                'agent_id'    => $user->id,
                'ip'          => $request->ip(),
                'user_agent'  => $request->userAgent()
            ]);
        }

        \Log::info('Property shared', [
            'property_id' => $property->id,
            'agent_id'    => $user->id,
            'ip'          => $request->ip(),
            'user_agent'  => $request->userAgent()
        ]);

        return response()->json(['message' => 'Share tracked successfully']);
    }

    public function recordShare(Property $property): JsonResponse
    {
        $user = Auth::user();

        if ($property->agent_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $property->increment('shares');

        return response()->json([
            'message' => 'Share recorded',
            'shares'  => $property->shares,
        ]);
    }

    public function debugProperty($id): JsonResponse
    {
        $user     = Auth::user();
        $property = Property::find($id);

        if (!$property) {
            return response()->json(['message' => 'Property not found'], 404);
        }

        if ($property->agent_id !== $user->id) {
            return response()->json(['message' => 'Property does not belong to this agent'], 403);
        }

        $schema          = \Schema::getColumnListing('properties');
        $hasClicksColumn = in_array('clicks', $schema);
        $hasSharesColumn = in_array('shares', $schema);

        return response()->json([
            'property_exists'    => true,
            'property_id'        => $property->id,
            'property_title'     => $property->title,
            'agent_id'           => $property->agent_id,
            'user_id'            => $user->id,
            'tracking_url'       => url("/property/{$property->id}?agent={$user->id}"),
            'clicks'             => $property->clicks ?? 0,
            'shares'             => $property->shares ?? 0,
            'database_columns'   => $schema,
            'has_clicks_column'  => $hasClicksColumn,
            'has_shares_column'  => $hasSharesColumn,
        ]);
    }

    public function generateQRCode(Property $property): JsonResponse
    {
        $user = Auth::user();

        if ($property->agent_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $trackingUrl = url("/properties/{$property->id}?agent={$user->id}");

        return response()->json(['data' => [
            'property_id'  => $property->id,
            'agent_id'     => $user->id,
            'url'          => $trackingUrl,
            'qr_code_data' => base64_encode($trackingUrl),
        ]]);
    }

    public function getLeads(): JsonResponse
    {
        $user = Auth::user();

        try {
            $leads = Lead::with('property', 'user')
                ->where('agent_id', $user->id)
                ->orderBy('created_at', 'desc')
                ->paginate(20);

            return response()->json([
                'data' => $leads->items(),
                'pagination' => [
                    'current_page' => $leads->currentPage(),
                    'last_page'    => $leads->lastPage(),
                    'per_page'     => $leads->perPage(),
                    'total'        => $leads->total(),
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to get leads: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to load leads',
                'data'    => [],
                'pagination' => [
                    'current_page' => 1,
                    'last_page'    => 1,
                    'per_page'     => 20,
                    'total'        => 0,
                ],
            ], 500);
        }
    }

    private function getSampleLeads(): JsonResponse
    {
        $sampleLeads = [
            [
                'id'         => 1,
                'name'       => 'John Doe',
                'email'      => 'john.doe@example.com',
                'phone'      => '+255 123 456 789',
                'status'     => 'new',
                'created_at' => now()->subDays(2)->toDateTimeString(),
                'property'   => ['id' => 1, 'title' => 'Mwanza PLS Apartment'],
                'user'       => ['first_name' => 'John', 'email' => 'john.doe@example.com']
            ],
            [
                'id'         => 2,
                'name'       => 'Jane Smith',
                'email'      => 'jane.smith@example.com',
                'phone'      => '+255 987 654 321',
                'status'     => 'contacted',
                'created_at' => now()->subDays(5)->toDateTimeString(),
                'property'   => ['id' => 2, 'title' => 'Dar es Salaam Beach House'],
                'user'       => ['first_name' => 'Jane', 'email' => 'jane.smith@example.com']
            ],
            [
                'id'         => 3,
                'name'       => 'Mike Johnson',
                'email'      => 'mike.j@example.com',
                'phone'      => '+255 555 123 456',
                'status'     => 'interested',
                'created_at' => now()->subWeek()->toDateTimeString(),
                'property'   => ['id' => 3, 'title' => 'Arusha Modern Villa'],
                'user'       => ['first_name' => 'Mike', 'email' => 'mike.j@example.com']
            ]
        ];

        Log::info('📋 Returning sample leads: ' . count($sampleLeads));

        return response()->json([
            'data' => $sampleLeads,
            'pagination' => [
                'current_page' => 1,
                'last_page'    => 1,
                'per_page'     => 20,
                'total'        => count($sampleLeads),
            ],
        ]);
    }

    public function getLeadStats(): JsonResponse
    {
        $user = Auth::user();

        try {
            $totalLeads     = Lead::where('agent_id', $user->id)->count();
            $newLeads       = Lead::where('agent_id', $user->id)->where('created_at', '>=', now()->startOfDay())->count();
            $convertedLeads = Lead::where('agent_id', $user->id)->where('status', 'converted')->count();
            $conversionRate = $totalLeads > 0 ? ($convertedLeads / $totalLeads) * 100 : 0;

            return response()->json(['data' => [
                'total_leads'     => $totalLeads,
                'new_leads'       => $newLeads,
                'converted_leads' => $convertedLeads,
                'conversion_rate' => round($conversionRate, 1),
            ]]);
        } catch (\Exception $e) {
            Log::error('Failed to get lead stats: ' . $e->getMessage());
            return response()->json(['data' => [
                'total_leads'     => 0,
                'new_leads'       => 0,
                'converted_leads' => 0,
                'conversion_rate' => 0,
            ]]);
        }
    }

    private function getSampleStats(): JsonResponse
    {
        $sampleStats = [
            'total_leads'     => 15,
            'new_leads'       => 3,
            'converted_leads' => 8,
            'conversion_rate' => 53.3,
        ];

        Log::info('📊 Returning sample stats: ' . json_encode($sampleStats));

        return response()->json(['data' => $sampleStats]);
    }

    public function createLead(Request $request, Property $property): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name'    => 'required|string|max:255',
            'email'   => 'required|email|max:255',
            'phone'   => 'nullable|string|max:20',
            'message' => 'nullable|string|max:2000',
            'source'  => 'sometimes|string|max:50',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors'  => $validator->errors(),
            ], 422);
        }

        try {
            $lead = Lead::create([
                'agent_id'    => $property->agent_id,
                'property_id' => $property->id,
                'user_id'     => Auth::check() ? Auth::id() : null,
                'name'        => $request->name,
                'email'       => $request->email,
                'phone'       => $request->phone,
                'message'     => $request->message,
                'source'      => $request->source ?? 'website',
                'status'      => 'new',
            ]);

            Log::info('Lead created successfully', [
                'lead_id'     => $lead->id,
                'property_id' => $property->id,
                'agent_id'    => $property->agent_id,
                'name'        => $request->name,
                'email'       => $request->email,
            ]);

            return response()->json([
                'message' => 'Lead created successfully',
                'data'    => $lead->load('property'),
            ], 201);
        } catch (\Exception $e) {
            Log::error('Failed to create lead: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to create lead'], 500);
        }
    }

    public function updateLeadStatus(Request $request, Lead $lead): JsonResponse
    {
        $user = Auth::user();

        if ($lead->agent_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'status' => 'required|in:new,contacted,interested,converted,closed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors'  => $validator->errors(),
            ], 422);
        }

        try {
            $lead->update(['status' => $request->status]);

            Log::info('Lead status updated', [
                'lead_id'    => $lead->id,
                'old_status' => $lead->getOriginal('status'),
                'new_status' => $request->status,
                'agent_id'   => $user->id,
            ]);

            return response()->json([
                'message' => 'Lead status updated successfully',
                'data'    => $lead->load('property', 'user'),
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to update lead status: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to update lead status'], 500);
        }
    }

    public function getApplications(): JsonResponse
    {
        $user         = Auth::user();
        $applications = Application::with(['user', 'property'])
            ->whereHas('property', function ($query) use ($user) {
                $query->where('agent_id', $user->id);
            })
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json([
            'data' => $applications->items(),
            'pagination' => [
                'current_page' => $applications->currentPage(),
                'last_page'    => $applications->lastPage(),
                'per_page'     => $applications->perPage(),
                'total'        => $applications->total(),
            ],
        ]);
    }

    public function approveApplication(Request $request, Application $application): JsonResponse
    {
        $user = Auth::user();

        if ($application->property->agent_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($application->payment_status !== 'paid') {
            return response()->json(['message' => 'Site visit fee must be paid before approval'], 422);
        }

        $application->update(['status' => 'approved']);

        if (! $this->tenantTablesAvailable()) {
            return response()->json(['message' => 'Application approved successfully']);
        }

        $tenant = Tenant::firstOrCreate(
            ['user_id' => $application->user_id, 'property_id' => $application->property_id],
            ['move_in_date' => now(), 'status' => 'active']
        );

        $contractExists = Contract::where('tenant_id', $tenant->id)
            ->where('property_id', $application->property_id)
            ->exists();

        if (! $contractExists) {
            Contract::create([
                'tenant_id'   => $tenant->id,
                'property_id' => $application->property_id,
                'start_date'  => now(),
                'end_date'    => now()->addYear(),
                'rent_amount' => $application->property->price,
                'status'      => 'active',
                'terms'       => 'Standard rental agreement created from approved application',
            ]);
        }

        try {
            Notification::create([
                'user_id' => $tenant->user_id,
                'title'   => 'Application Approved!',
                'message' => "Your application for {$application->property->title} has been approved. You can now proceed with rent payments.",
                'type'    => 'application_approved',
            ]);
        } catch (\Exception $e) {
            \Log::warning('Failed to create application approval notification', [
                'error'          => $e->getMessage(),
                'application_id' => $application->id,
            ]);
        }

        return response()->json(['message' => 'Application approved successfully']);
    }

    public function rejectApplication(Request $request, Application $application): JsonResponse
    {
        $user = Auth::user();

        if ($application->property->agent_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $reason = $request->input('reason', 'Application rejected by agent');

        $application->update([
            'status'           => 'rejected',
            'rejection_reason' => $reason,
        ]);

        try {
            Notification::create([
                'user_id' => $application->user_id,
                'title'   => 'Application Rejected',
                'message' => "Your application for {$application->property->title} was rejected. Reason: {$reason}",
                'type'    => 'application_rejected',
            ]);
        } catch (\Exception $e) {
            \Log::warning('Failed to create application rejection notification', [
                'error'          => $e->getMessage(),
                'application_id' => $application->id,
            ]);
        }

        return response()->json(['message' => 'Application rejected successfully']);
    }

    private function tenantTablesAvailable(): bool
    {
        try {
            \Schema::hasTable('tenants') && \Schema::hasTable('contracts');
        } catch (\Exception $e) {
            return false;
        }
        return true;
    }

    public function getMyCommissions(): JsonResponse
    {
        if (! $this->commissionTablesAvailable()) {
            return $this->emptyPaginatedResponse();
        }

        $user        = Auth::user();
        $commissions = Commission::with(['property', 'payment'])
            ->where('agent_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json([
            'data' => $commissions->items(),
            'pagination' => [
                'current_page' => $commissions->currentPage(),
                'last_page'    => $commissions->lastPage(),
                'per_page'     => $commissions->perPage(),
                'total'        => $commissions->total(),
            ],
        ]);
    }

    public function getCommissionStats(): JsonResponse
    {
        if (! $this->commissionTablesAvailable()) {
            return response()->json(['data' => [
                'total_earned'        => 0,
                'pending_commissions' => 0,
                'paid_commissions'    => 0,
                'this_month'          => 0,
                'total_transactions'  => 0,
            ]]);
        }

        $user = Auth::user();

        return response()->json(['data' => [
            'total_earned'        => Commission::where('agent_id', $user->id)->sum('amount'),
            'pending_commissions' => Commission::where('agent_id', $user->id)->where('status', 'pending')->sum('amount'),
            'paid_commissions'    => Commission::where('agent_id', $user->id)->where('status', 'paid')->sum('amount'),
            'this_month'          => Commission::where('agent_id', $user->id)->whereMonth('created_at', now()->month)->sum('amount'),
            'total_transactions'  => Commission::where('agent_id', $user->id)->count(),
        ]]);
    }

    public function getPayoutHistory(): JsonResponse
    {
        if (! $this->commissionTablesAvailable()) {
            return $this->emptyPaginatedResponse();
        }

        $user    = Auth::user();
        $payouts = Commission::with(['property', 'payment'])
            ->where('agent_id', $user->id)
            ->where('status', 'paid')
            ->orderBy('paid_at', 'desc')
            ->paginate(20);

        return response()->json([
            'data' => $payouts->items(),
            'pagination' => [
                'current_page' => $payouts->currentPage(),
                'last_page'    => $payouts->lastPage(),
                'per_page'     => $payouts->perPage(),
                'total'        => $payouts->total(),
            ],
        ]);
    }

    public function getAnalytics(): JsonResponse
    {
        $user       = Auth::user();
        $properties = Property::where('agent_id', $user->id);

        return response()->json(['data' => [
            'performance_metrics' => [
                'total_properties'   => $properties->count(),
                'total_leads'        => $this->leadTablesAvailable() ? Lead::where('agent_id', $user->id)->count() : 0,
                'conversion_rate'    => $this->leadTablesAvailable() ? $this->calculateLeadConversionRate($user) : 0,
                'avg_property_value' => $properties->avg('price') ?: 0,
            ],
            'revenue_metrics' => [
                'total_commissions'         => $this->commissionTablesAvailable() ? Commission::where('agent_id', $user->id)->sum('amount') : 0,
                'monthly_trend'             => $this->commissionTablesAvailable() ? $this->getMonthlyCommissionTrend($user) : [],
                'top_performing_properties' => $this->getTopPerformingProperties($user),
            ],
        ]]);
    }

    public function getMessages(): JsonResponse
    {
        if (! $this->messageTablesAvailable()) {
            return response()->json([
                'data' => [
                    'messages'          => [],
                    'recipient_options' => [],
                ],
                'pagination' => [
                    'current_page' => 1,
                    'last_page'    => 1,
                    'per_page'     => 50,
                    'total'        => 0,
                ],
            ]);
        }

        $user     = Auth::user();
        $ownerIds = $this->linkedOwnerIds($user->id);

        $messages = Message::with(['sender', 'recipient', 'property'])
            ->where(function ($q) use ($user) {
                $q->where('sender_id', $user->id)
                  ->orWhere('receiver_id', $user->id);
            })
            ->where(function ($q) use ($user, $ownerIds) {
                $q->whereHas('property', function ($pq) use ($user) {
                    $pq->where('agent_id', $user->id);
                });

                if ($ownerIds->isNotEmpty()) {
                    $q->orWhere(function ($inner) use ($ownerIds) {
                        $inner->whereNull('property_id')
                              ->where(function ($p) use ($ownerIds) {
                                  $p->whereIn('sender_id', $ownerIds)
                                    ->orWhereIn('receiver_id', $ownerIds);
                              });
                    });
                }
            })
            ->orderBy('created_at', 'desc')
            ->paginate(50);

        Message::where('receiver_id', $user->id)
            ->whereNull('read_at')
            ->whereIn('id', collect($messages->items())->pluck('id'))
            ->update(['read_at' => now()]);

        return response()->json([
            'data' => [
                'messages' => array_map(function ($message) use ($user) {
                    $direction = $message->sender_id === $user->id ? 'sent' : 'received';

                    return [
                        'id'           => $message->id,
                        'sender_id'    => $message->sender_id,
                        'receiver_id'  => $message->receiver_id,
                        'property_id'  => $message->property_id,
                        'subject'      => $message->subject,
                        'body'         => $message->body,
                        'read_at'      => $message->read_at,
                        'created_at'   => $message->created_at,
                        'sender'       => $message->sender,
                        'recipient'    => $message->recipient,
                        'property'     => $message->property,
                        'direction'    => $direction,
                        'counterparty' => $direction === 'sent' ? $message->recipient : $message->sender,
                    ];
                }, $messages->items()),
                'recipient_options' => $this->linkedOwnerOptions($user->id),
            ],
            'pagination' => [
                'current_page' => $messages->currentPage(),
                'last_page'    => $messages->lastPage(),
                'per_page'     => $messages->perPage(),
                'total'        => $messages->total(),
            ],
        ]);
    }

    public function sendMessage(Request $request): JsonResponse
    {
        if (! $this->messageTablesAvailable()) {
            return response()->json(['message' => 'Messaging is unavailable until supporting tables are migrated'], 503);
        }

        $validator = Validator::make($request->all(), [
            'receiver_id' => 'required|exists:users,id',
            'property_id' => 'nullable|exists:properties,id',
            'subject'     => 'nullable|string|max:255',
            'body'        => 'required|string|max:5000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors'  => $validator->errors(),
            ], 422);
        }

        $user        = Auth::user();
        $recipientId = (int) $request->receiver_id;
        $propertyId  = $request->property_id ? (int) $request->property_id : null;

        $propertyQuery = Property::where('agent_id', $user->id)
            ->where('owner_id', $recipientId);

        if ($propertyId) {
            $propertyQuery->where('id', $propertyId);
        }

        $property = $propertyQuery->first();
        if (! $property) {
            return response()->json(['message' => 'Recipient must be one of your linked owners'], 422);
        }

        $message = Message::create([
            'sender_id'   => $user->id,
            'receiver_id' => $recipientId,
            'property_id' => $property->id,
            'subject'     => $request->subject,
            'body'        => $request->body,
        ])->load(['sender', 'recipient', 'property']);

        return response()->json([
            'message' => 'Message sent successfully',
            'data'    => $message,
        ], 201);
    }

    // ── Notifications ─────────────────────────────────────────────────────────

    public function getAgentNotifications(): JsonResponse
    {
        return response()->json(['data' => []]);
    }

    public function notifyAgent(Request $request): JsonResponse
    {
        return response()->json(['message' => 'Notification sent']);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private function calculateConversionRate(Property $property): float
    {
        $applications = Application::where('property_id', $property->id)->count();
        $views        = $property->views ?? 1;

        return $views > 0 ? round(($applications / $views) * 100, 2) : 0;
    }

    private function calculateLeadConversionRate(User $user): float
    {
        if (! $this->leadTablesAvailable()) {
            return 0;
        }

        $totalLeads     = Lead::where('agent_id', $user->id)->count();
        $convertedLeads = Application::whereHas('property', function ($query) use ($user) {
            $query->where('agent_id', $user->id);
        })->count();

        return $totalLeads > 0 ? round(($convertedLeads / $totalLeads) * 100, 2) : 0;
    }

    private function getMonthlyCommissionTrend(User $user): array
    {
        return Commission::where('agent_id', $user->id)
            ->get()
            ->groupBy(fn ($c) => optional($c->created_at)->format('M'))
            ->map(fn ($items, $month) => [
                'month'  => $month,
                'amount' => $items->sum('amount'),
                'count'  => $items->count(),
            ])
            ->values()
            ->toArray();
    }

    private function getTopPerformingProperties(User $user): array
    {
        return Property::where('agent_id', $user->id)
            ->withCount('applications')
            ->orderBy('applications_count', 'desc')
            ->limit(5)
            ->get()
            ->map(fn ($property) => [
                'id'           => $property->id,
                'title'        => $property->title,
                'applications' => $property->applications_count,
                'leads'        => $this->leadTablesAvailable()
                    ? Lead::where('agent_id', $user->id)->where('property_id', $property->id)->count()
                    : 0,
                'price'        => $property->price,
            ])
            ->toArray();
    }

    private function linkedOwnerIds(int $agentId)
    {
        return Property::where('agent_id', $agentId)
            ->pluck('owner_id')
            ->filter()
            ->unique()
            ->values();
    }

    private function linkedOwnerOptions(int $agentId): array
    {
        return Property::with('owner')
            ->where('agent_id', $agentId)
            ->get()
            ->filter(fn ($p) => $p->owner !== null)
            ->map(fn ($property) => [
                'receiver_id'    => $property->owner->id,
                'receiver_name'  => trim($property->owner->first_name . ' ' . $property->owner->last_name),
                'receiver_email' => $property->owner->email,
                'property_id'    => $property->id,
                'property_title' => $property->title,
            ])
            ->unique(fn ($item) => $item['receiver_id'] . '-' . $item['property_id'])
            ->values()
            ->toArray();
    }

    private function leadTablesAvailable(): bool
    {
        return Schema::hasTable('leads') && class_exists(Lead::class);
    }

    private function commissionTablesAvailable(): bool
    {
        return Schema::hasTable('commissions') && class_exists(Commission::class);
    }

    private function messageTablesAvailable(): bool
    {
        return Schema::hasTable('messages') && class_exists(Message::class);
    }

    private function emptyPaginatedResponse(int $perPage = 20): JsonResponse
    {
        return response()->json([
            'data' => [],
            'pagination' => [
                'current_page' => 1,
                'last_page'    => 1,
                'per_page'     => $perPage,
                'total'        => 0,
            ],
        ]);
    }
}
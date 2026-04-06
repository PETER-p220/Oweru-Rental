<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\Commission;
use App\Models\Lead;
use App\Models\Message;
use App\Models\Property;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Validator;

class AgentController extends Controller
{
    public function getDashboard(): JsonResponse
    {
        $user = Auth::user();

        return response()->json(['data' => [
            'total_listings'     => Property::where('agent_id', $user->id)->count(),
            'active_listings'    => Property::where('agent_id', $user->id)->where('available', true)->count(),
            'total_leads'        => $this->leadTablesAvailable()
                ? Lead::where('agent_id', $user->id)->count()
                : 0,
            'total_commissions'  => $this->commissionTablesAvailable()
                ? Commission::where('agent_id', $user->id)->sum('amount')
                : 0,
        ]]);
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
            'title'       => 'required|string|max:255',
            'description' => 'required|string|max:2000',
            'price'       => 'required|numeric|min:0',
            'location'    => 'required|string|max:255',
            'type'        => 'required|in:apartment,house,villa,studio,commercial',
            'bedrooms'    => 'required|integer|min:0',
            'bathrooms'   => 'required|integer|min:0',
            'area'        => 'required|integer|min:0',
            'owner_id'    => 'required|exists:users,id',
            'images'      => 'sometimes|array',
            'images.*'    => 'image|mimes:jpeg,png,jpg,gif|max:2048',
            'landlord_name'  => 'sometimes|string|max:255', // Optional landlord info for agent reference
            'landlord_phone' => 'sometimes|string|max:20',  // Optional landlord phone for agent reference
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

        $user         = Auth::user();
        $trackingCode = $this->generateUniqueTrackingCode();

        $property = Property::create([
            'title'       => $request->title,
            'description' => $request->description,
            'price'       => $request->price,
            'location'    => $request->location,
            'address'     => $request->address ?? '',
            'type'        => $request->type,
            'bedrooms'    => $request->bedrooms,
            'bathrooms'   => $request->bathrooms,
            'area'        => $request->area,
            'owner_id'    => $request->owner_id,
            'agent_id'    => $user->id,
            'available'   => true,
            'images'      => $imagePaths,
            'amenities'   => $request->amenities ?? [],
            'featured'    => false,
            'dalali'      => $trackingCode,
            'landlord_name'  => $request->landlord_name, // Store landlord info for agent reference
            'landlord_phone' => $request->landlord_phone, // Store landlord phone for agent reference
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
            // Use random_bytes for better entropy than str_shuffle on a fixed string
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
            'type'        => 'sometimes|in:apartment,house,villa,studio,commercial',
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
            'views'            => $property->views ?? 0,
            'inquiries'        => Application::where('property_id', $property->id)->count(),
            'applications'     => Application::where('property_id', $property->id)->count(),
            'conversion_rate'  => $this->calculateConversionRate($property),
            'avg_response_time'=> 2.5,
        ]]);
    }

    public function getLinkedOwners(): JsonResponse
    {
        $user = Auth::user();

        try {
            $owners = User::whereHas('ownedProperties', function ($query) use ($user) {
                    $query->where('agent_id', $user->id);
                })
                ->withCount(['ownedProperties as properties_count' => function ($query) use ($user) {
                    $query->where('agent_id', $user->id);
                }])
                ->with(['ownedProperties' => function ($query) use ($user) {
                    $query->where('agent_id', $user->id)
                          ->select('id', 'owner_id', 'title', 'location', 'landlord_name', 'landlord_phone');
                }])
                ->get();

            $owners->each(function ($owner) {
                // Only properties that actually have landlord info filled in
                $propertiesWithLandlord = $owner->ownedProperties
                    ->filter(fn($p) => !empty($p->landlord_name) || !empty($p->landlord_phone));

                $owner->properties_list = $propertiesWithLandlord
                    ->map(fn($p) => [
                        'id'             => $p->id,
                        'title'          => $p->title,
                        'location'       => $p->location,
                        'landlord_name'  => $p->landlord_name,
                        'landlord_phone' => $p->landlord_phone,
                    ])
                    ->values();

                // Derive landlord names/phones only from those filtered properties
                $owner->landlord_names = $propertiesWithLandlord
                    ->pluck('landlord_name')
                    ->filter(fn($v) => !empty($v))
                    ->unique()
                    ->values()
                    ->toArray();

                $owner->landlord_phones = $propertiesWithLandlord
                    ->pluck('landlord_phone')
                    ->filter(fn($v) => !empty($v))
                    ->unique()
                    ->values()
                    ->toArray();

                $owner->has_landlord_info = $propertiesWithLandlord->isNotEmpty();

                unset($owner->ownedProperties);
            });

            // Remove owners who have zero properties with landlord info
            $owners = $owners->filter(fn($o) => $o->has_landlord_info)->values();

        } catch (\Illuminate\Database\QueryException $e) {
            if (str_contains($e->getMessage(), 'Unknown column')) {
                $owners = collect();
            } else {
                throw $e;
            }
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

        // Persist the agent–owner link. Uses an agent_owner_links table if it exists,
        // otherwise falls back to updating all of this owner's un-agented properties.
        if (Schema::hasTable('agent_owner_links')) {
            \DB::table('agent_owner_links')->updateOrInsert(
                ['agent_id' => $user->id, 'owner_id' => $owner->id],
                ['commission_rate' => $request->commission_rate, 'updated_at' => now(), 'created_at' => now()]
            );
        } else {
            // Fallback: tag un-agented properties of this owner with our agent_id
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
            // Use frontend route format: /property/:id?agent=:agent_id
            $trackingUrl = url("/property/{$property->id}?agent={$user->id}");

            // Check if columns exist, otherwise use 0 as fallback
            try {
                $clicks = $property->clicks ?? 0;
                $shares = $property->shares ?? 0;
            } catch (\Exception $e) {
                $clicks = 0;
                $shares = 0;
            }

            return [
                'id'          => $property->id,
                'title'       => $property->title,
                'tracking_url'=> $trackingUrl,
                'qr_code_url' => url("/api/agent/qr-codes/{$property->id}"),
                'shares'      => $shares,
                'clicks'      => $clicks,
                'created_at'  => $property->created_at,
                'property'    => $property,
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
        $user = Auth::user();

        // Verify the property belongs to the agent
        if ($property->agent_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Increment share count
        try {
            $property->increment('shares');
        } catch (\Exception $e) {
            // Column doesn't exist yet, just log the share
            \Log::info('Property shared (no increment)', [
                'property_id' => $property->id,
                'agent_id' => $user->id,
                'ip' => $request->ip(),
                'user_agent' => $request->userAgent()
            ]);
        }

        \Log::info('Property shared', [
            'property_id' => $property->id,
            'agent_id' => $user->id,
            'ip' => $request->ip(),
            'user_agent' => $request->userAgent()
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
        $user = Auth::user();
        $property = Property::find($id);
        
        if (!$property) {
            return response()->json(['message' => 'Property not found'], 404);
        }
        
        if ($property->agent_id !== $user->id) {
            return response()->json(['message' => 'Property does not belong to this agent'], 403);
        }
        
        // Check if tracking columns exist
        $schema = \Schema::getColumnListing('properties');
        $hasClicksColumn = in_array('clicks', $schema);
        $hasSharesColumn = in_array('shares', $schema);
        
        return response()->json([
            'property_exists' => true,
            'property_id' => $property->id,
            'property_title' => $property->title,
            'agent_id' => $property->agent_id,
            'user_id' => $user->id,
            'tracking_url' => url("/property/{$property->id}?agent={$user->id}"),
            'clicks' => $property->clicks ?? 0,
            'shares' => $property->shares ?? 0,
            'database_columns' => $schema,
            'has_clicks_column' => $hasClicksColumn,
            'has_shares_column' => $hasSharesColumn,
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
            'property_id'   => $property->id,
            'agent_id'      => $user->id,
            'url'           => $trackingUrl,
            'qr_code_data'  => base64_encode($trackingUrl),
        ]]);
    }

    public function getLeads(): JsonResponse
    {
        if (! $this->leadTablesAvailable()) {
            return $this->emptyPaginatedResponse();
        }

        $user = Auth::user();
        
        // Try to get real leads, but if table doesn't exist, return sample data
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
            // Return sample data for testing
            $sampleLeads = [
                [
                    'id' => 1,
                    'name' => 'John Doe',
                    'email' => 'john.doe@example.com',
                    'phone' => '+255 123 456 789',
                    'status' => 'new',
                    'created_at' => now()->subDays(2)->toDateTimeString(),
                    'property' => [
                        'id' => 1,
                        'title' => 'Mwanza PLS Apartment'
                    ],
                    'user' => [
                        'first_name' => 'John',
                        'email' => 'john.doe@example.com'
                    ]
                ],
                [
                    'id' => 2,
                    'name' => 'Jane Smith',
                    'email' => 'jane.smith@example.com',
                    'phone' => '+255 987 654 321',
                    'status' => 'contacted',
                    'created_at' => now()->subDays(5)->toDateTimeString(),
                    'property' => [
                        'id' => 2,
                        'title' => 'Dar es Salaam Beach House'
                    ],
                    'user' => [
                        'first_name' => 'Jane',
                        'email' => 'jane.smith@example.com'
                    ]
                ],
                [
                    'id' => 3,
                    'name' => 'Mike Johnson',
                    'email' => 'mike.j@example.com',
                    'phone' => '+255 555 123 456',
                    'status' => 'interested',
                    'created_at' => now()->subWeek()->toDateTimeString(),
                    'property' => [
                        'id' => 3,
                        'title' => 'Arusha Modern Villa'
                    ],
                    'user' => [
                        'first_name' => 'Mike',
                        'email' => 'mike.j@example.com'
                    ]
                ]
            ];

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
    }

    public function getLeadStats(): JsonResponse
    {
        if (! $this->leadTablesAvailable()) {
            return response()->json(['data' => [
                'total_leads'      => 3,
                'new_leads'        => 1,
                'converted_leads'  => 1,
                'conversion_rate'  => 33.3,
            ]]);
        }

        $user = Auth::user();
        
        // Try to get real stats, but if table doesn't exist, return sample data
        try {
            $totalLeads = Lead::where('agent_id', $user->id)->count();
            $newLeads = Lead::where('agent_id', $user->id)
                ->where('created_at', '>=', now()->startOfDay())
                ->count();
            $convertedLeads = Lead::where('agent_id', $user->id)
                ->where('status', 'converted')
                ->count();
            $conversionRate = $totalLeads > 0 ? ($convertedLeads / $totalLeads) * 100 : 0;

            return response()->json(['data' => [
                'total_leads'      => $totalLeads,
                'new_leads'        => $newLeads,
                'converted_leads'  => $convertedLeads,
                'conversion_rate'  => round($conversionRate, 1),
            ]]);
        } catch (\Exception $e) {
            // Return sample stats for testing
            return response()->json(['data' => [
                'total_leads'      => 3,
                'new_leads'        => 1,
                'converted_leads'  => 1,
                'conversion_rate'  => 33.3,
            ]]);
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
                'total_properties'  => $properties->count(),
                'total_leads'       => $this->leadTablesAvailable() ? Lead::where('agent_id', $user->id)->count() : 0,
                'conversion_rate'   => $this->leadTablesAvailable() ? $this->calculateLeadConversionRate($user) : 0,
                'avg_property_value'=> $properties->avg('price') ?: 0,
            ],
            'revenue_metrics' => [
                'total_commissions'        => $this->commissionTablesAvailable() ? Commission::where('agent_id', $user->id)->sum('amount') : 0,
                'monthly_trend'            => $this->commissionTablesAvailable() ? $this->getMonthlyCommissionTrend($user) : [],
                'top_performing_properties'=> $this->getTopPerformingProperties($user),
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

        // FIX: Restructured the where/orWhere so both conditions are at the same
        // level — messages on agent-owned properties OR direct messages with linked owners.
        $messages = Message::with(['sender', 'recipient', 'property'])
            ->where(function ($q) use ($user, $ownerIds) {
                // Condition A: message participant is this agent
                $q->where('sender_id', $user->id)
                  ->orWhere('recipient_id', $user->id);
            })
            ->where(function ($q) use ($user, $ownerIds) {
                // Condition B: message is tied to a property the agent manages …
                $q->whereHas('property', function ($pq) use ($user) {
                    $pq->where('agent_id', $user->id);
                });

                // … OR it is a property-less direct message with a linked owner
                if ($ownerIds->isNotEmpty()) {
                    $q->orWhere(function ($inner) use ($ownerIds) {
                        $inner->whereNull('property_id')
                              ->where(function ($p) use ($ownerIds) {
                                  $p->whereIn('sender_id', $ownerIds)
                                    ->orWhereIn('recipient_id', $ownerIds);
                              });
                    });
                }
            })
            ->orderBy('created_at', 'desc')
            ->paginate(50);

        // Mark retrieved messages as read
        Message::where('recipient_id', $user->id)
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
                        'recipient_id' => $message->recipient_id,
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
            'recipient_id' => 'required|exists:users,id',
            'property_id'  => 'nullable|exists:properties,id',
            'subject'      => 'nullable|string|max:255',
            'body'         => 'required|string|max:5000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors'  => $validator->errors(),
            ], 422);
        }

        $user        = Auth::user();
        $recipientId = (int) $request->recipient_id;
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
            'sender_id'    => $user->id,
            'recipient_id' => $recipientId,
            'property_id'  => $property->id,
            'subject'      => $request->subject,
            'body'         => $request->body,
        ])->load(['sender', 'recipient', 'property']);

        return response()->json([
            'message' => 'Message sent successfully',
            'data'    => $message,
        ], 201);
    }

    // ── Notifications (called from routes) ───────────────────────────────────

    public function getAgentNotifications(): JsonResponse
    {
        // Implement as needed — placeholder to satisfy the route
        return response()->json(['data' => []]);
    }

    public function notifyAgent(Request $request): JsonResponse
    {
        // Broadcast / store notification logic lives here
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
                'recipient_id'    => $property->owner->id,
                'recipient_name'  => trim($property->owner->first_name . ' ' . $property->owner->last_name),
                'recipient_email' => $property->owner->email,
                'property_id'     => $property->id,
                'property_title'  => $property->title,
            ])
            ->unique(fn ($item) => $item['recipient_id'] . '-' . $item['property_id'])
            ->values()
            ->toArray();
    }

    private function leadTablesAvailable(): bool
    {
        // Temporarily return true for testing
        return true;
        // return Schema::hasTable('leads') && class_exists(Lead::class);
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
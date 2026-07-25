<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Property;
use App\Models\Application;
use App\Models\Contract;
use App\Models\DigitalContract;
use App\Models\Payment;
use App\Models\Tenant;
use App\Models\Message;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Validator;
use App\Models\Notification;

class OwnerController extends Controller
{
    // Dashboard
    public function getDashboard(): JsonResponse
    {
        $user = Auth::user();
        $properties = Property::where('owner_id', $user->id);

        if (! $this->landlordSupportTablesAvailable()) {
            return response()->json(['data' => [
                'total_properties' => $properties->count(),
                'active_tenants'   => 0,
                'monthly_revenue'  => 0,
                'total_revenue'    => 0,
                'occupancy_rate'   => $this->calculateOccupancyRate($user),
            ]]);
        }

        $stats = [
            'total_properties' => $properties->count(),
            'active_tenants'   => Tenant::whereHas('contract', function ($query) use ($user) {
                $query->whereHas('property', fn($q) => $q->where('owner_id', $user->id))
                      ->where('status', 'active');
            })->count(),
            'monthly_revenue' => Payment::whereHas('property', fn($q) => $q->where('owner_id', $user->id))
                ->whereMonth('created_at', now()->month)->sum('amount'),
            'total_revenue'   => Payment::whereHas('property', fn($q) => $q->where('owner_id', $user->id))
                ->sum('amount'),
            'occupancy_rate'  => $this->calculateOccupancyRate($user),
        ];

        return response()->json(['data' => $stats]);
    }

    // Properties Management
    public function getMyProperties(): JsonResponse
    {
        $user = Auth::user();

        $properties = Property::with(['agent', 'applications'])
            ->where('owner_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->paginate(12);

        return response()->json([
            'data' => $properties->items(),
            'pagination' => [
                'current_page' => $properties->currentPage(),
                'last_page'    => $properties->lastPage(),
                'per_page'     => $properties->perPage(),
                'total'        => $properties->total(),
            ]
        ]);
    }

    public function showProperty(Property $property): JsonResponse
    {
        $user = Auth::user();

        if ($property->owner_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json([
            'data' => $property->load('agent'),
        ]);
    }

    public function createProperty(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'title'       => 'required|string|max:255',
            'description' => 'required|string|max:2000',
            'price'       => 'required|numeric|min:0',
            'payment_duration_months' => 'required|integer|in:1,3,6,12',
            'location'    => 'required|string|max:255',
            'type'        => 'sometimes|in:Master-bedroom,house,Single-room',
            'bedrooms'    => 'required|integer|min:0',
            'bathrooms'   => 'required|integer|min:0',
            'area'        => 'sometimes|integer|min:0',
            'agent_id'    => 'sometimes|exists:users,id',
            'images'      => 'sometimes|array',
            'images.*'    => 'image|mimes:jpeg,png,jpg,gif|max:5048',
            'videos'      => 'sometimes|array',
            'videos.*'    => 'file|mimes:mp4,webm,mov,avi|max:51200',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors'  => $validator->errors()
            ], 422);
        }

        $user = Auth::user();

        $imagePaths = [];
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $image) {
                $path = $image->store('properties', 'public');
                $imagePaths[] = $path;
            }
        }

        $videoPaths = [];
        if ($request->hasFile('videos')) {
            $directory = public_path('storage/properties/videos');
            if (! is_dir($directory)) {
                mkdir($directory, 0755, true);
            }
            foreach ($request->file('videos') as $video) {
                $videoName = time().'_'.uniqid().'.'.$video->getClientOriginalExtension();
                $video->move($directory, $videoName);
                $videoPaths[] = 'storage/properties/videos/'.$videoName;
            }
        }

        $property = Property::create([
            'title'       => $request->title,
            'description' => $request->description,
            'price'       => $request->price,
            'payment_duration_months' => (int) $request->input('payment_duration_months', 1),
            'location'    => $request->location,
            'address'     => $request->address ?? '',
            'type'        => $request->type,
            'bedrooms'    => $request->bedrooms,
            'bathrooms'   => $request->bathrooms,
            'area'        => $request->area,
            'images'      => $imagePaths,
            'videos'      => $videoPaths,
            'amenities'   => $request->amenities ?? [],
            'featured'    => $request->boolean('featured', false),
            'available'   => true,
            'owner_id'    => $user->id,
            'agent_id'    => $request->agent_id,
        ]);

        return response()->json([
            'message' => 'Property created successfully',
            'data'    => $property->load('agent')
        ], 201);
    }

    public function updateProperty(Request $request, Property $property): JsonResponse
    {
        $user = Auth::user();

        if ($property->owner_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'title'       => 'sometimes|string|max:255',
            'description' => 'sometimes|string|max:2000',
            'price'       => 'sometimes|numeric|min:0',
            'payment_duration_months' => 'sometimes|integer|in:1,3,6,12',
            'location'    => 'sometimes|string|max:255',
            'address'     => 'sometimes|string|max:500',
            'type'        => 'sometimes|in:Master-bedroom,house,Single-room',
            'bedrooms'    => 'sometimes|integer|min:0',
            'bathrooms'   => 'sometimes|integer|min:0',
            'area'        => 'sometimes|integer|min:0',
            'available'   => 'sometimes|boolean',
            'featured'    => 'sometimes|boolean',
            'amenities'   => 'sometimes|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors'  => $validator->errors()
            ], 422);
        }

        $property->update($request->only([
            'title', 'description', 'price', 'payment_duration_months', 'location', 'address', 'type',
            'bedrooms', 'bathrooms', 'area', 'available', 'featured', 'amenities',
        ]));

        return response()->json([
            'message' => 'Property updated successfully',
            'data'    => $property->load('agent')
        ]);
    }

    public function deleteProperty(Property $property): JsonResponse
    {
        $user = Auth::user();

        if ($property->owner_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $property->delete();

        return response()->json(['message' => 'Property deleted successfully']);
    }

    public function getPropertyAnalytics(Property $property): JsonResponse
    {
        $user = Auth::user();

        if ($property->owner_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if (! $this->paymentsTableAvailable()) {
            return response()->json(['data' => [
                'views'                    => $property->views ?? 0,
                'inquiries'                => Application::where('property_id', $property->id)->count(),
                'applications'             => Application::where('property_id', $property->id)->count(),
                'conversion_rate'          => $this->calculateConversionRate($property),
                'revenue'                  => 0,
                'occupancy_rate'           => $this->calculatePropertyOccupancyRate($property),
                'avg_rent_collection_time' => $this->calculateAvgRentCollectionTime($property),
            ]]);
        }

        $analytics = [
            'views'                    => $property->views ?? 0,
            'inquiries'                => Application::where('property_id', $property->id)->count(),
            'applications'             => Application::where('property_id', $property->id)->count(),
            'conversion_rate'          => $this->calculateConversionRate($property),
            'revenue'                  => Payment::where('property_id', $property->id)->sum('amount'),
            'occupancy_rate'           => $this->calculatePropertyOccupancyRate($property),
            'avg_rent_collection_time' => $this->calculateAvgRentCollectionTime($property),
        ];

        return response()->json(['data' => $analytics]);
    }

    // Applications Management
    public function getApplications(): JsonResponse
    {
        $user = Auth::user();
        $applications = Application::with(['user', 'property'])
            ->whereHas('property', fn($q) => $q->where('owner_id', $user->id))
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json([
            'data' => $applications->items(),
            'pagination' => [
                'current_page' => $applications->currentPage(),
                'last_page'    => $applications->lastPage(),
                'per_page'     => $applications->perPage(),
                'total'        => $applications->total(),
            ]
        ]);
    }

    public function approveApplication(Request $request, Application $application): JsonResponse
    {
        $user = Auth::user();

        if ($application->property->owner_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $application->update(['status' => 'approved']);

        if (! $this->tenantTablesAvailable()) {
            return response()->json(['message' => 'Application approved successfully']);
        }

        $tenant = Tenant::firstOrCreate(
            [
                'user_id'     => $application->user_id,
                'property_id' => $application->property_id,
            ],
            [
                'move_in_date' => now(),
                'status'       => 'active',
            ]
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

        // Silent notification
        if (class_exists(Notification::class)) {
            try {
                Notification::create([
                    'user_id' => $tenant->user_id,
                    'title'   => 'Application Approved!',
                    'message' => "Your rental application for {$application->property->title} has been approved.",
                    'type'    => 'application_approved',
                    'is_read' => false,
                ]);
            } catch (\Exception $e) {
                // Silent fail
            }
        }

        return response()->json([
            'message'   => 'Application approved successfully',
            'tenant_id' => $tenant->id,
        ]);
    }

    public function rejectApplication(Request $request, Application $application): JsonResponse
    {
        $user = Auth::user();

        if ($application->property->owner_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'rejection_reason' => 'required|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors'  => $validator->errors()
            ], 422);
        }

        $application->update([
            'status'           => 'rejected',
            'rejection_reason' => $request->rejection_reason,
        ]);

        return response()->json(['message' => 'Application rejected successfully']);
    }

    // Tenants Management
    public function getMyTenants(): JsonResponse
    {
        if (! $this->tenantTablesAvailable()) {
            return $this->emptyPaginatedResponse();
        }

        $user = Auth::user();

        $tenants = Tenant::with(['user', 'property', 'contract', 'digitalContracts', 'application'])
            ->whereHas('property', fn($q) => $q->where('owner_id', $user->id))
            ->where(function ($query) {
                $query->whereHas('contract', fn($q) => $q->where('status', 'active'))
                      ->orWhereHas('digitalContracts');
            })
            ->paginate(20);

        return response()->json([
            'data' => $tenants->items(),
            'pagination' => [
                'current_page' => $tenants->currentPage(),
                'last_page'    => $tenants->lastPage(),
                'per_page'     => $tenants->perPage(),
                'total'        => $tenants->total(),
            ]
        ]);
    }

    public function createTenantFromApprovedApplication(): JsonResponse
    {
        $user = Auth::user();

        $approvedApplications = Application::with(['user', 'property'])
            ->where('status', 'approved')
            ->whereHas('property', fn($q) => $q->where('owner_id', $user->id))
            ->get();

        $createdTenants = [];

        foreach ($approvedApplications as $application) {
            $tenant = Tenant::firstOrCreate(
                [
                    'user_id'     => $application->user_id,
                    'property_id' => $application->property_id,
                ],
                [
                    'move_in_date' => now(),
                    'status'       => 'active',
                ]
            );

            $contractExists = Contract::where('tenant_id', $tenant->id)
                ->where('property_id', $application->property_id)
                ->exists();

            if (! $contractExists) {
                Contract::create([
                    'tenant_id'   => $tenant->id,
                    'property_id' => $application->property_id,
                    'start_date'  => now(),
                    'end_date'    => null,
                    'rent_amount' => $application->property->price,
                    'status'      => 'active',
                    'terms'       => 'Standard rental agreement created from approved application',
                ]);
            }

            $createdTenants[] = [
                'tenant_id'      => $tenant->id,
                'user_name'      => $application->user->first_name . ' ' . $application->user->last_name,
                'property_title' => $application->property->title,
                'was_new'        => $tenant->wasRecentlyCreated,
            ];
        }

        return response()->json([
            'message'         => 'Synced ' . count($createdTenants) . ' tenant records from approved applications',
            'tenants_created' => $createdTenants,
        ]);
    }

    // Contracts Management
    public function getContracts(): JsonResponse
    {
        if (! $this->tenantTablesAvailable()) {
            return $this->emptyPaginatedResponse();
        }

        $user = Auth::user();
        $contracts = Contract::with(['tenant.user', 'property'])
            ->whereHas('property', fn($q) => $q->where('owner_id', $user->id))
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json([
            'data' => $contracts->items(),
            'pagination' => [
                'current_page' => $contracts->currentPage(),
                'last_page'    => $contracts->lastPage(),
                'per_page'     => $contracts->perPage(),
                'total'        => $contracts->total(),
            ]
        ]);
    }

    public function createContract(Request $request): JsonResponse
    {
        if (! $this->tenantTablesAvailable()) {
            return response()->json(['message' => 'Contracts are unavailable until landlord tables are migrated'], 503);
        }

        $validator = Validator::make($request->all(), [
            'tenant_id'   => 'required|exists:tenants,id',
            'property_id' => 'required|exists:properties,id',
            'start_date'  => 'required|date',
            'end_date'    => 'required|date|after:start_date',
            'rent_amount' => 'required|numeric|min:0',
            'terms'       => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors'  => $validator->errors()
            ], 422);
        }

        $user = Auth::user();
        $property = Property::findOrFail($request->property_id);

        if ($property->owner_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $contract = Contract::create([
            'tenant_id'   => $request->tenant_id,
            'property_id' => $request->property_id,
            'start_date'  => $request->start_date,
            'end_date'    => $request->end_date,
            'rent_amount' => $request->rent_amount,
            'terms'       => $request->terms,
            'status'      => 'active',
        ]);

        return response()->json([
            'message' => 'Contract created successfully',
            'data'    => $contract->load(['tenant.user', 'property'])
        ], 201);
    }

    // Rent Collection
    private function rentPaymentTypes(): array
    {
        return ['rent', 'first_month_rent', 'monthly_rent', 'rent_payment'];
    }

    public function getRentCollection(): JsonResponse
    {
        if (! $this->paymentsTableAvailable()) {
            return $this->emptyPaginatedResponse();
        }

        $user = Auth::user();
        $payments = Payment::with(['tenant.user', 'user', 'property'])
            ->whereHas('property', fn($q) => $q->where('owner_id', $user->id))
            ->whereIn('type', $this->rentPaymentTypes())
            ->orderByRaw('COALESCE(paid_at, created_at) DESC')
            ->paginate(20);

        return response()->json([
            'data' => collect($payments->items())->map(fn (Payment $p) => $this->formatOwnerPayment($p))->values(),
            'pagination' => [
                'current_page' => $payments->currentPage(),
                'last_page'    => $payments->lastPage(),
                'per_page'     => $payments->perPage(),
                'total'        => $payments->total(),
            ]
        ]);
    }

    public function getRentCollectionStats(): JsonResponse
    {
        if (! $this->paymentsTableAvailable()) {
            return response()->json(['data' => [
                'total_collected'  => 0,
                'this_month'       => 0,
                'pending_payments' => 0,
                'collection_rate'  => 0,
            ]]);
        }

        $user = Auth::user();
        $base = Payment::whereHas('property', fn($q) => $q->where('owner_id', $user->id))
            ->whereIn('type', $this->rentPaymentTypes());

        $stats = [
            'total_collected'  => (clone $base)->whereIn('status', ['completed', 'paid'])->sum('amount'),
            'this_month'       => (clone $base)->whereIn('status', ['completed', 'paid'])
                ->where(function ($q) {
                    $q->whereMonth('paid_at', now()->month)->whereYear('paid_at', now()->year)
                        ->orWhere(function ($q2) {
                            $q2->whereNull('paid_at')
                                ->whereMonth('created_at', now()->month)
                                ->whereYear('created_at', now()->year);
                        });
                })
                ->sum('amount'),
            'pending_payments' => (clone $base)->whereIn('status', ['pending', 'processing'])->count(),
            'collection_rate'  => $this->calculateCollectionRate($user),
        ];

        return response()->json(['data' => $stats]);
    }

    public function getReceipts(): JsonResponse
    {
        if (! $this->paymentsTableAvailable()) {
            return $this->emptyPaginatedResponse();
        }

        $user = Auth::user();
        $payments = Payment::with(['tenant.user', 'property'])
            ->whereHas('property', fn($q) => $q->where('owner_id', $user->id))
            ->where('status', 'completed')
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json([
            'data' => $payments->items(),
            'pagination' => [
                'current_page' => $payments->currentPage(),
                'last_page'    => $payments->lastPage(),
                'per_page'     => $payments->perPage(),
                'total'        => $payments->total(),
            ]
        ]);
    }

    public function downloadReceipt(Payment $payment): JsonResponse
    {
        $user = Auth::user();

        if ($payment->property->owner_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json(['message' => 'Receipt download not implemented yet'], 501);
    }

    // Commission Reports
    public function getCommissionReports(): JsonResponse
    {
        if (! $this->paymentsTableAvailable()) {
            return $this->emptyPaginatedResponse();
        }

        $user = Auth::user();
        $commissions = Payment::with(['agent', 'property'])
            ->whereHas('property', fn($q) => $q->where('owner_id', $user->id))
            ->where('type', 'commission')
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json([
            'data' => $commissions->items(),
            'pagination' => [
                'current_page' => $commissions->currentPage(),
                'last_page'    => $commissions->lastPage(),
                'per_page'     => $commissions->perPage(),
                'total'        => $commissions->total(),
            ]
        ]);
    }

    // Analytics
    public function getAnalytics(): JsonResponse
    {
        $user = Auth::user();

        $propertiesQuery = Property::where('owner_id', $user->id);
        $totalProperties = (clone $propertiesQuery)->count();
        $occupiedProperties = (clone $propertiesQuery)->where('available', false)->count();
        $availableProperties = (clone $propertiesQuery)->where('available', true)->count();

        $analytics = [
            'property_performance' => [
                'total_properties'    => $totalProperties,
                'occupied_properties' => $occupiedProperties,
                'available_properties'=> $availableProperties,
                'avg_rent'            => (clone $propertiesQuery)->avg('price') ?: 0,
                'occupancy_rate'      => $totalProperties > 0 ? ($occupiedProperties / $totalProperties) * 100 : 0,
            ],
            'financial_metrics' => [
                'total_revenue'     => $this->paymentsTableAvailable()
                    ? Payment::whereHas('property', fn($q) => $q->where('owner_id', $user->id))->sum('amount')
                    : 0,
                'monthly_revenue'   => $this->paymentsTableAvailable()
                    ? Payment::whereHas('property', fn($q) => $q->where('owner_id', $user->id))
                        ->whereMonth('created_at', now()->month)->sum('amount')
                    : 0,
                'total_commissions' => $this->paymentsTableAvailable()
                    ? Payment::whereHas('property', fn($q) => $q->where('owner_id', $user->id))
                        ->where('type', 'commission')->sum('amount')
                    : 0,
            ],
            'tenant_metrics' => [
                'total_tenants'          => $occupiedProperties,
                'new_tenants_this_month' => 0,
            ],
        ];

        return response()->json(['data' => $analytics]);
    }

    // Messages
    public function getMessages(): JsonResponse
    {
        if (! $this->messagesTablesAvailable()) {
            return $this->emptyPaginatedResponse();
        }

        $user = Auth::user();

        $messages = Message::with(['sender', 'recipient', 'property'])
            ->where(function ($q) use ($user) {
                $q->where('sender_id', $user->id)->orWhere('receiver_id', $user->id);
            })
            ->where(function ($q) use ($user) {
                $q->whereHas('property', fn($pq) => $pq->where('owner_id', $user->id))
                  ->orWhere(function ($inner) use ($user) {
                      $inner->whereNull('property_id')
                            ->where(function ($p) use ($user) {
                                $p->whereIn('sender_id', function ($tq) use ($user) {
                                    $tq->select('user_id')->from('tenants')
                                        ->whereIn('property_id', function ($pq) use ($user) {
                                            $pq->select('id')->from('properties')->where('owner_id', $user->id);
                                        });
                                })
                                ->orWhereIn('receiver_id', function ($tq) use ($user) {
                                    $tq->select('user_id')->from('tenants')
                                        ->whereIn('property_id', function ($pq) use ($user) {
                                            $pq->select('id')->from('properties')->where('owner_id', $user->id);
                                        });
                                });
                            });
                  });
            })
            ->orderBy('created_at', 'desc')
            ->paginate(50);

        Message::where('receiver_id', $user->id)
            ->whereNull('read_at')
            ->whereIn('id', collect($messages->items())->pluck('id'))
            ->update(['read_at' => now()]);

        return response()->json([
            'data' => $messages->items(),
            'pagination' => [
                'current_page' => $messages->currentPage(),
                'last_page'    => $messages->lastPage(),
                'per_page'     => $messages->perPage(),
                'total'        => $messages->total(),
            ]
        ]);
    }

    public function sendMessage(Request $request): JsonResponse
    {
        if (! $this->messagesTablesAvailable()) {
            return response()->json(['message' => 'Messaging is unavailable until landlord tables are migrated'], 503);
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
                'errors'  => $validator->errors()
            ], 422);
        }

        $user = Auth::user();
        $recipientId = (int) $request->receiver_id;
        $propertyId = $request->property_id ? (int) $request->property_id : null;

        $recipientIsTenant = Tenant::where('user_id', $recipientId)
            ->whereHas('property', fn($q) => $q->where('owner_id', $user->id)
                ->when($propertyId, fn($q) => $q->where('id', $propertyId)))
            ->exists();

        if (! $recipientIsTenant) {
            return response()->json(['message' => 'Recipient must be one of your tenants'], 422);
        }

        $message = Message::create([
            'sender_id'   => $user->id,
            'receiver_id' => $recipientId,
            'property_id' => $propertyId,
            'subject'     => $request->subject,
            'body'        => $request->body,
        ])->load(['sender', 'recipient', 'property']);

        return response()->json([
            'message' => 'Message sent successfully',
            'data'    => $message,
        ], 201);
    }

    // Digital Contracts Management
    public function getDigitalContracts(): JsonResponse
    {
        if (! $this->tenantTablesAvailable()) {
            return response()->json(['message' => 'Digital contracts are not available until tenant tables are migrated'], 503);
        }

        $user = Auth::user();

        $contracts = DigitalContract::with(['tenant.user', 'property'])
            ->whereHas('property', fn($q) => $q->where('owner_id', $user->id))
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json([
            'data' => $contracts->items(),
            'pagination' => [
                'current_page' => $contracts->currentPage(),
                'last_page'    => $contracts->lastPage(),
                'per_page'     => $contracts->perPage(),
                'total'        => $contracts->total(),
            ]
        ]);
    }

    public function uploadContractFile(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'file'      => 'required|file|mimes:pdf,doc,docx|max:10240',
            'tenant_id' => 'required|exists:tenants,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors'  => $validator->errors()
            ], 422);
        }

        $user = Auth::user();
        $tenant = Tenant::with('property')->findOrFail($request->tenant_id);

        if ($tenant->property->owner_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $file = $request->file('file');
        $fileName = time() . '_' . $file->getClientOriginalName();
        $filePath = $file->storeAs('contracts', $fileName, 'public');

        $contract = DigitalContract::create([
            'title'       => 'Contract for ' . $tenant->property->title,
            'tenant_id'   => $tenant->id,
            'property_id' => $tenant->property->id,
            'file_path'   => $filePath,
            'file_name'   => $fileName,
            'file_type'   => $file->getClientMimeType(),
            'uploaded_by' => $user->id,
        ]);

        return response()->json([
            'message' => 'Contract uploaded successfully',
            'data'    => $contract
        ]);
    }

    public function sendContractToTenant(Request $request, $contractId): JsonResponse
    {
        $user = Auth::user();

        $contract = DigitalContract::where('id', $contractId)
            ->whereHas('property', fn($q) => $q->where('owner_id', $user->id))
            ->firstOrFail();

        if ($contract->status !== 'draft') {
            return response()->json([
                'message' => 'Only draft contracts can be sent to tenants',
                'current_status' => $contract->status,
            ], 422);
        }

        $contract->update(['status' => 'pending_signature']);

        return response()->json([
            'message' => 'Contract sent to tenant successfully',
            'data'    => $contract
        ]);
    }

    public function createDigitalContract(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'title'       => 'required|string|max:255',
            'property_id' => 'required|exists:properties,id',
            'tenant_id'   => 'required|exists:tenants,id',
            'file_url'    => 'nullable|string',
            'file_name'   => 'nullable|string|max:255',
            'file_type'   => 'nullable|string|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors'  => $validator->errors()
            ], 422);
        }

        $user = Auth::user();
        $tenant = Tenant::with(['property', 'user'])->findOrFail($request->tenant_id);
        $property = Property::findOrFail($request->property_id);

        if ($tenant->property->owner_id !== $user->id || $property->owner_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $contract = DigitalContract::create([
            'title'       => $request->title,
            'tenant_id'   => $tenant->id,
            'property_id' => $property->id,
            'file_url'    => $request->file_url,
            'file_name'   => $request->file_name,
            'file_type'   => $request->file_type,
            'fields'      => $request->fields ?? [],
            'status'      => $request->status ?? 'draft',
            'created_by'  => $user->id,
        ]);

        // Silent notification
        try {
            Notification::create([
                'user_id' => $tenant->user_id,
                'title'   => 'New Contract Available',
                'message' => "A new contract '{$request->title}' has been created for {$property->title}.",
                'type'    => 'contract',
                'data'    => json_encode(['contract_id' => $contract->id]),
                'is_read' => false,
            ]);
        } catch (\Exception $e) {
            // Silent fail
        }

        return response()->json([
            'message' => 'Contract created successfully',
            'data'    => $contract
        ]);
    }

    public function generateDigitalContract(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'tenant_id'   => 'required|exists:tenants,id',
            'property_id' => 'required|exists:properties,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors'  => $validator->errors()
            ], 422);
        }

        $user = Auth::user();
        $tenant = Tenant::with('property')->findOrFail($request->tenant_id);
        $property = Property::findOrFail($request->property_id);

        if ($tenant->property->owner_id !== $user->id || $property->owner_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $fileName = 'contract_' . time() . '.pdf';
        $filePath = 'contracts/' . $fileName;

        // Simplified demo content
        file_put_contents(storage_path('app/public/' . $filePath), "Rental Agreement for {$property->title}");

        $contract = DigitalContract::create([
            'tenant_id'   => $tenant->id,
            'property_id' => $property->id,
            'file_path'   => $filePath,
            'file_name'   => $fileName,
            'file_type'   => 'application/pdf',
            'generated_by'=> $user->id,
        ]);

        return response()->json([
            'message' => 'Contract generated successfully',
            'data'    => $contract
        ]);
    }

    public function downloadDigitalContract($contractId): \Symfony\Component\HttpFoundation\BinaryFileResponse|JsonResponse
    {
        $user = Auth::user();

        $contract = DigitalContract::with('property')
            ->whereHas('property', fn($q) => $q->where('owner_id', $user->id))
            ->findOrFail($contractId);

        $storedPath = $contract->file_url ?? $contract->file_path;

        if (! $storedPath || !Storage::disk('public')->exists($storedPath)) {
            return response()->json(['message' => 'File not found'], 404);
        }

        $fileName = $contract->file_name ?? basename($storedPath);

        return Storage::disk('public')->download($storedPath, $fileName);
    }

    public function approveSignedContract($contractId): JsonResponse
    {
        $user = Auth::user();

        $contract = DigitalContract::with(['property', 'tenant'])
            ->whereHas('property', fn($q) => $q->where('owner_id', $user->id))
            ->findOrFail($contractId);

        if ($contract->status !== 'pending_review') {
            return response()->json([
                'message' => 'Contract must be signed by tenant and pending review',
                'current_status' => $contract->status
            ], 422);
        }

        $contract->update([
            'status'      => 'approved',
            'approved_at' => now(),
            'approved_by' => $user->id,
        ]);

        try {
            Notification::create([
                'user_id' => $contract->tenant->user_id,
                'title'   => 'Contract Approved',
                'message' => "Your rental contract for {$contract->property->title} has been approved.",
                'type'    => 'contract_approved',
                'data'    => json_encode(['contract_id' => $contract->id]),
                'is_read' => false,
            ]);
        } catch (\Exception $e) {
            // Silent fail
        }

        return response()->json([
            'success' => true,
            'message' => 'Contract approved successfully',
            'data'    => $contract->fresh()
        ]);
    }

    // ==================== HELPER METHODS ====================

    private function calculateOccupancyRate(User $user): float
    {
        $total = Property::where('owner_id', $user->id)->count();
        $occupied = Property::where('owner_id', $user->id)->where('available', false)->count();
        return $total > 0 ? ($occupied / $total) * 100 : 0;
    }

    private function calculateConversionRate(Property $property): float
    {
        $applications = Application::where('property_id', $property->id)->count();
        $views = $property->views ?? 1;
        return $views > 0 ? round(($applications / $views) * 100, 2) : 0;
    }

    private function calculatePropertyOccupancyRate(Property $property): float
    {
        return 85.0;
    }

    private function calculateAvgRentCollectionTime(Property $property): float
    {
        return 2.5;
    }

    private function calculateCollectionRate(User $user): float
    {
        if (! $this->paymentsTableAvailable()) return 0;

        $total = Payment::whereHas('property', fn($q) => $q->where('owner_id', $user->id))
            ->whereIn('type', $this->rentPaymentTypes())->count();
        $paid = Payment::whereHas('property', fn($q) => $q->where('owner_id', $user->id))
            ->whereIn('type', $this->rentPaymentTypes())
            ->whereIn('status', ['completed', 'paid'])->count();

        return $total > 0 ? round(($paid / $total) * 100, 2) : 0;
    }

    private function formatOwnerPayment(Payment $payment): array
    {
        $payer = $payment->tenant?->user ?? $payment->user;
        $name = trim(($payer->first_name ?? '') . ' ' . ($payer->last_name ?? ''));
        $status = $payment->status === 'completed' ? 'paid' : $payment->status;

        return [
            'id' => $payment->id,
            'amount' => (float) $payment->amount,
            'status' => $status,
            'type' => $payment->type,
            'description' => $payment->description,
            'reference' => $payment->reference,
            'due_date' => optional($payment->due_date)?->toDateString(),
            'paid_at' => optional($payment->paid_at)?->toIso8601String(),
            'created_at' => optional($payment->created_at)?->toIso8601String(),
            'property' => $payment->property ? [
                'id' => $payment->property->id,
                'title' => $payment->property->title,
                'location' => $payment->property->location,
            ] : null,
            'tenant' => [
                'user' => [
                    'first_name' => $payer->first_name ?? '',
                    'last_name' => $payer->last_name ?? '',
                    'email' => $payer->email ?? '',
                ],
            ],
            'tenant_name' => $name !== '' ? $name : ($payer->email ?? 'Tenant'),
        ];
    }

    private function emptyPaginatedResponse(): JsonResponse
    {
        return response()->json([
            'data' => [],
            'pagination' => [
                'current_page' => 1,
                'last_page'    => 1,
                'per_page'     => 20,
                'total'        => 0,
            ]
        ]);
    }

    private function tenantTablesAvailable(): bool
    {
        return Schema::hasTable('tenants') && Schema::hasTable('contracts');
    }

    private function paymentsTableAvailable(): bool
    {
        return Schema::hasTable('payments');
    }

    private function messagesTablesAvailable(): bool
    {
        return Schema::hasTable('messages') && Schema::hasTable('tenants');
    }

    private function landlordSupportTablesAvailable(): bool
    {
        return $this->tenantTablesAvailable() && $this->paymentsTableAvailable();
    }
}
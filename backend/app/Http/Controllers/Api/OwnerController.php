<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Property;
use App\Models\Application;
use App\Models\Contract;
use App\Models\Payment;
use App\Models\Tenant;
use App\Models\Message;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Validator;

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
                'active_tenants' => 0,
                'monthly_revenue' => 0,
                'total_revenue' => 0,
                'occupancy_rate' => $this->calculateOccupancyRate($user),
            ]]);
        }
        
        $stats = [
            'total_properties' => $properties->count(),
            'active_tenants' => Tenant::whereHas('contract', function ($query) use ($user) {
                $query->whereHas('property', function ($subQuery) use ($user) {
                    $subQuery->where('owner_id', $user->id);
                })->where('status', 'active');
            })->count(),
            'monthly_revenue' => Payment::whereHas('property', function ($query) use ($user) {
                $query->where('owner_id', $user->id);
            })->whereMonth('created_at', now()->month)->sum('amount'),
            'total_revenue' => Payment::whereHas('property', function ($query) use ($user) {
                $query->where('owner_id', $user->id);
            })->sum('amount'),
            'occupancy_rate' => $this->calculateOccupancyRate($user),
        ];

        return response()->json(['data' => $stats]);
    }

    // Properties Management
    public function getMyProperties(): JsonResponse
    {
        $user = Auth::user();
        
        \Log::info('Getting properties for user ID: ' . $user->id);
        
        $properties = Property::with(['agent', 'applications'])
            ->where('owner_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->paginate(12);
            
        \Log::info('Found ' . $properties->total() . ' properties for user ' . $user->id);
        \Log::info('Properties data:', $properties->items());

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

    public function createProperty(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'required|string|max:2000',
            'price' => 'required|numeric|min:0',
            'location' => 'required|string|max:255',
            'type' => 'required|in:apartment,house,villa,studio,commercial',
            'bedrooms' => 'required|integer|min:0',
            'bathrooms' => 'required|integer|min:0',
            'area' => 'required|integer|min:0',
            'agent_id' => 'sometimes|exists:users,id',
            'images' => 'sometimes|array',
            'images.*' => 'image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = Auth::user();
        
        // Handle image uploads
        $imagePaths = [];
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $image) {
                $path = $image->store('properties', 'public');
                $imagePaths[] = $path;
            }
        }
        
        $property = Property::create([
            'title' => $request->title,
            'description' => $request->description,
            'price' => $request->price,
            'location' => $request->location,
            'address' => $request->address ?? '',
            'type' => $request->type,
            'bedrooms' => $request->bedrooms,
            'bathrooms' => $request->bathrooms,
            'area' => $request->area,
            'images' => $imagePaths,
            'amenities' => $request->amenities ?? [],
            'featured' => $request->boolean('featured', false),
            'available' => true,
            'owner_id' => $user->id,
            'agent_id' => $request->agent_id,
        ]);

        return response()->json([
            'message' => 'Property created successfully',
            'data' => $property->load('agent')
        ], 201);
    }

    public function updateProperty(Request $request, Property $property): JsonResponse
    {
        $user = Auth::user();
        
        if ($property->owner_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|string|max:255',
            'description' => 'sometimes|string|max:2000',
            'price' => 'sometimes|numeric|min:0',
            'location' => 'sometimes|string|max:255',
            'type' => 'sometimes|in:apartment,house,villa,studio,commercial',
            'bedrooms' => 'sometimes|integer|min:0',
            'bathrooms' => 'sometimes|integer|min:0',
            'area' => 'sometimes|integer|min:0',
            'available' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $property->update($request->only([
            'title', 'description', 'price', 'location', 'type', 
            'bedrooms', 'bathrooms', 'area', 'available'
        ]));

        return response()->json([
            'message' => 'Property updated successfully',
            'data' => $property->load('agent')
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
                'views' => $property->views ?? 0,
                'inquiries' => Application::where('property_id', $property->id)->count(),
                'applications' => Application::where('property_id', $property->id)->count(),
                'conversion_rate' => $this->calculateConversionRate($property),
                'revenue' => 0,
                'occupancy_rate' => $this->calculatePropertyOccupancyRate($property),
                'avg_rent_collection_time' => $this->calculateAvgRentCollectionTime($property),
            ]]);
        }

        $analytics = [
            'views' => $property->views ?? 0,
            'inquiries' => Application::where('property_id', $property->id)->count(),
            'applications' => Application::where('property_id', $property->id)->count(),
            'conversion_rate' => $this->calculateConversionRate($property),
            'revenue' => Payment::where('property_id', $property->id)->sum('amount'),
            'occupancy_rate' => $this->calculatePropertyOccupancyRate($property),
            'avg_rent_collection_time' => $this->calculateAvgRentCollectionTime($property),
        ];

        return response()->json(['data' => $analytics]);
    }

    // Applications Management
    public function getApplications(): JsonResponse
    {
        $user = Auth::user();
        $applications = Application::with(['user', 'property'])
            ->whereHas('property', function ($query) use ($user) {
                $query->where('owner_id', $user->id);
            })
            ->orderBy('created_at', 'desc')
            ->paginate(20);

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

    public function approveApplication(Request $request, Application $application): JsonResponse
    {
        $user = Auth::user();
        
        if ($application->property->owner_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $application->update(['status' => 'approved']);

        // Send notification to tenant about approval
        if ($tenant) {
            \App\Models\Notification::create([
                'user_id' => $tenant->user_id,
                'title' => 'Application Approved!',
                'message' => "Your rental application for {$application->property->title} has been approved. Please check your application status for next steps.",
                'type' => 'application_approved',
                'is_read' => false,
            ]);
        }
        
        // Create contract
        \App\Models\Contract::create([
            'tenant_id' => $tenant->id,
            'property_id' => $application->property_id,
            'start_date' => now(),
            'end_date' => null,
            'rent_amount' => $application->property->price,
            'status' => 'active',
            'terms' => 'Standard rental agreement created from approved application',
        ]);

        return response()->json(['message' => 'Application approved successfully']);
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
                'errors' => $validator->errors()
            ], 422);
        }

        $application->update([
            'status' => 'rejected',
            'rejection_reason' => $request->rejection_reason,
        ]);

        // TODO: Send notification to tenant

        return response()->json(['message' => 'Application rejected successfully']);
    }

    // Tenants Management
    public function getMyTenants(): JsonResponse
    {
        \Log::info('=== GET MY TENANTS CALLED ===');
        
        if (! $this->tenantTablesAvailable()) {
            \Log::info('Tenant tables not available, returning empty response');
            return $this->emptyPaginatedResponse();
        }

        $user = Auth::user();
        \Log::info('User ID: ' . $user->id . ' (Owner ID)');
        
        $tenants = Tenant::with(['user', 'property', 'contract'])
            ->whereHas('property', function ($query) use ($user) {
                $query->where('owner_id', $user->id);
            })
            ->whereHas('contract', function ($query) {
                $query->where('status', 'active');
            })
            ->paginate(20);

        \Log::info('Tenants query result count: ' . $tenants->total());
        \Log::info('Tenants items count: ' . count($tenants->items()));
        
        // Log the first tenant if exists
        if ($tenants->count() > 0) {
            \Log::info('First tenant data: ', $tenants->first()->toArray());
        }

        $response = [
            'data' => $tenants->items(),
            'pagination' => [
                'current_page' => $tenants->currentPage(),
                'last_page' => $tenants->lastPage(),
                'per_page' => $tenants->perPage(),
                'total' => $tenants->total(),
            ]
        ];
        
        \Log::info('Returning response: ', $response);
        \Log::info('=== END GET MY TENANTS ===');

        return response()->json($response);
    }

    // Manual method to create tenant from existing approved application
    public function createTenantFromApprovedApplication(): JsonResponse
    {
        \Log::info('=== CREATING TENANT FROM APPROVED APPLICATION ===');
        
        $user = Auth::user();
        
        // First, let's see ALL approved applications for this landlord
        $allApprovedApps = \App\Models\Application::with(['user', 'property'])
            ->where('status', 'approved')
            ->whereHas('property', function ($query) use ($user) {
                $query->where('owner_id', $user->id);
            })
            ->get();

        \Log::info('All approved applications for landlord ' . $user->id . ': ' . $allApprovedApps->count());
        foreach ($allApprovedApps as $app) {
            \Log::info('Approved app ID: ' . $app->id . ', User: ' . $app->user_id . ', Property: ' . $app->property_id);
        }

        // Now check if there are any existing tenants for these applications
        $existingTenants = \App\Models\Tenant::whereIn('user_id', $allApprovedApps->pluck('user_id'))
            ->whereIn('property_id', $allApprovedApps->pluck('property_id'))
            ->get();

        \Log::info('Existing tenants for these applications: ' . $existingTenants->count());
        foreach ($existingTenants as $tenant) {
            \Log::info('Existing tenant - User: ' . $tenant->user_id . ', Property: ' . $tenant->property_id);
        }

        // Simple approach: just get approved applications and check manually
        $approvedApplications = [];
        foreach ($allApprovedApps as $app) {
            $hasTenant = \App\Models\Tenant::where('user_id', $app->user_id)
                ->where('property_id', $app->property_id)
                ->exists();
            
            if (!$hasTenant) {
                $approvedApplications[] = $app;
                \Log::info('Application ' . $app->id . ' needs tenant record created');
            } else {
                \Log::info('Application ' . $app->id . ' already has tenant record');
            }
        }

        \Log::info('Final count of applications needing tenant records: ' . count($approvedApplications));

        $createdTenants = [];
        
        foreach ($approvedApplications as $application) {
            try {
                // Create tenant record
                $tenant = \App\Models\Tenant::create([
                    'user_id' => $application->user_id,
                    'property_id' => $application->property_id,
                    'move_in_date' => now(),
                    'status' => 'active',
                ]);

                // Create contract record
                \App\Models\Contract::create([
                    'tenant_id' => $tenant->id,
                    'property_id' => $application->property_id,
                    'start_date' => now(),
                    'end_date' => null,
                    'rent_amount' => $application->property->price,
                    'status' => 'active',
                    'terms' => 'Standard rental agreement created from approved application',
                ]);

                $createdTenants[] = [
                    'tenant_id' => $tenant->id,
                    'user_name' => $application->user->first_name . ' ' . $application->user->last_name,
                    'property_title' => $application->property->title,
                ];
                
                \Log::info('Created tenant for application ' . $application->id);
                
            } catch (\Exception $e) {
                \Log::error('Failed to create tenant for application ' . $application->id . ': ' . $e->getMessage());
            }
        }

        return response()->json([
            'message' => 'Created ' . count($createdTenants) . ' tenant records from approved applications',
            'tenants_created' => $createdTenants
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
            ->whereHas('property', function ($query) use ($user) {
                $query->where('owner_id', $user->id);
            })
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json([
            'data' => $contracts->items(),
            'pagination' => [
                'current_page' => $contracts->currentPage(),
                'last_page' => $contracts->lastPage(),
                'per_page' => $contracts->perPage(),
                'total' => $contracts->total(),
            ]
        ]);
    }

    public function createContract(Request $request): JsonResponse
    {
        if (! $this->tenantTablesAvailable()) {
            return response()->json(['message' => 'Contracts are unavailable until landlord tables are migrated'], 503);
        }

        $validator = Validator::make($request->all(), [
            'tenant_id' => 'required|exists:tenants,id',
            'property_id' => 'required|exists:properties,id',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'rent_amount' => 'required|numeric|min:0',
            'terms' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = Auth::user();
        
        // Verify ownership
        $property = Property::findOrFail($request->property_id);
        if ($property->owner_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $contract = Contract::create([
            'tenant_id' => $request->tenant_id,
            'property_id' => $request->property_id,
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
            'rent_amount' => $request->rent_amount,
            'terms' => $request->terms,
            'status' => 'active',
        ]);

        return response()->json([
            'message' => 'Contract created successfully',
            'data' => $contract->load(['tenant.user', 'property'])
        ], 201);
    }

    // Rent Collection
    public function getRentCollection(): JsonResponse
    {
        if (! $this->paymentsTableAvailable()) {
            return $this->emptyPaginatedResponse();
        }

        $user = Auth::user();
        $payments = Payment::with(['tenant.user', 'property'])
            ->whereHas('property', function ($query) use ($user) {
                $query->where('owner_id', $user->id);
            })
            ->where('type', 'rent')
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json([
            'data' => $payments->items(),
            'pagination' => [
                'current_page' => $payments->currentPage(),
                'last_page' => $payments->lastPage(),
                'per_page' => $payments->perPage(),
                'total' => $payments->total(),
            ]
        ]);
    }

    public function getRentCollectionStats(): JsonResponse
    {
        if (! $this->paymentsTableAvailable()) {
            return response()->json(['data' => [
                'total_collected' => 0,
                'this_month' => 0,
                'pending_payments' => 0,
                'collection_rate' => 0,
            ]]);
        }

        $user = Auth::user();
        $stats = [
            'total_collected' => Payment::whereHas('property', function ($query) use ($user) {
                $query->where('owner_id', $user->id);
            })->where('type', 'rent')->sum('amount'),
            'this_month' => Payment::whereHas('property', function ($query) use ($user) {
                $query->where('owner_id', $user->id);
            })->where('type', 'rent')->whereMonth('created_at', now()->month)->sum('amount'),
            'pending_payments' => Payment::whereHas('property', function ($query) use ($user) {
                $query->where('owner_id', $user->id);
            })->where('type', 'rent')->where('status', 'pending')->count(),
            'collection_rate' => $this->calculateCollectionRate($user),
        ];

        return response()->json(['data' => $stats]);
    }

    // Payment Receipts
    public function getReceipts(): JsonResponse
    {
        if (! $this->paymentsTableAvailable()) {
            return $this->emptyPaginatedResponse();
        }

        $user = Auth::user();
        $payments = Payment::with(['tenant.user', 'property'])
            ->whereHas('property', function ($query) use ($user) {
                $query->where('owner_id', $user->id);
            })
            ->where('status', 'completed')
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json([
            'data' => $payments->items(),
            'pagination' => [
                'current_page' => $payments->currentPage(),
                'last_page' => $payments->lastPage(),
                'per_page' => $payments->perPage(),
                'total' => $payments->total(),
            ]
        ]);
    }

    public function downloadReceipt(Payment $payment): JsonResponse
    {
        $user = Auth::user();
        
        if ($payment->property->owner_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // TODO: Generate PDF receipt
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
            ->whereHas('property', function ($query) use ($user) {
                $query->where('owner_id', $user->id);
            })
            ->where('type', 'commission')
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json([
            'data' => $commissions->items(),
            'pagination' => [
                'current_page' => $commissions->currentPage(),
                'last_page' => $commissions->lastPage(),
                'per_page' => $commissions->perPage(),
                'total' => $commissions->total(),
            ]
        ]);
    }

    // Analytics
    public function getAnalytics(): JsonResponse
    {
        $user = Auth::user();
        
        $properties = Property::where('owner_id', $user->id);
        $totalProperties = $properties->count();
        $occupiedProperties = $properties->where('available', false)->count();
        $availableProperties = $properties->where('available', true)->count();
        
        $analytics = [
            'property_performance' => [
                'total_properties' => $totalProperties,
                'occupied_properties' => $occupiedProperties,
                'available_properties' => $availableProperties,
                'avg_rent' => $properties->avg('price') ?: 0,
                'occupancy_rate' => $totalProperties > 0 ? ($occupiedProperties / $totalProperties) * 100 : 0,
            ],
            'financial_metrics' => [
                'total_revenue' => $this->paymentsTableAvailable() ? Payment::whereHas('property', function ($query) use ($user) {
                    $query->where('owner_id', $user->id);
                })->sum('amount') : 0,
                'monthly_revenue' => $this->paymentsTableAvailable() ? Payment::whereHas('property', function ($query) use ($user) {
                    $query->where('owner_id', $user->id);
                })->whereMonth('created_at', now()->month)->sum('amount') : 0,
                'total_commissions' => $this->paymentsTableAvailable() ? Payment::whereHas('property', function ($query) use ($user) {
                    $query->where('owner_id', $user->id);
                })->where('type', 'commission')->sum('amount') : 0,
            ],
            'tenant_metrics' => [
                'total_tenants' => $occupiedProperties, // Simplified: one tenant per occupied property
                'new_tenants_this_month' => 0, // TODO: Implement with proper tenant tracking
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
            ->where(function ($query) use ($user) {
                $query->where('sender_id', $user->id)
                    ->orWhere('recipient_id', $user->id);
            })
            ->where(function ($query) use ($user) {
                $query->whereHas('property', function ($propertyQuery) use ($user) {
                    $propertyQuery->where('owner_id', $user->id);
                })->orWhere(function ($innerQuery) use ($user) {
                    $innerQuery->whereNull('property_id')
                        ->where(function ($participantQuery) use ($user) {
                            $participantQuery
                                ->whereIn('sender_id', function ($tenantQuery) use ($user) {
                                    $tenantQuery->select('user_id')
                                        ->from('tenants')
                                        ->whereIn('property_id', function ($propertyQuery) use ($user) {
                                            $propertyQuery->select('id')
                                                ->from('properties')
                                                ->where('owner_id', $user->id);
                                        });
                                })
                                ->orWhereIn('recipient_id', function ($tenantQuery) use ($user) {
                                    $tenantQuery->select('user_id')
                                        ->from('tenants')
                                        ->whereIn('property_id', function ($propertyQuery) use ($user) {
                                            $propertyQuery->select('id')
                                                ->from('properties')
                                                ->where('owner_id', $user->id);
                                        });
                                });
                        });
                });
            })
            ->orderBy('created_at', 'desc')
            ->paginate(50);

        Message::where('recipient_id', $user->id)
            ->whereNull('read_at')
            ->whereIn('id', collect($messages->items())->pluck('id'))
            ->update(['read_at' => now()]);

        return response()->json([
            'data' => $messages->items(),
            'pagination' => [
                'current_page' => $messages->currentPage(),
                'last_page' => $messages->lastPage(),
                'per_page' => $messages->perPage(),
                'total' => $messages->total(),
            ]
        ]);
    }

    public function sendMessage(Request $request): JsonResponse
    {
        if (! $this->messagesTablesAvailable()) {
            return response()->json(['message' => 'Messaging is unavailable until landlord tables are migrated'], 503);
        }

        $validator = Validator::make($request->all(), [
            'recipient_id' => 'required|exists:users,id',
            'property_id' => 'nullable|exists:properties,id',
            'subject' => 'nullable|string|max:255',
            'body' => 'required|string|max:5000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = Auth::user();
        $recipientId = (int) $request->recipient_id;
        $propertyId = $request->property_id ? (int) $request->property_id : null;

        $recipientIsTenant = Tenant::where('user_id', $recipientId)
            ->whereHas('property', function ($query) use ($user, $propertyId) {
                $query->where('owner_id', $user->id);

                if ($propertyId) {
                    $query->where('id', $propertyId);
                }
            })
            ->exists();

        if (! $recipientIsTenant) {
            return response()->json(['message' => 'Recipient must be one of your tenants'], 422);
        }

        if ($propertyId) {
            $propertyOwnedByUser = Property::where('owner_id', $user->id)
                ->where('id', $propertyId)
                ->exists();

            if (! $propertyOwnedByUser) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
        }

        $message = Message::create([
            'sender_id' => $user->id,
            'recipient_id' => $recipientId,
            'property_id' => $propertyId,
            'subject' => $request->subject,
            'body' => $request->body,
        ])->load(['sender', 'recipient', 'property']);

        return response()->json([
            'message' => 'Message sent successfully',
            'data' => $message,
        ], 201);
    }

    // Helper methods
    private function calculateOccupancyRate(User $user): float
    {
        $totalProperties = Property::where('owner_id', $user->id)->count();
        $occupiedProperties = Property::where('owner_id', $user->id)->where('available', false)->count();
        
        return $totalProperties > 0 ? ($occupiedProperties / $totalProperties) * 100 : 0;
    }

    private function calculateConversionRate(Property $property): float
    {
        $applications = Application::where('property_id', $property->id)->count();
        $views = $property->views ?? 1;
        
        return $views > 0 ? ($applications / $views) * 100 : 0;
    }

    private function calculatePropertyOccupancyRate(Property $property): float
    {
        // TODO: Calculate property-specific occupancy rate
        return 85.0; // percentage
    }

    private function calculateAvgRentCollectionTime(Property $property): float
    {
        // TODO: Calculate average rent collection time in days
        return 2.5; // days
    }

    private function calculateCollectionRate(User $user): float
    {
        if (! $this->paymentsTableAvailable()) {
            return 0;
        }

        $totalPayments = Payment::whereHas('property', function ($query) use ($user) {
            $query->where('owner_id', $user->id);
        })->where('type', 'rent')->count();
        
        $paidPayments = Payment::whereHas('property', function ($query) use ($user) {
            $query->where('owner_id', $user->id);
        })->where('type', 'rent')->where('status', 'completed')->count();
        
        return $totalPayments > 0 ? ($paidPayments / $totalPayments) * 100 : 0;
    }

    private function emptyPaginatedResponse(): JsonResponse
    {
        return response()->json([
            'data' => [],
            'pagination' => [
                'current_page' => 1,
                'last_page' => 1,
                'per_page' => 20,
                'total' => 0,
            ]
        ]);
    }

    private function tenantTablesAvailable(): bool
    {
        return Schema::hasTable('tenants') && Schema::hasTable('contracts');
    }

    private function paymentsTableAvailable(): bool
    {
        return Schema::hasTable('payments') && class_exists(Payment::class);
    }

    private function messagesTablesAvailable(): bool
    {
        return Schema::hasTable('messages') && Schema::hasTable('tenants') && class_exists(Message::class);
    }

    private function landlordSupportTablesAvailable(): bool
    {
        return $this->tenantTablesAvailable() && $this->paymentsTableAvailable();
    }
}

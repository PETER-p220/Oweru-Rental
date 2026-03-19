<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Property;
use App\Models\Application;
use App\Models\Contract;
use App\Models\Payment;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class OwnerController extends Controller
{
    // Dashboard
    public function getDashboard(): JsonResponse
    {
        $user = Auth::user();
        $properties = Property::where('owner_id', $user->id);
        
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

        // TODO: Send notification to tenant
        // TODO: Create contract

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
        $user = Auth::user();
        $tenants = Tenant::with(['user', 'property', 'contract'])
            ->whereHas('property', function ($query) use ($user) {
                $query->where('owner_id', $user->id);
            })
            ->whereHas('contract', function ($query) {
                $query->where('status', 'active');
            })
            ->paginate(20);

        return response()->json([
            'data' => $tenants->items(),
            'pagination' => [
                'current_page' => $tenants->currentPage(),
                'last_page' => $tenants->lastPage(),
                'per_page' => $tenants->perPage(),
                'total' => $tenants->total(),
            ]
        ]);
    }

    // Contracts Management
    public function getContracts(): JsonResponse
    {
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
                'total_revenue' => 0, // TODO: Implement when Payment table exists
                'monthly_revenue' => 0, // TODO: Implement when Payment table exists
                'total_commissions' => 0, // TODO: Implement when Payment table exists
            ],
            'tenant_metrics' => [
                'total_tenants' => $occupiedProperties, // Simplified: one tenant per occupied property
                'new_tenants_this_month' => 0, // TODO: Implement with proper tenant tracking
            ],
        ];

        return response()->json(['data' => $analytics]);
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
        $totalPayments = Payment::whereHas('property', function ($query) use ($user) {
            $query->where('owner_id', $user->id);
        })->where('type', 'rent')->count();
        
        $paidPayments = Payment::whereHas('property', function ($query) use ($user) {
            $query->where('owner_id', $user->id);
        })->where('type', 'rent')->where('status', 'completed')->count();
        
        return $totalPayments > 0 ? ($paidPayments / $totalPayments) * 100 : 0;
    }
}

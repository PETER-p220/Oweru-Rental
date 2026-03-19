<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Property;
use App\Models\Application;
use App\Models\Commission;
use App\Models\Lead;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class AgentController extends Controller
{
    // Dashboard
    public function getDashboard(): JsonResponse
    {
        $user = Auth::user();
        $stats = [
            'total_listings' => Property::where('agent_id', $user->id)->count(),
            'active_listings' => Property::where('agent_id', $user->id)->where('status', 'available')->count(),
            'total_leads' => Lead::where('agent_id', $user->id)->count(),
            'total_commissions' => Commission::where('agent_id', $user->id)->sum('amount'),
        ];

        return response()->json(['data' => $stats]);
    }

    // Properties/Listings
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
                'last_page' => $properties->lastPage(),
                'per_page' => $properties->perPage(),
                'total' => $properties->total(),
            ]
        ]);
    }

    public function createListing(Request $request): JsonResponse
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
            'owner_id' => 'required|exists:users,id',
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
        
        $property = Property::create([
            'title' => $request->title,
            'description' => $request->description,
            'price' => $request->price,
            'location' => $request->location,
            'type' => $request->type,
            'bedrooms' => $request->bedrooms,
            'bathrooms' => $request->bathrooms,
            'area' => $request->area,
            'owner_id' => $request->owner_id,
            'agent_id' => $user->id,
            'status' => 'available',
        ]);

        // TODO: Handle image uploads
        if ($request->has('images')) {
            // Process and store images
        }

        return response()->json([
            'message' => 'Property listed successfully',
            'data' => $property->load('owner')
        ], 201);
    }

    public function updateListing(Request $request, Property $property): JsonResponse
    {
        $user = Auth::user();
        
        if ($property->agent_id !== $user->id) {
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
            'status' => 'sometimes|in:available,rented,maintenance',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $property->update($request->only([
            'title', 'description', 'price', 'location', 'type', 
            'bedrooms', 'bathrooms', 'area', 'status'
        ]));

        return response()->json([
            'message' => 'Property updated successfully',
            'data' => $property->load('owner')
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

        $analytics = [
            'views' => $property->views ?? 0,
            'inquiries' => Application::where('property_id', $property->id)->count(),
            'applications' => Application::where('property_id', $property->id)->count(),
            'conversion_rate' => $this->calculateConversionRate($property),
            'avg_response_time' => $this->calculateAvgResponseTime($property),
        ];

        return response()->json(['data' => $analytics]);
    }

    // Linked Owners
    public function getLinkedOwners(): JsonResponse
    {
        $user = Auth::user();
        $owners = User::where('user_type', 'landlord')
            ->whereHas('properties', function ($query) use ($user) {
                $query->where('agent_id', $user->id);
            })
            ->withCount(['properties' => function ($query) use ($user) {
                $query->where('agent_id', $user->id);
            }])
            ->get();

        return response()->json(['data' => $owners]);
    }

    public function linkOwner(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'owner_id' => 'required|exists:users,id',
            'commission_rate' => 'required|numeric|min:0|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = Auth::user();
        $owner = User::findOrFail($request->owner_id);

        if ($owner->user_type !== 'landlord') {
            return response()->json(['message' => 'User is not a landlord'], 422);
        }

        // TODO: Create agent-owner relationship with commission rate
        // This might need a separate table for agent-owner relationships

        return response()->json(['message' => 'Owner linked successfully']);
    }

    // Tracking and Sharing
    public function getTrackingLinks(): JsonResponse
    {
        $user = Auth::user();
        $properties = Property::where('agent_id', $user->id)->get();
        
        $links = $properties->map(function ($property) {
            return [
                'id' => $property->id,
                'title' => $property->title,
                'tracking_url' => url("/properties/{$property->id}?agent={$user->id}"),
                'qr_code_url' => url("/qr/properties/{$property->id}?agent={$user->id}"),
                'shares' => $property->shares ?? 0,
                'clicks' => $property->clicks ?? 0,
                'created_at' => $property->created_at,
            ];
        });

        return response()->json(['data' => $links]);
    }

    public function generateQRCode(Property $property): JsonResponse
    {
        $user = Auth::user();
        
        if ($property->agent_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // TODO: Generate QR code for property
        $qrCode = [
            'property_id' => $property->id,
            'agent_id' => $user->id,
            'url' => url("/properties/{$property->id}?agent={$user->id}"),
            'qr_code_data' => base64_encode(url("/properties/{$property->id}?agent={$user->id}")),
        ];

        return response()->json(['data' => $qrCode]);
    }

    // Leads and Visitors
    public function getLeads(): JsonResponse
    {
        $user = Auth::user();
        $leads = Lead::with('property', 'user')
            ->where('agent_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json([
            'data' => $leads->items(),
            'pagination' => [
                'current_page' => $leads->currentPage(),
                'last_page' => $leads->lastPage(),
                'per_page' => $leads->perPage(),
                'total' => $leads->total(),
            ]
        ]);
    }

    public function getLeadStats(): JsonResponse
    {
        $user = Auth::user();
        $stats = [
            'total_leads' => Lead::where('agent_id', $user->id)->count(),
            'new_leads' => Lead::where('agent_id', $user->id)
                ->where('created_at', '>=', now()->startOfDay())
                ->count(),
            'converted_leads' => Application::whereHas('property', function ($query) use ($user) {
                $query->where('agent_id', $user->id);
            })->count(),
            'conversion_rate' => $this->calculateLeadConversionRate($user),
        ];

        return response()->json(['data' => $stats]);
    }

    // Applications Management
    public function getApplications(): JsonResponse
    {
        $user = Auth::user();
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
                'last_page' => $applications->lastPage(),
                'per_page' => $applications->perPage(),
                'total' => $applications->total(),
            ]
        ]);
    }

    // Commissions
    public function getMyCommissions(): JsonResponse
    {
        $user = Auth::user();
        $commissions = Commission::with(['property', 'payment'])
            ->where('agent_id', $user->id)
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

    public function getCommissionStats(): JsonResponse
    {
        $user = Auth::user();
        $stats = [
            'total_earned' => Commission::where('agent_id', $user->id)->sum('amount'),
            'pending_commissions' => Commission::where('agent_id', $user->id)->where('status', 'pending')->sum('amount'),
            'paid_commissions' => Commission::where('agent_id', $user->id)->where('status', 'paid')->sum('amount'),
            'this_month' => Commission::where('agent_id', $user->id)
                ->whereMonth('created_at', now()->month)
                ->sum('amount'),
            'total_transactions' => Commission::where('agent_id', $user->id)->count(),
        ];

        return response()->json(['data' => $stats]);
    }

    public function getPayoutHistory(): JsonResponse
    {
        $user = Auth::user();
        $payouts = Commission::where('agent_id', $user->id)
            ->where('status', 'paid')
            ->orderBy('paid_at', 'desc')
            ->paginate(20);

        return response()->json([
            'data' => $payouts->items(),
            'pagination' => [
                'current_page' => $payouts->currentPage(),
                'last_page' => $payouts->lastPage(),
                'per_page' => $payouts->perPage(),
                'total' => $payouts->total(),
            ]
        ]);
    }

    // Analytics
    public function getAnalytics(): JsonResponse
    {
        $user = Auth::user();
        
        $analytics = [
            'performance_metrics' => [
                'total_properties' => Property::where('agent_id', $user->id)->count(),
                'total_leads' => Lead::where('agent_id', $user->id)->count(),
                'conversion_rate' => $this->calculateLeadConversionRate($user),
                'avg_property_value' => Property::where('agent_id', $user->id)->avg('price'),
            ],
            'revenue_metrics' => [
                'total_commissions' => Commission::where('agent_id', $user->id)->sum('amount'),
                'monthly_trend' => $this->getMonthlyCommissionTrend($user),
                'top_performing_properties' => $this->getTopPerformingProperties($user),
            ],
        ];

        return response()->json(['data' => $analytics]);
    }

    // Helper methods
    private function calculateConversionRate(Property $property): float
    {
        $applications = Application::where('property_id', $property->id)->count();
        $views = $property->views ?? 1;
        
        return $views > 0 ? ($applications / $views) * 100 : 0;
    }

    private function calculateAvgResponseTime(Property $property): float
    {
        // TODO: Calculate average response time for inquiries
        return 2.5; // hours
    }

    private function calculateLeadConversionRate(User $user): float
    {
        $totalLeads = Lead::where('agent_id', $user->id)->count();
        $convertedLeads = Application::whereHas('property', function ($query) use ($user) {
            $query->where('agent_id', $user->id);
        })->count();
        
        return $totalLeads > 0 ? ($convertedLeads / $totalLeads) * 100 : 0;
    }

    private function getMonthlyCommissionTrend(User $user): array
    {
        // TODO: Calculate monthly commission trend for the last 12 months
        return [
            'jan' => 150000,
            'feb' => 180000,
            'mar' => 220000,
            // ... more months
        ];
    }

    private function getTopPerformingProperties(User $user): array
    {
        return Property::where('agent_id', $user->id)
            ->withCount(['applications', 'leads'])
            ->orderBy('applications_count', 'desc')
            ->limit(5)
            ->get()
            ->toArray();
    }
}

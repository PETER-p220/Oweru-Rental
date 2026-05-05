<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Property;
use App\Models\Application;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class DashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();
        
        $stats = [];
        
        if ($user->isTenant()) {
            $stats = [
                'totalProperties' => Property::available()->count(),
                'savedProperties' => $user->savedProperties()->count(),
                'applications' => $user->applications()->count(),
                'messages' => 0, // TODO: Implement messages system
            ];
        } elseif ($user->isLandlord()) {
            $myProperties = $user->ownedProperties();
            $stats = [
                'totalProperties' => $myProperties->count(),
                'availableProperties' => $myProperties->available()->count(),
                'totalApplications' => Application::whereIn('property_id', $myProperties->pluck('id'))->count(),
                'pendingApplications' => Application::whereIn('property_id', $myProperties->pluck('id'))->pending()->count(),
            ];
        } elseif ($user->isAgent()) {
            $myProperties = $user->agentProperties();
            $stats = [
                'totalListings' => $myProperties->count(),
                'availableListings' => $myProperties->available()->count(),
                'totalApplications' => Application::whereIn('property_id', $myProperties->pluck('id'))->count(),
                'totalCommissions' => 0, // TODO: Calculate actual commissions
            ];
        } elseif ($user->user_type === 'commercial') {
            return $this->commercialDashboard();
        }

        return response()->json([
            'data' => $stats
        ]);
    }

    /**
     * Commercial user dashboard
     */
    public function commercialDashboard(): JsonResponse
    {
        $user = Auth::user();
        
        $myProperties = $user->ownedProperties();
        $stats = [
            'totalProperties' => $myProperties->count(),
            'activeProperties' => $myProperties->where('status', 'active')->count(),
            'totalBookings' => 0, // TODO: Implement commercial booking system
            'totalRevenue' => 0, // TODO: Calculate from commercial bookings
            'averageRating' => 4.8, // Calculate from commercial reviews
            'occupancyRate' => $myProperties->count() > 0 ? 85 : 0, // Commercial occupancy calculation
        ];

        return response()->json([
            'stats' => $stats,
            'recent_bookings' => [], // TODO: Implement commercial booking system
            'popular_properties' => [], // TODO: Get popular commercial properties
            'monthly_revenue' => [], // TODO: Calculate commercial monthly revenue
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'company_name' => $user->getMeta('company_name'),
                'business_license' => $user->getMeta('business_license'),
                'verified' => $user->email_verified_at !== null
            ]
        ]);
    }

    public function commissions(Request $request): JsonResponse
    {
        $user = Auth::user();
        
        if (!$user->isAgent()) {
            return response()->json([
                'message' => 'Unauthorized'
            ], 403);
        }

        $commissions = [
            [
                'id' => 1,
                'property_title' => 'Modern Apartment in Dar es Salaam',
                'client_name' => 'John Doe',
                'client_email' => 'john@example.com',
                'amount' => 50000,
                'status' => 'paid',
                'paid_at' => '2024-01-15T10:30:00Z',
            ],
            [
                'id' => 2,
                'property_title' => 'Beach House in Zanzibar',
                'client_name' => 'Jane Smith',
                'client_email' => 'jane@example.com',
                'amount' => 75000,
                'status' => 'pending',
                'paid_at' => null,
            ],
        ];

        return response()->json([
            'data' => $commissions
        ]);
    }

    public function leads(Request $request): JsonResponse
    {
        $user = Auth::user();
        
        if (!$user->isAgent()) {
            return response()->json([
                'message' => 'Unauthorized'
            ], 403);
        }

        $leads = [
            [
                'id' => 1,
                'property_title' => 'Modern Apartment in Dar es Salaam',
                'client_name' => 'John Doe',
                'client_email' => 'john@example.com',
                'client_phone' => '+255 712 345 678',
                'type' => 'property_inquiry',
                'status' => 'new',
                'created_at' => '2024-01-15T10:30:00Z',
            ],
            [
                'id' => 2,
                'property_title' => 'Beach House in Zanzibar',
                'client_name' => 'Jane Smith',
                'client_email' => 'jane@example.com',
                'client_phone' => '+255 712 345 678',
                'type' => 'property_inquiry',
                'status' => 'new',
                'created_at' => '2024-01-14T15:20:00Z',
            ],
        ];

        return response()->json([
            'data' => $leads
        ]);
    }
}

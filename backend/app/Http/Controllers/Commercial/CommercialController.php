<?php

namespace App\Http\Controllers\Commercial;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Property;
use App\Models\Booking;
use App\Models\User;
use Carbon\Carbon;

class CommercialController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
        $this->middleware('commercial');
    }

    /**
     * Show commercial dashboard
     */
    public function dashboard()
    {
        $user = Auth::user();
        
        // Get user's properties
        $properties = Property::where('user_id', $user->id)
            ->with(['bookings' => function($query) {
                $query->where('status', 'confirmed');
            }])
            ->get();

        // Calculate statistics
        $totalProperties = $properties->count();
        $activeProperties = $properties->where('status', 'active')->count();
        $totalBookings = $properties->sum(function($property) {
            return $property->bookings->count();
        });
        $totalRevenue = $properties->sum(function($property) {
            return $property->bookings->sum('total_amount');
        });

        // Recent bookings
        $recentBookings = Booking::whereHas('property', function($query) use ($user) {
            $query->where('user_id', $user->id);
        })
        ->with('property')
        ->orderBy('created_at', 'desc')
        ->take(5)
        ->get();

        // Properties with views
        $propertiesWithViews = $properties->map(function($property) {
            $property->views = $property->views ?? 0;
            return $property;
        })->sortByDesc('views')->take(5);

        // Monthly revenue for the last 6 months
        $monthlyRevenue = [];
        for ($i = 5; $i >= 0; $i--) {
            $month = Carbon::now()->subMonths($i);
            $revenue = Booking::whereHas('property', function($query) use ($user) {
                $query->where('user_id', $user->id);
            })
            ->where('status', 'confirmed')
            ->whereMonth('created_at', $month->month)
            ->whereYear('created_at', $month->year)
            ->sum('total_amount');
            
            $monthlyRevenue[] = [
                'month' => $month->format('M'),
                'revenue' => $revenue
            ];
        }

        return response()->json([
            'stats' => [
                'total_properties' => $totalProperties,
                'active_properties' => $activeProperties,
                'total_bookings' => $totalBookings,
                'total_revenue' => $totalRevenue,
                'average_rating' => 4.5, // Calculate from reviews
                'occupancy_rate' => $totalProperties > 0 ? round(($totalBookings / ($totalProperties * 30)) * 100, 1) : 0
            ],
            'recent_bookings' => $recentBookings,
            'popular_properties' => $propertiesWithViews,
            'monthly_revenue' => $monthlyRevenue,
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'company_name' => $user->getMeta('company_name'),
                'business_license' => $user->getMeta('business_license'),
                'verified' => $user->email_verified_at !== null
            ]
        ]);
    }

    /**
     * Get commercial user properties
     */
    public function properties(Request $request)
    {
        $user = Auth::user();
        
        $query = Property::where('user_id', $user->id);
        
        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        
        // Filter by type
        if ($request->has('type')) {
            $query->where('type', $request->type);
        }
        
        // Search
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('location', 'like', "%{$search}%")
                  ->orWhere('address', 'like', "%{$search}%");
            });
        }
        
        $properties = $query->with(['bookings' => function($query) {
            $query->where('status', 'confirmed');
        }])
        ->orderBy('created_at', 'desc')
        ->paginate($request->per_page ?? 10);
        
        return response()->json($properties);
    }

    /**
     * Get property analytics
     */
    public function propertyAnalytics($id)
    {
        $user = Auth::user();
        
        $property = Property::where('user_id', $user->id)
            ->with(['bookings', 'reviews'])
            ->findOrFail($id);
        
        // Calculate analytics
        $totalBookings = $property->bookings->count();
        $confirmedBookings = $property->bookings->where('status', 'confirmed')->count();
        $totalRevenue = $property->bookings->where('status', 'confirmed')->sum('total_amount');
        $averageRating = $property->reviews->avg('rating') ?? 0;
        
        // Monthly bookings for the last 6 months
        $monthlyBookings = [];
        for ($i = 5; $i >= 0; $i--) {
            $month = Carbon::now()->subMonths($i);
            $bookings = $property->bookings()
                ->whereMonth('created_at', $month->month)
                ->whereYear('created_at', $month->year)
                ->count();
            
            $monthlyBookings[] = [
                'month' => $month->format('M'),
                'bookings' => $bookings
            ];
        }
        
        return response()->json([
            'property' => $property,
            'analytics' => [
                'total_bookings' => $totalBookings,
                'confirmed_bookings' => $confirmedBookings,
                'total_revenue' => $totalRevenue,
                'average_rating' => round($averageRating, 1),
                'views' => $property->views ?? 0,
                'conversion_rate' => $property->views > 0 ? round(($confirmedBookings / $property->views) * 100, 2) : 0
            ],
            'monthly_bookings' => $monthlyBookings
        ]);
    }

    /**
     * Get commercial user profile
     */
    public function profile()
    {
        $user = Auth::user();
        
        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'company_name' => $user->getMeta('company_name'),
                'business_license' => $user->getMeta('business_license'),
                'address' => $user->getMeta('address'),
                'description' => $user->getMeta('description'),
                'verified' => $user->email_verified_at !== null,
                'created_at' => $user->created_at
            ]
        ]);
    }

    /**
     * Update commercial user profile
     */
    public function updateProfile(Request $request)
    {
        $user = Auth::user();
        
        $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'company_name' => 'required|string|max:255',
            'business_license' => 'required|string|max:255',
            'address' => 'required|string|max:500',
            'description' => 'nullable|string|max:1000'
        ]);
        
        $user->update([
            'name' => $request->name,
            'phone' => $request->phone
        ]);
        
        // Update meta data
        $user->setMeta('company_name', $request->company_name);
        $user->setMeta('business_license', $request->business_license);
        $user->setMeta('address', $request->address);
        $user->setMeta('description', $request->description);
        
        return response()->json([
            'message' => 'Profile updated successfully',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'company_name' => $user->getMeta('company_name'),
                'business_license' => $user->getMeta('business_license'),
                'address' => $user->getMeta('address'),
                'description' => $user->getMeta('description'),
                'verified' => $user->email_verified_at !== null
            ]
        ]);
    }
}

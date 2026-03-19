<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Property;
use App\Models\Application;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class AdminController extends Controller
{
    // Users Management
    public function getUsers(Request $request): JsonResponse
    {
        $query = User::query();

        // Apply filters
        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('first_name', 'like', "%{$request->search}%")
                  ->orWhere('last_name', 'like', "%{$request->search}%")
                  ->orWhere('email', 'like', "%{$request->search}%");
            });
        }

        if ($request->user_type) {
            $query->where('user_type', $request->user_type);
        }

        if ($request->status) {
            $query->where('is_active', $request->status === 'active');
        }

        $users = $query->orderBy('created_at', 'desc')->paginate(10);

        return response()->json([
            'data' => $users->items(),
            'pagination' => [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'per_page' => $users->perPage(),
                'total' => $users->total(),
            ]
        ]);
    }

    public function getUserStats(): JsonResponse
    {
        $stats = [
            'total' => User::count(),
            'active' => User::where('is_active', true)->count(),
            'inactive' => User::where('is_active', false)->count(),
            'suspended' => User::where('is_active', false)->where('user_type', '!=', 'admin')->count(),
            'admins' => User::where('user_type', 'admin')->count(),
            'agents' => User::where('user_type', 'agent')->count(),
            'landlords' => User::where('user_type', 'landlord')->count(),
            'tenants' => User::where('user_type', 'tenant')->count(),
            'newThisMonth' => User::whereMonth('created_at', now()->month)->count(),
            'activeThisMonth' => User::where('is_active', true)->whereMonth('updated_at', now()->month)->count(),
        ];

        return response()->json(['data' => $stats]);
    }

    public function createUser(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'phone' => 'required|string|max:20',
            'user_type' => 'required|in:tenant,landlord,agent,admin',
            'password' => 'required|string|min:8',
            'status' => 'sometimes|in:active,inactive,suspended',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = User::create([
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'email' => $request->email,
            'phone' => $request->phone,
            'user_type' => $request->user_type,
            'password' => bcrypt($request->password),
            'is_active' => $request->status === 'active' ?? true,
        ]);

        return response()->json([
            'message' => 'User created successfully',
            'data' => $user
        ], 201);
    }

    public function updateUser(Request $request, $userId): JsonResponse
    {
        $user = User::findOrFail($userId);

        $validator = Validator::make($request->all(), [
            'first_name' => 'sometimes|required|string|max:255',
            'last_name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|email|unique:users,email,' . $userId,
            'phone' => 'sometimes|required|string|max:20',
            'user_type' => 'sometimes|required|in:tenant,landlord,agent,admin',
            'password' => 'sometimes|required|string|min:8',
            'status' => 'sometimes|in:active,inactive,suspended',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $updateData = [
            'first_name' => $request->first_name ?? $user->first_name,
            'last_name' => $request->last_name ?? $user->last_name,
            'email' => $request->email ?? $user->email,
            'phone' => $request->phone ?? $user->phone,
            'user_type' => $request->user_type ?? $user->user_type,
        ];

        if ($request->password) {
            $updateData['password'] = bcrypt($request->password);
        }

        if ($request->status) {
            $updateData['is_active'] = $request->status === 'active';
        }

        $user->update($updateData);

        return response()->json([
            'message' => 'User updated successfully',
            'data' => $user
        ]);
    }

    public function deleteUser($userId): JsonResponse
    {
        $user = User::findOrFail($userId);
        
        // Prevent deletion of the last admin
        if ($user->user_type === 'admin' && User::where('user_type', 'admin')->count() <= 1) {
            return response()->json([
                'message' => 'Cannot delete the last admin user'
            ], 422);
        }

        $user->delete();

        return response()->json([
            'message' => 'User deleted successfully'
        ]);
    }

    public function updateUserStatus(Request $request, $userId): JsonResponse
    {
        $user = User::findOrFail($userId);

        $validator = Validator::make($request->all(), [
            'status' => 'required|in:active,inactive,suspended',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $user->update([
            'is_active' => $request->status === 'active'
        ]);

        return response()->json([
            'message' => 'User status updated successfully',
            'data' => $user
        ]);
    }

    // Properties Management
    public function getProperties(Request $request): JsonResponse
    {
        $query = Property::with(['owner', 'agent']);

        // Apply filters
        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('title', 'like', "%{$request->search}%")
                  ->orWhere('description', 'like', "%{$request->search}%")
                  ->orWhere('location', 'like', "%{$request->search}%");
            });
        }

        if ($request->type) {
            $query->where('type', $request->type);
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        if ($request->min_price) {
            $query->where('price', '>=', $request->min_price);
        }

        if ($request->max_price) {
            $query->where('price', '<=', $request->max_price);
        }

        $properties = $query->orderBy('created_at', 'desc')->paginate(10);

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

    public function getPropertyStats(): JsonResponse
    {
        $stats = [
            'total_properties' => Property::count(),
            'available_properties' => Property::where('status', 'available')->count(),
            'rented_properties' => Property::where('status', 'rented')->count(),
            'maintenance_properties' => Property::where('status', 'maintenance')->count(),
            'total_value' => Property::sum('price'),
            'avg_price' => Property::avg('price'),
            'featured_properties' => Property::where('featured', true)->count(),
            'new_this_month' => Property::where('created_at', '>=', now()->startOfMonth())->count(),
        ];

        return response()->json(['data' => $stats]);
    }

    // Transactions Management
    public function getTransactions(Request $request): JsonResponse
    {
        // Mock transaction data for now
        $transactions = [
            [
                'id' => 1,
                'type' => 'rent_payment',
                'amount' => 800000,
                'currency' => 'TZS',
                'status' => 'completed',
                'description' => 'Monthly rent payment for Modern 3-Bedroom Villa in Masaki',
                'reference' => 'TXN-2024-001',
                'payment_method' => 'mobile_money',
                'user' => [
                    'id' => 1,
                    'name' => 'John Doe',
                    'email' => 'john.doe@example.com',
                    'type' => 'tenant'
                ],
                'created_at' => '2024-03-20T10:30:00Z',
                'updated_at' => '2024-03-20T10:30:00Z',
            ],
            [
                'id' => 2,
                'type' => 'commission',
                'amount' => 125000,
                'currency' => 'TZS',
                'status' => 'completed',
                'description' => 'Commission payment for property rental',
                'reference' => 'TXN-2024-002',
                'payment_method' => 'bank_transfer',
                'user' => [
                    'id' => 2,
                    'name' => 'Michael Johnson',
                    'email' => 'michael.johnson@oweru.com',
                    'type' => 'agent'
                ],
                'created_at' => '2024-03-19T14:20:00Z',
                'updated_at' => '2024-03-19T14:20:00Z',
            ]
        ];

        return response()->json(['data' => $transactions]);
    }

    public function getTransactionStats(): JsonResponse
    {
        $stats = [
            'total_transactions' => 5,
            'total_revenue' => 2625000,
            'total_fees' => 26250,
            'net_revenue' => 2598750,
            'pending_transactions' => 1,
            'completed_transactions' => 3,
            'failed_transactions' => 1,
            'refunded_transactions' => 1,
            'avg_transaction_amount' => 525000,
            'revenue_this_month' => 2625000,
            'revenue_growth' => 15.5,
            'transaction_growth' => 12.3,
        ];

        return response()->json(['data' => $stats]);
    }

    // Commission Control
    public function getCommissionRules(Request $request): JsonResponse
    {
        // Mock commission rules data
        $rules = [
            [
                'id' => 1,
                'name' => 'Standard Rental Commission',
                'description' => '5% commission on all rental properties',
                'type' => 'percentage',
                'value' => 5,
                'min_amount' => 100000,
                'applies_to' => 'rent',
                'user_type' => 'agent',
                'is_active' => true,
                'created_at' => '2024-01-01T00:00:00Z',
                'updated_at' => '2024-01-01T00:00:00Z',
            ]
        ];

        return response()->json(['data' => $rules]);
    }

    public function getCommissionPayments(Request $request): JsonResponse
    {
        // Mock commission payments data
        $payments = [
            [
                'id' => 1,
                'agent' => [
                    'id' => 1,
                    'name' => 'Michael Johnson',
                    'email' => 'michael.johnson@oweru.com',
                    'code' => 'DAL001'
                ],
                'property' => [
                    'id' => 1,
                    'title' => 'Modern 3-Bedroom Villa in Masaki',
                    'address' => 'Masaki, Dar es Salaam',
                    'price' => 2500000
                ],
                'type' => 'rent',
                'amount' => 125000,
                'percentage' => 5,
                'status' => 'paid',
                'due_date' => '2024-03-15T00:00:00Z',
                'paid_date' => '2024-03-15T14:30:00Z',
                'reference' => 'COM-2024-001',
                'created_at' => '2024-03-01T00:00:00Z',
                'updated_at' => '2024-03-15T14:30:00Z',
            ]
        ];

        return response()->json(['data' => $payments]);
    }

    public function getCommissionStats(): JsonResponse
    {
        $stats = [
            'total_commissions' => 3,
            'pending_commissions' => 1,
            'approved_commissions' => 1,
            'paid_commissions' => 1,
            'total_amount' => 210000,
            'avg_commission_rate' => 4.33,
            'top_earner' => [
                'name' => 'Michael Johnson',
                'total_earned' => 125000,
                'transactions' => 1
            ],
            'this_month' => [
                'total' => 210000,
                'paid' => 125000,
                'pending' => 40000
            ]
        ];

        return response()->json(['data' => $stats]);
    }

    // System Settings
    public function getSettings(): JsonResponse
    {
        $settings = [
            'site_name' => 'Oweru Rental',
            'site_description' => 'Professional property rental management system',
            'contact_email' => 'admin@oweru.com',
            'contact_phone' => '+255777888999',
            'maintenance_mode' => false,
            'allow_registration' => true,
            'require_email_verification' => true,
            'require_phone_verification' => false,
            'max_login_attempts' => 5,
            'session_timeout' => 120,
            'default_user_role' => 'tenant',
            'enable_notifications' => true,
            'enable_analytics' => true,
            'enable_backup' => true,
            'backup_frequency' => 'daily',
            'storage_quota' => 10000000000,
            'enable_two_factor' => false,
            'password_min_length' => 8,
            'password_require_special_chars' => true,
            'password_require_numbers' => true,
            'password_require_uppercase' => true,
        ];

        return response()->json(['data' => $settings]);
    }

    public function updateSettings(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'site_name' => 'sometimes|string|max:255',
            'site_description' => 'sometimes|string|max:1000',
            'contact_email' => 'sometimes|email',
            'contact_phone' => 'sometimes|string|max:20',
            'maintenance_mode' => 'sometimes|boolean',
            'allow_registration' => 'sometimes|boolean',
            'require_email_verification' => 'sometimes|boolean',
            'require_phone_verification' => 'sometimes|boolean',
            'max_login_attempts' => 'sometimes|integer|min:1|max:10',
            'session_timeout' => 'sometimes|integer|min:5|max:1440',
            'default_user_role' => 'sometimes|in:tenant,landlord,agent,admin',
            'enable_notifications' => 'sometimes|boolean',
            'enable_analytics' => 'sometimes|boolean',
            'enable_backup' => 'sometimes|boolean',
            'backup_frequency' => 'sometimes|in:hourly,daily,weekly,monthly',
            'storage_quota' => 'sometimes|integer|min:1000000',
            'enable_two_factor' => 'sometimes|boolean',
            'password_min_length' => 'sometimes|integer|min:6|max:20',
            'password_require_special_chars' => 'sometimes|boolean',
            'password_require_numbers' => 'sometimes|boolean',
            'password_require_uppercase' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // For now, just return success
        // TODO: Actually update settings in database

        return response()->json([
            'message' => 'Settings updated successfully'
        ]);
    }

    // Verification Management
    public function getVerificationRequests(Request $request): JsonResponse
    {
        // Mock verification requests data
        $requests = [
            [
                'id' => 1,
                'user' => [
                    'id' => 1,
                    'name' => 'John Doe',
                    'email' => 'john.doe@example.com',
                    'phone' => '+255 712 345 678',
                    'type' => 'tenant'
                ],
                'type' => 'identity',
                'status' => 'pending',
                'priority' => 'medium',
                'documents' => [
                    [
                        'type' => 'national_id',
                        'url' => '/docs/id.jpg',
                        'file_name' => 'national_id.jpg',
                        'file_size' => 1048576,
                        'uploaded_at' => '2024-03-20T10:30:00Z'
                    ]
                ],
                'metadata' => [
                    'submitted_at' => '2024-03-20T10:30:00Z',
                    'verification_method' => 'document_upload',
                    'ip_address' => '192.168.1.100'
                ],
                'created_at' => '2024-03-20T10:30:00Z',
                'updated_at' => '2024-03-20T10:30:00Z',
            ]
        ];

        return response()->json(['data' => $requests]);
    }

    public function getVerificationStats(): JsonResponse
    {
        $stats = [
            'total_requests' => 4,
            'pending_requests' => 1,
            'approved_requests' => 1,
            'rejected_requests' => 1,
            'in_review_requests' => 1,
            'verification_rate' => 75.0,
            'avg_processing_time' => 2.5,
            'requests_this_month' => 4,
            'top_verification_type' => 'identity',
            'urgent_requests' => 0,
        ];

        return response()->json(['data' => $stats]);
    }

    // Alerts Management
    public function getAlerts(Request $request): JsonResponse
    {
        // Mock alerts data
        $alerts = [
            [
                'id' => 1,
                'title' => 'Database Connection Timeout',
                'description' => 'Database connection timed out after 30 seconds of inactivity.',
                'type' => 'system',
                'severity' => 'critical',
                'status' => 'active',
                'source' => 'Database Monitor',
                'category' => 'Database',
                'metadata' => [
                    'triggered_at' => '2024-03-20T10:30:00Z',
                    'details' => 'Connection pool exhausted.',
                    'action_required' => true,
                    'auto_resolve' => false,
                    'escalation_level' => 1
                ],
                'created_at' => '2024-03-20T10:30:00Z',
                'updated_at' => '2024-03-20T10:30:00Z',
            ]
        ];

        return response()->json(['data' => $alerts]);
    }

    public function getAlertStats(): JsonResponse
    {
        $stats = [
            'total_alerts' => 5,
            'active_alerts' => 3,
            'resolved_alerts' => 1,
            'critical_alerts' => 1,
            'urgent_alerts' => 1,
            'alerts_this_hour' => 1,
            'alerts_today' => 3,
            'alerts_this_week' => 5,
            'avg_resolution_time' => 2.5,
            'top_alert_type' => 'system',
            'top_severity' => 'critical',
        ];

        return response()->json(['data' => $stats]);
    }
}

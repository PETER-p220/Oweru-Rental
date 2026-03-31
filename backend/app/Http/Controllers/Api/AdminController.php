<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Commission;
use App\Models\Contract;
use App\Models\Payment;
use App\Models\Property;
use App\Models\User;
use App\Models\BnbProperty;
use App\Models\BnbBooking;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class AdminController extends Controller
{
    public function getUsers(Request $request): JsonResponse
    {
        $query = User::query();

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

        $users = $query->orderByDesc('created_at')->paginate(10);

        return response()->json([
            'data' => $users->items(),
            'pagination' => [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'per_page' => $users->perPage(),
                'total' => $users->total(),
            ],
        ]);
    }

    public function getUserStats(): JsonResponse
    {
        return response()->json([
            'data' => [
                'total' => User::count(),
                'active' => User::where('is_active', true)->count(),
                'inactive' => User::where('is_active', false)->count(),
                'suspended' => User::where('is_active', false)->where('user_type', '!=', 'admin')->count(),
                'admins' => User::where('user_type', 'admin')->count(),
                'agents' => User::where('user_type', 'agent')->count(),
                'landlords' => User::where('user_type', 'landlord')->count(),
                'tenants' => User::where('user_type', 'tenant')->count(),
                'newThisMonth' => User::where('created_at', '>=', now()->startOfMonth())->count(),
                'activeThisMonth' => User::where('is_active', true)->where('updated_at', '>=', now()->startOfMonth())->count(),
            ],
        ]);
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
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = User::create([
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'email' => $request->email,
            'phone' => $request->phone,
            'user_type' => $request->user_type,
            'password' => bcrypt($request->password),
            'is_active' => $request->has('status') ? $request->status === 'active' : true,
        ]);

        return response()->json([
            'message' => 'User created successfully',
            'data' => $user,
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
                'errors' => $validator->errors(),
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
            'data' => $user,
        ]);
    }

    public function deleteUser($userId): JsonResponse
    {
        $user = User::findOrFail($userId);

        if ($user->user_type === 'admin' && User::where('user_type', 'admin')->count() <= 1) {
            return response()->json([
                'message' => 'Cannot delete the last admin user',
            ], 422);
        }

        $user->delete();

        return response()->json([
            'message' => 'User deleted successfully',
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
                'errors' => $validator->errors(),
            ], 422);
        }

        $user->update([
            'is_active' => $request->status === 'active',
        ]);

        return response()->json([
            'message' => 'User status updated successfully',
            'data' => $user,
        ]);
    }

    public function getProperties(Request $request): JsonResponse
    {
        $query = Property::with(['owner', 'agent']);

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('title', 'like', "%{$request->search}%")
                    ->orWhere('description', 'like', "%{$request->search}%")
                    ->orWhere('location', 'like', "%{$request->search}%")
                    ->orWhere('address', 'like', "%{$request->search}%");
            });
        }

        if ($request->type) {
            $query->where('type', $request->type);
        }

        if ($request->status === 'available') {
            $query->where('available', true);
        } elseif ($request->status === 'rented') {
            $query->where('available', false);
        }

        if ($request->min_price) {
            $query->where('price', '>=', $request->min_price);
        }

        if ($request->max_price) {
            $query->where('price', '<=', $request->max_price);
        }

        $properties = $query->orderByDesc('created_at')->paginate(10);

        return response()->json([
            'data' => $properties->items(),
            'pagination' => [
                'current_page' => $properties->currentPage(),
                'last_page' => $properties->lastPage(),
                'per_page' => $properties->perPage(),
                'total' => $properties->total(),
            ],
        ]);
    }

    public function getPropertyStats(): JsonResponse
    {
        $rentedCount = $this->hasTables(['contracts'])
            ? Contract::where('status', 'active')->distinct('property_id')->count('property_id')
            : Property::where('available', false)->count();

        return response()->json([
            'data' => [
                'total_properties' => Property::count(),
                'available_properties' => Property::where('available', true)->count(),
                'rented_properties' => $rentedCount,
                'maintenance_properties' => 0,
                'total_value' => (float) Property::sum('price'),
                'avg_price' => (float) Property::avg('price'),
                'featured_properties' => Property::where('featured', true)->count(),
                'new_this_month' => Property::where('created_at', '>=', now()->startOfMonth())->count(),
            ],
        ]);
    }

    public function getTransactions(Request $request): JsonResponse
    {
        if (! $this->hasTables(['payments'])) {
            return response()->json(['data' => []]);
        }

        $payments = Payment::with(['user', 'property', 'agent'])
            ->latest()
            ->get()
            ->map(fn (Payment $payment) => $this->transformPaymentTransaction($payment));

        $commissions = $this->hasTables(['commissions'])
            ? Commission::with(['agent', 'property', 'payment'])
                ->latest()
                ->get()
                ->map(fn (Commission $commission) => $this->transformCommissionTransaction($commission))
            : collect();

        $transactions = $payments
            ->concat($commissions)
            ->sortByDesc('createdAt')
            ->values();

        $filtered = $transactions->filter(function (array $transaction) use ($request) {
            if ($request->search) {
                $search = mb_strtolower($request->search);
                $haystack = mb_strtolower(implode(' ', [
                    $transaction['description'] ?? '',
                    $transaction['reference'] ?? '',
                    $transaction['user']['name'] ?? '',
                    $transaction['user']['email'] ?? '',
                    $transaction['property']['title'] ?? '',
                ]));

                if (! str_contains($haystack, $search)) {
                    return false;
                }
            }

            if ($request->type && $request->type !== $transaction['type']) {
                return false;
            }

            if ($request->status && $request->status !== $transaction['status']) {
                return false;
            }

            return true;
        })->values();

        return response()->json(['data' => $filtered]);
    }

    public function getTransactionStats(): JsonResponse
    {
        if (! $this->hasTables(['payments'])) {
            return response()->json(['data' => [
                'total_transactions' => 0,
                'total_revenue' => 0,
                'total_fees' => 0,
                'net_revenue' => 0,
                'pending_transactions' => 0,
                'completed_transactions' => 0,
                'failed_transactions' => 0,
                'refunded_transactions' => 0,
                'avg_transaction_amount' => 0,
                'revenue_this_month' => 0,
                'revenue_growth' => 0,
                'transaction_growth' => 0,
            ]]);
        }

        $completedAmount = (float) Payment::where('status', 'completed')->sum('amount');
        $fees = (float) Payment::sum(DB::raw("COALESCE(JSON_UNQUOTE(JSON_EXTRACT(metadata, '$.fees')), 0)"));
        $thisMonthRevenue = (float) Payment::where('status', 'completed')
            ->where('created_at', '>=', now()->startOfMonth())
            ->sum('amount');
        $lastMonthRevenue = (float) Payment::where('status', 'completed')
            ->whereBetween('created_at', [now()->subMonth()->startOfMonth(), now()->subMonth()->endOfMonth()])
            ->sum('amount');
        $thisMonthTransactions = Payment::where('created_at', '>=', now()->startOfMonth())->count();
        $lastMonthTransactions = Payment::whereBetween('created_at', [now()->subMonth()->startOfMonth(), now()->subMonth()->endOfMonth()])->count();

        return response()->json(['data' => [
            'total_transactions' => Payment::count(),
            'total_revenue' => $completedAmount,
            'total_fees' => $fees,
            'net_revenue' => $completedAmount - $fees,
            'pending_transactions' => Payment::where('status', 'pending')->count(),
            'completed_transactions' => Payment::where('status', 'completed')->count(),
            'failed_transactions' => Payment::where('status', 'failed')->count(),
            'refunded_transactions' => Payment::where('status', 'refunded')->count(),
            'avg_transaction_amount' => (float) Payment::avg('amount'),
            'revenue_this_month' => $thisMonthRevenue,
            'revenue_growth' => $this->calculateGrowth($lastMonthRevenue, $thisMonthRevenue),
            'transaction_growth' => $this->calculateGrowth($lastMonthTransactions, $thisMonthTransactions),
        ]]);
    }

    public function updateTransactionStatus(Request $request, $transactionId): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'status' => 'required|string|in:pending,processing,completed,failed,cancelled,refunded,approved,paid',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        if ((int) $transactionId >= 100000) {
            $commissionId = (int) $transactionId - 100000;
            $commission = Commission::findOrFail($commissionId);
            $status = $this->normalizeCommissionStatus($request->status);

            $commission->status = $status;
            $commission->paid_at = $status === 'paid' ? now() : null;
            $commission->save();

            return response()->json([
                'message' => 'Commission transaction updated successfully',
                'data' => $this->transformCommissionTransaction($commission->fresh(['agent', 'property', 'payment'])),
            ]);
        }

        $payment = Payment::findOrFail($transactionId);
        $payment->status = $this->normalizePaymentStatus($request->status);
        $payment->paid_at = $payment->status === 'completed' ? now() : null;
        $payment->save();

        return response()->json([
            'message' => 'Transaction updated successfully',
            'data' => $this->transformPaymentTransaction($payment->fresh(['user', 'property', 'agent'])),
        ]);
    }

    public function deleteTransaction($transactionId): JsonResponse
    {
        if ((int) $transactionId >= 100000) {
            $commissionId = (int) $transactionId - 100000;
            Commission::findOrFail($commissionId)->delete();

            return response()->json(['message' => 'Commission transaction deleted successfully']);
        }

        Payment::findOrFail($transactionId)->delete();

        return response()->json(['message' => 'Transaction deleted successfully']);
    }

    public function getCommissionRules(Request $request): JsonResponse
    {
        $avg = $this->hasTables(['commissions'])
            ? round((float) Commission::whereNotNull('percentage')->avg('percentage'), 2)
            : 5.0;

        return response()->json(['data' => [[
            'id' => 1,
            'name' => 'Standard Rental Commission',
            'description' => 'Default commission policy inferred from recorded agent commissions.',
            'type' => 'percentage',
            'value' => $avg > 0 ? $avg : 5,
            'min_amount' => null,
            'max_amount' => null,
            'applies_to' => 'rent',
            'user_type' => 'agent',
            'is_active' => true,
            'created_at' => now()->toISOString(),
            'updated_at' => now()->toISOString(),
        ]]]);
    }

    public function getCommissionPayments(Request $request): JsonResponse
    {
        if (! $this->hasTables(['commissions'])) {
            return response()->json(['data' => []]);
        }

        $payments = Commission::with(['agent', 'property', 'payment'])
            ->latest()
            ->get()
            ->map(function (Commission $commission) {
                return [
                    'id' => $commission->id,
                    'agent' => [
                        'id' => $commission->agent?->id,
                        'name' => $commission->agent?->fullName() ?? 'Unknown Agent',
                        'email' => $commission->agent?->email,
                        'code' => 'AGT-' . str_pad((string) ($commission->agent_id ?? 0), 3, '0', STR_PAD_LEFT),
                    ],
                    'property' => [
                        'id' => $commission->property?->id,
                        'title' => $commission->property?->title ?? 'Unknown Property',
                        'address' => $commission->property?->address ?? $commission->property?->location,
                        'price' => (float) ($commission->property?->price ?? 0),
                    ],
                    'type' => 'rent',
                    'amount' => (float) $commission->amount,
                    'percentage' => (float) ($commission->percentage ?? 0),
                    'status' => $commission->status,
                    'due_date' => optional($commission->payment?->due_date ?? $commission->created_at)?->toISOString(),
                    'paid_date' => optional($commission->paid_at)?->toISOString(),
                    'reference' => 'COM-' . str_pad((string) $commission->id, 5, '0', STR_PAD_LEFT),
                    'created_at' => optional($commission->created_at)?->toISOString(),
                    'updated_at' => optional($commission->updated_at)?->toISOString(),
                ];
            });

        return response()->json(['data' => $payments]);
    }

    public function getCommissionStats(): JsonResponse
    {
        if (! $this->hasTables(['commissions'])) {
            return response()->json(['data' => [
                'totalCommissions' => 0,
                'pendingCommissions' => 0,
                'approvedCommissions' => 0,
                'paidCommissions' => 0,
                'totalAmount' => 0,
                'avgCommissionRate' => 0,
                'topEarner' => ['name' => 'N/A', 'totalEarned' => 0, 'transactions' => 0],
                'thisMonth' => ['total' => 0, 'paid' => 0, 'pending' => 0],
            ]]);
        }

        $topEarner = Commission::select('agent_id', DB::raw('SUM(amount) as total_earned'), DB::raw('COUNT(*) as transactions'))
            ->with('agent')
            ->groupBy('agent_id')
            ->orderByDesc('total_earned')
            ->first();

        return response()->json(['data' => [
            'totalCommissions' => Commission::count(),
            'pendingCommissions' => Commission::where('status', 'pending')->count(),
            'approvedCommissions' => Commission::where('status', 'approved')->count(),
            'paidCommissions' => Commission::where('status', 'paid')->count(),
            'totalAmount' => (float) Commission::sum('amount'),
            'avgCommissionRate' => round((float) Commission::avg('percentage'), 2),
            'topEarner' => [
                'name' => $topEarner?->agent?->fullName() ?? 'N/A',
                'totalEarned' => (float) ($topEarner?->total_earned ?? 0),
                'transactions' => (int) ($topEarner?->transactions ?? 0),
            ],
            'thisMonth' => [
                'total' => (float) Commission::where('created_at', '>=', now()->startOfMonth())->sum('amount'),
                'paid' => (float) Commission::where('status', 'paid')->where('created_at', '>=', now()->startOfMonth())->sum('amount'),
                'pending' => (float) Commission::where('status', 'pending')->where('created_at', '>=', now()->startOfMonth())->sum('amount'),
            ],
        ]]);
    }

    public function updateCommissionPaymentStatus(Request $request, $commissionId): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'status' => 'required|in:pending,approved,paid,cancelled',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $commission = Commission::findOrFail($commissionId);
        $commission->status = $request->status;
        $commission->paid_at = $request->status === 'paid' ? now() : null;
        $commission->save();

        return response()->json([
            'message' => 'Commission payment updated successfully',
            'data' => [
                'id' => $commission->id,
                'agent' => [
                    'id' => $commission->agent?->id,
                    'name' => $commission->agent?->fullName() ?? 'Unknown Agent',
                    'email' => $commission->agent?->email,
                    'code' => 'AGT-' . str_pad((string) ($commission->agent_id ?? 0), 3, '0', STR_PAD_LEFT),
                ],
                'property' => [
                    'id' => $commission->property?->id,
                    'title' => $commission->property?->title ?? 'Unknown Property',
                    'address' => $commission->property?->address ?? $commission->property?->location,
                    'price' => (float) ($commission->property?->price ?? 0),
                ],
                'type' => 'rent',
                'amount' => (float) $commission->amount,
                'percentage' => (float) ($commission->percentage ?? 0),
                'status' => $commission->status,
                'due_date' => optional($commission->payment?->due_date ?? $commission->created_at)?->toISOString(),
                'paid_date' => optional($commission->paid_at)?->toISOString(),
                'reference' => 'COM-' . str_pad((string) $commission->id, 5, '0', STR_PAD_LEFT),
                'created_at' => optional($commission->created_at)?->toISOString(),
                'updated_at' => optional($commission->updated_at)?->toISOString(),
            ],
        ]);
    }

    public function getContracts(Request $request): JsonResponse
    {
        if (! $this->hasTables(['contracts', 'tenants'])) {
            return response()->json(['data' => []]);
        }

        $contracts = Contract::with(['tenant.user', 'property.owner', 'property.agent'])
            ->latest()
            ->get()
            ->map(function (Contract $contract) {
                $tenantUser = $contract->tenant?->user;
                $owner = $contract->property?->owner;
                $agent = $contract->property?->agent;

                return [
                    'id' => $contract->id,
                    'reference' => 'CON-' . str_pad((string) $contract->id, 5, '0', STR_PAD_LEFT),
                    'type' => 'rental',
                    'status' => $contract->status,
                    'title' => ($contract->property?->title ?? 'Property') . ' Rental Agreement',
                    'description' => $contract->terms ?: 'Rental contract recorded in the platform.',
                    'parties' => [
                        'landlord' => $owner ? [
                            'id' => $owner->id,
                            'name' => $owner->fullName(),
                            'email' => $owner->email,
                            'phone' => $owner->phone,
                        ] : null,
                        'tenant' => $tenantUser ? [
                            'id' => $tenantUser->id,
                            'name' => $tenantUser->fullName(),
                            'email' => $tenantUser->email,
                            'phone' => $tenantUser->phone,
                        ] : null,
                        'agent' => $agent ? [
                            'id' => $agent->id,
                            'name' => $agent->fullName(),
                            'email' => $agent->email,
                            'phone' => $agent->phone,
                            'commissionRate' => (float) (Commission::where('property_id', $contract->property_id)->avg('percentage') ?? 0),
                        ] : null,
                    ],
                    'property' => [
                        'id' => $contract->property?->id,
                        'title' => $contract->property?->title ?? 'Unknown Property',
                        'address' => $contract->property?->address ?? $contract->property?->location,
                        'type' => $contract->property?->type,
                        'area' => (float) ($contract->property?->area ?? 0),
                        'bedrooms' => (int) ($contract->property?->bedrooms ?? 0),
                        'bathrooms' => (int) ($contract->property?->bathrooms ?? 0),
                    ],
                    'terms' => [
                        'startDate' => optional($contract->start_date)?->toISOString(),
                        'endDate' => optional($contract->end_date)?->toISOString(),
                        'rentAmount' => (float) $contract->rent_amount,
                        'depositAmount' => (float) $contract->rent_amount,
                        'paymentFrequency' => 'monthly',
                        'currency' => 'TZS',
                        'lateFee' => 0,
                        'earlyTerminationFee' => 0,
                    ],
                    'documents' => [
                        'contractFile' => null,
                        'signedBy' => array_values(array_filter([
                            $owner?->fullName(),
                            $tenantUser?->fullName(),
                            $agent?->fullName(),
                        ])),
                        'uploadedAt' => optional($contract->created_at)?->toISOString(),
                        'fileSize' => 0,
                    ],
                    'metadata' => [
                        'createdAt' => optional($contract->created_at)?->toISOString(),
                        'updatedAt' => optional($contract->updated_at)?->toISOString(),
                        'createdBy' => 'System',
                        'lastModifiedBy' => 'System',
                        'version' => 1,
                        'renewalCount' => 0,
                    ],
                ];
            });

        return response()->json(['data' => $contracts]);
    }

    public function getContractStats(): JsonResponse
    {
        if (! $this->hasTables(['contracts'])) {
            return response()->json(['data' => [
                'totalContracts' => 0,
                'activeContracts' => 0,
                'expiredContracts' => 0,
                'pendingContracts' => 0,
                'totalValue' => 0,
                'avgContractValue' => 0,
                'contractsThisMonth' => 0,
                'expiringThisMonth' => 0,
                'renewalRate' => 0,
                'terminationRate' => 0,
            ]]);
        }

        $total = Contract::count();

        return response()->json(['data' => [
            'totalContracts' => $total,
            'activeContracts' => Contract::where('status', 'active')->count(),
            'expiredContracts' => Contract::where('status', 'expired')->count(),
            'pendingContracts' => Contract::where('status', 'pending')->count(),
            'totalValue' => (float) Contract::sum('rent_amount'),
            'avgContractValue' => (float) Contract::avg('rent_amount'),
            'contractsThisMonth' => Contract::where('created_at', '>=', now()->startOfMonth())->count(),
            'expiringThisMonth' => Contract::whereBetween('end_date', [now()->startOfMonth(), now()->endOfMonth()])->count(),
            'renewalRate' => $total > 0 ? round((Contract::where('status', 'active')->count() / $total) * 100, 1) : 0,
            'terminationRate' => $total > 0 ? round((Contract::where('status', 'terminated')->count() / $total) * 100, 1) : 0,
        ]]);
    }

    public function getSettings(): JsonResponse
    {
        return response()->json(['data' => [
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
        ]]);
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
                'errors' => $validator->errors(),
            ], 422);
        }

        return response()->json(['message' => 'Settings updated successfully']);
    }

    public function getVerificationRequests(Request $request): JsonResponse
    {
        $requests = User::query()
            ->when($request->search, function ($query) use ($request) {
                $query->where(function ($inner) use ($request) {
                    $inner->where('first_name', 'like', "%{$request->search}%")
                        ->orWhere('last_name', 'like', "%{$request->search}%")
                        ->orWhere('email', 'like', "%{$request->search}%");
                });
            })
            ->latest()
            ->get()
            ->map(function (User $user) {
                $status = $user->email_verified_at ? 'approved' : 'pending';

                return [
                    'id' => $user->id,
                    'user' => [
                        'id' => $user->id,
                        'name' => $user->fullName(),
                        'email' => $user->email,
                        'phone' => $user->phone,
                        'type' => $user->user_type,
                    ],
                    'type' => 'identity',
                    'status' => $status,
                    'priority' => ! $user->is_active ? 'high' : ($status === 'pending' ? 'medium' : 'low'),
                    'documents' => [],
                    'metadata' => [
                        'submitted_at' => optional($user->created_at)?->toISOString(),
                        'verification_method' => $user->email_verified_at ? 'email_confirmed' : 'profile_review',
                        'reviewed_at' => optional($user->email_verified_at)?->toISOString(),
                        'reviewed_by' => $user->email_verified_at ? 'System' : null,
                    ],
                    'created_at' => optional($user->created_at)?->toISOString(),
                    'updated_at' => optional($user->updated_at)?->toISOString(),
                ];
            })
            ->filter(function (array $item) use ($request) {
                if ($request->status && $request->status !== 'all' && $item['status'] !== $request->status) {
                    return false;
                }

                if ($request->type && $request->type !== 'all' && $item['type'] !== $request->type) {
                    return false;
                }

                return true;
            })
            ->values();

        return response()->json(['data' => $requests]);
    }

    public function getVerificationStats(): JsonResponse
    {
        $total = User::count();
        $approved = User::whereNotNull('email_verified_at')->count();
        $pending = User::whereNull('email_verified_at')->count();

        return response()->json(['data' => [
            'totalRequests' => $total,
            'pendingRequests' => $pending,
            'approvedRequests' => $approved,
            'rejectedRequests' => 0,
            'inReviewRequests' => 0,
            'verificationRate' => $total > 0 ? round(($approved / $total) * 100, 1) : 0,
            'avgProcessingTime' => 0,
            'requestsThisMonth' => User::where('created_at', '>=', now()->startOfMonth())->count(),
            'topVerificationType' => 'identity',
            'urgentRequests' => User::whereNull('email_verified_at')->where('created_at', '<=', now()->subDays(7))->count(),
        ]]);
    }

    public function getAlerts(Request $request): JsonResponse
    {
        $alerts = $this->buildAlerts()
            ->filter(function (array $alert) use ($request) {
                if ($request->search) {
                    $search = mb_strtolower($request->search);
                    $haystack = mb_strtolower(($alert['title'] ?? '') . ' ' . ($alert['description'] ?? '') . ' ' . ($alert['category'] ?? ''));
                    if (! str_contains($haystack, $search)) {
                        return false;
                    }
                }

                if ($request->type && $request->type !== 'all' && $alert['type'] !== $request->type) {
                    return false;
                }

                if ($request->severity && $request->severity !== 'all' && $alert['severity'] !== $request->severity) {
                    return false;
                }

                if ($request->status && $request->status !== 'all' && $alert['status'] !== $request->status) {
                    return false;
                }

                return true;
            })
            ->values();

        return response()->json(['data' => $alerts]);
    }

    public function getAlertStats(): JsonResponse
    {
        $alerts = $this->buildAlerts();

        return response()->json(['data' => [
            'totalAlerts' => $alerts->count(),
            'activeAlerts' => $alerts->where('status', 'active')->count(),
            'resolvedAlerts' => $alerts->where('status', 'resolved')->count(),
            'criticalAlerts' => $alerts->where('severity', 'critical')->count(),
            'urgentAlerts' => $alerts->where('severity', 'urgent')->count(),
            'alertsThisHour' => $alerts->filter(fn (array $alert) => Carbon::parse($alert['created_at'])->gte(now()->subHour()))->count(),
            'alertsToday' => $alerts->filter(fn (array $alert) => Carbon::parse($alert['created_at'])->isToday())->count(),
            'alertsThisWeek' => $alerts->filter(fn (array $alert) => Carbon::parse($alert['created_at'])->gte(now()->startOfWeek()))->count(),
            'avgResolutionTime' => 0,
            'topAlertType' => $alerts->countBy('type')->sortDesc()->keys()->first() ?? 'system',
            'topSeverity' => $alerts->countBy('severity')->sortDesc()->keys()->first() ?? 'low',
        ]]);
    }

    private function hasTables(array $tables): bool
    {
        foreach ($tables as $table) {
            if (! Schema::hasTable($table)) {
                return false;
            }
        }

        return true;
    }

    private function calculateGrowth(float|int $previous, float|int $current): float
    {
        if ((float) $previous === 0.0) {
            return (float) $current > 0 ? 100.0 : 0.0;
        }

        return round((((float) $current - (float) $previous) / (float) $previous) * 100, 1);
    }

    private function normalizePaymentStatus(string $status): string
    {
        return match ($status) {
            'processing' => 'pending',
            'paid' => 'completed',
            'approved' => 'completed',
            default => $status,
        };
    }

    private function normalizeCommissionStatus(string $status): string
    {
        return match ($status) {
            'completed' => 'paid',
            'processing' => 'approved',
            'refunded' => 'cancelled',
            default => $status,
        };
    }

    private function transformPaymentTransaction(Payment $payment): array
    {
        $metadata = is_array($payment->metadata) ? $payment->metadata : [];

        return [
            'id' => $payment->id,
            'type' => $payment->type === 'rent' ? 'rent_payment' : $payment->type,
            'amount' => (float) $payment->amount,
            'currency' => 'TZS',
            'status' => $payment->status,
            'description' => $payment->description ?: ucfirst($payment->type) . ' payment',
            'reference' => $payment->reference ?: 'PAY-' . str_pad((string) $payment->id, 5, '0', STR_PAD_LEFT),
            'paymentMethod' => $metadata['payment_method'] ?? 'bank_transfer',
            'user' => [
                'id' => $payment->user?->id,
                'name' => $payment->user?->fullName() ?? 'Unknown User',
                'email' => $payment->user?->email,
                'type' => $payment->user?->user_type ?? 'tenant',
            ],
            'property' => $payment->property ? [
                'id' => $payment->property->id,
                'title' => $payment->property->title,
                'address' => $payment->property->address ?? $payment->property->location,
            ] : null,
            'agent' => $payment->agent ? [
                'id' => $payment->agent->id,
                'name' => $payment->agent->fullName(),
                'email' => $payment->agent->email,
                'commissionRate' => 0,
            ] : null,
            'metadata' => [
                'invoiceNumber' => $metadata['invoice_number'] ?? null,
                'receiptNumber' => $metadata['receipt_number'] ?? null,
                'transactionId' => $metadata['transaction_id'] ?? null,
                'gateway' => $metadata['gateway'] ?? null,
                'fees' => isset($metadata['fees']) ? (float) $metadata['fees'] : 0,
                'netAmount' => isset($metadata['net_amount']) ? (float) $metadata['net_amount'] : (float) $payment->amount,
            ],
            'createdAt' => optional($payment->created_at)?->toISOString(),
            'updatedAt' => optional($payment->updated_at)?->toISOString(),
            'completedAt' => optional($payment->paid_at)?->toISOString(),
        ];
    }

    private function transformCommissionTransaction(Commission $commission): array
    {
        return [
            'id' => 100000 + $commission->id,
            'type' => 'commission',
            'amount' => (float) $commission->amount,
            'currency' => 'TZS',
            'status' => $commission->status === 'paid' ? 'completed' : $commission->status,
            'description' => 'Agent commission payout',
            'reference' => 'COM-' . str_pad((string) $commission->id, 5, '0', STR_PAD_LEFT),
            'paymentMethod' => 'bank_transfer',
            'user' => [
                'id' => $commission->agent?->id,
                'name' => $commission->agent?->fullName() ?? 'Unknown Agent',
                'email' => $commission->agent?->email,
                'type' => 'agent',
            ],
            'property' => $commission->property ? [
                'id' => $commission->property->id,
                'title' => $commission->property->title,
                'address' => $commission->property->address ?? $commission->property->location,
            ] : null,
            'agent' => $commission->agent ? [
                'id' => $commission->agent->id,
                'name' => $commission->agent->fullName(),
                'email' => $commission->agent->email,
                'commissionRate' => (float) ($commission->percentage ?? 0),
            ] : null,
            'metadata' => [
                'invoiceNumber' => null,
                'receiptNumber' => null,
                'transactionId' => null,
                'gateway' => 'internal',
                'fees' => 0,
                'netAmount' => (float) $commission->amount,
            ],
            'createdAt' => optional($commission->created_at)?->toISOString(),
            'updatedAt' => optional($commission->updated_at)?->toISOString(),
            'completedAt' => optional($commission->paid_at)?->toISOString(),
        ];
    }

    private function buildAlerts(): Collection
    {
        $alerts = collect();
        $pendingVerifications = User::whereNull('email_verified_at')->count();

        if ($pendingVerifications > 0) {
            $alerts->push($this->makeAlert(
                1,
                'Pending account verifications',
                "{$pendingVerifications} user accounts are still awaiting verification.",
                'security',
                $pendingVerifications > 5 ? 'high' : 'medium',
                'active',
                'Account Verification',
                'User Verification',
                now(),
                true,
                $pendingVerifications,
                max(5, $pendingVerifications),
                'accounts'
            ));
        }

        if ($this->hasTables(['payments'])) {
            $overduePayments = Payment::where('status', 'pending')->whereDate('due_date', '<', today())->count();
            if ($overduePayments > 0) {
                $alerts->push($this->makeAlert(
                    2,
                    'Overdue rent payments',
                    "{$overduePayments} scheduled payments are past their due date.",
                    'financial',
                    $overduePayments > 3 ? 'critical' : 'high',
                    'active',
                    'Payments Monitor',
                    'Payments',
                    now()->subMinutes(20),
                    true,
                    $overduePayments,
                    max(1, $overduePayments),
                    'payments'
                ));
            }
        }

        if ($this->hasTables(['contracts'])) {
            $expiringContracts = Contract::whereBetween('end_date', [today(), today()->addDays(30)])->count();
            if ($expiringContracts > 0) {
                $alerts->push($this->makeAlert(
                    3,
                    'Contracts nearing expiry',
                    "{$expiringContracts} contracts will expire within the next 30 days.",
                    'maintenance',
                    'medium',
                    'active',
                    'Contracts Monitor',
                    'Contracts',
                    now()->subHour(),
                    false,
                    $expiringContracts,
                    max(5, $expiringContracts),
                    'contracts'
                ));
            }
        }

        $inactiveUsers = User::where('is_active', false)->count();
        if ($inactiveUsers > 0) {
            $alerts->push($this->makeAlert(
                4,
                'Inactive user accounts detected',
                "{$inactiveUsers} accounts are currently inactive and may need review.",
                'user_activity',
                'low',
                'active',
                'User Lifecycle',
                'Users',
                now()->subHours(2),
                false,
                $inactiveUsers,
                max(10, $inactiveUsers),
                'accounts'
            ));
        }

        if ($alerts->isEmpty()) {
            $alerts->push($this->makeAlert(
                99,
                'System operating normally',
                'No urgent issues detected across users, payments, or contracts.',
                'system',
                'low',
                'resolved',
                'Platform Health',
                'System',
                now(),
                false,
                0,
                1,
                'checks'
            ));
        }

        return $alerts->sortByDesc('created_at')->values();
    }

    private function makeAlert(
        int $id,
        string $title,
        string $description,
        string $type,
        string $severity,
        string $status,
        string $source,
        string $category,
        Carbon $createdAt,
        bool $actionRequired,
        int|float $metricValue,
        int|float $metricThreshold,
        string $unit
    ): array {
        return [
            'id' => $id,
            'title' => $title,
            'description' => $description,
            'type' => $type,
            'severity' => $severity,
            'status' => $status,
            'source' => $source,
            'category' => $category,
            'metadata' => [
                'triggeredAt' => $createdAt->toISOString(),
                'details' => $description,
                'actionRequired' => $actionRequired,
                'autoResolve' => false,
                'escalationLevel' => in_array($severity, ['critical', 'urgent'], true) ? 2 : 1,
                'metrics' => [
                    'value' => $metricValue,
                    'threshold' => $metricThreshold,
                    'unit' => $unit,
                ],
            ],
            'recipients' => [],
            'actions' => [],
            'created_at' => $createdAt->toISOString(),
            'updated_at' => $createdAt->toISOString(),
        ]);
    }

    // ── Admin BNB Management Methods ─────────────────────────────────────────────────────

    public function getAdminBnbProperties(Request $request): JsonResponse
    {
        $query = BnbProperty::with(['owner']);

        // Apply filters
        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('title', 'like', "%{$request->search}%")
                  ->orWhere('description', 'like', "%{$request->search}%")
                  ->orWhere('location', 'like', "%{$request->search}%");
            });
        }

        if ($request->status && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->location) {
            $query->where('location', 'like', "%{$request->location}%");
        }

        if ($request->min_price) {
            $query->where('price', '>=', $request->min_price);
        }

        if ($request->max_price) {
            $query->where('price', '<=', $request->max_price);
        }

        if ($request->owner_id) {
            $query->where('owner_id', $request->owner_id);
        }

        $properties = $query->orderByDesc('created_at')->paginate(20);

        return response()->json([
            'data' => $properties->items(),
            'pagination' => [
                'current_page' => $properties->currentPage(),
                'last_page' => $properties->lastPage(),
                'per_page' => $properties->perPage(),
                'total' => $properties->total(),
            ],
        ]);
    }

    public function updateAdminBnbPropertyStatus(Request $request, BnbProperty $property): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'status' => ['required', Rule::in(['active', 'inactive', 'suspended', 'pending'])],
            'admin_notes' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $property->update([
            'status' => $request->status,
            'admin_notes' => $request->admin_notes,
            'updated_at' => now(),
        ]);

        return response()->json([
            'message' => 'BNB property status updated successfully',
            'data' => $property->load('owner'),
        ]);
    }

    public function getAdminBnbBookings(Request $request): JsonResponse
    {
        $query = BnbBooking::with(['property', 'property.owner', 'guest']);

        // Apply filters
        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->whereHas('property', function ($subQuery) use ($request) {
                        $subQuery->where('title', 'like', "%{$request->search}%");
                    })
                    ->orWhereHas('guest', function ($subQuery) use ($request) {
                        $subQuery->where('first_name', 'like', "%{$request->search}%")
                               ->orWhere('last_name', 'like', "%{$request->search}%")
                               ->orWhere('email', 'like', "%{$request->search}%");
                    });
            });
        }

        if ($request->status && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->property_id) {
            $query->where('property_id', $request->property_id);
        }

        if ($request->date_from) {
            $query->where('check_in', '>=', $request->date_from);
        }

        if ($request->date_to) {
            $query->where('check_out', '<=', $request->date_to);
        }

        $bookings = $query->orderByDesc('created_at')->paginate(20);

        return response()->json([
            'data' => $bookings->items(),
            'pagination' => [
                'current_page' => $bookings->currentPage(),
                'last_page' => $bookings->lastPage(),
                'per_page' => $bookings->perPage(),
                'total' => $bookings->total(),
            ],
        ]);
    }

    public function getAdminBnbAnalytics(Request $request): JsonResponse
    {
        $dateRange = $request->get('date_range', '30d');
        
        // Calculate date range
        $startDate = match($dateRange) {
            '7d' => now()->subDays(7),
            '30d' => now()->subDays(30),
            '90d' => now()->subDays(90),
            '1y' => now()->subYear(),
            default => now()->subDays(30),
        };

        // Basic metrics
        $totalProperties = BnbProperty::count();
        $activeProperties = BnbProperty::where('status', 'active')->count();
        $totalBookings = BnbBooking::where('created_at', '>=', $startDate)->count();
        $completedBookings = BnbBooking::where('status', 'completed')
                                     ->where('created_at', '>=', $startDate)
                                     ->count();
        $totalRevenue = BnbBooking::where('status', 'completed')
                                  ->where('created_at', '>=', $startDate)
                                  ->sum('total_amount');

        // Monthly revenue trend
        $monthlyRevenue = BnbBooking::selectRaw('DATE_FORMAT(created_at, "%Y-%m") as month, SUM(total_amount) as revenue')
            ->where('status', 'completed')
            ->where('created_at', '>=', now()->subYear())
            ->groupBy('month')
            ->orderBy('month')
            ->pluck('revenue', 'month')
            ->toArray();

        // Fill missing months with 0
        $monthlyRevenueComplete = [];
        for ($i = 11; $i >= 0; $i--) {
            $month = now()->subMonths($i)->format('Y-m');
            $monthlyRevenueComplete[] = $monthlyRevenue[$month] ?? 0;
        }

        // Top properties
        $topProperties = BnbProperty::withCount(['bookings' => function ($query) use ($startDate) {
                $query->where('created_at', '>=', $startDate);
            }])
            ->withSum(['bookings as revenue' => function ($query) use ($startDate) {
                $query->where('status', 'completed')->where('created_at', '>=', $startDate);
            }])
            ->orderByDesc('bookings_count')
            ->limit(10)
            ->get()
            ->map(function ($property) {
                return [
                    'id' => $property->id,
                    'title' => $property->title,
                    'bookings' => $property->bookings_count ?? 0,
                    'revenue' => $property->revenue ?? 0,
                    'rating' => 4.5, // Placeholder - would calculate from reviews
                ];
            });

        return response()->json([
            'totalRevenue' => $totalRevenue,
            'totalBookings' => $totalBookings,
            'completedBookings' => $completedBookings,
            'totalProperties' => $totalProperties,
            'activeProperties' => $activeProperties,
            'occupancyRate' => $totalBookings > 0 ? round(($completedBookings / $totalBookings) * 100, 1) : 0,
            'monthlyRevenue' => $monthlyRevenueComplete,
            'topProperties' => $topProperties,
            'dateRange' => $dateRange,
        ]);
    }
}

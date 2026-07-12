<?php

namespace App\Http\Controllers\Commercial;

use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\Notification;
use App\Models\Payment;
use App\Models\Property;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class CommercialController extends Controller
{
    public function dashboard(): JsonResponse
    {
        $user = Auth::user();
        $this->syncPaidApplicationsToPayments($user->id);
        $propertyIds = $this->ownedPropertyIds($user->id);

        $properties = Property::where('owner_id', $user->id)->get();
        $totalProperties = $properties->count();
        $activeProperties = $properties->filter(function ($p) {
            return ($p->available ?? true)
                && ! in_array($p->status ?? 'active', ['inactive', 'rejected'], true);
        })->count();

        $paymentsQuery = $this->paymentsQuery($propertyIds);
        $completedPayments = (clone $paymentsQuery)->whereIn('status', ['completed', 'paid']);
        $totalRevenue = (float) (clone $completedPayments)->sum('amount');
        $totalPayments = (clone $completedPayments)->count();

        $applicationsQuery = $this->applicationsQuery($user->id, $propertyIds);
        $pendingApplications = (clone $applicationsQuery)->where('status', 'pending')->count();
        $approvedApplications = (clone $applicationsQuery)->where('status', 'approved')->count();

        $monthlyRevenue = [];
        for ($i = 5; $i >= 0; $i--) {
            $month = Carbon::now()->subMonths($i);
            $revenue = (clone $completedPayments)
                ->where(function ($q) use ($month) {
                    $q->whereMonth('paid_at', $month->month)->whereYear('paid_at', $month->year)
                        ->orWhere(function ($q2) use ($month) {
                            $q2->whereNull('paid_at')
                                ->whereMonth('created_at', $month->month)
                                ->whereYear('created_at', $month->year);
                        });
                })
                ->sum('amount');

            $monthlyRevenue[] = [
                'month' => $month->format('M'),
                'revenue' => (float) $revenue,
            ];
        }

        $recentPayments = (clone $completedPayments)
            ->with(['property:id,title,location', 'user:id,first_name,last_name,email,phone'])
            ->orderByRaw('COALESCE(paid_at, created_at) DESC')
            ->limit(8)
            ->get()
            ->map(fn (Payment $p) => $this->formatPayment($p));

        $popularProperties = $properties
            ->sortByDesc(fn ($p) => (int) ($p->views ?? $p->clicks ?? 0))
            ->take(5)
            ->values()
            ->map(function (Property $property) use ($completedPayments) {
                $revenue = (clone $completedPayments)
                    ->where('property_id', $property->id)
                    ->sum('amount');

                return [
                    'id' => $property->id,
                    'title' => $property->title,
                    'type' => $property->type,
                    'location' => $property->location,
                    'price' => (float) $property->price,
                    'status' => $property->status ?? ($property->available ? 'active' : 'inactive'),
                    'views' => (int) ($property->views ?? $property->clicks ?? 0),
                    'revenue' => (float) $revenue,
                ];
            });

        $occupancyRate = $totalProperties > 0
            ? round(($properties->where('available', false)->count() / $totalProperties) * 100, 1)
            : 0.0;

        return response()->json([
            'stats' => [
                'total_properties' => $totalProperties,
                'active_properties' => $activeProperties,
                'total_bookings' => $approvedApplications,
                'total_applications' => (clone $applicationsQuery)->count(),
                'pending_applications' => $pendingApplications,
                'total_payments' => $totalPayments,
                'total_revenue' => $totalRevenue,
                'average_rating' => 0,
                'occupancy_rate' => $occupancyRate,
            ],
            'recent_bookings' => $recentPayments,
            'recent_payments' => $recentPayments,
            'popular_properties' => $popularProperties,
            'monthly_revenue' => $monthlyRevenue,
            'user' => [
                'name' => trim(($user->first_name ?? '') . ' ' . ($user->last_name ?? '')) ?: ($user->email ?? 'Commercial'),
                'email' => $user->email,
                'company_name' => null,
                'business_license' => null,
                'verified' => $user->email_verified_at !== null,
            ],
        ]);
    }

    public function analytics(Request $request): JsonResponse
    {
        $user = Auth::user();
        $this->syncPaidApplicationsToPayments($user->id);
        $propertyIds = $this->ownedPropertyIds($user->id);
        $range = $request->get('range', '6months');
        $months = match ($range) {
            '1month' => 1,
            '3months' => 3,
            '1year' => 12,
            default => 6,
        };

        $properties = Property::where('owner_id', $user->id)->get();
        $paymentsQuery = $this->paymentsQuery($propertyIds)->whereIn('status', ['completed', 'paid']);
        $appsQuery = $this->applicationsQuery($user->id, $propertyIds);

        $from = Carbon::now()->subMonths($months - 1)->startOfMonth();
        $rangedPayments = (clone $paymentsQuery)->where(function ($q) use ($from) {
            $q->where('paid_at', '>=', $from)
                ->orWhere(function ($q2) use ($from) {
                    $q2->whereNull('paid_at')->where('created_at', '>=', $from);
                });
        });

        $totalRevenue = (float) (clone $rangedPayments)->sum('amount');
        $totalPayments = (clone $rangedPayments)->count();
        $totalApplications = (clone $appsQuery)->where('created_at', '>=', $from)->count();
        $approvedApps = (clone $appsQuery)->where('status', 'approved')->where('created_at', '>=', $from)->count();

        $monthlyRevenue = [];
        $bookingTrends = [];
        for ($i = $months - 1; $i >= 0; $i--) {
            $month = Carbon::now()->subMonths($i);
            $rev = (clone $paymentsQuery)
                ->where(function ($q) use ($month) {
                    $q->whereMonth('paid_at', $month->month)->whereYear('paid_at', $month->year)
                        ->orWhere(function ($q2) use ($month) {
                            $q2->whereNull('paid_at')
                                ->whereMonth('created_at', $month->month)
                                ->whereYear('created_at', $month->year);
                        });
                })
                ->sum('amount');
            $apps = (clone $appsQuery)
                ->whereMonth('created_at', $month->month)
                ->whereYear('created_at', $month->year)
                ->count();

            $monthlyRevenue[] = [
                'month' => $month->format('M'),
                'revenue' => (float) $rev,
            ];
            $bookingTrends[] = [
                'month' => $month->format('M'),
                'bookings' => $apps,
                'revenue' => (float) $rev,
            ];
        }

        $propertyPerformance = $properties->map(function (Property $property) use ($paymentsQuery, $appsQuery, $from) {
            $revenue = (clone $paymentsQuery)
                ->where('property_id', $property->id)
                ->where(function ($q) use ($from) {
                    $q->where('paid_at', '>=', $from)
                        ->orWhere(function ($q2) use ($from) {
                            $q2->whereNull('paid_at')->where('created_at', '>=', $from);
                        });
                })
                ->sum('amount');
            $apps = (clone $appsQuery)
                ->where('property_id', $property->id)
                ->where('created_at', '>=', $from)
                ->count();

            return [
                'id' => $property->id,
                'title' => $property->title,
                'views' => (int) ($property->views ?? $property->clicks ?? 0),
                'bookings' => $apps,
                'revenue' => (float) $revenue,
                'rating' => 0,
            ];
        })->sortByDesc('revenue')->values();

        $totalProperties = $properties->count();
        $activeProperties = $properties->where('available', true)->count();
        $occupied = $properties->where('available', false)->count();

        return response()->json([
            'total_properties' => $totalProperties,
            'active_properties' => $activeProperties,
            'total_bookings' => $totalApplications,
            'approved_applications' => $approvedApps,
            'total_payments' => $totalPayments,
            'total_revenue' => $totalRevenue,
            'average_rating' => 0,
            'occupancy_rate' => $totalProperties > 0 ? round(($occupied / $totalProperties) * 100, 1) : 0,
            'monthly_revenue' => $monthlyRevenue,
            'property_performance' => $propertyPerformance,
            'booking_trends' => $bookingTrends,
        ]);
    }

    public function payments(Request $request): JsonResponse
    {
        $user = Auth::user();
        $this->syncPaidApplicationsToPayments($user->id);
        $propertyIds = $this->ownedPropertyIds($user->id);
        $perPage = min((int) $request->get('per_page', 20), 100);

        if ($propertyIds->isEmpty() || ! Schema::hasTable('payments')) {
            return response()->json([
                'data' => [],
                'summary' => [
                    'total_received' => 0,
                    'completed_count' => 0,
                    'pending_count' => 0,
                    'this_month' => 0,
                ],
                'current_page' => 1,
                'last_page' => 1,
                'per_page' => $perPage,
                'total' => 0,
            ]);
        }

        $query = $this->paymentsQuery($propertyIds)->with([
            'property:id,title,location,type',
            'user:id,first_name,last_name,email,phone',
        ]);

        if ($request->filled('status') && $request->status !== 'all') {
            $status = $request->status === 'paid' ? ['paid', 'completed'] : [$request->status];
            $query->whereIn('status', $status);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('reference', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhereHas('property', fn ($pq) => $pq->where('title', 'like', "%{$search}%"))
                    ->orWhereHas('user', function ($uq) use ($search) {
                        $uq->where('first_name', 'like', "%{$search}%")
                            ->orWhere('last_name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    });
            });
        }

        $paginator = $query->orderByRaw('COALESCE(paid_at, created_at) DESC')->paginate($perPage);

        $base = $this->paymentsQuery($propertyIds);
        $completed = (clone $base)->whereIn('status', ['completed', 'paid']);

        return response()->json([
            'data' => collect($paginator->items())->map(fn (Payment $p) => $this->formatPayment($p))->values(),
            'summary' => [
                'total_received' => (float) (clone $completed)->sum('amount'),
                'completed_count' => (clone $completed)->count(),
                'pending_count' => (clone $base)->whereIn('status', ['pending', 'processing'])->count(),
                'this_month' => (float) (clone $completed)
                    ->where(function ($q) {
                        $q->whereMonth('paid_at', now()->month)->whereYear('paid_at', now()->year)
                            ->orWhere(function ($q2) {
                                $q2->whereNull('paid_at')
                                    ->whereMonth('created_at', now()->month)
                                    ->whereYear('created_at', now()->year);
                            });
                    })
                    ->sum('amount'),
            ],
            'current_page' => $paginator->currentPage(),
            'last_page' => $paginator->lastPage(),
            'per_page' => $paginator->perPage(),
            'total' => $paginator->total(),
        ]);
    }

    public function reports(): JsonResponse
    {
        $user = Auth::user();
        $reports = Cache::get($this->reportsCacheKey($user->id), []);

        return response()->json([
            'data' => array_values($reports),
            'live_summary' => $this->buildLiveSummary($user->id),
        ]);
    }

    public function generateReport(Request $request): JsonResponse
    {
        $user = Auth::user();
        $validated = $request->validate([
            'type' => 'required|in:revenue,bookings,performance,analytics,applications,payments',
            'period' => 'required|in:daily,weekly,monthly,quarterly,yearly',
            'property_id' => 'nullable|integer',
        ]);

        $type = $validated['type'];
        if (in_array($type, ['bookings', 'applications'], true)) {
            $type = 'applications';
        }
        if ($type === 'payments') {
            $type = 'revenue';
        }

        $propertyId = $validated['property_id'] ?? null;
        if ($propertyId) {
            $owns = Property::where('owner_id', $user->id)->where('id', $propertyId)->exists();
            if (! $owns) {
                return response()->json(['message' => 'Property not found'], 404);
            }
        }

        $summary = $this->buildLiveSummary($user->id, $validated['period'], $propertyId);
        $report = [
            'id' => (int) (microtime(true) * 1000),
            'title' => ucfirst($type) . ' report — ' . ucfirst($validated['period']),
            'type' => $type === 'applications' ? 'bookings' : $type,
            'period' => $validated['period'],
            'generated_at' => now()->toIso8601String(),
            'property_id' => $propertyId,
            'data' => $summary,
        ];

        $existing = Cache::get($this->reportsCacheKey($user->id), []);
        array_unshift($existing, $report);
        $existing = array_slice($existing, 0, 30);
        Cache::put($this->reportsCacheKey($user->id), $existing, now()->addDays(30));

        return response()->json($report, 201);
    }

    public function downloadReport(int $id): JsonResponse|\Symfony\Component\HttpFoundation\StreamedResponse
    {
        $user = Auth::user();
        $reports = Cache::get($this->reportsCacheKey($user->id), []);
        $report = collect($reports)->firstWhere('id', $id);

        if (! $report) {
            return response()->json(['message' => 'Report not found'], 404);
        }

        $filename = 'commercial-report-' . $id . '.json';

        return response()->streamDownload(function () use ($report) {
            echo json_encode($report, JSON_PRETTY_PRINT);
        }, $filename, [
            'Content-Type' => 'application/json',
        ]);
    }

    public function notifications(Request $request): JsonResponse
    {
        if (! Schema::hasTable('notifications')) {
            return response()->json(['data' => [], 'pagination' => [
                'current_page' => 1, 'last_page' => 1, 'per_page' => 20, 'total' => 0,
            ]]);
        }

        $user = Auth::user();
        $notifications = Notification::where('user_id', $user->id)
            ->when(Schema::hasColumn('notifications', 'archived_at'), fn ($q) => $q->whereNull('archived_at'))
            ->orderBy('created_at', 'desc')
            ->paginate(min((int) $request->get('per_page', 20), 50));

        return response()->json([
            'data' => $notifications->items(),
            'pagination' => [
                'current_page' => $notifications->currentPage(),
                'last_page' => $notifications->lastPage(),
                'per_page' => $notifications->perPage(),
                'total' => $notifications->total(),
            ],
        ]);
    }

    public function notificationStats(): JsonResponse
    {
        if (! Schema::hasTable('notifications')) {
            return response()->json(['data' => ['total' => 0, 'unread' => 0, 'this_week' => 0]]);
        }

        $user = Auth::user();
        $base = Notification::where('user_id', $user->id)
            ->when(Schema::hasColumn('notifications', 'archived_at'), fn ($q) => $q->whereNull('archived_at'));

        $unread = (clone $base)->where(function ($q) {
            if (Schema::hasColumn('notifications', 'read_at')) {
                $q->whereNull('read_at');
            } elseif (Schema::hasColumn('notifications', 'is_read')) {
                $q->where('is_read', false);
            }
        })->count();

        return response()->json([
            'data' => [
                'total' => (clone $base)->count(),
                'unread' => $unread,
                'this_week' => (clone $base)->where('created_at', '>=', now()->subWeek())->count(),
            ],
        ]);
    }

    public function markNotificationRead(Notification $notification): JsonResponse
    {
        if ((int) $notification->user_id !== (int) Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $payload = [];
        if (Schema::hasColumn('notifications', 'read_at')) {
            $payload['read_at'] = now();
        }
        if (Schema::hasColumn('notifications', 'is_read')) {
            $payload['is_read'] = true;
        }
        if ($payload) {
            $notification->update($payload);
        }

        return response()->json(['message' => 'Notification marked as read', 'data' => $notification]);
    }

    public function markAllNotificationsRead(): JsonResponse
    {
        $user = Auth::user();
        $query = Notification::where('user_id', $user->id);
        $payload = [];
        if (Schema::hasColumn('notifications', 'read_at')) {
            $payload['read_at'] = now();
        }
        if (Schema::hasColumn('notifications', 'is_read')) {
            $payload['is_read'] = true;
        }
        if ($payload) {
            $query->update($payload);
        }

        return response()->json(['message' => 'All notifications marked as read']);
    }

    public function profile(): JsonResponse
    {
        $user = Auth::user();

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => trim(($user->first_name ?? '') . ' ' . ($user->last_name ?? '')),
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'email' => $user->email,
                'phone' => $user->phone,
                'verified' => $user->email_verified_at !== null,
                'created_at' => $user->created_at,
            ],
        ]);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $user = Auth::user();

        $validated = $request->validate([
            'first_name' => 'sometimes|string|max:100',
            'last_name' => 'sometimes|string|max:100',
            'name' => 'sometimes|string|max:255',
            'phone' => 'nullable|string|max:20',
        ]);

        $updates = [];
        if (isset($validated['phone'])) {
            $updates['phone'] = $validated['phone'];
        }
        if (isset($validated['first_name'])) {
            $updates['first_name'] = $validated['first_name'];
        }
        if (isset($validated['last_name'])) {
            $updates['last_name'] = $validated['last_name'];
        }
        if (isset($validated['name']) && ! isset($validated['first_name'])) {
            $parts = preg_split('/\s+/', trim($validated['name']), 2);
            $updates['first_name'] = $parts[0] ?? $user->first_name;
            $updates['last_name'] = $parts[1] ?? ($user->last_name ?? '');
        }

        if ($updates) {
            $user->update($updates);
        }

        return $this->profile();
    }

    private function ownedPropertyIds(int $userId)
    {
        return Property::where('owner_id', $userId)->pluck('id');
    }

    private function paymentsQuery($propertyIds)
    {
        return Payment::query()->whereIn('property_id', $propertyIds);
    }

    private function applicationsQuery(int $userId, $propertyIds)
    {
        return Application::query()->where(function ($q) use ($userId, $propertyIds) {
            $q->where('owner_id', $userId);
            if ($propertyIds->isNotEmpty()) {
                $q->orWhereIn('property_id', $propertyIds);
            }
        });
    }

    private function formatPayment(Payment $payment): array
    {
        $tenant = $payment->user;
        $name = trim(($tenant->first_name ?? '') . ' ' . ($tenant->last_name ?? ''));
        $status = $payment->status === 'completed' ? 'paid' : $payment->status;

        return [
            'id' => $payment->id,
            'type' => $payment->type,
            'description' => $payment->description
                ?: Str::of((string) $payment->type)->replace('_', ' ')->title(),
            'amount' => (float) $payment->amount,
            'status' => $status,
            'reference' => $payment->reference,
            'paid_at' => optional($payment->paid_at)?->toIso8601String(),
            'created_at' => optional($payment->created_at)?->toIso8601String(),
            'property' => $payment->property ? [
                'id' => $payment->property->id,
                'title' => $payment->property->title,
                'location' => $payment->property->location,
                'type' => $payment->property->type ?? null,
            ] : null,
            'tenant_name' => $name !== '' ? $name : ($tenant->email ?? 'Tenant'),
            'tenant_email' => $tenant->email ?? '',
            'tenant_phone' => $tenant->phone ?? '',
            'customer_name' => $name !== '' ? $name : ($tenant->email ?? 'Tenant'),
            'total_amount' => (float) $payment->amount,
            'property_title' => $payment->property->title ?? 'Property',
        ];
    }

    private function buildLiveSummary(int $userId, string $period = 'monthly', ?int $propertyId = null): array
    {
        $propertyIds = $propertyId
            ? collect([$propertyId])
            : $this->ownedPropertyIds($userId);

        [$from, $label] = match ($period) {
            'daily' => [now()->startOfDay(), 'Today'],
            'weekly' => [now()->startOfWeek(), 'This week'],
            'quarterly' => [now()->firstOfQuarter(), 'This quarter'],
            'yearly' => [now()->startOfYear(), 'This year'],
            default => [now()->startOfMonth(), 'This month'],
        };

        $payments = $this->paymentsQuery($propertyIds)
            ->whereIn('status', ['completed', 'paid'])
            ->where(function ($q) use ($from) {
                $q->where('paid_at', '>=', $from)
                    ->orWhere(function ($q2) use ($from) {
                        $q2->whereNull('paid_at')->where('created_at', '>=', $from);
                    });
            });

        $apps = $this->applicationsQuery($userId, $propertyIds)
            ->where('created_at', '>=', $from);

        return [
            'period_label' => $label,
            'properties_count' => $propertyIds->count(),
            'revenue' => (float) (clone $payments)->sum('amount'),
            'payments_count' => (clone $payments)->count(),
            'applications_count' => (clone $apps)->count(),
            'approved_applications' => (clone $apps)->where('status', 'approved')->count(),
            'pending_applications' => (clone $apps)->where('status', 'pending')->count(),
            'by_type' => (clone $payments)
                ->selectRaw('type, COUNT(*) as count, SUM(amount) as total')
                ->groupBy('type')
                ->get()
                ->map(fn ($row) => [
                    'type' => $row->type,
                    'count' => (int) $row->count,
                    'total' => (float) $row->total,
                ])
                ->values()
                ->all(),
        ];
    }

    private function reportsCacheKey(int $userId): string
    {
        return 'commercial_reports_' . $userId;
    }

    /**
     * Backfill payment history rows from paid applications that never wrote to payments.
     */
    private function syncPaidApplicationsToPayments(int $userId): void
    {
        if (! Schema::hasTable('payments') || ! Schema::hasTable('applications')) {
            return;
        }

        $propertyIds = $this->ownedPropertyIds($userId);
        if ($propertyIds->isEmpty()) {
            return;
        }

        $apps = Application::with(['property', 'user'])
            ->whereIn('property_id', $propertyIds)
            ->where(function ($q) {
                $q->where('rent_payment_status', 'paid')
                    ->orWhere('payment_status', 'paid');
            })
            ->get();

        foreach ($apps as $app) {
            $property = $app->property;
            $tenant = $app->user;
            if (! $property || ! $tenant) {
                continue;
            }

            $isRent = ($app->rent_payment_status === 'paid');
            $type = $isRent ? 'first_month_rent' : 'site_visit';
            $reference = $isRent
                ? ($app->rent_transaction_id ?: 'RENT-APP-' . $app->id)
                : ($app->transaction_id ?: 'VISIT-APP-' . $app->id);

            if (Payment::where('reference', $reference)->exists()) {
                continue;
            }

            $amount = (float) ($app->amount_paid
                ?? $app->offered_rent
                ?? $property->price
                ?? 0);

            if ($amount <= 0 && ! $isRent) {
                $amount = (float) ($app->service_fee ?? 0);
            }

            if ($amount <= 0) {
                continue;
            }

            try {
                Payment::create([
                    'user_id' => $tenant->id,
                    'property_id' => $property->id,
                    'agent_id' => $property->agent_id,
                    'type' => $type,
                    'amount' => $amount,
                    'status' => 'completed',
                    'reference' => $reference,
                    'description' => $isRent
                        ? 'First month rent (synced from application)'
                        : 'Site visit fee (synced from application)',
                    'paid_at' => $app->updated_at ?? now(),
                    'metadata' => [
                        'application_id' => $app->id,
                        'synced_from_application' => true,
                    ],
                ]);

                // Ensure owner was notified at least once for historical payments.
                $alreadyNotified = Notification::where('user_id', $userId)
                    ->where('type', $type)
                    ->where('message', 'like', '%' . ($property->title ?? '') . '%')
                    ->exists();

                if (! $alreadyNotified) {
                    $tenantName = trim(($tenant->first_name ?? '') . ' ' . ($tenant->last_name ?? ''))
                        ?: ($tenant->email ?? 'A tenant');
                    Notification::create([
                        'user_id' => $userId,
                        'title' => $isRent ? 'Rent Payment Received' : 'Site Visit Fee Received',
                        'message' => "{$tenantName} paid TZS " . number_format($amount) . " for {$property->title}.",
                        'type' => $type,
                    ]);
                }
            } catch (\Throwable $e) {
                // Skip bad rows; page should still load.
            }
        }
    }
}

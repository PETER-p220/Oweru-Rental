<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Tenant;
use App\Models\Property;
use App\Models\Application;
use App\Models\Contract;
use App\Models\DigitalContract;
use App\Models\Payment;
use App\Models\SavedProperty;
use App\Models\Notification;
use App\Models\Message;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Validator;
use App\Services\SelcomPaymentService;
use App\Services\SiteVisitPaymentService;
use App\Services\RentPaymentService;
use App\Services\PaymentAlertService;

class TenantController extends Controller
{
    // Dashboard
    public function getDashboard(): JsonResponse
    {
        $user = Auth::user();

        $stats = [
            'total_properties'   => Property::count(),
            'saved_properties'   => SavedProperty::where('user_id', $user->id)->count(),
            'total_applications' => Application::where('user_id', $user->id)->count(),
            'messages'           => $this->messagesTableAvailable()
                ? Message::where('receiver_id', $user->id)->whereNull('read_at')->count()
                : 0,
        ];

        return response()->json(['data' => $stats]);
    }

    // Properties
    public function getSavedProperties(): JsonResponse
    {
        $user = Auth::user();
        $savedProperties = SavedProperty::with('property.owner', 'property.agent')
            ->where('user_id', $user->id)
            ->paginate(12);

        return response()->json([
            'data' => $savedProperties->items(),
            'pagination' => [
                'current_page' => $savedProperties->currentPage(),
                'last_page'    => $savedProperties->lastPage(),
                'per_page'     => $savedProperties->perPage(),
                'total'        => $savedProperties->total(),
            ]
        ]);
    }

    public function saveProperty(Request $request, Property $property): JsonResponse
    {
        $user = Auth::user();

        $exists = SavedProperty::where('user_id', $user->id)
            ->where('property_id', $property->id)
            ->exists();

        if ($exists) {
            return response()->json([
                'message'       => 'Property already saved',
                'already_saved' => true
            ]);
        }

        SavedProperty::create([
            'user_id'     => $user->id,
            'property_id' => $property->id,
        ]);

        return response()->json(['message' => 'Property saved successfully']);
    }

    public function unsaveProperty(Request $request, Property $property): JsonResponse
    {
        $user = Auth::user();

        SavedProperty::where('user_id', $user->id)
            ->where('property_id', $property->id)
            ->delete();

        return response()->json(['message' => 'Property removed from saved']);
    }

    // Applications
    public function getApplications(): JsonResponse
    {
        $user = Auth::user();
        $applications = Application::with('property.owner', 'property.agent')
            ->where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        $items = collect($applications->items())->map(fn (Application $app) => $this->formatApplicationForTenant($app));

        return response()->json([
            'data' => $items,
            'pagination' => [
                'current_page' => $applications->currentPage(),
                'last_page'    => $applications->lastPage(),
                'per_page'     => $applications->perPage(),
                'total'        => $applications->total(),
            ]
        ]);
    }

    public function createApplication(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'property_id'    => 'required|exists:properties,id',
            'message'        => 'nullable|string|max:1000',
            'proposed_rent'  => 'sometimes|numeric|min:0',
            'move_in_date'   => 'sometimes|date|after:today',
            'owner_id'       => 'nullable|integer',
            'service_fee'    => 'nullable|numeric',
            'payment_status' => 'nullable|string',
            'payment_method' => 'nullable|string',
            'transaction_id' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors'  => $validator->errors()
            ], 422);
        }

        $user = Auth::user();
        $property = Property::findOrFail($request->property_id);

        $existing = Application::where('user_id', $user->id)
            ->where('property_id', $property->id)
            ->whereNotIn('status', ['withdrawn', 'rejected'])
            ->first();

        if ($existing) {
            return response()->json([
                'message' => 'You have already applied for this property',
                'data'    => $existing
            ], 409);
        }

        if ($property->agent_id && $request->payment_status === 'paid') {
            return response()->json([
                'message' => 'Site visit payment must be completed through the payment gateway before marking as paid.',
            ], 422);
        }

        $application = Application::create([
            'user_id'        => $user->id,
            'property_id'    => $property->id,
            'owner_id'       => $request->owner_id ?? $property->owner_id,
            'message'        => $request->message ?? (
                $property->agent_id
                    ? "Site visit request for {$property->title}"
                    : "Rental application for {$property->title}"
            ),
            'proposed_rent'  => $request->proposed_rent,
            'service_fee'    => $property->agent_id ? $request->service_fee : null,
            'payment_status' => $property->agent_id
                ? ($request->payment_status ?? 'pending')
                : ($request->payment_status ?? 'waived'),
            'payment_method' => $request->payment_method,
            'transaction_id' => $request->transaction_id,
            'applied_at'     => now(),
        ]);

        return response()->json([
            'message' => 'Application submitted successfully',
            'data'    => $application->load('property')
        ], 201);
    }

    public function initiateSiteVisitPayment(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'property_id'  => 'required|exists:properties,id',
            'phone_number' => 'required|string|min:10|max:13',
            'provider'     => 'required|string|in:tigo,mpesa,airtel,halopesa,TIGO,MPESA,AIRTEL,HALOPESA,HALOPES',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors'  => $validator->errors(),
            ], 422);
        }

        $user = Auth::user();
        $property = Property::findOrFail($request->property_id);
        $result = app(SiteVisitPaymentService::class)->initiate(
            $user,
            $property,
            $request->phone_number,
            $request->provider
        );

        if (! ($result['success'] ?? false)) {
            return response()->json([
                'success' => false,
                'message' => $result['message'] ?? 'Payment initiation failed',
                'data'    => $result['data'] ?? null,
            ], 422);
        }

        return response()->json([
            'success' => true,
            'message' => $result['message'],
            'data'    => $result['data'],
        ]);
    }

    public function checkSiteVisitPaymentStatus(string $orderId): JsonResponse
    {
        $result = app(SiteVisitPaymentService::class)->checkStatus($orderId, Auth::user());

        if (! ($result['success'] ?? false)) {
            return response()->json([
                'success' => false,
                'message' => $result['message'] ?? 'Unable to check payment status',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'status' => $result['payment_status'],
                'payment_status' => $result['payment_status'],
                'application_id' => $result['application_id'],
                'message' => $result['message'] ?? null,
            ],
        ]);
    }

    // Contracts
    public function getMyContract(): JsonResponse
    {
        if (! $this->tenantTablesAvailable()) {
            return response()->json(['message' => 'No active contract found'], 404);
        }

        $user = Auth::user();
        $contract = Contract::with('property', 'property.owner', 'tenant')
            ->whereHas('tenant', fn($q) => $q->where('user_id', $user->id))
            ->where('status', 'active')
            ->first();

        if (!$contract) {
            return response()->json(['message' => 'No active contract found'], 404);
        }

        return response()->json(['data' => $contract]);
    }

    public function downloadContract(Contract $contract): JsonResponse
    {
        $user = Auth::user();

        if (! $contract->tenant || $contract->tenant->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json(['message' => 'Contract download not implemented yet'], 501);
    }

    // Payments
    public function getMyPayments(): JsonResponse
    {
        if (! $this->paymentsTableAvailable()) {
            return $this->emptyPaginatedResponse(10);
        }

        $user = Auth::user();
        $this->syncTenantApplicationPayments($user);

        $rentTypes = ['first_month_rent', 'monthly_rent', 'rent', 'rent_payment'];

        $payments = Payment::with('property')
            ->where('user_id', $user->id)
            ->whereIn('type', $rentTypes)
            ->orderByRaw("CASE WHEN paid_at IS NULL THEN created_at ELSE paid_at END DESC")
            ->paginate(20);

        return response()->json([
            'data' => collect($payments->items())->map(fn (Payment $p) => $this->formatPaymentForTenant($p))->values(),
            'pagination' => [
                'current_page' => $payments->currentPage(),
                'last_page'    => $payments->lastPage(),
                'per_page'     => $payments->perPage(),
                'total'        => $payments->total(),
            ],
        ]);
    }

    public function getPaymentMethods(): JsonResponse
    {
        $methods = [
            [
                'id' => 'tigo',
                'name' => 'Tigo Pesa',
                'type' => 'mobile_money',
                'provider' => 'TIGO',
                'is_active' => true,
            ],
            [
                'id' => 'mpesa',
                'name' => 'M-Pesa',
                'type' => 'mobile_money',
                'provider' => 'MPESA',
                'is_active' => true,
            ],
            [
                'id' => 'airtel',
                'name' => 'Airtel Money',
                'type' => 'mobile_money',
                'provider' => 'AIRTEL',
                'is_active' => true,
            ],
            [
                'id' => 'halopesa',
                'name' => 'Halopesa',
                'type' => 'mobile_money',
                'provider' => 'HALOPESA',
                'is_active' => true,
            ],
        ];

        return response()->json(['data' => $methods]);
    }

    public function getPaymentStats(): JsonResponse
    {
        if (! $this->paymentsTableAvailable()) {
            return response()->json(['data' => [
                'total_paid'       => 0,
                'pending_payments' => 0,
                'this_month'       => 0,
            ]]);
        }

        $user = Auth::user();
        $this->syncTenantApplicationPayments($user);

        $rentTypes = ['first_month_rent', 'monthly_rent', 'rent', 'rent_payment'];

        $completed = Payment::where('user_id', $user->id)
            ->whereIn('type', $rentTypes)
            ->whereIn('status', ['completed', 'paid']);

        $stats = [
            'total_paid'       => (clone $completed)->sum('amount'),
            'pending_payments' => Payment::where('user_id', $user->id)
                ->whereIn('type', $rentTypes)
                ->whereIn('status', ['pending', 'processing'])
                ->count(),
            'this_month'       => (clone $completed)
                ->where(function ($q) {
                    $q->whereMonth('paid_at', now()->month)->whereYear('paid_at', now()->year)
                        ->orWhere(function ($q2) {
                            $q2->whereNull('paid_at')
                                ->whereMonth('created_at', now()->month)
                                ->whereYear('created_at', now()->year);
                        });
                })
                ->sum('amount'),
        ];

        return response()->json(['data' => $stats]);
    }

    public function makePayment(Request $request, Payment $payment): JsonResponse
    {
        if (! $this->paymentsTableAvailable()) {
            return response()->json(['message' => 'Payments are unavailable until supporting tables are migrated'], 503);
        }

        $user = Auth::user();

        if ($payment->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if (! in_array($payment->status, ['pending', 'failed'], true)) {
            return response()->json(['message' => 'This payment cannot be processed in its current state.'], 422);
        }

        $validator = Validator::make($request->all(), [
            'phone_number' => 'required|string|min:10|max:13',
            'provider' => 'required|string|in:tigo,mpesa,airtel,halopesa,TIGO,MPESA,AIRTEL,HALOPESA,HALOPES',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors'  => $validator->errors(),
            ], 422);
        }

        $provider = strtoupper($request->provider);
        $orderId = 'RENT-PAY-' . $payment->id . '-' . time();

        $result = app(SelcomPaymentService::class)->initiate([
            'amount' => $payment->amount,
            'phone_number' => $request->phone_number,
            'provider' => $provider,
            'customer_email' => $user->email,
            'customer_name' => trim($user->first_name . ' ' . $user->last_name) ?: 'Tenant',
            'order_id' => $orderId,
            'payment_type' => $payment->type ?? 'monthly_rent',
            'property_id' => $payment->property_id ?? 0,
            'tenant_id' => $user->id,
        ]);

        if (! ($result['success'] ?? false)) {
            return response()->json([
                'message' => $result['message'] ?? 'Payment initiation failed',
            ], 422);
        }

        $transactionId = $result['data']['transaction_id'] ?? $orderId;

        $payment->update([
            'status' => 'processing',
            'reference' => $orderId,
            'metadata' => array_merge($payment->metadata ?? [], [
                'provider' => $provider,
                'selcom_provider' => SelcomPaymentService::mapProvider($provider),
                'phone_number' => $request->phone_number,
                'transaction_id' => $transactionId,
                'order_id' => $orderId,
                'initiated_at' => now()->toIso8601String(),
            ]),
        ]);

        return response()->json([
            'message' => $result['message'] ?? 'Payment initiated successfully',
            'data' => array_merge($result['data'] ?? [], [
                'order_id' => $orderId,
                'payment_id' => $payment->id,
            ]),
        ]);
    }

    public function checkPaymentStatus(Payment $payment): JsonResponse
    {
        if (! $this->paymentsTableAvailable()) {
            return response()->json(['message' => 'Payments are unavailable'], 503);
        }

        $user = Auth::user();

        if ($payment->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if (in_array($payment->status, ['completed', 'paid'], true)) {
            return response()->json([
                'success' => true,
                'data' => [
                    'status' => 'paid',
                    'payment_status' => 'paid',
                    'payment_id' => $payment->id,
                    'message' => 'Payment confirmed.',
                ],
            ]);
        }

        if ($payment->status === 'failed') {
            return response()->json([
                'success' => true,
                'data' => [
                    'status' => 'failed',
                    'payment_status' => 'failed',
                    'payment_id' => $payment->id,
                    'message' => 'Payment was not completed.',
                ],
            ]);
        }

        $orderId = $payment->reference
            ?? ($payment->metadata['order_id'] ?? null)
            ?? ($payment->metadata['transaction_id'] ?? null);

        if (! $orderId) {
            return response()->json([
                'success' => true,
                'data' => [
                    'status' => 'pending',
                    'payment_status' => 'pending',
                    'payment_id' => $payment->id,
                    'message' => 'Waiting for payment approval on your phone.',
                ],
            ]);
        }

        $remote = app(SelcomPaymentService::class)->checkOrderStatus((string) $orderId);

        if ($remote['paid'] ?? false) {
            $payment->update([
                'status' => 'completed',
                'paid_at' => now(),
                'metadata' => array_merge($payment->metadata ?? [], [
                    'confirmed_at' => now()->toIso8601String(),
                    'gateway_response' => $remote['data'] ?? [],
                ]),
            ]);

            app(PaymentAlertService::class)->handleMonthlyPaymentCompleted($payment->fresh(['property', 'user']));

            return response()->json([
                'success' => true,
                'data' => [
                    'status' => 'paid',
                    'payment_status' => 'paid',
                    'payment_id' => $payment->id,
                    'message' => 'Payment confirmed.',
                ],
            ]);
        }

        if ($remote['failed'] ?? false) {
            $payment->update(['status' => 'failed']);

            return response()->json([
                'success' => true,
                'data' => [
                    'status' => 'failed',
                    'payment_status' => 'failed',
                    'payment_id' => $payment->id,
                    'message' => 'Payment was not completed.',
                ],
            ]);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'status' => 'pending',
                'payment_status' => 'pending',
                'payment_id' => $payment->id,
                'message' => 'Waiting for payment approval on your phone.',
            ],
        ]);
    }

    public function getPaymentHistory(): JsonResponse
    {
        if (! $this->paymentsTableAvailable()) {
            return response()->json(['data' => []]);
        }

        $user = Auth::user();
        $this->syncTenantApplicationPayments($user);

        $payments = Payment::with('property')
            ->where('user_id', $user->id)
            ->orderByRaw("CASE WHEN paid_at IS NULL THEN created_at ELSE paid_at END DESC")
            ->limit(100)
            ->get()
            ->map(fn (Payment $p) => $this->formatPaymentForTenant($p))
            ->values();

        return response()->json(['data' => $payments]);
    }

    public function getPaymentSummary(): JsonResponse
    {
        return $this->getPaymentStats();
    }

    public function downloadReceipt(Payment $payment): JsonResponse
    {
        $user = Auth::user();

        if ($payment->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json(['message' => 'Receipt download not implemented yet'], 501);
    }

    public function updateApplicationStatus(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'id'      => 'required|integer',
            'status'  => 'required|string',
            'message' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => 'Application ID and status are required'], 400);
        }

        $user = Auth::user();
        $application = Application::where('user_id', $user->id)
            ->where('id', $request->id)
            ->first();

        if (!$application) {
            return response()->json(['error' => 'Application not found'], 404);
        }

        $application->update([
            'status'  => $request->status,
            'message' => $request->message,
        ]);

        return response()->json(['message' => 'Application status updated successfully']);
    }

    public function notifyApproval(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'application_id' => 'required|integer',
            'tenant_email'   => 'required|email',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => 'Application ID and tenant email are required'], 400);
        }

        $application = Application::with('property')->findOrFail($request->application_id);
        $tenantUser = User::where('email', $request->tenant_email)->first();

        if (!$tenantUser) {
            return response()->json(['error' => 'Tenant not found'], 404);
        }

        Notification::create([
            'user_id' => $tenantUser->id,
            'title'   => 'Application Approved',
            'message' => "Your application for {$application->property->title} has been approved.",
            'type'    => 'application_approved',
            'is_read' => false,
        ]);

        return response()->json(['message' => 'Tenant notified successfully']);
    }

    // Notifications
    public function getNotifications(): JsonResponse
    {
        if (! $this->notificationsTableAvailable()) {
            return $this->emptyPaginatedResponse();
        }

        $user = Auth::user();

        $notifications = Notification::where('user_id', $user->id)
            ->when(Schema::hasColumn('notifications', 'archived_at'), fn($q) => $q->whereNull('archived_at'))
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json([
            'data' => $notifications->items(),
            'pagination' => [
                'current_page' => $notifications->currentPage(),
                'last_page'    => $notifications->lastPage(),
                'per_page'     => $notifications->perPage(),
                'total'        => $notifications->total(),
            ]
        ]);
    }

    public function getNotificationStats(): JsonResponse
    {
        if (! $this->notificationsTableAvailable()) {
            return response()->json(['data' => [
                'total'     => 0,
                'unread'    => 0,
                'this_week' => 0,
            ]]);
        }

        $user = Auth::user();

        $unreadQuery = Notification::where('user_id', $user->id);
        if (Schema::hasColumn('notifications', 'is_read')) {
            $unreadQuery->where('is_read', false);
        } elseif (Schema::hasColumn('notifications', 'read_at')) {
            $unreadQuery->whereNull('read_at');
        }

        $stats = [
            'total'     => Notification::where('user_id', $user->id)->count(),
            'unread'    => $unreadQuery->count(),
            'this_week' => Notification::where('user_id', $user->id)
                ->where('created_at', '>=', now()->startOfWeek())
                ->count(),
        ];

        return response()->json(['data' => $stats]);
    }

    public function markNotificationAsRead(Notification $notification): JsonResponse
    {
        if (! $this->notificationsTableAvailable()) {
            return response()->json(['message' => 'Notifications unavailable'], 503);
        }

        $user = Auth::user();
        if ($notification->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $updates = ['is_read' => true];
        if (Schema::hasColumn('notifications', 'read_at')) {
            $updates['read_at'] = now();
        }

        $notification->update($updates);

        return response()->json(['message' => 'Notification marked as read']);
    }

    public function markAllNotificationsAsRead(): JsonResponse
    {
        if (! $this->notificationsTableAvailable()) {
            return response()->json(['message' => 'Notifications unavailable'], 503);
        }

        $user = Auth::user();

        $updates = ['is_read' => true];
        if (Schema::hasColumn('notifications', 'read_at')) {
            $updates['read_at'] = now();
        }

        Notification::where('user_id', $user->id)
            ->where('is_read', false)
            ->update($updates);

        return response()->json(['message' => 'All notifications marked as read']);
    }

    public function archiveNotification(Notification $notification): JsonResponse
    {
        if (! $this->notificationsTableAvailable()) {
            return response()->json(['message' => 'Notifications unavailable'], 503);
        }

        $user = Auth::user();
        if ($notification->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if (Schema::hasColumn('notifications', 'archived_at')) {
            $notification->update(['archived_at' => now()]);
        } else {
            $notification->update(['is_read' => true]);
        }

        return response()->json(['message' => 'Notification archived']);
    }

    public function deleteNotification(Notification $notification): JsonResponse
    {
        if (! $this->notificationsTableAvailable()) {
            return response()->json(['message' => 'Notifications are unavailable until supporting tables are migrated'], 503);
        }

        $user = Auth::user();

        if ($notification->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $notification->delete();

        return response()->json(['message' => 'Notification deleted']);
    }

    // Analytics
    public function getAnalytics(): JsonResponse
    {
        $user = Auth::user();

        $analytics = [
            'applications_by_status' => [
                'pending'  => Application::where('user_id', $user->id)->where('status', 'pending')->count(),
                'approved' => Application::where('user_id', $user->id)->where('status', 'approved')->count(),
                'rejected' => Application::where('user_id', $user->id)->where('status', 'rejected')->count(),
            ],
            'payment_trends' => [],
        ];

        return response()->json(['data' => $analytics]);
    }

    // Messages
    public function getMessages(): JsonResponse
    {
        if (! $this->messagesTableAvailable()) {
            return response()->json([
                'data' => ['messages' => [], 'recipient' => null],
                'pagination' => [
                    'current_page' => 1, 'last_page' => 1, 'per_page' => 50, 'total' => 0,
                ]
            ]);
        }

        $user = Auth::user();
        $tenant = $this->getTenantRecord($user->id);

        $messages = Message::with(['sender', 'recipient', 'property'])
            ->where(fn($q) => $q->where('sender_id', $user->id)->orWhere('receiver_id', $user->id))
            ->orderBy('created_at', 'desc')
            ->paginate(50);

        Message::where('receiver_id', $user->id)
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
                        'receiver_id'  => $message->receiver_id,
                        'property_id'  => $message->property_id,
                        'subject'      => $message->subject,
                        'body'         => $message->body,
                        'read_at'      => $message->read_at,
                        'created_at'   => $message->created_at,
                        'updated_at'   => $message->updated_at,
                        'sender'       => $message->sender,
                        'recipient'    => $message->recipient,
                        'property'     => $message->property,
                        'direction'    => $direction,
                        'counterparty' => $direction === 'sent' ? $message->recipient : $message->sender,
                    ];
                }, $messages->items()),
                'recipient' => $tenant && $tenant->property && $tenant->property->owner
                    ? [
                        'id'           => $tenant->property->owner->id,
                        'name'         => trim($tenant->property->owner->first_name . ' ' . $tenant->property->owner->last_name),
                        'property_id'  => $tenant->property_id,
                        'property_title'=> $tenant->property->title,
                    ]
                    : null,
            ],
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
        if (! $this->messagesTableAvailable() || ! $this->tenantTablesAvailable()) {
            return response()->json(['message' => 'Messaging is unavailable until supporting tables are migrated'], 503);
        }

        $validator = Validator::make($request->all(), [
            'subject' => 'nullable|string|max:255',
            'body'    => 'required|string|max:5000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors'  => $validator->errors()
            ], 422);
        }

        $user = Auth::user();
        $tenant = $this->getTenantRecord($user->id);

        if (! $tenant || ! $tenant->property || ! $tenant->property->owner) {
            return response()->json(['message' => 'No landlord contact found for this tenant'], 422);
        }

        $message = Message::create([
            'sender_id'   => $user->id,
            'receiver_id' => $tenant->property->owner->id,
            'property_id' => $tenant->property_id,
            'subject'     => $request->subject,
            'body'        => $request->body,
        ])->load(['sender', 'recipient', 'property']);

        return response()->json([
            'message' => 'Message sent successfully',
            'data'    => $message,
        ], 201);
    }

    // Digital Contracts
    public function getDigitalContracts(): JsonResponse
    {
        $user = Auth::user();
        $tenantIds = Tenant::where('user_id', $user->id)->pluck('id');

        if ($tenantIds->isEmpty()) {
            return response()->json(['data' => []]);
        }

        $contracts = DigitalContract::with('property')
            ->whereIn('tenant_id', $tenantIds)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['data' => $contracts]);
    }

    public function updateApplicationPaymentStatus(Request $request, $applicationId): JsonResponse
    {
        // Legacy endpoint — rent payments must go through initiateRentPayment + confirmation.
        return response()->json([
            'success' => false,
            'message' => 'Use POST /tenant/rent/pay to initiate rent payment. Status updates automatically after confirmation.',
        ], 422);
    }

    public function initiateRentPayment(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'application_id' => 'required|exists:applications,id',
            'phone_number'   => 'required|string|min:10|max:13',
            'provider'       => 'required|string|in:tigo,mpesa,airtel,halopesa,TIGO,MPESA,AIRTEL,HALOPESA,HALOPES',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors'  => $validator->errors(),
            ], 422);
        }

        $user = Auth::user();
        $application = Application::findOrFail($request->application_id);
        $result = app(RentPaymentService::class)->initiate(
            $user,
            $application,
            $request->phone_number,
            $request->provider
        );

        if (! ($result['success'] ?? false)) {
            return response()->json([
                'success' => false,
                'message' => $result['message'] ?? 'Rent payment initiation failed',
                'data'    => $result['data'] ?? null,
            ], 422);
        }

        return response()->json([
            'success' => true,
            'message' => $result['message'],
            'data'    => $result['data'],
        ]);
    }

    public function checkRentPaymentStatus(string $orderId): JsonResponse
    {
        $result = app(RentPaymentService::class)->checkStatus($orderId, Auth::user());

        if (! ($result['success'] ?? false)) {
            return response()->json([
                'success' => false,
                'message' => $result['message'] ?? 'Unable to check rent payment status',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'status' => $result['rent_payment_status'],
                'rent_payment_status' => $result['rent_payment_status'],
                'rent_paid' => $result['rent_paid'] ?? ($result['rent_payment_status'] === 'paid'),
                'application_id' => $result['application_id'],
                'message' => $result['message'] ?? null,
            ],
        ]);
    }

    private function formatApplicationForTenant(Application $application): array
    {
        $property = $application->property;
        $isAgentListed = (bool) $property?->agent_id;
        $siteVisitPaid = ! $isAgentListed
            || in_array($application->payment_status, ['paid', 'waived'], true);
        $rentPaid = $application->rent_payment_status === 'paid';
        $canPayRent = $application->status === 'approved' && $siteVisitPaid && ! $rentPaid;

        return array_merge($application->toArray(), [
            'rent_paid' => $rentPaid,
            'site_visit_paid' => $siteVisitPaid,
            'can_pay_rent' => $canPayRent,
            'next_step' => match (true) {
                $application->status === 'rejected' => 'Application was rejected.',
                $application->status === 'pending' && $isAgentListed && ! $siteVisitPaid => 'Complete the site visit fee payment.',
                $application->status === 'pending' => 'Waiting for landlord or agent approval.',
                $canPayRent => 'Pay your first month rent to secure the property.',
                $rentPaid => 'Rent paid. Check Digital Contracts for signing.',
                default => 'Track your application status here.',
            },
        ]);
    }

    public function downloadDigitalContract($contractId): \Symfony\Component\HttpFoundation\BinaryFileResponse|JsonResponse
    {
        $user = Auth::user();
        $tenantIds = Tenant::where('user_id', $user->id)->pluck('id');

        if ($tenantIds->isEmpty()) {
            return response()->json(['message' => 'No tenant records found'], 404);
        }

        $contract = DigitalContract::whereIn('tenant_id', $tenantIds)
            ->where('id', $contractId)
            ->first();

        if (!$contract) {
            return response()->json(['message' => 'Contract not found'], 404);
        }

        $storedPath = $contract->file_url ?? $contract->file_path;

        if (!$storedPath || !Storage::disk('public')->exists($storedPath)) {
            return response()->json(['message' => 'File not found'], 404);
        }

        $fileName = $contract->file_name ?? basename($storedPath);

        return Storage::disk('public')->download($storedPath, $fileName);
    }

    public function submitDigitalContract(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'contract_id' => 'required|exists:digital_contracts,id',
            'fields'      => 'required|array',
            'signature'   => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors'  => $validator->errors(),
            ], 422);
        }

        $user = Auth::user();
        $tenantIds = Tenant::where('user_id', $user->id)->pluck('id');

        $contract = DigitalContract::with('property')
            ->whereIn('tenant_id', $tenantIds)
            ->where('id', $request->contract_id)
            ->first();

        if (!$contract) {
            return response()->json(['message' => 'Contract not found'], 404);
        }

        if ($contract->status !== 'pending_signature') {
            return response()->json([
                'message' => 'This contract is not awaiting a signature (status: ' . $contract->status . ')',
            ], 422);
        }

        $tenantValues = $request->fields;
        $existingFields = is_array($contract->fields) ? $contract->fields : [];

        $mergedFields = array_map(function ($field) use ($tenantValues) {
            if (isset($tenantValues[$field['id']])) {
                $field['tenant_value'] = $tenantValues[$field['id']];
            }
            return $field;
        }, $existingFields);

        $contract->update([
            'fields'           => $mergedFields,
            'tenant_signature' => $request->signature,
            'status'           => 'pending_review',
            'signed_at'        => now(),
        ]);

        // Silent notification to landlord
        try {
            Notification::create([
                'user_id' => $contract->property->owner_id,
                'title'   => 'Contract Signed',
                'message' => "Tenant has signed the contract for {$contract->property->title}.",
                'type'    => 'contract',
                'data'    => json_encode(['contract_id' => $contract->id]),
                'is_read' => false,
            ]);
        } catch (\Exception $e) {
            // Silent fail
        }

        return response()->json([
            'message' => 'Contract submitted successfully',
            'data'    => $contract->fresh(['property']),
        ]);
    }

    // ==================== PRIVATE HELPERS ====================

    private function getTenantRecord(int $userId): ?Tenant
    {
        if (! Schema::hasTable('tenants')) {
            return null;
        }

        return Tenant::with('property.owner')
            ->where('user_id', $userId)
            ->first();
    }

    private function tenantTablesAvailable(): bool
    {
        return Schema::hasTable('tenants') && Schema::hasTable('contracts');
    }

    private function paymentsTableAvailable(): bool
    {
        return Schema::hasTable('payments');
    }

    /**
     * Backfill payments rows from application site-visit / rent confirmations
     * so tenant history includes all rental payments.
     */
    private function syncTenantApplicationPayments(User $user): void
    {
        if (! $this->paymentsTableAvailable() || ! Schema::hasTable('applications')) {
            return;
        }

        $alerts = app(PaymentAlertService::class);

        $applications = Application::with('property')
            ->where('user_id', $user->id)
            ->where(function ($q) {
                $q->where('payment_status', 'paid')
                    ->orWhere('rent_payment_status', 'paid');
            })
            ->get();

        foreach ($applications as $application) {
            $property = $application->property;
            if (! $property) {
                continue;
            }

            if ($application->payment_status === 'paid' && $application->transaction_id) {
                $alerts->recordCompletedPayment(
                    $user,
                    $property,
                    (float) ($application->service_fee ?: SiteVisitPaymentService::SERVICE_FEE),
                    'site_visit',
                    (string) $application->transaction_id,
                    'Site visit fee — ' . ($property->title ?? 'Property'),
                    [
                        'application_id' => $application->id,
                        'payment_method' => $application->payment_method,
                        'source' => 'application_backfill',
                    ],
                );
            }

            if ($application->rent_payment_status === 'paid' && $application->rent_transaction_id) {
                $amount = (float) ($application->amount_paid ?? $application->offered_rent ?? $property->price ?? 0);
                $alerts->recordCompletedPayment(
                    $user,
                    $property,
                    $amount,
                    'first_month_rent',
                    (string) $application->rent_transaction_id,
                    'First month rent — ' . ($property->title ?? 'Property'),
                    [
                        'application_id' => $application->id,
                        'payment_method' => $application->rent_payment_method,
                        'source' => 'application_backfill',
                    ],
                );
            }
        }
    }

    private function formatPaymentForTenant(Payment $payment): array
    {
        $status = $payment->status;
        if ($status === 'completed') {
            $status = 'paid';
        }

        $typeLabels = [
            'first_month_rent' => 'First month rent',
            'monthly_rent' => 'Monthly rent',
            'site_visit' => 'Site visit fee',
            'rent' => 'Rent',
        ];

        return [
            'id' => $payment->id,
            'type' => $payment->type,
            'description' => $payment->description
                ?: ($typeLabels[$payment->type] ?? ucfirst(str_replace('_', ' ', (string) $payment->type))),
            'amount' => (float) $payment->amount,
            'status' => $status,
            'reference' => $payment->reference,
            'due_date' => optional($payment->due_date)?->toDateString(),
            'paid_at' => optional($payment->paid_at)?->toIso8601String(),
            'created_at' => optional($payment->created_at)?->toIso8601String(),
            'property' => $payment->property ? [
                'id' => $payment->property->id,
                'title' => $payment->property->title,
                'location' => $payment->property->location ?? null,
            ] : null,
        ];
    }

    private function notificationsTableAvailable(): bool
    {
        return Schema::hasTable('notifications');
    }

    private function messagesTableAvailable(): bool
    {
        return Schema::hasTable('messages');
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
            ]
        ]);
    }
}
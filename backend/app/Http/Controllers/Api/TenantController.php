<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Tenant;
use App\Models\Property;
use App\Models\Application;
use App\Models\Contract;
use App\Models\Payment;
use App\Models\SavedProperty;
use App\Models\Notification;
use App\Models\Message;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Validator;

class TenantController extends Controller
{
    // Dashboard
    public function getDashboard(): JsonResponse
    {
        $user = Auth::user();
        $stats = [
            'total_properties' => Property::count(),
            'saved_properties' => SavedProperty::where('user_id', $user->id)->count(),
            'total_applications' => Application::where('user_id', $user->id)->count(),
            'messages' => $this->messagesTableAvailable()
                ? Message::where('recipient_id', $user->id)->whereNull('read_at')->count()
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
                'last_page' => $savedProperties->lastPage(),
                'per_page' => $savedProperties->perPage(),
                'total' => $savedProperties->total(),
            ]
        ]);
    }

    public function saveProperty(Request $request, Property $property): JsonResponse
    {
        $user = Auth::user();
        
        $existing = SavedProperty::where('user_id', $user->id)
            ->where('property_id', $property->id)
            ->first();

        if ($existing) {
            return response()->json(['message' => 'Property already saved'], 422);
        }

        SavedProperty::create([
            'user_id' => $user->id,
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

    public function createApplication(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'property_id' => 'required|exists:properties,id',
            'message' => 'required|string|max:1000',
            'proposed_rent' => 'sometimes|numeric|min:0',
            'move_in_date' => 'sometimes|date|after:today',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = Auth::user();
        
        // Check if user already applied
        $existing = Application::where('user_id', $user->id)
            ->where('property_id', $request->property_id)
            ->first();

        if ($existing) {
            return response()->json(['message' => 'You have already applied for this property'], 422);
        }

        $application = Application::create([
            'user_id' => $user->id,
            'property_id' => $request->property_id,
            'message' => $request->message,
            'proposed_rent' => $request->proposed_rent,
            'move_in_date' => $request->move_in_date,
            'status' => 'pending',
        ]);

        return response()->json([
            'message' => 'Application submitted successfully',
            'data' => $application->load('property')
        ], 201);
    }

    // Contracts
    public function getMyContract(): JsonResponse
    {
        if (! $this->tenantTablesAvailable()) {
            return response()->json(['message' => 'No active contract found'], 404);
        }

        $user = Auth::user();
        $contract = Contract::with('property', 'property.owner', 'tenant')
            ->whereHas('tenant', function ($query) use ($user) {
                $query->where('user_id', $user->id);
            })
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

        // TODO: Generate PDF contract
        return response()->json(['message' => 'Contract download not implemented yet'], 501);
    }

    // Payments
    public function getMyPayments(): JsonResponse
    {
        if (! $this->paymentsTableAvailable()) {
            return $this->emptyPaginatedResponse(10);
        }

        $user = Auth::user();
        $payments = Payment::with('property')
            ->where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->paginate(10);

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

    public function getPaymentMethods(): JsonResponse
    {
        // TODO: Return available payment methods
        $methods = [
            [
                'id' => 1,
                'name' => 'M-Pesa',
                'type' => 'mobile_money',
                'provider' => 'Vodacom Tanzania',
                'is_active' => true,
                'supported_currencies' => ['TZS'],
                'fees' => ['percentage' => 1.5, 'fixed' => 500],
                'limits' => ['min' => 1000, 'max' => 5000000],
            ],
            [
                'id' => 2,
                'name' => 'Tigo Pesa',
                'type' => 'mobile_money',
                'provider' => 'Tigo Tanzania',
                'is_active' => true,
                'supported_currencies' => ['TZS'],
                'fees' => ['percentage' => 1.5, 'fixed' => 500],
                'limits' => ['min' => 1000, 'max' => 4000000],
            ],
        ];

        return response()->json(['data' => $methods]);
    }

    public function getPaymentStats(): JsonResponse
    {
        if (! $this->paymentsTableAvailable()) {
            return response()->json(['data' => [
                'total_paid' => 0,
                'pending_payments' => 0,
                'this_month' => 0,
            ]]);
        }

        $user = Auth::user();
        $stats = [
            'total_paid' => Payment::where('user_id', $user->id)->where('status', 'completed')->sum('amount'),
            'pending_payments' => Payment::where('user_id', $user->id)->where('status', 'pending')->count(),
            'this_month' => Payment::where('user_id', $user->id)
                ->where('status', 'completed')
                ->whereMonth('created_at', now()->month)
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

        $validator = Validator::make($request->all(), [
            'payment_method_id' => 'required|integer',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // TODO: Process payment with payment gateway
        $payment->update([
            'status' => 'processing',
            'payment_method_id' => $request->payment_method_id,
        ]);

        return response()->json(['message' => 'Payment initiated successfully']);
    }

    public function getPaymentHistory(): JsonResponse
    {
        return $this->getMyPayments();
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

        // TODO: Generate PDF receipt
        return response()->json(['message' => 'Receipt download not implemented yet'], 501);
    }

    // Notifications
    public function getNotifications(): JsonResponse
    {
        if (! $this->notificationsTableAvailable()) {
            return $this->emptyPaginatedResponse();
        }

        $user = Auth::user();
        $notifications = Notification::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json([
            'data' => $notifications->items(),
            'pagination' => [
                'current_page' => $notifications->currentPage(),
                'last_page' => $notifications->lastPage(),
                'per_page' => $notifications->perPage(),
                'total' => $notifications->total(),
            ]
        ]);
    }

    public function getNotificationStats(): JsonResponse
    {
        if (! $this->notificationsTableAvailable()) {
            return response()->json(['data' => [
                'total' => 0,
                'unread' => 0,
                'this_week' => 0,
            ]]);
        }

        $user = Auth::user();
        $stats = [
            'total' => Notification::where('user_id', $user->id)->count(),
            'unread' => Notification::where('user_id', $user->id)->where('read_at', null)->count(),
            'this_week' => Notification::where('user_id', $user->id)
                ->where('created_at', '>=', now()->startOfWeek())
                ->count(),
        ];

        return response()->json(['data' => $stats]);
    }

    public function markNotificationAsRead(Notification $notification): JsonResponse
    {
        if (! $this->notificationsTableAvailable()) {
            return response()->json(['message' => 'Notifications are unavailable until supporting tables are migrated'], 503);
        }

        $user = Auth::user();
        
        if ($notification->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $notification->update(['read_at' => now()]);

        return response()->json(['message' => 'Notification marked as read']);
    }

    public function markAllNotificationsAsRead(): JsonResponse
    {
        if (! $this->notificationsTableAvailable()) {
            return response()->json(['message' => 'Notifications are unavailable until supporting tables are migrated'], 503);
        }

        $user = Auth::user();
        
        Notification::where('user_id', $user->id)
            ->where('read_at', null)
            ->update(['read_at' => now()]);

        return response()->json(['message' => 'All notifications marked as read']);
    }

    public function archiveNotification(Notification $notification): JsonResponse
    {
        if (! $this->notificationsTableAvailable()) {
            return response()->json(['message' => 'Notifications are unavailable until supporting tables are migrated'], 503);
        }

        $user = Auth::user();
        
        if ($notification->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $notification->update(['archived_at' => now()]);

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
        
        // TODO: Implement tenant analytics
        $analytics = [
            'applications_by_status' => [
                'pending' => Application::where('user_id', $user->id)->where('status', 'pending')->count(),
                'approved' => Application::where('user_id', $user->id)->where('status', 'approved')->count(),
                'rejected' => Application::where('user_id', $user->id)->where('status', 'rejected')->count(),
            ],
            'payment_trends' => [
                // TODO: Calculate payment trends
            ],
        ];

        return response()->json(['data' => $analytics]);
    }

    public function getMessages(): JsonResponse
    {
        if (! $this->messagesTableAvailable()) {
            return response()->json([
                'data' => [
                    'messages' => [],
                    'recipient' => null,
                ],
                'pagination' => [
                    'current_page' => 1,
                    'last_page' => 1,
                    'per_page' => 50,
                    'total' => 0,
                ]
            ]);
        }

        $user = Auth::user();
        $tenant = $this->getTenantRecord($user->id);

        $messages = Message::with(['sender', 'recipient', 'property'])
            ->where(function ($query) use ($user) {
                $query->where('sender_id', $user->id)
                    ->orWhere('recipient_id', $user->id);
            })
            ->orderBy('created_at', 'desc')
            ->paginate(50);

        Message::where('recipient_id', $user->id)
            ->whereNull('read_at')
            ->whereIn('id', collect($messages->items())->pluck('id'))
            ->update(['read_at' => now()]);

        return response()->json([
            'data' => [
                'messages' => array_map(function ($message) use ($user) {
                    $direction = $message->sender_id === $user->id ? 'sent' : 'received';

                    return [
                        'id' => $message->id,
                        'sender_id' => $message->sender_id,
                        'recipient_id' => $message->recipient_id,
                        'property_id' => $message->property_id,
                        'subject' => $message->subject,
                        'body' => $message->body,
                        'read_at' => $message->read_at,
                        'created_at' => $message->created_at,
                        'updated_at' => $message->updated_at,
                        'sender' => $message->sender,
                        'recipient' => $message->recipient,
                        'property' => $message->property,
                        'direction' => $direction,
                        'counterparty' => $direction === 'sent' ? $message->recipient : $message->sender,
                    ];
                }, $messages->items()),
                'recipient' => $tenant && $tenant->property && $tenant->property->owner
                    ? [
                        'id' => $tenant->property->owner->id,
                        'name' => trim($tenant->property->owner->first_name . ' ' . $tenant->property->owner->last_name),
                        'property_id' => $tenant->property_id,
                        'property_title' => $tenant->property->title,
                    ]
                    : null,
            ],
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
        if (! $this->messagesTableAvailable() || ! $this->tenantTablesAvailable()) {
            return response()->json(['message' => 'Messaging is unavailable until supporting tables are migrated'], 503);
        }

        $validator = Validator::make($request->all(), [
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
        $tenant = $this->getTenantRecord($user->id);

        if (! $tenant || ! $tenant->property || ! $tenant->property->owner) {
            return response()->json(['message' => 'No landlord contact found for this tenant'], 422);
        }

        $message = Message::create([
            'sender_id' => $user->id,
            'recipient_id' => $tenant->property->owner->id,
            'property_id' => $tenant->property_id,
            'subject' => $request->subject,
            'body' => $request->body,
        ])->load(['sender', 'recipient', 'property']);

        return response()->json([
            'message' => 'Message sent successfully',
            'data' => $message,
        ], 201);
    }

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
        return Schema::hasTable('payments') && class_exists(Payment::class);
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
                'last_page' => 1,
                'per_page' => $perPage,
                'total' => 0,
            ]
        ]);
    }
}

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
            return response()->json(['message' => 'Property already saved', 'already_saved' => true]);
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
            'property_id'    => 'required|exists:properties,id',
            'message'        => 'nullable|string|max:1000',
            'proposed_rent'   => 'sometimes|numeric|min:0',
            'move_in_date'   => 'sometimes|date|after:today',
            // payment fields — all nullable so both flows work
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

        $user     = Auth::user();
        $property = Property::findOrFail($request->property_id);

        // Check for duplicate — but allow re-apply if previous was withdrawn
        $existingApplication = Application::where('user_id', $user->id)
            ->where('property_id', $property->id)
            ->whereNotIn('status', ['withdrawn', 'rejected'])
            ->first();

        if ($existingApplication) {
            return response()->json([
                'message' => 'You have already applied for this property',
                'data'    => $existingApplication
            ], 409);
        }

        $application = Application::create([
            'user_id'        => $user->id,
            'property_id'    => $property->id,
            'owner_id'       => $request->owner_id,
            'message'        => $request->message ?? "Site visit request for {$property->title}",
            'proposed_rent'   => $request->proposed_rent,
            'service_fee'    => $request->service_fee,
            'payment_status' => $request->payment_status,
            'payment_method' => $request->payment_method,
            'transaction_id' => $request->transaction_id,
            'applied_at'     => now(),
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

    public function updateApplicationStatus(Request $request): JsonResponse
    {
        $user = Auth::user();
        $applicationId = $request->get('id');
        $status = $request->get('status');
        $message = $request->get('message');
        
        if (!$applicationId || !$status) {
            return response()->json(['error' => 'Application ID and status are required'], 400);
        }
        
        $application = Application::with(['user', 'property'])
            ->where('user_id', $user->id)
            ->where('id', $applicationId)
            ->first();
        
        if (!$application) {
            return response()->json(['error' => 'Application not found'], 404);
        }
        
        $application->update(['status' => $status, 'message' => $message]);
        
        return response()->json(['message' => 'Application status updated successfully']);
    }

    public function notifyApproval(Request $request): JsonResponse
{
    $validator = \Illuminate\Support\Facades\Validator::make($request->all(), [
        'application_id' => 'required|integer',
        'tenant_email'   => 'required|email',
    ]);
 
    if ($validator->fails()) {
        return response()->json(['error' => 'Application ID and tenant email are required'], 400);
    }
 
    $user          = Auth::user();
    $applicationId = $request->get('application_id');
 
    $application = \App\Models\Application::with('property')
        ->findOrFail($applicationId);
 
    // Find the tenant user by email
    $tenantUser = \App\Models\User::where('email', $request->tenant_email)->first();
    if (! $tenantUser) {
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
        // Exclude archived notifications from the main list
        ->when(
            \Illuminate\Support\Facades\Schema::hasColumn('notifications', 'archived_at'),
            fn($q) => $q->whereNull('archived_at')
        )
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
 
    // Determine which column tracks read status — prefer 'is_read', fall back
    // to 'read_at' for legacy schemas.
    $hasIsRead  = \Illuminate\Support\Facades\Schema::hasColumn('notifications', 'is_read');
    $hasReadAt  = \Illuminate\Support\Facades\Schema::hasColumn('notifications', 'read_at');
 
    $unreadQuery = Notification::where('user_id', $user->id);
    if ($hasIsRead) {
        $unreadQuery->where('is_read', false);
    } elseif ($hasReadAt) {
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
 
    // Also set read_at if the column exists (keeps legacy schemas happy)
    if (\Illuminate\Support\Facades\Schema::hasColumn('notifications', 'read_at')) {
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
    if (\Illuminate\Support\Facades\Schema::hasColumn('notifications', 'read_at')) {
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
 
    // If the table has an archived_at column, use it; otherwise soft-delete
    if (\Illuminate\Support\Facades\Schema::hasColumn('notifications', 'archived_at')) {
        $notification->update(['archived_at' => now()]);
    } else {
        // Fallback: just mark as read so it stops showing as unread
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

    // Digital Contracts Management
    public function getDigitalContracts(): JsonResponse
{
    $user = Auth::user();
 
    // Resolve all Tenant records that belong to this user
    $tenantIds = Tenant::where('user_id', $user->id)->pluck('id');
 
    if ($tenantIds->isEmpty()) {
        return response()->json(['data' => []]);
    }
 
    $contracts = DigitalContract::with(['property'])
        ->whereIn('tenant_id', $tenantIds)
        // Temporarily show all contracts for debugging
        // ->where('status', '!=', 'draft')
        ->orderBy('created_at', 'desc')
        ->get();
 
    return response()->json(['data' => $contracts]);
}

/**
 * Update application payment status after successful payment
 * PUT /api/tenant/applications/{application}/payment-status
 */
public function updateApplicationPaymentStatus(Request $request, $applicationId)
{
    try {
        $validated = $request->validate([
            'payment_status' => 'required|string|in:paid,pending,failed',
            'payment_method' => 'required|string',
            'transaction_id' => 'required|string',
            'amount_paid' => 'required|numeric|min:0',
        ]);

        $user = Auth::user();
        
        // Get tenant IDs for this user
        $tenantIds = Tenant::where('user_id', $user->id)->pluck('id');
        
        // Find the application belonging to this tenant
        $application = \App\Models\Application::whereIn('tenant_id', $tenantIds)
            ->where('id', $applicationId)
            ->firstOrFail();

        // Update application payment status
        $application->update([
            'payment_status' => $validated['payment_status'],
            'payment_method' => $validated['payment_method'],
            'transaction_id' => $validated['transaction_id'],
            'amount_paid' => $validated['amount_paid'],
            'paid_at' => $validated['payment_status'] === 'paid' ? now() : null,
        ]);

        // If payment is successful, update rent_paid status
        if ($validated['payment_status'] === 'paid') {
            $application->update(['rent_paid' => true]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Application payment status updated successfully',
            'data' => $application->fresh()
        ]);

    } catch (\Illuminate\Validation\ValidationException $e) {
        return response()->json([
            'success' => false,
            'error' => 'VALIDATION_ERROR',
            'errors' => $e->errors(),
        ], 422);
        
    } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
        return response()->json([
            'success' => false,
            'message' => 'Application not found or access denied',
        ], 404);
        
    } catch (\Exception $e) {
        \Log::error('Error updating application payment status', [
            'error' => $e->getMessage(),
            'application_id' => $applicationId,
            'user_id' => Auth::id(),
        ]);

        return response()->json([
            'success' => false,
            'message' => 'An unexpected error occurred while updating payment status',
        ], 500);
    }
}

public function downloadDigitalContract($contractId): \Symfony\Component\HttpFoundation\BinaryFileResponse|JsonResponse
{
    $user = Auth::user();
 
    // Resolve all Tenant records that belong to this user
    $tenantIds = Tenant::where('user_id', $user->id)->pluck('id');
 
    if ($tenantIds->isEmpty()) {
        return response()->json(['message' => 'No tenant records found'], 404);
    }

    $contract = DigitalContract::whereIn('tenant_id', $tenantIds)
        ->where('id', $contractId)
        ->first();
 
    if (! $contract) {
        return response()->json(['message' => 'Contract not found'], 404);
    }
 
    // Prefer file_url (remote / stored path) over legacy file_path
    $storedPath = $contract->file_url ?? $contract->file_path ?? null;
 
    if (! $storedPath) {
        return response()->json(['message' => 'No file attached to this contract'], 404);
    }
 
    // Resolve absolute path via the public storage disk
    $absolutePath = \Illuminate\Support\Facades\Storage::disk('public')->path($storedPath);
 
    if (! file_exists($absolutePath)) {
        return response()->json(['message' => 'File not found on disk'], 404);
    }
 
    $fileName = $contract->file_name ?? basename($storedPath);
 
    return response()->download($absolutePath, $fileName);
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
 
    $user      = Auth::user();
    $tenantIds = Tenant::where('user_id', $user->id)->pluck('id');
 
    // Scope to this tenant so they can't sign contracts belonging to others
    $contract = DigitalContract::with(['property'])
        ->whereIn('tenant_id', $tenantIds)
        ->where('id', $request->contract_id)
        ->first();
 
    if (! $contract) {
        return response()->json(['message' => 'Contract not found'], 404);
    }
 
    if ($contract->status !== 'pending_signature') {
        return response()->json([
            'message' => 'This contract is not awaiting a signature (status: ' . $contract->status . ')',
        ], 422);
    }
 
    // Merge tenant-supplied values into the existing field definitions
    // so the landlord's labels, types, and required flags are preserved.
    $tenantValues   = $request->fields;                       // ['field_id' => 'value', ...]
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
        'status'           => 'pending_review',   // ← was 'pending', now matches frontend
        'signed_at'        => now(),
    ]);
 
    // Notify the landlord — best-effort, skip if notifications table is missing
        Notification::create([
    'user_id' => $contract->property->owner_id,
    'title'   => 'Contract Signed',
    'message' => "Tenant has signed the contract for {$contract->property->title}.",
    'type'    => 'contract',
    'data'    => json_encode(['contract_id' => $contract->id]),
    'is_read' => false,]);

    return response()->json([
        'message' => 'Contract submitted successfully',
        'data'    => $contract->fresh(['property']),
    ]);
}

}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Property;
use App\Models\Application;
use App\Models\Contract;
use App\Models\Payment;
use App\Models\SavedProperty;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
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
            'messages' => 0, // TODO: Implement messages
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
        $user = Auth::user();
        
        if ($notification->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $notification->update(['read_at' => now()]);

        return response()->json(['message' => 'Notification marked as read']);
    }

    public function markAllNotificationsAsRead(): JsonResponse
    {
        $user = Auth::user();
        
        Notification::where('user_id', $user->id)
            ->where('read_at', null)
            ->update(['read_at' => now()]);

        return response()->json(['message' => 'All notifications marked as read']);
    }

    public function archiveNotification(Notification $notification): JsonResponse
    {
        $user = Auth::user();
        
        if ($notification->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $notification->update(['archived_at' => now()]);

        return response()->json(['message' => 'Notification archived']);
    }

    public function deleteNotification(Notification $notification): JsonResponse
    {
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
}

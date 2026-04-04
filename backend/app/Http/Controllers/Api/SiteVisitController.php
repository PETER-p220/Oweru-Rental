<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Property;
use App\Models\SiteVisit;
use App\Models\SiteVisitNotification;
use App\Models\User;
use App\Services\SelcomPaymentService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class SiteVisitController extends Controller
{
    protected $selcomService;

    public function __construct(SelcomPaymentService $selcomService)
    {
        $this->selcomService = $selcomService;
    }

    /**
     * Request a site visit with Selcom payment integration
     */
    public function requestVisit(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'property_id' => 'required|exists:properties,id',
            'requested_date' => 'required|date|after:today',
            'preferred_time' => 'required|date_format:H:i',
            'contact_phone' => 'required|string|max:20',
            'contact_email' => 'required|email',
            'notes' => 'nullable|string|max:500',
            'payment_method' => 'required|in:selcom,mobile_money,cash',
            'phone_number' => 'required_if:payment_method,mobile_money|string|max:20',
            'provider' => 'required_if:payment_method,mobile_money|in:tigo,mpesa,airtel',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $tenant = auth()->user();
            $property = Property::findOrFail($request->property_id);

            // Calculate visit fee (example: 10,000 TZS)
            $visitFee = 10000;

            // Create site visit record
            $siteVisit = SiteVisit::create([
                'property_id' => $property->id,
                'tenant_id' => $tenant->id,
                'agent_id' => $property->agent_id,
                'landlord_id' => $property->owner_id,
                'requested_date' => $request->requested_date,
                'preferred_time' => $request->requested_date . ' ' . $request->preferred_time,
                'contact_phone' => $request->contact_phone,
                'contact_email' => $request->contact_email,
                'notes' => $request->notes,
                'payment_method' => $request->payment_method,
                'payment_amount' => $visitFee,
                'status' => 'pending',
                'payment_status' => 'pending',
            ]);

            // Handle payment based on method
            $paymentResult = null;
            if ($request->payment_method === 'selcom') {
                $paymentResult = $this->processSelcomPayment($siteVisit, $request);
            } elseif ($request->payment_method === 'mobile_money') {
                $paymentResult = $this->processMobileMoneyPayment($siteVisit, $request);
            } else {
                // Cash payment - mark as pending cash payment
                $paymentResult = [
                    'success' => true,
                    'message' => 'Cash payment required on site visit day',
                    'data' => [
                        'payment_status' => 'pending',
                        'amount' => $visitFee,
                    ]
                ];
            }

            if (!$paymentResult['success']) {
                $siteVisit->delete();
                return response()->json([
                    'success' => false,
                    'message' => 'Payment failed: ' . $paymentResult['message'],
                    'data' => $paymentResult
                ], 400);
            }

            // Update site visit with payment info
            if (isset($paymentResult['data']['transaction_id'])) {
                $siteVisit->update([
                    'payment_transaction_id' => $paymentResult['data']['transaction_id'],
                    'payment_status' => $paymentResult['data']['payment_status'] ?? 'pending',
                ]);
            }

            // Send notifications to agent and landlord
            $this->sendVisitNotifications($siteVisit, 'visit_requested');

            return response()->json([
                'success' => true,
                'message' => 'Site visit requested successfully',
                'data' => [
                    'site_visit' => $siteVisit->load(['property', 'agent', 'landlord']),
                    'payment' => $paymentResult['data'] ?? null,
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Site visit request error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to request site visit',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Process Selcom payment for site visit
     */
    protected function processSelcomPayment(SiteVisit $siteVisit, Request $request): array
    {
        try {
            $paymentData = [
                'amount' => $siteVisit->payment_amount,
                'property_id' => $siteVisit->property_id,
                'tenant_id' => $siteVisit->tenant_id,
                'customer_email' => $siteVisit->contact_email,
                'customer_phone' => $siteVisit->contact_phone,
                'customer_name' => auth()->user()->name,
                'order_id' => 'SITE_VISIT_' . $siteVisit->id,
            ];

            $result = $this->selcomService->initiatePayment($paymentData);

            if ($result['success']) {
                Log::info('Selcom payment initiated for site visit', [
                    'site_visit_id' => $siteVisit->id,
                    'transaction_id' => $result['data']['transaction_id'] ?? null
                ]);

                return [
                    'success' => true,
                    'message' => 'Payment initiated successfully',
                    'data' => [
                        'payment_url' => $result['data']['payment_url'] ?? null,
                        'transaction_id' => $result['data']['transaction_id'] ?? null,
                        'payment_status' => 'pending',
                        'amount' => $siteVisit->payment_amount,
                    ]
                ];
            } else {
                Log::error('Selcom payment failed for site visit', [
                    'site_visit_id' => $siteVisit->id,
                    'error' => $result['error'] ?? 'Unknown error'
                ]);

                return [
                    'success' => false,
                    'message' => $result['message'] ?? 'Payment initiation failed',
                    'error' => $result['error'] ?? 'UNKNOWN_ERROR'
                ];
            }

        } catch (\Exception $e) {
            Log::error('Selcom payment processing error: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Payment processing error',
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Process mobile money payment for site visit
     */
    protected function processMobileMoneyPayment(SiteVisit $siteVisit, Request $request): array
    {
        try {
            $paymentData = [
                'amount' => $siteVisit->payment_amount,
                'phone_number' => $request->phone_number,
                'provider' => $request->provider,
                'property_id' => $siteVisit->property_id,
                'tenant_id' => $siteVisit->tenant_id,
            ];

            $result = $this->selcomService->initiateMobileMoneyPayment($paymentData);

            if ($result['success']) {
                Log::info('Mobile money payment initiated for site visit', [
                    'site_visit_id' => $siteVisit->id,
                    'transaction_id' => $result['data']['transaction_id'] ?? null
                ]);

                return [
                    'success' => true,
                    'message' => 'Mobile money payment initiated',
                    'data' => [
                        'transaction_id' => $result['data']['transaction_id'] ?? null,
                        'payment_status' => $result['data']['status'] ?? 'pending',
                        'amount' => $siteVisit->payment_amount,
                    ]
                ];
            } else {
                Log::error('Mobile money payment failed for site visit', [
                    'site_visit_id' => $siteVisit->id,
                    'error' => $result['error'] ?? 'Unknown error'
                ]);

                return [
                    'success' => false,
                    'message' => $result['message'] ?? 'Mobile money payment failed',
                    'error' => $result['error'] ?? 'UNKNOWN_ERROR'
                ];
            }

        } catch (\Exception $e) {
            Log::error('Mobile money payment processing error: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Mobile money payment processing error',
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Send notifications to relevant parties
     */
    protected function sendVisitNotifications(SiteVisit $siteVisit, string $type): void
    {
        $notifications = [];

        switch ($type) {
            case 'visit_requested':
                // Notify agent
                if ($siteVisit->agent) {
                    $notifications[] = [
                        'user_id' => $siteVisit->agent_id,
                        'type' => 'visit_requested',
                        'title' => 'New Site Visit Request',
                        'message' => "A tenant has requested a site visit for {$siteVisit->property->title} on {$siteVisit->requested_date->format('M j, Y')} at {$siteVisit->preferred_time->format('H:i')}",
                        'sent_via' => 'system',
                    ];
                }

                // Notify landlord
                if ($siteVisit->landlord) {
                    $notifications[] = [
                        'user_id' => $siteVisit->landlord_id,
                        'type' => 'visit_requested',
                        'title' => 'New Site Visit Request',
                        'message' => "A tenant has requested a site visit for your property {$siteVisit->property->title} on {$siteVisit->requested_date->format('M j, Y')}",
                        'sent_via' => 'system',
                    ];
                }
                break;

            case 'visit_confirmed':
                // Notify tenant
                $notifications[] = [
                    'user_id' => $siteVisit->tenant_id,
                    'type' => 'visit_confirmed',
                    'title' => 'Site Visit Confirmed',
                    'message' => "Your site visit for {$siteVisit->property->title} has been confirmed. Confirmation code: {$siteVisit->confirmation_code}",
                    'sent_via' => 'system',
                ];
                break;

            case 'visit_cancelled':
                // Notify tenant
                $notifications[] = [
                    'user_id' => $siteVisit->tenant_id,
                    'type' => 'visit_cancelled',
                    'title' => 'Site Visit Cancelled',
                    'message' => "Your site visit for {$siteVisit->property->title} has been cancelled. Reason: {$siteVisit->cancel_reason}",
                    'sent_via' => 'system',
                ];
                break;
        }

        // Create notifications
        foreach ($notifications as $notification) {
            SiteVisitNotification::create(array_merge($notification, [
                'site_visit_id' => $siteVisit->id,
                'sent_at' => now(),
                'is_read' => false,
            ]));
        }
    }

    /**
     * Get site visits for the authenticated user
     */
    public function getMyVisits(Request $request): JsonResponse
    {
        try {
            $user = auth()->user();
            $query = SiteVisit::with(['property', 'agent', 'landlord']);

            // Filter based on user role
            switch ($user->user_type) {
                case 'tenant':
                    $query->where('tenant_id', $user->id);
                    break;
                case 'agent':
                    $query->where('agent_id', $user->id);
                    break;
                case 'landlord':
                    $query->where('landlord_id', $user->id);
                    break;
                default:
                    return response()->json([
                        'success' => false,
                        'message' => 'Unauthorized role'
                    ], 403);
            }

            $visits = $query->orderBy('created_at', 'desc')->get();

            return response()->json([
                'success' => true,
                'data' => $visits
            ]);

        } catch (\Exception $e) {
            Log::error('Get my visits error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch site visits',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Confirm a site visit (for agents/landlords)
     */
    public function confirmVisit(Request $request, $id): JsonResponse
    {
        try {
            $user = auth()->user();
            $siteVisit = SiteVisit::findOrFail($id);

            // Check if user can confirm this visit
            if ($user->user_type !== 'agent' && $user->user_type !== 'landlord') {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized to confirm visits'
                ], 403);
            }

            if ($siteVisit->agent_id !== $user->id && $siteVisit->landlord_id !== $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'This visit is not assigned to you'
                ], 403);
            }

            if (!$siteVisit->canBeConfirmed()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Visit cannot be confirmed. Payment required or already processed.'
                ], 400);
            }

            if ($siteVisit->confirm()) {
                $this->sendVisitNotifications($siteVisit, 'visit_confirmed');

                return response()->json([
                    'success' => true,
                    'message' => 'Site visit confirmed successfully',
                    'data' => $siteVisit->load(['property', 'agent', 'landlord'])
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Failed to confirm site visit'
            ], 500);

        } catch (\Exception $e) {
            Log::error('Confirm visit error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to confirm site visit',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Cancel a site visit
     */
    public function cancelVisit(Request $request, $id): JsonResponse
    {
        try {
            $user = auth()->user();
            $siteVisit = SiteVisit::findOrFail($id);

            // Validate request
            $validator = Validator::make($request->all(), [
                'reason' => 'required|string|max:500'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Check permissions
            if ($siteVisit->tenant_id !== $user->id && 
                $siteVisit->agent_id !== $user->id && 
                $siteVisit->landlord_id !== $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized to cancel this visit'
                ], 403);
            }

            if ($siteVisit->cancel($request->reason)) {
                $this->sendVisitNotifications($siteVisit, 'visit_cancelled');

                return response()->json([
                    'success' => true,
                    'message' => 'Site visit cancelled successfully',
                    'data' => $siteVisit->load(['property', 'agent', 'landlord'])
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Failed to cancel site visit'
            ], 500);

        } catch (\Exception $e) {
            Log::error('Cancel visit error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to cancel site visit',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get notifications for the authenticated user
     */
    public function getNotifications(Request $request): JsonResponse
    {
        try {
            $user = auth()->user();
            
            $notifications = SiteVisitNotification::with(['siteVisit.property'])
                ->where('user_id', $user->id)
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $notifications
            ]);

        } catch (\Exception $e) {
            Log::error('Get notifications error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch notifications',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mark notification as read
     */
    public function markNotificationRead($id): JsonResponse
    {
        try {
            $user = auth()->user();
            
            $notification = SiteVisitNotification::where('id', $id)
                ->where('user_id', $user->id)
                ->firstOrFail();

            $notification->markAsRead();

            return response()->json([
                'success' => true,
                'message' => 'Notification marked as read'
            ]);

        } catch (\Exception $e) {
            Log::error('Mark notification read error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to mark notification as read',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}

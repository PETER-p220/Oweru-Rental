<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SiteVisit;
use App\Services\SelcomPaymentService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class PaymentWebhookController extends Controller
{
    protected $selcomService;

    public function __construct(SelcomPaymentService $selcomService)
    {
        $this->selcomService = $selcomService;
    }

    /**
     * Handle Selcom payment webhook
     */
    public function handleSelcomWebhook(Request $request): JsonResponse
    {
        try {
            Log::info('Selcom webhook received', [
                'headers' => $request->headers->all(),
                'payload' => $request->all(),
            ]);

            $webhookData = $request->all();

            // Process webhook with Selcom service
            $result = $this->selcomService->processWebhook($webhookData);

            if (!$result['success']) {
                Log::error('Webhook processing failed', [
                    'error' => $result['error'],
                    'message' => $result['message'],
                ]);

                return response()->json([
                    'success' => false,
                    'message' => $result['message'],
                ], 400);
            }

            $paymentData = $result['data'];

            // Find related site visit by transaction ID or order ID
            $siteVisit = null;
            
            if (isset($paymentData['transaction_id'])) {
                $siteVisit = SiteVisit::where('payment_transaction_id', $paymentData['transaction_id'])->first();
            }
            
            if (!$siteVisit && isset($paymentData['order_id'])) {
                // Extract site visit ID from order ID if it's in format "SITE_VISIT_{id}"
                if (preg_match('/SITE_VISIT_(\d+)/', $paymentData['order_id'], $matches)) {
                    $siteVisit = SiteVisit::find($matches[1]);
                }
            }

            if (!$siteVisit) {
                Log::warning('No site visit found for payment webhook', [
                    'payment_data' => $paymentData,
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Site visit not found',
                ], 404);
            }

            Log::info('Processing payment for site visit', [
                'site_visit_id' => $siteVisit->id,
                'payment_status' => $paymentData['status'],
                'transaction_id' => $paymentData['transaction_id'],
            ]);

            // Update site visit payment status
            $oldStatus = $siteVisit->payment_status;
            $siteVisit->update([
                'payment_status' => $paymentData['status'],
                'payment_transaction_id' => $paymentData['transaction_id'],
            ]);

            Log::info('Site visit payment status updated', [
                'site_visit_id' => $siteVisit->id,
                'old_status' => $oldStatus,
                'new_status' => $paymentData['status'],
            ]);

            // If payment is successful, send notifications
            if ($paymentData['status'] === 'paid' && $oldStatus !== 'paid') {
                $this->sendPaymentSuccessNotifications($siteVisit);
            }

            return response()->json([
                'success' => true,
                'message' => 'Webhook processed successfully',
            ]);

        } catch (\Exception $e) {
            Log::error('Selcom webhook processing error', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Webhook processing failed',
            ], 500);
        }
    }

    /**
     * Send notifications when payment is successful
     */
    protected function sendPaymentSuccessNotifications(SiteVisit $siteVisit): void
    {
        try {
            // Create notifications for agent and landlord
            $notifications = [];

            // Notify agent
            if ($siteVisit->agent) {
                $notifications[] = [
                    'user_id' => $siteVisit->agent_id,
                    'type' => 'payment_received',
                    'title' => 'Payment Received for Site Visit',
                    'message' => "Payment received for site visit of {$siteVisit->property->title} on {$siteVisit->requested_date->format('M j, Y')}. You can now confirm the visit.",
                    'sent_via' => 'system',
                ];
            }

            // Notify landlord
            if ($siteVisit->landlord) {
                $notifications[] = [
                    'user_id' => $siteVisit->landlord_id,
                    'type' => 'payment_received',
                    'title' => 'Payment Received for Site Visit',
                    'message' => "Payment received for site visit of your property {$siteVisit->property->title} on {$siteVisit->requested_date->format('M j, Y')}.",
                    'sent_via' => 'system',
                ];
            }

            // Create notifications
            foreach ($notifications as $notification) {
                \App\Models\SiteVisitNotification::create(array_merge($notification, [
                    'site_visit_id' => $siteVisit->id,
                    'sent_at' => now(),
                    'is_read' => false,
                ]));
            }

            Log::info('Payment success notifications sent', [
                'site_visit_id' => $siteVisit->id,
                'notification_count' => count($notifications),
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to send payment success notifications', [
                'site_visit_id' => $siteVisit->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}

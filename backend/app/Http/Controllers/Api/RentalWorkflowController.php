<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\Tenant;
use App\Models\Payment;
use App\Models\Property;
use App\Services\RentalWorkflowService;
use App\Services\PaymentProcessingService;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class RentalWorkflowController extends Controller
{
    private $workflowService;
    private $paymentService;
    private $notificationService;

    public function __construct(
        RentalWorkflowService $workflowService,
        PaymentProcessingService $paymentService,
        NotificationService $notificationService
    ) {
        $this->workflowService = $workflowService;
        $this->paymentService = $paymentService;
        $this->notificationService = $notificationService;
    }

    /**
     * Create or get rental application (Step 1)
     */
    public function applyForProperty(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'property_id' => 'required|exists:properties,id',
            'message' => 'nullable|string|max:1000',
            'offered_rent' => 'nullable|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $user = Auth::user();
            $property = Property::findOrFail($request->property_id);

            // Check if already applied
            $existingApplication = Application::where('user_id', $user->id)
                ->where('property_id', $property->id)
                ->whereNotIn('status', ['withdrawn', 'rejected'])
                ->first();

            if ($existingApplication) {
                return response()->json([
                    'success' => false,
                    'message' => 'You have already applied for this property',
                    'data' => $existingApplication
                ], 409);
            }

            // Create application
            $application = $this->workflowService->createApplication(
                $user,
                $property,
                [
                    'message' => $request->message,
                    'offered_rent' => $request->offered_rent,
                ]
            );

            // Notify property owner
            $this->notificationService->notifyOwnerNewApplication($application);

            return response()->json([
                'success' => true,
                'message' => 'Application submitted successfully',
                'data' => $application->fresh()->load('property', 'user')
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Approve application (Step 2 - Owner action)
     */
    public function approveApplication(Request $request, Application $application): JsonResponse
    {
        try {
            $user = Auth::user();
            $property = $application->property;

            // Verify owner authorization
            if ($property->owner_id !== $user->id && $property->agent_id !== $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 403);
            }

            // Approve the application
            $this->workflowService->approveApplication($application);

            // Send notification to tenant
            $this->notificationService->sendApplicationApproved($application);

            return response()->json([
                'success' => true,
                'message' => 'Application approved successfully',
                'data' => $application->fresh()->load('user', 'property')
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reject application (Step 2 - Owner action)
     */
    public function rejectApplication(Request $request, Application $application): JsonResponse
    {
        try {
            $user = Auth::user();
            $property = $application->property;

            // Verify owner authorization
            if ($property->owner_id !== $user->id && $property->agent_id !== $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 403);
            }

            DB::transaction(function () use ($application, $request) {
                $application->update([
                    'status' => 'rejected',
                    'landlord_notes' => $request->get('reason', ''),
                    'responded_at' => now(),
                ]);

                // Send notification
                $this->notificationService->sendApplicationRejected($application);
            });

            return response()->json([
                'success' => true,
                'message' => 'Application rejected',
                'data' => $application->fresh()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Initiate first month rent payment (Step 3)
     */
    public function initiatePayment(Request $request, Application $application): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'phone_number' => 'required|string|min:9|max:13',
            'payment_method' => 'nullable|string',
            'service_charge' => 'nullable|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $user = Auth::user();

            // Verify user is the applicant
            if ($application->user_id !== $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 403);
            }

            // Application must be approved
            if ($application->status !== 'approved') {
                return response()->json([
                    'success' => false,
                    'message' => 'Application must be approved before paying'
                ], 422);
            }

            // Calculate total amount
            $totalAmount = $this->paymentService->calculateTotalDue($application);

            // Initiate payment
            $result = $this->paymentService->initiateMobileMoneyPayment(
                $application,
                $request->phone_number,
                $totalAmount,
                'first_month_rent'
            );

            if (!$result['success']) {
                return response()->json([
                    'success' => false,
                    'message' => $result['message']
                ], 400);
            }

            // Update application status
            $application->update([
                'payment_status' => 'initiated',
                'workflow_status' => 'payment_pending',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Payment initiated. Check your phone for payment prompt.',
                'data' => [
                    'payment_id' => $result['payment_id'],
                    'reference' => $result['reference'],
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Complete payment and activate contract (Step 4)
     */
    public function completePayment(Request $request, Application $application): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'reference' => 'required|string',
            'payment_method' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $user = Auth::user();

            // Verify user is the applicant
            if ($application->user_id !== $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 403);
            }

            return DB::transaction(function () use ($application, $request) {
                // Process payment through workflow service
                $payment = $this->workflowService->processFirstMonthPayment(
                    $application,
                    [
                        'reference' => $request->reference,
                        'payment_method' => $request->payment_method ?? 'selcom',
                        'service_charge' => $request->service_charge ?? 0,
                    ]
                );

                // Activate contract
                $contractData = [
                    'move_in_date' => $request->move_in_date ? now()->parse($request->move_in_date) : now(),
                    'end_date' => $request->end_date ? now()->parse($request->end_date) : now()->addYear(),
                    'terms' => $request->terms ?? null,
                ];

                $contract = $this->workflowService->activateContract($application, $contractData);
                $tenant = Tenant::where('user_id', $application->user_id)
                    ->where('property_id', $application->property_id)
                    ->first();

                // Send contract activated notification
                $this->notificationService->sendContractActivated($tenant);

                // Schedule next month's reminder
                $nextPayment = $this->workflowService->scheduleMonthlyReminder($tenant, $payment);

                return response()->json([
                    'success' => true,
                    'message' => 'Payment completed and contract activated successfully',
                    'data' => [
                        'payment' => $payment,
                        'contract' => $contract,
                        'tenant' => $tenant,
                        'next_payment' => $nextPayment,
                    ]
                ]);
            });
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get rental workflow status
     */
    public function getWorkflowStatus(Request $request, Property $property): JsonResponse
    {
        try {
            $user = Auth::user();
            $status = $this->workflowService->getWorkflowStatus($property, $user);

            return response()->json([
                'success' => true,
                'data' => $status
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get pending payments for tenant
     */
    public function getPendingPayments(): JsonResponse
    {
        try {
            $user = Auth::user();
            $payments = $this->paymentService->getPendingPayments($user->id);

            return response()->json([
                'success' => true,
                'data' => $payments
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Process monthly rent payment
     */
    public function payMonthlyRent(Request $request, Payment $payment): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'phone_number' => 'required|string|min:9|max:13',
            'payment_method' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $user = Auth::user();

            // Verify user is paying for their own tenant record
            $tenant = Tenant::find($payment->tenant_id);
            if (!$tenant || $tenant->user_id !== $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 403);
            }

            // Initiate payment
            $result = $this->paymentService->initiateMobileMoneyPayment(
                null, // Not from application
                $request->phone_number,
                $payment->amount,
                'monthly_rent'
            );

            if (!$result['success']) {
                return response()->json([
                    'success' => false,
                    'message' => $result['message']
                ], 400);
            }

            return response()->json([
                'success' => true,
                'message' => 'Payment initiated. Check your phone for payment prompt.',
                'data' => [
                    'payment_id' => $result['payment_id'],
                    'reference' => $result['reference'],
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get rental applications for property owner
     */
    public function getApplicationsForProperty(Property $property): JsonResponse
    {
        try {
            $user = Auth::user();

            // Verify user is the owner or agent
            if ($property->owner_id !== $user->id && $property->agent_id !== $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 403);
            }

            $applications = Application::where('property_id', $property->id)
                ->with('user', 'property')
                ->latest()
                ->get();

            return response()->json([
                'success' => true,
                'data' => $applications
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error: ' . $e->getMessage()
            ], 500);
        }
    }
}

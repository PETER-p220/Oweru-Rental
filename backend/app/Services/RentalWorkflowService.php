<?php

namespace App\Services;

use App\Models\Application;
use App\Models\Tenant;
use App\Models\Contract;
use App\Models\Payment;
use App\Models\Commission;
use App\Models\Notification;
use App\Models\Property;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class RentalWorkflowService
{
    /**
     * Step 1: Tenant applies for property
     */
    public function createApplication(User $tenant, Property $property, array $data): Application
    {
        return Application::create([
            'user_id' => $tenant->id,
            'property_id' => $property->id,
            'owner_id' => $property->owner_id,
            'status' => 'pending',
            'message' => $data['message'] ?? null,
            'offered_rent' => $data['offered_rent'] ?? $property->price,
            'service_fee' => $data['service_fee'] ?? null,
            'applied_at' => now(),
        ]);
    }

    /**
     * Step 2: Owner/Dalali approves application
     */
    public function approveApplication(Application $application): bool
    {
        return DB::transaction(function () use ($application) {
            // Update application status
            $application->update([
                'status' => 'approved',
                'responded_at' => now(),
            ]);

            // Send notification to tenant
            $this->notifyTenant(
                $application->user_id,
                'Application Approved',
                "Your application for {$application->property->title} has been approved! Please proceed with payment."
            );

            return true;
        });
    }

    /**
     * Step 3: Process first month rent payment
     */
    public function processFirstMonthPayment(
        Application $application,
        array $paymentData
    ): Payment {
        return DB::transaction(function () use ($application, $paymentData) {
            $property = $application->property;
            $rentAmount = $application->offered_rent ?? $property->price;
            $serviceCharge = $paymentData['service_charge'] ?? 0;
            $totalAmount = $rentAmount + $serviceCharge;

            // Create payment record
            $payment = Payment::create([
                'user_id' => $application->user_id,
                'property_id' => $property->id,
                'agent_id' => $property->agent_id,
                'type' => 'first_month_rent',
                'amount' => $totalAmount,
                'status' => 'completed',
                'reference' => $paymentData['reference'] ?? 'RENT-' . uniqid(),
                'description' => "First month rent - {$property->title}",
                'paid_at' => now(),
                'metadata' => [
                    'rent_amount' => $rentAmount,
                    'service_charge' => $serviceCharge,
                    'payment_method' => $paymentData['payment_method'] ?? 'selcom',
                ],
            ]);

            // Update application payment status
            $application->update([
                'payment_status' => 'completed',
                'transaction_id' => $paymentData['reference'] ?? $payment->id,
            ]);

            // Allocate commissions if there's an agent
            if ($property->agent_id) {
                $this->allocateCommission($payment);
            }

            return $payment;
        });
    }

    /**
     * Step 4: Allocate commissions to agent
     */
    public function allocateCommission(Payment $payment, float $commissionPercentage = 10): Commission
    {
        if (!$payment->agent_id) {
            throw new \Exception('No agent associated with this payment');
        }

        $commissionAmount = ($payment->amount * $commissionPercentage) / 100;

        return Commission::create([
            'agent_id' => $payment->agent_id,
            'property_id' => $payment->property_id,
            'payment_id' => $payment->id,
            'amount' => $commissionAmount,
            'percentage' => $commissionPercentage,
            'status' => 'pending',
        ]);
    }

    /**
     * Step 5: Activate contract
     */
    public function activateContract(
        Application $application,
        array $contractData
    ): Contract {
        return DB::transaction(function () use ($application, $contractData) {
            $property = $application->property;
            $rentAmount = $application->offered_rent ?? $property->price;

            // Create tenant record
            $tenant = Tenant::firstOrCreate(
                [
                    'user_id' => $application->user_id,
                    'property_id' => $property->id,
                ],
                [
                    'move_in_date' => $contractData['move_in_date'] ?? now(),
                    'status' => 'active',
                ]
            );

            // Create contract
            $contract = Contract::create([
                'tenant_id' => $tenant->id,
                'property_id' => $property->id,
                'start_date' => $contractData['move_in_date'] ?? now(),
                'end_date' => $contractData['end_date'] ?? now()->addYear(),
                'rent_amount' => $rentAmount,
                'terms' => $contractData['terms'] ?? 'Standard rental terms',
                'status' => 'active',
            ]);

            // Update property availability
            $property->update(['available' => false]);

            // Update application status
            $application->update(['status' => 'contract_active']);

            // Send notification to tenant
            $this->notifyTenant(
                $application->user_id,
                'Contract Activated',
                "Your rental contract for {$property->title} is now active. Your lease starts from " . ($contractData['move_in_date'] ?? now())->format('d M Y')
            );

            return $contract;
        });
    }

    /**
     * Schedule monthly rent payment reminder
     */
    public function scheduleMonthlyReminder(Tenant $tenant, Payment $lastPayment): Payment
    {
        $nextPaymentDue = $lastPayment->due_date
            ? $lastPayment->due_date->addMonth()
            : now()->addMonth();

        return Payment::create([
            'user_id' => $tenant->user_id,
            'tenant_id' => $tenant->id,
            'property_id' => $tenant->property_id,
            'agent_id' => $tenant->property->agent_id,
            'type' => 'monthly_rent',
            'amount' => $lastPayment->metadata['rent_amount'] ?? $tenant->property->price,
            'status' => 'pending',
            'description' => "Monthly rent - {$tenant->property->title}",
            'due_date' => $nextPaymentDue,
            'metadata' => [
                'rent_amount' => $lastPayment->metadata['rent_amount'] ?? $tenant->property->price,
                'service_charge' => $lastPayment->metadata['service_charge'] ?? 0,
                'month' => $nextPaymentDue->format('Y-m'),
            ],
        ]);
    }

    /**
     * Send monthly rent reminder notification
     */
    public function sendMonthlyReminder(Tenant $tenant, Payment $payment): void
    {
        $daysUntilDue = now()->diffInDays($payment->due_date, false);

        $message = "Your monthly rent of Tsh " . number_format($payment->amount) . 
                   " for {$tenant->property->title} is due on " . 
                   $payment->due_date->format('d M Y');

        if ($daysUntilDue <= 3 && $daysUntilDue > 0) {
            $message = "⏰ Reminder: " . $message;
        } elseif ($daysUntilDue <= 0) {
            $message = "⚠️ Overdue: " . $message;
        }

        $this->notifyTenant($tenant->user_id, 'Monthly Rent Reminder', $message);
    }

    /**
     * Process service charge payment
     */
    public function processServiceChargePayment(Tenant $tenant, array $paymentData): Payment
    {
        return DB::transaction(function () use ($tenant, $paymentData) {
            $serviceCharge = $paymentData['service_charge'] ?? 0;

            $payment = Payment::create([
                'user_id' => $tenant->user_id,
                'tenant_id' => $tenant->id,
                'property_id' => $tenant->property_id,
                'agent_id' => $tenant->property->agent_id,
                'type' => 'service_charge',
                'amount' => $serviceCharge,
                'status' => 'completed',
                'reference' => $paymentData['reference'] ?? 'SC-' . uniqid(),
                'description' => "Service charge - {$tenant->property->title}",
                'paid_at' => now(),
                'metadata' => [
                    'service_charge' => $serviceCharge,
                    'payment_method' => $paymentData['payment_method'] ?? 'selcom',
                ],
            ]);

            // Send confirmation notification
            $this->notifyTenant(
                $tenant->user_id,
                'Service Charge Payment Confirmed',
                "Your service charge payment of Tsh " . number_format($serviceCharge) . " has been received."
            );

            return $payment;
        });
    }

    /**
     * Process monthly rent payment
     */
    public function processMonthlyPayment(Tenant $tenant, Payment $payment, array $paymentData): Payment
    {
        return DB::transaction(function () use ($tenant, $payment, $paymentData) {
            // Update existing payment record
            $payment->update([
                'status' => 'completed',
                'reference' => $paymentData['reference'] ?? $payment->id,
                'paid_at' => now(),
                'metadata' => array_merge($payment->metadata ?? [], [
                    'payment_method' => $paymentData['payment_method'] ?? 'selcom',
                ]),
            ]);

            // Schedule next month's reminder
            $this->scheduleMonthlyReminder($tenant, $payment);

            // Send confirmation notification
            $this->notifyTenant(
                $tenant->user_id,
                'Rent Payment Confirmed',
                "Your monthly rent payment of Tsh " . number_format($payment->amount) . " for {$tenant->property->title} has been received."
            );

            return $payment;
        });
    }

    /**
     * Send notification to tenant
     */
    protected function notifyTenant(int $userId, string $title, string $message): Notification
    {
        return Notification::create([
            'user_id' => $userId,
            'title' => $title,
            'message' => $message,
            'type' => 'rental_workflow',
        ]);
    }

    /**
     * Get rental workflow status
     */
    public function getWorkflowStatus(Property $property, User $tenant): array
    {
        $application = Application::where('property_id', $property->id)
            ->where('user_id', $tenant->id)
            ->first();

        if (!$application) {
            return [
                'status' => 'not_applied',
                'stage' => 0,
            ];
        }

        $tenant_record = Tenant::where('property_id', $property->id)
            ->where('user_id', $tenant->id)
            ->first();

        return [
            'status' => $application->status,
            'stage' => $this->getWorkflowStage($application),
            'application' => $application,
            'tenant' => $tenant_record,
            'payments' => Payment::where('user_id', $tenant->id)
                ->where('property_id', $property->id)
                ->orderBy('created_at', 'desc')
                ->get(),
        ];
    }

    /**
     * Get workflow stage number
     */
    protected function getWorkflowStage(Application $application): int
    {
        return match ($application->status) {
            'pending' => 1,
            'approved' => 2,
            'payment_pending' => 3,
            'payment_completed', 'contract_active' => 5,
            'rejected' => 0,
            default => 0,
        };
    }
}

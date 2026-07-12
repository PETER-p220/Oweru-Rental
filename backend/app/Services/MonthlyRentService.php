<?php

namespace App\Services;

use App\Models\Application;
use App\Models\Payment;
use App\Models\Property;
use App\Models\Tenant;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

class MonthlyRentService
{
    /**
     * Ensure a Tenant row exists for ongoing rent scheduling.
     */
    public function ensureTenant(User $user, Property $property): ?Tenant
    {
        if (! Schema::hasTable('tenants')) {
            return null;
        }

        return Tenant::firstOrCreate(
            [
                'user_id' => $user->id,
                'property_id' => $property->id,
            ],
            [
                'move_in_date' => now()->toDateString(),
                'status' => 'active',
            ]
        );
    }

    /**
     * After first-month or monthly rent is paid, queue the next month if missing.
     */
    public function scheduleNextAfterPayment(Payment $payment): ?Payment
    {
        if (! Schema::hasTable('payments')) {
            return null;
        }

        $payment->loadMissing('property', 'user');
        $property = $payment->property;
        $user = $payment->user;

        if (! $property || ! $user) {
            return null;
        }

        if (! in_array($payment->type, ['first_month_rent', 'monthly_rent', 'rent', 'rent_payment'], true)) {
            return null;
        }

        if (! in_array($payment->status, ['completed', 'paid'], true)) {
            return null;
        }

        return $this->ensureUpcomingForProperty($user, $property, $payment);
    }

    /**
     * After application first-month rent is confirmed.
     */
    public function scheduleAfterApplicationRent(Application $application): ?Payment
    {
        $application->loadMissing('property', 'user');
        $property = $application->property;
        $user = $application->user;

        if (! $property || ! $user || ! Schema::hasTable('payments')) {
            return null;
        }

        $last = Payment::where('user_id', $user->id)
            ->where('property_id', $property->id)
            ->whereIn('type', ['first_month_rent', 'monthly_rent', 'rent', 'rent_payment'])
            ->whereIn('status', ['completed', 'paid'])
            ->orderByRaw('COALESCE(paid_at, created_at) DESC')
            ->first();

        return $this->ensureUpcomingForProperty($user, $property, $last);
    }

    /**
     * For tenants who already paid rent but have no pending next month.
     */
    public function ensureUpcomingForUser(User $user): void
    {
        if (! Schema::hasTable('payments')) {
            return;
        }

        $propertyIds = Payment::where('user_id', $user->id)
            ->whereIn('type', ['first_month_rent', 'monthly_rent', 'rent', 'rent_payment'])
            ->whereIn('status', ['completed', 'paid'])
            ->pluck('property_id')
            ->unique()
            ->filter();

        // Also include applications with rent paid.
        if (Schema::hasTable('applications')) {
            $fromApps = Application::where('user_id', $user->id)
                ->where('rent_payment_status', 'paid')
                ->pluck('property_id');
            $propertyIds = $propertyIds->merge($fromApps)->unique()->filter();
        }

        foreach ($propertyIds as $propertyId) {
            $property = Property::find($propertyId);
            if (! $property) {
                continue;
            }

            $last = Payment::where('user_id', $user->id)
                ->where('property_id', $property->id)
                ->whereIn('type', ['first_month_rent', 'monthly_rent', 'rent', 'rent_payment'])
                ->whereIn('status', ['completed', 'paid'])
                ->orderByRaw('COALESCE(paid_at, created_at) DESC')
                ->first();

            $this->ensureUpcomingForProperty($user, $property, $last);
        }
    }

    /**
     * Create a pending payment covering one or more months (tenant chooses).
     *
     * @return array{success:bool,message?:string,payment?:Payment}
     */
    public function createAdditionalMonthsPayment(User $user, int $propertyId, int $months): array
    {
        if (! Schema::hasTable('payments')) {
            return ['success' => false, 'message' => 'Payments are unavailable.'];
        }

        $months = max(1, min(12, $months));
        $property = Property::find($propertyId);

        if (! $property) {
            return ['success' => false, 'message' => 'Property not found.'];
        }

        $eligible = Payment::where('user_id', $user->id)
            ->where('property_id', $propertyId)
            ->whereIn('type', ['first_month_rent', 'monthly_rent', 'rent', 'rent_payment'])
            ->whereIn('status', ['completed', 'paid'])
            ->exists();

        if (! $eligible && Schema::hasTable('applications')) {
            $eligible = Application::where('user_id', $user->id)
                ->where('property_id', $propertyId)
                ->where('rent_payment_status', 'paid')
                ->exists();
        }

        if (! $eligible) {
            return [
                'success' => false,
                'message' => 'Pay the first month rent from your application before adding more months.',
            ];
        }

        // If there is already a pending/processing rent for this property, reuse it
        // when months=1; otherwise replace amount for multi-month top-up.
        $existing = Payment::where('user_id', $user->id)
            ->where('property_id', $propertyId)
            ->whereIn('type', ['monthly_rent', 'rent', 'rent_payment'])
            ->whereIn('status', ['pending', 'failed'])
            ->orderByDesc('id')
            ->first();

        $monthlyAmount = $this->resolveMonthlyAmount($user, $property);
        if ($monthlyAmount <= 0) {
            return ['success' => false, 'message' => 'Unable to determine monthly rent amount.'];
        }

        $total = $monthlyAmount * $months;
        $dueDate = $this->nextDueDate($user, $property);
        $tenant = $this->ensureTenant($user, $property);

        $description = $months === 1
            ? 'Monthly rent — ' . ($property->title ?? 'Property') . ' (' . $dueDate->format('M Y') . ')'
            : "{$months} months rent — " . ($property->title ?? 'Property');

        $metadata = [
            'rent_amount' => $monthlyAmount,
            'months' => $months,
            'month' => $dueDate->format('Y-m'),
            'covers_through' => $dueDate->copy()->addMonths($months - 1)->format('Y-m'),
            'source' => 'tenant_additional_months',
        ];

        if ($existing) {
            $existing->update([
                'amount' => $total,
                'status' => 'pending',
                'due_date' => $dueDate,
                'description' => $description,
                'tenant_id' => $tenant?->id ?? $existing->tenant_id,
                'agent_id' => $property->agent_id,
                'metadata' => array_merge($existing->metadata ?? [], $metadata),
            ]);

            return ['success' => true, 'payment' => $existing->fresh(['property'])];
        }

        $payment = Payment::create([
            'user_id' => $user->id,
            'tenant_id' => $tenant?->id,
            'property_id' => $property->id,
            'agent_id' => $property->agent_id,
            'type' => 'monthly_rent',
            'amount' => $total,
            'status' => 'pending',
            'description' => $description,
            'due_date' => $dueDate,
            'metadata' => $metadata,
        ]);

        return ['success' => true, 'payment' => $payment->load('property')];
    }

    public function ensureUpcomingForProperty(User $user, Property $property, ?Payment $lastPayment = null): ?Payment
    {
        $pendingExists = Payment::where('user_id', $user->id)
            ->where('property_id', $property->id)
            ->whereIn('type', ['monthly_rent', 'rent', 'rent_payment'])
            ->whereIn('status', ['pending', 'processing', 'failed'])
            ->exists();

        if ($pendingExists) {
            return Payment::where('user_id', $user->id)
                ->where('property_id', $property->id)
                ->whereIn('type', ['monthly_rent', 'rent', 'rent_payment'])
                ->whereIn('status', ['pending', 'processing', 'failed'])
                ->orderByDesc('id')
                ->first();
        }

        $monthlyAmount = $this->resolveMonthlyAmount($user, $property, $lastPayment);
        if ($monthlyAmount <= 0) {
            Log::warning('Skipped monthly rent schedule — zero amount', [
                'user_id' => $user->id,
                'property_id' => $property->id,
            ]);

            return null;
        }

        $dueDate = $this->nextDueDate($user, $property, $lastPayment);
        $tenant = $this->ensureTenant($user, $property);

        return Payment::create([
            'user_id' => $user->id,
            'tenant_id' => $tenant?->id,
            'property_id' => $property->id,
            'agent_id' => $property->agent_id,
            'type' => 'monthly_rent',
            'amount' => $monthlyAmount,
            'status' => 'pending',
            'description' => 'Monthly rent — ' . ($property->title ?? 'Property') . ' (' . $dueDate->format('M Y') . ')',
            'due_date' => $dueDate,
            'metadata' => [
                'rent_amount' => $monthlyAmount,
                'months' => 1,
                'month' => $dueDate->format('Y-m'),
                'source' => 'monthly_rent_scheduler',
            ],
        ]);
    }

    private function resolveMonthlyAmount(User $user, Property $property, ?Payment $lastPayment = null): float
    {
        if ($lastPayment) {
            $fromMeta = (float) ($lastPayment->metadata['rent_amount'] ?? 0);
            if ($fromMeta > 0) {
                return $fromMeta;
            }
            $months = max(1, (int) ($lastPayment->metadata['months'] ?? 1));
            $perMonth = (float) $lastPayment->amount / $months;
            if ($perMonth > 0) {
                return $perMonth;
            }
        }

        if (Schema::hasTable('applications')) {
            $app = Application::where('user_id', $user->id)
                ->where('property_id', $property->id)
                ->orderByDesc('id')
                ->first();
            if ($app && (float) ($app->offered_rent ?? 0) > 0) {
                return (float) $app->offered_rent;
            }
            if ($app && (float) ($app->amount_paid ?? 0) > 0) {
                return (float) $app->amount_paid;
            }
        }

        return (float) ($property->price ?? 0);
    }

    private function nextDueDate(User $user, Property $property, ?Payment $lastPayment = null): Carbon
    {
        $monthsCovered = max(1, (int) ($lastPayment?->metadata['months'] ?? 1));

        if ($lastPayment?->due_date) {
            return Carbon::parse($lastPayment->due_date)->copy()->addMonths($monthsCovered)->startOfDay();
        }

        if ($lastPayment?->paid_at) {
            return Carbon::parse($lastPayment->paid_at)->copy()->addMonths($monthsCovered)->startOfDay();
        }

        $lastCompleted = Payment::where('user_id', $user->id)
            ->where('property_id', $property->id)
            ->whereIn('type', ['first_month_rent', 'monthly_rent', 'rent', 'rent_payment'])
            ->whereIn('status', ['completed', 'paid'])
            ->orderByRaw('COALESCE(paid_at, created_at) DESC')
            ->first();

        $covered = max(1, (int) ($lastCompleted?->metadata['months'] ?? 1));

        if ($lastCompleted?->due_date) {
            return Carbon::parse($lastCompleted->due_date)->copy()->addMonths($covered)->startOfDay();
        }

        if ($lastCompleted?->paid_at) {
            return Carbon::parse($lastCompleted->paid_at)->copy()->addMonths($covered)->startOfDay();
        }

        return now()->addMonth()->startOfDay();
    }
}

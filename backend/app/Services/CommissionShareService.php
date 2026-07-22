<?php

namespace App\Services;

use App\Models\Payment;

class CommissionShareService
{
    public const RENT_TYPES = ['first_month_rent', 'monthly_rent', 'rent', 'rent_payment'];

    /**
     * Agent share as a fraction of gross (0–1), or null when no agent split applies.
     */
    public function agentShareRate(Payment $payment): ?float
    {
        if ($payment->type === 'site_visit') {
            if (! $payment->agent_id) {
                return null;
            }

            return (float) config('services.site_visit.agent_share', 0.5);
        }

        if (in_array($payment->type, self::RENT_TYPES, true) && $payment->agent_id) {
            return (float) config('services.rent_fees.agent_recipient_share', 0.70);
        }

        return null;
    }

    public function oweruShareRate(Payment $payment): float
    {
        if ($payment->type === 'site_visit') {
            return (float) config('services.site_visit.oweru_share', 0.5);
        }

        if (in_array($payment->type, self::RENT_TYPES, true) && $payment->agent_id) {
            return (float) config('services.rent_fees.agent_oweru_share', 0.30);
        }

        return 1.0;
    }

    /**
     * @return array{gross:float,agent:float,oweru:float,agent_rate:float,oweru_rate:float}
     */
    public function splitAmounts(Payment $payment): array
    {
        $gross = (float) $payment->amount;
        $agentRate = $this->agentShareRate($payment);
        $oweruRate = $this->oweruShareRate($payment);

        if ($agentRate !== null) {
            $agent = round($gross * $agentRate, 2);
            $oweru = round($gross * $oweruRate, 2);

            return [
                'gross' => $gross,
                'agent' => $agent,
                'oweru' => $oweru,
                'agent_rate' => $agentRate,
                'oweru_rate' => $oweruRate,
            ];
        }

        return [
            'gross' => $gross,
            'agent' => 0.0,
            'oweru' => $gross,
            'agent_rate' => 0.0,
            'oweru_rate' => 1.0,
        ];
    }

    public function agentCommissionPercentage(Payment $payment): ?float
    {
        $rate = $this->agentShareRate($payment);

        return $rate !== null ? round($rate * 100, 2) : null;
    }

    public function categoryKey(Payment $payment): string
    {
        if ($payment->type === 'site_visit') {
            return 'site_visit';
        }

        if (in_array($payment->type, self::RENT_TYPES, true)) {
            return 'rental';
        }

        return 'other';
    }
}

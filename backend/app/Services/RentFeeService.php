<?php

namespace App\Services;

use App\Models\Application;
use App\Models\Property;

class RentFeeService
{
    public function getMonthlyRent(Application $application): float
    {
        $application->loadMissing('property');

        return (float) ($application->offered_rent ?? $application->property?->price ?? 0);
    }

    public function isAgentProperty(?Property $property): bool
    {
        return (bool) $property?->agent_id;
    }

    /**
     * First-month rent fee breakdown for tenant payment and payout splitting.
     *
     * Agent listings: tenant pays 1 month rent — 70% to agent, 30% to Oweru.
     * Landlord/commercial listings: tenant pays full monthly rent to owner (unchanged)
     *   plus a separate Oweru initial platform fee equal to 1 month rent (Tanzania agency model).
     *
     * @return array{
     *   listing_type: string,
     *   monthly_rent: float,
     *   tenant_rent_to_landlord: float,
     *   oweru_initial_fee: float,
     *   oweru_fee: float,
     *   recipient_amount: float,
     *   total_charge: float,
     *   recipient_type: string,
     *   oweru_share_percent?: float,
     *   recipient_share_percent?: float
     * }
     */
    public function calculateFirstMonthFees(Application $application): array
    {
        $application->loadMissing('property');
        $property = $application->property;
        $monthlyRent = $this->getMonthlyRent($application);
        $paymentMonths = $property ? $property->getPaymentDurationMonths() : 1;
        $periodRent = round($monthlyRent * $paymentMonths, 2);

        $agentShare = (float) config('services.rent_fees.agent_recipient_share', 0.70);
        $oweruShare = (float) config('services.rent_fees.agent_oweru_share', 0.30);
        $landlordFeeMonths = (float) config('services.rent_fees.landlord_oweru_fee_months', 1);

        if ($property && $this->isAgentProperty($property)) {
            return [
                'listing_type' => 'agent',
                'monthly_rent' => $monthlyRent,
                'payment_duration_months' => $paymentMonths,
                'period_rent' => $periodRent,
                'tenant_rent_to_landlord' => 0,
                'oweru_initial_fee' => round($periodRent * $oweruShare, 2),
                'oweru_fee' => round($periodRent * $oweruShare, 2),
                'recipient_amount' => round($periodRent * $agentShare, 2),
                'total_charge' => $periodRent,
                'recipient_type' => 'agent',
                'oweru_share_percent' => $oweruShare * 100,
                'recipient_share_percent' => $agentShare * 100,
            ];
        }

        $oweruInitialFee = round($monthlyRent * $landlordFeeMonths, 2);

        return [
            'listing_type' => 'owner',
            'monthly_rent' => $monthlyRent,
            'payment_duration_months' => $paymentMonths,
            'period_rent' => $periodRent,
            'tenant_rent_to_landlord' => $periodRent,
            'oweru_initial_fee' => $oweruInitialFee,
            'oweru_fee' => $oweruInitialFee,
            'recipient_amount' => $periodRent,
            'total_charge' => round($periodRent + $oweruInitialFee, 2),
            'recipient_type' => 'landlord',
        ];
    }
}

<?php

namespace App\Console\Commands;

use App\Services\BnbPaymentService;
use Illuminate\Console\Command;

class CancelUnpaidBnbBookings extends Command
{
    protected $signature = 'bnb:cancel-unpaid-bookings';

    protected $description = 'Cancel BnB bookings that were not paid before the payment deadline';

    public function __construct(private BnbPaymentService $bnbPayments)
    {
        parent::__construct();
    }

    public function handle(): int
    {
        $count = $this->bnbPayments->cancelExpiredUnpaidBookings();
        $this->info("Cancelled {$count} unpaid BnB booking(s) past payment deadline.");

        return 0;
    }
}

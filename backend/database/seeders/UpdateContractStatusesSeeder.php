<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class UpdateContractStatusesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        // Update all draft contracts to pending_signature
        $updated = DB::table('digital_contracts')
            ->where('status', 'draft')
            ->update(['status' => 'pending_signature']);

        $this->command->info("Updated {$updated} contracts from 'draft' to 'pending_signature'");
    }
}

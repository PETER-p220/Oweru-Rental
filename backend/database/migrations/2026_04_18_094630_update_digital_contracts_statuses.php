<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void        
    {
        // Update all draft contracts to pending_signature
        $updated = DB::table('digital_contracts')
            ->where('status', 'draft')
            ->update(['status' => 'pending_signature']);

        echo "Updated {$updated} contracts from 'draft' to 'pending_signature'\n";
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Reverse: update pending_signature contracts back to draft
        $updated = DB::table('digital_contracts')
            ->where('status', 'pending_signature')
            ->update(['status' => 'draft']);

        echo "Reverted {$updated} contracts from 'pending_signature' to 'draft'\n";
    }
};

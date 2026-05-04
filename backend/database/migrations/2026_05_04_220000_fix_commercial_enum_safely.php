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
        // First, check if there are any problematic user_type values
        $problematicUsers = DB::table('users')
            ->whereNotIn('user_type', ['tenant', 'landlord', 'agent', 'admin'])
            ->count();
            
        if ($problematicUsers > 0) {
            // If there are problematic values, update them to 'tenant' temporarily
            DB::table('users')
                ->whereNotIn('user_type', ['tenant', 'landlord', 'agent', 'admin'])
                ->update(['user_type' => 'tenant']);
        }
        
        // Now safely alter the enum
        DB::statement("ALTER TABLE users MODIFY COLUMN user_type ENUM('tenant', 'landlord', 'agent', 'admin', 'commercial') NOT NULL DEFAULT 'tenant'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Convert back to original enum
        DB::statement("ALTER TABLE users MODIFY COLUMN user_type ENUM('tenant', 'landlord', 'agent', 'admin') NOT NULL DEFAULT 'tenant'");
    }
};

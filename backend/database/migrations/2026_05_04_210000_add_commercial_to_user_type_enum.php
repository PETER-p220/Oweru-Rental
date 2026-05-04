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
        // Check if column exists and get current data
        if (Schema::hasColumn('users', 'user_type')) {
            // First convert to varchar to allow any value
            DB::statement("ALTER TABLE users MODIFY COLUMN user_type VARCHAR(20)");
            
            // Now safely change to enum with commercial included
            DB::statement("ALTER TABLE users MODIFY COLUMN user_type ENUM('tenant', 'landlord', 'agent', 'admin', 'commercial') NOT NULL DEFAULT 'tenant'");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Convert back to original enum without commercial
        DB::statement("ALTER TABLE users MODIFY COLUMN user_type ENUM('tenant', 'landlord', 'agent', 'admin') NOT NULL DEFAULT 'tenant'");
    }
};

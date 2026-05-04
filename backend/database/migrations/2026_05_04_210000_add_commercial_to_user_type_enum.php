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
        // First, update any existing users that might have invalid user_type values
        DB::statement("ALTER TABLE users MODIFY COLUMN user_type VARCHAR(20) DEFAULT 'tenant'");
        
        // Now change to enum with commercial included
        Schema::table('users', function (Blueprint $table) {
            $table->enum('user_type', ['tenant', 'landlord', 'agent', 'admin', 'commercial'])->default('tenant')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // First convert back to varchar
        DB::statement("ALTER TABLE users MODIFY COLUMN user_type VARCHAR(20) DEFAULT 'tenant'");
        
        // Then change to original enum
        Schema::table('users', function (Blueprint $table) {
            $table->enum('user_type', ['tenant', 'landlord', 'agent', 'admin'])->default('tenant')->change();
        });
    }
};

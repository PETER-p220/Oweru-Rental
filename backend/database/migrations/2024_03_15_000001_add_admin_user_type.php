<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Drop the existing enum column
            $table->dropColumn('user_type');
        });

        Schema::table('users', function (Blueprint $table) {
            // Add the enum with admin included
            $table->enum('user_type', ['tenant', 'landlord', 'agent', 'admin'])->default('tenant')->after('phone');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Drop the enum with admin
            $table->dropColumn('user_type');
        });

        Schema::table('users', function (Blueprint $table) {
            // Add back the original enum without admin
            $table->enum('user_type', ['tenant', 'landlord', 'agent'])->default('tenant')->after('phone');
        });
    }
};

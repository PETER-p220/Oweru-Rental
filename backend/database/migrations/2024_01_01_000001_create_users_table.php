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
            // Add new columns to existing users table
            $table->string('first_name')->after('id');
            $table->string('last_name')->after('first_name');
            $table->string('phone')->nullable()->after('email');
            $table->enum('user_type', ['tenant', 'landlord', 'agent'])->default('tenant')->after('phone');
            $table->string('profile_image')->nullable()->after('user_type');
            $table->text('bio')->nullable()->after('profile_image');
            $table->boolean('is_active')->default(true)->after('bio');
            
            // Drop the old name column if it exists
            if (Schema::hasColumn('users', 'name')) {
                $table->dropColumn('name');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'first_name',
                'last_name', 
                'phone',
                'user_type',
                'profile_image',
                'bio',
                'is_active'
            ]);
            
            // Add back the name column
            $table->string('name')->after('id');
        });
    }
};

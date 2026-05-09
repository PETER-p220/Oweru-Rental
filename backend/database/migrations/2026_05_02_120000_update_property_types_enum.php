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
        Schema::table('properties', function (Blueprint $table) {
            // Drop the existing enum column
            $table->dropColumn('type');
        });
        
        Schema::table('properties', function (Blueprint $table) {
            // Add the enum column with new values
            $table->enum('type', ['house', 'Master-bedroom', 'Single-room', 'oweru_rental', 'residential', 'apartment', 'office', 'retail', 'warehouse', 'commercial', 'industrial'])->after('address');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('properties', function (Blueprint $table) {
            // Drop the new enum column
            $table->dropColumn('type');
        });
        
        Schema::table('properties', function (Blueprint $table) {
            // Restore the original enum column
            $table->enum('type', ['house', 'Master-bedroom', 'Single-room', 'oweru_rental', 'residential', 'apartment', 'office', 'retail', 'warehouse', 'commercial', 'industrial'])->after('address');
        });
    }
};

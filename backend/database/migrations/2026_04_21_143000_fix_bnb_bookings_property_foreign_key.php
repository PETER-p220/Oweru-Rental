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
        // Drop existing foreign key constraint
        Schema::table('bnb_bookings', function (Blueprint $table) {
            $table->dropForeign(['property_id']);
        });
        
        // Add correct foreign key constraint to properties table
        Schema::table('bnb_bookings', function (Blueprint $table) {
            $table->foreignId('property_id')->constrained('properties')->onDelete('cascade')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop the corrected foreign key
        Schema::table('bnb_bookings', function (Blueprint $table) {
            $table->dropForeign(['property_id']);
        });
        
        // Restore the original incorrect foreign key
        Schema::table('bnb_bookings', function (Blueprint $table) {
            $table->foreignId('property_id')->constrained('bnb_properties')->onDelete('cascade')->change();
        });
    }
};

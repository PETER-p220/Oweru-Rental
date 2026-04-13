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
        // Modify the enum column to include 'oweru_rental'
        DB::statement("ALTER TABLE properties MODIFY COLUMN type ENUM('apartment', 'house', 'studio', 'villa', 'commercial', 'oweru_rental') NOT NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert the enum column to original values
        DB::statement("ALTER TABLE properties MODIFY COLUMN type ENUM('apartment', 'house', 'studio', 'villa', 'commercial') NOT NULL");
    }
};

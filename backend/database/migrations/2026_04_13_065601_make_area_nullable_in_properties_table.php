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
        // Make the area column nullable
        DB::statement("ALTER TABLE properties MODIFY COLUMN area DECIMAL(8,2) NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert the area column to not nullable
        DB::statement("ALTER TABLE properties MODIFY COLUMN area DECIMAL(8,2) NOT NULL");
    }
};

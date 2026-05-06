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
    public function up()
    {
        // First, update any existing data that might have incompatible values
        DB::statement("UPDATE properties SET type = 'commercial' WHERE type NOT IN ('residential','apartment','office','retail','warehouse','commercial','industrial')");
        
        // Now safely alter the enum
        DB::statement("ALTER TABLE `properties` MODIFY COLUMN `type` 
            ENUM('residential','apartment','office','retail','warehouse','commercial','industrial') 
            CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'residential'");
    }

    /**
     * Reverse the migrations.
     */
    public function down()
    {
        // Revert to original enum values
        DB::statement("ALTER TABLE `properties` MODIFY COLUMN `type` 
            ENUM('residential','apartment') 
            CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'residential'");
    }
};

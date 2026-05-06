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
        // Update the enum to include all property types used in seeders
        DB::statement("ALTER TABLE `properties` MODIFY COLUMN `type` 
            ENUM('residential','apartment','house','studio','villa','office','retail','warehouse','commercial','industrial') 
            CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'residential'");
    }

    /**
     * Reverse the migrations.
     */
    public function down()
    {
        // Revert to previous state
        DB::statement("ALTER TABLE `properties` MODIFY COLUMN `type` 
            ENUM('residential','apartment','office','retail','warehouse','commercial','industrial') 
            CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'residential'");
    }
};

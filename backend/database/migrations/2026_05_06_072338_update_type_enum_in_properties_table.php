<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        DB::statement("ALTER TABLE `properties` CHANGE `type` `type` 
            ENUM('residential','apartment','office','retail','warehouse','commercial','industrial') 
            CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'residential'");
    }

    public function down()
    {
        DB::statement("ALTER TABLE `properties` CHANGE `type` `type` 
            ENUM('residential','apartment') 
            CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'residential'");
    }
};

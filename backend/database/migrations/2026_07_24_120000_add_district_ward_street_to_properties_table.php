<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('properties', function (Blueprint $table) {
            $table->string('district', 255)->nullable()->after('address');
            $table->string('ward', 255)->nullable()->after('district');
            $table->string('street', 255)->nullable()->after('ward');
        });
    }

    public function down(): void
    {
        Schema::table('properties', function (Blueprint $table) {
            $table->dropColumn(['district', 'ward', 'street']);
        });
    }
};

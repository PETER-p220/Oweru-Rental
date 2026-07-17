<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('properties', 'price_type')) {
            Schema::table('properties', function (Blueprint $table) {
                $table->string('price_type')->default('monthly')->after('price');
            });
        }

        if (! Schema::hasColumn('properties', 'payment_duration_months')) {
            Schema::table('properties', function (Blueprint $table) {
                $after = Schema::hasColumn('properties', 'price_type') ? 'price_type' : 'price';

                $table->unsignedTinyInteger('payment_duration_months')
                    ->default(1)
                    ->after($after);
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('properties', 'payment_duration_months')) {
            Schema::table('properties', function (Blueprint $table) {
                $table->dropColumn('payment_duration_months');
            });
        }
    }
};

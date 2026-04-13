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
        Schema::table('applications', function (Blueprint $table) {
            //
              Schema::table('applications', function (Blueprint $table) {
        $table->string('payment_status')->nullable()->after('status');
        $table->string('payment_method')->nullable()->after('payment_status');
        $table->string('transaction_id')->nullable()->after('payment_method');
        $table->unsignedBigInteger('service_fee')->nullable()->after('transaction_id');
        $table->unsignedBigInteger('owner_id')->nullable()->after('service_fee');
    });
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('applications', function (Blueprint $table) {
            //
        });
    }
};

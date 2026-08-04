<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('commissions', function (Blueprint $table) {
            $table->string('disbursement_method', 32)->nullable()->after('paid_at');
            $table->string('disbursement_reference', 128)->nullable()->after('disbursement_method');
            $table->string('disbursement_batch_id', 64)->nullable()->after('disbursement_reference');
        });

        if (Schema::hasColumn('commissions', 'payment_id')) {
            Schema::table('commissions', function (Blueprint $table) {
                $table->unique('payment_id');
            });
        }
    }

    public function down(): void
    {
        Schema::table('commissions', function (Blueprint $table) {
            $table->dropUnique(['payment_id']);
            $table->dropColumn(['disbursement_method', 'disbursement_reference', 'disbursement_batch_id']);
        });
    }
};

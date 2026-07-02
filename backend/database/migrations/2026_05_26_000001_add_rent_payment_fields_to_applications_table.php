<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('applications', function (Blueprint $table) {
            if (! Schema::hasColumn('applications', 'rent_payment_status')) {
                $table->string('rent_payment_status')->nullable()->after('transaction_id');
            }
            if (! Schema::hasColumn('applications', 'rent_payment_method')) {
                $table->string('rent_payment_method')->nullable()->after('rent_payment_status');
            }
            if (! Schema::hasColumn('applications', 'rent_transaction_id')) {
                $table->string('rent_transaction_id')->nullable()->after('rent_payment_method');
            }
            if (! Schema::hasColumn('applications', 'amount_paid')) {
                $table->decimal('amount_paid', 12, 2)->nullable()->after('rent_transaction_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('applications', function (Blueprint $table) {
            $table->dropColumn([
                'rent_payment_status',
                'rent_payment_method',
                'rent_transaction_id',
                'amount_paid',
            ]);
        });
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bnb_bookings', function (Blueprint $table) {
            if (! Schema::hasColumn('bnb_bookings', 'transaction_id')) {
                $table->string('transaction_id', 80)->nullable()->after('payment_method');
                $table->index('transaction_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('bnb_bookings', function (Blueprint $table) {
            if (Schema::hasColumn('bnb_bookings', 'transaction_id')) {
                $table->dropIndex(['transaction_id']);
                $table->dropColumn('transaction_id');
            }
        });
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bnb_bookings', function (Blueprint $table) {
            if (! Schema::hasColumn('bnb_bookings', 'payment_deadline_at')) {
                $table->timestamp('payment_deadline_at')->nullable()->after('transaction_id');
                $table->index('payment_deadline_at');
            }
        });

        // Allow payment_status = failed (MySQL enum otherwise rejects it).
        if (Schema::hasColumn('bnb_bookings', 'payment_status')) {
            $driver = Schema::getConnection()->getDriverName();
            if ($driver === 'mysql') {
                DB::statement(
                    "ALTER TABLE bnb_bookings MODIFY payment_status VARCHAR(20) NOT NULL DEFAULT 'pending'"
                );
            }
        }
    }

    public function down(): void
    {
        Schema::table('bnb_bookings', function (Blueprint $table) {
            if (Schema::hasColumn('bnb_bookings', 'payment_deadline_at')) {
                $table->dropIndex(['payment_deadline_at']);
                $table->dropColumn('payment_deadline_at');
            }
        });
    }
};

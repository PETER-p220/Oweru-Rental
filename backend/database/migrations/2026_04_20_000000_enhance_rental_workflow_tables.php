<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('applications', function (Blueprint $table) {
            // Add workflow status tracking if not already present
            if (!Schema::hasColumn('applications', 'workflow_status')) {
                $table->enum('workflow_status', [
                    'applied',
                    'approved',
                    'payment_pending',
                    'payment_completed',
                    'contract_active',
                    'rejected',
                    'withdrawn'
                ])->default('applied')->after('status');
            }

            if (!Schema::hasColumn('applications', 'service_charge')) {
                $table->decimal('service_charge', 10, 2)->nullable()->after('payment_method');
            }

            if (!Schema::hasColumn('applications', 'approved_at')) {
                $table->timestamp('approved_at')->nullable()->after('responded_at');
            }
        });

        Schema::table('tenants', function (Blueprint $table) {
            if (!Schema::hasColumn('tenants', 'lease_start_date')) {
                $table->date('lease_start_date')->nullable()->after('move_in_date');
            }

            if (!Schema::hasColumn('tenants', 'lease_end_date')) {
                $table->date('lease_end_date')->nullable()->after('lease_start_date');
            }

            if (!Schema::hasColumn('tenants', 'rent_amount')) {
                $table->decimal('rent_amount', 10, 2)->nullable()->after('lease_end_date');
            }

            if (!Schema::hasColumn('tenants', 'service_charge')) {
                $table->decimal('service_charge', 10, 2)->nullable()->after('rent_amount');
            }
        });

        Schema::table('payments', function (Blueprint $table) {
            if (!Schema::hasColumn('payments', 'payment_month')) {
                $table->string('payment_month')->nullable()->after('reference');
            }

            if (!Schema::hasColumn('payments', 'is_reminder_sent')) {
                $table->boolean('is_reminder_sent')->default(false)->after('paid_at');
            }
        });
    }

    public function down(): void
    {
        Schema::table('applications', function (Blueprint $table) {
            if (Schema::hasColumn('applications', 'workflow_status')) {
                $table->dropColumn('workflow_status');
            }
            if (Schema::hasColumn('applications', 'approved_at')) {
                $table->dropColumn('approved_at');
            }
        });

        Schema::table('tenants', function (Blueprint $table) {
            if (Schema::hasColumn('tenants', 'lease_start_date')) {
                $table->dropColumn(['lease_start_date', 'lease_end_date', 'rent_amount', 'service_charge']);
            }
        });

        Schema::table('payments', function (Blueprint $table) {
            if (Schema::hasColumn('payments', 'payment_month')) {
                $table->dropColumn(['payment_month', 'is_reminder_sent']);
            }
        });
    }
};

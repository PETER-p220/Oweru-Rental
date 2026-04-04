<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('site_visits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('property_id')->constrained()->onDelete('cascade');
            $table->foreignId('tenant_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('agent_id')->nullable()->constrained('users')->onDelete('cascade');
            $table->foreignId('landlord_id')->nullable()->constrained('users')->onDelete('cascade');
            $table->date('requested_date');
            $table->dateTime('preferred_time');
            $table->enum('status', ['pending', 'confirmed', 'cancelled', 'completed'])->default('pending');
            $table->text('notes')->nullable();
            $table->string('contact_phone');
            $table->string('contact_email');
            $table->enum('payment_status', ['pending', 'paid', 'failed', 'refunded'])->default('pending');
            $table->decimal('payment_amount', 10, 2);
            $table->string('payment_transaction_id')->nullable();
            $table->enum('payment_method', ['selcom', 'mobile_money', 'cash'])->nullable();
            $table->string('confirmation_code')->nullable();
            $table->dateTime('reminded_at')->nullable();
            $table->dateTime('completed_at')->nullable();
            $table->dateTime('cancelled_at')->nullable();
            $table->text('cancel_reason')->nullable();
            $table->timestamps();

            $table->index(['property_id', 'status']);
            $table->index(['tenant_id', 'status']);
            $table->index(['agent_id', 'status']);
            $table->index(['landlord_id', 'status']);
            $table->index('payment_transaction_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('site_visits');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('tenant_id')->nullable()->constrained('tenants')->nullOnDelete();
            $table->foreignId('property_id')->nullable()->constrained('properties')->nullOnDelete();
            $table->foreignId('agent_id')->nullable()->constrained('users')->nullOnDelete();
            $table->unsignedBigInteger('payment_method_id')->nullable();
            $table->string('type')->default('rent');
            $table->decimal('amount', 12, 2);
            $table->string('status')->default('pending');
            $table->string('reference')->nullable();
            $table->string('description')->nullable();
            $table->date('due_date')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};

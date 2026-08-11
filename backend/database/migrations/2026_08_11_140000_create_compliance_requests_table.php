<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('compliance_requests', function (Blueprint $table) {
            $table->id();
            $table->string('reference', 32)->unique();
            $table->foreignId('tenant_user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('property_id')->constrained('properties')->cascadeOnDelete();
            $table->foreignId('owner_id')->constrained('users')->cascadeOnDelete();
            $table->string('category', 32);
            $table->string('priority', 16)->default('medium');
            $table->string('status', 24)->default('submitted');
            $table->string('title', 180);
            $table->text('description');
            $table->string('location_in_property', 120)->nullable();
            $table->date('preferred_date')->nullable();
            $table->text('owner_response')->nullable();
            $table->text('resolution_notes')->nullable();
            $table->timestamp('acknowledged_at')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();

            $table->index(['owner_id', 'status']);
            $table->index(['tenant_user_id', 'status']);
            $table->index(['property_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('compliance_requests');
    }
};

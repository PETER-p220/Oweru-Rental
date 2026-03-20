<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tenants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('property_id')->constrained('properties')->cascadeOnDelete();
            $table->date('move_in_date')->nullable();
            $table->string('status')->default('active');
            $table->timestamps();

            $table->unique(['user_id', 'property_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tenants');
    }
};

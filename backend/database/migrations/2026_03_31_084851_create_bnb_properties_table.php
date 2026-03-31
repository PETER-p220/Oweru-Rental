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
        Schema::create('bnb_properties', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description');
            $table->decimal('price', 10, 2);
            $table->string('location');
            $table->string('address');
            $table->string('type');
            $table->integer('bedrooms');
            $table->integer('bathrooms');
            $table->json('amenities')->nullable();
            $table->json('images')->nullable();
            $table->foreignId('owner_id')->constrained('users')->onDelete('cascade');
            $table->enum('status', ['available', 'occupied', 'maintenance'])->default('available');
            
            // BNB specific fields
            $table->integer('max_guests')->default(2);
            $table->integer('min_stay')->default(1);
            $table->boolean('instant_book')->default(false);
            $table->string('cancellation_policy')->nullable();
            $table->json('house_rules')->nullable();
            $table->time('check_in_time')->default('15:00:00');
            $table->time('check_out_time')->default('11:00:00');
            $table->decimal('cleaning_fee', 10, 2)->default(0);
            $table->decimal('service_fee', 10, 2)->default(0);
            $table->decimal('security_deposit', 10, 2)->default(0);
            $table->decimal('weekly_discount', 5, 2)->default(0);
            $table->decimal('monthly_discount', 5, 2)->default(0);
            $table->json('amenities_bnb')->nullable();
            $table->json('location_highlights')->nullable();
            $table->json('safety_items')->nullable();
            
            $table->timestamps();
            
            $table->index(['location', 'status']);
            $table->index(['owner_id', 'status']);
            $table->index(['price']);
            $table->index(['max_guests']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bnb_properties');
    }
};

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
        Schema::create('properties', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description');
            $table->decimal('price', 10, 2);
            $table->string('location');
            $table->string('address');
            $table->enum('type', ['apartment', 'house', 'studio', 'villa', 'commercial', 'oweru_rental']);
            $table->integer('bedrooms');
            $table->integer('bathrooms');
            $table->decimal('area', 8, 2); // in square meters
            $table->json('images')->nullable(); // Store image URLs as JSON
            $table->json('amenities')->nullable(); // Store amenities as JSON
            $table->boolean('featured')->default(false);
            $table->boolean('available')->default(true);
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();
            $table->foreignId('owner_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('agent_id')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
            
            $table->index(['location', 'type']);
            $table->index(['price']);
            $table->index(['featured']);
            $table->index(['available']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('properties');
    }
};

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
        Schema::create('bnb_reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('property_id')->constrained('bnb_properties')->onDelete('cascade');
            $table->foreignId('booking_id')->nullable()->constrained('bnb_bookings')->onDelete('cascade');
            $table->foreignId('guest_id')->constrained('users')->onDelete('cascade');
            $table->tinyInteger('rating'); // 1-5 stars
            $table->text('comment')->nullable();
            $table->text('response')->nullable();
            $table->timestamp('response_date')->nullable();
            $table->integer('helpful_count')->default(0);
            $table->boolean('verified')->default(false);
            $table->text('private_feedback')->nullable();
            $table->timestamps();
            
            $table->index(['property_id', 'rating']);
            $table->index(['guest_id']);
            $table->index(['booking_id']);
            $table->index(['verified']);
            $table->index(['rating']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bnb_reviews');
    }
};

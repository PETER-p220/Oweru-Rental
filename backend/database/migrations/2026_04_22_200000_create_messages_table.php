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
        Schema::create('messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sender_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('receiver_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('property_id')->nullable()->constrained('properties')->onDelete('cascade');
            $table->text('content');         
            $table->enum('type', ['text', 'image', 'file', 'location', 'property'])->default('text');
            $table->json('attachments')->nullable();
            $table->enum('status', ['sent', 'delivered', 'read'])->default('sent');
            $table->timestamp('read_at')->nullable();
            $table->foreignId('reply_to_id')->nullable()->constrained('messages')->onDelete('cascade');
            $table->boolean('is_edited')->default(false);
            $table->timestamp('edited_at')->nullable();
            $table->timestamps();

            // Indexes for performance
            $table->index(['sender_id', 'receiver_id']);
            $table->index(['receiver_id', 'status']);
            $table->index(['property_id']);
            $table->index(['reply_to_id']);
            $table->index(['created_at']);
            $table->index(['status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('messages');
    }
};

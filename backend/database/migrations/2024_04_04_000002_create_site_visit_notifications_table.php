<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('site_visit_notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('site_visit_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->enum('type', ['visit_requested', 'visit_confirmed', 'visit_cancelled', 'visit_reminder', 'payment_required', 'payment_received']);
            $table->string('title');
            $table->text('message');
            $table->boolean('is_read')->default(false);
            $table->enum('sent_via', ['email', 'sms', 'push', 'system'])->default('system');
            $table->dateTime('sent_at')->nullable();
            $table->timestamps();

            $table->index(['site_visit_id', 'user_id']);
            $table->index(['user_id', 'is_read']);
            $table->index(['type', 'sent_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('site_visit_notifications');
    }
};

<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use App\Console\Commands\UpdateUserOnlineStatus;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Register the update user online status command
Artisan::command('users:update-online-status', function (UpdateUserOnlineStatus $command) {
    return $command->handle();
})->purpose('Update user online status - mark inactive users as offline');

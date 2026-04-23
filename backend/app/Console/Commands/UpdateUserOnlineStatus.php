<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use Carbon\Carbon;

class UpdateUserOnlineStatus extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'users:update-online-status';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Update user online status - mark inactive users as offline';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Updating user online status...');
        
        // Mark users as offline if they haven't been active for 5 minutes
        $fiveMinutesAgo = Carbon::now()->subMinutes(5);
        
        $updated = User::where('is_online', true)
                      ->where('last_seen_at', '<', $fiveMinutesAgo)
                      ->update(['is_online' => false]);
        
        $this->info("Marked {$updated} users as offline");
        
        return Command::SUCCESS;
    }
}

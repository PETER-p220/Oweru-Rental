<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $this->command->info('🌱 Starting Admin Seeder...');

        // Check if admin user already exists
        $existingAdmin = User::where('email', 'admin@oweru.com')->first();
        
        if ($existingAdmin) {
            $this->command->info('✅ Admin user already exists: ' . $existingAdmin->email);
            return;
        }

        // Create admin user
        $adminUser = User::create([
            'first_name' => 'Admin',
            'last_name' => 'User',
            'email' => 'admin@oweru.com',
            'phone' => '+255777888999',
            'password' => Hash::make('admin123'),
            'user_type' => 'admin',
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        $this->command->info('✅ Admin user created successfully!');
        $this->command->info('📧 Email: ' . $adminUser->email);
        $this->command->info('🔑 Password: admin123');
        $this->command->info('👤 Role: Administrator');
        $this->command->info('🆔 User ID: ' . $adminUser->id);

        $this->command->info("\n🎉 Admin seeder completed successfully!");
        $this->command->info("\n📋 Login Details:");
        $this->command->info("   URL: http://localhost:8000/login");
        $this->command->info("   Email: admin@oweru.com");
        $this->command->info("   Password: admin123");
        $this->command->info("   Role: admin");
    }
}

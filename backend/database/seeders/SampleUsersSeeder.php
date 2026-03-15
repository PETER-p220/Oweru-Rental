<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SampleUsersSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $this->command->info('🌱 Starting Sample Users Seeder...');

        $hashedPassword = Hash::make('password123');

        // Create sample agent
        $agentUser = User::firstOrCreate([
            'email' => 'john.agent@oweru.com'
        ], [
            'first_name' => 'John',
            'last_name' => 'Agent',
            'phone' => '+255123456789',
            'password' => $hashedPassword,
            'user_type' => 'agent',
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        // Create sample landlord
        $landlordUser = User::firstOrCreate([
            'email' => 'jane.landlord@oweru.com'
        ], [
            'first_name' => 'Jane',
            'last_name' => 'Landlord',
            'phone' => '+255987654321',
            'password' => $hashedPassword,
            'user_type' => 'landlord',
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        // Create sample tenant
        $tenantUser = User::firstOrCreate([
            'email' => 'mike.tenant@oweru.com'
        ], [
            'first_name' => 'Mike',
            'last_name' => 'Tenant',
            'phone' => '+255555666777',
            'password' => $hashedPassword,
            'user_type' => 'tenant',
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        $this->command->info('✅ Sample users created successfully!');
        $this->command->info("\n📋 Sample Users Login Details:");
        $this->command->info("   Agent: john.agent@oweru.com / password123");
        $this->command->info("   Landlord: jane.landlord@oweru.com / password123");
        $this->command->info("   Tenant: mike.tenant@oweru.com / password123");
    }
}

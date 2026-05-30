<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class CommercialUserSeeder extends Seeder
{
    public function run(): void
    {
        // Commercial users data
        $commercialUsers = [
            [
                'first_name' => 'East Africa',
                'last_name' => 'Commercial Properties',
                'email' => 'commercial@oweru.com',
                'phone' => '+255 714 123 456',
                'company_name' => 'East Africa Commercial Properties Ltd',
                'business_license' => 'BL-2024-COM-001',
                'address' => 'Kigali Heights, Kigali, Rwanda',
                'description' => 'Leading commercial real estate provider in East Africa'
            ],
            [
                'first_name' => 'Africa',
                'last_name' => 'Business Spaces',
                'email' => 'tz-commercial@oweru.com', 
                'phone' => '+255 754 987 654',
                'company_name' => 'Africa Business Spaces',
                'business_license' => 'BL-2024-COM-002',
                'address' => 'Dar es Salaam, Africa',
                'description' => 'Premium commercial spaces in Africa'
            ],
            [
                'first_name' => 'Kigali',
                'last_name' => 'Commercial Real Estate',
                'email' => 'kigali-commercial@oweru.com',
                'phone' => '+250 788 456 123',
                'company_name' => 'Kigali Commercial Real Estate',
                'business_license' => 'BL-2024-COM-003',
                'address' => 'Kimihurura, Kigali',
                'description' => 'Commercial real estate solutions across East Africa'
            ]
        ];

        foreach ($commercialUsers as $userData) {
            User::firstOrCreate(['email' => $userData['email']], [
                'first_name' => $userData['first_name'],
                'last_name' => $userData['last_name'],
                'email' => $userData['email'],
                'phone' => $userData['phone'],
                'password' => Hash::make('password'),
                'user_type' => 'commercial',
                'email_verified_at' => now(),
                'is_active' => true,
            ]);
        }

        $this->command->info('✅ Commercial users created successfully!');
        $this->command->info('📧 Login credentials:');
        $this->command->info('   Email: commercial@oweru.com');
        $this->command->info('   Password: password');
    }
}

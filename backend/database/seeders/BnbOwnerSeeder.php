<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class BnbOwnerSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create sample BNB owners
        $bnbOwners = [
            [
                'first_name' => 'Sarah',
                'last_name' => 'Johnson',
                'email' => 'pendo@oweru.com',
                'phone' => '+255714123456',
                'user_type' => 'bnb_owner',
                'is_active' => true,
                'bio' => 'Passionate BNB host with 5 years of experience in hospitality. I love providing exceptional stays for my guests and showcasing the beauty of Tanzania.',
                'password' => Hash::make('password123', ['remember_token' => '']),
            ],
            [
                'first_name' => 'Michael',
                'last_name' => 'Chen',
                'email' => 'michael.chen@bnb.com',
                'phone' => '+255722987654',
                'user_type' => 'bnb_owner',
                'is_active' => true,
                'bio' => 'Professional property manager specializing in luxury vacation rentals. I manage multiple properties in Dar es Salaam and Zanzibar with a focus on providing memorable experiences.',
                'password' => Hash::make('password123', ['remember_token' => '']),
            ],
            [
                'first_name' => 'Aisha',
                'last_name' => 'Mohamed',
                'email' => 'aisha.mohamed@bnb.com',
                'phone' => '+255733456789',
                'user_type' => 'bnb_owner',
                'is_active' => true,
                'bio' => 'Local host who loves sharing Tanzanian culture with international guests. I offer authentic experiences and personalized recommendations for the best local attractions.',
                'password' => Hash::make('password123', ['remember_token' => '']),
            ],
            [
                'first_name' => 'David',
                'last_name' => 'Wilson',
                'email' => 'david.wilson@bnb.com',
                'phone' => '+255745678901',
                'user_type' => 'bnb_owner',
                'is_active' => true,
                'bio' => 'Experienced BNB owner with properties in prime locations. I focus on cleanliness, comfort, and ensuring guests have everything they need for a perfect stay.',
                'password' => Hash::make('password123', ['remember_token' => '']),
            ],
            [
                'first_name' => 'Fatima',
                'last_name' => 'Al-Mansour',
                'email' => 'fatima.almansour@bnb.com',
                'phone' => '+255756789012',
                'user_type' => 'bnb_owner',
                'is_active' => true,
                'bio' => 'Hospitality enthusiast with beautifully decorated properties. I pay attention to every detail to ensure my guests feel at home and have an unforgettable Tanzanian experience.',
                'password' => Hash::make('password123', ['remember_token' => '']),
            ],
        ];

        foreach ($bnbOwners as $owner) {
            User::create($owner);
        }

        $this->command->info('BNB Owner seeders created successfully!');
    }
}

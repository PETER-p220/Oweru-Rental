<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\BnbProperty;
use App\Models\User;

class BnbPropertySeeder extends Seeder
{
    public function run(): void
    {
        // Get a BNB owner user
        $owner = User::where('user_type', 'bnb_owner')->first();
        
        if (!$owner) {
            // Create a BNB owner if none exists
            $owner = User::create([
                'firstName' => 'John',
                'lastName' => 'Doe',
                'email' => 'bnbowner@example.com',
                'phone' => '+1234567890',
                'user_type' => 'bnb_owner',
                'password' => bcrypt('password'),
                'is_active' => true,
            ]);
        }

        $properties = [
            [
                'title' => 'Luxury Beachfront Villa',
                'description' => 'Beautiful beachfront villa with stunning ocean views and private beach access',
                'price' => 250,
                'location' => 'Beachfront, Oweru',
                'address' => '123 Beach Road, Oweru',
                'type' => 'villa',
                'bedrooms' => 3,
                'bathrooms' => 2,
                'amenities' => json_encode(['wifi', 'pool', 'air conditioning', 'kitchen', 'beach access']),
                'images' => json_encode(['bnb1.jpg', 'bnb2.jpg', 'bnb3.jpg']),
                'owner_id' => $owner->id,
                'status' => 'available',
                'max_guests' => 6,
                'min_stay' => 2,
                'instant_book' => true,
                'cancellation_policy' => 'flexible',
                'house_rules' => json_encode(['No smoking', 'No parties', 'Check-in after 3 PM']),
                'check_in_time' => '15:00',
                'check_out_time' => '11:00',
                'cleaning_fee' => 50,
                'service_fee' => 25,
                'security_deposit' => 500,
            ],
            [
                'title' => 'Cozy Mountain Cabin',
                'description' => 'Perfect mountain getaway with fireplace and stunning mountain views',
                'price' => 120,
                'location' => 'Mountains, Oweru',
                'address' => '456 Mountain Trail, Oweru',
                'type' => 'cabin',
                'bedrooms' => 2,
                'bathrooms' => 1,
                'amenities' => json_encode(['fireplace', 'wifi', 'kitchen', 'hiking trails']),
                'images' => json_encode(['cabin1.jpg', 'cabin2.jpg']),
                'owner_id' => $owner->id,
                'status' => 'available',
                'max_guests' => 4,
                'min_stay' => 1,
                'instant_book' => false,
                'cancellation_policy' => 'moderate',
                'house_rules' => json_encode(['No smoking', 'Quiet hours after 10 PM']),
                'check_in_time' => '16:00',
                'check_out_time' => '10:00',
                'cleaning_fee' => 30,
                'service_fee' => 15,
                'security_deposit' => 200,
            ],
            [
                'title' => 'Modern City Apartment',
                'description' => 'Stylish apartment in the heart of the city with all modern amenities',
                'price' => 180,
                'location' => 'City Center, Oweru',
                'address' => '789 Downtown Ave, Oweru',
                'type' => 'apartment',
                'bedrooms' => 1,
                'bathrooms' => 1,
                'amenities' => json_encode(['wifi', 'gym', 'rooftop terrace', 'concierge']),
                'images' => json_encode(['apt1.jpg', 'apt2.jpg', 'apt3.jpg']),
                'owner_id' => $owner->id,
                'status' => 'available',
                'max_guests' => 2,
                'min_stay' => 3,
                'instant_book' => true,
                'cancellation_policy' => 'strict',
                'house_rules' => json_encode(['No smoking', 'No pets', 'No parties']),
                'check_in_time' => '14:00',
                'check_out_time' => '11:00',
                'cleaning_fee' => 40,
                'service_fee' => 20,
                'security_deposit' => 300,
            ],
        ];

        foreach ($properties as $property) {
            BnbProperty::create($property);
        }

        $this->command->info('BNB properties seeded successfully!');
    }
}

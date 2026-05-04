<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Property;
use App\Models\PropertyImage;
use App\Models\Amenity;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CommercialPropertySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get commercial user
        $commercialUser = User::where('email', 'commercial@oweru.com')->first();
        
        if (!$commercialUser) {
            $this->command->error('Commercial user not found. Please run CommercialUserSeeder first.');
            return;
        }

        // Get or create commercial amenities
        $amenities = $this->getOrCreateCommercialAmenities();

        // Sample commercial properties
        $properties = [
            [
                'title' => 'Modern Office Space in Kigali Heights',
                'description' => 'Premium office space located in the heart of Kigali business district. Features modern amenities, high-speed internet, and 24/7 security. Perfect for startups and established businesses.',
                'type' => 'office',
                'location' => 'Kigali, Rwanda',
                'address' => 'KN 123 Avenue, Kigali Heights Tower, Floor 8',
                'price' => 2500000,
                'price_type' => 'monthly',
                'parking_spaces' => 15,
                'furnished' => true,
                'available_from' => now()->addDays(7),
                'contact_phone' => '+250788123456',
                'contact_email' => 'commercial@oweru.com',
                'status' => 'active',
                'featured' => true,
                'amenities' => [1, 2, 3, 4, 5, 6, 7, 8] // Wi-Fi, Security, Parking, AC, Meeting Room, Elevator, Cafeteria, Reception
            ],
            [
                'title' => 'Prime Retail Space - Kimihurura Plaza',
                'description' => 'High-visibility retail space in bustling Kimihurura area. Excellent foot traffic, modern storefront, and ample parking. Ideal for retail shops, cafes, or showrooms.',
                'type' => 'retail',
                'location' => 'Kimihurura, Kigali',
                'address' => 'KG 567 Street, Kimihurura Plaza, Ground Floor',
                'price' => 1800000,
                'price_type' => 'monthly',
                'parking_spaces' => 20,
                'furnished' => false,
                'available_from' => now()->addDays(14),
                'contact_phone' => '+250788123456',
                'contact_email' => 'commercial@oweru.com',
                'status' => 'active',
                'featured' => true,
                'amenities' => [1, 3, 4, 9, 10, 11] // Wi-Fi, Parking, AC, Display Windows, Storage, Security
            ],
            [
                'title' => 'Industrial Warehouse - Nyabugogo',
                'description' => 'Large-scale warehouse facility with loading docks, high ceilings, and industrial-grade flooring. Perfect for manufacturing, storage, or distribution operations.',
                'type' => 'warehouse',
                'location' => 'Nyabugogo, Kigali',
                'address' => 'NY 890 Road, Industrial Zone, Warehouse Complex A',
                'price' => 3500000,
                'price_type' => 'monthly',
                'parking_spaces' => 50,
                'furnished' => false,
                'available_from' => now()->addDays(3),
                'contact_phone' => '+250788123456',
                'contact_email' => 'commercial@oweru.com',
                'status' => 'active',
                'featured' => false,
                'amenities' => [3, 4, 12, 13, 14, 15] // Parking, AC, Loading Dock, Security, 24/7 Access, Fire Safety
            ],
            [
                'title' => 'Executive Business Center - Nyarutarama',
                'description' => 'Luxury business center offering fully serviced office spaces with premium amenities. Includes conference facilities, business lounge, and professional reception services.',
                'type' => 'commercial',
                'location' => 'Nyarutarama, Kigali',
                'address' => 'NR 234 Avenue, Executive Towers, Floors 3-5',
                'price' => 4500000,
                'price_type' => 'monthly',
                'parking_spaces' => 30,
                'furnished' => true,
                'available_from' => now()->addDays(10),
                'contact_phone' => '+250788123456',
                'contact_email' => 'commercial@oweru.com',
                'status' => 'active',
                'featured' => true,
                'amenities' => [1, 2, 3, 4, 5, 6, 7, 8, 16, 17] // All premium amenities
            ],
            [
                'title' => 'Co-working Space - Kacyiru',
                'description' => 'Modern co-working space with flexible desk options, private offices, and collaborative areas. Perfect for freelancers, startups, and remote teams.',
                'type' => 'office',
                'location' => 'Kacyiru, Kigali',
                'address' => 'KC 456 Street, Innovation Hub, 2nd Floor',
                'price' => 800000,
                'price_type' => 'monthly',
                'parking_spaces' => 10,
                'furnished' => true,
                'available_from' => now()->addDays(5),
                'contact_phone' => '+250788123456',
                'contact_email' => 'commercial@oweru.com',
                'status' => 'active',
                'featured' => false,
                'amenities' => [1, 2, 4, 5, 6, 18, 19] // Wi-Fi, Security, AC, Meeting Room, Elevator, Kitchen, Lounge
            ],
            [
                'title' => 'Retail Showroom - Remera',
                'description' => 'Spacious showroom with large glass frontage and excellent visibility on main road. Perfect for car dealerships, furniture showrooms, or galleries.',
                'type' => 'retail',
                'location' => 'Remera, Kigali',
                'address' => 'RM 789 Avenue, Main Road, Showroom Complex',
                'price' => 2200000,
                'price_type' => 'monthly',
                'parking_spaces' => 25,
                'furnished' => false,
                'available_from' => now()->addDays(21),
                'contact_phone' => '+250788123456',
                'contact_email' => 'commercial@oweru.com',
                'status' => 'pending',
                'featured' => false,
                'amenities' => [1, 3, 9, 10, 11, 20] // Wi-Fi, Parking, Display Windows, Storage, Security, Signage Space
            ]
        ];

        foreach ($properties as $index => $propertyData) {
            // Create property
            $property = Property::create([
                'user_id' => $commercialUser->id,
                'title' => $propertyData['title'],
                'description' => $propertyData['description'],
                'type' => $propertyData['type'],
                'location' => $propertyData['location'],
                'address' => $propertyData['address'],
                'price' => $propertyData['price'],
                'price_type' => $propertyData['price_type'],
                'parking_spaces' => $propertyData['parking_spaces'],
                'furnished' => $propertyData['furnished'],
                'available_from' => $propertyData['available_from'],
                'contact_phone' => $propertyData['contact_phone'],
                'contact_email' => $propertyData['contact_email'],
                'status' => $propertyData['status'],
                'featured' => $propertyData['featured'],
                'views' => rand(50, 500),
                'created_at' => now()->subDays(rand(1, 30)),
                'updated_at' => now()
            ]);

            // Attach amenities
            $property->amenities()->attach($propertyData['amenities']);

            // Add sample images
            $this->addSampleImages($property, $index + 1);
        }

        $this->command->info('✅ Commercial properties seeded successfully!');
        $this->command->info('📊 Created ' . count($properties) . ' commercial properties');
    }

    /**
     * Get or create commercial amenities
     */
    private function getOrCreateCommercialAmenities(): array
    {
        $amenityNames = [
            'High-Speed Wi-Fi',
            '24/7 Security',
            'Parking Space',
            'Air Conditioning',
            'Meeting Rooms',
            'Elevator',
            'Cafeteria',
            'Reception Services',
            'Display Windows',
            'Storage Space',
            'CCTV Surveillance',
            'Loading Dock',
            '24/7 Access',
            'Fire Safety System',
            'Backup Generator',
            'Business Lounge',
            'Conference Facilities',
            'Kitchen Facilities',
            'Co-working Areas',
            'Signage Space',
            'Customer Restrooms'
        ];

        $amenities = [];
        foreach ($amenityNames as $index => $name) {
            $amenity = Amenity::firstOrCreate(
                ['name' => $name],
                [
                    'icon' => $this->getAmenityIcon($name),
                    'created_at' => now(),
                    'updated_at' => now()
                ]
            );
            $amenities[$index + 1] = $amenity->id;
        }

        return $amenities;
    }

    /**
     * Get appropriate icon for amenity
     */
    private function getAmenityIcon(string $amenityName): string
    {
        $iconMap = [
            'High-Speed Wi-Fi' => 'wifi',
            '24/7 Security' => 'shield',
            'Parking Space' => 'car',
            'Air Conditioning' => 'wind',
            'Meeting Rooms' => 'users',
            'Elevator' => 'arrow-up',
            'Cafeteria' => 'coffee',
            'Reception Services' => 'user-check',
            'Display Windows' => 'eye',
            'Storage Space' => 'package',
            'CCTV Surveillance' => 'camera',
            'Loading Dock' => 'truck',
            '24/7 Access' => 'key',
            'Fire Safety System' => 'alert-triangle',
            'Backup Generator' => 'zap',
            'Business Lounge' => 'couch',
            'Conference Facilities' => 'presentation',
            'Kitchen Facilities' => 'utensils',
            'Co-working Areas' => 'briefcase',
            'Signage Space' => 'type',
            'Customer Restrooms' => 'user'
        ];

        return $iconMap[$amenityName] ?? 'check-circle';
    }

    /**
     * Add sample images for property
     */
    private function addSampleImages(Property $property, int $propertyIndex): void
    {
        // Sample image URLs (you can replace with actual images)
        $imageUrls = [
            'properties/office/office-' . $propertyIndex . '-1.jpg',
            'properties/office/office-' . $propertyIndex . '-2.jpg',
            'properties/office/office-' . $propertyIndex . '-3.jpg'
        ];

        foreach ($imageUrls as $index => $imageUrl) {
            PropertyImage::create([
                'property_id' => $property->id,
                'image_path' => $imageUrl,
                'is_primary' => $index === 0,
                'created_at' => now(),
                'updated_at' => now()
            ]);
        }
    }
}

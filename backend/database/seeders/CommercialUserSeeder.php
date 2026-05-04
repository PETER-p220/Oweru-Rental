<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Role;
use App\Models\Permission;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class CommercialUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create or get commercial role
        $commercialRole = Role::firstOrCreate(['name' => 'commercial'], [
            'display_name' => 'Commercial User',
            'description' => 'User who can post and manage commercial rental properties'
        ]);

        // Create permissions for commercial users
        $permissions = [
            'create-properties' => 'Create new rental properties',
            'edit-own-properties' => 'Edit own rental properties',
            'delete-own-properties' => 'Delete own rental properties',
            'view-property-analytics' => 'View property analytics and statistics',
            'manage-property-bookings' => 'Manage property bookings and inquiries',
            'upload-property-images' => 'Upload property images and documents',
            'set-property-pricing' => 'Set property pricing and availability',
            'view-own-reports' => 'View own property reports and earnings'
        ];

        foreach ($permissions as $name => $description) {
            $permission = Permission::firstOrCreate(['name' => $name], [
                'display_name' => ucwords(str_replace('-', ' ', $name)),
                'description' => $description
            ]);
            
            // Attach permission to commercial role
            if (!$commercialRole->hasPermission($name)) {
                $commercialRole->permissions()->attach($permission->id);
            }
        }

        // Create sample commercial users
        $commercialUsers = [
            [
                'name' => 'Commercial Properties Ltd',
                'email' => 'commercial@oweru.com',
                'phone' => '+255712345678',
                'company_name' => 'Commercial Properties Ltd',
                'business_license' => 'BL-2024-COM-001',
                'address' => 'Kigali, Rwanda',
                'description' => 'Leading commercial property management company in Rwanda'
            ],
            [
                'name' => 'Rwanda Business Spaces',
                'email' => 'business@oweru.com',
                'phone' => '+255712345679',
                'company_name' => 'Rwanda Business Spaces',
                'business_license' => 'BL-2024-COM-002',
                'address' => 'Kigali Heights, Kigali',
                'description' => 'Premium office and retail spaces for rent'
            ],
            [
                'name' => 'East Africa Commercial Real Estate',
                'email' => 'eac@oweru.com',
                'phone' => '+255712345680',
                'company_name' => 'East Africa Commercial Real Estate',
                'business_license' => 'BL-2024-COM-003',
                'address' => 'Kimihurura, Kigali',
                'description' => 'Commercial real estate solutions across East Africa'
            ]
        ];

        foreach ($commercialUsers as $userData) {
            $user = User::firstOrCreate(['email' => $userData['email']], [
                'name' => $userData['name'],
                'email' => $userData['email'],
                'phone' => $userData['phone'],
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
                'remember_token' => Str::random(10),
                'status' => 'active'
            ]);

            // Attach commercial role
            if (!$user->hasRole('commercial')) {
                $user->roles()->attach($commercialRole->id);
            }

            // Add commercial-specific meta data
            $user->meta()->updateOrCreate('key', 'company_name', $userData['company_name']);
            $user->meta()->updateOrCreate('key', 'business_license', $userData['business_license']);
            $user->meta()->updateOrCreate('key', 'address', $userData['address']);
            $user->meta()->updateOrCreate('key', 'description', $userData['description']);
            $user->meta()->updateOrCreate('key', 'user_type', 'commercial');
        }

        $this->command->info('✅ Commercial users and permissions created successfully!');
        $this->command->info('📧 Login credentials:');
        $this->command->info('   Email: commercial@oweru.com');
        $this->command->info('   Password: password');
    }
}

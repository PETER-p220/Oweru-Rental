<?php

namespace Database\Seeders;

use App\Models\Application;
use App\Models\Contract;
use App\Models\Commission;
use App\Models\Lead;
use App\Models\Message;
use App\Models\Payment;
use App\Models\Property;
use App\Models\Tenant;
use App\Models\User;
use App\Models\Notification;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class LandlordDemoDataSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('Seeding landlord demo data...');

        $landlord = User::firstOrCreate(
            ['email' => 'jane.landlord@oweru.com'],
            [
                'first_name' => 'Jane',
                'last_name' => 'Landlord',
                'phone' => '+255987654321',
                'password' => Hash::make('password123'),
                'user_type' => 'landlord',
                'is_active' => true,
            ]
        );

        $agent = User::firstOrCreate(
            ['email' => 'john.agent@oweru.com'],
            [
                'first_name' => 'John',
                'last_name' => 'Agent',
                'phone' => '+255123456789',
                'password' => Hash::make('password123'),
                'user_type' => 'agent',
                'is_active' => true,
            ]
        );

        $mike = User::firstOrCreate(
            ['email' => 'mike.tenant@oweru.com'],
            [
                'first_name' => 'Mike',
                'last_name' => 'Tenant',
                'phone' => '+255555666777',
                'password' => Hash::make('password123'),
                'user_type' => 'tenant',
                'is_active' => true,
            ]
        );

        $amina = User::firstOrCreate(
            ['email' => 'amina.tenant@oweru.com'],
            [
                'first_name' => 'Amina',
                'last_name' => 'Suleiman',
                'phone' => '+255701111222',
                'password' => Hash::make('password123'),
                'user_type' => 'tenant',
                'is_active' => true,
            ]
        );

        $daniel = User::firstOrCreate(
            ['email' => 'daniel.tenant@oweru.com'],
            [
                'first_name' => 'Daniel',
                'last_name' => 'Mrema',
                'phone' => '+255702222333',
                'password' => Hash::make('password123'),
                'user_type' => 'tenant',
                'is_active' => true,
            ]
        );

        $masakiApartment = Property::updateOrCreate(
            ['owner_id' => $landlord->id, 'title' => 'Modern 2-Bedroom Apartment'],
            [
                'description' => 'Bright apartment in Masaki with balcony, parking, and quick access to the waterfront.',
                'price' => 850000,
                'location' => 'Masaki, Dar es Salaam',
                'address' => '12 Chole Road, Masaki',
                'type' => 'apartment',
                'bedrooms' => 2,
                'bathrooms' => 2,
                'area' => 120,
                'images' => [],
                'amenities' => ['Parking', 'Balcony', 'Security'],
                'featured' => true,
                'available' => false,
                'agent_id' => $agent->id,
            ]
        );

        $mikocheniStudio = Property::updateOrCreate(
            ['owner_id' => $landlord->id, 'title' => 'Cozy Studio in Mikocheni'],
            [
                'description' => 'Compact studio with clean finishes and easy access to public transport.',
                'price' => 420000,
                'location' => 'Mikocheni, Dar es Salaam',
                'address' => '44 Coca Cola Road, Mikocheni',
                'type' => 'apartment',
                'bedrooms' => 1,
                'bathrooms' => 1,
                'area' => 48,
                'images' => [],
                'amenities' => ['Water Tank', 'Fenced Compound'],
                'featured' => false,
                'available' => true,
                'agent_id' => $agent->id,
            ]
        );

        $oysterBayVilla = Property::updateOrCreate(
            ['owner_id' => $landlord->id, 'title' => 'Executive Villa, Oyster Bay'],
            [
                'description' => 'High-end villa with garden space, backup power, and premium finishes.',
                'price' => 3200000,
                'location' => 'Oyster Bay, Dar es Salaam',
                'address' => '8 Toure Drive, Oyster Bay',
                'type' => 'villa',
                'bedrooms' => 4,
                'bathrooms' => 3,
                'area' => 340,
                'images' => [],
                'amenities' => ['Garden', 'Backup Power', 'Guard House'],
                'featured' => true,
                'available' => false,
                'agent_id' => $agent->id,
            ]
        );

        $upangaHouse = Property::updateOrCreate(
            ['owner_id' => $landlord->id, 'title' => 'Family House in Upanga'],
            [
                'description' => 'Spacious family home with secure parking and a calm neighborhood setting.',
                'price' => 1800000,
                'location' => 'Upanga, Dar es Salaam',
                'address' => '19 Kivukoni Front, Upanga',
                'type' => 'house',
                'bedrooms' => 3,
                'bathrooms' => 2,
                'area' => 210,
                'images' => [],
                'amenities' => ['Parking', 'Servant Quarter'],
                'featured' => false,
                'available' => true,
                'agent_id' => $agent->id,
            ]
        );

        $mikeTenant = Tenant::updateOrCreate(
            ['user_id' => $mike->id, 'property_id' => $masakiApartment->id],
            [
                'move_in_date' => now()->subMonths(6)->toDateString(),
                'status' => 'active',
            ]
        );

        $aminaTenant = Tenant::updateOrCreate(
            ['user_id' => $amina->id, 'property_id' => $oysterBayVilla->id],
            [
                'move_in_date' => now()->subMonths(3)->toDateString(),
                'status' => 'active',
            ]
        );

        Contract::updateOrCreate(
            ['tenant_id' => $mikeTenant->id, 'property_id' => $masakiApartment->id],
            [
                'start_date' => now()->subMonths(6)->startOfMonth()->toDateString(),
                'end_date' => now()->addMonths(6)->endOfMonth()->toDateString(),
                'rent_amount' => 850000,
                'terms' => 'Monthly rent due on the 5th. Water included. Electricity billed separately.',
                'status' => 'active',
            ]
        );

        Contract::updateOrCreate(
            ['tenant_id' => $aminaTenant->id, 'property_id' => $oysterBayVilla->id],
            [
                'start_date' => now()->subMonths(3)->startOfMonth()->toDateString(),
                'end_date' => now()->addMonths(9)->endOfMonth()->toDateString(),
                'rent_amount' => 3200000,
                'terms' => 'Quarterly exterior maintenance by landlord. Tenant covers utilities and internet.',
                'status' => 'active',
            ]
        );

        Application::firstOrCreate(
            ['user_id' => $daniel->id, 'property_id' => $mikocheniStudio->id],
            [
                'status' => 'pending',
                'message' => 'I would like to move in next month and can commit to a one-year lease.',
                'offered_rent' => 400000,
                'landlord_notes' => null,
                'applied_at' => now()->subDays(4),
                'responded_at' => null,
            ]
        );

        Application::firstOrCreate(
            ['user_id' => $mike->id, 'property_id' => $masakiApartment->id],
            [
                'status' => 'approved',
                'message' => 'Ready to move in immediately and can provide references.',
                'offered_rent' => 850000,
                'landlord_notes' => 'Approved after verification.',
                'applied_at' => now()->subMonths(7),
                'responded_at' => now()->subMonths(6),
            ]
        );

        Application::firstOrCreate(
            ['user_id' => $amina->id, 'property_id' => $oysterBayVilla->id],
            [
                'status' => 'approved',
                'message' => 'Seeking a family home close to work and schools.',
                'offered_rent' => 3200000,
                'landlord_notes' => 'Approved for long-term lease.',
                'applied_at' => now()->subMonths(4),
                'responded_at' => now()->subMonths(3),
            ]
        );

        Payment::updateOrCreate(
            ['reference' => 'RENT-MIKE-2026-02'],
            [
                'user_id' => $mike->id,
                'tenant_id' => $mikeTenant->id,
                'property_id' => $masakiApartment->id,
                'agent_id' => $agent->id,
                'payment_method_id' => 1,
                'type' => 'rent',
                'amount' => 850000,
                'status' => 'completed',
                'description' => 'February rent for Modern 2-Bedroom Apartment',
                'due_date' => now()->subMonth()->startOfMonth()->addDays(4)->toDateString(),
                'paid_at' => now()->subMonth()->startOfMonth()->addDays(3),
                'metadata' => ['channel' => 'M-Pesa'],
            ]
        );

        Payment::updateOrCreate(
            ['reference' => 'RENT-MIKE-2026-03'],
            [
                'user_id' => $mike->id,
                'tenant_id' => $mikeTenant->id,
                'property_id' => $masakiApartment->id,
                'agent_id' => $agent->id,
                'payment_method_id' => 1,
                'type' => 'rent',
                'amount' => 850000,
                'status' => 'completed',
                'description' => 'March rent for Modern 2-Bedroom Apartment',
                'due_date' => now()->startOfMonth()->addDays(4)->toDateString(),
                'paid_at' => now()->startOfMonth()->addDays(2),
                'metadata' => ['channel' => 'M-Pesa'],
            ]
        );

        Payment::updateOrCreate(
            ['reference' => 'RENT-AMINA-2026-03'],
            [
                'user_id' => $amina->id,
                'tenant_id' => $aminaTenant->id,
                'property_id' => $oysterBayVilla->id,
                'agent_id' => $agent->id,
                'payment_method_id' => 2,
                'type' => 'rent',
                'amount' => 3200000,
                'status' => 'pending',
                'description' => 'March rent for Executive Villa, Oyster Bay',
                'due_date' => now()->startOfMonth()->addDays(4)->toDateString(),
                'paid_at' => null,
                'metadata' => ['channel' => 'Bank Transfer'],
            ]
        );

        Payment::updateOrCreate(
            ['reference' => 'COMM-MASAKI-2026-03'],
            [
                'user_id' => $landlord->id,
                'tenant_id' => $mikeTenant->id,
                'property_id' => $masakiApartment->id,
                'agent_id' => $agent->id,
                'payment_method_id' => null,
                'type' => 'commission',
                'amount' => 85000,
                'status' => 'completed',
                'description' => 'March commission for Modern 2-Bedroom Apartment',
                'due_date' => now()->startOfMonth()->addDays(5)->toDateString(),
                'paid_at' => now()->startOfMonth()->addDays(6),
                'metadata' => ['rate_percent' => 10],
            ]
        );

        Lead::updateOrCreate(
            ['agent_id' => $agent->id, 'email' => 'prospect.one@oweru.com'],
            [
                'property_id' => $mikocheniStudio->id,
                'user_id' => null,
                'name' => 'Prospect One',
                'phone' => '+255711111111',
                'message' => 'Interested in scheduling a viewing this weekend.',
                'source' => 'website',
                'status' => 'new',
            ]
        );

        Lead::updateOrCreate(
            ['agent_id' => $agent->id, 'email' => 'prospect.two@oweru.com'],
            [
                'property_id' => $upangaHouse->id,
                'user_id' => null,
                'name' => 'Prospect Two',
                'phone' => '+255722222222',
                'message' => 'Looking for a family rental near the city center.',
                'source' => 'facebook',
                'status' => 'contacted',
            ]
        );

        $marchRentPayment = Payment::where('reference', 'RENT-MIKE-2026-03')->first();
        $commissionPayment = Payment::where('reference', 'COMM-MASAKI-2026-03')->first();

        Commission::updateOrCreate(
            ['agent_id' => $agent->id, 'property_id' => $masakiApartment->id],
            [
                'payment_id' => $commissionPayment?->id ?? $marchRentPayment?->id,
                'amount' => 85000,
                'percentage' => 10,
                'status' => 'paid',
                'paid_at' => now()->startOfMonth()->addDays(6),
            ]
        );

        Commission::updateOrCreate(
            ['agent_id' => $agent->id, 'property_id' => $oysterBayVilla->id],
            [
                'payment_id' => null,
                'amount' => 120000,
                'percentage' => 3.75,
                'status' => 'pending',
                'paid_at' => null,
            ]
        );

        Message::firstOrCreate(
            [
                'sender_id' => $landlord->id,
                'recipient_id' => $mike->id,
                'subject' => 'Rent reminder',
            ],
            [
                'property_id' => $masakiApartment->id,
                'body' => 'Thanks for the on-time payment. Please remember the next rent cycle starts on the 5th.',
                'read_at' => now()->subDays(1),
                'created_at' => now()->subDays(2),
                'updated_at' => now()->subDays(2),
            ]
        );

        Message::firstOrCreate(
            [
                'sender_id' => $amina->id,
                'recipient_id' => $landlord->id,
                'subject' => 'Maintenance follow-up',
            ],
            [
                'property_id' => $oysterBayVilla->id,
                'body' => 'The backup generator was serviced yesterday. Please confirm the reimbursement process.',
                'read_at' => null,
                'created_at' => now()->subHours(18),
                'updated_at' => now()->subHours(18),
            ]
        );

        Message::firstOrCreate(
            [
                'sender_id' => $agent->id,
                'recipient_id' => $landlord->id,
                'subject' => 'Viewing feedback',
            ],
            [
                'property_id' => $mikocheniStudio->id,
                'body' => 'Two qualified prospects asked for a second viewing this week.',
                'read_at' => null,
                'created_at' => now()->subHours(10),
                'updated_at' => now()->subHours(10),
            ]
        );

        Notification::firstOrCreate(
            [
                'user_id' => $mike->id,
                'title' => 'Rent payment due soon',
            ],
            [
                'message' => 'Your next rent payment for the Masaki apartment is due in a few days.',
                'type' => 'payment',
                'read_at' => null,
                'archived_at' => null,
            ]
        );

        Notification::firstOrCreate(
            [
                'user_id' => $mike->id,
                'title' => 'Landlord replied to your message',
            ],
            [
                'message' => 'Jane Landlord has responded to your latest maintenance follow-up.',
                'type' => 'message',
                'read_at' => now()->subDay(),
                'archived_at' => null,
            ]
        );

        $this->command->info('Landlord demo data seeded successfully.');
    }
}

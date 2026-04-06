<?php

namespace Database\Seeders;

use App\Models\Lead;
use App\Models\Property;
use App\Models\User;
use Illuminate\Database\Seeder;

class LeadSeeder extends Seeder
{
    public function run(): void
    {
        // Get a sample agent and properties
        $agent = User::where('user_type', 'agent')->first();
        $properties = Property::where('agent_id', $agent->id)->get();

        if ($properties->isEmpty()) {
            $this->command->info('No properties found for agent. Skipping lead seeding.');
            return;
        }

        // Create sample leads for each property
        $sampleLeads = [
            [
                'name' => 'John Doe',
                'email' => 'john.doe@example.com',
                'phone' => '+255 123 456 789',
                'message' => 'I am interested in this property. When can I schedule a viewing?',
                'source' => 'website',
                'status' => 'new',
                'created_at' => now()->subDays(2),
            ],
            [
                'name' => 'Jane Smith',
                'email' => 'jane.smith@example.com',
                'phone' => '+255 987 654 321',
                'message' => 'Looking for a 2-bedroom apartment in this area.',
                'source' => 'website',
                'status' => 'contacted',
                'created_at' => now()->subDays(5),
            ],
            [
                'name' => 'Mike Johnson',
                'email' => 'mike.j@example.com',
                'phone' => '+255 555 123 456',
                'message' => 'Is this property still available?',
                'source' => 'whatsapp',
                'status' => 'interested',
                'created_at' => now()->subWeek(),
            ],
        ];

        foreach ($properties as $index => $property) {
            if (isset($sampleLeads[$index])) {
                $leadData = $sampleLeads[$index];
                $leadData['agent_id'] = $agent->id;
                $leadData['property_id'] = $property->id;
                
                Lead::create($leadData);
            }
        }

        $this->command->info('Sample leads created successfully!');
    }
}

<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\UserSession;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthDeviceIsolationTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_blocks_login_from_a_device_already_linked_to_another_account(): void
    {
        $firstUser = User::create([
            'first_name' => 'First',
            'last_name' => 'User',
            'email' => 'first@example.com',
            'password' => bcrypt('password123'),
            'phone' => '+255700000001',
            'user_type' => 'tenant',
            'is_active' => true,
        ]);

        $secondUser = User::create([
            'first_name' => 'Second',
            'last_name' => 'User',
            'email' => 'second@example.com',
            'password' => bcrypt('password123'),
            'phone' => '+255700000002',
            'user_type' => 'tenant',
            'is_active' => true,
        ]);

        UserSession::create([
            'user_id' => $firstUser->id,
            'device_fingerprint' => 'device-fingerprint-123',
            'ip_address' => '203.0.113.10',
            'user_agent' => 'Mozilla/5.0',
            'is_active' => true,
            'login_at' => now(),
            'last_seen_at' => now(),
        ]);

        $response = $this->withHeaders([
            'User-Agent' => 'Mozilla/5.0',
            'X-Forwarded-For' => '203.0.113.10',
        ])->postJson('/api/login', [
            'email' => $secondUser->email,
            'password' => 'password123',
            'user_type' => 'tenant',
        ]);

        $response->assertStatus(403);
        $response->assertJsonFragment([
            'message' => 'This device is already linked to another account. Please log out from the other account first.',
        ]);
    }
}

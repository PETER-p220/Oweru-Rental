<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\UserActivityLog;
use App\Models\UserSession;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Laravel\Socialite\Facades\Socialite;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'first_name' => 'required|string|max:255',
            'last_name'  => 'required|string|max:255',
            'email'      => 'required|string|email|max:255|unique:users',
            'password'   => 'required|string|min:8|confirmed',
            'phone'      => 'required|string|max:20',
            'user_type'  => 'required|in:tenant,landlord,agent,bnb_owner,commercial',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors'  => $validator->errors(),
            ], 422);
        }

        $user = User::create([
            'first_name' => $request->first_name,
            'last_name'  => $request->last_name,
            'email'      => $request->email,
            'password'   => Hash::make($request->password),
            'phone'      => $request->phone,
            'user_type'  => $request->user_type,
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Registration successful',
            'data'    => [
                'user'  => $this->formatUser($user),
                'token' => $token,
            ],
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email'     => 'required|email',
            'password'  => 'required',
            'user_type' => 'required|in:tenant,landlord,agent,bnb_owner,commercial,admin',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors'  => $validator->errors(),
            ], 422);
        }

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        if ($user->user_type !== $request->user_type) {
            return response()->json(['message' => 'User type mismatch'], 401);
        }

        if (! $user->is_active) {
            return response()->json(['message' => 'Account is inactive'], 401);
        }

        $deviceFingerprint = $this->buildDeviceFingerprint($request);
        $ipAddress = $this->resolveIpAddress($request);
        $userAgent = $request->header('User-Agent', 'unknown');

        $existingSession = UserSession::query()
            ->where('device_fingerprint', $deviceFingerprint)
            ->where('is_active', true)
            ->where('user_id', '!=', $user->id)
            ->first();

        if ($existingSession) {
            $existingSession->update(['is_active' => false, 'logout_at' => now()]);

            $existingSession->user?->activityLogs()->create([
                'action' => 'device_rejected',
                'description' => 'Blocked a login attempt on a device already linked to another account',
                'ip_address' => $ipAddress,
                'user_agent' => $userAgent,
                'device_fingerprint' => $deviceFingerprint,
                'metadata' => [
                    'attempted_user_id' => $user->id,
                    'attempted_user_email' => $user->email,
                    'blocked_user_id' => $existingSession->user_id,
                ],
            ]);

            return response()->json([
                'message' => 'This device is already linked to another account. Please log out from the other account first.',
            ], 403);
        }

        $user->tokens()->delete();

        $token = $user->createToken('auth_token')->plainTextToken;
        $tokenHash = hash('sha256', $token);

        UserSession::where('user_id', $user->id)->where('is_active', true)->update([
            'is_active' => false,
            'logout_at' => now(),
        ]);

        UserSession::create([
            'user_id' => $user->id,
            'device_fingerprint' => $deviceFingerprint,
            'token_hash' => $tokenHash,
            'ip_address' => $ipAddress,
            'user_agent' => $userAgent,
            'is_active' => true,
            'login_at' => now(),
            'last_seen_at' => now(),
        ]);

        $user->activityLogs()->create([
            'action' => 'login',
            'description' => 'User signed in successfully',
            'ip_address' => $ipAddress,
            'user_agent' => $userAgent,
            'device_fingerprint' => $deviceFingerprint,
            'metadata' => [
                'user_type' => $user->user_type,
            ],
        ]);

        return response()->json([
            'message' => 'Login successful',
            'data'    => [
                'user'  => $this->formatUser($user),
                'token' => $token,
            ],
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();
        $user?->currentAccessToken()?->delete();

        $user?->sessions()->where('is_active', true)->update([
            'is_active' => false,
            'logout_at' => now(),
        ]);

        $user?->activityLogs()->create([
            'action' => 'logout',
            'description' => 'User signed out successfully',
            'ip_address' => $this->resolveIpAddress($request),
            'user_agent' => $request->header('User-Agent', 'unknown'),
            'device_fingerprint' => $this->buildDeviceFingerprint($request),
        ]);

        return response()->json(['message' => 'Logout successful']);
    }

    public function user(Request $request): JsonResponse
    {
        return response()->json([
            'data' => $this->formatUser($request->user()),
        ]);
    }

    /**
     * Map DB snake_case fields → camelCase so the frontend
     * User interface matches without any extra transformation.
     */
    private function formatUser(User $user): array
    {
        return [
            'id'               => $user->id,
            'firstName'        => $user->first_name,
            'lastName'         => $user->last_name,
            'email'            => $user->email,
            'phone'            => $user->phone,
            'userType'         => $user->user_type,
            'profileImage'     => $user->profile_image,
            'bio'              => $user->bio,
            'isActive'         => $user->is_active,
            'emailVerifiedAt'  => $user->email_verified_at,
            'createdAt'        => $user->created_at,
            'updatedAt'        => $user->updated_at,
        ];
    }

    private function buildDeviceFingerprint(Request $request): string
    {
        $ipAddress = $this->resolveIpAddress($request);
        $userAgent = $request->header('User-Agent', 'unknown');

        return hash('sha256', $ipAddress . '|' . $userAgent);
    }

    private function resolveIpAddress(Request $request): string
    {
        return $request->header('CF-Connecting-IP')
            ?? $request->header('X-Forwarded-For')
            ?? $request->header('X-Real-IP')
            ?? $request->ip();
    }

    // ── Google OAuth for Web (Redirect Flow) ─────────────────────────────────────

    public function redirectToGoogle(Request $request): JsonResponse
    {
        $userType = $request->query('user_type', 'tenant');
        $state = json_encode(['user_type' => $userType, 'auth_type' => 'login']);
        
        $url = Socialite::driver('google')
            ->stateless()
            ->with(['state' => $state])
            ->redirect()
            ->getTargetUrl();
        
        return response()->json(['url' => $url]);
    }

    public function redirectToGoogleRegister(Request $request): JsonResponse
    {
        $userType = $request->query('user_type', 'tenant');
        $state = json_encode(['user_type' => $userType, 'auth_type' => 'register']);
        
        $url = Socialite::driver('google')
            ->stateless()
            ->with(['state' => $state])
            ->redirect()
            ->getTargetUrl();
        
        return response()->json(['url' => $url]);
    }

    public function handleGoogleCallback(Request $request): \Illuminate\Http\RedirectResponse|\Illuminate\Http\JsonResponse
    {
        try {
            $googleUser = Socialite::driver('google')->stateless()->user();
            
            // Try to get auth type from state parameter
            $state = $request->query('state');
            $stateData = $state ? json_decode($state, true) : [];
            
            $userType = $stateData['user_type'] ?? session('google_user_type', 'tenant');
            $authType = $stateData['auth_type'] ?? session('google_auth_type', 'login');
            
            $user = User::where('email', $googleUser->email)->first();
            
            if ($authType === 'register') {
                // Registration flow
                // Check if user already exists with this Google ID (any user type)
                $existingUser = User::where('google_id', $googleUser->id)->first();
                if ($existingUser) {
                    return response()->json([
                        'message' => 'This Google account is already registered. Please login instead.',
                    ], 400);
                }
                
                // Also check by email to prevent duplicate accounts
                $existingEmailUser = User::where('email', $googleUser->email)->first();
                if ($existingEmailUser) {
                    return response()->json([
                        'message' => 'This email is already registered. Please login instead.',
                    ], 400);
                }
                
                $nameParts = explode(' ', $googleUser->name, 2);
                $firstName = $nameParts[0] ?? '';
                $lastName = $nameParts[1] ?? '';
                
                $user = User::create([
                    'first_name' => $firstName,
                    'last_name' => $lastName,
                    'email' => $googleUser->email,
                    'password' => Hash::make(Str::random(16)), // Random password for OAuth users
                    'phone' => '',
                    'user_type' => $userType,
                    'google_id' => $googleUser->id,
                    'email_verified_at' => now(),
                    'is_active' => true,
                ]);
            } else {
                // Login flow
                if (!$user) {
                    $frontendUrl = config('app.frontend_url', 'https://rental.oweru.com');
                    $redirectUrl = "{$frontendUrl}/auth/error?error=user_not_found";
                    return redirect()->away($redirectUrl);
                }
                
                // Check if user type matches - one email can only have one user type
                if ($user->user_type !== $userType) {
                    $frontendUrl = config('app.frontend_url', 'https://rental.oweru.com');
                    $redirectUrl = "{$frontendUrl}/auth/error?error=wrong_user_type&registered_type={$user->user_type}";
                    return redirect()->away($redirectUrl);
                }
                
                if (!$user->google_id) {
                    $user->update(['google_id' => $googleUser->id]);
                }
            }
            
            if (!$user->is_active) {
                $frontendUrl = config('app.frontend_url', 'https://rental.oweru.com');
                $redirectUrl = "{$frontendUrl}/auth/error?error=account_inactive";
                return redirect()->away($redirectUrl);
            }
            
            // Revoke previous tokens
            $user->tokens()->delete();
            
            $token = $user->createToken('auth_token')->plainTextToken;
            
            // Redirect to frontend with token and user data
            $frontendUrl = config('app.frontend_url', 'https://rental.oweru.com');
            $redirectUrl = "{$frontendUrl}/auth/google/callback?token={$token}&user_type={$user->user_type}";
            
            return redirect()->away($redirectUrl);
            
        } catch (\Exception $e) {
            $frontendUrl = config('app.frontend_url', 'https://rental.oweru.com');
            $redirectUrl = "{$frontendUrl}/auth/error?error=auth_failed";
            return redirect()->away($redirectUrl);
        }
    }

    // ── Google OAuth for Mobile (ID Token Flow) ─────────────────────────────────

    public function loginWithGoogle(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'token' => 'required|string',
            'user_type' => 'required|in:tenant,landlord,agent,bnb_owner,commercial,admin',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $idToken = $request->token;
            $userType = $request->user_type;
            
            // Verify Google ID token by calling Google's token info endpoint
            $response = \Http::get('https://oauth2.googleapis.com/tokeninfo', [
                'id_token' => $idToken,
            ]);
            
            if (!$response->successful()) {
                return response()->json(['message' => 'Invalid Google ID token'], 401);
            }
            
            $tokenInfo = $response->json();
            $googleEmail = $tokenInfo['email'] ?? null;
            $googleId = $tokenInfo['sub'] ?? null;
            
            if (!$googleEmail || !$googleId) {
                return response()->json(['message' => 'Invalid token data'], 401);
            }
            
            // Verify the token is issued to our client
            $clientId = config('services.google.client_id');
            if ($tokenInfo['aud'] !== $clientId) {
                return response()->json(['message' => 'Token issued to wrong client'], 401);
            }
            
            $user = User::where('email', $googleEmail)->first();
            
            if (!$user) {
                return response()->json([
                    'message' => 'User not found. Please register first.',
                ], 404);
            }
            
            if ($user->user_type !== $userType) {
                return response()->json(['message' => 'User type mismatch'], 401);
            }
            
            if (!$user->google_id) {
                $user->update(['google_id' => $googleId]);
            }
            
            if (!$user->is_active) {
                return response()->json(['message' => 'Account is inactive'], 401);
            }
            
            // Revoke previous tokens
            $user->tokens()->delete();
            
            $token = $user->createToken('auth_token')->plainTextToken;
            
            return response()->json([
                'message' => 'Login successful',
                'data' => [
                    'user' => $this->formatUser($user),
                    'token' => $token,
                ],
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Google authentication failed',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function registerWithGoogle(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'token' => 'required|string',
            'user_type' => 'required|in:tenant,landlord,agent,bnb_owner,commercial',
            'phone' => 'nullable|string|max:20',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $idToken = $request->token;
            $userType = $request->user_type;
            $phone = $request->phone;
            
            // Verify Google ID token by calling Google's token info endpoint
            $response = \Http::get('https://oauth2.googleapis.com/tokeninfo', [
                'id_token' => $idToken,
            ]);
            
            if (!$response->successful()) {
                return response()->json(['message' => 'Invalid Google ID token'], 401);
            }
            
            $tokenInfo = $response->json();
            $googleEmail = $tokenInfo['email'] ?? null;
            $googleId = $tokenInfo['sub'] ?? null;
            $googleName = $tokenInfo['name'] ?? '';
            
            if (!$googleEmail || !$googleId) {
                return response()->json(['message' => 'Invalid token data'], 401);
            }
            
            // Verify the token is issued to our client
            $clientId = config('services.google.client_id');
            if ($tokenInfo['aud'] !== $clientId) {
                return response()->json(['message' => 'Token issued to wrong client'], 401);
            }
            
            $existingUser = User::where('email', $googleEmail)->first();
            
            if ($existingUser) {
                return response()->json([
                    'message' => 'User already exists. Please login instead.',
                ], 400);
            }
            
            $nameParts = explode(' ', $googleName, 2);
            $firstName = $nameParts[0] ?? '';
            $lastName = $nameParts[1] ?? '';
            
            $user = User::create([
                'first_name' => $firstName,
                'last_name' => $lastName,
                'email' => $googleEmail,
                'password' => Hash::make(Str::random(16)),
                'phone' => $phone ?? '',
                'user_type' => $userType,
                'google_id' => $googleId,
                'email_verified_at' => now(),
                'is_active' => true,
            ]);
            
            $token = $user->createToken('auth_token')->plainTextToken;
            
            return response()->json([
                'message' => 'Registration successful',
                'data' => [
                    'user' => $this->formatUser($user),
                    'token' => $token,
                ],
            ], 201);
            
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Google registration failed',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
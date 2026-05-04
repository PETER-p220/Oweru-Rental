<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

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

        // Revoke previous tokens (single-session) — remove if you want multi-device
        $user->tokens()->delete();

        $token = $user->createToken('auth_token')->plainTextToken;

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
        $request->user()->currentAccessToken()->delete();

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
}
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class RoleMiddleware
{
    public function handle(Request $request, Closure $next, string ...$roles)
    {
        if (!Auth::check()) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $user = Auth::user();
        
        // Check both user_type and userType for compatibility
        $userType = $user->user_type ?? $user->userType ?? '';
        
        // Debug: Log role checking
        \Log::info('RoleMiddleware - Checking roles:', [
            'user_id' => $user->id,
            'user_type' => $user->user_type,
            'userType' => $user->userType ?? 'not_set',
            'effective_user_type' => $userType,
            'required_roles' => $roles,
            'has_required_role' => in_array($userType, $roles),
            'user_attributes' => $user->toArray()
        ]);

        // Support multiple roles: role:admin  OR  role:landlord,agent
        if (!in_array($userType, $roles)) {
            return response()->json([
                'message' => 'Forbidden. Required role: ' . implode(' or ', $roles),
            ], 403);
        }

        return $next($request);
    }
}
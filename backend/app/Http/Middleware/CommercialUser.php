<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CommercialUser
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure(\Illuminate\Http\Request): (\Illuminate\Http\Response|\Illuminate\Http\RedirectResponse)  $next
     * @return \Illuminate\Http\Response|\Illuminate\Http\RedirectResponse
     */
    public function handle(Request $request, Closure $next)
    {
        if (!Auth::check()) {
            return redirect()->route('login')->with('error', 'Please login to access commercial dashboard.');
        }

        $user = Auth::user();

        if (!$user->hasRole('commercial')) {
            Auth::logout();
            return redirect()->route('login')->with('error', 'Access denied. Commercial account required.');
        }

        if ($user->status !== 'active') {
            Auth::logout();
            return redirect()->route('login')->with('error', 'Your account is not active. Please contact support.');
        }

        return $next($request);
    }
}

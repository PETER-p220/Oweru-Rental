<?php

use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\RoleMiddleware;
use App\Http\Middleware\UpdateUserOnlineStatus;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);

        $middleware->web(append: [
            HandleAppearance::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);

        $middleware->api(append: [
            UpdateUserOnlineStatus::class,
        ]);

        $middleware->alias([
            // 'role:admin', 'role:tenant' etc. in routes.php will now resolve correctly
            'role' => RoleMiddleware::class,
        ]);

        // Do NOT override 'auth' — Laravel's built-in auth middleware
        // handles Sanctum correctly. Overriding it breaks auth:sanctum.
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
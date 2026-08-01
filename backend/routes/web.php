<?php

use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;
use App\Http\Controllers\Api\PropertyShareController;

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

Route::get('/share/property/{property}', [PropertyShareController::class, 'showProperty'])
    ->name('share.property');
Route::get('/share/bnb/{property}', [PropertyShareController::class, 'showBnb'])
    ->name('share.bnb');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
});

require __DIR__.'/settings.php';

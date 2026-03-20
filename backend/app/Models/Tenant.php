<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Tenant extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'property_id',
        'move_in_date',
        'status',
    ];

    protected $casts = [
        'move_in_date' => 'date',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class, 'property_id');
    }

    public function contract(): HasOne
    {
        return $this->hasOne(Contract::class, 'tenant_id');
    }
}

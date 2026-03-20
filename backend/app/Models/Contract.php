<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Contract extends Model
{
    use HasFactory;

    protected $fillable = [
        'tenant_id',
        'property_id',
        'start_date',
        'end_date',
        'rent_amount',
        'terms',
        'status',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'rent_amount' => 'decimal:2',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'tenant_id');
    }

    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class, 'property_id');
    }
}

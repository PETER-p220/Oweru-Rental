<?php

namespace App\Support;

use App\Models\Property;

class PropertyShare
{
    public static function frontendOrigin(): string
    {
        return rtrim((string) config('app.frontend_url', config('app.url')), '/');
    }

    public static function apiOrigin(): string
    {
        return rtrim((string) config('app.url'), '/');
    }

    public static function propertyPageUrl(int $propertyId, ?int $agentId = null): string
    {
        $url = self::frontendOrigin() . '/property/' . $propertyId;
        if ($agentId !== null) {
            $url .= '?agent=' . $agentId;
        }

        return $url;
    }

    /** URL crawled by WhatsApp/Facebook — serves Open Graph HTML with property image. */
    public static function previewUrl(int $propertyId, ?int $agentId = null): string
    {
        $url = self::apiOrigin() . '/api/public/share/property/' . $propertyId;
        if ($agentId !== null) {
            $url .= '?agent=' . $agentId;
        }

        return $url;
    }

    public static function resolveImageUrl(Property $property): string
    {
        $property->loadMissing('propertyImages');

        $primary = $property->propertyImages->firstWhere('is_primary', true)
            ?? $property->propertyImages->first();

        if ($primary?->image_path) {
            return self::absoluteStorageUrl($primary->image_path);
        }

        $images = $property->images ?? [];
        if (! empty($images)) {
            $first = $images[0];
            $path = is_string($first)
                ? $first
                : ($first['image_path'] ?? $first['path'] ?? $first['url'] ?? '');

            if ($path) {
                return self::absoluteStorageUrl((string) $path);
            }
        }

        return self::frontendOrigin() . '/favicon.ico';
    }

    public static function absoluteStorageUrl(string $path): string
    {
        $path = trim($path);
        if ($path === '') {
            return self::frontendOrigin() . '/favicon.ico';
        }

        if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
            return $path;
        }

        if (str_starts_with($path, '/storage/')) {
            return self::apiOrigin() . $path;
        }

        if (str_starts_with($path, 'storage/')) {
            return self::apiOrigin() . '/' . $path;
        }

        return self::apiOrigin() . '/storage/' . ltrim($path, '/');
    }

    public static function buildDescription(Property $property): string
    {
        $parts = array_filter([
            $property->location ?: $property->address,
            $property->price ? 'TZS ' . number_format((float) $property->price, 0) . '/month' : null,
        ]);

        if (! empty($property->description)) {
            $desc = strip_tags((string) $property->description);
            $parts[] = mb_strlen($desc) > 120 ? mb_substr($desc, 0, 117) . '...' : $desc;
        }

        return implode(' · ', $parts) ?: 'View this listing on Oweru Rental.';
    }
}

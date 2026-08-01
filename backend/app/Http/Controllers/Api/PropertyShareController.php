<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BnbProperty;
use App\Models\Property;
use App\Support\PropertyShare;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class PropertyShareController extends Controller
{
    /**
     * HTML share preview for rental listings (WhatsApp / Facebook crawlers).
     */
    public function showProperty(Property $property, Request $request): Response
    {
        $property->load(['propertyImages']);

        $agentId = $request->filled('agent') ? (int) $request->input('agent') : null;
        if ($agentId && $agentId === (int) $property->agent_id) {
            try {
                $property->increment('clicks');
            } catch (\Exception $e) {
                // Non-blocking
            }
        }

        return $this->renderPreview(
            title: $property->title ?: 'Property on Oweru',
            description: PropertyShare::buildDescription($property),
            imageUrl: PropertyShare::resolveImageUrl($property),
            destinationUrl: PropertyShare::propertyPageUrl($property->id, $agentId),
            shareUrl: PropertyShare::previewUrl($property->id, $agentId, 'property'),
        );
    }

    /**
     * HTML share preview for BnB / short-stay listings.
     */
    public function showBnb(BnbProperty $property): Response
    {
        return $this->renderPreview(
            title: $property->title ?: 'Short Stay on Oweru',
            description: PropertyShare::buildBnbDescription($property),
            imageUrl: PropertyShare::resolveBnbImageUrl($property),
            destinationUrl: PropertyShare::bnbPageUrl($property->id),
            shareUrl: PropertyShare::previewUrl($property->id, null, 'bnb'),
        );
    }

    private function renderPreview(
        string $title,
        string $description,
        string $imageUrl,
        string $destinationUrl,
        string $shareUrl,
    ): Response {
        return response()->view('share.property', [
            'title'          => $title,
            'description'    => $description,
            'imageUrl'       => $imageUrl,
            'propertyUrl'    => $destinationUrl,
            'shareUrl'       => $shareUrl,
        ], 200)->header('Content-Type', 'text/html; charset=UTF-8');
    }
}

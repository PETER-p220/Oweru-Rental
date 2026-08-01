<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Property;
use App\Support\PropertyShare;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class PropertyShareController extends Controller
{
    /**
     * HTML share preview for link crawlers (WhatsApp, Facebook, etc.).
     * Includes og:image so the property photo appears in chat previews.
     */
    public function show(Property $property, Request $request): Response
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

        $title = $property->title ?: 'Property on Oweru';
        $description = PropertyShare::buildDescription($property);
        $imageUrl = PropertyShare::resolveImageUrl($property);
        $propertyUrl = PropertyShare::propertyPageUrl($property->id, $agentId);
        $shareUrl = PropertyShare::previewUrl($property->id, $agentId);

        return response()->view('share.property', [
            'title'       => $title,
            'description' => $description,
            'imageUrl'    => $imageUrl,
            'propertyUrl' => $propertyUrl,
            'shareUrl'    => $shareUrl,
        ], 200)->header('Content-Type', 'text/html; charset=UTF-8');
    }
}

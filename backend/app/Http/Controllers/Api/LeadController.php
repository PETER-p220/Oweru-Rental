<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Models\Property;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class LeadController extends Controller
{
    /**
     * Create a new lead from property contact form
     */
    public function createFromProperty(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'property_id' => 'required|exists:properties,id',
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'nullable|string|max:20',
            'message' => 'nullable|string|max:1000',
            'source' => 'nullable|string|in:website,whatsapp,email,phone,referral',
        ]);

        try {
            $property = Property::findOrFail($validated['property_id']);
            
            // Create the lead
            $lead = Lead::create([
                'agent_id' => $property->agent_id,
                'property_id' => $property->id,
                'user_id' => auth()->id(), // null if not authenticated
                'name' => $validated['name'],
                'email' => $validated['email'],
                'phone' => $validated['phone'] ?? null,
                'message' => $validated['message'] ?? null,
                'source' => $validated['source'] ?? 'website',
                'status' => 'new',
            ]);

            Log::info('🎯 New lead created', [
                'lead_id' => $lead->id,
                'property_id' => $property->id,
                'agent_id' => $property->agent_id,
                'source' => $lead->source,
            ]);

            return response()->json([
                'message' => 'Lead created successfully',
                'data' => $lead,
            ], 201);

        } catch (\Exception $e) {
            Log::error('❌ Failed to create lead', [
                'error' => $e->getMessage(),
                'request_data' => $validated,
            ]);

            return response()->json([
                'message' => 'Failed to create lead',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Create a lead from general contact form
     */
    public function createFromContact(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'nullable|string|max:20',
            'message' => 'required|string|max:1000',
            'source' => 'nullable|string|in:website,whatsapp,email,phone,referral',
        ]);

        try {
            // For general contact, assign to a default agent or the first available agent
            $defaultAgent = User::where('user_type', 'agent')->first();
            
            if (!$defaultAgent) {
                return response()->json([
                    'message' => 'No agents available at the moment',
                ], 404);
            }

            $lead = Lead::create([
                'agent_id' => $defaultAgent->id,
                'property_id' => null, // General inquiry
                'user_id' => auth()->id(),
                'name' => $validated['name'],
                'email' => $validated['email'],
                'phone' => $validated['phone'] ?? null,
                'message' => $validated['message'],
                'source' => $validated['source'] ?? 'website',
                'status' => 'new',
            ]);

            Log::info('🎯 General lead created', [
                'lead_id' => $lead->id,
                'agent_id' => $defaultAgent->id,
                'source' => $lead->source,
            ]);

            return response()->json([
                'message' => 'Lead created successfully',
                'data' => $lead,
            ], 201);

        } catch (\Exception $e) {
            Log::error('❌ Failed to create general lead', [
                'error' => $e->getMessage(),
                'request_data' => $validated,
            ]);

            return response()->json([
                'message' => 'Failed to create lead',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update lead status
     */
    public function updateStatus(Request $request, Lead $lead): JsonResponse
    {
        $this->authorize('update', $lead);

        $validated = $request->validate([
            'status' => 'required|string|in:new,contacted,interested,converted,lost',
        ]);

        try {
            $lead->update(['status' => $validated['status']]);

            Log::info('📊 Lead status updated', [
                'lead_id' => $lead->id,
                'old_status' => $lead->getOriginal('status'),
                'new_status' => $validated['status'],
            ]);

            return response()->json([
                'message' => 'Lead status updated successfully',
                'data' => $lead,
            ]);

        } catch (\Exception $e) {
            Log::error('❌ Failed to update lead status', [
                'error' => $e->getMessage(),
                'lead_id' => $lead->id,
            ]);

            return response()->json([
                'message' => 'Failed to update lead status',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}

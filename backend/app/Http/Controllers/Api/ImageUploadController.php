<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class ImageUploadController extends Controller
{
    /**
     * Upload an image file
     */
    public function upload(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'image' => 'required|image|mimes:jpeg,png,jpg,gif|max:5120', // 5MB max
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $image = $request->file('image');
            
            // Generate unique filename
            $filename = Str::uuid() . '.' . $image->getClientOriginalExtension();
            
            // Store in public storage
            $path = $image->storeAs('bnb-properties', $filename, 'public');
            
            // Get the public URL
            $url = Storage::url($path);
            
            return response()->json([
                'message' => 'Image uploaded successfully',
                'url' => $url,
                'filename' => $filename,
                'path' => $path,
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to upload image',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Upload multiple images
     */
    public function uploadMultiple(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'images' => 'required|array|max:10', // Max 10 images
            'images.*' => 'required|image|mimes:jpeg,png,jpg,gif|max:5120', // 5MB max each
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $uploadedImages = [];
            $images = $request->file('images');
            
            foreach ($images as $image) {
                $filename = Str::uuid() . '.' . $image->getClientOriginalExtension();
                $path = $image->storeAs('bnb-properties', $filename, 'public');
                $url = Storage::url($path);
                
                $uploadedImages[] = [
                    'url' => $url,
                    'filename' => $filename,
                    'path' => $path,
                ];
            }
            
            return response()->json([
                'message' => 'Images uploaded successfully',
                'images' => $uploadedImages,
                'count' => count($uploadedImages),
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to upload images',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete an image
     */
    public function delete(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'path' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $path = $request->input('path');
            
            if (Storage::disk('public')->exists($path)) {
                Storage::disk('public')->delete($path);
                
                return response()->json([
                    'message' => 'Image deleted successfully',
                    'path' => $path,
                ]);
            } else {
                return response()->json([
                    'message' => 'Image not found',
                    'path' => $path,
                ], 404);
            }
            
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to delete image',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}

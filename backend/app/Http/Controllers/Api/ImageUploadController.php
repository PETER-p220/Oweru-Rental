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
     * Upload a single image
     */
    public function upload(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'image' => 'required|image|mimes:jpeg,png,jpg,gif|max:5120',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $image = $request->file('image');
        $filename = Str::uuid() . '.' . $image->getClientOriginalExtension();
        $path = $image->storeAs('bnb-properties', $filename, 'public');
        $url = Storage::url($path);

        // Ensure full URL
        if (!str_starts_with($url, 'http')) {
            $url = config('app.url') . $url;
        }

        return response()->json([
            'message'  => 'Image uploaded successfully',
            'url'      => $url,
            'filename' => $filename,
            'path'     => $path,
        ]);
    }

    /**
     * Upload multiple images
     */
    public function uploadMultiple(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'images'   => 'required|array|max:10',
            'images.*' => 'required|image|mimes:jpeg,png,jpg,gif|max:5120',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors'  => $validator->errors(),
            ], 422);
        }

        $uploadedImages = [];
        $images = $request->file('images');

        foreach ($images as $image) {
            $filename = Str::uuid() . '.' . $image->getClientOriginalExtension();
            $path = $image->storeAs('bnb-properties', $filename, 'public');
            $url = Storage::url($path);

            if (!str_starts_with($url, 'http')) {
                $url = config('app.url') . $url;
            }

            $uploadedImages[] = [
                'url'      => $url,
                'filename' => $filename,
                'path'     => $path,
            ];
        }

        return response()->json([
            'message' => 'Images uploaded successfully',
            'images'  => $uploadedImages,
            'count'   => count($uploadedImages),
        ]);
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
                'errors'  => $validator->errors(),
            ], 422);
        }

        $path = $request->input('path');

        if (Storage::disk('public')->exists($path)) {
            Storage::disk('public')->delete($path);
            return response()->json([
                'message' => 'Image deleted successfully',
                'path'    => $path,
            ]);
        }

        return response()->json([
            'message' => 'Image not found',
            'path'    => $path,
        ], 404);
    }
}
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class WebhookTestController extends Controller
{
    /**
     * Endpoint simple para verificar si NinjaOne está enviando webhooks
     */
    public function test(Request $request): JsonResponse
    {
        // Log everything that comes in
        Log::info('Webhook test received', [
            'method' => $request->method(),
            'url' => $request->fullUrl(),
            'headers' => $request->headers->all(),
            'body' => $request->all(),
            'raw_body' => $request->getContent(),
            'timestamp' => now()
        ]);

        return response()->json([
            'status' => 'received',
            'timestamp' => now(),
            'method' => $request->method(),
            'data_received' => !empty($request->all())
        ]);
    }
}

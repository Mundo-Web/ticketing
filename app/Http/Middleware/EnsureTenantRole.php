<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureTenantRole
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'error' => 'Unauthorized'
            ], 401);
        }

        if (!$user->hasRole('member')) {
            return response()->json([
                'error' => 'Access denied. Tenant role required.'
            ], 403);
        }

        // Verificar que existe el perfil de tenant
        $tenant = $user->tenant;
        if (!$tenant) {
            return response()->json([
                'error' => 'Tenant profile not found'
            ], 404);
        }

        return $next($request);
    }
}

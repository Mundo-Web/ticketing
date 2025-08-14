<?php

namespace App\Http\Middleware;

use App\Models\Technical;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureChiefTechRole
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

        // Check if user has super-admin role (always allowed)
        if ($user->hasRole('super-admin')) {
            return $next($request);
        }

        // Check if user has technical-leader role (Chief Tech)
        if ($user->hasRole('technical-leader')) {
            return $next($request);
        }

        // Check if user is a default technical (Chief Tech via is_default field)
        if ($user->hasRole('technical')) {
            $technical = Technical::where('email', $user->email)->first();
            if ($technical && $technical->is_default) {
                return $next($request);
            }
        }

        return response()->json([
            'error' => 'Access denied. Chief Technical privileges required.'
        ], 403);
    }
}

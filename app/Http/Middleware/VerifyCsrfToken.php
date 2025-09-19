<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken as Middleware;

class VerifyCsrfToken extends Middleware
{
    /**
     * The URIs that should be excluded from CSRF verification.
     *
     * @var array<int, string>
     */
    protected $except = [
        // Excluir todas las rutas API
        'api/*',
        // Excluir webhooks
        'ninjaone/webhook',
        'webhook/*',
        // Excluir rutas específicas si es necesario
        'pusher/auth',
        'broadcasting/auth',
    ];
}
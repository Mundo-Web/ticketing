<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Event;
use Illuminate\Auth\Events\Login;
use Illuminate\Auth\Events\Logout;
use App\Listeners\LoginAuditListener;
use App\Listeners\LogoutAuditListener;
use App\Events\NotificationCreated;
use App\Listeners\SendPushNotificationListener;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Limpiar todos los listeners existentes para Login y Logout
        Event::forget(Login::class);
        Event::forget(Logout::class);
        
        // Registrar solo nuestros listeners
        Event::listen(Login::class, LoginAuditListener::class);
        Event::listen(Logout::class, LogoutAuditListener::class);
        
        // Registrar listener para push notifications
        Event::listen(NotificationCreated::class, SendPushNotificationListener::class);
    }
}

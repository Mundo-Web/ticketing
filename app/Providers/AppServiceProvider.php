<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

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
        // Las notificaciones de reagendamiento se manejan directamente 
        // en el método reschedule() del modelo Appointment para evitar duplicaciones
    }
}

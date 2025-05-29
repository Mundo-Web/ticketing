<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Show the login page.
     */
    public function create(Request $request): Response
    {
        return Inertia::render('auth/login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();

        $request->session()->regenerate();

        $user = $request->user();

        // Supongo que tienes roles con spatie y relaciones definidas
       if ($user->hasRole('member')) {
            // Obtener el building relacionado al tenant
            $tenant = $user->tenant; // Asumiendo relación User->tenant
    
            if ($tenant && $tenant->apartment) {
                
                //return redirect("/apartment/member/{$tenant->id}/devices");
                return redirect("/tickets");
            }
        }
    
        if ($user->hasRole('owner')) {
            $owner = $user->owner; // relación User->owner
    
            if ($owner && $owner->building) {
                $buildingId = $owner->building->id;
                return redirect("/buildings/{$buildingId}/apartments");
            }
        }
    
        if ($user->hasRole('doorman')) {
            $doorman = $user->doorman; // relación User->doorman
    
            if ($doorman && $doorman->building) {
                $buildingId = $doorman->building->id;
                return redirect("/buildings/{$buildingId}/apartments");
            }
        }

               // Supongo que tienes roles con spatie y relaciones definidas
       if ($user->hasRole('technical')) {
            // Obtener el building relacionado al tenant
            $technical = $user->technical; // Asumiendo relación User->tenant

            if ($technical && $technical->apartment) {

                //return redirect("/apartment/member/{$tenant->id}/devices");
                return redirect("/tickets");
            }
        }
    
        // Para super-admin u otros roles, o si no tiene building asignado, redirige a dashboard por defecto
        return redirect()->intended(route('dashboard', absolute: false));
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}

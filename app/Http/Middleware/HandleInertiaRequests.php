<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Inertia\Middleware;
use Tighten\Ziggy\Ziggy;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');

        $user = $request->user();
        $roles = $user ? $user->getRoleNames() : [];
        $extra = [];
        if ($user) {
            if ($roles->contains('member') && $user->tenant) {
                $extra['member'] = [
                    'id' => $user->tenant->id,
                    'name' => $user->tenant->name,
                    'apartment_id' => $user->tenant->apartment_id,
                    'photo' => $user->tenant->photo,
                    'phone' => $user->tenant->phone,
                ];
            }
            if ($roles->contains('owner') && $user->owner) {
                $extra['owner'] = [
                    'id' => $user->owner->id,
                    'name' => $user->owner->name,
                    'building_id' => $user->owner->building_id,
                    'photo' => $user->owner->photo,
                    'phone' => $user->owner->phone,
                ];
            }
            if ($roles->contains('doorman') && $user->doorman) {
                $extra['doorman'] = [
                    'id' => $user->doorman->id,
                    'name' => $user->doorman->name,
                    'building_id' => $user->doorman->building_id,
                    'photo' => $user->doorman->photo,
                    'phone' => $user->doorman->phone,
                    'shift' => $user->doorman->shift,
                ];
            }
            if ($roles->contains('technical') && $user->technical) {
                $extra['technical'] = [
                    'id' => $user->technical->id,
                    'name' => $user->technical->name,
                    'email' => $user->technical->email,
                    'photo' => $user->technical->photo,
                    'phone' => $user->technical->phone,
                    'shift' => $user->technical->shift,
                    'is_default' => (bool) $user->technical->is_default,
                ];
            }
        }
        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'auth' => [
                'user' => $user ? array_merge(
                    $user->only(['id', 'name', 'email']),
                    ['roles' => $roles],
                    $extra
                ) : null,
            ],
            'csrf_token' => csrf_token(), // Agregar token CSRF fresco
            'ziggy' => fn (): array => [
                ...(new Ziggy)->toArray(),
                'location' => $request->url(),
            ]
        ];
    }
}

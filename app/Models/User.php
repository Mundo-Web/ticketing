<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */

    use HasFactory, Notifiable, HasRoles, HasApiTokens;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'first_name',
        'last_name',
        'role',
        'email_notifications',
        'push_notifications',
        'notification_frequency',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'email_notifications' => 'boolean',
            'push_notifications' => 'boolean',
        ];
    }

    public function owner()
    {
        return $this->hasOne(Owner::class, 'email', 'email');
    }

    public function tenant()
    {
        return $this->hasOne(Tenant::class, 'email', 'email');
    }

    public function doorman()
    {
        return $this->hasOne(Doorman::class, 'email', 'email');
    }

    public function technical()
    {
        return $this->hasOne(Technical::class, 'email', 'email');
    }

    /**
     * Check if user is a Chief Technical (technical-leader role or default technical)
     */
    public function isChiefTech(): bool
    {
        // Check if user has technical-leader role
        if ($this->hasRole('technical-leader')) {
            return true;
        }

        // Check if user is a default technical
        if ($this->hasRole('technical')) {
            $technical = $this->technical;
            return $technical && $technical->is_default;
        }

        return false;
    }

    /**
     * Check if user has Chief Tech privileges (super-admin or Chief Tech)
     */
    public function hasChiefTechPrivileges(): bool
    {
        return $this->hasRole('super-admin') || $this->isChiefTech();
    }

}

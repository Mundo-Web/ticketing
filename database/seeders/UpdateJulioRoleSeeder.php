<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;

class UpdateJulioRoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Buscar el usuario por email
        $user = User::where('email', 'julio.izquierdo.mejia@gmail.com')->first();
        
        if (!$user) {
            $this->command->error('Usuario julio.izquierdo.mejia@gmail.com no encontrado');
            return;
        }
        
        $this->command->info("Usuario encontrado: {$user->name} ({$user->email})");
        $this->command->info("Roles actuales: " . $user->getRoleNames()->implode(', '));
        
        // Asegurar que el rol member existe
        $memberRole = Role::firstOrCreate(['name' => 'member']);
        
        // Quitar todos los roles actuales
        $user->syncRoles([]); // Esto quita todos los roles
        $this->command->info("Todos los roles han sido removidos");
        
        // Asignar solo el rol member
        $user->assignRole('member');
        $this->command->info("Rol 'member' asignado");
        
        // Verificar el resultado
        $user->refresh();
        $this->command->info("Roles finales: " . $user->getRoleNames()->implode(', '));
        
        $this->command->info("✅ Roles del usuario actualizados correctamente");
    }
}

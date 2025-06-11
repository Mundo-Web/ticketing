<?php

namespace Database\Seeders;

use App\Models\Brand;
use App\Models\Device;
use App\Models\DeviceModel;
use App\Models\NameDevice;
use App\Models\System;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class UpdateDeviceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Confirmar limpieza de tablas
        if ($this->command->confirm('⚠️  ¿Estás seguro de que quieres limpiar todas las tablas de dispositivos?', false)) {
            // Limpiar las tablas en orden inverso para respetar las foreign keys
            $this->command->info('🧹 Limpiando tablas relacionadas con dispositivos...');
            
            // Deshabilitar verificaciones de foreign key temporalmente
            DB::statement('SET FOREIGN_KEY_CHECKS=0;');
            
            // Limpiar las tablas en orden inverso
            DB::table('devices')->truncate();
            DB::table('systems')->truncate();
            DB::table('models')->truncate();
            DB::table('brands')->truncate();
            DB::table('name_devices')->truncate();
            
            // Rehabilitar verificaciones de foreign key
            DB::statement('SET FOREIGN_KEY_CHECKS=1;');
            
            $this->command->info('✅ Tablas limpiadas correctamente');
        } else {
            $this->command->info('⏭️ Saltando limpieza de tablas, usando datos existentes...');
        }
        
         $devices = [
            ['device_name' => 'iPhone', 'brand' => 'Apple', 'model' => 'iPhone 13 Pro', 'system' => 'iOS 17.04.2001'],
            ['device_name' => 'iPhone', 'brand' => 'Apple', 'model' => 'iPhone 12', 'system' => 'iOS 16.07.2007'],
            ['device_name' => 'iPad', 'brand' => 'Apple', 'model' => 'iPad Air 5th Gen', 'system' => 'iPadOS 17.4'],
            ['device_name' => 'MacBook', 'brand' => 'Apple', 'model' => 'MacBook Pro M2 2023', 'system' => 'macOS Sonoma 14.4'],
            ['device_name' => 'MacBook', 'brand' => 'Apple', 'model' => 'MacBook Air M1 2020', 'system' => 'macOS Ventura 13.6'],
            ['device_name' => 'Surface Laptop', 'brand' => 'Microsoft', 'model' => 'Surface Laptop 5', 'system' => 'Windows 11 23H2'],
            ['device_name' => 'Dell Laptop', 'brand' => 'Dell', 'model' => 'XPS 13', 'system' => 'Windows 11 22H2'],
            ['device_name' => 'Smart TV', 'brand' => 'Samsung', 'model' => 'QLED Q80A', 'system' => 'Tizen OS 2022'],
            ['device_name' => 'Smart TV', 'brand' => 'LG', 'model' => 'OLED C2', 'system' => 'webOS 22'],
            ['device_name' => 'Smart TV', 'brand' => 'TCL', 'model' => 'TCL 5-Series Roku', 'system' => 'Roku OS 11.5'],
            ['device_name' => 'Router Mesh', 'brand' => 'eero', 'model' => 'eero 6 Pro', 'system' => 'eero OS 06.11.2001'],
            ['device_name' => 'Router Mesh', 'brand' => 'Google', 'model' => 'Nest WiFi Pro', 'system' => 'Google Home OS 2.61.1'],
        ];

        foreach ($devices as $data) {
            // 1. Crear NameDevice (tipo de dispositivo)
            $nameDevice = NameDevice::firstOrCreate(['name' => $data['device_name']]);
            
            // 2. Crear Brand relacionado con NameDevice
            $brand = Brand::firstOrCreate([
                'name' => $data['brand'],
                'name_device_id' => $nameDevice->id
            ]);
            
            // 3. Crear Model relacionado con Brand
            $model = DeviceModel::firstOrCreate([
                'name' => $data['model'],
                'brand_id' => $brand->id
            ]);
            
            // 4. Crear System relacionado con Model
            $system = System::firstOrCreate([
                'name' => $data['system'],
                'model_id' => $model->id
            ]);

            // 5. Crear Device con todas las relaciones
            Device::firstOrCreate([
                'name' => $data['model'], // Usar el modelo como nombre del dispositivo
                'name_device_id' => $nameDevice->id,
                'brand_id' => $brand->id,
                'model_id' => $model->id,
                'system_id' => $system->id,
            ], [
                'status' => 'active',
            ]);
        }

        $this->command->info('✅ Dispositivos creados con relaciones correctas');
        $this->command->info('- NameDevices: ' . NameDevice::count());
        $this->command->info('- Brands: ' . Brand::count());
        $this->command->info('- Models: ' . DeviceModel::count());
        $this->command->info('- Systems: ' . System::count());
        $this->command->info('- Devices: ' . Device::count());
    }
}

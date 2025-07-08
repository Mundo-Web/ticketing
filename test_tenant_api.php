<?php

/**
 * Test script para la API de Tenants
 * 
 * Ejecutar desde el navegador o línea de comandos:
 * php test_tenant_api.php
 */

// URL base de tu API
$baseUrl = 'http://127.0.0.1:8000/api';

// Datos de prueba
$testEmail = 'johnhenn61@mail.com';
$testPassword = 'johnhenn61@mail.com'; // Asumiendo que la contraseña es igual al email

echo "=== TEST API TENANT ===\n\n";

// Función para hacer peticiones HTTP
function makeRequest($url, $method = 'GET', $data = null, $headers = []) {
    $ch = curl_init();
    
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HEADER, false);
    curl_setopt($ch, CURLOPT_HTTPHEADER, array_merge([
        'Content-Type: application/json',
        'Accept: application/json'
    ], $headers));
    
    if ($method === 'POST') {
        curl_setopt($ch, CURLOPT_POST, true);
        if ($data) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        }
    }
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    
    if (curl_error($ch)) {
        echo "CURL Error: " . curl_error($ch) . "\n";
        curl_close($ch);
        return false;
    }
    
    curl_close($ch);
    
    return [
        'code' => $httpCode,
        'body' => json_decode($response, true),
        'raw' => $response
    ];
}

// Test 1: Login
echo "1. Testing Login...\n";
$loginResponse = makeRequest("$baseUrl/tenant/login", 'POST', [
    'email' => $testEmail,
    'password' => $testPassword
]);

if ($loginResponse && $loginResponse['code'] === 200) {
    echo "✅ Login successful\n";
    $token = $loginResponse['body']['token'];
    echo "Token: " . substr($token, 0, 20) . "...\n\n";
} else {
    echo "❌ Login failed\n";
    echo "Response: " . ($loginResponse['raw'] ?? 'No response') . "\n\n";
    exit(1);
}

// Headers con token para peticiones autenticadas
$authHeaders = ["Authorization: Bearer $token"];

// Test 2: Get Profile
echo "2. Testing Get Profile...\n";
$profileResponse = makeRequest("$baseUrl/tenant/me", 'GET', null, $authHeaders);

if ($profileResponse && $profileResponse['code'] === 200) {
    echo "✅ Profile retrieved successfully\n";
    $tenant = $profileResponse['body']['tenant'];
    echo "Tenant: {$tenant['name']} ({$tenant['email']})\n";
    if (isset($tenant['apartment'])) {
        echo "Apartment: {$tenant['apartment']['name']}\n";
        if (isset($tenant['apartment']['building'])) {
            echo "Building: {$tenant['apartment']['building']['name']}\n";
        }
    }
    echo "\n";
} else {
    echo "❌ Profile retrieval failed\n";
    echo "Response: " . ($profileResponse['raw'] ?? 'No response') . "\n\n";
}

// Test 3: Get Devices
echo "3. Testing Get Devices...\n";
$devicesResponse = makeRequest("$baseUrl/tenant/devices", 'GET', null, $authHeaders);

if ($devicesResponse && $devicesResponse['code'] === 200) {
    echo "✅ Devices retrieved successfully\n";
    $devices = $devicesResponse['body'];
    echo "Own devices: " . count($devices['own_devices']) . "\n";
    echo "Shared devices: " . count($devices['shared_devices']) . "\n\n";
} else {
    echo "❌ Devices retrieval failed\n";
    echo "Response: " . ($devicesResponse['raw'] ?? 'No response') . "\n\n";
}

// Test 4: Get Tickets
echo "4. Testing Get Tickets...\n";
$ticketsResponse = makeRequest("$baseUrl/tenant/tickets", 'GET', null, $authHeaders);

if ($ticketsResponse && $ticketsResponse['code'] === 200) {
    echo "✅ Tickets retrieved successfully\n";
    $tickets = $ticketsResponse['body']['tickets'];
    echo "Total tickets: " . count($tickets) . "\n\n";
} else {
    echo "❌ Tickets retrieval failed\n";
    echo "Response: " . ($ticketsResponse['raw'] ?? 'No response') . "\n\n";
}

// Test 5: Get Apartment
echo "5. Testing Get Apartment...\n";
$apartmentResponse = makeRequest("$baseUrl/tenant/apartment", 'GET', null, $authHeaders);

if ($apartmentResponse && $apartmentResponse['code'] === 200) {
    echo "✅ Apartment retrieved successfully\n";
    $apartment = $apartmentResponse['body']['apartment'];
    echo "Apartment: {$apartment['name']}\n";
    echo "Other tenants: " . count($apartment['other_tenants']) . "\n\n";
} else {
    echo "❌ Apartment retrieval failed\n";
    echo "Response: " . ($apartmentResponse['raw'] ?? 'No response') . "\n\n";
}

// Test 6: Get Building
echo "6. Testing Get Building...\n";
$buildingResponse = makeRequest("$baseUrl/tenant/building", 'GET', null, $authHeaders);

if ($buildingResponse && $buildingResponse['code'] === 200) {
    echo "✅ Building retrieved successfully\n";
    $building = $buildingResponse['body']['building'];
    echo "Building: {$building['name']}\n";
    echo "Address: {$building['address']}\n\n";
} else {
    echo "❌ Building retrieval failed\n";
    echo "Response: " . ($buildingResponse['raw'] ?? 'No response') . "\n\n";
}

// Test 7: Get Doormen
echo "7. Testing Get Doormen...\n";
$doormenResponse = makeRequest("$baseUrl/tenant/doormen", 'GET', null, $authHeaders);

if ($doormenResponse && $doormenResponse['code'] === 200) {
    echo "✅ Doormen retrieved successfully\n";
    $doormen = $doormenResponse['body']['doormen'];
    echo "Total doormen: " . count($doormen) . "\n\n";
} else {
    echo "❌ Doormen retrieval failed\n";
    echo "Response: " . ($doormenResponse['raw'] ?? 'No response') . "\n\n";
}

// Test 8: Get Owner
echo "8. Testing Get Owner...\n";
$ownerResponse = makeRequest("$baseUrl/tenant/owner", 'GET', null, $authHeaders);

if ($ownerResponse && $ownerResponse['code'] === 200) {
    echo "✅ Owner retrieved successfully\n";
    $owner = $ownerResponse['body']['owner'];
    echo "Owner: {$owner['name']} ({$owner['email']})\n\n";
} else {
    echo "❌ Owner retrieval failed\n";
    echo "Response: " . ($ownerResponse['raw'] ?? 'No response') . "\n\n";
}

// Test 9: Create Ticket (solo si hay devices)
if (isset($devices) && count($devices['own_devices']) > 0) {
    echo "9. Testing Create Ticket...\n";
    $deviceId = $devices['own_devices'][0]['id'];
    
    $ticketResponse = makeRequest("$baseUrl/tenant/tickets", 'POST', [
        'device_id' => $deviceId,
        'category' => 'Hardware',
        'title' => 'Test ticket from API',
        'description' => 'This is a test ticket created via API',
        'priority' => 'medium'
    ], $authHeaders);
    
    if ($ticketResponse && $ticketResponse['code'] === 201) {
        echo "✅ Ticket created successfully\n";
        $newTicket = $ticketResponse['body']['ticket'];
        echo "Ticket ID: {$newTicket['id']}\n";
        echo "Title: {$newTicket['title']}\n\n";
        
        // Test 10: Get Ticket Detail
        echo "10. Testing Get Ticket Detail...\n";
        $ticketDetailResponse = makeRequest("$baseUrl/tenant/tickets/{$newTicket['id']}", 'GET', null, $authHeaders);
        
        if ($ticketDetailResponse && $ticketDetailResponse['code'] === 200) {
            echo "✅ Ticket detail retrieved successfully\n";
            $ticketDetail = $ticketDetailResponse['body']['ticket'];
            echo "Ticket: {$ticketDetail['title']}\n";
            echo "Status: {$ticketDetail['status']}\n";
            echo "Histories: " . count($ticketDetail['histories']) . "\n\n";
        } else {
            echo "❌ Ticket detail retrieval failed\n";
            echo "Response: " . ($ticketDetailResponse['raw'] ?? 'No response') . "\n\n";
        }
    } else {
        echo "❌ Ticket creation failed\n";
        echo "Response: " . ($ticketResponse['raw'] ?? 'No response') . "\n\n";
    }
} else {
    echo "9. Skipping Create Ticket (no devices available)\n\n";
}

// Test Final: Logout
echo "Final. Testing Logout...\n";
$logoutResponse = makeRequest("$baseUrl/tenant/logout", 'POST', null, $authHeaders);

if ($logoutResponse && $logoutResponse['code'] === 200) {
    echo "✅ Logout successful\n";
} else {
    echo "❌ Logout failed\n";
    echo "Response: " . ($logoutResponse['raw'] ?? 'No response') . "\n";
}

echo "\n=== TEST COMPLETED ===\n";

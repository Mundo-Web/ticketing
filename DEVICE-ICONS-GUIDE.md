# 🎨 Device Icons - API Integration Guide

## 📋 Información General

El campo `icon_id` en los dispositivos permite asociar iconos específicos para una mejor experiencia visual en las aplicaciones cliente.

### ✅ **Implementado en:**
- **Backend API:** ✅ Campo `icon_id` incluido en todas las respuestas de devices
- **Endpoints afectados:**
  - `GET /api/tenant/devices` 
  - `GET /api/tenant/tickets`
  - `GET /api/tenant/tickets/{id}`

---

## 🎯 **Estructura de Response con icon_id**

### **Devices Endpoint:**
```json
{
    "own_devices": [
        {
            "id": 1,
            "name": "Smart TV Samsung",
            "status": true,
            "ubicacion": "Living Room",
            "brand": "Samsung",
            "model": "QN75Q80A",
            "system": "Tizen",
            "device_type": "Television",
            "icon_id": "tv"
        }
    ],
    "shared_devices": [
        {
            "id": 2,
            "name": "WiFi Router",
            "status": true,
            "ubicacion": "Utility Room",
            "brand": "Linksys",
            "model": "EA7500",
            "system": "Linux",
            "device_type": "Network",
            "icon_id": "router",
            "owner": {
                "id": 5,
                "name": "Building Owner",
                "email": "owner@building.com"
            }
        }
    ]
}
```

### **Tickets Endpoint:**
```json
{
    "tickets": [
        {
            "id": 123,
            "title": "TV Screen Flickering",
            "description": "The TV screen flickers intermittently",
            "category": "Hardware",
            "status": "open",
            "priority": "medium",
            "created_at": "2025-01-15T10:30:00.000000Z",
            "updated_at": "2025-01-15T10:30:00.000000Z",
            "device": {
                "id": 1,
                "name": "Smart TV Samsung",
                "brand": "Samsung",
                "model": "QN75Q80A",
                "system": "Tizen",
                "device_type": "Television",
                "icon_id": "tv"
            },
            "technical": null,
            "histories_count": 2
        }
    ]
}
```

---

## 🎨 **Iconos Disponibles**

### **Ejemplos de icon_id comunes:**

| icon_id | Descripción | Device Type |
|---------|-------------|-------------|
| `tv` | Televisión | Television |
| `laptop` | Laptop/Computadora portátil | Computer |
| `monitor` | Monitor de computadora | Computer |
| `smartphone` | Teléfono inteligente | Mobile |
| `router` | Router de red | Network |
| `wifi` | Dispositivo WiFi | Network |
| `speaker` | Altavoz/Parlante | Audio |
| `headphones` | Audífonos | Audio |
| `camera` | Cámara | Security |
| `thermometer` | Termostato/Clima | Climate |
| `lightbulb` | Luces inteligentes | Lighting |
| `microwave` | Microondas | Kitchen |
| `washing-machine` | Lavadora | Appliance |
| `refrigerator` | Refrigerador | Appliance |
| `game-controller` | Consola de videojuegos | Entertainment |

---

## 🛠️ **Implementación en React Native**

### **1. Mapping de Iconos:**
```javascript
const deviceIcons = {
    'tv': '📺',
    'laptop': '💻',
    'monitor': '🖥️',
    'smartphone': '📱',
    'router': '📡',
    'wifi': '📶',
    'speaker': '🔊',
    'headphones': '🎧',
    'camera': '📷',
    'thermometer': '🌡️',
    'lightbulb': '💡',
    'microwave': '📊',
    'washing-machine': '👕',
    'refrigerator': '❄️',
    'game-controller': '🎮',
    // Fallback
    'default': '📋'
};

// Función helper
const getDeviceIcon = (iconId) => {
    return deviceIcons[iconId] || deviceIcons['default'];
};
```

### **2. Componente de Device:**
```jsx
const DeviceItem = ({ device }) => {
    return (
        <View style={styles.deviceContainer}>
            <View style={styles.iconContainer}>
                <Text style={styles.deviceIcon}>
                    {getDeviceIcon(device.icon_id)}
                </Text>
            </View>
            <View style={styles.deviceInfo}>
                <Text style={styles.deviceName}>{device.name}</Text>
                <Text style={styles.deviceType}>{device.device_type}</Text>
                <Text style={styles.deviceBrand}>
                    {device.brand} {device.model}
                </Text>
            </View>
            <View style={styles.statusContainer}>
                <View style={[
                    styles.statusIndicator, 
                    { backgroundColor: device.status ? '#4CAF50' : '#F44336' }
                ]} />
            </View>
        </View>
    );
};
```

### **3. Lista de Dispositivos:**
```jsx
const DevicesList = ({ devices }) => {
    return (
        <FlatList
            data={devices}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => <DeviceItem device={item} />}
            showsVerticalScrollIndicator={false}
        />
    );
};
```

### **4. Uso en Tickets:**
```jsx
const TicketItem = ({ ticket }) => {
    const deviceIcon = getDeviceIcon(ticket.device?.icon_id);
    
    return (
        <View style={styles.ticketContainer}>
            <View style={styles.ticketHeader}>
                <Text style={styles.deviceIcon}>{deviceIcon}</Text>
                <Text style={styles.ticketTitle}>{ticket.title}</Text>
                <StatusBadge status={ticket.status} />
            </View>
            <Text style={styles.ticketDescription}>
                {ticket.description}
            </Text>
            <View style={styles.ticketFooter}>
                <Text style={styles.deviceName}>
                    {ticket.device?.name}
                </Text>
                <Text style={styles.ticketDate}>
                    {formatDate(ticket.created_at)}
                </Text>
            </View>
        </View>
    );
};
```

---

## 🎨 **Alternativa con Librería de Iconos**

### **Usando React Native Vector Icons:**
```javascript
import Icon from 'react-native-vector-icons/MaterialIcons';

const deviceIconMap = {
    'tv': 'tv',
    'laptop': 'laptop',
    'monitor': 'computer',
    'smartphone': 'smartphone',
    'router': 'router',
    'wifi': 'wifi',
    'speaker': 'speaker',
    'headphones': 'headset',
    'camera': 'camera-alt',
    'thermometer': 'thermostat',
    'lightbulb': 'lightbulb',
    'microwave': 'microwave',
    'washing-machine': 'local-laundry-service',
    'refrigerator': 'kitchen',
    'game-controller': 'sports-esports',
    'default': 'devices'
};

const DeviceIcon = ({ iconId, size = 24, color = '#666' }) => {
    const iconName = deviceIconMap[iconId] || deviceIconMap['default'];
    
    return (
        <Icon 
            name={iconName} 
            size={size} 
            color={color} 
        />
    );
};

// Uso
<DeviceIcon iconId={device.icon_id} size={32} color="#4CAF50" />
```

---

## 🔧 **Ejemplo de Implementación Completa**

### **Service para API:**
```javascript
class DeviceService {
    static async getDevices() {
        try {
            const response = await fetch('/api/tenant/devices', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            
            // Los devices ya incluyen icon_id
            return {
                ownDevices: data.own_devices,
                sharedDevices: data.shared_devices
            };
        } catch (error) {
            console.error('Error fetching devices:', error);
            throw error;
        }
    }
}
```

### **Hook personalizado:**
```javascript
const useDevices = () => {
    const [devices, setDevices] = useState({ own: [], shared: [] });
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        const fetchDevices = async () => {
            try {
                const data = await DeviceService.getDevices();
                setDevices({
                    own: data.ownDevices,
                    shared: data.sharedDevices
                });
            } catch (error) {
                console.error('Error:', error);
            } finally {
                setLoading(false);
            }
        };
        
        fetchDevices();
    }, []);
    
    return { devices, loading };
};
```

---

## ✅ **Beneficios del icon_id**

1. **UX Mejorada:** Identificación visual rápida de dispositivos
2. **Consistencia:** Iconos uniformes en toda la aplicación
3. **Flexibilidad:** Fácil cambio de iconos sin afectar datos
4. **Performance:** No requiere carga de imágenes externas
5. **Escalabilidad:** Fácil agregar nuevos tipos de dispositivos

---

## 🚀 **Estado de Implementación**

- ✅ **Backend API:** Campo `icon_id` incluido en todas las respuestas
- ✅ **Documentación:** API documentation actualizada
- ✅ **Endpoints:** `/tenant/devices`, `/tenant/tickets`, `/tenant/tickets/{id}`
- ✅ **Compatibilidad:** Totalmente retrocompatible

**¡El campo `icon_id` está listo para usar en aplicaciones cliente!** 🎉

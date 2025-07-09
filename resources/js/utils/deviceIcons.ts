// Device icon utility functions
import React from 'react';
import * as LucideIcons from 'lucide-react';
import deviceIconsData from '@/data/deviceIcons.json';

export interface DeviceIconData {
  id: string;
  namstring;
  icon: string;
  color: string;
}

export interface DeviceCategory {
  name: string;
  devices: DeviceIconData[];
}

export interface DeviceIconsConfig {
  categories: Record<string, DeviceCategory>;
}

const deviceIcons: DeviceIconsConfig = deviceIconsData;

export const getDeviceIcon = (iconName: string) => {
  const IconComponent = (LucideIcons as unknown as Record<string, React.ComponentType<unknown>>)[iconName];
  return IconComponent || LucideIcons.Cpu; // Fallback to Cpu icon
};

export const getAllDeviceIcons = (): DeviceIconData[] => {
  const allDevices: DeviceIconData[] = [];
  Object.values(deviceIcons.categories).forEach(category => {
    allDevices.push(...category.devices);
  });
  return allDevices;
};

export const getDeviceIconsByCategory = () => {
  return deviceIcons.categories;
};

export const findDeviceIconById = (id: string): DeviceIconData | null => {
  console.log('findDeviceIconById called with:', {
    id,
    type: typeof id,
    length: id?.length,
    trimmed: id?.trim(),
    originalId: JSON.stringify(id)
  });
  
  if (!id || typeof id !== 'string') {
    console.log('findDeviceIconById: Invalid id provided');
    return null;
  }
  
  const allDevices = getAllDeviceIcons();
  
  console.log('Available device icons:', allDevices.map(d => d.id));
  
  // First try exact match
  let found = allDevices.find(device => device.id === id);
  
  // If not found, try trimmed match
  if (!found) {
    const trimmedId = id.trim();
    found = allDevices.find(device => device.id === trimmedId);
    console.log('findDeviceIconById: Trying trimmed match:', { originalId: id, trimmedId, found: !!found });
  }
  
  // If still not found, try lowercase match
  if (!found) {
    const lowerId = id.toLowerCase().trim();
    found = allDevices.find(device => device.id.toLowerCase() === lowerId);
    console.log('findDeviceIconById: Trying lowercase match:', { originalId: id, lowerId, found: !!found });
  }
  
  console.log('findDeviceIconById result:', {
    originalId: id,
    found: !!found,
    foundId: found?.id,
    foundIcon: found?.icon
  });
  
  return found || null;
};

export default deviceIcons;

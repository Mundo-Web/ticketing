// Device icon component for rendering device icons
import React from 'react';
import * as LucideIcons from 'lucide-react';
import { findDeviceIconById } from '@/utils/deviceIcons';

interface DeviceIconProps {
  deviceIconId?: string;
  size?: number;
  className?: string;
}

const DeviceIcon: React.FC<DeviceIconProps> = ({ 
  deviceIconId, 
  size = 20, 
  className = '' 
}) => {
  // Debug logging
  console.log('DeviceIcon Debug:', {
    deviceIconId,
    type: typeof deviceIconId,
    length: deviceIconId?.length
  });
  
  const deviceData = deviceIconId ? findDeviceIconById(deviceIconId) : null;
  
  console.log('DeviceIcon Found Data:', {
    deviceIconId,
    deviceData,
    found: !!deviceData
  });
  
  if (!deviceData) {
    console.log('DeviceIcon: Using fallback for', deviceIconId);
    const DefaultIcon = LucideIcons.Cpu;
    return (
      <DefaultIcon 
        size={size} 
        className={className} 
        style={{ color: '#6B7280' }} 
      />
    );
  }
  
  const iconName = deviceData.icon;
  const IconComponent = (LucideIcons as unknown as Record<string, React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>>)[iconName] || LucideIcons.Cpu;
  
  console.log('DeviceIcon: Using icon', iconName, 'for', deviceIconId);
  
  return (
    <IconComponent 
      size={size} 
      className={className} 
      style={{ color: deviceData.color }} 
    />
  );
};

export default DeviceIcon;

import React from 'react';
import { CustomTooltip } from '@/components/ui/custom-tooltip';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DownloadCloud, Edit, Trash2, Users, Building, Calendar } from 'lucide-react';

interface RichTooltipProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  stats?: Array<{
    label: string;
    value: string | number;
    icon?: React.ReactNode;
  }>;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export function RichTooltip({ 
  children, 
  title, 
  description, 
  stats = [],
  variant = 'default',
  position = 'top' 
}: RichTooltipProps) {
  
  const content = (
    <div className="p-1 max-w-sm">
      <div className="font-semibold text-sm mb-1 text-center">{title}</div>
      {description && (
        <div className="text-xs opacity-90 mb-2 text-center">{description}</div>
      )}
      {stats.length > 0 && (
        <div className="space-y-1">
          {stats.map((stat, index) => (
            <div key={index} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1">
                {stat.icon}
                <span>{stat.label}:</span>
              </div>
              <Badge variant="secondary" className="text-xs h-5">
                {stat.value}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <CustomTooltip 
      content={content.props.children}
      variant={variant}
      position={position}
      delay={300}
      className="max-w-sm"
    >
      {children}
    </CustomTooltip>
  );
}

// Componente para tooltip de apartamento con información detallada
interface ApartmentTooltipProps {
  apartment: {
    name: string;
    tenants?: { length: number };
    created_at?: string;
    status?: boolean;
  };
  action: 'export' | 'edit' | 'delete';
  children: React.ReactNode;
}

export function ApartmentTooltip({ apartment, action, children }: ApartmentTooltipProps) {
  const getTooltipConfig = () => {
    switch (action) {
      case 'export':
        return {
          title: '📊 Export NinjaOne Devices',
          description: `Download device data for ${apartment.name}`,
          variant: 'success' as const,
          stats: [
            {
              label: 'Members',
              value: apartment.tenants?.length || 0,
              icon: <Users className="h-3 w-3" />
            },
            {
              label: 'Status',
              value: apartment.status ? 'Active' : 'Inactive',
              icon: <Building className="h-3 w-3" />
            }
          ]
        };
      case 'edit':
        return {
          title: '✏️ Edit Apartment',
          description: `Modify details and members for ${apartment.name}`,
          variant: 'warning' as const,
          stats: [
            {
              label: 'Current Members',
              value: apartment.tenants?.length || 0,
              icon: <Users className="h-3 w-3" />
            }
          ]
        };
      case 'delete':
        return {
          title: '🗑️ Delete Apartment',
          description: `Permanently remove ${apartment.name}`,
          variant: 'error' as const,
          stats: [
            {
              label: 'Members affected',
              value: apartment.tenants?.length || 0,
              icon: <Users className="h-3 w-3" />
            }
          ]
        };
    }
  };

  const config = getTooltipConfig();

  return (
    <RichTooltip
      title={config.title}
      description={config.description}
      stats={config.stats}
      variant={config.variant}
    >
      {children}
    </RichTooltip>
  );
}

import React from 'react';
import { CustomTooltip } from '@/components/ui/custom-tooltip';
import { Button } from '@/components/ui/button';
import { DownloadCloud, Edit, Trash2, Eye, Settings, Plus } from 'lucide-react';

interface ActionButtonsProps {
  onExport?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onView?: () => void;
  showExport?: boolean;
  showEdit?: boolean;
  showDelete?: boolean;
  showView?: boolean;
  exportTooltip?: string;
  editTooltip?: string;
  deleteTooltip?: string;
  viewTooltip?: string;
}

export function ActionButtons({
  onExport,
  onEdit,
  onDelete,
  onView,
  showExport = true,
  showEdit = true,
  showDelete = true,
  showView = false,
  exportTooltip = "Export data to Excel",
  editTooltip = "Edit this item",
  deleteTooltip = "Delete this item",
  viewTooltip = "View details"
}: ActionButtonsProps) {
  return (
    <div className="flex gap-1">
      {showView && onView && (
        <CustomTooltip 
          content={`👁️ ${viewTooltip}`} 
          variant="info"
          position="top"
          delay={150}
        >
          <Button 
            variant="ghost" 
            size="icon" 
            className="action-button hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 h-8 w-8"
            onClick={onView}
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>
        </CustomTooltip>
      )}

      {showExport && onExport && (
        <CustomTooltip 
          content={`📊 ${exportTooltip}`} 
          variant="success"
          position="top"
          delay={150}
        >
          <Button 
            variant="ghost" 
            size="icon" 
            className="action-button hover:bg-green-50 hover:text-green-600 transition-all duration-200 h-8 w-8"
            onClick={onExport}
          >
            <DownloadCloud className="h-3.5 w-3.5" />
          </Button>
        </CustomTooltip>
      )}
      
      {showEdit && onEdit && (
        <CustomTooltip 
          content={`✏️ ${editTooltip}`} 
          variant="warning"
          position="top"
          delay={150}
        >
          <Button 
            variant="ghost" 
            size="icon" 
            className="action-button hover:bg-amber-50 hover:text-amber-600 transition-all duration-200 h-8 w-8"
            onClick={onEdit}
          >
            <Edit className="h-3.5 w-3.5" />
          </Button>
        </CustomTooltip>
      )}
      
      {showDelete && onDelete && (
        <CustomTooltip 
          content={`🗑️ ${deleteTooltip}`} 
          variant="error"
          position="top"
          delay={150}
        >
          <Button 
            variant="ghost" 
            size="icon" 
            className="action-button hover:bg-red-50 hover:text-red-600 transition-all duration-200 h-8 w-8"
            onClick={onDelete}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </CustomTooltip>
      )}
    </div>
  );
}

// Componente para tooltips con información más detallada
interface DetailedTooltipProps {
  title: string;
  description: string;
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export function DetailedTooltip({ 
  title, 
  description, 
  children, 
  variant = 'default',
  position = 'top' 
}: DetailedTooltipProps) {
  const content = (
    <div className="text-center">
      <div className="font-semibold text-sm mb-1">{title}</div>
      <div className="text-xs opacity-90">{description}</div>
    </div>
  );

  return (
    <CustomTooltip 
      content={content.props.children}
      variant={variant}
      position={position}
      delay={200}
      className="max-w-xs"
    >
      {children}
    </CustomTooltip>
  );
}

// Device icon selector component
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, X, Grid3X3, List } from 'lucide-react';
import { getDeviceIconsByCategory } from '@/utils/deviceIcons';
import DeviceIcon from '@/components/DeviceIcon';

// Add custom styles for enhanced animations
const styles = `
  @keyframes iconHover {
    0% { transform: scale(1) rotate(0deg); }
    50% { transform: scale(1.1) rotate(2deg); }
    100% { transform: scale(1.05) rotate(0deg); }
  }
  
  @keyframes slideInFromBottom {
    0% { transform: translateY(20px); opacity: 0; }
    100% { transform: translateY(0); opacity: 1; }
  }
  
  .icon-hover:hover {
    animation: iconHover 0.3s ease-in-out;
  }
  
  .slide-in {
    animation: slideInFromBottom 0.2s ease-out;
  }
  
  .category-pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
`;

// Inject styles
if (typeof document !== 'undefined' && !document.getElementById('device-icon-selector-styles')) {
  const styleSheet = document.createElement("style");
  styleSheet.id = 'device-icon-selector-styles';
  styleSheet.type = "text/css";
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}

interface DeviceIconSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (iconId: string) => void;
  selectedIconId?: string;
}

const DeviceIconSelector: React.FC<DeviceIconSelectorProps> = ({
  isOpen,
  onClose,
  onSelect,
  selectedIconId
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const categories = getDeviceIconsByCategory();
  
  // Get all devices for filtering
  const allDevices = Object.values(categories).flatMap(category => category.devices);
  
  // Filter devices based on search and category
  const filteredDevices = allDevices.filter(device => {
    const matchesSearch = device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         device.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || 
                           Object.entries(categories).some(([catKey, catData]) => 
                             catKey === selectedCategory && catData.devices.includes(device)
                           );
    return matchesSearch && matchesCategory;
  });

  const handleSelect = (iconId: string) => {
    onSelect(iconId);
    onClose();
  };

  const clearSelection = () => {
    onSelect('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[85vh] flex flex-col bg-gradient-to-br from-white to-gray-50/50 border-2 border-corporate-gold/20">
        <DialogHeader className="border-b border-corporate-gold/10 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-corporate-gold/20 to-corporate-warm/20 flex items-center justify-center">
                <Grid3X3 className="w-5 h-5 text-corporate-gold" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-corporate-gold">
                  Device Icon Library
                </DialogTitle>
                <p className="text-sm text-muted-foreground">Choose the perfect icon for your device</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="h-9 px-3 border-corporate-gold/20 hover:border-corporate-gold/40 hover:bg-corporate-gold/5"
              >
                {viewMode === 'grid' ? (
                  <>
                    <List className="w-4 h-4 mr-2" />
                    List
                  </>
                ) : (
                  <>
                    <Grid3X3 className="w-4 h-4 mr-2" />
                    Grid
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-9 w-9 p-0 hover:bg-red-50 hover:text-red-600"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex flex-col gap-6 flex-1 overflow-hidden">
          {/* Search and current selection */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search by device name, type, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 text-base border-2 border-gray-200 focus:border-corporate-gold/50 rounded-xl"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
            
            {/* Current selection display */}
            {selectedIconId && (
              <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-corporate-gold/10 to-corporate-warm/10 border-2 border-corporate-gold/20 rounded-xl slide-in">
                <div className="w-8 h-8 rounded-lg bg-white/80 border border-corporate-gold/30 flex items-center justify-center">
                  <DeviceIcon deviceIconId={selectedIconId} size={20} />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-corporate-gold">Current Selection</div>
                  <div className="text-xs text-muted-foreground">Click an icon to change</div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSelection}
                  className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600 rounded-full"
                  title="Clear selection"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Category filters */}
          <div className="flex flex-wrap gap-2">
            <Badge 
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              className={`cursor-pointer transition-all duration-300 hover:scale-105 px-4 py-2 rounded-full text-sm font-medium ${
                selectedCategory === 'all' 
                  ? 'bg-corporate-gold hover:bg-corporate-gold/90 shadow-lg' 
                  : 'hover:bg-corporate-gold/10 hover:border-corporate-gold/60 hover:shadow-md'
              }`}
              onClick={() => setSelectedCategory('all')}
            >
              🌟 All ({allDevices.length})
            </Badge>
            {Object.entries(categories).map(([key, category]) => {
              const emojis = {
                security: '🔒',
                networking: '🌐',
                'smart-home': '🏠',
                entertainment: '🎮',
                computing: '💻',
                appliances: '🔌',
                other: '📱'
              };
              
              return (
                <Badge
                  key={key}
                  variant={selectedCategory === key ? 'default' : 'outline'}
                  className={`cursor-pointer transition-all duration-300 hover:scale-105 px-4 py-2 rounded-full text-sm font-medium ${
                    selectedCategory === key 
                      ? 'bg-corporate-gold hover:bg-corporate-gold/90 shadow-lg' 
                      : 'hover:bg-corporate-gold/10 hover:border-corporate-gold/60 hover:shadow-md'
                  }`}
                  onClick={() => setSelectedCategory(key)}
                >
                  {emojis[key as keyof typeof emojis] || '📱'} {category.name} ({category.devices.length})
                </Badge>
              );
            })}
          </div>

          {/* Icons display */}
          <div className="flex-1 overflow-y-auto">
            {filteredDevices.length > 0 ? (
              viewMode === 'grid' ? (
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-4">
                  {filteredDevices.map((device, index) => (
                    <button
                      key={device.id}
                      onClick={() => handleSelect(device.id)}
                      className={`
                        group relative flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-300 icon-hover
                        ${selectedIconId === device.id 
                          ? 'border-corporate-gold bg-gradient-to-br from-corporate-gold/15 to-corporate-warm/10 shadow-xl ring-4 ring-corporate-gold/20 scale-105' 
                          : 'border-gray-200 hover:border-corporate-gold/60 hover:bg-gradient-to-br hover:from-corporate-gold/5 hover:to-corporate-warm/5 hover:shadow-lg hover:scale-105'
                        }
                      `}
                      style={{ animationDelay: `${index * 20}ms` }}
                      title={device.name}
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-all duration-300 ${
                        selectedIconId === device.id 
                          ? 'bg-white/90 shadow-lg' 
                          : 'bg-gray-50 group-hover:bg-white group-hover:shadow-md'
                      }`}>
                        <DeviceIcon 
                          deviceIconId={device.id} 
                          size={32} 
                          className="transition-transform group-hover:scale-110" 
                        />
                      </div>
                      <span className={`text-xs font-medium text-center leading-tight max-w-full transition-colors ${
                        selectedIconId === device.id ? 'text-corporate-gold' : 'text-gray-700 group-hover:text-corporate-gold'
                      }`}>
                        {device.name.length > 10 ? `${device.name.slice(0, 8)}...` : device.name}
                      </span>
                      
                      {/* Selection indicator */}
                      {selectedIconId === device.id && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-corporate-gold rounded-full flex items-center justify-center shadow-lg">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredDevices.map((device, index) => (
                    <button
                      key={device.id}
                      onClick={() => handleSelect(device.id)}
                      className={`
                        w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-300 text-left slide-in
                        ${selectedIconId === device.id 
                          ? 'border-corporate-gold bg-gradient-to-r from-corporate-gold/10 to-corporate-warm/5 shadow-lg' 
                          : 'border-gray-200 hover:border-corporate-gold/40 hover:bg-gradient-to-r hover:from-gray-50 hover:to-corporate-gold/5 hover:shadow-md'
                        }
                      `}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        selectedIconId === device.id 
                          ? 'bg-white shadow-md' 
                          : 'bg-gray-100 group-hover:bg-white'
                      }`}>
                        <DeviceIcon deviceIconId={device.id} size={28} />
                      </div>
                      <div className="flex-1">
                        <div className={`font-semibold ${selectedIconId === device.id ? 'text-corporate-gold' : 'text-gray-800'}`}>
                          {device.name}
                        </div>
                        <div className="text-sm text-muted-foreground capitalize">
                          {device.id.replace('-', ' ')} • {Object.entries(categories).find(([, cat]) => 
                            cat.devices.some(d => d.id === device.id)
                          )?.[1]?.name}
                        </div>
                      </div>
                      {selectedIconId === device.id && (
                        <div className="w-3 h-3 bg-corporate-gold rounded-full shadow-lg"></div>
                      )}
                    </button>
                  ))}
                </div>
              )
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mb-6">
                  <Search className="w-10 h-10 opacity-30" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-700">No icons found</h3>
                <p className="text-center max-w-md leading-relaxed">
                  We couldn't find any icons matching your search. Try different keywords or browse by category.
                </p>
                {searchTerm && (
                  <Button
                    variant="outline"
                    onClick={() => setSearchTerm('')}
                    className="mt-4 border-corporate-gold/30 hover:bg-corporate-gold/5"
                  >
                    Clear search
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Footer with stats */}
          <div className="border-t border-corporate-gold/10 pt-4">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4 text-muted-foreground">
                <span className="font-medium">
                  Showing <span className="text-corporate-gold font-bold">{filteredDevices.length}</span> of {allDevices.length} icons
                </span>
                {selectedIconId && (
                  <div className="flex items-center gap-2 text-corporate-gold">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="font-semibold">Icon selected</span>
                  </div>
                )}
              </div>
              <div className="text-muted-foreground">
                <span className="font-medium">
                  {selectedCategory === 'all' ? 'All Categories' : categories[selectedCategory]?.name}
                </span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeviceIconSelector;

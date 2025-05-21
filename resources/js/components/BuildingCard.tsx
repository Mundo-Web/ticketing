import { Building } from "@/types/models/Building";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Building2, MapPin, User, Users, Edit, Trash2, CheckCircle, XCircle } from "lucide-react";
import { Link } from "@inertiajs/react";

interface BuildingCardProps {
  building: Building;
  onEdit?: (building: Building) => void;
  onDelete?: (building: Building) => void;
  onToggleStatus?: (building: Building) => void;
  isUpdatingStatus?: boolean;
}

export function BuildingCard({ 
  building, 
  onEdit, 
  onDelete, 
  onToggleStatus,
  isUpdatingStatus 
}: BuildingCardProps) {
  return (
    <Card className="group overflow-hidden rounded-xl border hover:shadow-md transition-all duration-300">
      {/* Imagen del edificio con overlay */}
      <div className="relative h-48 w-full overflow-hidden">
        {building.image ? (
          <img
            src={`/storage/${building.image}`}
            alt={building.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted/50">
            <Building2 className="h-16 w-16 text-muted-foreground/40" />
          </div>
        )}
        
        {/* Overlay con estado */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
        
        {/* Badge de estado */}
        <div className="absolute top-3 right-3">
          <Badge 
            variant={building.status ? "default" : "outline"}
            className={`${building.status 
              ? "bg-green-500/90 hover:bg-green-500/80" 
              : "bg-red-500/90 hover:bg-red-500/80"} text-white`}
          >
            {building.status ? (
              <CheckCircle className="mr-1 h-3 w-3" />
            ) : (
              <XCircle className="mr-1 h-3 w-3" />
            )}
            {building.status ? "Activo" : "Inactivo"}
          </Badge>
        </div>
        
        {/* Acciones rápidas */}
        <div className="absolute top-3 left-3 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          {onEdit && (
            <Button 
              variant="secondary" 
              size="icon" 
              className="h-8 w-8 rounded-full bg-white/90 shadow-md hover:bg-white"
              onClick={() => onEdit(building)}
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {onDelete && (
            <Button 
              variant="secondary" 
              size="icon" 
              className="h-8 w-8 rounded-full bg-white/90 shadow-md hover:bg-white text-destructive hover:text-destructive"
              onClick={() => onDelete(building)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      
      <CardContent className="p-5">
        {/* Nombre y descripción */}
        <div className="mb-4">
          <h3 className="text-xl font-semibold">{building.name}</h3>
          {building.description && (
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
              {building.description}
            </p>
          )}
        </div>
        
        {/* Información del propietario */}
        {building.owner && (
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">{building.owner.name}</p>
              <p className="text-xs text-muted-foreground">{building.owner.email}</p>
            </div>
          </div>
        )}
        
        {/* Ubicación */}
        {building.location_link && (
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100">
              <MapPin className="h-5 w-5 text-blue-600" />
            </div>
            <a 
              href={building.location_link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline"
            >
              Ver ubicación
            </a>
          </div>
        )}
        
        {/* Porteros */}
        {building.doormen && building.doormen.length > 0 && (
          <div className="mt-4 pt-3 border-t">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Porteros ({building.doormen.length})</span>
            </div>
            <div className="flex -space-x-2">
              {building.doormen.slice(0, 5).map((doorman) => (
                <TooltipProvider key={doorman.id} delayDuration={300}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="relative h-8 w-8 overflow-hidden rounded-full border-2 border-background">
                        {doorman.photo ? (
                          <img
                            src={`/storage/${doorman.photo}`}
                            alt={doorman.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-muted">
                            <User className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="text-xs">
                        <p className="font-medium">{doorman.name}</p>
                        <p className="text-muted-foreground">{doorman.shift}</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
              {building.doormen.length > 5 && (
                <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium">
                  +{building.doormen.length - 5}
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Botón de acción principal */}
        <div className="mt-4 flex justify-end">
          <Link 
            href={`/buildings/${building.id}/apartments`} 
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Ver apartamentos
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
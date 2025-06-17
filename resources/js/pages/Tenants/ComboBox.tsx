

import * as React from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';


import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { SharedData } from '@/types';
import { usePage } from '@inertiajs/react';

type Building = {
    id: number;
    name: string;
    image: string;
};

export function BuildingCombobox({
    buildings,
    selectedId,
    onChange
}: {
    buildings: Building[];
    selectedId: number;
    onChange: (id: number) => void;
}) {
    const { auth } = usePage<SharedData>().props;
    const [open, setOpen] = React.useState(false);
    const selected = buildings.find(b => b.id === selectedId);

    return (
        <Popover open={auth.user?.roles.includes('super-admin') ? open:false} onOpenChange={setOpen} >
            <PopoverTrigger asChild>
                <button
                    className="w-max flex items-center justify-between bg-background px-4 py-2 text-left text-lg "
                >
                    {selected ? (
                        <div className="flex items-center gap-3">
                            <img
                                src={`/storage/${selected.image}`}
                                alt={selected.name}
                                className="w-12 h-12 rounded-full border border-primary object-cover"
                            onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                                                                               e.currentTarget.src = '/images/default-build.png'; // Ruta de imagen por defecto
                                                                           }}
                           />
                            <span>{selected.name}</span>
                        </div>
                    ) : (
                        <span className="text-muted-foreground">Select building...</span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 text-muted-foreground" />
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-4">
                <Command>
                    <CommandInput placeholder="Search building..." />
                    <CommandEmpty>
                        Nothing found.</CommandEmpty>
                    <CommandGroup>
                        {buildings.map((building) => (
                            <CommandItem
                                key={building.id}
                                onSelect={() => {
                                    onChange(building.id);
                                    setOpen(false);
                                }}
                                className="flex gap-3 items-center"
                            >
                                <img
                                    src={`/storage/${building.image}`}
                                    alt={building.name}
                                    className="w-8 h-8 rounded-full border border-primary object-cover"
                                 onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                                                                                    e.currentTarget.src = '/images/default-build.png'; // Ruta de imagen por defecto
                                                                                }}
                                />
                                <span>{building.name}</span>
                                {selectedId === building.id && (
                                    <Check className="ml-auto h-4 w-4 text-primary" />
                                )}
                            </CommandItem>
                        ))}
                    </CommandGroup>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

import { Link } from '@inertiajs/react';
import { NavItem } from '@/types';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface NavMainProps {
    items: NavItem[];
    className?: string;
    level?: number;
}

export function NavMain({ items, className, level = 0 }: NavMainProps) {
    const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('sidebar-expanded');
            return saved ? JSON.parse(saved) : {};
        }
        return {};
    });

    const toggleItem = (title: string) => {
        setExpandedItems(prev => ({
            ...prev,
            [title]: !prev[title]
        }));
    };



    useEffect(() => {
        localStorage.setItem('sidebar-expanded', JSON.stringify(expandedItems));
    }, [expandedItems]);
    return (
        <nav className={cn('space-y-1', className)}>
            {items.map((item) => (
                <div key={`${item.title}-${level}`}>
                    <div className="flex flex-col">
                        {item.href ? (
                            <Link
                                href={item.href}
                                className={cn(
                                    'flex items-center gap-3 rounded-lg px-3 py-2 transition-colors',
                                    item.isActive
                                        ? 'bg-primary text-primary-foreground'
                                        : 'hover:bg-accent hover:text-accent-foreground',
                                    level > 0 ? 'pl-8 text-sm' : ''
                                )}
                            >
                                {item.icon && <item.icon className={cn('h-4 w-4', level > 0 ? 'h-3.5 w-3.5' : '')} />}
                                <span>{item.title}</span>
                            </Link>
                        ) : (
                            <button
                                onClick={() => toggleItem(item.title)}
                                className={cn(
                                    'flex items-center justify-between gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-accent hover:text-accent-foreground',
                                    level > 0 ? 'pl-8 text-sm' : ''
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    {item.icon && <item.icon className={cn('h-4 w-4', level > 0 ? 'h-3.5 w-3.5' : '')} />}
                                    <span>{item.title}</span>
                                </div>
                                {item.items?.length && (
                                    expandedItems[item.title] ? (
                                        <ChevronDown className="h-4 w-4" />
                                    ) : (
                                        <ChevronRight className="h-4 w-4" />
                                    )
                                )}
                            </button>
                        )}
                    </div>

                    {item.items && expandedItems[item.title] && (
                        <NavMain
                            items={item.items as NavItem[]}
                            className="mt-1"
                            level={level + 1}
                        />
                    )}
                </div>
            ))}
        </nav>
    );
}
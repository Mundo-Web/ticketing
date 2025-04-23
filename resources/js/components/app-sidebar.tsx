import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { BookOpen, Folder, LayoutGrid, UsersRound, FileText, LifeBuoy, Settings, PieChart } from 'lucide-react';
import AppLogo from './app-logo';

const mainNavItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutGrid,
    isActive: route().current('dashboard'),
  },
  {
    title: 'Customers',
    icon: UsersRound,
    href: '/customers',
    isActive: route().current('customers.*'),

  }
  /*
     title: 'Support',
     icon: LifeBuoy,
     isActive: route().current('support.*'),
     items: [
       {
         title: 'Tickets',
         href: '/support/tickets',
         icon: FileText,
         isActive: route().current('support.tickets.*'),
       },
       {
         title: 'Knowledge Base',
         href: '/support/knowledge-base',
         icon: BookOpen,
         isActive: route().current('support.knowledge-base.*'),
       }
     ]
   },
   {
     title: 'Settings',
     icon: Settings,
     isActive: route().current('settings.*'),
     items: [
       {
         title: 'General',
         href: '/settings/general',
         icon: Settings,
         isActive: route().current('settings.general'),
       },
       {
         title: 'Users',
         href: '/settings/users',
         icon: UsersRound,
         isActive: route().current('settings.users.*'),
       }
     ]
   }*/
];

/*const footerNavItems: NavItem[] = [
  {
    title: 'Repository',
    href: 'https://github.com/laravel/react-starter-kit',
    icon: Folder,
  },
  {
    title: 'Documentation',
    href: 'https://laravel.com/docs/starter-kits',
    icon: BookOpen,
  },
];*/

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon" variant="floating">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard" prefetch>
                <AppLogo />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={mainNavItems} />
      </SidebarContent>

      <SidebarFooter>
        {/* <NavFooter items={footerNavItems} className="mt-auto" />*/}
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
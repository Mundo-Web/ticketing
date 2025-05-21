import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { SharedData, type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { BookOpen, Folder, LayoutGrid, UsersRound, FileText, LifeBuoy, Settings, PieChart, Building, CheckCircle, XCircle, Laptop } from 'lucide-react';
import AppLogo from './app-logo';




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
  const { url, component } = usePage()
  const { auth } = usePage<SharedData>().props;
  const mainNavItems: NavItem[] = [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: LayoutGrid,
      isActive: route().current('dashboard'),
    },
    {
      title: 'Buildings',
      icon: Building,
      isActive: route().current('buildings.*'),
      items: [

        {
          title: 'Active Buildings',
          href: '/buildings?status=active',
          icon: CheckCircle,
          isActive: component === 'Buildings/Index' && url.includes('status=active'),

        },
        {
          title: 'Inactive Buildings',
          href: '/buildings?status=inactive',
          icon: XCircle,
          isActive: component === 'Buildings/Index' && url.includes('status=inactive'),

        }
      ]
    },
    {
      title: 'Technical',
      href: '/technicals',
      icon: Laptop,
      isActive: route().current('technicals.*'),
    },
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

  return (
    <Sidebar collapsible="icon" variant="floating">
      <SidebarHeader>

        <SidebarContent className='px-6'>
          <Link href="/dashboard" prefetch>
            <AppLogo />
          </Link>
        </SidebarContent>

      </SidebarHeader>

      <SidebarContent className='px-4'>
        {auth.user?.roles.includes('super-admin') &&  <NavMain items={mainNavItems} />}

      </SidebarContent>

      <SidebarFooter>
        {/* <NavFooter items={footerNavItems} className="mt-auto" />*/}
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
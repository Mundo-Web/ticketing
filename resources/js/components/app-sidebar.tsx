import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from '@/components/ui/sidebar';
import { SharedData, type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { LayoutGrid, FileText, Building, CheckCircle, XCircle, Laptop, Users, Shield } from 'lucide-react';
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
  
  // Type-safe access to user roles
  const user = auth?.user as { roles?: string[] } | undefined;
  const userRoles = user?.roles || [];
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
    {
      title: 'Tickets',
      icon: FileText,
      isActive: route().current('tickets.*'),
      items: [
        {
          title: 'All Tickets',
          href: '/tickets',
          icon: FileText,
          isActive: component === 'Tickets/Index' && !url.includes('status='),
        },
        {
          title: 'Closed & Cancelled',
          href: '/tickets?status=closed,cancelled',
          icon: XCircle,
          isActive: component === 'Tickets/Index' && url.includes('status=closed,cancelled'),
        }
      ]
    },
    {
      title: 'NinjaOne',
      icon: Shield,
      isActive: route().current('ninjaone.*'),
      items: [
        {
          title: 'Demo & Testing',
          href: '/ninjaone/demo',
          icon: CheckCircle,
          isActive: route().current('ninjaone.demo'),
        },
        {
          title: 'Devices Dashboard',
          href: '/ninjaone/devices',
          icon: Laptop,
          isActive: route().current('ninjaone.devices.*'),
        }
      ]
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
  
  // Menú para members (usuarios normales)
  const memberNavItems: NavItem[] = [
   /* {
      title: 'Devices',
      href: `/apartment/member/${auth?.user?.member?.id}/devices`,
      icon: Laptop,
      isActive: route().current('apartment.*'),
    }, */
    {
      title: 'Tickets',
      href: '/tickets',
      icon: FileText,
      isActive: route().current('tickets.*'),
    },
  ];

    const technicalNavItems: NavItem[] = [
 {
      title: 'Dashboard',
      href: '/dashboard',
      icon: LayoutGrid,
      isActive: route().current('dashboard'),
    },
    {
      title: 'Tickets',
      icon: FileText,
      isActive: route().current('tickets.*'),
      items: [
        {
          title: 'All Tickets',
          href: '/tickets',
          icon: FileText,
          isActive: component === 'Tickets/Index' && !url.includes('status='),
        },
        {
          title: 'Closed & Cancelled',
          href: '/tickets?status=closed,cancelled',
          icon: XCircle,
          isActive: component === 'Tickets/Index' && url.includes('status=closed,cancelled'),
        }
      ]
    },
  ];


    // Menú para owners y doormans (gestión de edificio)
  const buildingNavItems: NavItem[] = [
   {
      title: 'My Devices',
      href: `/buildings/${auth?.user?.owner?.id || auth?.user?.doorman?.id}/apartments`,
      icon: Laptop,
      isActive: route().current('buildings.*'),
    },
   /* {
      title: 'Manage Members',
      href: '/owner-doorman/devices',
      icon: Users,
      isActive: route().current('owner-doorman.*'),
    }, */
    {
      title: 'Tickets',
      href: '/tickets',
      icon: FileText,
      isActive: route().current('tickets.*'),
    },
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
        {userRoles.includes('super-admin') ? (
          <NavMain items={mainNavItems} />
        ) : userRoles.includes('technical') ? (
          <NavMain items={technicalNavItems} />
        ) : userRoles.includes('owner') || userRoles.includes('doorman') ? (
          <NavMain items={buildingNavItems} />
        ): (
          <NavMain items={memberNavItems} />
        )}
      </SidebarContent>

      <SidebarFooter>
        {/* <NavFooter items={footerNavItems} className="mt-auto" />*/}
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
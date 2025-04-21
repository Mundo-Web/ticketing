import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import { PageProps, type BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Customers',
        href: '/customers',
    },
];



export default function Index(  ) {

    const {customers} = usePage().props;
    console.log(usePage<PageProps>().props);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <h1>Customers</h1>
                
                <ul>
                    {customers.data.map((customer)=>(
                        <li key={customer.id}>
                            {customer.name} - {customer.email}
                        </li>
                    ))}
                </ul>
            </div>
        </AppLayout>
    );
}

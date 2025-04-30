import { SVGAttributes } from 'react';

export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <img src="/logo.svg" className='h-14 object-contain' />
    );
}

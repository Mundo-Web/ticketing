import { Apartment } from "./Apartment";
import { Doorman } from "./Doorman";
import { Owner } from "./Owner";

export interface Building {
    id: number;
    name: string;
    managing_company?: string;
    address?: string;
    image: string;
    description: string;
    location_link: string;
    owner: Owner;
    doormen: Doorman[];
    status: boolean;
    created_at: string;
    apartments?: Apartment[];
}
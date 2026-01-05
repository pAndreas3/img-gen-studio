import { GaugeIcon, LucideIcon } from "lucide-react";

interface NavigationItem {
    href: string;
    icon: LucideIcon;
    label: string;
}


export const navigationItems: NavigationItem[] = [
    {
        href: "/",
        icon: GaugeIcon,
        label: "Dashboard"
    }
];



"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import {
  CarFront,
  Home,
  Users,
  DollarSign,
  Waypoints,
  Sparkles,
} from 'lucide-react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/inventory', label: 'Inventory', icon: CarFront },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/sales', label: 'Sales', icon: DollarSign },
  { href: '/rentals', label: 'Rentals', icon: CarFront },
  { href: '/test-drives', label: 'Test Drives', icon: Waypoints },
  { href: '/recommendations', label: 'Recommendations', icon: Sparkles },
];

export function MainNav() {
  const pathname = usePathname();

  return (
    <SidebarMenu>
      {navItems.map((item) => (
        <SidebarMenuItem key={item.href}>
          <SidebarMenuButton asChild isActive={pathname === item.href}>
            <Link href={item.href}>
              <item.icon />
              <span>{item.label}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}

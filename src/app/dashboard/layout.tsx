'use client';

import { useAuth } from '@/context/AuthContext';
import { Box, Heading, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { FiGrid, FiList, FiUsers, FiUser, FiBox, FiSettings, FiClipboard, FiLogIn } from 'react-icons/fi';

import MainLayout from '@/components/layout/MainLayout';
import { NavigationLink } from '@/components/layout/Sidebar';

const adminNavLinks: NavigationLink[] = [
  { href: '/dashboard', label: 'Dashboard', icon: FiGrid },
  { href: '/dashboard/inventory', label: 'Inventory Logs', icon: FiList },
  {
    label: 'Products',
    icon: FiBox,
    children: [
      { href: '/dashboard/products', label: 'Manage Products', icon: FiBox },
      // { href: '/dashboard/products-import', label: 'Bulk Import', icon: FiUploadCloud },
      // { href: '/dashboard/products-images', label: 'Image Uploader', icon: FiImage },
      { href: '/dashboard/products/settings', label: 'Settings', icon: FiSettings },
    ],
  },
  { href: '/dashboard/users', label: 'User Management', icon: FiUsers },
  { href: '/dashboard/profile', label: 'Profile', icon: FiUser },
];

const floorStaffNavLinks: NavigationLink[] = [
  { href: '/dashboard', label: 'Entry', icon: FiLogIn },
  { href: '/dashboard/logs', label: 'My Logs', icon: FiClipboard },
  { href: '/dashboard/profile', label: 'Profile', icon: FiUser },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const { t } = useTranslation();

  if (user?.role === 'factory_admin') {
    return (
      <MainLayout navLinks={adminNavLinks}>
        {children}
      </MainLayout>
    );
  }

  if (user?.role === 'floor_staff') {
    return (
      <MainLayout navLinks={floorStaffNavLinks}>
        {children}
      </MainLayout>
    );
  }

  return (
    <Box p={8}>
      <Heading>{t('unassigned.role.title')}</Heading>
      <Text>{t('unassigned.role.description')}</Text>
    </Box>
  );
}
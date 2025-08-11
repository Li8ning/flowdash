'use client';

import { useAuth } from '@/context/AuthContext';
import { Box, Heading, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { FiGrid, FiList, FiUsers, FiUser, FiBox, FiSettings, FiClipboard, FiLogIn, FiUpload } from 'react-icons/fi';

import MainLayout from '@/components/layout/MainLayout';
import { NavigationLink } from '@/components/layout/Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const { t } = useTranslation();

  const adminNavLinks: NavigationLink[] = [
    { href: '/dashboard', label: t('sidebar.dashboard'), icon: FiGrid },
    { href: '/dashboard/inventory', label: t('sidebar.inventory_logs'), icon: FiList },
    {
      label: t('sidebar.products'),
      icon: FiBox,
      children: [
        { href: '/dashboard/products', label: t('sidebar.manage_products'), icon: FiBox },
        { href: '/dashboard/products/bulk-import', label: t('sidebar.bulk_import'), icon: FiUpload },
        { href: '/dashboard/products/bulk-image-upload', label: t('sidebar.bulk_image_upload'), icon: FiUpload },
        { href: '/dashboard/products/settings', label: t('sidebar.product_settings'), icon: FiSettings },
      ],
    },
    { href: '/dashboard/users', label: t('sidebar.user_management'), icon: FiUsers },
    { href: '/dashboard/profile', label: t('sidebar.profile'), icon: FiUser },
  ];

  const floorStaffNavLinks: NavigationLink[] = [
    { href: '/dashboard', label: t('sidebar.entry'), icon: FiLogIn },
    { href: '/dashboard/logs', label: t('sidebar.my_logs'), icon: FiClipboard },
    { href: '/dashboard/profile', label: t('sidebar.profile'), icon: FiUser },
  ];

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
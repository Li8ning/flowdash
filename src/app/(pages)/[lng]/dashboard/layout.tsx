'use client';

import { useAuth } from '@/context/AuthContext';
import { Box, Heading, Text } from '@chakra-ui/react';
import { useTranslation } from '@/app/i18n/client';
import { FiGrid, FiList, FiUsers, FiUser, FiBox, FiSettings, FiClipboard, FiLogIn, FiUpload } from 'react-icons/fi';

import MainLayout from '@/components/layout/MainLayout';
import { NavigationLink } from '@/components/layout/Sidebar';

export default function DashboardLayout({
  children,
  params: { lng },
}: {
  children: React.ReactNode;
  params: { lng: string };
}) {
  const { user, loading } = useAuth();
  const { t } = useTranslation(lng, 'common');

  const adminNavLinks: NavigationLink[] = [
    { href: `/${lng}/dashboard`, label: t('sidebar.dashboard'), icon: FiGrid },
    { href: `/${lng}/dashboard/inventory`, label: t('sidebar.inventory_logs'), icon: FiList },
    {
      label: t('sidebar.products'),
      icon: FiBox,
      children: [
        { href: `/${lng}/dashboard/products`, label: t('sidebar.manage_products'), icon: FiBox },
        { href: `/${lng}/dashboard/products/bulk-import`, label: t('sidebar.bulk_import'), icon: FiUpload },
        { href: `/${lng}/dashboard/products/bulk-image-upload`, label: t('sidebar.bulk_image_upload'), icon: FiUpload },
        { href: `/${lng}/dashboard/products/settings`, label: t('sidebar.product_settings'), icon: FiSettings },
      ],
    },
    { href: `/${lng}/dashboard/users`, label: t('sidebar.user_management'), icon: FiUsers },
    { href: `/${lng}/dashboard/profile`, label: t('sidebar.profile'), icon: FiUser },
  ];

  const floorStaffNavLinks: NavigationLink[] = [
    { href: `/${lng}/dashboard`, label: t('sidebar.entry'), icon: FiLogIn },
    { href: `/${lng}/dashboard/logs`, label: t('sidebar.my_logs'), icon: FiClipboard },
    { href: `/${lng}/dashboard/profile`, label: t('sidebar.profile'), icon: FiUser },
  ];

  // AppInitializer handles the loading state and redirects, so we can assume
  // the user is authenticated and loaded at this point

  if (user?.role === 'super_admin' || user?.role === 'admin') {
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

  // This case handles users who are logged in but have no assigned role.
  // The middleware won't redirect them, so we need to show a message.
  return (
    <Box p={8}>
      <Heading>{t('unassigned.role.title')}</Heading>
      <Text>{t('unassigned.role.description')}</Text>
    </Box>
  );
}
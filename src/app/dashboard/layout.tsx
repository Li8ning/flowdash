'use client';

import { useAuth } from '@/context/AuthContext';
import { Box, Heading, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { FiGrid, FiList, FiUsers, FiUser, FiBox, FiSettings, FiClipboard, FiLogIn, FiUpload } from 'react-icons/fi';

import MainLayout from '@/components/layout/MainLayout';
import { NavigationLink } from '@/components/layout/Sidebar';
import GlobalSpinner from '@/components/GlobalSpinner';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
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

  // The middleware handles the redirect, but we still need to handle the loading state
  // and what to show while the user object is being fetched on the client.
  if (loading) {
    return <GlobalSpinner />;
  }

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
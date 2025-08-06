'use client';

import { useAuth } from '@/context/AuthContext';
import {
  Box,
  Button,
  Flex,
  Heading,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Text,
  HStack,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import ProductManager from './ProductManager';
import UserManager from './UserManager';
import InventoryLogs from './InventoryLogs';
import ProductionDashboard from './ProductionDashboard';
import ProfileManager from './ProfileManager';
import ProductSelector from './ProductSelector';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const { t } = useTranslation();

  return (
    <Box p={{ base: 2, md: 6 }}>
      <Box bg="brand.surface" p={{ base: 4, md: 6 }} borderRadius="xl" shadow="md" borderWidth="1px" borderColor="brand.lightBorder" mb={8}>
        <Flex justify="space-between" align="center">
          <Box>
            <Heading size={{ base: 'md', md: 'lg' }}>{t('dashboard.welcome')}, {user?.name || 'Admin'}</Heading>
            <Text color="brand.textSecondary" fontSize={{ base: 'sm', md: 'md' }}>{user?.organization_name}</Text>
          </Box>
          <HStack>
            <Button colorScheme="red" onClick={logout}>{t('dashboard.logout')}</Button>
          </HStack>
        </Flex>
      </Box>
      <Tabs isLazy variant="line-alt" colorScheme="blue">
        <Box overflowX="auto" sx={{ '&::-webkit-scrollbar': { display: 'none' }, msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
          <TabList minW="max-content">
            <Tab>{t('dashboard.tabs.dashboard')}</Tab>
            <Tab>{t('dashboard.tabs.inventory_logs')}</Tab>
            <Tab>{t('dashboard.tabs.product_management')}</Tab>
            <Tab>{t('dashboard.tabs.user_management')}</Tab>
            <Tab>{t('dashboard.tabs.profile')}</Tab>
          </TabList>
        </Box>
        <TabPanels>
          <TabPanel p={0} pt={6}><ProductionDashboard /></TabPanel>
          <TabPanel p={0} pt={6}><InventoryLogs allLogs={true} /></TabPanel>
          <TabPanel p={0} pt={6}><ProductManager /></TabPanel>
          <TabPanel p={0} pt={6}><UserManager /></TabPanel>
          <TabPanel p={0} pt={6}><ProfileManager /></TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

const FloorStaffDashboard = () => {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  return (
    <Box p={{ base: 2, md: 6 }}>
       <Box bg="brand.surface" p={{ base: 4, md: 6 }} borderRadius="xl" shadow="md" borderWidth="1px" borderColor="brand.lightBorder" mb={8}>
        <Flex justify="space-between" align="center">
          <Box>
            <Heading size={{ base: 'md', md: 'lg' }}>{t('dashboard.welcome')}, {user?.name || 'User'}</Heading>
            <Text color="brand.textSecondary" fontSize={{ base: 'sm', md: 'md' }}>{user?.organization_name}</Text>
          </Box>
          <HStack>
            <Button colorScheme="red" onClick={logout}>{t('dashboard.logout')}</Button>
          </HStack>
        </Flex>
      </Box>
      <Tabs isLazy variant="line-alt" colorScheme="blue">
        <Box overflowX="auto" sx={{ '&::-webkit-scrollbar': { display: 'none' }, msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
          <TabList minW="max-content">
            <Tab>{t('dashboard.tabs.entry')}</Tab>
            <Tab>{t('dashboard.tabs.logs')}</Tab>
            <Tab>{t('dashboard.tabs.profile')}</Tab>
          </TabList>
        </Box>
        <TabPanels>
          <TabPanel p={0} pt={6}><ProductSelector /></TabPanel>
          <TabPanel p={0} pt={6}><InventoryLogs /></TabPanel>
          <TabPanel p={0} pt={6}><ProfileManager /></TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  const { t } = useTranslation();

  if (user?.role === 'factory_admin') {
    return <AdminDashboard />;
  }

  if (user?.role === 'floor_staff') {
    return <FloorStaffDashboard />;
  }

  return (
    <Box p={8}>
      <Heading>{t('unassigned.role.title')}</Heading>
      <Text>{t('unassigned.role.description')}</Text>
    </Box>
  );
};

export default Dashboard;
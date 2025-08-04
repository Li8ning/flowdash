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
} from '@chakra-ui/react';
import ProductManager from './ProductManager';
import UserManager from './UserManager';
import InventoryLogs from './InventoryLogs';
import ProductionDashboard from './ProductionDashboard';
import ProfileManager from './ProfileManager';
import ProductSelector from './ProductSelector';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  return (
    <Box p={{ base: 2, md: 6 }}>
      <Box bg="brand.surface" p={{ base: 4, md: 6 }} borderRadius="xl" shadow="md" borderWidth="1px" borderColor="brand.lightBorder" mb={8}>
        <Flex justify="space-between" align="center">
          <Box>
            <Heading size={{ base: 'md', md: 'lg' }}>Welcome, {user?.name || 'Admin'}</Heading>
            <Text color="brand.textSecondary" fontSize={{ base: 'sm', md: 'md' }}>{user?.organization_name}</Text>
          </Box>
          <Button colorScheme="red" onClick={logout}>Logout</Button>
        </Flex>
      </Box>
      <Tabs isLazy variant="line-alt" colorScheme="blue">
        <Box overflowX="auto" sx={{ '&::-webkit-scrollbar': { display: 'none' }, msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
          <TabList minW="max-content">
            <Tab>Dashboard</Tab>
            <Tab>Inventory Logs</Tab>
            <Tab>Product Management</Tab>
            <Tab>User Management</Tab>
            <Tab>Profile</Tab>
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
  return (
    <Box p={{ base: 2, md: 6 }}>
       <Box bg="brand.surface" p={{ base: 4, md: 6 }} borderRadius="xl" shadow="md" borderWidth="1px" borderColor="brand.lightBorder" mb={8}>
        <Flex justify="space-between" align="center">
          <Box>
            <Heading size={{ base: 'md', md: 'lg' }}>Welcome, {user?.name || 'User'}</Heading>
            <Text color="brand.textSecondary" fontSize={{ base: 'sm', md: 'md' }}>{user?.organization_name}</Text>
          </Box>
          <Button colorScheme="red" onClick={logout}>Logout</Button>
        </Flex>
      </Box>
      <Tabs isLazy variant="line-alt" colorScheme="blue">
        <Box overflowX="auto" sx={{ '&::-webkit-scrollbar': { display: 'none' }, msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
          <TabList minW="max-content">
            <Tab>Entry</Tab>
            <Tab>Logs</Tab>
            <Tab>Profile</Tab>
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

  if (user?.role === 'factory_admin') {
    return <AdminDashboard />;
  }

  if (user?.role === 'floor_staff') {
    return <FloorStaffDashboard />;
  }

  return (
    <Box p={8}>
      <Heading>Welcome</Heading>
      <Text>You are not assigned a role. Please contact an administrator.</Text>
    </Box>
  );
};

export default Dashboard;
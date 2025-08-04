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
import Reports from './Reports';
import ProfileManager from './ProfileManager';
import ProductSelector from './ProductSelector';

const AdminDashboard = () => {
  const { logout } = useAuth();
  return (
    <Box p={{ base: 2, md: 6 }}>
      <Flex justify="space-between" align="center" mb={8}>
        <Heading>Admin Dashboard</Heading>
        <Button colorScheme="red" onClick={logout}>Logout</Button>
      </Flex>
      <Tabs isLazy colorScheme="teal" variant="enclosed-colored" size="lg">
        <Box overflowX="auto" sx={{ '&::-webkit-scrollbar': { display: 'none' }, msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
          <TabList>
            <Tab _selected={{ color: 'white', bg: 'teal.500' }} fontWeight="bold" fontSize="lg" px={{ base: 4, md: 8 }} py={{ base: 2, md: 4 }}>Dashboard</Tab>
            <Tab _selected={{ color: 'white', bg: 'teal.500' }} fontWeight="bold" fontSize="lg" px={{ base: 4, md: 8 }} py={{ base: 2, md: 4 }}>Reports</Tab>
            <Tab _selected={{ color: 'white', bg: 'teal.500' }} fontWeight="bold" fontSize="lg" px={{ base: 4, md: 8 }} py={{ base: 2, md: 4 }}>Inventory Logs</Tab>
            <Tab _selected={{ color: 'white', bg: 'teal.500' }} fontWeight="bold" fontSize="lg" px={{ base: 4, md: 8 }} py={{ base: 2, md: 4 }}>Product Management</Tab>
            <Tab _selected={{ color: 'white', bg: 'teal.500' }} fontWeight="bold" fontSize="lg" px={{ base: 4, md: 8 }} py={{ base: 2, md: 4 }}>User Management</Tab>
            <Tab _selected={{ color: 'white', bg: 'teal.500' }} fontWeight="bold" fontSize="lg" px={{ base: 4, md: 8 }} py={{ base: 2, md: 4 }}>Profile</Tab>
          </TabList>
        </Box>
        <TabPanels>
          <TabPanel p={0} pt={6}><ProductionDashboard /></TabPanel>
          <TabPanel p={0} pt={6}><Reports /></TabPanel>
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
  const { logout } = useAuth();
  return (
    <Box p={{ base: 2, md: 6 }}>
      <Flex justify="space-between" align="center" mb={8}>
        <Heading>Floor Staff Panel</Heading>
        <Button colorScheme="red" onClick={logout}>Logout</Button>
      </Flex>
      <Tabs isLazy colorScheme="teal" variant="enclosed-colored" size="lg">
        <TabList>
          <Tab _selected={{ color: 'white', bg: 'teal.500' }} fontWeight="bold" fontSize="lg" px={{ base: 4, md: 8 }} py={{ base: 2, md: 4 }}>Entry</Tab>
          <Tab _selected={{ color: 'white', bg: 'teal.500' }} fontWeight="bold" fontSize="lg" px={{ base: 4, md: 8 }} py={{ base: 2, md: 4 }}>Logs</Tab>
          <Tab _selected={{ color: 'white', bg: 'teal.500' }} fontWeight="bold" fontSize="lg" px={{ base: 4, md: 8 }} py={{ base: 2, md: 4 }}>Profile</Tab>
        </TabList>
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
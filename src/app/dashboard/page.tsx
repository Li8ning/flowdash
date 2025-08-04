'use client';

import Dashboard from '@/components/Dashboard';
import WithAuth from '@/components/WithAuth';

const DashboardPage = () => {
  return <Dashboard />;
};

export default WithAuth(DashboardPage);
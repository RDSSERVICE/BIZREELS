import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { selectActiveRole } from '../features/auth/authSlice';
import VendorDashboard from './VendorDashboard';
import CreatorDashboard from './CreatorDashboard';
import CustomerDashboard from './CustomerDashboard';
import AdminDashboard from './AdminDashboard';

const DashboardRouter = () => {
  const activeRole = useSelector(selectActiveRole);

  switch (activeRole) {
    case 'vendor':
      return <VendorDashboard />;
    case 'creator':
      return <CreatorDashboard />;
    case 'customer':
      return <CustomerDashboard />;
    case 'admin':
      return <AdminDashboard />;
    default:
      return <Navigate to="/feed" replace />;
  }
};

export default DashboardRouter;

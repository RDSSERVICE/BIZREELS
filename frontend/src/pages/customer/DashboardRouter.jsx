import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { selectActiveRole } from '../../features/auth/authSlice';
import VendorDashboard from '../vendor/VendorDashboard';
import CreatorDashboard from '../creator/CreatorDashboard';
import CustomerDashboard from './CustomerDashboard';
import AdminDashboard from '../admin/AdminDashboard';

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
      return <Navigate to="/admin/dashboard" replace />;
    default:
      return <Navigate to="/feed" replace />;
  }
};

export default DashboardRouter;

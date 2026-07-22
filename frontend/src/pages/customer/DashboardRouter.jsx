import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { selectActiveRole } from '../../features/auth/authSlice';

const DashboardRouter = () => {
  const activeRole = useSelector(selectActiveRole);

  switch (activeRole) {
    case 'vendor':
      return <Navigate to="/vendor/dashboard" replace />;
    case 'creator':
      return <Navigate to="/creator/dashboard" replace />;
    case 'customer':
      return <Navigate to="/customer/home" replace />;
    case 'admin':
      return <Navigate to="/admin/dashboard" replace />;
    default:
      return <Navigate to="/customer/home" replace />;
  }
};

export default DashboardRouter;

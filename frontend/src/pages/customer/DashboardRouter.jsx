import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { selectActiveRole, selectCurrentUser } from '../../features/auth/authSlice';

const DashboardRouter = () => {
  const activeRole = useSelector(selectActiveRole);
  const user = useSelector(selectCurrentUser);

  switch (activeRole) {
    case 'vendor':
      if (user?.vendorProfile?.shopName) {
        return <Navigate to="/vendor/dashboard" replace />;
      }
      return <Navigate to="/customer/become-vendor" replace />;
    case 'creator':
      if (user?.creatorProfile?.displayName) {
        return <Navigate to="/creator/dashboard" replace />;
      }
      return <Navigate to="/customer/become-creator" replace />;
    case 'customer':
      return <Navigate to="/customer/home" replace />;
    case 'admin':
      return <Navigate to="/admin/dashboard" replace />;
    default:
      return <Navigate to="/customer/home" replace />;
  }
};

export default DashboardRouter;

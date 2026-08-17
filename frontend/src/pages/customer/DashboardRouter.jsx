import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { selectActiveRole, selectCurrentUser } from '../../features/auth/authSlice';
import { getPostLoginDestination } from '../../lib/roleNav';

const DashboardRouter = () => {
  const activeRole = useSelector(selectActiveRole);
  const user = useSelector(selectCurrentUser);

  const destination = getPostLoginDestination(user, activeRole);
  return <Navigate to={destination} replace />;
};

export default DashboardRouter;


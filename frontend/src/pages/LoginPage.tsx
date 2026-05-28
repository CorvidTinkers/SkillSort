import React from 'react';
import { Navigate } from 'react-router-dom';
import { Login } from '../components/Login';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { user, login } = useAuth();

  if (user) {
    return <Navigate to="/upload" replace />;
  }

  return <Login onLoginSuccess={login} />;
};

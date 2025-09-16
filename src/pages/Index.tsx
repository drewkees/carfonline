import React, { useState, useEffect } from 'react';
import LoginPage from '@/components/LoginPage';
import DashboardLayout from '@/components/DashboardLayout';
import { toast } from '@/hooks/use-toast';

const Index = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    // Check for existing session
    const sessionData = localStorage.getItem('carfSession');
    if (sessionData) {
      const session = JSON.parse(sessionData);
      setIsLoggedIn(true);
      setUserEmail(session.email);
    }
  }, []);

  const handleLogin = (email: string, fullName?: string) => {
    const sessionData = {
      email,
      fullName,
      loginTime: new Date().toISOString(),
    };
    
    localStorage.setItem('carfSession', JSON.stringify(sessionData));
    setIsLoggedIn(true);
    setUserEmail(email);
    
    toast({
      title: "Successfully Logged In!",
      description: `Welcome to CARF System, ${fullName || email}`,
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('carfSession');
    setIsLoggedIn(false);
    setUserEmail('');
    
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
  };

  if (isLoggedIn) {
    return <DashboardLayout userEmail={userEmail} onLogout={handleLogout} />;
  }

  return <LoginPage onLogin={handleLogin} />;
};

export default Index;

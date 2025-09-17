import React, { useState, useEffect } from 'react';
import LoginPage from '@/components/LoginPage';
import DashboardLayout from '@/components/DashboardLayout';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

declare global {
  interface Window {
    getGlobal?: (key: string) => string | null;
  }
}

const Index = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  // ✅ Define the global function once when app mounts
  useEffect(() => {
    window.getGlobal = (key: string): string | null => {
      if (key === 'userid') {
        const el = document.getElementById('hidden-userid');
        return el?.getAttribute('data-userid') || null;
      }
      return null;
    };
  }, []);

  // 🔐 Check for existing session on mount
  useEffect(() => {
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
      title: 'Successfully Logged In!',
      description: `Welcome to CARF System, ${fullName || email}`,
    });
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Supabase logout error:', error);

    localStorage.removeItem('carfSession');
    setIsLoggedIn(false);
    setUserEmail('');

    toast({
      title: 'Logged Out',
      description: 'You have been successfully logged out.',
    });
  };

  if (isLoggedIn) {
    return <DashboardLayout userEmail={userEmail} onLogout={handleLogout} />;
  }

  return <LoginPage onLogin={handleLogin} />;
};

export default Index;

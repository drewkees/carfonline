import React, { useState, useEffect } from 'react';
import LoginPage from '@/components/LoginPage';
import CustomerList from '@/components/list/CustomerList';
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
  const [currentPath, setCurrentPath] = useState(window.location.hash);

// Watch for changes in the hash part of the URL
useEffect(() => {
  const handleHashChange = () => setCurrentPath(window.location.hash);
  window.addEventListener('hashchange', handleHashChange);
  return () => window.removeEventListener('hashchange', handleHashChange);
}, []);



  

  // ✅ Listen for URL changes (e.g., user manually changing the URL)
  useEffect(() => {
    const handlePopState = () => setCurrentPath(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // ✅ Define global function
  useEffect(() => {
    window.getGlobal = (key: string): string | null => {
      if (key === 'userid') {
        const el = document.getElementById('hidden-userid');
        return el?.getAttribute('data-userid') || null;
      }
      return null;
    };
  }, []);

  // 🔐 Check for existing session
  useEffect(() => {
    const sessionData = localStorage.getItem('carfSession');
    if (sessionData) {
      const session = JSON.parse(sessionData);
      setIsLoggedIn(true);
      setUserEmail(session.email);
    }
  }, []);

  const handleLogin = (email: string, fullName?: string) => {
    const userid = window.getGlobal ? window.getGlobal('userid') : null;
    const sessionData = {
      email,
      fullName,
      userid,
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

  // // ✅ Check URL and render accordingly
  // if (currentPath === '/customerlist') {
  //   return <CustomerList />;
  // }

  // ✅ Default flow (Dashboard or Login)
  const forceLogin = true;
  if (forceLogin) {
    return <DashboardLayout userEmail={userEmail} onLogout={handleLogout} />;
  }

  // return <LoginPage onLogin={handleLogin} />;
  // return isLoggedIn ? (
  //   <DashboardLayout userEmail={userEmail} onLogout={handleLogout} />
  // ) : (
  //   <LoginPage onLogin={handleLogin} />
  // );

};

export default Index;

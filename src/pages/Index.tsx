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
  const [userId, setUserId] = useState<string | null>(null);
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

  // const handleLogin = async (email: string, fullName?: string) => {
  //   const element = document.getElementById('hidden-userid');
  // console.log('Element found:', element);
  // console.log('data-userid attribute:', element?.getAttribute('data-userid'));
  // console.log('window.getGlobal exists?', typeof window.getGlobal);
  
  // const userid = await new Promise<string | null>((resolve) => {
  //   const el = document.getElementById('hidden-userid');
  //   if (!el) return resolve(null);
    
  //   const currentValue = el.getAttribute('data-userid');
  //   if (currentValue && currentValue.trim() !== '') {
  //     return resolve(currentValue);
  //   }
    
  //   // Watch for changes
  //   const observer = new MutationObserver(() => {
  //     const value = el.getAttribute('data-userid');
  //     if (value && value.trim() !== '') {
  //       observer.disconnect();
  //       resolve(value);
  //     }
  //   });
    
  //   observer.observe(el, { attributes: true, attributeFilter: ['data-userid'] });
    
  //   // Timeout after 2 seconds
  //   setTimeout(() => {
  //     observer.disconnect();
  //     resolve(null);
  //   }, 2000);
  // });
  // console.log('Retrieved userid:', userid);
  //   // const userid = window.getGlobal ? window.getGlobal('userid') : null;
  //   const sessionData = {
  //     email,
  //     fullName,
  //     userid,
  //     loginTime: new Date().toISOString(),
  //   };

  //   localStorage.setItem('carfSession', JSON.stringify(sessionData));
  //   setIsLoggedIn(true);
  //   setUserEmail(email);

  //   toast({
  //     title: 'Successfully Logged In!',
  //     description: `Welcome to CARF System, ${fullName || email}`,
  //   });
  // };

  const handleLogin = async (email: string, fullName?: string) => {
    const getUserId = (): Promise<string | null> => {
      return new Promise((resolve) => {
        let attempts = 0;
        const maxAttempts = 60; // 3 seconds
        
        const checkUserId = () => {
          const el = document.getElementById('hidden-userid');
          const userid = el?.getAttribute('data-userid');
          
          if (userid && userid.trim() !== '') {
            resolve(userid);
          } else if (attempts < maxAttempts) {
            attempts++;
            setTimeout(checkUserId, 50);
          } else {
            resolve(null);
          }
        };
        
        checkUserId();
      });
    };

    const userid = await getUserId();
    
    const sessionData = {
      email,
      fullName,
      userid,
      loginTime: new Date().toISOString(),
    };
    
    localStorage.setItem('carfSession', JSON.stringify(sessionData));
    setIsLoggedIn(true);
    setUserEmail(email);
    setUserId(userid); // ✅ Store in state
    
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
  // const forceLogin = true;
  // if (forceLogin) {
  //   return <DashboardLayout userEmail={userEmail} onLogout={handleLogout} />;
  // }

  // return <LoginPage onLogin={handleLogin} />;
  return (
    <>
      {/* ✅ MOVED HERE - Now exists before login */}
      <div id="hidden-userid" data-userid="acbaldonado" className="hidden"></div>
      
      {isLoggedIn ? (
        <DashboardLayout 
          userEmail={userEmail} 
          userId={userId}
          onLogout={handleLogout} 
        />
      ) : (
        <LoginPage onLogin={handleLogin} />
      )}
    </>
  );

};

export default Index;

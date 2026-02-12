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
  const [userId, setUserId] = useState<string | null>(null);

  // Load session
  useEffect(() => {
    const sessionData = localStorage.getItem('carfSession');
    if (sessionData) {
      const session = JSON.parse(sessionData);
      setIsLoggedIn(true);
      setUserEmail(session.email);
      setUserId(session.userid);

      // Update hidden div manually
      const el = document.getElementById('hidden-userid');
      if (el) el.setAttribute('data-userid', session.userid ?? '');
    }
  }, []);

  // Define global function
  useEffect(() => {
    window.getGlobal = (key: string): string | null => {
      if (key === 'userid') {
        const el = document.getElementById('hidden-userid');
        return el?.getAttribute('data-userid') || null;
      }
      return null;
    };
  }, []);

  // Handle login
  const handleLogin = async (email: string, fullName?: string, useridFromDB?: string) => {
    // ✅ Update hidden div with the actual userid
    const el = document.getElementById('hidden-userid');
    if (el && useridFromDB) el.setAttribute('data-userid', useridFromDB);

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
    setUserId(null);

    toast({
      title: 'Logged Out',
      description: 'You have been successfully logged out.',
    });
  };

  return (
    <>
      {/* Hidden div stays in DOM */}
      <div id="hidden-userid" data-userid="" className="hidden"></div>
      
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

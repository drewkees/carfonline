import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User, AlertCircle, AtSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface LoginPageProps {
  onLogin: (email: string, fullName: string, userid: string) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);
  const [error, setError] = useState('');

  // ✅ Whitelist of allowed Gmail addresses
  const allowedGmailAddresses = [
    'baldonado0514@gmail.com',
    'shiterunero@gmail.com'
  ];

  // ✅ Helper function to determine company based on email domain
  const getCompanyFromEmail = (email: string): string | null => {
    // Check if it's a whitelisted Gmail address
    if (allowedGmailAddresses.includes(email.toLowerCase())) {
      return 'BPI'; // Default company for whitelisted emails
    }
    
    if (email.endsWith('@bounty.com.ph')) {
      return 'BPI';
    } else if (email.endsWith('@chookstogoinc.com.ph')) {
      return 'CTGI';
    }
    return null; // Not an allowed domain
  };

  // ✅ Validate if email domain is allowed
  const isAllowedEmail = (email: string): boolean => {
    return getCompanyFromEmail(email) !== null;
  };

  // Check session and user in Supabase table
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;

      if (session?.user?.email) {
        const userEmail = session.user.email;

        // ✅ Validate email domain
        if (!isAllowedEmail(userEmail)) {
          setError('Access denied. Only authorized email addresses are allowed.');
          await supabase.auth.signOut(); // Sign out unauthorized user
          return;
        }

        setEmail(userEmail);

        // Check if user exists in Supabase table
        const { data: existingUser, error: fetchError } = await supabase
          .from('users')
          .select('*')
          .eq('email', userEmail)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
          setError('Failed to fetch user data');
          console.error(fetchError);
          return;
        }

        if (!existingUser) {
          setIsFirstTimeUser(true); // prompt for full name
        } else {
          // user exists, auto-login
          onLogin(existingUser.email, existingUser.fullname, existingUser.userid);
        }
      }
    };

    checkSession();
  }, [onLogin]);

  const handleGoogleSignIn = async () => {
    try {
      const redirectUrl =
        process.env.NODE_ENV === 'production'
          ? 'https://carf-eight.vercel.app/'
          : 'http://localhost:8080';

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: redirectUrl },
      });

      if (error) throw error;
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Google Sign-In failed');
    }
  };

  const handleSubmit = async () => {
    if (!fullName) {
      setError('Full Name is required for first-time users.');
      return;
    }

    // ✅ Validate email domain before creating user
    if (!isAllowedEmail(email)) {
      setError('Access denied. Only authorized email addresses are allowed.');
      await supabase.auth.signOut();
      return;
    }

    try {
      const userid = email.split('@')[0];
      const company = getCompanyFromEmail(email); // ✅ Get company based on email
      const usergroup = 'salesadmin'; // ✅ Default usergroup

      // ✅ Insert new user with company and usergroup
      const { data, error: insertError } = await supabase
        .from('users')
        .insert([
          {
            email,
            fullname: fullName,
            userid,
            company, // ✅ Add company field
            usergroup, // ✅ Add usergroup field
          },
        ])
        .select()
        .single();

      if (insertError) throw insertError;

      // Success, proceed
      onLogin(data.email, data.fullname,data.userid);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to save user data');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md carf-gradient-card border-border">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-foreground">
            Welcome Back!
          </CardTitle>
          <div className="w-full h-px bg-border mt-4" />
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Show Google Sign-in if no email */}
          {!email && (
            <Button
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl"
            >
              <AtSign className="w-5 h-5" />
              <span>Sign in with Google</span>
            </Button>
          )}

          {/* Show full name input for first-time users */}
          {isFirstTimeUser && email && (
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-foreground">
                Full Name
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="pl-10 carf-input-overlay border-border text-foreground"
                />
              </div>
              <Button
                onClick={handleSubmit}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold rounded-xl py-3"
              >
                Submit
              </Button>
            </div>
          )}

          {/* Error messages */}
          {error && (
            <Alert className="border-destructive/20 bg-destructive/10">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-destructive-foreground">
                {error}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User, AlertCircle, AtSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface LoginPageProps {
  onLogin: (email: string, fullName?: string) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);
  const [error, setError] = useState('');

  // Check session and user in Supabase table
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;

      if (session?.user?.email) {
        const userEmail = session.user.email;
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
          onLogin(existingUser.email, existingUser.fullname);
        }
      }
    };

    checkSession();
  }, [onLogin]);

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
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

    try {
      // Insert new user into Supabase table
      const userid = email.split('@')[0];
      const { data, error: insertError } = await supabase
        .from('users')
        .insert([{ email, fullname: fullName, userid }])
        .select()
        .single();

      if (insertError) throw insertError;

      // Success, proceed
      onLogin(data.email, data.fullname);
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

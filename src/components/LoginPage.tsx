import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, User, AlertCircle } from 'lucide-react';

interface LoginPageProps {
  onLogin: (email: string, fullName?: string) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('user@bounty.com.ph');
  const [fullName, setFullName] = useState('');
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);
  const [error, setError] = useState('');

  const handleEmailValidation = () => {
    if (!email) {
      setError('Email is required');
      return;
    }

    if (!email.endsWith('@bounty.com.ph') && !email.endsWith('@chookstogoinc.com.ph')) {
      setError('Kindly associate your bounty email to access this CARF System..');
      return;
    }

    // Check if first time user (simplified for demo)
    const isFirstTime = localStorage.getItem(`user_${email}`) === null;
    if (isFirstTime) {
      setIsFirstTimeUser(true);
      setError('');
    } else {
      setError('');
      onLogin(email);
    }
  };

  const handleSubmit = () => {
    if (isFirstTimeUser && !fullName) {
      setError('Full Name is required for first-time users.');
      return;
    }

    if (isFirstTimeUser) {
      localStorage.setItem(`user_${email}`, JSON.stringify({
        email,
        fullName,
        created: new Date().toISOString()
      }));
    }

    onLogin(email, fullName);
  };

  const handleSwitchEmail = () => {
    setEmail('');
    setIsFirstTimeUser(false);
    setError('');
  };

  React.useEffect(() => {
    if (email && (email.endsWith('@bounty.com.ph') || email.endsWith('@chookstogoinc.com.ph'))) {
      handleEmailValidation();
    }
  }, [email]);

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
          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground">Account</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 carf-input-overlay border-border text-foreground"
                disabled={isFirstTimeUser}
              />
            </div>
          </div>

          {isFirstTimeUser && (
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-foreground">Full Name</Label>
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

          {!isFirstTimeUser && !error && (
            <Button
              onClick={handleEmailValidation}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold rounded-xl py-3"
            >
              Continue
            </Button>
          )}

          {error && (
            <>
              <Alert className="border-destructive/20 bg-destructive/10">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-destructive-foreground">
                  {error}
                </AlertDescription>
              </Alert>
              
              <Button
                variant="secondary"
                onClick={handleSwitchEmail}
                className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 font-bold rounded-xl py-3"
              >
                Switch Email
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User, AlertCircle, AtSign, Building2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type CompanyRow = Database['public']['Tables']['company']['Row'];

interface LoginPageProps {
  onLogin: (email: string, fullName: string, userid: string) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);
  const [error, setError] = useState('');

  const allowedGmailAddresses = [
    'baldonado0514@gmail.com',
    'shiterunero@gmail.com',
  ];

  const getCompanyFromEmail = (email: string): string | null => {
    if (allowedGmailAddresses.includes(email.toLowerCase())) return 'BPI';
    if (email.endsWith('@bounty.com.ph')) return 'BPI';
    if (email.endsWith('@chookstogoinc.com.ph')) return 'CTGI';
    return null;
  };

  const isAllowedEmail = (email: string): boolean => getCompanyFromEmail(email) !== null;

  // Fetch companies for the dropdown
  useEffect(() => {
    const fetchCompanies = async () => {
      const { data, error } = await supabase
        .from('company')
        .select('*')
        .order('company_name', { ascending: true });
      if (!error && data) setCompanies(data);
    };
    fetchCompanies();
  }, []);

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;

      if (session?.user?.email) {
        const userEmail = session.user.email;

        if (!isAllowedEmail(userEmail)) {
          setError('Access denied. Only authorized email addresses are allowed.');
          await supabase.auth.signOut();
          return;
        }

        setEmail(userEmail);

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
          // Pre-select company based on email domain
          const defaultCompany = getCompanyFromEmail(userEmail);
          if (defaultCompany) setSelectedCompany(defaultCompany);
          setIsFirstTimeUser(true);
        } else {
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
    if (!fullName.trim()) {
      setError('Full Name is required.');
      return;
    }
    if (!selectedCompany) {
      setError('Please select a company.');
      return;
    }
    if (!isAllowedEmail(email)) {
      setError('Access denied. Only authorized email addresses are allowed.');
      await supabase.auth.signOut();
      return;
    }

    try {
      const userid = email.split('@')[0];
      const usergroup = 'salesadmin';

      const { data, error: insertError } = await supabase
        .from('users')
        .insert([{
          email,
          fullname: fullName,
          userid,
          company: selectedCompany,
          usergroup,
        }])
        .select()
        .single();

      if (insertError) throw insertError;
      const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
      const userRes = await fetch(`${BASE_URL}/api/submitusers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rows: [{
            email: data.email,
            fullname: data.fullname,
            userid: data.userid,
            company: data.company,
            usergroup: data.usergroup,
          }],
        }),
      });


      onLogin(data.email, data.fullname, data.userid);
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
          {/* Google Sign-in */}
          {!email && (
            <Button
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl"
            >
              <AtSign className="w-5 h-5" />
              <span>Sign in with Google</span>
            </Button>
          )}

          {/* First-time user form */}
          {isFirstTimeUser && email && (
            <div className="space-y-4">
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-foreground">
                  Full Name
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) => { setFullName(e.target.value); setError(''); }}
                    className="pl-10 carf-input-overlay border-border text-foreground"
                  />
                </div>
              </div>

              {/* Company Selection */}
              <div className="space-y-2">
                <Label htmlFor="company" className="text-foreground">
                  Company
                </Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                  <select
                    id="company"
                    value={selectedCompany}
                    onChange={(e) => { setSelectedCompany(e.target.value); setError(''); }}
                    className="w-full pl-10 pr-4 py-2 rounded-md border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring appearance-none cursor-pointer"
                  >
                    <option value="">-- Select Company --</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.company}>
                        {c.company_name} ({c.company})
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">▾</div>
                </div>
              </div>

              <Button
                onClick={handleSubmit}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold rounded-xl py-3"
              >
                Submit
              </Button>
            </div>
          )}

          {/* Error */}
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
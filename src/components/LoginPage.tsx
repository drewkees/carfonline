import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User, AlertCircle, Building2, ArrowRight, ShieldCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import HowToUseCarfModal from '@/components/HowToUseCarfModal';

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
  const [authLoading, setAuthLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

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
      try {
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
            setAuthLoading(true);
            onLogin(existingUser.email, existingUser.fullname, existingUser.userid);
            return;
          }
        }
      } finally {
        setCheckingSession(false);
      }
    };

    checkSession();
  }, [onLogin]);

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      setAuthLoading(true);
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
      setAuthLoading(false);
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
      setError('');
      setAuthLoading(true);
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
      await fetch(`${BASE_URL}/api/submitusers`, {
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
      setAuthLoading(false);
    }
  };

  if (authLoading || checkingSession) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <style>{`
          .loader {
            width: fit-content;
            height: fit-content;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .truckWrapper {
            width: 200px;
            height: 100px;
            display: flex;
            flex-direction: column;
            position: relative;
            align-items: center;
            justify-content: flex-end;
            overflow-x: hidden;
          }

          .truckBody {
            width: 130px;
            height: fit-content;
            margin-bottom: 6px;
            animation: motion 1s linear infinite;
          }

          @keyframes motion {
            0% { transform: translateY(0px); }
            50% { transform: translateY(3px); }
            100% { transform: translateY(0px); }
          }

          .truckTires {
            width: 130px;
            height: fit-content;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0px 10px 0px 15px;
            position: absolute;
            bottom: 0;
          }

          .truckTires svg {
            width: 24px;
          }

          .road {
            width: 100%;
            height: 1.5px;
            background-color: #282828;
            position: relative;
            bottom: 0;
            align-self: flex-end;
            border-radius: 3px;
          }

          .road::before {
            content: "";
            position: absolute;
            width: 20px;
            height: 100%;
            background-color: #282828;
            right: -50%;
            border-radius: 3px;
            animation: roadAnimation 1.4s linear infinite;
            border-left: 10px solid white;
          }

          .road::after {
            content: "";
            position: absolute;
            width: 10px;
            height: 100%;
            background-color: #282828;
            right: -65%;
            border-radius: 3px;
            animation: roadAnimation 1.4s linear infinite;
            border-left: 4px solid white;
          }

          .lampPost {
            position: absolute;
            bottom: 0;
            right: -90%;
            height: 90px;
            animation: roadAnimation 1.4s linear infinite;
          }

          @keyframes roadAnimation {
            0% { transform: translateX(0px); }
            100% { transform: translateX(-350px); }
          }
        `}</style>

        <div className="loader">
          <div className="truckWrapper">
            <div className="truckBody">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 198 93"
                className="trucksvg"
              >
                <path
                  strokeWidth="3"
                  stroke="#282828"
                  fill="#F83D3D"
                  d="M135 22.5H177.264C178.295 22.5 179.22 23.133 179.594 24.0939L192.33 56.8443C192.442 57.1332 192.5 57.4404 192.5 57.7504V89C192.5 90.3807 191.381 91.5 190 91.5H135C133.619 91.5 132.5 90.3807 132.5 89V25C132.5 23.6193 133.619 22.5 135 22.5Z"
                />
                <path
                  strokeWidth="3"
                  stroke="#282828"
                  fill="#7D7C7C"
                  d="M146 33.5H181.741C182.779 33.5 183.709 34.1415 184.078 35.112L190.538 52.112C191.16 53.748 189.951 55.5 188.201 55.5H146C144.619 55.5 143.5 54.3807 143.5 53V36C143.5 34.6193 144.619 33.5 146 33.5Z"
                />
                <path
                  strokeWidth="2"
                  stroke="#282828"
                  fill="#282828"
                  d="M150 65C150 65.39 149.763 65.8656 149.127 66.2893C148.499 66.7083 147.573 67 146.5 67C145.427 67 144.501 66.7083 143.873 66.2893C143.237 65.8656 143 65.39 143 65C143 64.61 143.237 64.1344 143.873 63.7107C144.501 63.2917 145.427 63 146.5 63C147.573 63 148.499 63.2917 149.127 63.7107C149.763 64.1344 150 64.61 150 65Z"
                />
                <rect strokeWidth="2" stroke="#282828" fill="#FFFCAB" rx="1" height="7" width="5" y="63" x="187" />
                <rect strokeWidth="2" stroke="#282828" fill="#282828" rx="1" height="11" width="4" y="81" x="193" />
                <rect strokeWidth="3" stroke="#282828" fill="#DFDFDF" rx="2.5" height="90" width="121" y="1.5" x="6.5" />
                <rect strokeWidth="2" stroke="#282828" fill="#DFDFDF" rx="2" height="4" width="6" y="84" x="1" />
              </svg>
            </div>

            <div className="truckTires">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 30 30" className="tiresvg">
                <circle strokeWidth="3" stroke="#282828" fill="#282828" r="13.5" cy="15" cx="15" />
                <circle fill="#DFDFDF" r="7" cy="15" cx="15" />
              </svg>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 30 30" className="tiresvg">
                <circle strokeWidth="3" stroke="#282828" fill="#282828" r="13.5" cy="15" cx="15" />
                <circle fill="#DFDFDF" r="7" cy="15" cx="15" />
              </svg>
            </div>

            <div className="road" />

            <svg
              xmlSpace="preserve"
              viewBox="0 0 453.459 453.459"
              xmlnsXlink="http://www.w3.org/1999/xlink"
              xmlns="http://www.w3.org/2000/svg"
              fill="#000000"
              className="lampPost"
            >
              <path d="M252.882,0c-37.781,0-68.686,29.953-70.245,67.358h-6.917v8.954c-26.109,2.163-45.463,10.011-45.463,19.366h9.993c-1.65,5.146-2.507,10.54-2.507,16.017c0,28.956,23.558,52.514,52.514,52.514c28.956,0,52.514-23.558,52.514-52.514c0-5.478-0.856-10.872-2.506-16.017h9.992c0-9.354-19.352-17.204-45.463-19.366v-8.954h-6.149C200.189,38.779,223.924,16,252.882,16c29.952,0,54.32,24.368,54.32,54.32c0,28.774-11.078,37.009-25.105,47.437c-17.444,12.968-37.216,27.667-37.216,78.884v113.914h-0.797c-5.068,0-9.174,4.108-9.174,9.177c0,2.844,1.293,5.383,3.321,7.066c-3.432,27.933-26.851,95.744-8.226,115.459v11.202h45.75v-11.202c18.625-19.715-4.794-87.527-8.227-115.459c2.029-1.683,3.322-4.223,3.322-7.066c0-5.068-4.107-9.177-9.176-9.177h-0.795V196.641c0-43.174,14.942-54.283,30.762-66.043c14.793-10.997,31.559-23.461,31.559-60.277C323.202,31.545,291.656,0,252.882,0zM232.77,111.694c0,23.442-19.071,42.514-42.514,42.514c-23.442,0-42.514-19.072-42.514-42.514c0-5.531,1.078-10.957,3.141-16.017h78.747C231.693,100.736,232.77,106.162,232.77,111.694z" />
            </svg>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg border-slate-200 bg-white shadow-[0_16px_36px_rgba(15,23,42,0.08)]">
        <CardHeader className="text-center space-y-3 pb-4">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-[11px] tracking-wide text-slate-700 uppercase">
            <ShieldCheck className="h-3.5 w-3.5" />
            Secure Workspace
          </div>
          <p className="text-xs tracking-[0.2em] text-slate-500 uppercase">Online CARF</p>
          <CardTitle className="text-2xl font-semibold text-slate-800">
            Welcome Back
          </CardTitle>
          <p className="text-sm text-slate-600">
            Sign in to manage customer activation requests
          </p>
          <div className="w-full h-px bg-slate-200 mt-2" />
        </CardHeader>

        <CardContent className="space-y-6">
          {!email && (
            <Button
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-2 bg-slate-700 text-white hover:bg-slate-600 border border-slate-700 font-semibold py-3 rounded-xl"
            >
              <ArrowRight className="w-4 h-4" />
              <span>Continue with Google</span>
            </Button>
          )}

          {isFirstTimeUser && email && (
            <div className="space-y-4">
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
                    onChange={(e) => {
                      setFullName(e.target.value);
                      setError('');
                    }}
                    className="pl-10 border-slate-300 text-slate-700 bg-white focus-visible:ring-2 focus-visible:ring-slate-400"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="company" className="text-foreground">
                  Company
                </Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                  <select
                    id="company"
                    value={selectedCompany}
                    onChange={(e) => {
                      setSelectedCompany(e.target.value);
                      setError('');
                    }}
                    className="w-full pl-10 pr-8 py-2 rounded-md border border-slate-300 bg-white text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 appearance-none cursor-pointer"
                  >
                    <option value="">-- Select Company --</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.company}>
                        {c.company_name} ({c.company})
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">v</div>
                </div>
              </div>

              <Button
                onClick={handleSubmit}
                className="w-full bg-slate-700 text-white hover:bg-slate-600 font-semibold rounded-xl py-3"
              >
                Continue
              </Button>
            </div>
          )}

          {error && (
            <Alert className="border-destructive/20 bg-destructive/10">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-destructive-foreground">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <HowToUseCarfModal />
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;

import React, { useState } from 'react';
import { 
  Pill, 
  HeartHandshake, 
  User, 
  Lock, 
  Mail, 
  Phone, 
  ArrowRight, 
  Shield, 
  Check, 
  Sparkles,
  KeyRound,
  Eye,
  EyeOff,
  Palette,
  CheckCircle2,
  Stethoscope,
  Activity,
  Clock,
  Flame,
  AlertTriangle,
  Droplets,
  Calendar,
  Building2,
  CheckCircle,
  AlertCircle,
  ScanLine
} from 'lucide-react';
import { UserAccount, UserRole } from '../../types';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../../lib/firebase';

export type LoginTheme = 'ocean' | 'emerald' | 'sapphire' | 'clean-light';

interface AuthShellProps {
  onLoginSuccess: (account: UserAccount) => void;
  registeredAccounts: UserAccount[];
  onRegisterAccount: (account: UserAccount) => void;
  onUpdateAccountPassword: (email: string, newPass: string) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const AuthShell: React.FC<AuthShellProps> = ({
  onLoginSuccess,
  registeredAccounts,
  onRegisterAccount,
  onUpdateAccountPassword,
  showToast,
}) => {
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [selectedRole, setSelectedRole] = useState<UserRole>('patient');
  const [activeTheme, setActiveTheme] = useState<LoginTheme>('ocean');

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('patient@meditrack.com');
  const [loginPassword, setLoginPassword] = useState('pass123');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Sign up form state
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [signupAge, setSignupAge] = useState('');
  const [signupCondition, setSignupCondition] = useState('');
  const [signupRelation, setSignupRelation] = useState('');
  const [signupLicense, setSignupLicense] = useState('');

  // Forgot password modal state
  const [isForgotPwOpen, setIsForgotPwOpen] = useState(false);

  // Switch role helper
  const handleRoleChange = (role: UserRole) => {
    setSelectedRole(role);
    if (role === 'caregiver') {
      setLoginIdentifier('caregiver@meditrack.com');
    } else {
      setLoginIdentifier('patient@meditrack.com');
    }
    setLoginPassword('pass123');
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const cleanUser = loginIdentifier.trim().toLowerCase();
    const cleanPass = loginPassword.trim();

    // Check against registered accounts list
    const foundUser = registeredAccounts.find(
      (acc) =>
        (acc.email.toLowerCase() === cleanUser || (acc.phone && acc.phone.replace(/\s+/g, '') === cleanUser)) &&
        acc.password === cleanPass
    );

    if (foundUser) {
      showToast(`Welcome back, ${foundUser.name}!`, 'success');
      onLoginSuccess(foundUser);
      return;
    }

    // Default fallback check for demo
    if (
      (cleanUser === 'patient@meditrack.com' || cleanUser === 'caregiver@meditrack.com') &&
      cleanPass === 'pass123'
    ) {
      const fallbackRole: UserRole = cleanUser.includes('caregiver') ? 'caregiver' : 'patient';
      const fallbackAccount: UserAccount = {
        id: 'demo-' + fallbackRole,
        name: fallbackRole === 'caregiver' ? 'Sonia Verma' : 'Raj Kumar',
        email: cleanUser,
        role: fallbackRole,
        password: cleanPass,
        createdDate: new Date().toISOString(),
      };
      showToast(`Welcome back, ${fallbackAccount.name}!`, 'success');
      onLoginSuccess(fallbackAccount);
      return;
    }

    showToast('Invalid credentials. Check password or use "Forgot Password?" below.', 'error');
  };

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const account: UserAccount = {
        id: user.uid,
        name: user.displayName || 'Google User',
        email: user.email || 'user@meditrack.com',
        role: selectedRole,
        password: '',
        createdDate: new Date().toISOString(),
      };
      showToast(`Signed in with Google as ${account.name}`, 'success');
      onLoginSuccess(account);
    } catch (err: any) {
      console.warn('Google sign-in error:', err);
      showToast(err.message || 'Google Sign-In was cancelled or failed.', 'error');
    }
  };

  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!signupName.trim() || !signupEmail.trim() || !signupPassword.trim()) {
      showToast('Please fill all required fields.', 'error');
      return;
    }

    if (signupPassword !== signupConfirmPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }

    if (signupPassword.length < 6) {
      showToast('Password must be at least 6 characters.', 'error');
      return;
    }

    const newAccount: UserAccount = {
      id: 'usr_' + Date.now(),
      name: signupName.trim(),
      email: signupEmail.trim().toLowerCase(),
      phone: signupPhone.trim(),
      role: selectedRole,
      password: signupPassword,
      createdDate: new Date().toISOString(),
      age: signupAge ? Number(signupAge) : undefined,
      condition: signupCondition.trim() || undefined,
      relation: signupRelation.trim() || undefined,
      license: signupLicense.trim() || undefined,
    };

    onRegisterAccount(newAccount);
    showToast('Account created successfully! Logging you in...', 'success');
    onLoginSuccess(newAccount);
  };

  const handlePasswordResetSuccess = (email: string, newPass: string) => {
    onUpdateAccountPassword(email, newPass);
    setLoginIdentifier(email);
    setLoginPassword(newPass);
    showToast(`Password successfully updated for ${email}`, 'success');
  };

  // Dynamic theme-based styling configurations
  const themeStyles = {
    ocean: {
      bg: 'bg-gradient-to-br from-slate-950 via-teal-950/80 to-slate-900',
      glow1: 'bg-teal-500/20',
      glow2: 'bg-cyan-500/20',
      glow3: 'bg-emerald-500/15',
      brandGradient: 'from-teal-500 via-cyan-500 to-blue-600',
      brandText: 'from-teal-400 via-cyan-300 to-blue-400',
      primaryBtn: 'bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 hover:from-teal-500 hover:to-blue-500 text-white shadow-teal-500/25',
      activeRole: 'bg-teal-950/60 border-teal-400 text-teal-200 ring-teal-500/30',
      activeRoleIcon: 'bg-teal-500 text-slate-950',
      accentColor: 'text-teal-400',
      focusRing: 'focus:ring-teal-400',
      borderAccent: 'border-teal-500/30',
      cardBg: 'bg-slate-900/90 border-slate-800',
      cardText: 'text-white',
      subText: 'text-slate-400',
      inputBg: 'bg-slate-800/80 border-slate-700 text-white placeholder-slate-500',
      badgeBg: 'bg-teal-950/60 text-teal-300 border-teal-800/60',
    },
    emerald: {
      bg: 'bg-gradient-to-br from-slate-950 via-emerald-950/80 to-slate-900',
      glow1: 'bg-emerald-500/20',
      glow2: 'bg-lime-500/15',
      glow3: 'bg-teal-500/15',
      brandGradient: 'from-emerald-500 via-teal-500 to-green-600',
      brandText: 'from-emerald-400 via-teal-300 to-lime-300',
      primaryBtn: 'bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-500/25',
      activeRole: 'bg-emerald-950/60 border-emerald-400 text-emerald-200 ring-emerald-500/30',
      activeRoleIcon: 'bg-emerald-500 text-slate-950',
      accentColor: 'text-emerald-400',
      focusRing: 'focus:ring-emerald-400',
      borderAccent: 'border-emerald-500/30',
      cardBg: 'bg-slate-900/90 border-slate-800',
      cardText: 'text-white',
      subText: 'text-slate-400',
      inputBg: 'bg-slate-800/80 border-slate-700 text-white placeholder-slate-500',
      badgeBg: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60',
    },
    sapphire: {
      bg: 'bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950',
      glow1: 'bg-blue-600/20',
      glow2: 'bg-indigo-600/20',
      glow3: 'bg-sky-500/15',
      brandGradient: 'from-blue-600 via-indigo-600 to-sky-500',
      brandText: 'from-blue-400 via-indigo-300 to-sky-400',
      primaryBtn: 'bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-500/25',
      activeRole: 'bg-blue-950/60 border-blue-400 text-blue-200 ring-blue-500/30',
      activeRoleIcon: 'bg-blue-600 text-white',
      accentColor: 'text-blue-400',
      focusRing: 'focus:ring-blue-400',
      borderAccent: 'border-blue-500/30',
      cardBg: 'bg-slate-900/90 border-slate-800',
      cardText: 'text-white',
      subText: 'text-slate-400',
      inputBg: 'bg-slate-800/80 border-slate-700 text-white placeholder-slate-500',
      badgeBg: 'bg-blue-950/60 text-blue-300 border-blue-800/60',
    },
    'clean-light': {
      bg: 'bg-gradient-to-br from-slate-100 via-sky-50 to-teal-50/70',
      glow1: 'bg-blue-400/15',
      glow2: 'bg-teal-400/15',
      glow3: 'bg-indigo-400/10',
      brandGradient: 'from-blue-600 via-teal-600 to-indigo-600',
      brandText: 'from-blue-700 via-teal-700 to-indigo-800',
      primaryBtn: 'bg-gradient-to-r from-blue-600 via-teal-600 to-indigo-700 hover:from-blue-700 hover:to-teal-700 text-white shadow-blue-500/20',
      activeRole: 'bg-blue-50 border-blue-600 text-blue-900 ring-blue-500/20',
      activeRoleIcon: 'bg-blue-600 text-white',
      accentColor: 'text-blue-600',
      focusRing: 'focus:ring-blue-500',
      borderAccent: 'border-blue-200',
      cardBg: 'bg-white/95 border-slate-200 shadow-xl',
      cardText: 'text-slate-900',
      subText: 'text-slate-600',
      inputBg: 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400',
      badgeBg: 'bg-blue-50 text-blue-800 border-blue-200',
    },
  };

  const currentTheme = themeStyles[activeTheme];

  return (
    <div className={`min-h-screen flex flex-col justify-center items-center p-3 sm:p-6 ${currentTheme.bg} relative overflow-hidden transition-colors duration-700`}>
      {/* Dynamic Role Background Mood Overlay */}
      {selectedRole === 'patient' ? (
        <div className="absolute inset-0 pointer-events-none overflow-hidden transition-opacity duration-700">
          {/* Calming emerald/teal health glow */}
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-[140px] animate-pulseGlow" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[130px] animate-pulseGlow" />
          
          {/* Subtle floating medicine capsules & wellness particles */}
          <div className="absolute top-16 left-[10%] opacity-20 text-teal-300 animate-floatSlow">
            <Pill className="w-16 h-16 rotate-45" />
          </div>
          <div className="absolute bottom-24 right-[12%] opacity-15 text-emerald-400 animate-floatSlow" style={{ animationDelay: '2.5s' }}>
            <Pill className="w-20 h-20 -rotate-12" />
          </div>
          <div className="absolute top-1/3 right-[8%] opacity-15 text-cyan-400 animate-floatSlow" style={{ animationDelay: '1.2s' }}>
            <CheckCircle className="w-12 h-12" />
          </div>
          <div className="absolute bottom-1/3 left-[7%] opacity-15 text-teal-400 animate-floatSlow" style={{ animationDelay: '3.1s' }}>
            <Droplets className="w-12 h-12" />
          </div>
        </div>
      ) : (
        <div className="absolute inset-0 pointer-events-none overflow-hidden transition-opacity duration-700">
          {/* Deep clinical sapphire/indigo emergency aura */}
          <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-blue-600/15 rounded-full blur-[140px] animate-pulseGlow" />
          <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[130px] animate-pulseGlow" />
          
          {/* Clinical Telemetry Grid Lines */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#38bdf80a_1px,transparent_1px),linear-gradient(to_bottom,#38bdf80a_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] opacity-70" />

          {/* Sweeping glowing ECG Heartbeat Waveform Line */}
          <div className="absolute bottom-12 left-0 right-0 w-full overflow-hidden opacity-30">
            <svg className="w-full h-28 min-w-[900px]" preserveAspectRatio="none" viewBox="0 0 1200 120">
              <path 
                d="M0,60 L180,60 L195,60 L205,25 L215,95 L225,35 L235,75 L245,60 L500,60 L515,60 L525,25 L535,95 L545,35 L555,75 L565,60 L820,60 L835,60 L845,25 L855,95 L865,35 L875,75 L885,60 L1200,60" 
                fill="none" 
                stroke="#38bdf8" 
                strokeWidth="2.5" 
                className="animate-ecg" 
              />
            </svg>
          </div>

          {/* Clinical telemetry float markers */}
          <div className="absolute top-20 left-[8%] opacity-20 text-blue-400 animate-floatSlow">
            <Activity className="w-16 h-16" />
          </div>
          <div className="absolute top-1/4 right-[7%] opacity-20 text-indigo-400 animate-floatSlow" style={{ animationDelay: '2s' }}>
            <Stethoscope className="w-16 h-16" />
          </div>
        </div>
      )}

      {/* Background Decorative Ambient Orbs */}
      <div className={`absolute -top-40 -right-40 w-96 h-96 rounded-full ${currentTheme.glow1} blur-3xl pointer-events-none transition-all duration-700`} />
      <div className={`absolute -bottom-40 -left-40 w-96 h-96 rounded-full ${currentTheme.glow2} blur-3xl pointer-events-none transition-all duration-700`} />
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] rounded-full ${currentTheme.glow3} blur-[120px] pointer-events-none transition-all duration-700`} />

      {/* Top Bar: Role Status Badge & Theme Switcher */}
      <div className="w-full max-w-7xl mx-auto flex items-center justify-between mb-4 sm:mb-6 z-20 px-2 sm:px-4">
        {/* Dynamic Role Aura Badge */}
        <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border backdrop-blur-md text-xs font-semibold shadow-md transition-all duration-500 ${
          selectedRole === 'patient'
            ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-200'
            : 'bg-indigo-950/70 border-blue-500/40 text-blue-200'
        }`}>
          {selectedRole === 'patient' ? (
            <>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <Pill className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline font-bold">Patient Portal</span>
              <span className="opacity-75 hidden md:inline">• Daily Adherence & Health Companion</span>
            </>
          ) : (
            <>
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse" />
              <Activity className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline font-bold">Caregiver Hub</span>
              <span className="opacity-75 hidden md:inline">• Clinical Patient Triage & Safety</span>
            </>
          )}
        </div>

        {/* Top Floating Theme Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900/80 backdrop-blur-md rounded-2xl border border-white/10 shadow-lg text-xs">
          <span className="text-[10px] font-bold text-slate-400 px-2 flex items-center gap-1 hidden sm:flex">
            <Palette className="w-3 h-3 text-cyan-400" /> Theme:
          </span>
          <button
            onClick={() => setActiveTheme('ocean')}
            title="Ocean Teal Theme"
            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1 ${
              activeTheme === 'ocean' ? 'bg-teal-500 text-slate-950 shadow-md' : 'text-slate-300 hover:text-white'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-teal-400" />
            Ocean
          </button>
          <button
            onClick={() => setActiveTheme('emerald')}
            title="Emerald Health Theme"
            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1 ${
              activeTheme === 'emerald' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-300 hover:text-white'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Emerald
          </button>
          <button
            onClick={() => setActiveTheme('sapphire')}
            title="Sapphire Blue Theme"
            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1 ${
              activeTheme === 'sapphire' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-300 hover:text-white'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            Sapphire
          </button>
          <button
            onClick={() => setActiveTheme('clean-light')}
            title="Clean Light Theme"
            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1 ${
              activeTheme === 'clean-light' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-300 hover:text-white'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-sky-300" />
            Light
          </button>
        </div>
      </div>

      {/* Main Row: Flanking Desktop Telemetry + Center Auth Card */}
      <div className="w-full max-w-6xl mx-auto flex items-center justify-center gap-6 xl:gap-8 relative z-10">
        
        {/* LEFT FLANKING PREVIEW PANEL (Visible on lg/xl screens) */}
        <div className="hidden lg:flex w-72 xl:w-80 flex-col gap-4 shrink-0 transition-all duration-500">
          {selectedRole === 'patient' ? (
            /* PATIENT MODE LEFT CARD: Today's Routine & Streak */
            <div className="bg-slate-900/80 backdrop-blur-xl border border-teal-500/25 rounded-3xl p-5 shadow-2xl relative overflow-hidden group hover:border-teal-500/40 transition-all">
              <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Today's Routine</h3>
                    <p className="text-[11px] text-teal-300/80">3 Scheduled Doses</p>
                  </div>
                </div>
                <span className="text-[10px] bg-teal-950/80 text-teal-300 border border-teal-800/60 px-2 py-0.5 rounded-full font-bold">
                  Patient View
                </span>
              </div>

              {/* Doses preview */}
              <div className="space-y-2.5">
                <div className="p-2.5 rounded-xl bg-slate-800/70 border border-slate-700/60 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <div>
                      <p className="text-xs font-semibold text-white">Metformin 500mg</p>
                      <p className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" /> 8:00 AM • Breakfast
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <Check className="w-2.5 h-2.5" /> Taken
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-800/70 border border-slate-700/60 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <div>
                      <p className="text-xs font-semibold text-white">Lisinopril 10mg</p>
                      <p className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" /> 1:00 PM • Lunch
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <Check className="w-2.5 h-2.5" /> Taken
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-teal-950/30 border border-teal-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                    <div>
                      <p className="text-xs font-semibold text-teal-100">Atorvastatin 20mg</p>
                      <p className="text-[10px] text-teal-300/80 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" /> 8:00 PM • Dinner
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-teal-300 bg-teal-900/50 border border-teal-700/50 px-2 py-0.5 rounded-md">
                    Upcoming
                  </span>
                </div>
              </div>

              {/* Streak & Hydration Footer */}
              <div className="mt-4 pt-3 border-t border-slate-800 grid grid-cols-2 gap-2 text-center">
                <div className="p-2 rounded-xl bg-slate-800/50">
                  <span className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                    <Flame className="w-3 h-3 text-amber-400" /> Streak
                  </span>
                  <p className="text-sm font-black text-amber-300">12 Days</p>
                </div>
                <div className="p-2 rounded-xl bg-slate-800/50">
                  <span className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                    <Droplets className="w-3 h-3 text-cyan-400" /> Water
                  </span>
                  <p className="text-sm font-black text-cyan-300">6 / 8 Cups</p>
                </div>
              </div>
            </div>
          ) : (
            /* CAREGIVER MODE LEFT CARD: Patient Roster Triage */
            <div className="bg-slate-900/80 backdrop-blur-xl border border-blue-500/25 rounded-3xl p-5 shadow-2xl relative overflow-hidden group hover:border-blue-500/40 transition-all">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-300 flex items-center justify-center font-bold">
                    <Stethoscope className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Patient Roster</h3>
                    <p className="text-[11px] text-blue-300/80">3 Monitored Lives</p>
                  </div>
                </div>
                <span className="text-[10px] bg-blue-950/80 text-blue-300 border border-blue-800/60 px-2 py-0.5 rounded-full font-bold">
                  Caregiver Triage
                </span>
              </div>

              {/* Patient Triage List */}
              <div className="space-y-2.5">
                <div className="p-2.5 rounded-xl bg-slate-800/70 border border-slate-700/60 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-white">Sarah Chen (68y)</p>
                    <p className="text-[10px] text-slate-400">Type 2 Diabetes • 85% Adh.</p>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <CheckCircle className="w-2.5 h-2.5" /> Stable
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-rose-950/30 border border-rose-500/30 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-rose-200">Robert Taylor (74y)</p>
                    <p className="text-[10px] text-rose-300/80">Hypertension • 40% Adh.</p>
                  </div>
                  <span className="text-[10px] font-bold text-rose-400 bg-rose-900/60 border border-rose-700/60 px-2 py-0.5 rounded-md flex items-center gap-1 animate-pulse">
                    <AlertTriangle className="w-2.5 h-2.5" /> Urgent Flag
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-800/70 border border-slate-700/60 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-white">Emily Watson (52y)</p>
                    <p className="text-[10px] text-slate-400">Cardiac Rehab • 95% Adh.</p>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <CheckCircle className="w-2.5 h-2.5" /> Optimal
                  </span>
                </div>
              </div>

              {/* Caregiver Telemetry Stat */}
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1 text-[11px]">
                  <Activity className="w-3.5 h-3.5 text-blue-400" /> Real-Time Telemetry
                </span>
                <span className="text-[11px] font-bold text-cyan-300">Live Monitored</span>
              </div>
            </div>
          )}
        </div>

        {/* Main Authentication Card */}
        <div 
          id="auth-container-card"
          className={`w-full max-w-md ${currentTheme.cardBg} backdrop-blur-xl border rounded-3xl shadow-2xl p-6 sm:p-8 relative z-10 transition-all duration-300 shrink-0`}
        >
          {/* Brand Header */}
          <div className="text-center mb-6">
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-tr ${currentTheme.brandGradient} mx-auto flex items-center justify-center text-white text-3xl shadow-lg mb-3.5 transform hover:scale-105 transition-transform`}>
              <Pill className="w-8 h-8 text-white" />
            </div>
            <h1 className={`text-2xl sm:text-3xl font-black ${currentTheme.cardText} tracking-tight`}>
              MediTrack <span className={`bg-clip-text text-transparent bg-gradient-to-r ${currentTheme.brandText}`}>AI</span>
            </h1>
            <p className={`text-xs sm:text-sm ${currentTheme.subText} mt-1 font-medium`}>
              Intelligent Medicine Adherence & Caregiver Collaboration
            </p>
          </div>

        {/* Auth Mode Toggle (Login vs Create Account) */}
        <div className="grid grid-cols-2 p-1 bg-slate-800/60 dark:bg-slate-800/80 rounded-xl mb-6 border border-slate-700/60">
          <button
            id="auth-tab-login"
            type="button"
            onClick={() => setAuthMode('login')}
            className={`py-2.5 text-xs sm:text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
              authMode === 'login'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Lock className="w-3.5 h-3.5" /> Sign In
          </button>
          <button
            id="auth-tab-signup"
            type="button"
            onClick={() => setAuthMode('signup')}
            className={`py-2.5 text-xs sm:text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
              authMode === 'signup'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" /> Create Account
          </button>
        </div>

        {/* Role Selector Tabs (Patient vs Caregiver) */}
        <div className="mb-5">
          <label className={`block text-[11px] font-bold ${currentTheme.subText} uppercase tracking-wider mb-2`}>
            Select Your Portal Role:
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              id="role-patient-tab"
              type="button"
              onClick={() => handleRoleChange('patient')}
              className={`p-3 rounded-xl border text-left transition-all flex items-center gap-2.5 ${
                selectedRole === 'patient'
                  ? `${currentTheme.activeRole} ring-2 shadow-sm`
                  : 'bg-slate-800/40 border-slate-700/70 text-slate-400'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
                selectedRole === 'patient' ? currentTheme.activeRoleIcon : 'bg-slate-700 text-slate-300'
              }`}>
                <User className="w-4 h-4" />
              </div>
              <div>
                <span className="block text-xs font-bold leading-tight">Patient Portal</span>
                <span className="text-[10px] opacity-75">Track my meds</span>
              </div>
            </button>

            <button
              id="role-caregiver-tab"
              type="button"
              onClick={() => handleRoleChange('caregiver')}
              className={`p-3 rounded-xl border text-left transition-all flex items-center gap-2.5 ${
                selectedRole === 'caregiver'
                  ? `${currentTheme.activeRole} ring-2 shadow-sm`
                  : 'bg-slate-800/40 border-slate-700/70 text-slate-400'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
                selectedRole === 'caregiver' ? currentTheme.activeRoleIcon : 'bg-slate-700 text-slate-300'
              }`}>
                <HeartHandshake className="w-4 h-4" />
              </div>
              <div>
                <span className="block text-xs font-bold leading-tight">Caregiver Portal</span>
                <span className="text-[10px] opacity-75">Monitor patients</span>
              </div>
            </button>
          </div>
        </div>

        {/* LOGIN FORM */}
        {authMode === 'login' ? (
          <form id="auth-login-form" onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className={`block text-xs font-bold ${currentTheme.cardText} uppercase tracking-wider mb-1.5`}>
                Email Address or User ID
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                <input
                  id="login-email-input"
                  type="text"
                  required
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder={selectedRole === 'patient' ? 'patient@meditrack.com' : 'caregiver@meditrack.com'}
                  className={`w-full pl-10 pr-4 py-3 ${currentTheme.inputBg} rounded-xl text-sm focus:ring-2 ${currentTheme.focusRing} focus:border-transparent outline-none transition-all`}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className={`block text-xs font-bold ${currentTheme.cardText} uppercase tracking-wider`}>
                  Password
                </label>
                {/* FORGOT PASSWORD BUTTON / TRIGGER */}
                <button
                  id="forgot-password-link-btn"
                  type="button"
                  onClick={() => setIsForgotPwOpen(true)}
                  className={`text-xs font-bold ${currentTheme.accentColor} hover:underline flex items-center gap-1 transition-colors cursor-pointer`}
                >
                  <KeyRound className="w-3 h-3" />
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                <input
                  id="login-password-input"
                  type={showLoginPassword ? 'text' : 'password'}
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter your account password"
                  className={`w-full pl-10 pr-11 py-3 ${currentTheme.inputBg} rounded-xl text-sm focus:ring-2 ${currentTheme.focusRing} focus:border-transparent outline-none transition-all`}
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-200"
                >
                  {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className={`flex items-center gap-2 cursor-pointer select-none ${currentTheme.subText}`}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 text-teal-600 focus:ring-teal-500"
                />
                <span>Remember this device</span>
              </label>

              <button
                type="button"
                onClick={() => setIsForgotPwOpen(true)}
                className={`${currentTheme.accentColor} text-[11px] font-semibold hover:underline cursor-pointer`}
              >
                Reset via OTP
              </button>
            </div>

            <button
              id="login-submit-button"
              type="submit"
              className={`w-full py-3.5 px-4 ${currentTheme.primaryBtn} font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all transform active:scale-[0.99] text-sm cursor-pointer`}
            >
              Sign In to {selectedRole === 'patient' ? 'Patient Portal' : 'Caregiver Hub'}
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Google Firebase Sign In */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full py-2.5 px-4 bg-white/95 hover:bg-white text-slate-800 font-semibold rounded-xl shadow-md border border-slate-300 flex items-center justify-center gap-2.5 transition text-xs cursor-pointer hover:shadow-lg"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>Continue with Google Account</span>
            </button>

            {/* Quick Demo Credentials Box */}
            <div className={`mt-4 p-3.5 ${currentTheme.badgeBg} border rounded-2xl text-xs space-y-2`}>
              <div className="flex items-center justify-between">
                <span className="font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> 1-Click Demo Accounts:
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                  Ready to test
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div 
                  onClick={() => {
                    handleRoleChange('patient');
                    setLoginIdentifier('patient@meditrack.com');
                    setLoginPassword('pass123');
                  }}
                  className="p-2.5 bg-slate-900/60 rounded-xl border border-slate-700/60 cursor-pointer hover:border-teal-400 transition-colors"
                >
                  <strong className="block text-white font-bold">👤 Patient Demo</strong>
                  <span className="text-slate-400 text-[10px]">patient@meditrack.com</span>
                </div>
                <div 
                  onClick={() => {
                    handleRoleChange('caregiver');
                    setLoginIdentifier('caregiver@meditrack.com');
                    setLoginPassword('pass123');
                  }}
                  className="p-2.5 bg-slate-900/60 rounded-xl border border-slate-700/60 cursor-pointer hover:border-teal-400 transition-colors"
                >
                  <strong className="block text-white font-bold">👨‍⚕️ Caregiver Demo</strong>
                  <span className="text-slate-400 text-[10px]">caregiver@meditrack.com</span>
                </div>
              </div>
            </div>
          </form>
        ) : (
          /* SIGN UP FORM */
          <form id="auth-signup-form" onSubmit={handleSignupSubmit} className="space-y-3.5">
            <div>
              <label className={`block text-xs font-bold ${currentTheme.cardText} uppercase tracking-wider mb-1`}>
                Full Name *
              </label>
              <input
                id="signup-name-input"
                type="text"
                required
                value={signupName}
                onChange={(e) => setSignupName(e.target.value)}
                placeholder="e.g. Ramesh Chandra"
                className={`w-full px-3.5 py-2.5 ${currentTheme.inputBg} rounded-xl text-sm outline-none focus:ring-2 ${currentTheme.focusRing}`}
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className={`block text-xs font-bold ${currentTheme.cardText} uppercase tracking-wider mb-1`}>
                  Email Address *
                </label>
                <input
                  id="signup-email-input"
                  type="email"
                  required
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  placeholder="name@email.com"
                  className={`w-full px-3.5 py-2.5 ${currentTheme.inputBg} rounded-xl text-sm outline-none focus:ring-2 ${currentTheme.focusRing}`}
                />
              </div>
              <div>
                <label className={`block text-xs font-bold ${currentTheme.cardText} uppercase tracking-wider mb-1`}>
                  Phone Number
                </label>
                <input
                  id="signup-phone-input"
                  type="tel"
                  value={signupPhone}
                  onChange={(e) => setSignupPhone(e.target.value)}
                  placeholder="+91 XXXXX XXXXX"
                  className={`w-full px-3.5 py-2.5 ${currentTheme.inputBg} rounded-xl text-sm outline-none focus:ring-2 ${currentTheme.focusRing}`}
                />
              </div>
            </div>

            {selectedRole === 'patient' ? (
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className={`block text-xs font-bold ${currentTheme.cardText} uppercase tracking-wider mb-1`}>
                    Age
                  </label>
                  <input
                    type="number"
                    value={signupAge}
                    onChange={(e) => setSignupAge(e.target.value)}
                    placeholder="e.g. 64"
                    className={`w-full px-3.5 py-2.5 ${currentTheme.inputBg} rounded-xl text-sm outline-none focus:ring-2 ${currentTheme.focusRing}`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-bold ${currentTheme.cardText} uppercase tracking-wider mb-1`}>
                    Primary Condition
                  </label>
                  <input
                    type="text"
                    value={signupCondition}
                    onChange={(e) => setSignupCondition(e.target.value)}
                    placeholder="e.g. Diabetes, BP"
                    className={`w-full px-3.5 py-2.5 ${currentTheme.inputBg} rounded-xl text-sm outline-none focus:ring-2 ${currentTheme.focusRing}`}
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className={`block text-xs font-bold ${currentTheme.cardText} uppercase tracking-wider mb-1`}>
                    Relationship
                  </label>
                  <input
                    type="text"
                    value={signupRelation}
                    onChange={(e) => setSignupRelation(e.target.value)}
                    placeholder="e.g. Daughter, Nurse"
                    className={`w-full px-3.5 py-2.5 ${currentTheme.inputBg} rounded-xl text-sm outline-none focus:ring-2 ${currentTheme.focusRing}`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-bold ${currentTheme.cardText} uppercase tracking-wider mb-1`}>
                    License (Optional)
                  </label>
                  <input
                    type="text"
                    value={signupLicense}
                    onChange={(e) => setSignupLicense(e.target.value)}
                    placeholder="e.g. RN-10294"
                    className={`w-full px-3.5 py-2.5 ${currentTheme.inputBg} rounded-xl text-sm outline-none focus:ring-2 ${currentTheme.focusRing}`}
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className={`block text-xs font-bold ${currentTheme.cardText} uppercase tracking-wider mb-1`}>
                  Password *
                </label>
                <input
                  type="password"
                  required
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  placeholder="Min 6 chars"
                  className={`w-full px-3.5 py-2.5 ${currentTheme.inputBg} rounded-xl text-sm outline-none focus:ring-2 ${currentTheme.focusRing}`}
                />
              </div>
              <div>
                <label className={`block text-xs font-bold ${currentTheme.cardText} uppercase tracking-wider mb-1`}>
                  Confirm *
                </label>
                <input
                  type="password"
                  required
                  value={signupConfirmPassword}
                  onChange={(e) => setSignupConfirmPassword(e.target.value)}
                  placeholder="Repeat password"
                  className={`w-full px-3.5 py-2.5 ${currentTheme.inputBg} rounded-xl text-sm outline-none focus:ring-2 ${currentTheme.focusRing}`}
                />
              </div>
            </div>

            <button
              id="signup-submit-button"
              type="submit"
              className={`w-full mt-2 py-3 px-4 ${currentTheme.primaryBtn} font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all text-sm cursor-pointer`}
            >
              Create {selectedRole === 'patient' ? 'Patient' : 'Caregiver'} Account
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Footer info */}
        <div className="mt-6 text-center text-xs text-slate-400">
          <p className="flex items-center justify-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            HIPAA-Compliant & Secure Data Encryption
          </p>
        </div>
      </div>

      {/* RIGHT FLANKING PREVIEW PANEL (Visible on lg/xl screens) */}
      <div className="hidden lg:flex w-72 xl:w-80 flex-col gap-4 shrink-0 transition-all duration-500">
        {selectedRole === 'patient' ? (
          /* PATIENT MODE RIGHT CARD: Smart Tools & Safety */
          <div className="bg-slate-900/80 backdrop-blur-xl border border-teal-500/25 rounded-3xl p-5 shadow-2xl relative overflow-hidden group hover:border-teal-500/40 transition-all">
            <div className="absolute top-0 left-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Smart Patient Tools</h3>
                  <p className="text-[11px] text-cyan-300/80">AI Safety & Reminders</p>
                </div>
              </div>
              <span className="text-[10px] bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 px-2 py-0.5 rounded-full font-bold">
                Auto-Sync
              </span>
            </div>

            {/* Features preview */}
            <div className="space-y-2.5">
              <div className="p-2.5 rounded-xl bg-slate-800/70 border border-slate-700/60">
                <div className="flex items-center gap-2 mb-1">
                  <ScanLine className="w-3.5 h-3.5 text-teal-400" />
                  <span className="text-xs font-semibold text-white">Medicine Scanner</span>
                </div>
                <p className="text-[10px] text-slate-400">
                  Scan prescription strips or boxes with your camera to view dose instructions.
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-800/70 border border-slate-700/60">
                <div className="flex items-center gap-2 mb-1">
                  <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-xs font-semibold text-white">Pharmacy Refill Alert</span>
                </div>
                <p className="text-[10px] text-slate-400">
                  14 days supply remaining. Refill request scheduled with your pharmacy.
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-800/70 border border-slate-700/60">
                <div className="flex items-center gap-2 mb-1">
                  <HeartHandshake className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-xs font-semibold text-white">Connected Caregiver</span>
                </div>
                <p className="text-[10px] text-slate-400">
                  Sonia Verma is receiving your adherence log in real-time.
                </p>
              </div>
            </div>

            {/* Overall Score Badge */}
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1 text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> 30-Day Adherence
              </span>
              <span className="text-[11px] font-bold text-emerald-300">94% Optimal</span>
            </div>
          </div>
        ) : (
          /* CAREGIVER MODE RIGHT CARD: Clinical Inventory & Stock */
          <div className="bg-slate-900/80 backdrop-blur-xl border border-blue-500/25 rounded-3xl p-5 shadow-2xl relative overflow-hidden group hover:border-blue-500/40 transition-all">
            <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Pharmacy & Stock</h3>
                  <p className="text-[11px] text-blue-300/80">Inventory & Doctor Visits</p>
                </div>
              </div>
              <span className="text-[10px] bg-blue-950/80 text-blue-300 border border-blue-800/60 px-2 py-0.5 rounded-full font-bold">
                Clinical Safe
              </span>
            </div>

            {/* Inventory preview */}
            <div className="space-y-2.5">
              <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-500/30">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-amber-200">Metformin 500mg</span>
                  <span className="text-[10px] font-bold text-amber-400 bg-amber-900/60 border border-amber-700/60 px-1.5 py-0.5 rounded">
                    8 Left
                  </span>
                </div>
                <p className="text-[10px] text-amber-300/80">
                  Stock below 10-dose threshold. Auto refill notification sent.
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-800/70 border border-slate-700/60">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-white">Lisinopril 10mg</span>
                  <span className="text-[10px] font-bold text-slate-300 bg-slate-700 px-1.5 py-0.5 rounded">
                    24 Left
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">
                  Adequate supply. Next delivery scheduled for next Monday.
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-800/70 border border-slate-700/60">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-xs font-semibold text-white">Next Doctor Review</span>
                </div>
                <p className="text-[10px] text-slate-400">
                  Today, 2:00 PM • Dr. Miller (Cardiology review for Robert Taylor)
                </p>
              </div>
            </div>

            {/* SOS channel footer */}
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1 text-[11px]">
                <Shield className="w-3.5 h-3.5 text-cyan-400" /> SOS Emergency Line
              </span>
              <span className="text-[11px] font-bold text-emerald-400">Ready & Linked</span>
            </div>
          </div>
        )}
      </div>

    </div>

    {/* WORKING FORGOT PASSWORD MODAL */}
    <ForgotPasswordModal
      isOpen={isForgotPwOpen}
      onClose={() => setIsForgotPwOpen(false)}
      onPasswordResetSuccess={handlePasswordResetSuccess}
      registeredAccounts={registeredAccounts}
    />
  </div>
);
};

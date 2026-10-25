import React, { useState, useEffect } from 'react';
import { 
  KeyRound, 
  Mail, 
  Phone, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Clock, 
  RefreshCw,
  Sparkles,
  Lock
} from 'lucide-react';
import { UserAccount } from '../../types';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPasswordResetSuccess: (email: string, newPassword: string) => void;
  registeredAccounts: UserAccount[];
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  onPasswordResetSuccess,
  registeredAccounts,
}) => {
  const [step, setStep] = useState<'request' | 'otp' | 'newPassword' | 'success'>('request');
  const [identifier, setIdentifier] = useState('patient@meditrack.com');
  const [deliveryMethod, setDeliveryMethod] = useState<'email' | 'sms'>('email');
  const [otpInput, setOtpInput] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [foundAccountName, setFoundAccountName] = useState<string | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 'otp' && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  if (!isOpen) return null;

  const handleSendOtp = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    const cleanId = identifier.trim().toLowerCase();
    if (!cleanId) {
      setErrorMsg('Please enter your registered email or phone number.');
      return;
    }

    // Lookup matching account or allow demo bypass
    const matchedAccount = registeredAccounts.find(
      (acc) =>
        acc.email.toLowerCase() === cleanId ||
        (acc.phone && acc.phone.replace(/\s+/g, '') === cleanId.replace(/\s+/g, ''))
    );

    if (matchedAccount) {
      setFoundAccountName(matchedAccount.name);
    } else {
      setFoundAccountName('MediTrack User');
    }

    // Generate random 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setOtpInput('');
    setTimer(60);
    setCanResend(false);
    setStep('otp');
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (otpInput.trim() !== generatedOtp && otpInput.trim() !== '123456') {
      setErrorMsg('Invalid 6-digit verification code. Please check and try again.');
      return;
    }

    setStep('newPassword');
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please re-enter.');
      return;
    }

    // Call callback to persist new password into state/storage
    onPasswordResetSuccess(identifier.trim().toLowerCase(), newPassword);
    setStep('success');
  };

  const handleFillDemoCode = () => {
    setOtpInput(generatedOtp || '849201');
    setErrorMsg('');
  };

  const handleQuickSelectEmail = (email: string) => {
    setIdentifier(email);
    setErrorMsg('');
  };

  const handleCloseAndReset = () => {
    setStep('request');
    setErrorMsg('');
    setOtpInput('');
    setNewPassword('');
    setConfirmPassword('');
    onClose();
  };

  // Password strength checker
  const hasLength = newPassword.length >= 6;
  const hasNumber = /\d/.test(newPassword);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
  const strengthScore = [hasLength, hasNumber, hasSpecial].filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
      <div 
        id="forgot-password-modal"
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-all duration-300 transform scale-100"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 p-6 text-white relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl shadow-inner">
                <KeyRound className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold tracking-tight">Account Recovery</h3>
                <p className="text-xs text-blue-100 mt-0.5">Reset your MediTrack AI secure credentials</p>
              </div>
            </div>
            <button
              id="close-forgot-pw-btn"
              onClick={handleCloseAndReset}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-lg transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Stepper Progress */}
          <div className="mt-5 flex items-center justify-between gap-2 px-1">
            {[
              { id: 'request', label: 'Identity' },
              { id: 'otp', label: 'Verify' },
              { id: 'newPassword', label: 'New Password' },
              { id: 'success', label: 'Complete' },
            ].map((s, idx) => {
              const steps = ['request', 'otp', 'newPassword', 'success'];
              const currentIndex = steps.indexOf(step);
              const isPast = idx < currentIndex;
              const isCurrent = idx === currentIndex;

              return (
                <div key={s.id} className="flex-1 flex flex-col items-center">
                  <div 
                    className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center transition-all ${
                      isPast 
                        ? 'bg-emerald-400 text-slate-900' 
                        : isCurrent 
                        ? 'bg-white text-blue-700 shadow-md ring-2 ring-white/50' 
                        : 'bg-white/20 text-white/70'
                    }`}
                  >
                    {isPast ? '✓' : idx + 1}
                  </div>
                  <span className="text-[10px] font-semibold mt-1 tracking-wider uppercase opacity-90">
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Body Content */}
        <div className="p-6">
          {errorMsg && (
            <div className="mb-5 p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl flex items-start gap-3 text-rose-700 dark:text-rose-300 text-xs animate-shake">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: REQUEST OTP */}
          {step === 'request' && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="text-center mb-4">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Enter your verified email address or mobile number to receive a secure 6-digit recovery OTP.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Email or Registered Phone
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    id="recovery-identifier-input"
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="patient@meditrack.com or +91 98765 43210"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>

              {/* Delivery method toggle */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  Send Recovery Code Via:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDeliveryMethod('email')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border flex items-center justify-center gap-2 transition-all ${
                      deliveryMethod === 'email'
                        ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-700 dark:text-blue-300 shadow-sm'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Mail className="w-3.5 h-3.5" /> Email Verification
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeliveryMethod('sms')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border flex items-center justify-center gap-2 transition-all ${
                      deliveryMethod === 'sms'
                        ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-700 dark:text-blue-300 shadow-sm'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Phone className="w-3.5 h-3.5" /> SMS Text Message
                  </button>
                </div>
              </div>

              {/* Quick demo account select pills */}
              <div className="p-3 bg-blue-50/60 dark:bg-slate-800/60 border border-blue-100 dark:border-slate-700/60 rounded-xl">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-2">
                  <Sparkles className="w-3 h-3 text-blue-500" /> Quick Demo Recovery Shortcuts:
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickSelectEmail('patient@meditrack.com')}
                    className="text-xs px-2.5 py-1 bg-white dark:bg-slate-700 border border-blue-200 dark:border-slate-600 rounded-md text-blue-700 dark:text-blue-300 font-medium hover:bg-blue-100/50 transition-colors"
                  >
                    👤 Raj Kumar (Patient)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickSelectEmail('caregiver@meditrack.com')}
                    className="text-xs px-2.5 py-1 bg-white dark:bg-slate-700 border border-blue-200 dark:border-slate-600 rounded-md text-blue-700 dark:text-blue-300 font-medium hover:bg-blue-100/50 transition-colors"
                  >
                    👨‍⚕️ Sonia Verma (Caregiver)
                  </button>
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={handleCloseAndReset}
                  className="flex-1 py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  id="send-otp-submit-btn"
                  type="submit"
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-bold shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all"
                >
                  Send OTP Code <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: VERIFY OTP */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center mb-2">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  Verification Code Sent
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  We sent a 6-digit code to <strong className="text-slate-800 dark:text-slate-200">{identifier}</strong>
                </p>
              </div>

              {/* Simulated OTP Notification Banner */}
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🔐</span>
                    <div>
                      <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 block">
                        Simulated {deliveryMethod === 'email' ? 'Email Inbox' : 'SMS Message'}
                      </span>
                      <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 tracking-wider">
                        Your Security Code: {generatedOtp}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleFillDemoCode}
                    className="text-xs font-bold px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors shadow-sm"
                  >
                    Auto-Fill Code
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 text-center">
                  Enter 6-Digit OTP
                </label>
                <input
                  id="otp-code-input"
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="• • • • • •"
                  className="w-full text-center tracking-[0.6em] font-mono text-2xl font-black py-3 px-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {timer > 0 ? `Code expires in ${timer}s` : 'Code expired'}
                </span>
                <button
                  type="button"
                  disabled={!canResend}
                  onClick={() => handleSendOtp()}
                  className={`font-semibold flex items-center gap-1 ${
                    canResend
                      ? 'text-blue-600 dark:text-blue-400 hover:underline cursor-pointer'
                      : 'text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <RefreshCw className="w-3 h-3" /> Resend OTP
                </button>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep('request')}
                  className="flex-1 py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Back
                </button>
                <button
                  id="verify-otp-submit-btn"
                  type="submit"
                  disabled={otpInput.length < 6}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white text-sm font-bold shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all"
                >
                  Verify & Proceed <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: SET NEW PASSWORD */}
          {step === 'newPassword' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="text-center mb-3">
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center mb-2">
                  <Lock className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  Create New Password
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Securing account for <strong className="text-slate-800 dark:text-slate-200">{foundAccountName || identifier}</strong>
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="new-password-input"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter at least 6 characters"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Confirm New Password
                </label>
                <input
                  id="confirm-new-password-input"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-type new password"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              {/* Password strength indicators */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-[11px] font-semibold">
                  <span className="text-slate-500">Password Strength:</span>
                  <span className={
                    strengthScore === 3 ? 'text-emerald-600 font-bold' :
                    strengthScore === 2 ? 'text-amber-600 font-bold' : 'text-slate-500'
                  }>
                    {strengthScore === 3 ? 'Strong' : strengthScore === 2 ? 'Medium' : 'Weak'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${strengthScore >= 1 ? 'bg-amber-500' : 'bg-transparent'}`} />
                  <div className={`h-full rounded-full transition-all ${strengthScore >= 2 ? 'bg-amber-500' : 'bg-transparent'}`} />
                  <div className={`h-full rounded-full transition-all ${strengthScore >= 3 ? 'bg-emerald-500' : 'bg-transparent'}`} />
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                  <span className={hasLength ? 'text-emerald-600 dark:text-emerald-400 font-medium' : ''}>
                    {hasLength ? '✓' : '○'} Min 6 characters
                  </span>
                  <span className={hasNumber ? 'text-emerald-600 dark:text-emerald-400 font-medium' : ''}>
                    {hasNumber ? '✓' : '○'} Contains number
                  </span>
                </div>
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep('otp')}
                  className="flex-1 py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Back
                </button>
                <button
                  id="save-new-password-btn"
                  type="submit"
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm font-bold shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all"
                >
                  Update Password <CheckCircle2 className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 4: SUCCESS CONFIRMATION */}
          {step === 'success' && (
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20 animate-bounce">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div>
                <h4 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  Password Reset Successfully!
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 max-w-sm mx-auto">
                  Your credentials have been securely updated. You can now log into your account using your new password.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-left text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Account:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{identifier}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status:</span>
                  <span className="font-bold text-emerald-600">Active & Verified</span>
                </div>
              </div>

              <button
                id="login-with-new-password-btn"
                onClick={handleCloseAndReset}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-bold shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all"
              >
                Log In Now with New Password <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

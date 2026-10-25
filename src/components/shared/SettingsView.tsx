import React, { useState } from 'react';
import { 
  User, 
  Bell, 
  Shield, 
  Key, 
  Save, 
  HeartHandshake, 
  Clock, 
  Moon, 
  Sparkles,
  Lock
} from 'lucide-react';
import { UserAccount } from '../../types';

interface SettingsViewProps {
  currentUser: UserAccount;
  onUpdateUser: (updated: UserAccount) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentUser,
  onUpdateUser,
  showToast,
}) => {
  const [name, setName] = useState(currentUser.name);
  const [email, setEmail] = useState(currentUser.email);
  const [phone, setPhone] = useState(currentUser.phone || '+91 98765 43210');
  const [condition, setCondition] = useState(currentUser.condition || 'Type 2 Diabetes');
  const [emergency, setEmergency] = useState(currentUser.emergencyContact || 'Anita Sharma - +91 98765 54321');

  // Password change state
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  // Preference toggles
  const [pushAlerts, setPushAlerts] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [shareWithCaregiver, setShareWithCaregiver] = useState(true);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: UserAccount = {
      ...currentUser,
      name,
      email,
      phone,
      condition,
      emergencyContact: emergency,
    };
    onUpdateUser(updated);
    showToast('Profile and preferences updated successfully', 'success');
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentPass !== currentUser.password) {
      showToast('Current password does not match.', 'error');
      return;
    }
    if (newPass.length < 6) {
      showToast('New password must be at least 6 characters.', 'error');
      return;
    }
    if (newPass !== confirmPass) {
      showToast('New passwords do not match.', 'error');
      return;
    }

    const updated: UserAccount = {
      ...currentUser,
      password: newPass,
    };
    onUpdateUser(updated);
    setCurrentPass('');
    setNewPass('');
    setConfirmPass('');
    setIsChangingPass(false);
    showToast('Password changed successfully!', 'success');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-cyan-700 rounded-3xl p-6 text-white shadow-lg shadow-blue-500/20">
        <h2 className="text-2xl font-black tracking-tight">Account & Clinical Settings ⚙️</h2>
        <p className="text-xs text-blue-100 mt-1">
          Manage your personal profile, notification thresholds, and caregiver permissions
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Profile Details Form */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
            <User className="w-4 h-4 text-blue-600" />
            Profile & Emergency Contact Information
          </h3>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Primary Condition
                </label>
                <input
                  type="text"
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Emergency Contact (Name & Phone)
              </label>
              <input
                type="text"
                value={emergency}
                onChange={(e) => setEmergency(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              className="py-2.5 px-5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/25 flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Save className="w-3.5 h-3.5" /> Save Profile Details
            </button>
          </form>
        </div>

        {/* Notifications & Permissions */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
              <Bell className="w-4 h-4 text-amber-500" />
              Medication Reminder Preferences
            </h3>

            <div className="space-y-3 text-xs">
              <label className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl cursor-pointer">
                <div>
                  <strong className="text-slate-800 dark:text-slate-200 block font-bold">Push Notifications</strong>
                  <span className="text-[11px] text-slate-400">Receive alerts at exact scheduled dose times</span>
                </div>
                <input
                  type="checkbox"
                  checked={pushAlerts}
                  onChange={(e) => setPushAlerts(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl cursor-pointer">
                <div>
                  <strong className="text-slate-800 dark:text-slate-200 block font-bold">Caregiver Data Sync</strong>
                  <span className="text-[11px] text-slate-400">Allow caregiver to monitor adherence & missed doses</span>
                </div>
                <input
                  type="checkbox"
                  checked={shareWithCaregiver}
                  onChange={(e) => setShareWithCaregiver(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl cursor-pointer">
                <div>
                  <strong className="text-slate-800 dark:text-slate-200 block font-bold">SMS Refill Alerts</strong>
                  <span className="text-[11px] text-slate-400">Text alert when prescription &lt; 4 days remaining</span>
                </div>
                <input
                  type="checkbox"
                  checked={smsAlerts}
                  onChange={(e) => setSmsAlerts(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
              </label>
            </div>
          </div>

          {/* Security & Change Password Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-emerald-600" />
              Security & Credentials
            </h3>

            {!isChangingPass ? (
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Password: ••••••••</span>
                <button
                  onClick={() => setIsChangingPass(true)}
                  className="py-1.5 px-3 bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-bold text-xs rounded-lg hover:bg-slate-200 cursor-pointer"
                >
                  Change Password
                </button>
              </div>
            ) : (
              <form onSubmit={handlePasswordChange} className="space-y-3 text-xs pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    required
                    value={currentPass}
                    onChange={(e) => setCurrentPass(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPass}
                    onChange={(e) => setConfirmPass(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none"
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsChangingPass(false)}
                    className="flex-1 py-2 border border-slate-300 rounded-xl text-slate-600 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl"
                  >
                    Update
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

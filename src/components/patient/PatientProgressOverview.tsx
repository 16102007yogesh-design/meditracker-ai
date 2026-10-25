import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Flame, 
  Clock, 
  Package, 
  AlertTriangle, 
  Calendar, 
  TrendingUp, 
  Sparkles, 
  Award, 
  ArrowUpRight, 
  ChevronRight,
  Sun,
  Sunset,
  Moon,
  Coffee,
  RotateCcw,
  Check,
  Plus
} from 'lucide-react';
import { Medicine, DailyAdherencePoint, Appointment } from '../../types';
import { SimpleHealthCharts } from '../shared/SimpleHealthCharts';

interface PatientProgressOverviewProps {
  medicines: Medicine[];
  onTakeDose: (id: number) => void;
  onMissDose: (id: number) => void;
  onUndoDose: (id: number) => void;
  onOpenAddModal: () => void;
  dailyHistory: DailyAdherencePoint[];
  streakDays: number;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  upcomingAppointment?: Appointment;
  onNavigateToAppointments?: () => void;
}

export const PatientProgressOverview: React.FC<PatientProgressOverviewProps> = ({
  medicines,
  onTakeDose,
  onMissDose,
  onUndoDose,
  onOpenAddModal,
  dailyHistory,
  streakDays,
  showToast,
  upcomingAppointment,
  onNavigateToAppointments,
}) => {
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(dailyHistory.length - 1);
  const [filterTimeSlot, setFilterTimeSlot] = useState<string>('all');
  const [activeViewMode, setActiveViewMode] = useState<'schedule' | 'charts'>('schedule');

  // Adherence calculations
  const totalMeds = medicines.length;
  const takenCount = medicines.filter((m) => m.status === 'taken').length;
  const missedCount = medicines.filter((m) => m.status === 'missed').length;
  const pendingCount = medicines.filter((m) => m.status === 'pending').length;

  const todayAdherence = totalMeds > 0 ? Math.round((takenCount / totalMeds) * 100) : 0;
  const overallAdherence = 94; // Calculated composite score

  // Calculate time slot summaries
  const morningMeds = medicines.filter((m) => m.timeSlot === 'morning' || m.time.includes('AM'));
  const afternoonMeds = medicines.filter((m) => m.timeSlot === 'afternoon' || (m.time.includes('PM') && parseInt(m.time) < 5));
  const eveningMeds = medicines.filter((m) => m.timeSlot === 'evening' || (m.time.includes('PM') && parseInt(m.time) >= 5 && parseInt(m.time) < 9));
  const nightMeds = medicines.filter((m) => m.timeSlot === 'night' || m.time.includes('10:00 PM') || m.time.includes('11:00 PM'));

  const getTimeSlotStatus = (meds: Medicine[]) => {
    if (meds.length === 0) return { label: 'None Scheduled', percent: 100, isDone: true, color: 'text-slate-400' };
    const taken = meds.filter((m) => m.status === 'taken').length;
    const missed = meds.filter((m) => m.status === 'missed').length;
    const percent = Math.round((taken / meds.length) * 100);
    const isDone = taken === meds.length;
    const hasMissed = missed > 0;
    return {
      label: isDone ? 'All Taken' : hasMissed ? `${missed} Missed` : `${taken}/${meds.length} Done`,
      percent,
      isDone,
      hasMissed,
      color: isDone ? 'text-emerald-600 dark:text-emerald-400' : hasMissed ? 'text-rose-600 dark:text-rose-400' : 'text-blue-600 dark:text-blue-400'
    };
  };

  const morningStatus = getTimeSlotStatus(morningMeds);
  const afternoonStatus = getTimeSlotStatus(afternoonMeds);
  const eveningStatus = getTimeSlotStatus(eveningMeds);
  const nightStatus = getTimeSlotStatus(nightMeds);

  // Filtered meds for display
  const filteredMedicines = medicines.filter((med) => {
    if (filterTimeSlot === 'all') return true;
    if (filterTimeSlot === 'morning') return med.timeSlot === 'morning' || med.time.includes('AM');
    if (filterTimeSlot === 'afternoon') return med.timeSlot === 'afternoon' || (med.time.includes('PM') && parseInt(med.time) < 5);
    if (filterTimeSlot === 'evening') return med.timeSlot === 'evening' || (med.time.includes('PM') && parseInt(med.time) >= 5 && parseInt(med.time) < 9);
    if (filterTimeSlot === 'night') return med.timeSlot === 'night';
    return true;
  });

  // Calculate circular SVG progress values
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (todayAdherence / 100) * circumference;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 0. Top View Switcher: Routine vs Simple Health Charts */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-2 sm:p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl w-full sm:w-auto">
          <button
            id="patient-view-schedule-tab"
            onClick={() => setActiveViewMode('schedule')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeViewMode === 'schedule'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Today's Medicine Schedule</span>
          </button>
          <button
            id="patient-view-charts-tab"
            onClick={() => setActiveViewMode('charts')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeViewMode === 'charts'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
            <span>Simple Health Charts & Insights</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span className="hidden md:inline font-medium">
            {activeViewMode === 'charts' 
              ? 'Complex statistical data translated into simple visual charts' 
              : 'Tap any dose below to mark taken'}
          </span>
        </div>
      </div>

      {activeViewMode === 'charts' ? (
        <SimpleHealthCharts
          medicines={medicines}
          dailyHistory={dailyHistory}
          streakDays={streakDays}
          userRole="patient"
          onRequestRefill={(medName) => showToast(`Refill request submitted for ${medName}! Caregiver alerted.`, 'success')}
          showToast={showToast}
        />
      ) : (
        <>
          {/* 1. HERO PROGRESS CARD */}
          <div 
            id="patient-progress-hero"
            className="relative overflow-hidden bg-gradient-to-r from-blue-700 via-indigo-700 to-cyan-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-blue-900/20"
          >
            <div className="absolute right-0 top-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Left Column: Greeting & Summary */}
              <div className="lg:col-span-7 space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-semibold tracking-wide">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                  <span>Smart Health Companion Active</span>
                </div>
                
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                  Today's Adherence Progress: <span className="text-cyan-300">{todayAdherence}%</span>
                </h1>
                
                <p className="text-sm text-blue-100 max-w-xl leading-relaxed">
                  You have completed <strong className="text-white font-bold">{takenCount} of {totalMeds}</strong> scheduled medications today. 
                  {pendingCount > 0 
                    ? ` You have ${pendingCount} upcoming dose${pendingCount > 1 ? 's' : ''} remaining.` 
                    : ' Excellent job! All doses for today have been completed.'}
                </p>

                {/* Streak & Consistency Badges */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <div className="flex items-center gap-2 px-3.5 py-1.5 bg-amber-500/20 border border-amber-400/30 rounded-xl backdrop-blur-md">
                    <Flame className="w-5 h-5 text-amber-400 fill-amber-400 animate-pulse" />
                    <div>
                      <span className="text-xs font-black text-amber-200">{streakDays} Day Streak</span>
                      <span className="text-[10px] text-amber-300/80 block font-medium">Consecutive on-time</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 px-3.5 py-1.5 bg-emerald-500/20 border border-emerald-400/30 rounded-xl backdrop-blur-md">
                    <Award className="w-5 h-5 text-emerald-300" />
                    <div>
                      <span className="text-xs font-black text-emerald-200">Gold Adherent</span>
                      <span className="text-[10px] text-emerald-300/80 block font-medium">94% 30-day average</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveViewMode('charts')}
                    className="px-3.5 py-2 bg-white/20 hover:bg-white/30 text-white font-bold text-xs rounded-xl backdrop-blur-md transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <TrendingUp className="w-4 h-4 text-cyan-300" /> Visual Charts
                  </button>

                  <button
                    id="hero-add-med-btn"
                    onClick={onOpenAddModal}
                    className="px-4 py-2 bg-white text-blue-800 hover:bg-blue-50 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer ml-auto"
                  >
                    <Plus className="w-4 h-4" /> Add Medicine
                  </button>
                </div>
              </div>

          {/* Right Column: Circular Adherence Dial */}
          <div className="lg:col-span-5 flex items-center justify-center lg:justify-end">
            <div className="relative flex items-center justify-center p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-inner">
              <svg className="w-36 h-36 transform -rotate-90">
                {/* Background Ring */}
                <circle
                  cx="72"
                  cy="72"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="10"
                  className="text-white/20"
                  fill="transparent"
                />
                {/* Animated Progress Ring */}
                <circle
                  cx="72"
                  cy="72"
                  r={radius}
                  stroke="url(#patientProgressGradient)"
                  strokeWidth="10"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                  fill="transparent"
                />
                <defs>
                  <linearGradient id="patientProgressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#34d399" />
                    <stop offset="100%" stopColor="#22d3ee" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Inner Dial Metrics */}
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-black text-white">{todayAdherence}%</span>
                <span className="text-[10px] uppercase tracking-wider font-bold text-blue-200">
                  {takenCount}/{totalMeds} Doses
                </span>
                <span className="text-[9px] text-emerald-300 font-semibold mt-0.5">
                  {todayAdherence === 100 ? '✓ Completed' : 'In Progress'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. STATS CARDS GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Taken */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Taken Today</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {takenCount} <span className="text-xs text-slate-400 font-normal">/ {totalMeds} doses</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-3">
            <div 
              className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
              style={{ width: `${totalMeds > 0 ? (takenCount / totalMeds) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Pending Doses */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Doses</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {pendingCount} <span className="text-xs text-slate-400 font-normal">remaining</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-3">
            <div 
              className="bg-blue-500 h-full rounded-full transition-all duration-500" 
              style={{ width: `${totalMeds > 0 ? (pendingCount / totalMeds) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Missed Doses */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Missed Doses</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {missedCount} <span className="text-xs text-slate-400 font-normal">recorded</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-3">
            <div 
              className="bg-rose-500 h-full rounded-full transition-all duration-500" 
              style={{ width: `${totalMeds > 0 ? (missedCount / totalMeds) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* 30-Day Adherence */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Monthly Score</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-50 dark:bg-cyan-950/50 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {overallAdherence}% <span className="text-xs text-emerald-600 font-bold">+3.2% vs last month</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-3">
            <div 
              className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all duration-500" 
              style={{ width: `${overallAdherence}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. DAILY TIME-SLOT PROGRESS JOURNEY */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              Daily Time-Slot Completion Progress
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Track dose completion across Morning, Afternoon, Evening, and Night routines
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Morning Slot */}
          <div 
            onClick={() => setFilterTimeSlot(filterTimeSlot === 'morning' ? 'all' : 'morning')}
            className={`p-4 rounded-xl border transition-all cursor-pointer ${
              filterTimeSlot === 'morning'
                ? 'bg-blue-50/80 dark:bg-blue-950/50 border-blue-500 ring-2 ring-blue-500/20'
                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Sun className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Morning</span>
                  <span className="text-[10px] text-slate-500">06:00 - 11:59 AM</span>
                </div>
              </div>
              <span className={`text-xs font-bold ${morningStatus.color}`}>
                {morningStatus.label}
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden mt-3">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-amber-400 to-emerald-500 transition-all duration-500"
                style={{ width: `${morningStatus.percent}%` }}
              />
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 flex justify-between">
              <span>{morningMeds.length} meds</span>
              <span className="font-semibold">{morningStatus.percent}% done</span>
            </div>
          </div>

          {/* Afternoon Slot */}
          <div 
            onClick={() => setFilterTimeSlot(filterTimeSlot === 'afternoon' ? 'all' : 'afternoon')}
            className={`p-4 rounded-xl border transition-all cursor-pointer ${
              filterTimeSlot === 'afternoon'
                ? 'bg-blue-50/80 dark:bg-blue-950/50 border-blue-500 ring-2 ring-blue-500/20'
                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                  <Coffee className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Afternoon</span>
                  <span className="text-[10px] text-slate-500">12:00 - 04:59 PM</span>
                </div>
              </div>
              <span className={`text-xs font-bold ${afternoonStatus.color}`}>
                {afternoonStatus.label}
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden mt-3">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-orange-400 to-emerald-500 transition-all duration-500"
                style={{ width: `${afternoonStatus.percent}%` }}
              />
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 flex justify-between">
              <span>{afternoonMeds.length} meds</span>
              <span className="font-semibold">{afternoonStatus.percent}% done</span>
            </div>
          </div>

          {/* Evening Slot */}
          <div 
            onClick={() => setFilterTimeSlot(filterTimeSlot === 'evening' ? 'all' : 'evening')}
            className={`p-4 rounded-xl border transition-all cursor-pointer ${
              filterTimeSlot === 'evening'
                ? 'bg-blue-50/80 dark:bg-blue-950/50 border-blue-500 ring-2 ring-blue-500/20'
                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Sunset className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Evening</span>
                  <span className="text-[10px] text-slate-500">05:00 - 08:59 PM</span>
                </div>
              </div>
              <span className={`text-xs font-bold ${eveningStatus.color}`}>
                {eveningStatus.label}
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden mt-3">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-emerald-500 transition-all duration-500"
                style={{ width: `${eveningStatus.percent}%` }}
              />
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 flex justify-between">
              <span>{eveningMeds.length} meds</span>
              <span className="font-semibold">{eveningStatus.percent}% done</span>
            </div>
          </div>

          {/* Night Slot */}
          <div 
            onClick={() => setFilterTimeSlot(filterTimeSlot === 'night' ? 'all' : 'night')}
            className={`p-4 rounded-xl border transition-all cursor-pointer ${
              filterTimeSlot === 'night'
                ? 'bg-blue-50/80 dark:bg-blue-950/50 border-blue-500 ring-2 ring-blue-500/20'
                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <Moon className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Night / Bedtime</span>
                  <span className="text-[10px] text-slate-500">09:00 PM onwards</span>
                </div>
              </div>
              <span className={`text-xs font-bold ${nightStatus.color}`}>
                {nightStatus.label}
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden mt-3">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-purple-400 to-emerald-500 transition-all duration-500"
                style={{ width: `${nightStatus.percent}%` }}
              />
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 flex justify-between">
              <span>{nightMeds.length} meds</span>
              <span className="font-semibold">{nightStatus.percent}% done</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. TWO-COLUMN INTERACTIVE PROGRESS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: 7-Day Adherence Interactive Chart */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  7-Day Adherence History
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Click on any day to inspect historical compliance
                </p>
              </div>
              <span className="text-xs font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                Last 7 Days
              </span>
            </div>

            {/* Weekly Bars */}
            <div className="h-44 flex items-end justify-between gap-2 sm:gap-4 pt-6 pb-2 px-1">
              {dailyHistory.map((item, idx) => {
                const isSelected = selectedDayIndex === idx;
                const isPerfect = item.adherence >= 95;
                const isWarning = item.adherence < 80;

                return (
                  <div
                    key={item.day}
                    onClick={() => setSelectedDayIndex(idx)}
                    className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
                  >
                    <div className="relative w-full flex items-end justify-center h-32">
                      {/* Tooltip on hover/select */}
                      {isSelected && (
                        <div className="absolute -top-8 bg-slate-900 text-white text-[10px] font-bold py-1 px-2 rounded shadow-md whitespace-nowrap z-20">
                          {item.adherence}% ({item.dosesTaken}/{item.totalDoses})
                        </div>
                      )}

                      {/* Bar Fill */}
                      <div
                        className={`w-full max-w-[36px] rounded-t-lg transition-all duration-300 ${
                          isSelected
                            ? 'ring-2 ring-blue-500 scale-105'
                            : 'group-hover:opacity-90'
                        } ${
                          isPerfect
                            ? 'bg-gradient-to-t from-emerald-600 to-teal-400'
                            : isWarning
                            ? 'bg-gradient-to-t from-rose-600 to-amber-400'
                            : 'bg-gradient-to-t from-blue-600 to-cyan-400'
                        }`}
                        style={{ height: `${item.adherence}%` }}
                      />
                    </div>

                    <span className={`text-xs mt-2 font-bold ${
                      isSelected 
                        ? 'text-blue-600 dark:text-blue-400' 
                        : 'text-slate-500 dark:text-slate-400'
                    }`}>
                      {item.day}
                    </span>
                    <span className="text-[10px] text-slate-400">{item.date}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Day Breakdown banner */}
          {dailyHistory[selectedDayIndex] && (
            <div className="mt-4 p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center">
                  {dailyHistory[selectedDayIndex].day}
                </div>
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {dailyHistory[selectedDayIndex].date} Record:
                  </span>
                  <span className="text-slate-500 block">
                    {dailyHistory[selectedDayIndex].dosesTaken} of {dailyHistory[selectedDayIndex].totalDoses} doses marked as taken
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm font-black text-blue-600 dark:text-blue-400 block">
                  {dailyHistory[selectedDayIndex].adherence}% Adherence
                </span>
                <span className="text-[10px] text-emerald-600 font-semibold">
                  {dailyHistory[selectedDayIndex].adherence >= 90 ? '✓ Target Met' : 'Needs Follow-up'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Medicine Supply & Refill Runway Visualizer */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Package className="w-4 h-4 text-amber-500" />
                  Prescription Stock Runway
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Remaining supply and estimated refill countdown
                </p>
              </div>
            </div>

            {/* List of Medicines with supply bars */}
            <div className="space-y-3">
              {medicines.map((med) => {
                const daysLeft = Math.ceil(med.stock / (med.perDose * 1));
                const isUrgent = daysLeft <= 4;
                const isWarning = daysLeft <= 7 && !isUrgent;
                const stockPercent = Math.min((med.stock / 30) * 100, 100);

                return (
                  <div 
                    key={med.id} 
                    className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div>
                        <span className="font-bold text-xs text-slate-800 dark:text-slate-200">{med.name}</span>
                        <span className="text-[10px] text-slate-400 ml-1.5">({med.dose})</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isUrgent 
                            ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300' 
                            : isWarning 
                            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300' 
                            : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                        }`}>
                          {daysLeft} days left
                        </span>
                      </div>
                    </div>

                    {/* Stock Progress Bar */}
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isUrgent ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${stockPercent}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1.5">
                      <span>{med.stock} tablets in stock</span>
                      {isUrgent && (
                        <button
                          onClick={() => showToast(`📦 Refill requested for ${med.name}! Sent to pharmacy.`, 'success')}
                          className="text-[10px] font-bold text-rose-600 hover:underline cursor-pointer flex items-center gap-0.5"
                        >
                          Request Refill Now <ArrowUpRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>Automated AI Refill Forecasting Active</span>
            <span className="font-bold text-slate-700 dark:text-slate-300">Syncs with Caregiver</span>
          </div>
        </div>
      </div>

      {/* 4.5 UPCOMING DOCTOR'S APPOINTMENT WIDGET */}
      {upcomingAppointment && (
        <div className="bg-gradient-to-r from-teal-900/90 via-slate-900 to-indigo-950 border border-teal-500/40 rounded-2xl p-5 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center text-xl font-bold border border-teal-500/30">
              🩺
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded-md border border-teal-500/30">
                  Upcoming Doctor Visit
                </span>
                <span className="text-xs text-slate-300 font-semibold">
                  {upcomingAppointment.date} at {upcomingAppointment.time}
                </span>
              </div>
              <h4 className="font-bold text-sm text-white mt-1">
                {upcomingAppointment.doctorName} — {upcomingAppointment.doctorSpecialty}
              </h4>
              <p className="text-xs text-teal-200/80">
                Reason: {upcomingAppointment.reason} ({upcomingAppointment.type === 'video' ? '📹 Tele-Health Video' : `🏥 ${upcomingAppointment.hospitalName}`})
              </p>
            </div>
          </div>

          <button
            onClick={onNavigateToAppointments}
            className="py-2 px-4 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap self-start sm:self-auto"
          >
            View Appointments <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 5. TODAY'S ACTIVE MEDICINE DOSE CARDS */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>💊</span> Today's Actionable Medication Schedule
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Mark doses as taken to automatically increment your adherence rate
            </p>
          </div>

          {/* Time Slot Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'all', label: 'All Doses' },
              { id: 'morning', label: '🌅 Morning' },
              { id: 'afternoon', label: '☀️ Afternoon' },
              { id: 'evening', label: '🌆 Evening' },
              { id: 'night', label: '🌙 Night' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterTimeSlot(tab.id)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                  filterTimeSlot === tab.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Medicines Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMedicines.map((med) => {
            const isTaken = med.status === 'taken';
            const isMissed = med.status === 'missed';

            return (
              <div
                key={med.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isTaken
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/60 shadow-sm'
                    : isMissed
                    ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800/60'
                    : 'bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/80 hover:shadow-md'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg font-bold ${
                      isTaken 
                        ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25' 
                        : isMissed
                        ? 'bg-rose-500 text-white'
                        : 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20'
                    }`}>
                      💊
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                        {med.name}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {med.dose} • {med.frequency}
                      </p>
                    </div>
                  </div>

                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                    isTaken
                      ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300'
                      : isMissed
                      ? 'bg-rose-100 dark:bg-rose-900/50 text-rose-800 dark:text-rose-300'
                      : 'bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300'
                  }`}>
                    {isTaken ? '✓ Taken' : isMissed ? '✗ Missed' : '⏰ Pending'}
                  </span>
                </div>

                <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-1.5 font-medium">
                    <Clock className="w-3.5 h-3.5 text-blue-500" />
                    <span>Scheduled for <strong className="text-slate-900 dark:text-white font-bold">{med.time}</strong></span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Stock: {med.stock} left
                  </span>
                </div>

                {med.instructions && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 bg-slate-100/70 dark:bg-slate-800/80 p-2 rounded-lg">
                    💡 {med.instructions}
                  </p>
                )}

                {/* Dose Action Buttons */}
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {!isTaken ? (
                    <button
                      id={`take-med-btn-${med.id}`}
                      onClick={() => onTakeDose(med.id)}
                      className="py-2.5 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Check className="w-4 h-4" /> Mark Taken
                    </button>
                  ) : (
                    <button
                      onClick={() => onUndoDose(med.id)}
                      className="py-2.5 px-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Undo
                    </button>
                  )}

                  {!isMissed ? (
                    <button
                      id={`miss-med-btn-${med.id}`}
                      onClick={() => onMissDose(med.id)}
                      className="py-2.5 px-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 hover:bg-rose-100 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      ✗ Mark Missed
                    </button>
                  ) : (
                    <button
                      onClick={() => onUndoDose(med.id)}
                      className="py-2.5 px-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Reset
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  )}
</div>
  );
};

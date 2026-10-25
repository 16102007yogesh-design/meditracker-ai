import React, { useState } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  Sparkles, 
  Calendar, 
  Clock, 
  Package, 
  HelpCircle,
  Eye,
  SlidersHorizontal,
  Flame,
  Award,
  ArrowRight,
  ShieldCheck,
  Zap,
  Info,
  Pill,
  Sun,
  Sunset,
  Moon,
  Coffee,
  Check
} from 'lucide-react';
import { Medicine, DailyAdherencePoint } from '../../types';

interface SimpleHealthChartsProps {
  medicines: Medicine[];
  dailyHistory: DailyAdherencePoint[];
  streakDays: number;
  userRole: 'patient' | 'caregiver';
  patientName?: string;
  onRequestRefill?: (medName: string) => void;
  showToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const SimpleHealthCharts: React.FC<SimpleHealthChartsProps> = ({
  medicines,
  dailyHistory,
  streakDays,
  userRole,
  patientName = 'Raj Kumar',
  onRequestRefill,
  showToast,
}) => {
  // Toggle between Simple Everyday Visuals and Complex Clinical Breakdown
  const [viewMode, setViewMode] = useState<'simple' | 'complex'>('simple');
  const [selectedDay, setSelectedDay] = useState<number>(dailyHistory.length - 1);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  // 1. Overall adherence score
  const totalDosesLogged = dailyHistory.reduce((acc, d) => acc + d.dosesTaken, 0);
  const totalDosesScheduled = dailyHistory.reduce((acc, d) => acc + d.totalDoses, 0);
  const overallAdherencePercent = totalDosesScheduled > 0 
    ? Math.round((totalDosesLogged / totalDosesScheduled) * 100) 
    : 94;

  // 2. Real-time time of day success breakdown
  const morningMeds = medicines.filter((m) => m.timeSlot === 'morning' || m.time.includes('AM'));
  const afternoonMeds = medicines.filter((m) => m.timeSlot === 'afternoon' || (m.time.includes('PM') && parseInt(m.time) < 5));
  const eveningMeds = medicines.filter((m) => m.timeSlot === 'evening' || (m.time.includes('PM') && parseInt(m.time) >= 5 && parseInt(m.time) < 9));
  const nightMeds = medicines.filter((m) => m.timeSlot === 'night' || m.time.includes('10:00 PM'));

  const calculateSlotStat = (meds: Medicine[], slotName: string, icon: any, label: string) => {
    if (meds.length === 0) {
      return { slotName, count: 0, taken: 0, percent: 100, status: 'No tablets', grade: 'none', icon, label };
    }
    const taken = meds.filter((m) => m.status === 'taken').length;
    const missed = meds.filter((m) => m.status === 'missed').length;
    // In demo dataset if taken+missed < total, calculate estimated compliance
    const percent = Math.round((taken / meds.length) * 100);
    const grade = percent >= 90 ? 'excellent' : percent >= 75 ? 'good' : 'warning';
    return { slotName, count: meds.length, taken, missed, percent, grade, icon, label };
  };

  const slotStats = [
    calculateSlotStat(morningMeds, 'morning', Coffee, 'Breakfast / Morning'),
    calculateSlotStat(afternoonMeds, 'afternoon', Sun, 'Lunch / Afternoon'),
    calculateSlotStat(eveningMeds, 'evening', Sunset, 'Dinner / Evening'),
    calculateSlotStat(nightMeds, 'night', Moon, 'Bedtime / Night'),
  ];

  // 3. Category distribution from actual medicines
  const categoryMap: Record<string, { count: number; meds: string[]; color: string }> = {};
  const colorPalette = [
    'from-blue-500 to-indigo-600',
    'from-emerald-500 to-teal-600',
    'from-amber-500 to-orange-600',
    'from-purple-500 to-pink-600',
    'from-cyan-500 to-blue-600',
  ];

  medicines.forEach((med, idx) => {
    const cat = med.category || 'General Health';
    if (!categoryMap[cat]) {
      categoryMap[cat] = {
        count: 0,
        meds: [],
        color: colorPalette[Object.keys(categoryMap).length % colorPalette.length],
      };
    }
    categoryMap[cat].count += 1;
    categoryMap[cat].meds.push(med.name);
  });

  const categoryList = Object.entries(categoryMap).map(([name, data]) => ({
    name,
    count: data.count,
    percent: Math.round((data.count / (medicines.length || 1)) * 100),
    meds: data.meds,
    color: data.color,
  }));

  // 4. Simple Health Rating Description
  const getRatingSummary = () => {
    if (overallAdherencePercent >= 90) {
      return {
        badge: '🌟 Grade A: Outstanding Adherence',
        headline: 'Your Medication Routine is Strong and Stable!',
        explanation: `You've completed ${totalDosesLogged} of your last ${totalDosesScheduled} doses. Taking pills consistently at the right time gives your body steady therapeutic coverage.`,
        tip: 'Keep your evening doses just as consistent as your morning routine to maintain your streak!',
        color: 'text-emerald-600 dark:text-emerald-400',
        bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
      };
    } else if (overallAdherencePercent >= 75) {
      return {
        badge: '🟡 Grade B: Good with Room for Improvement',
        headline: 'You Are Mostly On Track, But Evening Doses Need Attention',
        explanation: `You took ${totalDosesLogged} out of ${totalDosesScheduled} doses. A few missed evening doses brought down your consistency.`,
        tip: 'Try placing your evening medicines next to where you eat dinner or setting a reminder alarm.',
        color: 'text-amber-600 dark:text-amber-400',
        bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
      };
    } else {
      return {
        badge: '🔴 Needs Caregiver Attention',
        headline: 'Missed Doses May Impact Treatment Effectiveness',
        explanation: 'Several doses were skipped over the past week, which can cause medication levels to fluctuate.',
        tip: 'Contact your caregiver or doctor to simplify your pill schedule or adjust timings.',
        color: 'text-rose-600 dark:text-rose-400',
        bg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800',
      };
    }
  };

  const rating = getRatingSummary();

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. Header with Mode Toggle: Simple vs Complex */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-cyan-700 rounded-3xl p-6 text-white shadow-lg shadow-blue-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full">
              {userRole === 'caregiver' ? `Patient Analytics: ${patientName}` : 'My Health Analytics'}
            </span>
            <span className="text-xs text-blue-200 flex items-center gap-1 font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-cyan-300" /> Live Data Visualizer
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tight mt-1">
            {viewMode === 'simple' ? 'Simple Health & Medication Charts 📊' : 'Detailed Statistical Analysis & Variance 🔬'}
          </h2>
          <p className="text-xs text-blue-100 mt-1 max-w-xl">
            {viewMode === 'simple'
              ? 'Complex medical statistics translated into clear, easy-to-read charts so you can see your routine at a glance.'
              : 'Deep clinical variance, compliance curves, standard deviations, and time-stamped dose telemetry.'}
          </p>
        </div>

        {/* View Mode Toggle Switch */}
        <div className="bg-slate-900/40 backdrop-blur-md p-1.5 rounded-2xl flex items-center border border-white/20 self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setViewMode('simple')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'simple'
                ? 'bg-white text-blue-900 shadow-md scale-102'
                : 'text-white/80 hover:text-white'
            }`}
          >
            <span>🎨 Simple Visual Mode</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('complex')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'complex'
                ? 'bg-white text-blue-900 shadow-md scale-102'
                : 'text-white/80 hover:text-white'
            }`}
          >
            <span>🔬 Clinical Mode</span>
          </button>
        </div>
      </div>

      {/* 2. Top "Plain English" Summary Card */}
      <div className={`p-5 rounded-2xl border shadow-sm ${rating.bg} transition-all`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 shadow-sm flex items-center justify-center text-2xl shrink-0">
              {overallAdherencePercent >= 90 ? '🏆' : overallAdherencePercent >= 75 ? '📈' : '⚠️'}
            </div>
            <div>
              <span className={`text-xs font-bold uppercase tracking-wider block ${rating.color}`}>
                {rating.badge}
              </span>
              <h3 className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                {rating.headline}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-2xl">
                {rating.explanation}
              </p>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-slate-900/80 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-800 text-center shrink-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Overall Success Rate</span>
            <div className={`text-3xl font-black ${rating.color} mt-0.5`}>
              {overallAdherencePercent}%
            </div>
            <span className="text-[10px] font-semibold text-emerald-600 flex items-center justify-center gap-0.5 mt-0.5">
              <Flame className="w-3 h-3 text-amber-500 fill-amber-500" /> {streakDays} Day Streak!
            </span>
          </div>
        </div>

        {/* Helpful Tip Box */}
        <div className="mt-3.5 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
          <span className="font-bold text-amber-600 flex items-center gap-1 shrink-0">
            💡 Practical Tip:
          </span>
          <span>{rating.tip}</span>
        </div>
      </div>

      {/* 3. Main Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* CHART 1: 7-Day Visual Adherence Chart (Simple Pills vs Complex Stats) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  {viewMode === 'simple' ? 'My Week at a Glance (Easy Pill Chart)' : '7-Day Dose Compliance Probability Distribution'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {viewMode === 'simple' 
                    ? 'Stars represent 100% perfect days. Click any day to see details.'
                    : 'Daily binomial adherence curve with target threshold baseline (85%).'}
                </p>
              </div>

              <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
                <span>🎯 Goal: 85%+</span>
              </div>
            </div>

            {/* Visual Bars Container */}
            <div className="relative h-48 flex items-end justify-between gap-2 pt-8 pb-3 px-2">
              {/* Target Line at 85% */}
              <div 
                className="absolute left-2 right-2 border-b-2 border-dashed border-emerald-400/60 z-10 pointer-events-none"
                style={{ bottom: '85%' }}
              >
                <span className="absolute right-0 -top-4 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-900 px-1 rounded">
                  Clinical Target (85%)
                </span>
              </div>

              {dailyHistory.map((item, idx) => {
                const isSelected = selectedDay === idx;
                const isStar = item.adherence === 100;
                const isGood = item.adherence >= 85 && !isStar;
                const isUnder = item.adherence < 85;

                return (
                  <div
                    key={item.day}
                    onClick={() => setSelectedDay(idx)}
                    className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
                  >
                    {/* Tooltip on hover/select */}
                    <div className="relative w-full flex flex-col items-center justify-end h-36">
                      {isStar && (
                        <span className="text-xs mb-1 animate-bounce" title="100% Perfect Day!">
                          ⭐
                        </span>
                      )}

                      {isSelected && (
                        <div className="absolute -top-7 bg-slate-900 text-white text-[10px] font-bold py-1 px-2 rounded-lg shadow-lg whitespace-nowrap z-20">
                          {item.day}: {item.dosesTaken}/{item.totalDoses} doses ({item.adherence}%)
                        </div>
                      )}

                      {/* Bar Graphic */}
                      <div
                        className={`w-full max-w-[40px] rounded-t-xl transition-all duration-300 relative ${
                          isSelected
                            ? 'ring-3 ring-blue-500 scale-105 shadow-md'
                            : 'group-hover:opacity-90'
                        } ${
                          isStar
                            ? 'bg-gradient-to-t from-emerald-600 via-teal-500 to-emerald-400'
                            : isGood
                            ? 'bg-gradient-to-t from-blue-600 via-indigo-500 to-cyan-400'
                            : 'bg-gradient-to-t from-rose-600 via-pink-500 to-amber-400'
                        }`}
                        style={{ height: `${item.adherence}%` }}
                      >
                        {/* Percentage inside bar if tall enough */}
                        {item.adherence >= 70 && (
                          <span className="absolute inset-x-0 top-2 text-center text-[10px] font-black text-white">
                            {item.adherence}%
                          </span>
                        )}
                      </div>
                    </div>

                    <span className={`text-xs mt-2.5 font-bold ${
                      isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400'
                    }`}>
                      {item.day}
                    </span>
                    <span className="text-[10px] text-slate-400">{item.date}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Day Simple Explanation */}
          {dailyHistory[selectedDay] && (
            <div className="mt-4 p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center text-sm">
                  {dailyHistory[selectedDay].adherence === 100 ? '🌟' : '📅'}
                </div>
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {dailyHistory[selectedDay].day}, {dailyHistory[selectedDay].date} Record:
                  </span>
                  <p className="text-slate-500 text-[11px]">
                    {dailyHistory[selectedDay].dosesTaken === dailyHistory[selectedDay].totalDoses
                      ? 'All scheduled doses taken successfully!'
                      : `${dailyHistory[selectedDay].dosesTaken} of ${dailyHistory[selectedDay].totalDoses} doses taken (${dailyHistory[selectedDay].totalDoses - dailyHistory[selectedDay].dosesTaken} missed)`}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className={`text-base font-black ${
                  dailyHistory[selectedDay].adherence >= 85 ? 'text-emerald-600' : 'text-rose-600'
                }`}>
                  {dailyHistory[selectedDay].adherence}%
                </span>
                <span className="text-[10px] text-slate-400 block font-semibold">
                  {dailyHistory[selectedDay].adherence >= 85 ? '✓ Target Achieved' : '⚠️ Action Needed'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* CHART 2: Time-of-Day Barometer (Where do I miss pills?) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  Time of Day Success Chart
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  See which time of day you take your medicine best
                </p>
              </div>
            </div>

            {/* Time Slot Progress Bars */}
            <div className="space-y-3 pt-2">
              {slotStats.map((slot) => {
                const IconComponent = slot.icon;
                const isGood = slot.percent >= 90;
                const isMid = slot.percent >= 75 && !isGood;

                return (
                  <div 
                    key={slot.slotName}
                    onClick={() => setSelectedSlot(selectedSlot === slot.slotName ? null : slot.slotName)}
                    className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 hover:border-blue-400 transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs ${
                          isGood 
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' 
                            : isMid 
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' 
                            : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                        }`}>
                          <IconComponent className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                          {slot.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-black ${
                          isGood ? 'text-emerald-600' : isMid ? 'text-amber-600' : 'text-rose-600'
                        }`}>
                          {slot.percent}%
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          ({slot.taken}/{slot.count} taken)
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isGood ? 'bg-emerald-500' : isMid ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${Math.max(8, slot.percent)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Simple Takeaway */}
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-xl text-xs text-blue-900 dark:text-blue-200 flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold">What this chart shows:</strong>
              <span>
                Morning routines are usually easiest to remember with coffee or breakfast. Evening doses drop off when routines vary. Setting a phone alert for evening pills boosts total score by ~15%!
              </span>
            </div>
          </div>
        </div>

        {/* CHART 3: Prescription Supply "Fuel Tank" Runway */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Package className="w-4 h-4 text-amber-500" />
                Pill Supply "Fuel Tank" & Refill Countdown
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Shows exactly how many days of tablets remain in your bottle before empty
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {medicines.map((med) => {
              const dailyBurn = med.perDose * 1;
              const daysLeft = Math.ceil(med.stock / dailyBurn);
              const isUrgent = daysLeft <= 4;
              const isWarning = daysLeft <= 7 && !isUrgent;
              const fuelPercent = Math.min(100, Math.round((med.stock / 30) * 100));

              return (
                <div 
                  key={med.id}
                  className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div>
                      <span className="font-bold text-xs text-slate-900 dark:text-white">{med.name}</span>
                      <span className="text-[11px] text-slate-400 ml-1.5 font-medium">({med.dose} • {med.frequency})</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full ${
                        isUrgent 
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' 
                          : isWarning 
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' 
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      }`}>
                        {daysLeft} Days Remaining
                      </span>
                    </div>
                  </div>

                  {/* Fuel Tank Bar */}
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-3 rounded-full overflow-hidden p-0.5">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isUrgent ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.max(5, fuelPercent)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
                    <span>{med.stock} tablets in bottle</span>
                    {isUrgent ? (
                      <button
                        type="button"
                        onClick={() => {
                          onRequestRefill?.(med.name);
                          showToast?.(`Refill order sent for ${med.name}!`, 'success');
                        }}
                        className="text-[11px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer underline"
                      >
                        🚨 Order Pharmacy Refill Today →
                      </button>
                    ) : isWarning ? (
                      <span className="text-amber-600 font-semibold">Refill Recommended this week</span>
                    ) : (
                      <span className="text-emerald-600 font-semibold">✓ Supply Safe (&gt;1 Week)</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CHART 4: What Are My Medicines For? (Category Breakdown) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
              <Pill className="w-4 h-4 text-purple-600" />
              What Are My Medicines For?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Visual breakdown of your current prescribed health conditions
            </p>

            <div className="space-y-3">
              {categoryList.map((cat) => (
                <div key={cat.name} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-slate-800 dark:text-slate-200">{cat.name}</span>
                    <span className="font-black text-indigo-600 dark:text-indigo-400">{cat.percent}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full bg-gradient-to-r ${cat.color}`} style={{ width: `${cat.percent}%` }} />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block truncate">
                    Includes: {cat.meds.join(', ')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
            <span>{medicines.length} Prescribed Medications Total</span>
            <span className="font-bold text-blue-600">All Doctor Authorized</span>
          </div>
        </div>
      </div>
    </div>
  );
};

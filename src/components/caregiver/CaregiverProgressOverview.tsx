import React, { useState } from 'react';
import { 
  Users, 
  HeartHandshake, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Clock, 
  Phone, 
  Bell, 
  FileText, 
  Search, 
  Filter, 
  ChevronRight, 
  ShieldAlert,
  ArrowUpRight,
  Sparkles,
  Send,
  Download,
  Plus,
  Trash2,
  Pill
} from 'lucide-react';
import { PatientRecord, Medicine, Appointment } from '../../types';
import { AddMedicineModal } from '../patient/AddMedicineModal';

interface CaregiverProgressOverviewProps {
  patients: PatientRecord[];
  onUpdatePatient: (patient: PatientRecord) => void;
  onSendAlert: (patientName: string, msg: string) => void;
  onOpenAddPatient: () => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  appointments?: Appointment[];
  onNavigateToSchedule?: () => void;
  onAddMedicineToPatient?: (patientId: number, newMed: Omit<Medicine, 'id'>) => void;
  onDeleteMedicineFromPatient?: (patientId: number, medId: number) => void;
}

export const CaregiverProgressOverview: React.FC<CaregiverProgressOverviewProps> = ({
  patients,
  onUpdatePatient,
  onSendAlert,
  onOpenAddPatient,
  showToast,
  appointments = [],
  onNavigateToSchedule,
  onAddMedicineToPatient,
  onDeleteMedicineFromPatient,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'critical' | 'review' | 'active'>('all');
  const [selectedPatientForModal, setSelectedPatientForModal] = useState<PatientRecord | null>(null);
  const [noteEdit, setNoteEdit] = useState('');
  const [isAddMedModalOpen, setIsAddMedModalOpen] = useState(false);

  const currentModalPatient = selectedPatientForModal
    ? (patients.find((p) => p.id === selectedPatientForModal.id) || selectedPatientForModal)
    : null;

  // Calculations
  const totalPatients = patients.length;
  const criticalPatients = patients.filter((p) => p.status === 'critical' || p.riskScore >= 65);
  const reviewPatients = patients.filter((p) => p.status === 'review');
  const activePatients = patients.filter((p) => p.status === 'active');

  const avgAdherence = totalPatients > 0 
    ? Math.round(patients.reduce((acc, p) => acc + p.adherenceRate, 0) / totalPatients) 
    : 0;

  // Rounds completion calculation (simulated daily caregiver checklist)
  const checkedInCount = 4;
  const roundsPercent = totalPatients > 0 ? Math.round((checkedInCount / totalPatients) * 100) : 0;

  // Filtered patients
  const filteredPatients = patients.filter((p) => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.condition.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenDetailModal = (p: PatientRecord) => {
    setSelectedPatientForModal(p);
    setNoteEdit(p.notes);
  };

  const handleSaveNotes = () => {
    if (!selectedPatientForModal) return;
    const updated: PatientRecord = {
      ...selectedPatientForModal,
      notes: noteEdit,
    };
    onUpdatePatient(updated);
    setSelectedPatientForModal(updated);
    showToast(`Updated care notes for ${updated.name}`, 'success');
  };

  const handleQuickSendReminder = (patient: PatientRecord) => {
    onSendAlert(patient.name, `Urgent medication reminder: Please take your prescribed afternoon doses.`);
    showToast(`🔔 Medication reminder sent to ${patient.name}`, 'success');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. HERO CAREGIVER PROGRESS COMMAND CENTER */}
      <div 
        id="caregiver-progress-hero"
        className="relative overflow-hidden bg-gradient-to-r from-indigo-900 via-blue-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-indigo-950/30"
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-8 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold tracking-wide text-blue-200">
              <HeartHandshake className="w-3.5 h-3.5 text-cyan-300" />
              <span>Multi-Patient Clinical Care & Adherence Oversight</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Patient Caregiver Progress Center
            </h1>

            <p className="text-sm text-blue-100/90 max-w-2xl leading-relaxed">
              Monitoring <strong className="text-white font-bold">{totalPatients} patients</strong> across multiple treatment regimens. Average cohort adherence is currently at <strong className="text-cyan-300 font-bold">{avgAdherence}%</strong>.
            </p>

            {/* Daily Rounds Progress Bar */}
            <div className="pt-2 max-w-xl">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-bold text-blue-200 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Today's Caregiver Rounds & Check-in Progress:
                </span>
                <span className="font-bold text-white">{checkedInCount} of {totalPatients} Patients ({roundsPercent}%)</span>
              </div>
              <div className="w-full bg-slate-800/80 h-2.5 rounded-full overflow-hidden border border-white/10 p-0.5">
                <div 
                  className="bg-gradient-to-r from-emerald-400 to-cyan-400 h-full rounded-full transition-all duration-700" 
                  style={{ width: `${roundsPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Right Column: Key KPI dials */}
          <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3 justify-center">
            <div className="p-3.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-300 flex items-center justify-center font-bold">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs text-blue-200 block">High Priority Flags</span>
                  <span className="text-lg font-black text-white">{criticalPatients.length + reviewPatients.length} Patients</span>
                </div>
              </div>
              <span className="text-xs font-bold text-rose-300 bg-rose-500/20 px-2 py-1 rounded-lg">
                Needs Attention
              </span>
            </div>

            <button
              onClick={onOpenAddPatient}
              className="py-3 px-4 bg-white text-indigo-900 hover:bg-blue-50 font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Enroll New Patient
            </button>
          </div>
        </div>
      </div>

      {/* 2. SUMMARY METRIC TILES */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-1 text-slate-500 text-xs font-bold uppercase">
            <span>Total Patients</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{totalPatients}</div>
          <span className="text-[11px] text-slate-400">All registered profiles</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-1 text-slate-500 text-xs font-bold uppercase">
            <span>Cohort Adherence</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{avgAdherence}%</div>
          <span className="text-[11px] text-emerald-600 font-semibold">+2.8% vs last week</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-1 text-slate-500 text-xs font-bold uppercase">
            <span>Critical / Review</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
            {criticalPatients.length + reviewPatients.length}
          </div>
          <span className="text-[11px] text-amber-600 font-semibold">Flagged for follow-up</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-1 text-slate-500 text-xs font-bold uppercase">
            <span>Stable Routine</span>
            <CheckCircle2 className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="text-2xl font-black text-cyan-600 dark:text-cyan-400">{activePatients.length}</div>
          <span className="text-[11px] text-slate-400">Adherence &gt; 85%</span>
        </div>
      </div>

      {/* 3. PATIENTS PROGRESS ROSTER & RECOVERY OVERVIEW */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm">
        {/* Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              Patient Recovery & Adherence Progress Dashboard
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live monitoring of each patient's daily doses, streak, and risk metrics
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search patient or disease..."
                className="pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 w-48 sm:w-60"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-xl">
              {(['all', 'critical', 'review', 'active'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-lg capitalize transition-all cursor-pointer ${
                    statusFilter === filter
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Patients Grid Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredPatients.map((patient) => {
            const isHighRisk = patient.riskScore >= 65;
            const isMediumRisk = patient.riskScore >= 30 && patient.riskScore < 65;
            const initials = patient.name.split(' ').map((n) => n[0]).join('').toUpperCase();

            return (
              <div
                key={patient.id}
                className="bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-5 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Card Header: Avatar, Name & Status */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-sm flex items-center justify-center shadow-md shadow-blue-500/20">
                        {initials}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                          {patient.name}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                          {patient.age} yrs • {patient.condition}
                        </p>
                      </div>
                    </div>

                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                      patient.status === 'critical'
                        ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-300'
                        : patient.status === 'review'
                        ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-300'
                        : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300'
                    }`}>
                      {patient.status}
                    </span>
                  </div>

                  {/* Adherence & Recovery Stage */}
                  <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 mb-3 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-500">Adherence Progress</span>
                      <div className="flex items-center gap-1.5">
                        {patient.trend === 'improving' && (
                          <span className="text-[10px] font-bold text-emerald-600 flex items-center">
                            <TrendingUp className="w-3 h-3 mr-0.5" /> Improving
                          </span>
                        )}
                        {patient.trend === 'stable' && (
                          <span className="text-[10px] font-bold text-blue-600 flex items-center">
                            <Minus className="w-3 h-3 mr-0.5" /> Stable
                          </span>
                        )}
                        {patient.trend === 'declining' && (
                          <span className="text-[10px] font-bold text-rose-600 flex items-center">
                            <TrendingDown className="w-3 h-3 mr-0.5" /> Declining
                          </span>
                        )}
                        <strong className="text-sm font-black text-slate-900 dark:text-white">
                          {patient.adherenceRate}%
                        </strong>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          patient.adherenceRate >= 85
                            ? 'bg-emerald-500'
                            : patient.adherenceRate >= 65
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${patient.adherenceRate}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                      <span>Today: <strong className="text-slate-700 dark:text-slate-300">{patient.todayDosesTaken}/{patient.todayDosesTotal} Doses</strong></span>
                      <span>Streak: <strong className="text-amber-600">{patient.streakDays} days 🔥</strong></span>
                    </div>
                  </div>

                  {/* Stage & Clinical Notes Preview */}
                  <div className="text-xs space-y-1 text-slate-600 dark:text-slate-300 mb-3">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Recovery Stage:</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-200">{patient.recoveryStage}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Risk Radar:</span>
                      <span className={`font-bold ${isHighRisk ? 'text-rose-600' : isMediumRisk ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {patient.riskScore}% Risk ({isHighRisk ? 'High' : isMediumRisk ? 'Moderate' : 'Low'})
                      </span>
                    </div>
                    {patient.notes && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 italic line-clamp-1 bg-white/60 dark:bg-slate-900/60 p-1.5 rounded-lg border border-slate-200/60 dark:border-slate-800">
                        "{patient.notes}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-700/80 flex items-center gap-2">
                  <button
                    onClick={() => handleOpenDetailModal(patient)}
                    className="flex-1 py-2 px-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" /> Progress File
                  </button>

                  <button
                    onClick={() => handleQuickSendReminder(patient)}
                    title="Send Medication Alert"
                    className="p-2 bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 dark:hover:bg-amber-900/50 rounded-xl border border-amber-200 dark:border-amber-800/60 transition-colors cursor-pointer"
                  >
                    <Bell className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => showToast(`Connecting call to ${patient.name} (${patient.contact})...`, 'info')}
                    title="Call Patient"
                    className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/50 rounded-xl border border-emerald-200 dark:border-emerald-800/60 transition-colors cursor-pointer"
                  >
                    <Phone className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. DETAILED PATIENT CLINICAL PROGRESS & PRESCRIPTIONS MODAL */}
      {currentModalPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-700 to-indigo-700 p-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-lg font-black shadow-inner">
                  {currentModalPatient.name.split(' ').map((n) => n[0]).join('')}
                </div>
                <div>
                  <h3 className="text-xl font-bold">{currentModalPatient.name}</h3>
                  <p className="text-xs text-blue-100">
                    {currentModalPatient.age} Years • {currentModalPatient.condition} • {currentModalPatient.contact}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPatientForModal(null)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Content Scrollable */}
            <div className="p-6 space-y-5 overflow-y-auto">
              {/* Adherence & Metrics summary */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Adherence Rate</span>
                  <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
                    {currentModalPatient.adherenceRate}%
                  </div>
                  <span className="text-[10px] text-emerald-600 font-semibold">Streak: {currentModalPatient.streakDays}d 🔥</span>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Risk Level</span>
                  <div className={`text-2xl font-black mt-1 ${
                    currentModalPatient.riskScore >= 65 ? 'text-rose-600' : 'text-emerald-600'
                  }`}>
                    {currentModalPatient.riskScore}%
                  </div>
                  <span className="text-[10px] text-slate-500 font-semibold">{currentModalPatient.status.toUpperCase()}</span>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Today's Progress</span>
                  <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                    {currentModalPatient.todayDosesTaken}/{currentModalPatient.todayDosesTotal}
                  </div>
                  <span className="text-[10px] text-slate-500 font-semibold">Doses Logged</span>
                </div>
              </div>

              {/* Active Prescribed Medicines List with Prescribe Tablet Action */}
              <div className="bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                      <Pill className="w-4 h-4 text-blue-600" />
                      Prescribed Tablets & Regimen ({currentModalPatient.medicines.length})
                    </h4>
                    <span className="text-[11px] text-slate-500">
                      Changes automatically synchronize to patient's daily portal
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAddMedModalOpen(true)}
                    className="py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Prescribe Tablet
                  </button>
                </div>

                {currentModalPatient.medicines.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-xs">
                    No medication regimen prescribed yet. Click "+ Prescribe Tablet" above to add the patient's first medicine.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {currentModalPatient.medicines.map((med) => (
                      <div
                        key={med.id}
                        className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between text-xs hover:border-blue-400 transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-base">💊</span>
                          <div>
                            <div className="flex items-center gap-2">
                              <strong className="text-slate-900 dark:text-white block font-bold">{med.name}</strong>
                              <span className="text-[10px] text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-1.5 py-0.5 rounded font-semibold">
                                {med.timeSlot}
                              </span>
                            </div>
                            <span className="text-slate-500 text-[11px]">
                              {med.dose} • {med.frequency} at {med.time}
                              {med.instructions ? ` • ${med.instructions}` : ''}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              med.status === 'taken' 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : med.status === 'missed' 
                                ? 'bg-rose-100 text-rose-800' 
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {med.status.toUpperCase()}
                            </span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">{med.stock} in stock</span>
                          </div>
                          {onDeleteMedicineFromPatient && (
                            <button
                              onClick={() => {
                                if (confirm(`Remove ${med.name} from ${currentModalPatient.name}'s regimen?`)) {
                                  onDeleteMedicineFromPatient(currentModalPatient.id, med.id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                              title="Delete prescription"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Emergency Contact & Vitals */}
              <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-xl text-xs space-y-1">
                <strong className="text-blue-900 dark:text-blue-200 block font-bold">
                  Emergency & Next-of-Kin Contact:
                </strong>
                <p className="text-blue-800 dark:text-blue-300">
                  {currentModalPatient.emergency}
                </p>
                <p className="text-slate-500 dark:text-slate-400 text-[11px] pt-1">
                  Last clinical check-in: {currentModalPatient.lastVisit}
                </p>
              </div>

              {/* Editable Caregiver Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Caregiver Clinical Progress Notes
                </label>
                <textarea
                  rows={3}
                  value={noteEdit}
                  onChange={(e) => setNoteEdit(e.target.value)}
                  placeholder="Record recovery observation, blood pressure changes, or dietary compliance..."
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
              <button
                onClick={() => handleQuickSendReminder(currentModalPatient)}
                className="py-2 px-3 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" /> Dispatch Dose Reminder
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedPatientForModal(null)}
                  className="py-2 px-4 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={handleSaveNotes}
                  className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
                >
                  Save Progress Notes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. ADD TABLET MODAL FOR SELECTED PATIENT */}
      {isAddMedModalOpen && currentModalPatient && (
        <AddMedicineModal
          isOpen={isAddMedModalOpen}
          onClose={() => setIsAddMedModalOpen(false)}
          targetPatientName={currentModalPatient.name}
          onAdd={(newMed) => {
            onAddMedicineToPatient?.(currentModalPatient.id, newMed);
            setIsAddMedModalOpen(false);
          }}
          showToast={showToast}
        />
      )}
    </div>
  );
};

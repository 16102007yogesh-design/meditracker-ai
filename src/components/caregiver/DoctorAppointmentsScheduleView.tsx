import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  User, 
  Video, 
  MapPin, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  Stethoscope, 
  Search, 
  Filter, 
  FileText, 
  Printer, 
  ChevronRight, 
  ShieldCheck, 
  Pill, 
  ArrowRight,
  TrendingUp,
  X
} from 'lucide-react';
import { Appointment, PatientRecord, AppointmentStatus, ConsultationType } from '../../types';
import { AVAILABLE_DOCTORS } from '../../data/initialData';
import { VideoConsultationModal } from '../shared/VideoConsultationModal';

interface DoctorAppointmentsScheduleViewProps {
  appointments: Appointment[];
  patients: PatientRecord[];
  onUpdateAppointmentStatus: (id: string, status: AppointmentStatus, notes?: string, prescriptionSummary?: string) => void;
  onBookAppointment: (newApt: Appointment) => void;
  onRescheduleAppointment: (id: string, newDate: string, newTime: string) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const DoctorAppointmentsScheduleView: React.FC<DoctorAppointmentsScheduleViewProps> = ({
  appointments,
  patients,
  onUpdateAppointmentStatus,
  onBookAppointment,
  onRescheduleAppointment,
  showToast,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'today' | 'confirmed' | 'in_progress' | 'completed'>('today');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'queue' | 'timeline'>('queue');
  const [activeVideoApt, setActiveVideoApt] = useState<Appointment | null>(null);

  // Consultation completion modal state
  const [completingApt, setCompletingApt] = useState<Appointment | null>(null);
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [prescriptionNotes, setPrescriptionNotes] = useState('');

  // Add Appointment Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newPatientId, setNewPatientId] = useState<number | string>(patients[0]?.id || 1);
  const [newDoctorName, setNewDoctorName] = useState(AVAILABLE_DOCTORS[0].name);
  const [newDate, setNewDate] = useState('2026-08-20');
  const [newTime, setNewTime] = useState('10:30 AM');
  const [newType, setNewType] = useState<ConsultationType>('in_person');
  const [newReason, setNewReason] = useState('');

  // Stats calculation
  const totalAppointments = appointments.length;
  const inProgressApt = appointments.filter((a) => a.status === 'in_progress');
  const confirmedApt = appointments.filter((a) => a.status === 'confirmed');
  const completedApt = appointments.filter((a) => a.status === 'completed');
  const videoConsults = appointments.filter((a) => a.type === 'video');

  // Filtered appointments
  const filteredAppointments = appointments.filter((apt) => {
    if (selectedFilter === 'today') {
      // In demo, show active items or today
      return apt.status === 'in_progress' || apt.status === 'confirmed' || apt.status === 'scheduled';
    }
    if (selectedFilter === 'confirmed') return apt.status === 'confirmed' || apt.status === 'scheduled';
    if (selectedFilter === 'in_progress') return apt.status === 'in_progress';
    if (selectedFilter === 'completed') return apt.status === 'completed';
    return true;
  }).filter((apt) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      apt.patientName.toLowerCase().includes(q) ||
      apt.doctorName.toLowerCase().includes(q) ||
      apt.reason.toLowerCase().includes(q) ||
      (apt.tokenNumber && apt.tokenNumber.toLowerCase().includes(q))
    );
  });

  const handleStartConsultation = (apt: Appointment) => {
    if (apt.type === 'video') {
      setActiveVideoApt(apt);
    }
    onUpdateAppointmentStatus(apt.id, 'in_progress');
    showToast(`Started consultation for ${apt.patientName} (Token #${apt.tokenNumber || 'ONLINE'})`, 'info');
  };

  const handleOpenCompleteModal = (apt: Appointment) => {
    setCompletingApt(apt);
    setClinicalNotes(apt.doctorNotes || 'Patient examined. Vitals within acceptable parameters. Adherence verified.');
    setPrescriptionNotes(apt.prescriptionSummary || 'Continue current maintenance dosage. Schedule next review in 90 days.');
  };

  const handleSaveConsultationNotes = (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingApt) return;

    onUpdateAppointmentStatus(completingApt.id, 'completed', clinicalNotes, prescriptionNotes);
    showToast(`✓ Consultation completed & clinical record filed for ${completingApt.patientName}`, 'success');
    setCompletingApt(null);
  };

  const handleCreateAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    const patient = patients.find((p) => p.id.toString() === newPatientId.toString()) || patients[0];
    const doctor = AVAILABLE_DOCTORS.find((d) => d.name === newDoctorName) || AVAILABLE_DOCTORS[0];

    const token = `${doctor.specialty.substring(0, 3).toUpperCase()}-${Math.floor(10 + Math.random() * 90)}`;
    const newApt: Appointment = {
      id: 'apt_' + Date.now(),
      patientId: patient.id,
      patientName: patient.name,
      patientAge: patient.age,
      patientCondition: patient.condition,
      patientContact: patient.contact,
      doctorName: doctor.name,
      doctorSpecialty: doctor.specialty,
      hospitalName: doctor.hospital,
      date: newDate,
      time: newTime,
      status: 'confirmed',
      type: newType,
      reason: newReason.trim() || 'Clinical Review & Vitals Assessment',
      tokenNumber: token,
      videoLink: newType === 'video' ? `https://meditrack.ai/telehealth/session-${Date.now()}` : undefined,
    };

    onBookAppointment(newApt);
    setIsAddModalOpen(false);
    setNewReason('');
    showToast(`✓ Added ${patient.name} to appointment schedule (Token #${token})`, 'success');
  };

  const handlePrintSchedule = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-3xl p-6 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-wider">
              Clinical OPD & Tele-Consultation Schedule
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
            Doctor Appointment Schedule & Queue 📋
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Real-time OPD queue management, live patient consultation room launcher, and synchronized clinical electronic medical records.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handlePrintSchedule}
            className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" /> Print Roster
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="py-2.5 px-4 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-teal-500/20 flex items-center gap-1.5 transition-all cursor-pointer transform hover:scale-105"
          >
            <Plus className="w-4 h-4" /> Schedule New Visit
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1 font-semibold">
            <span>Total Appointments</span>
            <Calendar className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{totalAppointments}</div>
          <span className="text-[10px] text-blue-600 font-bold">Roster Master View</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-amber-500/30 rounded-2xl shadow-sm bg-gradient-to-br from-amber-50/50 dark:from-amber-950/20 to-transparent">
          <div className="flex items-center justify-between text-amber-700 dark:text-amber-400 text-xs mb-1 font-semibold">
            <span>Attending Now</span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
          </div>
          <div className="text-2xl font-black text-amber-700 dark:text-amber-300">{inProgressApt.length}</div>
          <span className="text-[10px] text-amber-600 font-bold">In Exam Room</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-teal-500/30 rounded-2xl shadow-sm bg-gradient-to-br from-teal-50/50 dark:from-teal-950/20 to-transparent">
          <div className="flex items-center justify-between text-teal-700 dark:text-teal-400 text-xs mb-1 font-semibold">
            <span>Waiting in Queue</span>
            <Clock className="w-4 h-4 text-teal-500" />
          </div>
          <div className="text-2xl font-black text-teal-700 dark:text-teal-300">{confirmedApt.length}</div>
          <span className="text-[10px] text-teal-600 font-bold">Ready for Review</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-purple-500/30 rounded-2xl shadow-sm bg-gradient-to-br from-purple-50/50 dark:from-purple-950/20 to-transparent">
          <div className="flex items-center justify-between text-purple-700 dark:text-purple-400 text-xs mb-1 font-semibold">
            <span>Tele-Health Virtual</span>
            <Video className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-purple-700 dark:text-purple-300">{videoConsults.length}</div>
          <span className="text-[10px] text-purple-600 font-bold">Online Video Links</span>
        </div>
      </div>

      {/* Control Bar: Filters & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedFilter('today')}
            className={`py-1.5 px-3 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedFilter === 'today'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Today's OPD Queue ({confirmedApt.length + inProgressApt.length})
          </button>
          <button
            onClick={() => setSelectedFilter('in_progress')}
            className={`py-1.5 px-3 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedFilter === 'in_progress'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Active Now ({inProgressApt.length})
          </button>
          <button
            onClick={() => setSelectedFilter('completed')}
            className={`py-1.5 px-3 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedFilter === 'completed'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Completed ({completedApt.length})
          </button>
          <button
            onClick={() => setSelectedFilter('all')}
            className={`py-1.5 px-3 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedFilter === 'all'
                ? 'bg-slate-800 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            All Schedule ({appointments.length})
          </button>
        </div>

        <div className="relative min-w-[240px]">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search patient, token, doctor..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Appointment Queue Cards */}
      <div className="space-y-3.5">
        {filteredAppointments.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8">
            <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">No Appointments Matching Query</h4>
            <p className="text-xs text-slate-500 mt-1">
              There are no patient visits under the selected filter or search term.
            </p>
          </div>
        ) : (
          filteredAppointments.map((apt) => {
            const patientData = patients.find((p) => p.id === apt.patientId || p.name === apt.patientName);
            const isVideo = apt.type === 'video';
            const isInProgress = apt.status === 'in_progress';
            const isCompleted = apt.status === 'completed';

            return (
              <div
                key={apt.id}
                className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-sm transition-all ${
                  isInProgress
                    ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/20 dark:bg-amber-950/10'
                    : isCompleted
                    ? 'border-slate-200 dark:border-slate-800 opacity-90'
                    : 'border-slate-200 dark:border-slate-800 hover:border-indigo-500/50'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Patient Info & Token */}
                  <div className="flex items-start gap-3.5">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm shadow-md shrink-0 ${
                      isInProgress
                        ? 'bg-amber-500 text-white animate-pulse'
                        : isCompleted
                        ? 'bg-emerald-600 text-white'
                        : 'bg-indigo-600 text-white'
                    }`}>
                      {apt.tokenNumber || 'OPD'}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-base text-slate-900 dark:text-white">
                          {apt.patientName}
                        </h3>
                        {apt.patientAge && (
                          <span className="text-xs text-slate-500 font-medium">
                            ({apt.patientAge} yrs • {apt.patientCondition || 'General'})
                          </span>
                        )}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          isInProgress
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : isCompleted
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                        }`}>
                          {isInProgress ? '● In Consultation' : isCompleted ? '✓ Completed' : 'Scheduled'}
                        </span>
                        <span className="text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full">
                          {isVideo ? '📹 Tele-Health' : '🏥 Clinic'}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
                        <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                          <Stethoscope className="w-3.5 h-3.5 text-indigo-500" /> {apt.doctorName} ({apt.doctorSpecialty})
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-teal-500" /> {apt.date} at <strong>{apt.time}</strong>
                        </span>
                        {patientData && (
                          <span className="flex items-center gap-1 text-emerald-600 font-bold">
                            <TrendingUp className="w-3.5 h-3.5" /> Adherence: {patientData.adherenceRate}%
                          </span>
                        )}
                      </div>

                      {/* Reason & Symptoms */}
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5">
                        <strong className="text-slate-800 dark:text-slate-200">Visit Reason:</strong> {apt.reason}
                        {apt.symptoms && <span className="text-slate-500 italic"> — Symptoms: {apt.symptoms}</span>}
                      </p>
                    </div>
                  </div>

                  {/* Right Action Controls */}
                  <div className="flex items-center gap-2 flex-wrap self-end lg:self-center">
                    {!isCompleted && !isInProgress && (
                      <button
                        onClick={() => handleStartConsultation(apt)}
                        className="py-2 px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        {isVideo ? <Video className="w-4 h-4" /> : <Stethoscope className="w-4 h-4" />}
                        {isVideo ? 'Launch Video Session' : 'Begin Consultation'}
                      </button>
                    )}

                    {isInProgress && (
                      <div className="flex items-center gap-2">
                        {isVideo && (
                          <button
                            onClick={() => setActiveVideoApt(apt)}
                            className="py-2 px-3 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl flex items-center gap-1 shadow-md cursor-pointer"
                          >
                            <Video className="w-3.5 h-3.5" /> Video Suite
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenCompleteModal(apt)}
                          className="py-2 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" /> Complete & Add Rx
                        </button>
                      </div>
                    )}

                    {isCompleted && (
                      <button
                        onClick={() => handleOpenCompleteModal(apt)}
                        className="py-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5 text-teal-600" /> View / Edit Notes
                      </button>
                    )}
                  </div>
                </div>

                {/* Completed Notes Display */}
                {isCompleted && apt.doctorNotes && (
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl">
                    <strong className="text-indigo-600 dark:text-indigo-400 block mb-1">
                      Doctor Clinical Record & Prescriptions:
                    </strong>
                    <p className="text-slate-700 dark:text-slate-300">{apt.doctorNotes}</p>
                    {apt.prescriptionSummary && (
                      <div className="text-[11px] text-slate-500 mt-1 font-mono">
                        Rx: {apt.prescriptionSummary}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* COMPLETE CONSULTATION & CLINICAL NOTES MODAL */}
      {completingApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 p-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl shadow-inner">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Doctor Consultation Summary</h3>
                  <p className="text-xs text-emerald-100">
                    Patient: {completingApt.patientName} (Token #{completingApt.tokenNumber || 'OPD'})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCompletingApt(null)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveConsultationNotes} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Chief Complaint:</span>
                  <strong className="text-slate-800 dark:text-slate-200">{completingApt.reason}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Consulting Physician:</span>
                  <span className="text-indigo-600 font-bold">{completingApt.doctorName} ({completingApt.doctorSpecialty})</span>
                </div>
              </div>

              {/* Doctor Clinical Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Clinical Examination & Findings *
                </label>
                <textarea
                  rows={3}
                  required
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  placeholder="Record blood pressure, glucose readings, physical exam findings, and diagnosis..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Medication Adjustments / Rx Summary */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Medication Adjustments & Prescription Directives
                </label>
                <textarea
                  rows={2}
                  value={prescriptionNotes}
                  onChange={(e) => setPrescriptionNotes(e.target.value)}
                  placeholder="e.g. Metformin 500mg renewed for 90 days. Increase water intake to 2.5L daily."
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setCompletingApt(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-500/25 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" /> Finalize Consultation & Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SCHEDULE NEW PATIENT VISIT MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-700 via-blue-700 to-teal-700 p-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl shadow-inner">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Schedule Patient Consultation</h3>
                  <p className="text-xs text-indigo-100">Add patient to doctor's clinical OPD or tele-consultation queue</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAppointment} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Select Patient */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Select Patient *
                </label>
                <select
                  value={newPatientId}
                  onChange={(e) => setNewPatientId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.age} yrs • {p.condition})
                    </option>
                  ))}
                </select>
              </div>

              {/* Assign Doctor */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Assign Doctor *
                </label>
                <select
                  value={newDoctorName}
                  onChange={(e) => setNewDoctorName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {AVAILABLE_DOCTORS.map((d) => (
                    <option key={d.id} value={d.name}>
                      {d.name} — {d.specialty}
                    </option>
                  ))}
                </select>
              </div>

              {/* Mode */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setNewType('in_person')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 ${
                    newType === 'in_person'
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-700 dark:text-indigo-300'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5" /> In-Clinic Visit
                </button>
                <button
                  type="button"
                  onClick={() => setNewType('video')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 ${
                    newType === 'video'
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-700 dark:text-indigo-300'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600'
                  }`}
                >
                  <Video className="w-3.5 h-3.5" /> Tele-Health Video
                </button>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Time Slot *
                  </label>
                  <select
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="09:30 AM">09:30 AM</option>
                    <option value="10:30 AM">10:30 AM</option>
                    <option value="11:45 AM">11:45 AM</option>
                    <option value="02:00 PM">02:00 PM</option>
                    <option value="03:30 PM">03:30 PM</option>
                    <option value="05:00 PM">05:00 PM</option>
                  </select>
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Clinical Reason *
                </label>
                <input
                  type="text"
                  required
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  placeholder="e.g. Post-discharge checkup, blood pressure stabilization"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/25 cursor-pointer"
                >
                  Add to Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIDEO CONSULTATION MODAL */}
      <VideoConsultationModal
        isOpen={!!activeVideoApt}
        onClose={() => setActiveVideoApt(null)}
        appointment={activeVideoApt}
        userRole="caregiver"
        showToast={showToast}
      />
    </div>
  );
};

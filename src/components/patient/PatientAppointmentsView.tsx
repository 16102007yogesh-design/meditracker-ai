import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Video, 
  Phone, 
  Plus, 
  User, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Download, 
  Share2, 
  Stethoscope, 
  Sparkles, 
  X,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Star
} from 'lucide-react';
import { Appointment, ConsultationType } from '../../types';
import { AVAILABLE_DOCTORS, DoctorProfile } from '../../data/initialData';
import { VideoConsultationModal } from '../shared/VideoConsultationModal';

interface PatientAppointmentsViewProps {
  appointments: Appointment[];
  onBookAppointment: (newApt: Appointment) => void;
  onCancelAppointment: (id: string) => void;
  onRescheduleAppointment: (id: string, newDate: string, newTime: string) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const PatientAppointmentsView: React.FC<PatientAppointmentsViewProps> = ({
  appointments,
  onBookAppointment,
  onCancelAppointment,
  onRescheduleAppointment,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'doctors'>('upcoming');
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorProfile | null>(null);
  const [activeVideoApt, setActiveVideoApt] = useState<Appointment | null>(null);

  // Reschedule state
  const [reschedulingApt, setReschedulingApt] = useState<Appointment | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('10:30 AM');

  // Booking form state
  const [bookDoctorId, setBookDoctorId] = useState(AVAILABLE_DOCTORS[0].id);
  const [bookDate, setBookDate] = useState('2026-08-25');
  const [bookTime, setBookTime] = useState('10:30 AM');
  const [bookType, setBookType] = useState<ConsultationType>('in_person');
  const [bookReason, setBookReason] = useState('');
  const [bookSymptoms, setBookSymptoms] = useState('');

  // Filter patient's appointments
  const upcomingAppointments = appointments
    .filter((a) => a.status === 'confirmed' || a.status === 'scheduled' || a.status === 'in_progress')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const pastAppointments = appointments
    .filter((a) => a.status === 'completed' || a.status === 'cancelled')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const nextAppointment = upcomingAppointments[0];

  const handleOpenBooking = (doc?: DoctorProfile) => {
    if (doc) {
      setBookDoctorId(doc.id);
      setSelectedDoctor(doc);
    }
    setIsBookModalOpen(true);
  };

  const handleBookSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const doc = AVAILABLE_DOCTORS.find((d) => d.id === bookDoctorId) || AVAILABLE_DOCTORS[0];

    const tokenNumber = `${doc.specialty.substring(0, 3).toUpperCase()}-${Math.floor(10 + Math.random() * 90)}`;
    const newApt: Appointment = {
      id: 'apt_' + Date.now(),
      patientId: 1,
      patientName: 'Raj Kumar',
      patientAge: 68,
      patientCondition: 'Type 2 Diabetes & Hypertension',
      patientContact: '+91 98765 43210',
      doctorName: doc.name,
      doctorSpecialty: doc.specialty,
      hospitalName: doc.hospital,
      date: bookDate,
      time: bookTime,
      status: 'confirmed',
      type: bookType,
      reason: bookReason.trim() || 'General Consultation & Follow-up',
      symptoms: bookSymptoms.trim() || undefined,
      tokenNumber,
      videoLink: bookType === 'video' ? `https://meditrack.ai/telehealth/session-${Date.now()}` : undefined,
      preparationNotes: bookType === 'video'
        ? 'Test your camera and microphone 5 minutes prior to session.'
        : 'Please bring your previous prescription slips and latest lab results.',
    };

    onBookAppointment(newApt);
    setIsBookModalOpen(false);
    setBookReason('');
    setBookSymptoms('');
    showToast(`✓ Appointment booked with ${doc.name} (Token #${tokenNumber})`, 'success');
  };

  const handleSaveReschedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reschedulingApt || !rescheduleDate) return;

    onRescheduleAppointment(reschedulingApt.id, rescheduleDate, rescheduleTime);
    setReschedulingApt(null);
    showToast(`Appointment rescheduled to ${rescheduleDate} at ${rescheduleTime}`, 'success');
  };

  const handleDownloadCalendarEvent = (apt: Appointment) => {
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//MediTrack AI//Doctor Appointment//EN
BEGIN:VEVENT
SUMMARY:Doctor Appointment with ${apt.doctorName} (${apt.doctorSpecialty})
DESCRIPTION:Reason: ${apt.reason}\\nToken: ${apt.tokenNumber || 'N/A'}\\nHospital: ${apt.hospitalName}
LOCATION:${apt.hospitalName}
DTSTART:${apt.date.replace(/-/g, '')}T090000Z
DTEND:${apt.date.replace(/-/g, '')}T100000Z
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Appointment_${apt.doctorName.replace(/\s+/g, '_')}_${apt.date}.ics`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('📅 Appointment added to calendar file (.ics)', 'success');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-700 via-cyan-700 to-blue-800 rounded-3xl p-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl shadow-teal-500/15">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
              Clinical Tele-Health & Clinic Visits
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tight">Doctor Appointments & Consultations 🩺</h2>
          <p className="text-xs text-teal-100 mt-1 max-w-xl">
            Book visits with your physicians, join encrypted video consultations, and access official doctor prescriptions.
          </p>
        </div>
        <button
          onClick={() => handleOpenBooking()}
          className="py-3 px-5 bg-white text-slate-900 hover:bg-teal-50 font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto transform hover:scale-105"
        >
          <Plus className="w-4 h-4 text-teal-600" /> Book New Appointment
        </button>
      </div>

      {/* Next Upcoming Appointment Highlight Card */}
      {nextAppointment && (
        <div className="bg-white dark:bg-slate-900 border border-teal-500/40 rounded-3xl p-6 shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-600 to-cyan-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-teal-500/20">
                🩺
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300 px-2.5 py-0.5 rounded-full">
                    Next Upcoming Visit
                  </span>
                  <span className="text-[11px] font-bold text-slate-400">
                    Token: <strong className="text-slate-900 dark:text-white">{nextAppointment.tokenNumber || 'CONFIRMED'}</strong>
                  </span>
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">
                  {nextAppointment.doctorName}
                </h3>
                <p className="text-xs text-teal-600 dark:text-teal-400 font-semibold">
                  {nextAppointment.doctorSpecialty}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {nextAppointment.type === 'video' ? (
                <button
                  onClick={() => setActiveVideoApt(nextAppointment)}
                  className="flex-1 md:flex-none py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md shadow-teal-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Video className="w-4 h-4" /> Join Video Consultation
                </button>
              ) : (
                <div className="flex-1 md:flex-none py-2 px-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-teal-500" /> In-Clinic Visit ({nextAppointment.roomNumber || 'Room 304'})
                </div>
              )}

              <button
                onClick={() => handleDownloadCalendarEvent(nextAppointment)}
                className="py-2.5 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                title="Add to Google/Apple Calendar"
              >
                <Calendar className="w-4 h-4 text-blue-500" /> Add to Calendar
              </button>
            </div>
          </div>

          {/* Details Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-xs">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <Calendar className="w-4 h-4 text-teal-500" />
              <span>Date: <strong className="text-slate-900 dark:text-white">{nextAppointment.date}</strong></span>
            </div>
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <Clock className="w-4 h-4 text-teal-500" />
              <span>Time: <strong className="text-slate-900 dark:text-white">{nextAppointment.time}</strong></span>
            </div>
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <MapPin className="w-4 h-4 text-teal-500" />
              <span className="truncate">{nextAppointment.hospitalName}</span>
            </div>
          </div>

          {nextAppointment.preparationNotes && (
            <div className="mt-4 p-3 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/60 rounded-xl text-xs text-teal-900 dark:text-teal-200 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
              <div>
                <strong>Appointment Preparation Advisory:</strong> {nextAppointment.preparationNotes}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`py-2 px-4 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'upcoming'
                ? 'bg-teal-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            Upcoming Visits ({upcomingAppointments.length})
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`py-2 px-4 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'past'
                ? 'bg-teal-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            Past & Prescriptions ({pastAppointments.length})
          </button>
          <button
            onClick={() => setActiveTab('doctors')}
            className={`py-2 px-4 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'doctors'
                ? 'bg-teal-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            Doctor Directory ({AVAILABLE_DOCTORS.length})
          </button>
        </div>

        <button
          onClick={() => handleOpenBooking()}
          className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> Book Appointment
        </button>
      </div>

      {/* TAB 1: UPCOMING APPOINTMENTS */}
      {activeTab === 'upcoming' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {upcomingAppointments.length === 0 ? (
            <div className="col-span-2 text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8">
              <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">No Upcoming Appointments</h4>
              <p className="text-xs text-slate-500 mt-1">
                You are all caught up with your scheduled clinical consultations.
              </p>
              <button
                onClick={() => handleOpenBooking()}
                className="mt-4 py-2.5 px-5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md"
              >
                Schedule a Consultation
              </button>
            </div>
          ) : (
            upcomingAppointments.map((apt) => {
              const isVideo = apt.type === 'video';

              return (
                <div
                  key={apt.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-500/50 rounded-2xl p-5 shadow-sm transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-teal-500 to-cyan-500 flex items-center justify-center text-white font-bold text-lg shadow-md">
                          👨‍⚕️
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white">{apt.doctorName}</h4>
                          <span className="text-xs text-teal-600 dark:text-teal-400 font-semibold block">
                            {apt.doctorSpecialty}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                          isVideo
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300'
                        }`}>
                          {isVideo ? '📹 Tele-Health' : '🏥 Clinic Visit'}
                        </span>
                        {apt.tokenNumber && (
                          <span className="text-[10px] font-mono font-bold text-slate-400">
                            #{apt.tokenNumber}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Reason */}
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs space-y-1 mb-3">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Reason:</span>
                        <strong className="text-slate-800 dark:text-slate-200 text-right">{apt.reason}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Location:</span>
                        <span className="text-slate-700 dark:text-slate-300 truncate max-w-[200px]">{apt.hospitalName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Schedule:</span>
                        <strong className="text-teal-600 dark:text-teal-400">{apt.date} • {apt.time}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 text-xs">
                    {isVideo ? (
                      <button
                        onClick={() => setActiveVideoApt(apt)}
                        className="flex-1 py-2 px-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                      >
                        <Video className="w-3.5 h-3.5" /> Join Video Call
                      </button>
                    ) : (
                      <button
                        onClick={() => handleDownloadCalendarEvent(apt)}
                        className="flex-1 py-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Calendar className="w-3.5 h-3.5 text-blue-500" /> Add to Calendar
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setReschedulingApt(apt);
                        setRescheduleDate(apt.date);
                        setRescheduleTime(apt.time);
                      }}
                      className="py-2 px-3 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
                    >
                      Reschedule
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`Are you sure you want to cancel appointment with ${apt.doctorName}?`)) {
                          onCancelAppointment(apt.id);
                        }
                      }}
                      className="py-2 px-2.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl font-bold cursor-pointer"
                      title="Cancel Appointment"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 2: PAST APPOINTMENTS & PRESCRIPTIONS */}
      {activeTab === 'past' && (
        <div className="space-y-4">
          {pastAppointments.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8">
              <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">No Past Consultations Recorded</h4>
              <p className="text-xs text-slate-500 mt-1">
                Completed visits and doctor clinical summaries will appear here.
              </p>
            </div>
          ) : (
            pastAppointments.map((apt) => (
              <div
                key={apt.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-lg">
                      📋
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">{apt.doctorName}</h4>
                      <span className="text-xs text-slate-500">{apt.doctorSpecialty} • {apt.hospitalName}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">{apt.date}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      apt.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300'
                    }`}>
                      {apt.status === 'completed' ? '✓ Completed' : 'Cancelled'}
                    </span>
                  </div>
                </div>

                {apt.doctorNotes && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs space-y-1">
                    <strong className="text-teal-700 dark:text-teal-300 block font-bold">
                      Doctor Clinical Notes & Findings:
                    </strong>
                    <p className="text-slate-700 dark:text-slate-300">{apt.doctorNotes}</p>
                    {apt.prescriptionSummary && (
                      <div className="pt-2 mt-2 border-t border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                        <strong className="text-slate-900 dark:text-white">Prescriptions Adjusted:</strong> {apt.prescriptionSummary}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 3: DOCTOR DIRECTORY */}
      {activeTab === 'doctors' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {AVAILABLE_DOCTORS.map((doc) => (
            <div
              key={doc.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start gap-3.5 mb-3">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${doc.avatarColor} flex items-center justify-center text-white text-2xl font-bold shadow-md`}>
                    👨‍⚕️
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">{doc.name}</h4>
                      <span className="text-xs text-amber-500 font-bold flex items-center gap-0.5">
                        <Star className="w-3 h-3 fill-amber-400" /> {doc.rating}
                      </span>
                    </div>
                    <span className="text-xs text-teal-600 dark:text-teal-400 font-semibold block">
                      {doc.specialty}
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      {doc.experience} • {doc.hospital}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                  <div>
                    <span className="text-slate-400 block">Available Days:</span>
                    <strong className="text-slate-800 dark:text-slate-200">{doc.availableDays.join(', ')}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Consultation Fee:</span>
                    <strong className="text-emerald-600 font-bold">{doc.consultationFee}</strong>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleOpenBooking(doc)}
                className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <Calendar className="w-3.5 h-3.5" /> Book Consultation with {doc.name.split(' ')[1]}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* BOOK APPOINTMENT MODAL */}
      {isBookModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-700 p-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl shadow-inner">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Book Doctor Appointment</h3>
                  <p className="text-xs text-teal-100">Schedule clinical visit or tele-health video session</p>
                </div>
              </div>
              <button
                onClick={() => setIsBookModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleBookSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Doctor selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Select Specialist Doctor *
                </label>
                <select
                  value={bookDoctorId}
                  onChange={(e) => setBookDoctorId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {AVAILABLE_DOCTORS.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} — {d.specialty} ({d.hospital})
                    </option>
                  ))}
                </select>
              </div>

              {/* Consultation Type Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Consultation Mode
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setBookType('in_person')}
                    className={`p-3 rounded-xl border text-left transition-all flex items-center gap-2.5 ${
                      bookType === 'in_person'
                        ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-500 text-teal-900 dark:text-teal-200 ring-2 ring-teal-500/20'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <MapPin className="w-4 h-4 text-teal-600" />
                    <div>
                      <strong className="block text-xs font-bold">In-Person Clinic</strong>
                      <span className="text-[10px] opacity-75">Hospital visit</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBookType('video')}
                    className={`p-3 rounded-xl border text-left transition-all flex items-center gap-2.5 ${
                      bookType === 'video'
                        ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-500 text-teal-900 dark:text-teal-200 ring-2 ring-teal-500/20'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Video className="w-4 h-4 text-teal-600" />
                    <div>
                      <strong className="block text-xs font-bold">Tele-Health Video</strong>
                      <span className="text-[10px] opacity-75">Online call</span>
                    </div>
                  </button>
                </div>
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
                    value={bookDate}
                    onChange={(e) => setBookDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Time Slot *
                  </label>
                  <select
                    value={bookTime}
                    onChange={(e) => setBookTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="09:30 AM">09:30 AM (Morning Slot)</option>
                    <option value="10:30 AM">10:30 AM (Morning Slot)</option>
                    <option value="11:45 AM">11:45 AM (Late Morning)</option>
                    <option value="02:00 PM">02:00 PM (Afternoon)</option>
                    <option value="04:00 PM">04:00 PM (Evening)</option>
                    <option value="05:30 PM">05:30 PM (Evening)</option>
                  </select>
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Reason for Visit *
                </label>
                <input
                  type="text"
                  required
                  value={bookReason}
                  onChange={(e) => setBookReason(e.target.value)}
                  placeholder="e.g. Quarterly HbA1c review, blood pressure check"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Symptoms */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Current Symptoms or Health Changes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={bookSymptoms}
                  onChange={(e) => setBookSymptoms(e.target.value)}
                  placeholder="Describe any symptoms, fatigue, dizziness, or medication side effects..."
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsBookModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md shadow-teal-500/25 cursor-pointer"
                >
                  Confirm & Generate Token
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESCHEDULE MODAL */}
      {reschedulingApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-teal-600" /> Reschedule Appointment
            </h3>
            <p className="text-xs text-slate-500">
              Rescheduling appointment with <strong>{reschedulingApt.doctorName}</strong>.
            </p>

            <form onSubmit={handleSaveReschedule} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  New Date
                </label>
                <input
                  type="date"
                  required
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  New Time Slot
                </label>
                <select
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs"
                >
                  <option value="09:30 AM">09:30 AM</option>
                  <option value="10:30 AM">10:30 AM</option>
                  <option value="11:45 AM">11:45 AM</option>
                  <option value="02:00 PM">02:00 PM</option>
                  <option value="04:00 PM">04:00 PM</option>
                  <option value="05:30 PM">05:30 PM</option>
                </select>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setReschedulingApt(null)}
                  className="flex-1 py-2 border rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold"
                >
                  Save Reschedule
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
        userRole="patient"
        showToast={showToast}
      />
    </div>
  );
};

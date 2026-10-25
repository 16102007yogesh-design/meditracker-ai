import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Trash2, 
  Edit, 
  FileText, 
  Phone, 
  Mail, 
  AlertCircle, 
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Pill,
  Clock
} from 'lucide-react';
import { PatientRecord, Medicine } from '../../types';
import { AddMedicineModal } from '../patient/AddMedicineModal';

interface PatientDatabaseViewProps {
  patients: PatientRecord[];
  onSavePatient: (patient: PatientRecord) => void;
  onDeletePatient: (id: number) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onAddMedicineToPatient?: (patientId: number, newMed: Omit<Medicine, 'id'>) => void;
  onDeleteMedicineFromPatient?: (patientId: number, medId: number) => void;
}

export const PatientDatabaseView: React.FC<PatientDatabaseViewProps> = ({
  patients,
  onSavePatient,
  onDeletePatient,
  showToast,
  onAddMedicineToPatient,
  onDeleteMedicineFromPatient,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<PatientRecord | null>(null);
  const [selectedPatientForMeds, setSelectedPatientForMeds] = useState<PatientRecord | null>(null);
  const [isAddMedModalOpen, setIsAddMedModalOpen] = useState(false);

  const currentMedsPatient = selectedPatientForMeds
    ? (patients.find((p) => p.id === selectedPatientForMeds.id) || selectedPatientForMeds)
    : null;

  // Form states
  const [formName, setFormName] = useState('');
  const [formAge, setFormAge] = useState('');
  const [formGender, setFormGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [formCondition, setFormCondition] = useState('');
  const [formContact, setFormContact] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formEmergency, setFormEmergency] = useState('');
  const [formStatus, setFormStatus] = useState<'active' | 'review' | 'critical' | 'inactive'>('active');
  const [formNotes, setFormNotes] = useState('');

  const openAddModal = () => {
    setEditingPatient(null);
    setFormName('');
    setFormAge('');
    setFormGender('Male');
    setFormCondition('');
    setFormContact('');
    setFormEmail('');
    setFormEmergency('');
    setFormStatus('active');
    setFormNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (p: PatientRecord) => {
    setEditingPatient(p);
    setFormName(p.name);
    setFormAge(p.age.toString());
    setFormGender(p.gender);
    setFormCondition(p.condition);
    setFormContact(p.contact);
    setFormEmail(p.email);
    setFormEmergency(p.emergency);
    setFormStatus(p.status);
    setFormNotes(p.notes);
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formCondition.trim()) {
      showToast('Please fill all required fields.', 'error');
      return;
    }

    if (editingPatient) {
      const updated: PatientRecord = {
        ...editingPatient,
        name: formName.trim(),
        age: parseInt(formAge) || 50,
        gender: formGender,
        condition: formCondition.trim(),
        contact: formContact.trim(),
        email: formEmail.trim(),
        emergency: formEmergency.trim(),
        status: formStatus,
        notes: formNotes.trim(),
      };
      onSavePatient(updated);
      showToast(`Updated profile for ${updated.name}`, 'success');
    } else {
      const newPatient: PatientRecord = {
        id: Date.now(),
        name: formName.trim(),
        age: parseInt(formAge) || 50,
        gender: formGender,
        condition: formCondition.trim(),
        contact: formContact.trim(),
        email: formEmail.trim(),
        emergency: formEmergency.trim(),
        status: formStatus,
        notes: formNotes.trim(),
        createdDate: new Date().toISOString(),
        medicines: [],
        adherenceRate: 85,
        streakDays: 3,
        todayDosesTotal: 2,
        todayDosesTaken: 1,
        trend: 'improving',
        lastVisit: 'Today',
        riskScore: 20,
        recoveryStage: 'Initial Evaluation',
      };
      onSavePatient(newPatient);
      showToast(`Enrolled new patient: ${newPatient.name}`, 'success');
    }

    setIsModalOpen(false);
  };

  const exportCSV = () => {
    const headers = ['ID,Name,Age,Gender,Condition,Contact,Email,Status,Adherence,Streak'];
    const rows = patients.map((p) =>
      `"${p.id}","${p.name}","${p.age}","${p.gender}","${p.condition}","${p.contact}","${p.email}","${p.status}","${p.adherenceRate}%","${p.streakDays} days"`
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `MediTrack_Patients_Database_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Downloaded patient database CSV', 'success');
  };

  const filtered = patients.filter((p) => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.condition.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-cyan-700 rounded-3xl p-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg shadow-blue-500/20">
        <div>
          <h2 className="text-2xl font-black tracking-tight">Patient Directory & Clinical Records 👥</h2>
          <p className="text-xs text-blue-100 mt-1">
            Centralized health records, adherence rates, and next-of-kin contact management
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={exportCSV}
            className="py-2.5 px-3.5 bg-white/15 hover:bg-white/25 backdrop-blur-md text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button
            onClick={openAddModal}
            className="py-2.5 px-4 bg-white text-blue-800 hover:bg-blue-50 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Patient
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by patient name, diagnosis, or email..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(['all', 'active', 'review', 'critical'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`text-xs font-bold px-3 py-1.5 rounded-xl capitalize transition-all cursor-pointer ${
                statusFilter === filter
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Patient Name</th>
                <th className="py-3.5 px-4">Age / Gender</th>
                <th className="py-3.5 px-4">Primary Condition</th>
                <th className="py-3.5 px-4">Prescribed Tablets</th>
                <th className="py-3.5 px-4">Adherence Rate</th>
                <th className="py-3.5 px-4">Emergency Contact</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filtered.map((patient) => {
                const initials = patient.name.split(' ').map((n) => n[0]).join('');

                return (
                  <tr key={patient.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center text-xs">
                          {initials}
                        </div>
                        <div>
                          <strong className="text-slate-900 dark:text-white font-bold block">{patient.name}</strong>
                          <span className="text-[11px] text-slate-400">{patient.contact}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-medium">{patient.age} yrs</span>
                      <span className="text-[10px] text-slate-400 block">{patient.gender}</span>
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      {patient.condition}
                    </td>

                    {/* Prescribed Tablets Pill Badge */}
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => setSelectedPatientForMeds(patient)}
                        className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold text-xs rounded-xl border border-blue-200 dark:border-blue-800 transition-colors cursor-pointer"
                        title="View and manage prescribed tablets"
                      >
                        <Pill className="w-3.5 h-3.5 text-blue-500" />
                        <span>{patient.medicines.length} Tablets</span>
                      </button>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              patient.adherenceRate >= 85 ? 'bg-emerald-500' : patient.adherenceRate >= 65 ? 'bg-amber-500' : 'bg-rose-500'
                            }`}
                            style={{ width: `${patient.adherenceRate}%` }}
                          />
                        </div>
                        <span className="font-black text-slate-900 dark:text-white">{patient.adherenceRate}%</span>
                      </div>
                      <span className="text-[10px] text-amber-600 font-medium">{patient.streakDays}d streak 🔥</span>
                    </td>

                    <td className="py-3.5 px-4 text-[11px] text-slate-500 max-w-xs truncate">
                      {patient.emergency}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        patient.status === 'critical'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300'
                          : patient.status === 'review'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                      }`}>
                        {patient.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedPatientForMeds(patient)}
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition-colors cursor-pointer"
                          title="Prescribe & Manage Tablets"
                        >
                          <Pill className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(patient)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition-colors cursor-pointer"
                          title="Edit Patient"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Are you sure you want to remove ${patient.name}?`)) {
                              onDeletePatient(patient.id);
                            }
                          }}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Patient"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Patient Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white flex items-center justify-between">
              <h3 className="text-lg font-bold">
                {editingPatient ? 'Edit Patient Profile' : 'Enroll New Patient'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Ramesh Chandra"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Age
                  </label>
                  <input
                    type="number"
                    value={formAge}
                    onChange={(e) => setFormAge(e.target.value)}
                    placeholder="65"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Gender
                  </label>
                  <select
                    value={formGender}
                    onChange={(e) => setFormGender(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Primary Medical Condition *
                </label>
                <input
                  type="text"
                  required
                  value={formCondition}
                  onChange={(e) => setFormCondition(e.target.value)}
                  placeholder="e.g. Type 2 Diabetes, Cardiac Rehabilitation"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Phone Contact
                  </label>
                  <input
                    type="tel"
                    value={formContact}
                    onChange={(e) => setFormContact(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Clinical Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">Active (Stable)</option>
                    <option value="review">Needs Review</option>
                    <option value="critical">Critical / High Risk</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Emergency Contact (Name & Relationship & Phone)
                </label>
                <input
                  type="text"
                  value={formEmergency}
                  onChange={(e) => setFormEmergency(e.target.value)}
                  placeholder="e.g. Priya Kumar (Daughter) - +91 98765 54321"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Clinical History & Progress Notes
                </label>
                <textarea
                  rows={3}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Additional patient notes, allergy info, or special diet..."
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/25 cursor-pointer"
                >
                  {editingPatient ? 'Save Changes' : 'Enroll Patient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Patient Medication Database & Prescriptions Modal */}
      {currentMedsPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-cyan-700 p-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl shadow-inner font-black">
                  💊
                </div>
                <div>
                  <h3 className="text-xl font-bold">{currentMedsPatient.name} — Prescribed Tablets Database</h3>
                  <p className="text-xs text-blue-100">
                    {currentMedsPatient.age}y • {currentMedsPatient.condition} • {currentMedsPatient.medicines.length} Prescriptions Synced
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPatientForMeds(null)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4 overflow-y-auto">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                    Active Regimen Database
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Tablets added here automatically appear in patient's login & daily doses
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddMedModalOpen(true)}
                  className="py-2 px-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Prescribe Tablet
                </button>
              </div>

              {currentMedsPatient.medicines.length === 0 ? (
                <div className="p-8 text-center text-slate-400 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 space-y-2">
                  <Pill className="w-8 h-8 mx-auto text-slate-400 opacity-60" />
                  <p className="text-xs font-semibold">No tablets currently in {currentMedsPatient.name}'s regimen.</p>
                  <button
                    onClick={() => setIsAddMedModalOpen(true)}
                    className="py-1.5 px-3 bg-blue-600 text-white font-bold text-xs rounded-xl"
                  >
                    + Prescribe First Tablet
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {currentMedsPatient.medicines.map((med) => (
                    <div
                      key={med.id}
                      className="p-3.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-between text-xs hover:border-blue-400 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 flex items-center justify-center text-sm font-bold">
                          💊
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <strong className="text-slate-900 dark:text-white font-bold text-sm">{med.name}</strong>
                            <span className="text-[10px] bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300 px-2 py-0.5 rounded-full font-bold">
                              {med.dose}
                            </span>
                            <span className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full capitalize">
                              {med.timeSlot}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              {med.time} ({med.frequency})
                            </span>
                            {med.instructions && (
                              <span>• {med.instructions}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            med.status === 'taken' 
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300' 
                              : med.status === 'missed' 
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300' 
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300'
                          }`}>
                            {med.status.toUpperCase()}
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5 font-medium">{med.stock} tablets left</span>
                        </div>
                        {onDeleteMedicineFromPatient && (
                          <button
                            onClick={() => {
                              if (confirm(`Remove ${med.name} from ${currentMedsPatient.name}'s regimen?`)) {
                                onDeleteMedicineFromPatient(currentMedsPatient.id, med.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                            title="Delete prescription"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Synced with Patient ID #{currentMedsPatient.id}
              </span>
              <button
                onClick={() => setSelectedPatientForMeds(null)}
                className="py-2 px-4 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs hover:bg-slate-300 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Tablet Modal */}
      {isAddMedModalOpen && currentMedsPatient && (
        <AddMedicineModal
          isOpen={isAddMedModalOpen}
          onClose={() => setIsAddMedModalOpen(false)}
          targetPatientName={currentMedsPatient.name}
          currentMedications={currentMedsPatient.medicines || []}
          patientCondition={currentMedsPatient.condition}
          onAdd={(newMed) => {
            onAddMedicineToPatient?.(currentMedsPatient.id, newMed);
            setIsAddMedModalOpen(false);
          }}
          showToast={showToast}
        />
      )}
    </div>
  );
};

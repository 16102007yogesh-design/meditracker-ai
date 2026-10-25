import React, { useState, useEffect } from 'react';
import { 
  Pill, 
  HeartHandshake, 
  Home, 
  Camera, 
  BarChart2, 
  Users, 
  TrendingUp, 
  Settings as SettingsIcon, 
  LogOut, 
  Moon, 
  Sun, 
  Bell, 
  Menu, 
  X,
  Plus,
  Calendar,
  Stethoscope,
  Mic,
  Sparkles,
  GraduationCap,
  FileText
} from 'lucide-react';
import { 
  UserAccount, 
  UserRole, 
  Medicine, 
  PatientRecord, 
  DailyAdherencePoint, 
  AlertNotification,
  Appointment,
  AppointmentStatus
} from './types';
import { 
  DEMO_ACCOUNTS, 
  INITIAL_PATIENT_MEDICINES, 
  INITIAL_PATIENTS, 
  INITIAL_DAILY_ADHERENCE, 
  INITIAL_ALERTS,
  INITIAL_APPOINTMENTS
} from './data/initialData';

// Component imports
import { AuthShell } from './components/auth/AuthShell';
import { PatientProgressOverview } from './components/patient/PatientProgressOverview';
import { MedicineList } from './components/patient/MedicineList';
import { AddMedicineModal } from './components/patient/AddMedicineModal';
import { PatientAppointmentsView } from './components/patient/PatientAppointmentsView';
import { CaregiverProgressOverview } from './components/caregiver/CaregiverProgressOverview';
import { DoctorAppointmentsScheduleView } from './components/caregiver/DoctorAppointmentsScheduleView';
import { PatientDatabaseView } from './components/caregiver/PatientDatabaseView';
import { AnalyticsView } from './components/caregiver/AnalyticsView';
import { SimpleHealthCharts } from './components/shared/SimpleHealthCharts';
import { ReportsView } from './components/shared/ReportsView';
import { ScannerModal } from './components/shared/ScannerModal';
import { SettingsView } from './components/shared/SettingsView';
import { NotificationModal } from './components/shared/NotificationModal';
import { VoiceAssistantModal } from './components/shared/VoiceAssistantModal';
import { ProjectReportModal } from './components/shared/ProjectReportModal';
import { 
  subscribeToMedicines, 
  saveMedicineToFirestore, 
  deleteMedicineFromFirestore, 
  seedInitialMedicinesIfEmpty,
  savePatientToFirestore,
  seedInitialPatientsIfEmpty,
  logAdherenceEvent
} from './lib/firebase';

export default function App() {
  // 1. Current Authentication State
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    const saved = localStorage.getItem('meditrack_currentUser');
    return saved ? JSON.parse(saved) : null;
  });

  // 2. Registered Accounts List
  const [registeredAccounts, setRegisteredAccounts] = useState<UserAccount[]>(() => {
    const saved = localStorage.getItem('meditrack_accounts');
    return saved ? JSON.parse(saved) : DEMO_ACCOUNTS;
  });

  // 3. Medicines State
  const [medicines, setMedicines] = useState<Medicine[]>(() => {
    const saved = localStorage.getItem('meditrack_medicines');
    return saved ? JSON.parse(saved) : INITIAL_PATIENT_MEDICINES;
  });

  // 4. Patients Database State
  const [patients, setPatients] = useState<PatientRecord[]>(() => {
    const saved = localStorage.getItem('meditrack_patients');
    return saved ? JSON.parse(saved) : INITIAL_PATIENTS;
  });

  // 5. Daily Adherence State
  const [dailyHistory, setDailyHistory] = useState<DailyAdherencePoint[]>(() => {
    const saved = localStorage.getItem('meditrack_daily_adherence');
    return saved ? JSON.parse(saved) : INITIAL_DAILY_ADHERENCE;
  });

  // 6. Notifications State
  const [alerts, setAlerts] = useState<AlertNotification[]>(() => {
    const saved = localStorage.getItem('meditrack_alerts');
    return saved ? JSON.parse(saved) : INITIAL_ALERTS;
  });

  // 7. Appointments State
  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    const saved = localStorage.getItem('meditrack_appointments');
    return saved ? JSON.parse(saved) : INITIAL_APPOINTMENTS;
  });

  // 8. Streak Count
  const [streakDays, setStreakDays] = useState<number>(12);

  // 9. Navigation & UI state
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isAddMedOpen, setIsAddMedOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isProjectReportOpen, setIsProjectReportOpen] = useState(false);

  // 10. Theme State
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('meditrack_dark') === 'true';
  });

  // 11. Toast Feedback State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Real-time Firestore sync & initial seeding
  useEffect(() => {
    seedInitialMedicinesIfEmpty(INITIAL_PATIENT_MEDICINES);
    seedInitialPatientsIfEmpty(INITIAL_PATIENTS);

    const unsubscribe = subscribeToMedicines((remoteMeds) => {
      if (remoteMeds && remoteMeds.length > 0) {
        setMedicines(remoteMeds);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Sync to LocalStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('meditrack_currentUser', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('meditrack_currentUser');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('meditrack_accounts', JSON.stringify(registeredAccounts));
  }, [registeredAccounts]);

  useEffect(() => {
    localStorage.setItem('meditrack_medicines', JSON.stringify(medicines));
  }, [medicines]);

  useEffect(() => {
    localStorage.setItem('meditrack_patients', JSON.stringify(patients));
  }, [patients]);

  useEffect(() => {
    localStorage.setItem('meditrack_appointments', JSON.stringify(appointments));
  }, [appointments]);

  useEffect(() => {
    localStorage.setItem('meditrack_dark', isDarkMode.toString());
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Toast trigger helper
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3200);
  };

  // Sync active medicines when switching to a patient account or when patient database updates
  useEffect(() => {
    if (currentUser?.role === 'patient') {
      const match = patients.find(
        (p) =>
          p.email.toLowerCase() === currentUser.email.toLowerCase() ||
          p.name.toLowerCase() === currentUser.name.toLowerCase() ||
          (currentUser.id === 'demo-patient' && p.id === 1)
      );
      if (match && match.medicines) {
        setMedicines(match.medicines);
      }
    }
  }, [currentUser?.id, currentUser?.email, patients]);

  // Medicine Actions with two-way sync to patient database
  const handleTakeDose = (id: number) => {
    let takenMedName = '';
    const updatedMeds = medicines.map((m) => {
      if (m.id === id) {
        takenMedName = m.name;
        const newStock = Math.max(0, m.stock - m.perDose);
        return { ...m, status: 'taken' as const, stock: newStock, lastTakenAt: 'Just now' };
      }
      return m;
    });

    setMedicines(updatedMeds);

    // Save dose update to Firestore database
    const targetMed = medicines.find((m) => m.id === id);
    if (targetMed) {
      saveMedicineToFirestore({
        ...targetMed,
        status: 'taken',
        stock: Math.max(0, targetMed.stock - targetMed.perDose),
        lastTakenAt: 'Just now',
      });
      logAdherenceEvent({
        medicineId: id,
        medicineName: targetMed.name,
        patientId: currentUser?.id || 1,
        status: 'taken',
      });
    }

    // Synchronize to the patient database record
    setPatients((prev) =>
      prev.map((p) => {
        const isCurrentPatient =
          currentUser?.role === 'patient' &&
          (p.email.toLowerCase() === currentUser.email.toLowerCase() ||
            p.name.toLowerCase() === currentUser.name.toLowerCase() ||
            (currentUser.id === 'demo-patient' && p.id === 1));

        if (isCurrentPatient) {
          const medList = p.medicines.map((m) => {
            if (m.id === id) {
              const newStock = Math.max(0, m.stock - m.perDose);
              return { ...m, status: 'taken' as const, stock: newStock, lastTakenAt: 'Just now' };
            }
            return m;
          });
          const totalDoses = medList.length;
          const takenCount = medList.filter((m) => m.status === 'taken').length;
          const newAdherence = totalDoses > 0 ? Math.round((takenCount / totalDoses) * 100) : p.adherenceRate;
          return {
            ...p,
            medicines: medList,
            todayDosesTaken: takenCount,
            todayDosesTotal: totalDoses,
            adherenceRate: newAdherence,
          };
        }
        return p;
      })
    );

    // Increment today's adherence count
    setDailyHistory((prev) => {
      const updated = [...prev];
      const today = updated[updated.length - 1];
      if (today) {
        today.dosesTaken = Math.min(today.totalDoses, today.dosesTaken + 1);
        today.adherence = Math.round((today.dosesTaken / today.totalDoses) * 100);
      }
      return updated;
    });

    showToast(`✓ Marked ${takenMedName || 'dose'} as taken! Synced to Caregiver database.`, 'success');
  };

  const handleMissDose = (id: number) => {
    let missedName = '';
    const updatedMeds = medicines.map((m) => {
      if (m.id === id) {
        missedName = m.name;
        return { ...m, status: 'missed' as const };
      }
      return m;
    });

    setMedicines(updatedMeds);

    // Sync to patient record in database
    setPatients((prev) =>
      prev.map((p) => {
        const isCurrentPatient =
          currentUser?.role === 'patient' &&
          (p.email.toLowerCase() === currentUser.email.toLowerCase() ||
            p.name.toLowerCase() === currentUser.name.toLowerCase() ||
            (currentUser.id === 'demo-patient' && p.id === 1));

        if (isCurrentPatient) {
          const medList = p.medicines.map((m) =>
            m.id === id ? { ...m, status: 'missed' as const } : m
          );
          return { ...p, medicines: medList };
        }
        return p;
      })
    );

    // Add alert notification
    const newAlert: AlertNotification = {
      id: 'alt_' + Date.now(),
      type: 'danger',
      title: 'Missed Dose Warning',
      message: `${missedName} was marked as missed. Caregiver notification generated.`,
      time: 'Just now',
      read: false,
      patientName: currentUser?.name || 'Patient',
    };
    setAlerts((prev) => [newAlert, ...prev]);

    showToast(`🚨 ${missedName} recorded as missed. Caregiver alert triggered.`, 'error');
  };

  const handleUndoDose = (id: number) => {
    setMedicines((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status: 'pending' as const } : m))
    );

    setPatients((prev) =>
      prev.map((p) => {
        const isCurrentPatient =
          currentUser?.role === 'patient' &&
          (p.email.toLowerCase() === currentUser.email.toLowerCase() ||
            p.name.toLowerCase() === currentUser.name.toLowerCase() ||
            (currentUser.id === 'demo-patient' && p.id === 1));

        if (isCurrentPatient) {
          const medList = p.medicines.map((m) =>
            m.id === id ? { ...m, status: 'pending' as const } : m
          );
          const totalDoses = medList.length;
          const takenCount = medList.filter((m) => m.status === 'taken').length;
          const newAdherence = totalDoses > 0 ? Math.round((takenCount / totalDoses) * 100) : p.adherenceRate;
          return {
            ...p,
            medicines: medList,
            todayDosesTaken: takenCount,
            todayDosesTotal: totalDoses,
            adherenceRate: newAdherence,
          };
        }
        return p;
      })
    );

    showToast('Dose reset to pending status.', 'info');
  };

  const handleAddMedicine = (newMed: Omit<Medicine, 'id'>) => {
    const created: Medicine = {
      ...newMed,
      id: Date.now(),
    };
    setMedicines((prev) => [...prev, created]);
    // Save to Firestore Database for instant 2-way cloud sync
    saveMedicineToFirestore(created);

    // Also sync into patient database!
    setPatients((prev) =>
      prev.map((p) => {
        const isCurrentPatient =
          currentUser?.role === 'patient' &&
          (p.email.toLowerCase() === currentUser.email.toLowerCase() ||
            p.name.toLowerCase() === currentUser.name.toLowerCase() ||
            (currentUser.id === 'demo-patient' && p.id === 1));

        if (isCurrentPatient) {
          const medList = [...p.medicines, created];
          return {
            ...p,
            medicines: medList,
            todayDosesTotal: medList.length,
          };
        }
        return p;
      })
    );

    // If an interaction was flagged, log an alert notification
    if (created.interactionCheck?.hasInteraction) {
      const isCritical = created.interactionCheck.severity === 'severe' || created.interactionCheck.severity === 'contraindicated';
      const interactionAlert: AlertNotification = {
        id: 'alt_ddi_' + Date.now(),
        type: isCritical ? 'danger' : 'warning',
        title: `Drug Interaction Alert: ${created.name}`,
        message: `${created.interactionCheck.summary}${created.interactionCheck.overridden ? ` [Authorized with note: ${created.interactionCheck.overrideReason}]` : ''}`,
        time: 'Just now',
        read: false,
        patientName: currentUser?.name || 'Patient',
      };
      setAlerts((prev) => [interactionAlert, ...prev]);
    }

    showToast(`Added ${created.name} to prescriptions! Synced with Caregiver database.`, 'success');
  };

  const handleDeleteMedicine = (id: number) => {
    setMedicines((prev) => prev.filter((m) => m.id !== id));
    // Remove from Firestore Database
    deleteMedicineFromFirestore(id);

    setPatients((prev) =>
      prev.map((p) => {
        const isCurrentPatient =
          currentUser?.role === 'patient' &&
          (p.email.toLowerCase() === currentUser.email.toLowerCase() ||
            p.name.toLowerCase() === currentUser.name.toLowerCase() ||
            (currentUser.id === 'demo-patient' && p.id === 1));

        if (isCurrentPatient) {
          const medList = p.medicines.filter((m) => m.id !== id);
          return {
            ...p,
            medicines: medList,
            todayDosesTotal: medList.length,
          };
        }
        return p;
      })
    );

    showToast('Medication prescription removed.', 'info');
  };

  // REFILL MEDICINE STOCK (Instant 2-way cloud sync)
  const handleRefillMedicine = (medId: number, count: number = 30) => {
    let refilledName = '';
    setMedicines((prev) =>
      prev.map((m) => {
        if (m.id === medId) {
          refilledName = m.name;
          const updated = { ...m, stock: m.stock + count };
          saveMedicineToFirestore(updated);
          return updated;
        }
        return m;
      })
    );

    setPatients((prev) =>
      prev.map((p) => {
        const hasMed = p.medicines && p.medicines.some((m) => m.id === medId);
        if (hasMed) {
          const updatedMeds = p.medicines.map((m) => (m.id === medId ? { ...m, stock: m.stock + count } : m));
          const updatedPt = { ...p, medicines: updatedMeds };
          savePatientToFirestore(updatedPt);
          return updatedPt;
        }
        return p;
      })
    );

    showToast(`✓ Authorized +${count} pills refill for ${refilledName || 'medicine'}! Inventory updated.`, 'success');
  };

  // CAREGIVER PRESCRIBING TABLET TO PATIENT (Two-Way Synchronization)
  const handleAddMedicineToPatient = (patientId: number, newMed: Omit<Medicine, 'id'>) => {
    const created: Medicine = {
      ...newMed,
      id: Date.now(),
    };

    const targetPatient = patients.find((p) => p.id === patientId);
    const targetPatientName = targetPatient?.name || 'Patient';

    // Save directly to Firestore for real-time 2-way sync across both logins
    saveMedicineToFirestore(created);
    if (targetPatient) {
      savePatientToFirestore({
        ...targetPatient,
        medicines: [...targetPatient.medicines, created],
      });
    }

    setPatients((prev) =>
      prev.map((p) => {
        if (p.id === patientId) {
          const updatedMedicines = [...p.medicines, created];
          const total = updatedMedicines.length;
          const taken = updatedMedicines.filter((m) => m.status === 'taken').length;
          const adherence = total > 0 ? Math.round((taken / total) * 100) : 100;

          return {
            ...p,
            medicines: updatedMedicines,
            todayDosesTotal: total,
            todayDosesTaken: taken,
            adherenceRate: adherence,
          };
        }
        return p;
      })
    );

    // If target patient is currently logged in, or is the primary patient (e.g. Raj Kumar ID #1),
    // sync to active medicines state immediately so both logins reflect the prescription!
    const isTargetCurrentUser =
      patientId === 1 ||
      (currentUser && (
        currentUser.name.toLowerCase() === targetPatientName.toLowerCase() || 
        currentUser.id === 'demo-patient'
      ));

    if (isTargetCurrentUser) {
      setMedicines((prev) => {
        const exists = prev.some((m) => m.name.toLowerCase() === created.name.toLowerCase() && m.dose === created.dose);
        if (!exists) {
          return [...prev, created];
        }
        return prev;
      });
    }

    // Add notification alert
    const newAlert: AlertNotification = {
      id: 'alt_' + Date.now(),
      type: 'info',
      title: 'New Tablet Prescribed',
      message: `${created.name} (${created.dose}) was prescribed for ${targetPatientName}. Synced to both patient and caregiver logins.`,
      time: 'Just now',
      read: false,
      patientName: targetPatientName,
    };
    setAlerts((prev) => [newAlert, ...prev]);

    showToast(
      `✓ Added ${created.name} (${created.dose}) to ${targetPatientName}'s database! Synced to both caregiver and patient logins.`,
      'success'
    );
  };

  const handleDeleteMedicineFromPatient = (patientId: number, medId: number) => {
    const targetPatient = patients.find((p) => p.id === patientId);
    const targetPatientName = targetPatient?.name || 'Patient';

    // Delete from Firestore
    deleteMedicineFromFirestore(medId);

    setPatients((prev) =>
      prev.map((p) => {
        if (p.id === patientId) {
          const updatedMedicines = p.medicines.filter((m) => m.id !== medId);
          const total = updatedMedicines.length;
          const taken = updatedMedicines.filter((m) => m.status === 'taken').length;
          const adherence = total > 0 ? Math.round((taken / total) * 100) : 100;

          return {
            ...p,
            medicines: updatedMedicines,
            todayDosesTotal: total,
            todayDosesTaken: taken,
            adherenceRate: adherence,
          };
        }
        return p;
      })
    );

    const isTargetCurrentUser =
      patientId === 1 ||
      (currentUser && (
        currentUser.name.toLowerCase() === targetPatientName.toLowerCase() || 
        currentUser.id === 'demo-patient'
      ));

    if (isTargetCurrentUser) {
      setMedicines((prev) => prev.filter((m) => m.id !== medId));
    }

    showToast(`Prescription removed from ${targetPatientName}'s record. Synced across both logins.`, 'info');
  };

  // Patient Database Actions (Caregiver)
  const handleSavePatient = (patient: PatientRecord) => {
    setPatients((prev) => {
      const exists = prev.some((p) => p.id === patient.id);
      if (exists) {
        return prev.map((p) => (p.id === patient.id ? patient : p));
      }
      return [patient, ...prev];
    });
  };

  const handleDeletePatient = (id: number) => {
    setPatients((prev) => prev.filter((p) => p.id !== id));
    showToast('Patient record deleted.', 'info');
  };

  // Appointment Actions
  const handleBookAppointment = (newApt: Appointment) => {
    setAppointments((prev) => [newApt, ...prev]);
    const newAlert: AlertNotification = {
      id: 'alt_' + Date.now(),
      type: 'info',
      title: 'Appointment Booked',
      message: `Consultation booked with ${newApt.doctorName} for ${newApt.date} at ${newApt.time} (Token: ${newApt.tokenNumber}).`,
      time: 'Just now',
      read: false,
      patientName: newApt.patientName,
    };
    setAlerts((prev) => [newAlert, ...prev]);
    showToast(`Appointment confirmed! Token: ${newApt.tokenNumber}`, 'success');
  };

  const handleCancelAppointment = (id: string) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'cancelled' } : a))
    );
    showToast('Appointment has been cancelled.', 'info');
  };

  const handleRescheduleAppointment = (id: string, newDate: string, newTime: string) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, date: newDate, time: newTime, status: 'confirmed' } : a))
    );
    showToast('Appointment rescheduled successfully.', 'success');
  };

  const handleUpdateAppointmentStatus = (
    id: string,
    status: AppointmentStatus,
    notes?: string,
    prescriptionSummary?: string
  ) => {
    setAppointments((prev) =>
      prev.map((a) => {
        if (a.id === id) {
          return {
            ...a,
            status,
            doctorNotes: notes !== undefined ? notes : a.doctorNotes,
            prescriptionSummary: prescriptionSummary !== undefined ? prescriptionSummary : a.prescriptionSummary,
          };
        }
        return a;
      })
    );
    showToast(`Consultation updated to status: ${status}.`, 'success');
  };

  // Auth & Account Actions
  const handleRegisterAccount = (newAcc: UserAccount) => {
    setRegisteredAccounts((prev) => [...prev, newAcc]);
    if (newAcc.role === 'patient') {
      const newPatientRecord: PatientRecord = {
        id: Date.now(),
        name: newAcc.name,
        age: typeof newAcc.age === 'number' ? newAcc.age : parseInt(String(newAcc.age || 45), 10) || 45,
        gender: 'Other',
        condition: newAcc.condition || 'General Health & Wellness',
        contact: newAcc.phone || 'N/A',
        email: newAcc.email,
        emergency: newAcc.emergencyContact || 'Emergency Contact Pending',
        status: 'active',
        notes: 'Enrolled via Patient Self-Registration portal.',
        createdDate: new Date().toISOString(),
        medicines: [],
        adherenceRate: 100,
        streakDays: 0,
        todayDosesTotal: 0,
        todayDosesTaken: 0,
        trend: 'stable',
        lastVisit: 'New Patient',
        riskScore: 10,
        recoveryStage: 'New Registration',
      };
      setPatients((prev) => [newPatientRecord, ...prev]);
    }
  };

  const handleUpdateAccountPassword = (email: string, newPass: string) => {
    setRegisteredAccounts((prev) =>
      prev.map((acc) => (acc.email.toLowerCase() === email.toLowerCase() ? { ...acc, password: newPass } : acc))
    );
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentTab('dashboard');
    showToast('You have been logged out securely.', 'info');
  };

  // If user is not logged in, render the Auth portal with full Forgot Password working module
  if (!currentUser) {
    return (
      <div className={isDarkMode ? 'dark' : ''}>
        <AuthShell
          onLoginSuccess={(acc) => setCurrentUser(acc)}
          registeredAccounts={registeredAccounts}
          onRegisterAccount={handleRegisterAccount}
          onUpdateAccountPassword={handleUpdateAccountPassword}
          showToast={showToast}
        />

        {/* Global Toast for Auth */}
        {toast && (
          <div className="fixed bottom-6 right-6 z-50 animate-bounce">
            <div className={`px-4 py-3 rounded-2xl shadow-xl border text-xs font-bold flex items-center gap-2 ${
              toast.type === 'success' ? 'bg-emerald-900 text-emerald-100 border-emerald-700' :
              toast.type === 'error' ? 'bg-rose-900 text-rose-100 border-rose-700' :
              'bg-slate-900 text-white border-slate-700'
            }`}>
              <span>{toast.type === 'success' ? '✓' : toast.type === 'error' ? '✗' : 'ℹ'}</span>
              <span>{toast.message}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  const isCaregiver = currentUser.role === 'caregiver';

  const patientAppointments = appointments.filter(
    (a) => a.patientName === currentUser.name || a.patientId === 1
  );

  const patientUpcoming = patientAppointments
    .filter((a) => a.status === 'confirmed' || a.status === 'scheduled' || a.status === 'in_progress')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const patientNextApt = patientUpcoming[0];

  const caregiverActiveAppointmentsCount = appointments.filter(
    (a) => a.status === 'in_progress' || a.status === 'confirmed' || a.status === 'scheduled'
  ).length;

  return (
    <div className={`min-h-screen flex flex-col md:flex-row bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors ${isDarkMode ? 'dark' : ''}`}>
      {/* 1. SIDEBAR NAVIGATION */}
      <aside 
        id="app-sidebar"
        className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-slate-900 text-white z-40 flex flex-col justify-between p-4 shadow-2xl transition-transform duration-300 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div>
          {/* Sidebar Brand */}
          <div className="flex items-center justify-between p-2 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-blue-500/25">
                <Pill className="w-5 h-5" />
              </div>
              <div>
                <span className="font-black text-lg tracking-tight block leading-tight">MediTrack AI</span>
                <span className="text-[10px] text-blue-400 font-semibold tracking-wider uppercase">
                  {isCaregiver ? 'Caregiver Hub' : 'Patient Portal'}
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5 text-xs font-bold">
            <button
              id="nav-tab-dashboard"
              onClick={() => { setCurrentTab('dashboard'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all ${
                currentTab === 'dashboard'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>{isCaregiver ? 'Progress Dashboard' : 'Daily Progress'}</span>
            </button>

            {!isCaregiver && (
              <button
                id="nav-tab-medicines"
                onClick={() => { setCurrentTab('medicines'); setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all ${
                  currentTab === 'medicines'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Pill className="w-4 h-4" />
                <span>My Prescriptions</span>
              </button>
            )}

            {/* Appointments Tab */}
            <button
              id="nav-tab-appointments"
              onClick={() => { setCurrentTab('appointments'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl transition-all ${
                currentTab === 'appointments'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                {isCaregiver ? <Stethoscope className="w-4 h-4 text-emerald-400" /> : <Calendar className="w-4 h-4 text-emerald-400" />}
                <span>{isCaregiver ? 'Clinic Appointments' : 'Doctor Appointments'}</span>
              </div>
              {((isCaregiver ? caregiverActiveAppointmentsCount : patientUpcoming.length) > 0) && (
                <span className="text-[10px] font-bold bg-emerald-500 text-white px-2 py-0.5 rounded-full">
                  {isCaregiver ? caregiverActiveAppointmentsCount : patientUpcoming.length}
                </span>
              )}
            </button>

            <button
              id="nav-tab-scanner"
              onClick={() => { setIsScannerOpen(true); setIsSidebarOpen(false); }}
              className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
            >
              <Camera className="w-4 h-4 text-cyan-400" />
              <span>Scan Medicine</span>
            </button>

            <button
              id="nav-tab-reports"
              onClick={() => { setCurrentTab('reports'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all ${
                currentTab === 'reports'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <BarChart2 className="w-4 h-4" />
              <span>Doctor Reports</span>
            </button>

            {/* Academic Project Report & PDF Download */}
            <button
              id="nav-tab-project-report"
              onClick={() => { setIsProjectReportOpen(true); setIsSidebarOpen(false); }}
              className="w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-slate-300 hover:text-white bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-slate-900 border border-blue-500/30 hover:border-blue-400/50 transition-all cursor-pointer shadow-sm group"
            >
              <div className="flex items-center gap-3">
                <GraduationCap className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
                <span className="font-semibold text-xs">Project Report (PDF)</span>
              </div>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/40">
                PDF
              </span>
            </button>

            {!isCaregiver ? (
              <button
                id="nav-tab-charts"
                onClick={() => { setCurrentTab('analytics'); setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all ${
                  currentTab === 'analytics'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                <span>Visual Health Charts</span>
              </button>
            ) : (
              <>
                <button
                  id="nav-tab-patients"
                  onClick={() => { setCurrentTab('patients'); setIsSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all ${
                    currentTab === 'patients'
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Patient Roster</span>
                </button>

                <button
                  id="nav-tab-analytics"
                  onClick={() => { setCurrentTab('analytics'); setIsSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all ${
                    currentTab === 'analytics'
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  <span>Stock & Clinical Analytics</span>
                </button>
              </>
            )}


            {/* Real-Time Gemini Assistant Button (Role differentiated) */}
            <button
              id="nav-tab-voice-assistant"
              onClick={() => { setIsVoiceModalOpen(true); setIsSidebarOpen(false); }}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl border transition-all cursor-pointer shadow-sm ${
                isCaregiver
                  ? 'bg-gradient-to-r from-indigo-950/60 via-slate-800 to-blue-950/60 border-indigo-500/40 text-indigo-300 hover:text-white hover:bg-indigo-900/50'
                  : 'bg-gradient-to-r from-teal-950/60 via-slate-800 to-cyan-950/60 border-teal-500/40 text-teal-300 hover:text-white hover:bg-teal-900/50'
              }`}
            >
              <div className="flex items-center gap-3">
                {isCaregiver ? <Stethoscope className="w-4 h-4 text-indigo-400 animate-pulse" /> : <Mic className="w-4 h-4 text-teal-400 animate-pulse" />}
                <span>{isCaregiver ? 'Caregiver AI Copilot' : 'Voice Assistant'}</span>
              </div>
              <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                isCaregiver 
                  ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' 
                  : 'bg-teal-500/20 text-teal-300 border-teal-500/40'
              }`}>
                Gemini 3.8
              </span>
            </button>

            <button
              id="nav-tab-settings"
              onClick={() => { setCurrentTab('settings'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all ${
                currentTab === 'settings'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <SettingsIcon className="w-4 h-4" />
              <span>Settings</span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer: User Profile */}
        <div className="pt-4 border-t border-slate-800">
          <div className="p-2.5 bg-slate-800/60 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                {currentUser.name.split(' ').map((n) => n[0]).join('')}
              </div>
              <div className="overflow-hidden">
                <strong className="text-xs font-bold block truncate text-white">{currentUser.name}</strong>
                <span className="text-[10px] text-slate-400 block truncate capitalize">
                  {currentUser.role} Account
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-700 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* 2. MAIN APPLICATION CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto max-h-screen">
        {/* Sticky Topbar */}
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white capitalize">
                {currentTab === 'dashboard'
                  ? (isCaregiver ? 'Caregiver Clinical Overview' : 'Patient Progress Dashboard')
                  : currentTab === 'appointments'
                  ? (isCaregiver ? 'Clinic Appointments & Doctor Schedule' : 'Doctor Appointments & Telehealth')
                  : currentTab === 'analytics'
                  ? (isCaregiver ? 'Clinic Stock & Patient Analytics' : 'Simple Health Charts & Visual Insights')
                  : currentTab}
              </h2>
            </div>
          </div>

          {/* Actions: Notifications, Theme Switch, Quick Add */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsNotificationsOpen(true)}
              className="relative p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {alerts.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
              )}
            </button>

            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              title="Toggle Theme"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              onClick={handleLogout}
              className="hidden sm:flex items-center gap-1.5 py-2 px-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-bold hover:bg-rose-100 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          </div>
        </header>

        {/* Dynamic Main View Component */}
        <div className="p-4 sm:p-8 max-w-7xl w-full mx-auto pb-16">
          {currentTab === 'dashboard' && (
            isCaregiver ? (
              <CaregiverProgressOverview
                patients={patients}
                onUpdatePatient={handleSavePatient}
                onSendAlert={(patientName, msg) => {
                  setAlerts((prev) => [
                    {
                      id: 'alt_' + Date.now(),
                      type: 'warning',
                      title: `Alert to ${patientName}`,
                      message: msg,
                      time: 'Just now',
                      read: false,
                      patientName,
                    },
                    ...prev,
                  ]);
                }}
                onOpenAddPatient={() => setCurrentTab('patients')}
                showToast={showToast}
                appointments={appointments}
                onNavigateToSchedule={() => setCurrentTab('appointments')}
                onAddMedicineToPatient={handleAddMedicineToPatient}
                onDeleteMedicineFromPatient={handleDeleteMedicineFromPatient}
              />
            ) : (
              <PatientProgressOverview
                medicines={medicines}
                onTakeDose={handleTakeDose}
                onMissDose={handleMissDose}
                onUndoDose={handleUndoDose}
                onOpenAddModal={() => setIsAddMedOpen(true)}
                dailyHistory={dailyHistory}
                streakDays={streakDays}
                showToast={showToast}
                upcomingAppointment={patientNextApt}
                onNavigateToAppointments={() => setCurrentTab('appointments')}
              />
            )
          )}

          {currentTab === 'medicines' && (
            <MedicineList
              medicines={medicines}
              onTakeDose={handleTakeDose}
              onMissDose={handleMissDose}
              onUndoDose={handleUndoDose}
              onDeleteMedicine={handleDeleteMedicine}
              onOpenAddModal={() => setIsAddMedOpen(true)}
              showToast={showToast}
            />
          )}

          {currentTab === 'appointments' && (
            isCaregiver ? (
              <DoctorAppointmentsScheduleView
                appointments={appointments}
                patients={patients}
                onUpdateAppointmentStatus={handleUpdateAppointmentStatus}
                onBookAppointment={handleBookAppointment}
                onRescheduleAppointment={handleRescheduleAppointment}
                showToast={showToast}
              />
            ) : (
              <PatientAppointmentsView
                appointments={patientAppointments}
                onBookAppointment={handleBookAppointment}
                onCancelAppointment={handleCancelAppointment}
                onRescheduleAppointment={handleRescheduleAppointment}
                showToast={showToast}
              />
            )
          )}

          {currentTab === 'reports' && (
            <ReportsView
              userRole={currentUser.role}
              medicines={medicines}
              patients={patients}
              showToast={showToast}
            />
          )}

          {currentTab === 'patients' && isCaregiver && (
            <PatientDatabaseView
              patients={patients}
              onSavePatient={handleSavePatient}
              onDeletePatient={handleDeletePatient}
              showToast={showToast}
              onAddMedicineToPatient={handleAddMedicineToPatient}
              onDeleteMedicineFromPatient={handleDeleteMedicineFromPatient}
            />
          )}

          {currentTab === 'analytics' && (
            isCaregiver ? (
              <AnalyticsView
                medicines={medicines}
                patients={patients}
                showToast={showToast}
              />
            ) : (
              <SimpleHealthCharts
                medicines={medicines}
                dailyHistory={dailyHistory}
                streakDays={streakDays}
                userRole="patient"
                patientName={currentUser.name}
                showToast={showToast}
                onRequestRefill={(medName) =>
                  showToast(`Refill request submitted for ${medName}! Caregiver alerted.`, 'success')
                }
              />
            )
          )}


          {currentTab === 'settings' && (
            <SettingsView
              currentUser={currentUser}
              onUpdateUser={(updated) => setCurrentUser(updated)}
              showToast={showToast}
            />
          )}
        </div>
      </main>

      {/* Floating Voice Companion (Gemini 3.8) Button */}
      <button
        id="floating-voice-assistant-button"
        onClick={() => setIsVoiceModalOpen(true)}
        className={`fixed bottom-6 right-6 z-40 p-3.5 text-white rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2.5 font-bold text-xs group cursor-pointer border border-white/20 ${
          isCaregiver
            ? 'bg-gradient-to-tr from-indigo-600 via-blue-600 to-emerald-600 shadow-indigo-500/35'
            : 'bg-gradient-to-tr from-teal-500 via-cyan-500 to-blue-600 shadow-cyan-500/35'
        }`}
        title={`Open Gemini 3.8 ${isCaregiver ? 'Clinical Caregiver Copilot' : 'Personal Health Companion'}`}
      >
        <div className="relative">
          {isCaregiver ? <Stethoscope className="w-5 h-5 animate-pulse" /> : <Mic className="w-5 h-5 animate-pulse" />}
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
        </div>
        <span className="hidden sm:inline-block pr-1 font-semibold">
          {isCaregiver ? 'Gemini Caregiver Copilot' : 'Gemini Voice Companion'}
        </span>
      </button>

      {/* Voice Assistant Modal with Gemini 3.8 (Live Voice & Resilient REST + Audio Replay) */}
      <VoiceAssistantModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        medicines={medicines}
        onTakeDose={handleTakeDose}
        currentUser={currentUser}
        userRole={currentUser.role}
        patients={patients}
        appointments={appointments}
      />

      {/* 3. MODALS */}
      <AddMedicineModal
        isOpen={isAddMedOpen}
        onClose={() => setIsAddMedOpen(false)}
        onAdd={handleAddMedicine}
        showToast={showToast}
        currentMedications={medicines}
        patientCondition={currentUser?.condition}
      />

      <ScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        currentUser={currentUser}
        userRole={currentUser?.role || 'patient'}
        medicines={medicines}
        patients={patients}
        onTakeDose={handleTakeDose}
        onRefillMedicine={handleRefillMedicine}
        onNavigateToPatient={() => setCurrentTab('patients')}
        onMedicineIdentified={(data) => {
          handleAddMedicine({
            name: data.name,
            dose: data.dose,
            time: '08:00 AM',
            frequency: 'Twice daily',
            stock: 30,
            perDose: 1,
            status: 'pending',
            timeSlot: 'morning',
            instructions: data.instructions,
            category: data.category || 'Prescription Regimen',
          });
          showToast(`✓ Added ${data.name} to prescriptions from barcode scan!`, 'success');
          setCurrentTab('medicines');
        }}
        showToast={showToast}
      />

      <NotificationModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={alerts}
        onMarkAllRead={() => {
          setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
          showToast('Marked all notifications as read.', 'info');
        }}
      />

      {/* 4. GLOBAL TOAST NOTIFIER */}
      {toast && (
        <div className="fixed bottom-20 right-6 z-50 animate-bounce">
          <div className={`px-4 py-3 rounded-2xl shadow-xl border text-xs font-bold flex items-center gap-2 ${
            toast.type === 'success' ? 'bg-emerald-900 text-emerald-100 border-emerald-700' :
            toast.type === 'error' ? 'bg-rose-900 text-rose-100 border-rose-700' :
            'bg-slate-900 text-white border-slate-700'
          }`}>
            <span>{toast.type === 'success' ? '✓' : toast.type === 'error' ? '✗' : 'ℹ'}</span>
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}

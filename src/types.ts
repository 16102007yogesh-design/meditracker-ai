export type UserRole = 'patient' | 'caregiver';

export interface UserAccount {
  id: string | number;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  password: string;
  createdDate: string;
  age?: number | string;
  condition?: string;
  relation?: string;
  license?: string;
  emergencyContact?: string;
}

export interface DrugConflict {
  interactingMedication: string;
  severity: 'mild' | 'moderate' | 'severe' | 'contraindicated';
  mechanism: string;
  clinicalEffect: string;
  recommendation: string;
}

export interface DrugInteractionResult {
  hasInteraction: boolean;
  severity: 'none' | 'mild' | 'moderate' | 'severe' | 'contraindicated';
  riskScore: number; // 0 - 100
  summary: string;
  conflicts: DrugConflict[];
  alternativeSuggestions: string[];
  pharmacistNote: string;
  safeToProceed: boolean;
  timestamp?: string;
}

export interface Medicine {
  id: number;
  name: string;
  dose: string;
  time: string; // e.g., "08:00 AM"
  frequency: 'Once daily' | 'Twice daily' | 'Three times daily' | 'As needed';
  stock: number;
  perDose: number;
  status: 'taken' | 'pending' | 'missed';
  timeSlot?: 'morning' | 'afternoon' | 'evening' | 'night';
  instructions?: string;
  category?: string;
  lastTakenAt?: string;
  interactionCheck?: {
    severity: 'none' | 'mild' | 'moderate' | 'severe' | 'contraindicated';
    summary: string;
    hasInteraction: boolean;
    overridden?: boolean;
    overrideReason?: string;
    checkedAt: string;
  };
}

export interface PatientRecord {
  id: number;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  condition: string;
  contact: string;
  email: string;
  emergency: string;
  status: 'active' | 'review' | 'critical' | 'inactive';
  notes: string;
  createdDate: string;
  medicines: Medicine[];
  adherenceRate: number; // 0 - 100
  streakDays: number;
  todayDosesTotal: number;
  todayDosesTaken: number;
  trend: 'improving' | 'stable' | 'declining';
  lastVisit: string;
  riskScore: number; // 0 - 100
  recoveryStage: string;
}

export interface AlertNotification {
  id: string;
  type: 'danger' | 'warning' | 'success' | 'info';
  title: string;
  message: string;
  time: string;
  read: boolean;
  patientId?: number;
  patientName?: string;
}

export interface DailyAdherencePoint {
  day: string; // "Mon", "Tue", etc.
  date: string;
  adherence: number; // percentage
  dosesTaken: number;
  totalDoses: number;
}

export interface ForgotPasswordState {
  isOpen: boolean;
  step: 'email' | 'otp' | 'newPassword' | 'success';
  emailOrPhone: string;
  otpCode: string;
  generatedOtp: string;
  newPassword: string;
  confirmPassword: string;
  countdown: number;
  errorMessage: string;
}

export type AppointmentStatus = 'confirmed' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export type ConsultationType = 'in_person' | 'video' | 'phone';

export interface Appointment {
  id: string;
  patientId: number | string;
  patientName: string;
  patientAge?: number;
  patientCondition?: string;
  patientContact?: string;
  doctorName: string;
  doctorSpecialty: string;
  doctorAvatar?: string;
  hospitalName: string;
  roomNumber?: string;
  date: string; // "YYYY-MM-DD"
  time: string; // "10:30 AM"
  status: AppointmentStatus;
  type: ConsultationType;
  reason: string;
  symptoms?: string;
  doctorNotes?: string;
  prescriptionSummary?: string;
  tokenNumber?: string;
  preparationNotes?: string;
  videoLink?: string;
}


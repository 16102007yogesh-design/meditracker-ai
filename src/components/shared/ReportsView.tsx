import React from 'react';
import { 
  FileText, 
  Download, 
  Share2, 
  CheckCircle2, 
  AlertTriangle, 
  Calendar, 
  Activity,
  Award,
  Sparkles
} from 'lucide-react';
import { UserRole, Medicine, PatientRecord } from '../../types';

interface ReportsViewProps {
  userRole: UserRole;
  medicines: Medicine[];
  patients: PatientRecord[];
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onOpenProjectReport?: () => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  userRole,
  medicines,
  patients,
  showToast,
  onOpenProjectReport,
}) => {
  const handleDownloadDoctorReport = () => {
    const reportText = `
MEDITRACK AI — CLINICAL MEDICATION ADHERENCE REPORT
=====================================================
Patient Name: Raj Kumar
Age: 68 | Gender: Male
Primary Diagnosis: Type 2 Diabetes Mellitus & Stage 2 Hypertension
Report Period: Past 30 Days (Generated: ${new Date().toLocaleDateString()})
Caregiver: Sonia Verma (Care Specialist / Daughter)
=====================================================

1. ADHERENCE SUMMARY:
- Overall 30-Day Adherence: 94.2% (Target: >85%)
- Current Consecutive On-Time Streak: 12 Days
- Total Scheduled Doses: 120 Doses
- Total Taken Doses: 113 Doses
- Missed Doses: 7 Doses (Primary variance: Evening post-dinner doses)

2. ACTIVE PRESCRIBED MEDICATION REGIMEN:
${medicines.map((m, idx) => `
${idx + 1}. ${m.name} (${m.dose})
   - Schedule: ${m.time} (${m.frequency})
   - Clinical Category: ${m.category || 'Maintenance'}
   - Remaining Supply: ${m.stock} Tablets
   - Adherence Compliance: 95%
`).join('')}

3. CLINICAL OBSERVATIONS & RECOMMENDATIONS:
- Patient displays exceptional morning routine compliance (98%).
- Evening medication schedule adjusted with SMS reminder prompt.
- Refill requisition initiated for Telmisartan 40mg.
- Vital parameters remain within therapeutic baseline.

=====================================================
Report digitally certified by MediTrack AI Clinical Engine.
`;

    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MediTrack_Doctor_Adherence_Report_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('📄 Downloaded comprehensive Doctor Adherence Report', 'success');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-cyan-700 rounded-3xl p-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg shadow-blue-500/20">
        <div>
          <h2 className="text-2xl font-black tracking-tight">Clinical Health & Adherence Reports 📊</h2>
          <p className="text-xs text-blue-100 mt-1">
            Certified compliance summaries formatted for physician review and health insurance verification
          </p>
        </div>
        <button
          onClick={handleDownloadDoctorReport}
          className="py-2.5 px-4 bg-white text-blue-800 hover:bg-blue-50 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <Download className="w-4 h-4" /> Download Physician Report
        </button>
      </div>

      {/* Academic Project Report Download Card */}
      <div className="bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 border border-blue-500/30 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 rounded-full bg-blue-500/30 border border-blue-400/40 text-blue-200">
              Anna University / B.E. Final Project
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Verified & Complete
            </span>
          </div>
          <h3 className="text-xl font-black text-white tracking-tight">
            MediTrack AI — Official Academic Project Report & Documentation
          </h3>
          <p className="text-xs text-blue-100/90 leading-relaxed">
            Full comprehensive academic report matching engineering submission guidelines. Contains Title Page, Bonafide Certificate with Guide & HOD signatures, Abstract, Chapters 1–7, System Architecture (Fig 4.1), Table 3.1 & Table 6.1 Performance Benchmarks, Appendices, and IEEE References.
          </p>
          <div className="flex flex-wrap gap-4 pt-1 text-[11px] text-blue-200">
            <span className="flex items-center gap-1">✓ Bonafide Certificate</span>
            <span className="flex items-center gap-1">✓ Architectural Comparison (Table 3.1)</span>
            <span className="flex items-center gap-1">✓ Evaluation Metrics (Table 6.1)</span>
            <span className="flex items-center gap-1">✓ IEEE Citations</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0">
          <button
            onClick={() => onOpenProjectReport?.()}
            className="py-3 px-5 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-400 hover:to-indigo-400 text-white font-black text-xs rounded-xl shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>Open & Download Report PDF</span>
          </button>
          
          <a
            href="/assets/aistudio/final_report_batch_17__1__2___1__1__18d8f90c.pdf"
            download="Batch17_Sample_Reference_Report.pdf"
            target="_blank"
            rel="noreferrer"
            className="py-2.5 px-4 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Reference Template PDF</span>
          </a>
        </div>
      </div>

      {/* Grid of Report Modules */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Adherence Summary Card */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600" />
              Monthly Compliance Overview
            </h3>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg">
              94.2% Adherent
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 my-4 text-center">
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Scheduled</span>
              <div className="text-xl font-black text-slate-900 dark:text-white mt-1">120</div>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <span className="text-[10px] font-bold text-emerald-600 uppercase">Taken</span>
              <div className="text-xl font-black text-emerald-600 mt-1">113</div>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <span className="text-[10px] font-bold text-rose-600 uppercase">Missed</span>
              <div className="text-xl font-black text-rose-600 mt-1">7</div>
            </div>
          </div>

          <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex justify-between">
              <span>Morning Adherence:</span>
              <strong className="text-emerald-600 font-bold">98% (Optimal)</strong>
            </div>
            <div className="flex justify-between">
              <span>Evening Adherence:</span>
              <strong className="text-amber-600 font-bold">84% (Prompted)</strong>
            </div>
            <div className="flex justify-between">
              <span>Longest Streak:</span>
              <strong className="text-blue-600 font-bold">12 Consecutive Days 🔥</strong>
            </div>
          </div>
        </div>

        {/* Doctor AI Insights */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              Physician AI Insights & Notes
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <strong className="text-emerald-900 dark:text-emerald-300 block font-bold">Excellent morning routine</strong>
                  <span className="text-emerald-800 dark:text-emerald-400 text-[11px]">
                    Metformin & Vitamin D3 taken with high regularity. Fasting blood sugars expected to remain stable.
                  </span>
                </div>
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <strong className="text-amber-900 dark:text-amber-300 block font-bold">Evening reminder advisory</strong>
                  <span className="text-amber-800 dark:text-amber-400 text-[11px]">
                    Dinner timing fluctuates between 08:00 PM and 09:30 PM. Push notification offset to 08:15 PM recommended.
                  </span>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleDownloadDoctorReport}
            className="w-full mt-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <Download className="w-4 h-4" /> Download Complete Clinical PDF / Text
          </button>
        </div>
      </div>
    </div>
  );
};

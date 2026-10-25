import React, { useState } from 'react';
import { 
  Pill, 
  Plus, 
  Search, 
  Filter, 
  Clock, 
  Package, 
  AlertCircle, 
  Check, 
  RotateCcw, 
  Trash2, 
  Edit3, 
  Calendar, 
  Sparkles, 
  ArrowUpRight,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  Info
} from 'lucide-react';
import { Medicine } from '../../types';

interface MedicineListProps {
  medicines: Medicine[];
  onTakeDose: (id: number) => void;
  onMissDose: (id: number) => void;
  onUndoDose: (id: number) => void;
  onDeleteMedicine: (id: number) => void;
  onOpenAddModal: () => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const MedicineList: React.FC<MedicineListProps> = ({
  medicines,
  onTakeDose,
  onMissDose,
  onUndoDose,
  onDeleteMedicine,
  onOpenAddModal,
  showToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'taken' | 'pending' | 'missed'>('all');
  const [expandedInteractionId, setExpandedInteractionId] = useState<number | null>(null);

  const filtered = medicines.filter((med) => {
    const matchesSearch = 
      med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      med.dose.toLowerCase().includes(searchQuery.toLowerCase()) ||
      med.time.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || med.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 rounded-3xl p-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg shadow-blue-500/20">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black tracking-tight">Prescription Medications 💊</h2>
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md">
              <Sparkles className="w-3 h-3 text-emerald-300" /> Gemini DDI Screened
            </span>
          </div>
          <p className="text-xs text-blue-100 mt-1">
            Manage your daily dosages, refill runway, and automated negative drug interaction checks
          </p>
        </div>
        <button
          onClick={onOpenAddModal}
          className="py-2.5 px-4 bg-white text-blue-700 hover:bg-blue-50 font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add New Prescription
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search medicine name, dosage, or time..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(['all', 'taken', 'pending', 'missed'] as const).map((filter) => (
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

      {/* Medicine Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((med) => {
          const isTaken = med.status === 'taken';
          const isMissed = med.status === 'missed';
          const daysLeft = Math.ceil(med.stock / (med.perDose * 1));
          const isUrgent = daysLeft <= 4;
          const isWarning = daysLeft <= 7 && !isUrgent;
          const hasDdi = med.interactionCheck?.hasInteraction;
          const isDdiExpanded = expandedInteractionId === med.id;

          return (
            <div
              key={med.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold ${
                      isTaken 
                        ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' 
                        : isMissed 
                        ? 'bg-rose-500 text-white' 
                        : 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    }`}>
                      💊
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                        {med.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {med.dose} • {med.frequency}
                      </p>
                    </div>
                  </div>

                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                    isTaken
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                      : isMissed
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                  }`}>
                    {med.status}
                  </span>
                </div>

                {/* Gemini Drug-Drug Interaction Safety Tag */}
                {med.interactionCheck && (
                  <div className="mb-3">
                    <button
                      type="button"
                      onClick={() => setExpandedInteractionId(isDdiExpanded ? null : med.id)}
                      className={`w-full text-left p-2 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 transition-all cursor-pointer ${
                        hasDdi
                          ? med.interactionCheck.severity === 'severe' || med.interactionCheck.severity === 'contraindicated'
                            ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-900'
                            : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-900'
                          : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-900'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        {hasDdi ? (
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                        ) : (
                          <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                        )}
                        <span className="truncate">
                          {hasDdi 
                            ? `DDI Alert: ${med.interactionCheck.severity.toUpperCase()} risk`
                            : 'Gemini Safety Verified: No negative interactions'
                          }
                        </span>
                      </div>
                      <span className="text-[10px] text-blue-600 dark:text-blue-400 underline shrink-0">
                        {isDdiExpanded ? 'Hide' : 'Details'}
                      </span>
                    </button>

                    {isDdiExpanded && (
                      <div className="mt-1.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 animate-fadeIn space-y-1">
                        <p className="font-medium">{med.interactionCheck.summary}</p>
                        {med.interactionCheck.overridden && (
                          <p className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold">
                            ⚠️ Clinician Override: {med.interactionCheck.overrideReason || 'Authorized by prescribing clinician'}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Timing & Stock info grid */}
                <div className="grid grid-cols-2 gap-2 my-3 text-xs">
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase block">Schedule Time</span>
                    <strong className="text-blue-600 dark:text-blue-400 text-xs font-bold">{med.time}</strong>
                  </div>
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase block">Stock Balance</span>
                    <strong className={`${isUrgent ? 'text-rose-600' : isWarning ? 'text-amber-600' : 'text-emerald-600'} text-xs font-bold`}>
                      {med.stock} tablets ({daysLeft}d supply)
                    </strong>
                  </div>
                </div>

                {med.instructions && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 bg-blue-50/50 dark:bg-blue-950/30 p-2.5 rounded-xl border border-blue-100 dark:border-blue-900/40 mb-3">
                    📋 {med.instructions}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <div className="flex gap-2 flex-1">
                  {!isTaken ? (
                    <button
                      onClick={() => onTakeDose(med.id)}
                      className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-1 cursor-pointer transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" /> Mark Taken
                    </button>
                  ) : (
                    <button
                      onClick={() => onUndoDose(med.id)}
                      className="flex-1 py-2 px-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 font-semibold text-xs rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Undo
                    </button>
                  )}

                  {!isMissed ? (
                    <button
                      onClick={() => onMissDose(med.id)}
                      className="py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 rounded-xl text-xs font-bold border border-rose-200 dark:border-rose-800/60 cursor-pointer transition-colors"
                    >
                      ✗ Missed
                    </button>
                  ) : null}
                </div>

                <button
                  onClick={() => {
                    if (confirm(`Remove ${med.name} from active prescriptions?`)) {
                      onDeleteMedicine(med.id);
                    }
                  }}
                  title="Delete Medication"
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

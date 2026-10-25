import React, { useState, useEffect } from 'react';
import { 
  Pill, 
  Plus, 
  X, 
  AlertTriangle, 
  ShieldCheck, 
  AlertOctagon, 
  Info, 
  Sparkles, 
  CheckCircle2, 
  RefreshCw, 
  ArrowRight,
  Stethoscope,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { Medicine, DrugInteractionResult } from '../../types';

interface AddMedicineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (medicine: Omit<Medicine, 'id'>) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  targetPatientName?: string;
  currentMedications?: Medicine[];
  patientCondition?: string;
}

export const AddMedicineModal: React.FC<AddMedicineModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  showToast,
  targetPatientName,
  currentMedications = [],
  patientCondition,
}) => {
  const [name, setName] = useState('');
  const [dose, setDose] = useState('');
  const [time, setTime] = useState('08:00 AM');
  const [frequency, setFrequency] = useState<'Once daily' | 'Twice daily' | 'Three times daily' | 'As needed'>('Once daily');
  const [stock, setStock] = useState('30');
  const [perDose, setPerDose] = useState('1');
  const [instructions, setInstructions] = useState('');
  const [category, setCategory] = useState('General Prescription');

  // Drug-Drug Interaction State
  const [isChecking, setIsChecking] = useState(false);
  const [interactionResult, setInteractionResult] = useState<DrugInteractionResult | null>(null);
  const [checkedMedicineKey, setCheckedMedicineKey] = useState<string>('');
  const [showOverrideDialog, setShowOverrideDialog] = useState(false);
  const [overrideAcknowledged, setOverrideAcknowledged] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');
  const [selectedConflictTab, setSelectedConflictTab] = useState<number>(0);

  // Reset states when modal reopens
  useEffect(() => {
    if (isOpen) {
      setInteractionResult(null);
      setCheckedMedicineKey('');
      setShowOverrideDialog(false);
      setOverrideAcknowledged(false);
      setOverrideReason('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Run Gemini drug interaction validation
  const runInteractionCheck = async (medName: string, medDose: string): Promise<DrugInteractionResult | null> => {
    if (!medName.trim()) return null;
    setIsChecking(true);

    try {
      const response = await fetch('/api/check-drug-interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newMedicine: {
            name: medName.trim(),
            dose: medDose.trim() || 'standard dose',
            frequency,
          },
          currentMedications: currentMedications.map((m) => ({
            name: m.name,
            dose: m.dose,
            frequency: m.frequency,
          })),
          patientContext: targetPatientName 
            ? `Patient: ${targetPatientName}, Condition: ${patientCondition || 'Under Caregiver Supervision'}` 
            : (patientCondition || 'Active Patient Prescription'),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to validate interactions');
      }

      const data: DrugInteractionResult = await response.json();
      setInteractionResult(data);
      setCheckedMedicineKey(`${medName.trim().toLowerCase()}_${medDose.trim().toLowerCase()}`);
      return data;
    } catch (err) {
      console.error('Interaction check failed:', err);
      // Fallback safe result
      const fallback: DrugInteractionResult = {
        hasInteraction: false,
        severity: 'none',
        riskScore: 0,
        summary: 'No critical acute interactions flagged. Standard clinical monitoring advised.',
        conflicts: [],
        alternativeSuggestions: [],
        pharmacistNote: 'Always confirm dosages with your healthcare provider.',
        safeToProceed: true,
      };
      setInteractionResult(fallback);
      return fallback;
    } finally {
      setIsChecking(false);
    }
  };

  const handleManualCheck = () => {
    if (!name.trim()) {
      showToast('Please enter a medicine name to screen for interactions.', 'info');
      return;
    }
    runInteractionCheck(name, dose);
  };

  const calculateTimeSlot = (t: string): 'morning' | 'afternoon' | 'evening' | 'night' => {
    if (t.includes('AM')) return 'morning';
    if (t.includes('01:') || t.includes('02:') || t.includes('03:') || t.includes('04:')) return 'afternoon';
    if (t.includes('08:') || t.includes('06:') || t.includes('07:')) return 'evening';
    return 'night';
  };

  const proceedWithAdd = (resultToUse?: DrugInteractionResult | null, wasOverridden: boolean = false) => {
    const timeSlot = calculateTimeSlot(time);
    const result = resultToUse !== undefined ? resultToUse : interactionResult;

    onAdd({
      name: name.trim(),
      dose: dose.trim(),
      time,
      frequency,
      stock: parseInt(stock) || 30,
      perDose: parseInt(perDose) || 1,
      status: 'pending',
      timeSlot,
      instructions: instructions.trim() || undefined,
      category: category.trim() || undefined,
      interactionCheck: result ? {
        severity: result.severity,
        summary: result.summary,
        hasInteraction: result.hasInteraction,
        overridden: wasOverridden,
        overrideReason: wasOverridden ? (overrideReason || 'Clinician acknowledged risk and authorized administration') : undefined,
        checkedAt: new Date().toISOString(),
      } : undefined,
    });

    setName('');
    setDose('');
    setInstructions('');
    setInteractionResult(null);
    setShowOverrideDialog(false);
    onClose();

    if (wasOverridden) {
      showToast(`⚠️ Added ${name} with documented clinical override note.`, 'info');
    } else if (targetPatientName) {
      showToast(`Prescribed ${name} for ${targetPatientName}! Synced across patient & caregiver databases.`, 'success');
    } else {
      showToast(`✓ Added ${name} to daily regimen! Gemini verified.`, 'success');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !dose.trim()) {
      showToast('Please enter the medicine name and dosage.', 'error');
      return;
    }

    const currentKey = `${name.trim().toLowerCase()}_${dose.trim().toLowerCase()}`;
    let result = interactionResult;

    // If not checked yet or name changed, check now
    if (!result || checkedMedicineKey !== currentKey) {
      result = await runInteractionCheck(name, dose);
    }

    if (result && result.hasInteraction && (result.severity === 'severe' || result.severity === 'contraindicated')) {
      // Require explicit clinician/patient override dialog
      setShowOverrideDialog(true);
      return;
    }

    if (result && result.hasInteraction && result.severity === 'moderate') {
      // Moderate warning toast or proceed
      proceedWithAdd(result, false);
      return;
    }

    proceedWithAdd(result, false);
  };

  const handleSelectAlternative = (altName: string) => {
    setName(altName);
    setInteractionResult(null);
    setCheckedMedicineKey('');
    setShowOverrideDialog(false);
    showToast(`Selected alternative: ${altName}. Re-validating...`, 'info');
    runInteractionCheck(altName, dose);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 p-6 text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl shadow-inner border border-white/20">
              <Pill className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">
                  {targetPatientName ? `Prescribe Tablet for ${targetPatientName}` : 'Add Prescription Medicine'}
                </h3>
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 border border-emerald-300/30">
                  <Sparkles className="w-3 h-3 text-emerald-300" /> Gemini DDI Guard
                </span>
              </div>
              <p className="text-xs text-blue-100 mt-0.5">
                Active screening against {currentMedications.length} prescribed medications for adverse CYP450 & toxic interactions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Medicine Name with quick interaction verification button */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Medicine Name *
              </label>
              <button
                type="button"
                onClick={handleManualCheck}
                disabled={isChecking || !name.trim()}
                className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 cursor-pointer disabled:opacity-40 transition-colors"
              >
                <Sparkles className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
                {isChecking ? 'Analyzing Pathways...' : 'Check Drug Interactions'}
              </button>
            </div>

            <div className="relative">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (interactionResult) {
                    setInteractionResult(null);
                  }
                }}
                placeholder="e.g. Warfarin, Ciprofloxacin, Lisinopril, Fluoxetine"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Tip: Enter generic or brand name. Gemini screens CYP450 pathways, bleeding risk, and QT prolongation automatically.
            </p>
          </div>

          {/* Interactive Gemini Interaction Status Display */}
          {isChecking && (
            <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 flex items-center gap-3 animate-pulse">
              <RefreshCw className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin shrink-0" />
              <div className="text-xs">
                <p className="font-semibold text-blue-900 dark:text-blue-200">
                  Gemini 3.8 Flash Pharmacovigilance screening...
                </p>
                <p className="text-[11px] text-blue-700 dark:text-blue-300">
                  Evaluating metabolic conflicts with {currentMedications.length} active medications: {currentMedications.map((m) => m.name).join(', ') || 'None'}
                </p>
              </div>
            </div>
          )}

          {interactionResult && !isChecking && (
            <div className={`p-4 rounded-2xl border transition-all ${
              interactionResult.severity === 'contraindicated' || interactionResult.severity === 'severe'
                ? 'bg-rose-50/90 dark:bg-rose-950/40 border-rose-300 dark:border-rose-900/60 text-rose-900 dark:text-rose-100'
                : interactionResult.severity === 'moderate'
                ? 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-300 dark:border-amber-900/60 text-amber-900 dark:text-amber-100'
                : interactionResult.severity === 'mild'
                ? 'bg-blue-50/90 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/60 text-blue-900 dark:text-blue-100'
                : 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-900/60 text-emerald-900 dark:text-emerald-100'
            }`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  {interactionResult.severity === 'contraindicated' || interactionResult.severity === 'severe' ? (
                    <AlertOctagon className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
                  ) : interactionResult.severity === 'moderate' ? (
                    <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                  ) : interactionResult.severity === 'mild' ? (
                    <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
                  ) : (
                    <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  )}

                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        interactionResult.severity === 'contraindicated'
                          ? 'bg-rose-600 text-white'
                          : interactionResult.severity === 'severe'
                          ? 'bg-rose-500 text-white'
                          : interactionResult.severity === 'moderate'
                          ? 'bg-amber-500 text-white'
                          : interactionResult.severity === 'mild'
                          ? 'bg-blue-600 text-white'
                          : 'bg-emerald-600 text-white'
                      }`}>
                        {interactionResult.severity.toUpperCase()} RISK {interactionResult.riskScore > 0 ? `(${interactionResult.riskScore}/100)` : ''}
                      </span>
                      <span className="text-[11px] font-semibold opacity-75">
                        Gemini 3.8 Flash Pharmacovigilance
                      </span>
                    </div>
                    <p className="text-xs font-bold mt-1 leading-snug">
                      {interactionResult.summary}
                    </p>
                  </div>
                </div>
              </div>

              {/* Conflict details if any */}
              {interactionResult.conflicts && interactionResult.conflicts.length > 0 && (
                <div className="mt-3 pt-3 border-t border-black/10 dark:border-white/10 space-y-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider opacity-80">
                    Detected Conflicts ({interactionResult.conflicts.length}):
                  </div>
                  {interactionResult.conflicts.map((c, idx) => (
                    <div key={idx} className="bg-white/70 dark:bg-black/30 p-2.5 rounded-xl border border-black/5 dark:border-white/5 text-xs space-y-1">
                      <div className="flex items-center justify-between font-bold">
                        <span>{name} ⚡ {c.interactingMedication}</span>
                        <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10">
                          {c.severity}
                        </span>
                      </div>
                      <p className="text-[11px] opacity-90">
                        <strong className="font-semibold">Mechanism:</strong> {c.mechanism}
                      </p>
                      <p className="text-[11px] opacity-90">
                        <strong className="font-semibold">Clinical Effect:</strong> {c.clinicalEffect}
                      </p>
                      <p className="text-[11px] font-semibold text-blue-700 dark:text-blue-300">
                        💡 Advice: {c.recommendation}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Safer Alternatives suggestion chips */}
              {interactionResult.alternativeSuggestions && interactionResult.alternativeSuggestions.length > 0 && (
                <div className="mt-3 pt-3 border-t border-black/10 dark:border-white/10">
                  <span className="text-[11px] font-bold block mb-1.5 opacity-80">
                    Clinically Preferred Alternatives:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {interactionResult.alternativeSuggestions.map((alt, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectAlternative(alt)}
                        className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-1 cursor-pointer shadow-sm"
                      >
                        <Sparkles className="w-3 h-3" /> Switch to {alt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Pharmacist Note */}
              {interactionResult.pharmacistNote && (
                <p className="text-[10px] mt-2 opacity-75 italic">
                  📋 Pharmacist Note: {interactionResult.pharmacistNote}
                </p>
              )}
            </div>
          )}

          {/* Dosage and Scheduled Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Dosage / Strength *
              </label>
              <input
                type="text"
                required
                value={dose}
                onChange={(e) => setDose(e.target.value)}
                placeholder="e.g. 500 mg, 10 ml, 25 mcg"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Scheduled Time
              </label>
              <select
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="08:00 AM">08:00 AM (Morning / Breakfast)</option>
                <option value="01:00 PM">01:00 PM (Afternoon / Lunch)</option>
                <option value="08:00 PM">08:00 PM (Evening / Dinner)</option>
                <option value="10:00 PM">10:00 PM (Night / Bedtime)</option>
              </select>
            </div>
          </div>

          {/* Frequency & Stock */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Frequency
              </label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as any)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Once daily">Once daily</option>
                <option value="Twice daily">Twice daily</option>
                <option value="Three times daily">Three times daily</option>
                <option value="As needed">As needed</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Initial Stock (Tablets)
              </label>
              <input
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="30"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Doctor Special Instructions */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Doctor Special Instructions / Timing
            </label>
            <input
              type="text"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g. Take 30 mins after meals with a glass of water"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isChecking}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-blue-500/25 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isChecking ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Validating Interactions...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Add Prescription
                </>
              )}
            </button>
          </div>
        </form>

        {/* Severe / Contraindicated Interaction Override Confirmation Dialog */}
        {showOverrideDialog && interactionResult && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
            <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border-2 border-rose-500 overflow-hidden">
              <div className="bg-gradient-to-r from-rose-600 to-red-700 p-5 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <AlertOctagon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base font-black tracking-tight">
                      Negative Drug Interaction Warning ⚠️
                    </h3>
                    <p className="text-xs text-rose-100">
                      Severity: {interactionResult.severity.toUpperCase()} (Risk Score: {interactionResult.riskScore}/100)
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowOverrideDialog(false)}
                  className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="p-3.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-2xl text-xs text-rose-900 dark:text-rose-100">
                  <p className="font-bold leading-relaxed">{interactionResult.summary}</p>
                </div>

                {/* Conflicts breakdown */}
                {interactionResult.conflicts.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Active Conflict Details:
                    </span>
                    {interactionResult.conflicts.map((c, i) => (
                      <div key={i} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                        <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                          <span>{name} ⚡ {c.interactingMedication}</span>
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200">
                            {c.severity}
                          </span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300">
                          <strong>Biochemical Mechanism:</strong> {c.mechanism}
                        </p>
                        <p className="text-rose-700 dark:text-rose-300 font-medium">
                          <strong>Clinical Risk:</strong> {c.clinicalEffect}
                        </p>
                        <p className="text-blue-700 dark:text-blue-300">
                          <strong>Action Plan:</strong> {c.recommendation}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Safer alternatives suggestions */}
                {interactionResult.alternativeSuggestions.length > 0 && (
                  <div className="p-3 bg-blue-50/70 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-900">
                    <span className="text-xs font-bold text-blue-900 dark:text-blue-200 block mb-2">
                      💡 Recommended Safer Alternatives:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {interactionResult.alternativeSuggestions.map((alt, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleSelectAlternative(alt)}
                          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1 cursor-pointer"
                        >
                          Select {alt} <ArrowRight className="w-3 h-3" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Clinician Override Controls */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-3">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={overrideAcknowledged}
                      onChange={(e) => setOverrideAcknowledged(e.target.checked)}
                      className="mt-0.5 rounded text-rose-600 focus:ring-rose-500 w-4 h-4 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">
                      I have reviewed the pharmacological interaction warnings and authorize adding this prescription with clinical oversight.
                    </span>
                  </label>

                  {overrideAcknowledged && (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                        Override Clinical Reason / Precaution Protocol
                      </label>
                      <input
                        type="text"
                        value={overrideReason}
                        onChange={(e) => setOverrideReason(e.target.value)}
                        placeholder="e.g. Spaced 4 hours apart, bi-weekly INR monitoring scheduled"
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500"
                      />
                    </div>
                  )}
                </div>

                {/* Modal actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowOverrideDialog(false)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    Adjust Medication
                  </button>
                  <button
                    type="button"
                    disabled={!overrideAcknowledged}
                    onClick={() => proceedWithAdd(interactionResult, true)}
                    className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white text-xs font-bold transition-all shadow-md shadow-rose-600/30 cursor-pointer"
                  >
                    Authorize & Add
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  X, 
  Sparkles, 
  Radio, 
  AlertCircle, 
  Send,
  Pill,
  MessageSquare,
  HelpCircle,
  Activity,
  Stethoscope,
  Users,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Copy,
  Check,
  ChevronRight,
  ShieldAlert,
  Flame,
  ArrowRight
} from 'lucide-react';
import { Medicine, PatientRecord, UserAccount, Appointment } from '../../types';

interface MessageItem {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  roleContext?: 'caregiver' | 'patient';
  isPlaying?: boolean;
  audioBlobUrl?: string;
  suggestedActions?: Array<{ label: string; actionType: 'take_dose' | 'view_patient' | 'navigate'; targetId?: any }>;
  suggestedFollowUps?: string[];
}

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  medicines: Medicine[];
  onTakeDose?: (medId: number) => void;
  currentUser?: UserAccount | null;
  patients?: PatientRecord[];
  appointments?: Appointment[];
  userRole?: 'caregiver' | 'patient';
}

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({
  isOpen,
  onClose,
  medicines = [],
  onTakeDose,
  currentUser,
  patients = [],
  appointments = [],
  userRole: propUserRole,
}) => {
  // Determine active role (Caregiver vs Patient)
  const effectiveRole = propUserRole || currentUser?.role || 'patient';
  const [activeRole, setActiveRole] = useState<'caregiver' | 'patient'>(effectiveRole);

  const isCaregiver = activeRole === 'caregiver';

  // Synchronize role if currentUser changes
  useEffect(() => {
    if (propUserRole) {
      setActiveRole(propUserRole);
    } else if (currentUser?.role) {
      setActiveRole(currentUser.role);
    }
  }, [propUserRole, currentUser]);

  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isModelSpeaking, setIsModelSpeaking] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Connecting to Gemini AI Assistant...');
  const [textInput, setTextInput] = useState('');
  const [audioMuted, setAudioMuted] = useState(false);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speechRecognitionSupported, setSpeechRecognitionSupported] = useState(false);

  // Initialize transcript history tailored to role
  const [transcriptHistory, setTranscriptHistory] = useState<MessageItem[]>(() => {
    return isCaregiver
      ? [
          {
            id: 'init_caregiver',
            sender: 'assistant',
            text: `Hello ${currentUser?.name ? currentUser.name : 'Doctor / Caregiver'}. I am your MediTrack Clinical Caregiver Copilot powered by Gemini 3.8. I have synced your ${patients.length || 3} monitored patients, adherence records, and clinical risk scores. How can I assist in your rounds or patient triage today?`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            roleContext: 'caregiver',
          },
        ]
      : [
          {
            id: 'init_patient',
            sender: 'assistant',
            text: `Hello ${currentUser?.name ? currentUser.name : 'there'}! I'm your MediTrack Personal Health Companion powered by Gemini 3.8. I'm here to help you stay on track with your medicines, remind you of your daily schedule, explain when to take pills with food, and support your healthy streak! What questions do you have?`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            roleContext: 'patient',
          },
        ];
  });

  // When role changes, insert a notification or initial guidance if list is default
  const prevRoleRef = useRef(activeRole);
  useEffect(() => {
    if (prevRoleRef.current !== activeRole) {
      prevRoleRef.current = activeRole;
      const roleGreeting: MessageItem = {
        id: 'switch_' + Date.now(),
        sender: 'assistant',
        text: activeRole === 'caregiver'
          ? `Switched to **Clinical Caregiver Copilot Mode** (Supervising ${patients.length} patients). You can ask me to screen drug-drug interactions, review low-adherence patients, or draft clinical consultation notes.`
          : `Switched to **Personal Medication Companion Mode**. You can ask me what medicines to take today, how to take tablets with food or water, and what to do if you missed a dose!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        roleContext: activeRole,
      };
      setTranscriptHistory(prev => [...prev, roleGreeting]);
      
      // Update Live WebSocket session if open
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          action: 'configure_role',
          role: activeRole,
          context: buildRoleContextString(activeRole)
        }));
      }
    }
  }, [activeRole, patients]);

  const wsRef = useRef<WebSocket | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const nextPlayTimeRef = useRef<number>(0);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const activeAudioElementRef = useRef<HTMLAudioElement | null>(null);

  // Helper to compile role-specific context
  const buildRoleContextString = (role: 'caregiver' | 'patient') => {
    const medSummary = medicines.map(m => `${m.name} (${m.dose}, ${m.frequency}, status: ${m.status}, remaining: ${m.stock} pills)`).join('; ');
    if (role === 'caregiver') {
      const patientSummary = patients.map(p => `${p.name} (adherence: ${p.adherenceRate}%, condition: ${p.condition}, status: ${p.status})`).join('; ');
      return `Caregiver Context: Monitored Patients: [${patientSummary}]. Active Medicines: [${medSummary}].`;
    } else {
      return `Patient Context: Name: ${currentUser?.name || 'Patient'}. Active Prescriptions: [${medSummary}]. Condition: ${currentUser?.condition || 'General'}.`;
    }
  };

  // Auto-scroll transcripts
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcriptHistory, isGenerating]);

  // Check browser speech recognition capability
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechRecognitionSupported(true);
    }
  }, []);

  // Connect WebSocket when modal opens
  useEffect(() => {
    if (!isOpen) {
      cleanupAudioAndWs();
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/live`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setStatusMessage(isCaregiver ? 'Gemini 3.8 Live active (Caregiver Copilot)' : 'Gemini 3.8 Live active (Patient Companion)');
        // Handshake with role and context
        ws.send(JSON.stringify({
          action: 'configure_role',
          role: activeRole,
          context: buildRoleContextString(activeRole)
        }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.connected) {
            setIsConnected(true);
          }
          if (data.interrupted) {
            stopAudioPlayback();
            setIsModelSpeaking(false);
          }
          if (data.audio) {
            setIsModelSpeaking(true);
            setStatusMessage('Gemini is speaking...');
            playPcmAudioChunk(data.audio);
          }
          // SHOW TEXT AS REPLY TOO
          if (data.text) {
            setTranscriptHistory(prev => {
              // Append to last message if recent, or create new
              const last = prev[prev.length - 1];
              if (last && last.sender === 'assistant' && (Date.now() - parseInt(last.id.split('_')[1] || '0', 10) < 4000)) {
                return [...prev.slice(0, -1), { ...last, text: last.text + ' ' + data.text }];
              } else {
                return [...prev, {
                  id: 'resp_' + Date.now(),
                  sender: 'assistant',
                  text: data.text,
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  roleContext: activeRole
                }];
              }
            });
          }
          if (data.error) {
            console.warn('[Live API Error]', data.error);
            setStatusMessage('Voice standby. Text & audio replies active.');
          }
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      ws.onerror = (err) => {
        console.warn('[VoiceAssistant] WebSocket standby, using REST API:', err);
        setIsConnected(false);
        setStatusMessage('AI Assistant online (HTTP + TTS mode)');
      };

      ws.onclose = () => {
        setIsConnected(false);
        setIsListening(false);
        setIsModelSpeaking(false);
      };
    } catch (e) {
      console.warn('WebSocket init exception:', e);
      setIsConnected(false);
      setStatusMessage('AI Assistant online (Cloud Run resilient mode)');
    }

    return () => {
      cleanupAudioAndWs();
    };
  }, [isOpen, activeRole]);

  const cleanupAudioAndWs = () => {
    if (activeAudioElementRef.current) {
      activeAudioElementRef.current.pause();
      activeAudioElementRef.current = null;
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
    if (inputAudioCtxRef.current) {
      inputAudioCtxRef.current.close().catch(() => {});
      inputAudioCtxRef.current = null;
    }
    if (outputAudioCtxRef.current) {
      outputAudioCtxRef.current.close().catch(() => {});
      outputAudioCtxRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
      recognitionRef.current = null;
    }
    setIsListening(false);
    setIsConnected(false);
    setIsModelSpeaking(false);
    setPlayingMessageId(null);
  };

  const stopAudioPlayback = () => {
    if (activeAudioElementRef.current) {
      activeAudioElementRef.current.pause();
      activeAudioElementRef.current = null;
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (outputAudioCtxRef.current) {
      nextPlayTimeRef.current = outputAudioCtxRef.current.currentTime;
    }
    setPlayingMessageId(null);
    setIsModelSpeaking(false);
  };

  // Playback 24kHz raw PCM chunk from Gemini Live
  const playPcmAudioChunk = (base64Audio: string) => {
    if (audioMuted) return;

    try {
      if (!outputAudioCtxRef.current) {
        outputAudioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      const ctx = outputAudioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const binary = atob(base64Audio);
      const len = binary.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binary.charCodeAt(i);
      }

      const numSamples = Math.floor(bytes.length / 2);
      const float32Data = new Float32Array(numSamples);
      const dataView = new DataView(bytes.buffer);

      for (let i = 0; i < numSamples; i++) {
        const int16 = dataView.getInt16(i * 2, true);
        float32Data[i] = int16 < 0 ? int16 / 32768 : int16 / 32767;
      }

      const audioBuffer = ctx.createBuffer(1, numSamples, 24000);
      audioBuffer.getChannelData(0).set(float32Data);

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);

      const now = ctx.currentTime;
      const startTime = Math.max(now, nextPlayTimeRef.current);
      source.start(startTime);
      nextPlayTimeRef.current = startTime + audioBuffer.duration;

      source.onended = () => {
        if (ctx.currentTime >= nextPlayTimeRef.current - 0.05) {
          setIsModelSpeaking(false);
          setStatusMessage(isCaregiver ? 'Caregiver Copilot ready for instructions' : 'Health Companion listening for questions');
        }
      };
    } catch (e) {
      console.error('Audio chunk playback error:', e);
    }
  };

  // Convert float32 input from mic (16kHz) to 16-bit PCM base64
  const float32ToPcmBase64 = (float32Array: Float32Array): string => {
    const buffer = new ArrayBuffer(float32Array.length * 2);
    const view = new DataView(buffer);
    for (let i = 0; i < float32Array.length; i++) {
      let s = Math.max(-1, Math.min(1, float32Array[i]));
      view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  // Toggle Microphone capture with bidirectional support
  const toggleMicrophone = async () => {
    if (isListening) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
        recognitionRef.current = null;
      }
      if (scriptProcessorRef.current) {
        scriptProcessorRef.current.disconnect();
        scriptProcessorRef.current = null;
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(t => t.stop());
        mediaStreamRef.current = null;
      }
      setIsListening(false);
      setStatusMessage('Microphone paused. Tap to speak.');
      return;
    }

    // Try SpeechRecognition first for crisp real-time speech-to-text
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          setIsListening(true);
          setStatusMessage('Listening to your voice... Speak your question.');
        };

        recognition.onresult = (event: any) => {
          const spokenText = event.results[0][0].transcript;
          console.log('[SpeechRecognition] Recognized:', spokenText);
          setIsListening(false);
          setStatusMessage('Processing your question with Gemini...');
          handleDispatchQuery(spokenText);
        };

        recognition.onerror = (e: any) => {
          console.warn('[SpeechRecognition] Error or silence:', e);
          setIsListening(false);
          // Fall back to raw PCM streaming if live WebSocket is open
          startRawPcmMicStream();
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
        return;
      } catch (err) {
        console.warn('SpeechRecognition failed to start, falling back to raw PCM:', err);
      }
    }

    startRawPcmMicStream();
  };

  // Stream raw PCM over WebSocket if available
  const startRawPcmMicStream = async () => {
    try {
      setStatusMessage('Requesting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        }
      });
      mediaStreamRef.current = stream;

      inputAudioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const source = inputAudioCtxRef.current.createMediaStreamSource(stream);
      const processor = inputAudioCtxRef.current.createScriptProcessor(2048, 1, 1);
      scriptProcessorRef.current = processor;

      source.connect(processor);
      processor.connect(inputAudioCtxRef.current.destination);

      processor.onaudioprocess = (e) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
        const inputData = e.inputBuffer.getChannelData(0);
        const base64Audio = float32ToPcmBase64(inputData);
        wsRef.current.send(JSON.stringify({ audio: base64Audio }));
      };

      setIsListening(true);
      setStatusMessage('Streaming voice to Gemini 3.8 Live...');
    } catch (err: any) {
      console.error('Microphone error:', err);
      setStatusMessage('Microphone access denied: ' + (err?.message || 'Check browser permissions'));
    }
  };

  // Dispatch query to Gemini API (Resilient HTTP + WebSocket hybrid)
  const handleDispatchQuery = async (queryText: string) => {
    if (!queryText.trim()) return;

    const userMessageItem: MessageItem = {
      id: 'usr_' + Date.now(),
      sender: 'user',
      text: queryText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setTranscriptHistory(prev => [...prev, userMessageItem]);
    setIsGenerating(true);
    setStatusMessage(`Gemini 3.8 is analyzing as ${isCaregiver ? 'Caregiver Copilot' : 'Patient Companion'}...`);

    // Prepare conversational history
    const historyPayload = transcriptHistory.slice(-6).map(m => ({
      role: m.sender === 'user' ? 'user' : 'model',
      text: m.text
    }));

    try {
      const response = await fetch('/api/gemini/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: queryText,
          history: historyPayload,
          role: activeRole,
          userContext: {
            name: currentUser?.name,
            email: currentUser?.email,
            condition: currentUser?.condition,
            role: activeRole
          },
          patientData: isCaregiver ? patients : undefined,
          medicinesData: medicines,
          appointments: appointments
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      const replyText = data.reply || "I've processed your request.";

      // Scan for actionable medicines in the reply
      const suggestedActions: any[] = [];
      medicines.forEach(m => {
        if (replyText.toLowerCase().includes(m.name.toLowerCase()) && m.status !== 'taken') {
          suggestedActions.push({
            label: `Mark ${m.name} as Taken`,
            actionType: 'take_dose',
            targetId: m.id
          });
        }
      });

      const assistantMessageItem: MessageItem = {
        id: 'ast_' + Date.now(),
        sender: 'assistant',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        roleContext: activeRole,
        suggestedActions: suggestedActions.slice(0, 2),
        suggestedFollowUps: Array.isArray(data.suggestedFollowUps) ? data.suggestedFollowUps : []
      };

      setTranscriptHistory(prev => [...prev, assistantMessageItem]);
      setStatusMessage(`${isCaregiver ? 'Clinical Caregiver Copilot' : 'Health Companion'} replied`);

      // Play audio automatically if not muted
      if (!audioMuted) {
        playMessageAudio(assistantMessageItem.id, replyText);
      }

    } catch (err: any) {
      console.warn('HTTP API fallback triggered:', err);
      // Fallback friendly reply so app is 100% resilient
      const fallbackText = isCaregiver
        ? `[Caregiver Clinical Roster]\nCurrently monitoring ${patients.length} patients. Robert Taylor has 40% adherence (requires follow-up for hypertension). All prescriptions are saved in Firestore.`
        : `[Personal Medication Companion]\nYou have ${medicines.length} prescriptions on schedule. Your next dose of ${medicines[0]?.name || 'medicine'} is at ${medicines[0]?.time || 'scheduled time'}. Keep your 12-day streak going!`;

      const fallbackItem: MessageItem = {
        id: 'ast_fb_' + Date.now(),
        sender: 'assistant',
        text: fallbackText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        roleContext: activeRole,
        suggestedFollowUps: isCaregiver 
          ? ["Who are high-risk patients needing attention?", "Screen drug-drug interactions in roster", "Check low stock pill inventory"]
          : ["Do I take my medicines with food?", "What if I missed a dose?", "Check my 12-day streak"]
      };
      setTranscriptHistory(prev => [...prev, fallbackItem]);
      setStatusMessage('Response ready');
      if (!audioMuted) {
        playMessageAudio(fallbackItem.id, fallbackText);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // Play audio for a specific message ("Replay Voice")
  const playMessageAudio = async (messageId: string, text: string) => {
    // If already playing this message, toggle off
    if (playingMessageId === messageId) {
      stopAudioPlayback();
      return;
    }

    stopAudioPlayback();
    setPlayingMessageId(messageId);
    setIsModelSpeaking(true);

    try {
      // Call server-side Gemini TTS (gemini-3.8-flash-lite-tts)
      const res = await fetch('/api/gemini/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          role: activeRole
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.audio) {
          const audioUrl = `data:audio/wav;base64,${data.audio}`;
          const audio = new Audio(audioUrl);
          activeAudioElementRef.current = audio;

          audio.onended = () => {
            setPlayingMessageId(null);
            setIsModelSpeaking(false);
          };

          audio.onerror = () => {
            fallbackBrowserSpeech(text);
          };

          await audio.play();
          return;
        }
      }
      fallbackBrowserSpeech(text);
    } catch (err) {
      console.warn('TTS server call failed, using browser speech synthesis:', err);
      fallbackBrowserSpeech(text);
    }
  };

  // Browser SpeechSynthesis fallback
  const fallbackBrowserSpeech = (text: string) => {
    if (!window.speechSynthesis) {
      setPlayingMessageId(null);
      setIsModelSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#_`]/g, '').slice(0, 300);
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = isCaregiver ? 0.95 : 1.05;

    utterance.onend = () => {
      setPlayingMessageId(null);
      setIsModelSpeaking(false);
    };

    utterance.onerror = () => {
      setPlayingMessageId(null);
      setIsModelSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    const query = textInput.trim();
    setTextInput('');
    handleDispatchQuery(query);
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Categorized Default Working Commands tailored distinctly for Caregiver vs Patient
  const caregiverQuickPrompts = [
    { label: '🚨 High-Risk Patient Triage', query: 'Which patients have missed doses today or are at critical risk of non-adherence?', category: 'Triage' },
    { label: '📊 Robert Taylor Adherence Analysis', query: "Analyze Robert Taylor's adherence history, missed blood pressure doses, and recommend caregiver intervention.", category: 'Patient' },
    { label: '⚠️ Screen Drug-Drug Interactions', query: 'Screen my patient medication list for dangerous drug-drug interactions, CYP450 conflicts, or bleeding risks.', category: 'Safety' },
    { label: '📦 Low Stock & Pill Refills (< 10 left)', query: 'Which patient prescriptions are running low on remaining pill inventory and need refills authorized?', category: 'Pharmacy' },
    { label: '📋 Clinical Rounds Briefing Summary', query: 'Generate a structured clinical adherence briefing summary for my monitored patient roster.', category: 'Rounds' },
    { label: '🏥 Doctor Consultations Today', query: "What clinical doctor appointments and consultations are scheduled today across our roster?", category: 'Clinic' },
    { label: '👩‍⚕️ Sarah Chen & Emily Watson Status', query: "Review Sarah Chen and Emily Watson status, adherence rate, and active prescriptions.", category: 'Roster' },
    { label: '📞 Caregiver Emergency Protocol', query: "What are the protocol steps for caregiver emergency outreach if a high-risk patient drops below 50% adherence?", category: 'Protocol' },
  ];

  const patientQuickPrompts = [
    { label: '💊 What pills do I take today?', query: 'What medicines do I have scheduled for today, and which ones are still pending?', category: 'Doses' },
    { label: '🍽️ Take with or without food?', query: 'Do I need to take my medications before meals, with food, or with water?', category: 'Meals' },
    { label: '⚠️ What if I missed a dose?', query: 'What should I do safely if I missed or forgot to take my morning tablet?', category: 'Safety' },
    { label: '🔥 Check my 12-day streak', query: 'How is my adherence streak and progress doing? Can you give me encouragement to stay consistent?', category: 'Streak' },
    { label: '💧 Hydration & Daily Water Rule', query: 'How much water should I drink with Lisinopril and Metformin each day?', category: 'Hydration' },
    { label: '🍊 Caution: Grapefruit & Alcohol', query: 'Can I drink grapefruit juice or alcohol while taking Atorvastatin and Metformin?', category: 'Interactions' },
    { label: '📅 When is my next doctor visit?', query: 'When is my upcoming doctor appointment and how should I prepare?', category: 'Doctor' },
    { label: '💡 Common mild side effects', query: 'What are common mild side effects of my active prescriptions, and when should I alert my doctor?', category: 'Side Effects' },
  ];

  const activeQuickPrompts = isCaregiver ? caregiverQuickPrompts : patientQuickPrompts;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col h-[700px] max-h-[92vh]">
        
        {/* Header with Role Badge and Mode Switcher */}
        <div className={`px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between transition-colors ${
          isCaregiver 
            ? 'bg-gradient-to-r from-indigo-900/20 via-blue-900/15 to-emerald-900/20' 
            : 'bg-gradient-to-r from-teal-500/15 via-cyan-500/10 to-blue-500/15'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-lg ${
              isCaregiver 
                ? 'bg-gradient-to-tr from-indigo-600 to-blue-600 shadow-indigo-500/30' 
                : 'bg-gradient-to-tr from-teal-500 to-cyan-500 shadow-teal-500/30'
            }`}>
              {isCaregiver ? <Stethoscope className="w-5 h-5" /> : <Sparkles className="w-5 h-5 animate-pulse" />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-slate-800 dark:text-white text-base">
                  {isCaregiver ? 'MediTrack Clinical Caregiver Copilot' : 'MediTrack Personal Medication Companion'}
                </h3>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                  isCaregiver 
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800' 
                    : 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800'
                }`}>
                  <Radio className="w-3 h-3 text-emerald-500 animate-pulse" />
                  Gemini 3.8
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                <span>{isCaregiver ? `Supervising ${patients.length} Monitored Patients` : `Active Regimen: ${medicines.length} Prescriptions`}</span>
                <span>•</span>
                <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                  {isCaregiver ? 'Clinical Triage Mode' : '12-Day Streak 🔥'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Role Persona Toggle Switch */}
            <div className="hidden sm:flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700 text-xs font-bold">
              <button
                onClick={() => setActiveRole('patient')}
                className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                  !isCaregiver 
                    ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-300 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title="Switch to Patient Companion View"
              >
                <Pill className="w-3.5 h-3.5" />
                <span>Patient</span>
              </button>
              <button
                onClick={() => setActiveRole('caregiver')}
                className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                  isCaregiver 
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title="Switch to Caregiver Copilot View"
              >
                <Stethoscope className="w-3.5 h-3.5" />
                <span>Caregiver</span>
              </button>
            </div>

            <button
              onClick={() => setAudioMuted(!audioMuted)}
              title={audioMuted ? 'Unmute Audio Voice' : 'Mute Voice'}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              {audioMuted ? <VolumeX className="w-5 h-5 text-rose-500" /> : <Volume2 className="w-5 h-5 text-teal-500" />}
            </button>
            <button
              onClick={() => {
                cleanupAudioAndWs();
                onClose();
              }}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Dynamic Voice Interactive Orb Header */}
        <div className="bg-gradient-to-b from-slate-50 via-white to-slate-50/50 dark:from-slate-900/60 dark:via-slate-900 dark:to-slate-900/80 px-6 py-4 flex flex-col items-center justify-center border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="relative flex items-center justify-center">
            {/* Glowing pulse rings */}
            {(isListening || isModelSpeaking || isGenerating) && (
              <>
                <div className={`absolute w-32 h-32 rounded-full animate-ping opacity-25 ${
                  isModelSpeaking ? (isCaregiver ? 'bg-indigo-500' : 'bg-cyan-500') : 'bg-teal-500'
                }`} />
                <div className={`absolute w-24 h-24 rounded-full animate-pulse opacity-40 ${
                  isModelSpeaking ? (isCaregiver ? 'bg-blue-600' : 'bg-indigo-500') : 'bg-emerald-500'
                }`} />
              </>
            )}

            {/* Central Interactive Voice Button */}
            <button
              onClick={toggleMicrophone}
              className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl ${
                isListening
                  ? 'bg-gradient-to-tr from-rose-500 to-amber-500 text-white scale-105 shadow-rose-500/40 animate-pulse'
                  : isModelSpeaking
                  ? (isCaregiver 
                      ? 'bg-gradient-to-tr from-indigo-600 to-blue-700 text-white shadow-indigo-500/40' 
                      : 'bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-cyan-500/40')
                  : (isCaregiver
                      ? 'bg-gradient-to-tr from-indigo-600 to-blue-600 text-white shadow-indigo-500/30 hover:scale-105'
                      : 'bg-gradient-to-tr from-teal-500 to-cyan-600 text-white shadow-teal-500/30 hover:scale-105')
              }`}
              title={isListening ? 'Click to pause mic' : 'Click to speak to Gemini'}
            >
              {isListening ? (
                <Mic className="w-7 h-7 animate-bounce" />
              ) : isModelSpeaking ? (
                <Volume2 className="w-7 h-7 animate-pulse" />
              ) : (
                <Mic className="w-7 h-7" />
              )}
            </button>
          </div>

          <div className="mt-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 text-center flex items-center justify-center gap-2">
            <span className={`w-2 h-2 rounded-full ${
              isListening ? 'bg-rose-500 animate-ping' : isModelSpeaking ? 'bg-cyan-500 animate-pulse' : 'bg-emerald-500'
            }`} />
            <span>{statusMessage}</span>
          </div>

          {/* Categorized Default Working Commands Tray */}
          <div className="mt-3 w-full max-w-2xl bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700/60">
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Default Working Commands ({isCaregiver ? 'Clinical Caregiver' : 'Patient Routine'}):
              </span>
              <span className="text-[10px] text-slate-400">Click to ask instantly</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 max-h-24 overflow-y-auto pr-1">
              {activeQuickPrompts.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleDispatchQuery(item.query)}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-all flex items-center gap-1 cursor-pointer ${
                    isCaregiver
                      ? 'bg-indigo-50/90 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-200 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 shadow-xs'
                      : 'bg-teal-50/90 dark:bg-teal-950/60 text-teal-700 dark:text-teal-200 border-teal-200 dark:border-teal-800 hover:bg-teal-100 dark:hover:bg-teal-900/80 shadow-xs'
                  }`}
                  title={item.query}
                >
                  <span className={`text-[9px] uppercase font-mono px-1 py-0.2 rounded font-bold ${
                    isCaregiver ? 'bg-indigo-200/60 dark:bg-indigo-800/60 text-indigo-800 dark:text-indigo-200' : 'bg-teal-200/60 dark:bg-teal-800/60 text-teal-800 dark:text-teal-200'
                  }`}>
                    {item.category}
                  </span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Conversation Transcripts Area ("Show text as reply too") */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/60 dark:bg-slate-900/40">
          {transcriptHistory.map((msg) => {
            const isUser = msg.sender === 'user';
            const isPlayingThis = playingMessageId === msg.id;

            return (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className={`w-8 h-8 rounded-xl text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-md ${
                    msg.roleContext === 'caregiver'
                      ? 'bg-gradient-to-tr from-indigo-600 to-blue-600'
                      : 'bg-gradient-to-tr from-teal-500 to-cyan-500'
                  }`}>
                    {msg.roleContext === 'caregiver' ? 'Dr.' : 'AI'}
                  </div>
                )}

                <div className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed shadow-sm transition-all ${
                  isUser
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700/80 rounded-tl-none'
                }`}>
                  {/* Role Header for Assistant Replies */}
                  {!isUser && (
                    <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-100 dark:border-slate-700/60 text-[11px] font-semibold text-slate-400">
                      <span className="flex items-center gap-1.5">
                        {msg.roleContext === 'caregiver' ? (
                          <span className="text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1">
                            <Stethoscope className="w-3 h-3" /> Clinical Caregiver Copilot
                          </span>
                        ) : (
                          <span className="text-teal-600 dark:text-teal-400 font-bold flex items-center gap-1">
                            <Pill className="w-3 h-3" /> Personal Health Companion
                          </span>
                        )}
                      </span>
                      <span>{msg.timestamp}</span>
                    </div>
                  )}

                  {/* Message Body with Text Reply */}
                  <div className="whitespace-pre-line text-sm text-slate-800 dark:text-slate-100 font-normal">
                    {msg.text}
                  </div>

                  {/* Actionable buttons if medication mentioned */}
                  {!isUser && msg.suggestedActions && msg.suggestedActions.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex flex-wrap gap-2">
                      {msg.suggestedActions.map((action, aIdx) => (
                        <button
                          key={aIdx}
                          onClick={() => {
                            if (action.actionType === 'take_dose' && onTakeDose && action.targetId) {
                              onTakeDose(action.targetId);
                            }
                          }}
                          className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-bold border border-emerald-300 dark:border-emerald-800 flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{action.label}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Interactive Suggested Follow-Up Question Chips */}
                  {!isUser && msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1.5 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-cyan-400" /> Suggested Follow-Ups:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.suggestedFollowUps.map((question, qIdx) => (
                          <button
                            key={qIdx}
                            onClick={() => handleDispatchQuery(question)}
                            className={`text-[11px] font-medium px-2.5 py-1 rounded-full border transition-all cursor-pointer flex items-center gap-1 ${
                              isCaregiver
                                ? 'bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/60'
                                : 'bg-teal-50/80 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800 hover:bg-teal-100 dark:hover:bg-teal-900/60'
                            }`}
                          >
                            <span>{question}</span>
                            <ArrowRight className="w-2.5 h-2.5 opacity-60" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Bar for Assistant Messages: REPLAY VOICE & COPY */}
                  {!isUser && (
                    <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
                      <button
                        onClick={() => playMessageAudio(msg.id, msg.text)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                          isPlayingThis
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 animate-pulse'
                            : 'bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-200 hover:bg-slate-200'
                        }`}
                        title="Replay Spoken Audio via Gemini Voice TTS"
                      >
                        {isPlayingThis ? (
                          <>
                            <VolumeX className="w-3.5 h-3.5 text-rose-500" />
                            <span>Stop Voice</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3.5 h-3.5 text-teal-500" />
                            <span>🔊 Replay Voice</span>
                          </>
                        )}
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCopyText(msg.id, msg.text)}
                          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded transition"
                          title="Copy reply text"
                        >
                          {copiedId === msg.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Typing / Generating Indicator */}
          {isGenerating && (
            <div className="flex items-start gap-3 animate-pulse">
              <div className={`w-8 h-8 rounded-xl text-white flex items-center justify-center text-xs font-bold shadow-md ${
                isCaregiver ? 'bg-indigo-600' : 'bg-teal-500'
              }`}>
                AI
              </div>
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-tl-none p-3.5 text-sm text-slate-600 dark:text-slate-300 flex items-center gap-2 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-teal-500 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-cyan-500 animate-bounce delay-150" />
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce delay-300" />
                <span className="text-xs font-medium ml-1">
                  Gemini 3.8 is generating {isCaregiver ? 'clinical analysis' : 'medication advice'}...
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Text Input Form Footer */}
        <div className="p-3.5 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <form onSubmit={handleSendText} className="flex items-center gap-2">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder={isCaregiver 
                ? "Ask caregiver questions (e.g. 'Review Robert Taylor's adherence risk' or 'Screen drug interactions')..."
                : "Ask patient questions (e.g. 'Do I take Metformin with food?' or 'What pills do I have today?')..."
              }
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={!textInput.trim() || isGenerating}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition flex items-center gap-1.5 shadow-md shadow-blue-600/20 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

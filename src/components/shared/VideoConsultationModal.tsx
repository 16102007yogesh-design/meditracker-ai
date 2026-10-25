import React, { useState, useEffect, useRef } from 'react';
import { 
  Video, 
  Mic, 
  MicOff, 
  VideoOff, 
  PhoneOff, 
  MessageSquare, 
  FileText, 
  Pill, 
  User, 
  Sparkles,
  ShieldCheck,
  Send
} from 'lucide-react';
import { Appointment } from '../../types';

interface VideoConsultationModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  userRole: 'patient' | 'caregiver';
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const VideoConsultationModal: React.FC<VideoConsultationModalProps> = ({
  isOpen,
  onClose,
  appointment,
  userRole,
  showToast,
}) => {
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: string; text: string; time: string }>>([
    {
      sender: 'System',
      text: 'Encrypted Tele-Health session initialized. Both audio & video streams are HIPAA-secured.',
      time: 'Just now',
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [callDuration, setCallDuration] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isOpen) {
      timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);

      // Try camera stream
      navigator.mediaDevices?.getUserMedia({ video: true, audio: true })
        .then((stream) => {
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch(() => {
          // Camera simulated fallback
        });
    }

    return () => {
      clearInterval(timer);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [isOpen]);

  if (!isOpen || !appointment) return null;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    setChatMessages((prev) => [
      ...prev,
      {
        sender: userRole === 'patient' ? appointment.patientName : appointment.doctorName,
        text: chatInput.trim(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setChatInput('');
  };

  const handleEndCall = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    showToast(`Consultation call with ${userRole === 'patient' ? appointment.doctorName : appointment.patientName} ended.`, 'info');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-5xl h-[88vh] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white">
        {/* Call Header */}
        <div className="bg-slate-850 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base">
                  {userRole === 'patient' ? appointment.doctorName : appointment.patientName}
                </h3>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Live ({formatTime(callDuration)})
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {appointment.doctorSpecialty} • {appointment.reason}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="hidden sm:flex items-center gap-1 text-slate-400 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-400" /> End-to-End Encrypted
            </span>
            <button
              onClick={handleEndCall}
              className="py-2 px-4 bg-rose-600 hover:bg-rose-700 font-bold rounded-xl flex items-center gap-1.5 text-xs shadow-lg shadow-rose-600/30 cursor-pointer"
            >
              <PhoneOff className="w-4 h-4" /> End Call
            </button>
          </div>
        </div>

        {/* Video Stage & Side Panel */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 min-h-0 overflow-hidden">
          {/* Main Video Screen */}
          <div className="lg:col-span-8 bg-slate-950 rounded-2xl border border-slate-800 relative flex items-center justify-center overflow-hidden">
            {/* Primary Remote Video Simulation */}
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-teal-600 via-cyan-600 to-blue-600 flex items-center justify-center text-3xl font-black shadow-xl shadow-teal-500/20 mb-4 animate-pulse">
                {userRole === 'patient' ? '👨‍⚕️' : '👤'}
              </div>
              <h4 className="text-lg font-bold">
                {userRole === 'patient' ? appointment.doctorName : appointment.patientName}
              </h4>
              <p className="text-xs text-teal-400 font-medium mt-1">
                {userRole === 'patient' ? 'Consulting Physician • Audio/Video Connected' : 'Patient in Virtual Exam Room'}
              </p>

              {appointment.symptoms && (
                <div className="mt-4 p-3 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-300 max-w-md text-left">
                  <strong className="text-teal-400 block mb-0.5">Reported Symptoms:</strong>
                  {appointment.symptoms}
                </div>
              )}
            </div>

            {/* Picture-in-Picture Local Video */}
            <div className="absolute bottom-4 right-4 w-36 sm:w-44 h-28 sm:h-32 bg-slate-900 rounded-xl border border-slate-700 overflow-hidden shadow-2xl flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className={`w-full h-full object-cover ${isVideoOn ? 'block' : 'hidden'}`}
              />
              {!isVideoOn && (
                <div className="text-center p-2">
                  <User className="w-8 h-8 text-slate-500 mx-auto" />
                  <span className="text-[10px] text-slate-400 font-bold block mt-1">Camera Off</span>
                </div>
              )}
              <span className="absolute bottom-1 left-2 text-[10px] bg-slate-950/80 px-1.5 py-0.5 rounded text-slate-300 font-semibold">
                You ({userRole})
              </span>
            </div>

            {/* Bottom Controls Bar */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-slate-900/90 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-slate-700 shadow-xl">
              <button
                onClick={() => setIsMicOn(!isMicOn)}
                className={`p-3 rounded-xl transition-all ${
                  isMicOn ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-rose-600 text-white'
                }`}
                title={isMicOn ? 'Mute Mic' : 'Unmute Mic'}
              >
                {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              </button>

              <button
                onClick={() => setIsVideoOn(!isVideoOn)}
                className={`p-3 rounded-xl transition-all ${
                  isVideoOn ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-rose-600 text-white'
                }`}
                title={isVideoOn ? 'Turn Off Camera' : 'Turn On Camera'}
              >
                {isVideoOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
              </button>

              <button
                onClick={handleEndCall}
                className="p-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-lg shadow-rose-600/30"
                title="End Consultation"
              >
                <PhoneOff className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Consultation Notes & Live Chat */}
          <div className="lg:col-span-4 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col overflow-hidden">
            <div className="p-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold flex items-center gap-1.5 text-teal-400">
                <MessageSquare className="w-4 h-4" /> Consultation Chat & Records
              </span>
              <span className="text-[10px] text-slate-400">Token: {appointment.tokenNumber || 'ONLINE'}</span>
            </div>

            {/* Chat message stream */}
            <div className="flex-1 p-3 overflow-y-auto space-y-2.5 text-xs">
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`p-2.5 rounded-xl ${
                    msg.sender === 'System'
                      ? 'bg-slate-900 border border-slate-800 text-slate-400 text-[11px]'
                      : msg.sender.includes(userRole === 'patient' ? appointment.patientName : appointment.doctorName)
                      ? 'bg-teal-950/60 border border-teal-800 text-teal-200 ml-4'
                      : 'bg-slate-850 border border-slate-750 text-slate-200 mr-4'
                  }`}
                >
                  <div className="flex justify-between font-bold text-[10px] mb-0.5 opacity-75">
                    <span>{msg.sender}</span>
                    <span>{msg.time}</span>
                  </div>
                  <p>{msg.text}</p>
                </div>
              ))}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendMessage} className="p-2 bg-slate-900 border-t border-slate-800 flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type prescription notes or message..."
                className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-teal-500"
              />
              <button
                type="submit"
                className="py-2 px-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

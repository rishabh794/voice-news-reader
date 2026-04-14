import React, { useState, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/auth-context';
import API from '../services/api';

const VoiceAssistant = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    
    const mediaRecorder = useRef<MediaRecorder | null>(null);
    const audioChunks = useRef<Blob[]>([]);
    
    const authContext = useContext(AuthContext);
    const navigate = useNavigate();

    if (!authContext?.isAuthenticated) return null;

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            mediaRecorder.current = new MediaRecorder(stream);
            audioChunks.current = [];

            mediaRecorder.current.ondataavailable = (event) => {
                audioChunks.current.push(event.data);
            };

            mediaRecorder.current.onstop = async () => {
                setIsProcessing(true);
                const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
                stream.getTracks().forEach(track => track.stop());
                
                const formData = new FormData();
                formData.append('audio', audioBlob, 'recording.webm');

                try {
                    const transcribeRes = await API.post('/transcribe', formData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });

                    const spokenText = transcribeRes.data.text?.toLowerCase();
                    if (!spokenText) return;

                    if (spokenText.includes('history')) {
                        navigate('/history');
                        return;
                    }

                    if (spokenText.includes('dashboard')) {
                        navigate('/dashboard');
                        return;
                    }

                    const intentRes = await API.post('/intent', { query: spokenText });
                    const fullPayload = intentRes.data;

                    if (fullPayload.action === 'search' && fullPayload.topic) {
                        navigate('/dashboard', { state: { agentPayload: fullPayload } });
                    }

                } catch (error) {
                    console.error("AI Pipeline failed:", error);
                } finally {
                    setIsProcessing(false);
                }
            };

            mediaRecorder.current.start();
            setIsRecording(true);
        } catch (error) {
            console.error("Microphone access denied or failed:", error);
        }
    };

    const stopRecording = () => {
        if (mediaRecorder.current && isRecording) {
            mediaRecorder.current.stop();
            setIsRecording(false);
        }
    };

    return (
        <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-4">
            
            {/* System Processing Tooltip */}
            {isProcessing && (
                <div className="flex items-center gap-3 bg-[#13131a]/95 backdrop-blur-md border border-indigo-500/40 px-4 py-2.5 rounded-lg shadow-[0_0_15px_rgba(99,102,241,0.15)] font-mono">
                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-ping"></span>
                    <span className="text-indigo-400 text-xs font-medium uppercase tracking-widest">
                        Analyzing Intent_
                    </span>
                </div>
            )}
            
            {/* Main Action Button */}
            <button
                onMouseDown={startRecording}
                onMouseUp={stopRecording}
                onMouseLeave={stopRecording} 
                onTouchStart={startRecording} 
                onTouchEnd={stopRecording}
                className={`relative group flex items-center justify-center w-16 h-16 rounded-full outline-none transition-all duration-300 select-none ${
                    isRecording 
                        ? 'bg-[#0d0d12] border-2 border-cyan-400 scale-110 shadow-[0_0_25px_rgba(6,182,212,0.4)]' 
                        : isProcessing 
                        ? 'bg-[#13131a] border border-indigo-500/50 cursor-wait shadow-[0_0_15px_rgba(99,102,241,0.2)]' 
                        : 'bg-[#13131a] border border-gray-700 hover:border-cyan-500/50 hover:bg-[#16161f] hover:scale-105 shadow-lg'
                }`}
            >
                {/* Active Recording Pulse Ring */}
                {isRecording && (
                    <div className="absolute inset-0 rounded-full border border-cyan-400 animate-[ping_1.5s_cubic-bezier(0,0,0.2,1)_infinite] opacity-40"></div>
                )}

                {/* Dynamic Icon States */}
                {isProcessing ? (
                    // Spinner Icon
                    <svg className="w-6 h-6 text-indigo-400 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                ) : isRecording ? (
                    // Listening Audio Waves
                    <div className="flex items-center gap-1">
                        <span className="w-1 h-4 bg-cyan-400 rounded-full animate-[bounce_1s_infinite_0.1s]"></span>
                        <span className="w-1 h-6 bg-cyan-400 rounded-full animate-[bounce_1s_infinite_0.2s]"></span>
                        <span className="w-1 h-4 bg-cyan-400 rounded-full animate-[bounce_1s_infinite_0.3s]"></span>
                    </div>
                ) : (
                    // Default Mic Icon
                    <svg className="w-6 h-6 text-gray-400 group-hover:text-cyan-400 transition-colors duration-300" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                    </svg>
                )}
            </button>
        </div>
    );
};

export default VoiceAssistant;
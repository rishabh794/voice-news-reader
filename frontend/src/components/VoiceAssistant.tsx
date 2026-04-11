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
                    const { action, topic } = intentRes.data;

                    if (action === 'search' && topic) {
                        navigate('/dashboard', { state: { voiceQuery: topic } });
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
        <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-3">
            {isProcessing && (
                <div className="bg-gray-800 text-white p-3 rounded-lg shadow-lg text-sm animate-pulse font-mono">
                    Processing...
                </div>
            )}
            
            <button
                onMouseDown={startRecording}
                onMouseUp={stopRecording}
                onMouseLeave={stopRecording} 
                onTouchStart={startRecording} 
                onTouchEnd={stopRecording}
                className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl shadow-2xl transition-all duration-200 select-none ${
                    isRecording ? 'bg-red-500 scale-110 shadow-[0_0_20px_rgba(239,68,68,0.6)]' : 
                    isProcessing ? 'bg-yellow-500 cursor-wait' : 
                    'bg-blue-600 hover:bg-blue-700 hover:scale-105'
                }`}
            >
                {isRecording ? '🛑' : isProcessing ? '⏳' : '🎙️'}
            </button>
        </div>
    );
};

export default VoiceAssistant;
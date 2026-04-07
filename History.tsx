
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LocketPhoto } from '../types';
import { storageService } from '../services/storageService';
import { geminiService } from '../services/geminiService';

interface DashboardProps {
  user: User;
  onLogout: () => void;
  replyTarget: LocketPhoto | null;
  onReplyComplete: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout, replyTarget, onReplyComplete }) => {
  const navigate = useNavigate();
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [lastLocket, setLastLocket] = useState<LocketPhoto | null>(null);
  const [isSending, setIsSending] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const photos = storageService.getPhotos();
    if (photos.length > 0) {
      setLastLocket(photos[0]);
    }
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: 1080, height: 1080 }, 
        audio: false 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        context.drawImage(videoRef.current, 0, 0, 1080, 1080);
        const dataUrl = canvasRef.current.toDataURL('image/jpeg');
        setCapturedImage(dataUrl);
      }
    }
  };

  const sendLocket = async () => {
    if (!capturedImage) return;
    setIsSending(true);
    
    const aiCaption = await geminiService.generateCaption(capturedImage);

    const newPhoto: LocketPhoto = {
      id: Date.now().toString(),
      senderId: user.id,
      senderName: user.name,
      timestamp: Date.now(),
      imageUrl: capturedImage,
      aiDescription: aiCaption,
      replyToId: replyTarget?.id
    };

    storageService.savePhoto(newPhoto);
    setLastLocket(newPhoto);
    setCapturedImage(null);
    setIsSending(false);
    onReplyComplete();
    navigate('/feed');
  };

  const handleCancel = () => {
    setCapturedImage(null);
    onReplyComplete();
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-black relative">
      {/* Top Header */}
      <div className="px-6 pt-6 pb-2 flex items-center justify-between z-10">
        <div className="flex items-center space-x-3" onClick={() => navigate('/friends')}>
          <div className="w-10 h-10 rounded-full bg-neutral-800 border border-neutral-700 overflow-hidden cursor-pointer hover:scale-105 transition-transform">
            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
          </div>
          <div>
            <span className="font-bold text-lg block leading-none">{user.name}</span>
            <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">Snap a moment</span>
          </div>
        </div>
        <button 
          onClick={onLogout}
          className="text-neutral-600 hover:text-white transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        </button>
      </div>

      {/* Reply Context Overlay */}
      {replyTarget && !capturedImage && (
        <div className="px-6 py-2 animate-in fade-in slide-in-from-top duration-300">
          <div className="bg-neutral-900/50 backdrop-blur rounded-2xl p-3 border border-yellow-400/20 flex items-center space-x-3">
             <div className="w-10 h-10 rounded-xl overflow-hidden">
               <img src={replyTarget.imageUrl} className="w-full h-full object-cover" />
             </div>
             <div className="flex-1">
               <p className="text-[10px] text-yellow-400 font-bold uppercase tracking-wider">Replying to {replyTarget.senderName}</p>
               <p className="text-xs text-neutral-400 italic truncate">"{replyTarget.aiDescription}"</p>
             </div>
             <button onClick={onReplyComplete} className="text-neutral-500 hover:text-white p-1">
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
             </button>
          </div>
        </div>
      )}

      {/* Main Camera/Widget Area */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 -mt-8">
        <div className="relative w-full aspect-square max-w-[340px] bg-neutral-900 rounded-[64px] overflow-hidden shadow-[0_0_50px_rgba(250,204,21,0.05)] border-8 border-neutral-900 group">
          {capturedImage ? (
            <img src={capturedImage} className="w-full h-full object-cover" alt="Captured" />
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover scale-x-[-1]"
              />
              {!stream && (
                <div className="absolute inset-0 flex items-center justify-center bg-neutral-900">
                  <div className="animate-pulse flex flex-col items-center">
                    <span className="text-5xl mb-4">📸</span>
                    <span className="text-xs font-black tracking-widest text-neutral-600 uppercase">Wait for it...</span>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Last Locket Preview */}
          {!capturedImage && lastLocket && !replyTarget && (
            <div className="absolute top-4 right-4 w-16 h-16 rounded-2xl border-2 border-white/20 overflow-hidden shadow-2xl opacity-60 hover:opacity-100 transition-opacity">
               <img src={lastLocket.imageUrl} className="w-full h-full object-cover" />
            </div>
          )}
        </div>

        <canvas ref={canvasRef} width="1080" height="1080" className="hidden" />

        {/* Action Controls */}
        <div className="mt-10 flex items-center justify-center space-x-8 w-full">
          {capturedImage ? (
            <>
              <button 
                onClick={handleCancel}
                className="w-16 h-16 rounded-full bg-neutral-900 flex items-center justify-center text-white active:scale-90 transition-all border border-neutral-800"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
              <button 
                onClick={sendLocket}
                disabled={isSending}
                className={`flex-1 max-w-[180px] h-16 rounded-[32px] bg-yellow-400 text-black font-black text-xl flex items-center justify-center space-x-3 active:scale-95 transition-all shadow-xl shadow-yellow-400/10 ${isSending ? 'opacity-50' : ''}`}
              >
                {isSending ? (
                  <div className="w-6 h-6 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span className="tracking-tighter">SEND</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polyline points="22 2 15 22 11 13 2 9 22 2"/></svg>
                  </>
                )}
              </button>
            </>
          ) : (
            <button 
              onClick={capturePhoto}
              className="group w-24 h-24 rounded-full border-[6px] border-neutral-800 p-2 hover:scale-105 active:scale-90 transition-all"
            >
              <div className="w-full h-full rounded-full bg-white shadow-[0_0_20px_rgba(255,255,255,0.4)] group-active:scale-95 transition-transform"></div>
            </button>
          )}
        </div>
      </div>

      {/* Bottom Floating Nav */}
      <div className="absolute bottom-10 left-0 right-0 flex justify-center px-10 pointer-events-none">
        <div className="bg-neutral-900/90 backdrop-blur-2xl border border-white/5 px-6 py-4 rounded-[40px] flex items-center space-x-10 shadow-2xl pointer-events-auto">
           <button onClick={() => navigate('/')} className="text-yellow-400 active:scale-90 transition-transform">
             <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zm0 0l-4-4m4 4l4-4"/></svg>
           </button>
           <button onClick={() => navigate('/feed')} className="text-neutral-500 hover:text-white transition-all active:scale-90">
             <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
           </button>
           <button onClick={() => navigate('/history')} className="text-neutral-500 hover:text-white transition-all active:scale-90">
             <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="10"/></svg>
           </button>
           <button onClick={() => navigate('/friends')} className="text-neutral-500 hover:text-white transition-all active:scale-90">
             <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
           </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

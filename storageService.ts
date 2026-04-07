
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LocketPhoto, Friend, PhotoComment } from '../types';
import { storageService } from '../services/storageService';

interface FeedProps {
  user: User;
  onReply: (photo: LocketPhoto) => void;
}

const Feed: React.FC<FeedProps> = ({ user, onReply }) => {
  const navigate = useNavigate();
  const [feedItems, setFeedItems] = useState<LocketPhoto[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pinnedItems, setPinnedItems] = useState<LocketPhoto[]>([]);
  const [commentInputs, setCommentInputs] = useState<{ [key: string]: string }>({});
  const [zoomedPhotoId, setZoomedPhotoId] = useState<string | null>(null);
  const [showShareToast, setShowShareToast] = useState(false);
  
  // Pull to refresh states
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const PULL_THRESHOLD = 80;

  const loadData = useCallback(async (isSilent = false) => {
    if (isRefreshing) await new Promise(resolve => setTimeout(resolve, 800));
    
    const localPhotos = storageService.getPhotos();
    const currentFriends = storageService.getFriends();
    setFriends(currentFriends);

    const pinned = localPhotos.filter(p => p.isPinned);
    setPinnedItems(pinned);

    // Mock "Friend Feed" data - only add if they aren't real local ones
    const mockFeed: LocketPhoto[] = currentFriends.map((f, i) => ({
      id: `mock-${f.id}`,
      senderId: f.id,
      senderName: f.name,
      timestamp: Date.now() - (i + 1) * 3600000 * 2,
      imageUrl: `https://picsum.photos/seed/${f.id}-photo/800`,
      aiDescription: "Spontaneous moment shared!",
      isPinned: false,
      comments: [
        { id: 'c1', senderName: 'Sarah', text: 'Looking great!', timestamp: Date.now() - 100000 }
      ]
    }));

    const combined = [...localPhotos, ...mockFeed].sort((a, b) => b.timestamp - a.timestamp);
    setFeedItems(combined);
    setIsRefreshing(false);
    setPullDistance(0);
  }, [isRefreshing]);

  useEffect(() => {
    loadData();
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (containerRef.current && containerRef.current.scrollTop === 0) {
      startY.current = e.touches[0].pageY;
    } else {
      startY.current = 0;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startY.current === 0 || isRefreshing) return;
    const currentY = e.touches[0].pageY;
    const diff = currentY - startY.current;
    if (diff > 0) {
      const distance = Math.min(diff * 0.4, PULL_THRESHOLD + 20);
      setPullDistance(distance);
      if (e.cancelable) e.preventDefault();
    }
  };

  const handleTouchEnd = () => {
    if (isRefreshing) return;
    if (pullDistance >= PULL_THRESHOLD) {
      setIsRefreshing(true);
      loadData();
    } else {
      setPullDistance(0);
    }
    startY.current = 0;
  };

  const handleReply = (photo: LocketPhoto) => {
    onReply(photo);
    navigate('/');
  };

  const handleTogglePin = (photo: LocketPhoto) => {
    if (photo.id.startsWith('mock-')) return;
    const newPinnedStatus = !photo.isPinned;
    storageService.updatePhoto(photo.id, { isPinned: newPinnedStatus });
    loadData(true);
  };

  const handleAddComment = (photoId: string) => {
    const text = commentInputs[photoId]?.trim();
    if (!text || photoId.startsWith('mock-')) return;

    const newComment: PhotoComment = {
      id: Math.random().toString(36).substr(2, 9),
      senderName: user.name,
      text,
      timestamp: Date.now()
    };

    storageService.addComment(photoId, newComment);
    setCommentInputs(prev => ({ ...prev, [photoId]: '' }));
    loadData(true); // Refresh without refresh indicator
  };

  const handleShare = () => {
    setShowShareToast(true);
    setTimeout(() => setShowShareToast(false), 2000);
  };

  const toggleZoom = (photoId: string) => {
    setZoomedPhotoId(prev => (prev === photoId ? null : photoId));
  };

  return (
    <div 
      ref={containerRef}
      className="flex-1 flex flex-col h-full bg-black overflow-y-auto pb-32 transition-transform duration-200 ease-out relative no-scrollbar"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ transform: pullDistance > 0 ? `translateY(${pullDistance}px)` : 'none' }}
    >
      {/* Pull to Refresh Indicator */}
      <div 
        className="absolute left-0 right-0 flex items-center justify-center transition-opacity"
        style={{ 
          top: `-${Math.max(pullDistance, 60)}px`, 
          opacity: pullDistance / PULL_THRESHOLD,
          height: '60px'
        }}
      >
        <div className={`p-3 rounded-full bg-neutral-900 border border-white/10 shadow-2xl transition-transform ${isRefreshing ? 'animate-spin' : ''}`}
             style={{ transform: `rotate(${pullDistance * 3}deg) scale(${Math.min(pullDistance / PULL_THRESHOLD, 1)})` }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FACD15" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
            <polyline points="21 3 21 8 16 8" />
          </svg>
        </div>
      </div>

      <div className="sticky top-0 bg-black/80 backdrop-blur-2xl px-6 py-8 flex items-center justify-between z-30 border-b border-white/5">
        <h1 className="text-3xl font-black tracking-tighter text-white">Your Circle</h1>
        <button 
          onClick={() => navigate('/friends')}
          className="w-10 h-10 rounded-full bg-neutral-900 flex items-center justify-center border border-white/5 text-white"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
        </button>
      </div>

      {/* Share Toast */}
      {showShareToast && (
        <div className="fixed bottom-32 left-0 right-0 flex justify-center z-[100] animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-yellow-400 text-black px-6 py-3 rounded-2xl font-black text-sm shadow-2xl border border-yellow-500/50">
            Photo shared!
          </div>
        </div>
      )}

      {/* Friends Stories */}
      <div className="px-6 py-6 flex space-x-4 overflow-x-auto no-scrollbar">
        {friends.map(f => (
          <div key={f.id} className="flex flex-col items-center space-y-2 shrink-0 cursor-pointer group" onClick={() => navigate('/friends')}>
            <div className={`w-16 h-16 rounded-[24px] p-0.5 transition-all duration-300 group-hover:scale-105 ${f.status === 'online' ? 'bg-gradient-to-tr from-yellow-400 to-orange-500' : 'bg-neutral-800'}`}>
              <div className="w-full h-full rounded-[22px] border-2 border-black overflow-hidden bg-neutral-900">
                <img src={f.avatar} className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-110 ${f.status === 'offline' && 'grayscale opacity-60'}`} alt={f.name} />
              </div>
            </div>
            <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest transition-colors group-hover:text-yellow-400">{f.name}</span>
          </div>
        ))}
      </div>

      {/* Main Feed with Comments & Zoom & Share */}
      <div className="px-6 space-y-8 mt-4">
        {feedItems.map(item => (
          <div key={item.id} className="group bg-neutral-900/30 rounded-[48px] border border-white/5 overflow-hidden p-3 animate-in fade-in slide-in-from-bottom duration-700 shadow-xl transition-all hover:bg-neutral-900/50 hover:border-white/10">
             <div className="relative aspect-square rounded-[40px] overflow-hidden bg-neutral-900 cursor-zoom-in">
               <img 
                 src={item.imageUrl} 
                 className={`w-full h-full object-cover transition-transform duration-[0.6s] ease-[cubic-bezier(0.34,1.56,0.64,1)] ${zoomedPhotoId === item.id ? 'scale-[1.8] cursor-zoom-out' : 'scale-100 group-hover:scale-105'}`} 
                 alt="Feed Item"
                 onClick={() => toggleZoom(item.id)}
               />
               
               {/* Controls Layer - Hidden when zoomed for better view */}
               <div className={`transition-opacity duration-300 ${zoomedPhotoId === item.id ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                 <div className="absolute top-4 left-4 flex items-center space-x-2 bg-black/40 backdrop-blur-md px-3 py-2 rounded-full border border-white/10 transition-transform group-hover:translate-x-1">
                   <div className="w-6 h-6 rounded-lg overflow-hidden border border-white/20">
                     <img src={`https://picsum.photos/seed/${item.senderId}/100`} className="w-full h-full object-cover" alt={item.senderName} />
                   </div>
                   <span className="text-xs font-black text-white">{item.senderName}</span>
                 </div>

                 {/* Top Right Controls: Pin & Share */}
                 <div className="absolute top-4 right-4 flex flex-col space-y-2 transition-transform group-hover:-translate-x-1">
                   <button 
                    onClick={() => handleTogglePin(item)}
                    className={`p-3 rounded-2xl shadow-xl transition-all active:scale-90 ${item.isPinned ? 'bg-yellow-400 text-black' : 'bg-black/40 text-white backdrop-blur-md hover:bg-black/60'} ${item.id.startsWith('mock-') ? 'opacity-30 cursor-not-allowed' : ''}`}
                   >
                     <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill={item.isPinned ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="17" x2="12" y2="22"></line><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.79-.9A.5.5 0 0 1 16 12.1V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v7.1a.5.5 0 0 1-.1.31l-1.79.9A2 2 0 0 0 5 15.24V17z"></path></svg>
                   </button>
                   
                   <button 
                    onClick={handleShare}
                    className="p-3 bg-black/40 text-white backdrop-blur-md hover:bg-black/60 rounded-2xl shadow-xl transition-all active:scale-90"
                   >
                     <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
                   </button>
                 </div>

                 <div className="absolute bottom-4 right-4 transition-all duration-300 transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100">
                   <button 
                    onClick={() => handleReply(item)}
                    className="bg-yellow-400 text-black p-4 rounded-[24px] shadow-2xl active:scale-90 transition-all hover:rotate-2 hover:shadow-yellow-400/20"
                   >
                     <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                   </button>
                 </div>
               </div>
             </div>
             
             <div className="p-5 flex flex-col space-y-4">
               <div>
                 <p className="text-white text-sm font-medium leading-snug">
                   {item.aiDescription || "A spontaneous photo shared with you."}
                 </p>
                 <p className="text-[10px] font-black uppercase tracking-widest text-neutral-600 mt-1">
                   {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                 </p>
               </div>

               {/* Comments Section */}
               <div className="space-y-3 pt-2 border-t border-white/5">
                 {item.comments && item.comments.length > 0 && (
                   <div className="space-y-2 max-h-32 overflow-y-auto no-scrollbar">
                     {item.comments.map(c => (
                       <div key={c.id} className="text-xs flex flex-col animate-in fade-in slide-in-from-left duration-300">
                         <div className="flex items-center space-x-1.5">
                            <span className="font-black text-yellow-400/80 uppercase text-[9px] tracking-wider">{c.senderName}</span>
                            <span className="text-neutral-400 font-medium leading-relaxed">{c.text}</span>
                         </div>
                       </div>
                     ))}
                   </div>
                 )}
                 
                 {/* Comment Input */}
                 {!item.id.startsWith('mock-') && (
                   <div className="flex items-center space-x-2">
                     <input 
                       type="text"
                       value={commentInputs[item.id] || ''}
                       onChange={(e) => setCommentInputs(prev => ({ ...prev, [item.id]: e.target.value }))}
                       onKeyDown={(e) => e.key === 'Enter' && handleAddComment(item.id)}
                       placeholder="Add a comment..."
                       className="flex-1 bg-white/5 border border-white/5 rounded-2xl px-4 py-2 text-xs focus:outline-none focus:border-yellow-400/30 transition-all placeholder:text-neutral-600"
                     />
                     <button 
                       onClick={() => handleAddComment(item.id)}
                       disabled={!commentInputs[item.id]?.trim()}
                       className="p-2 text-yellow-400 disabled:text-neutral-700 transition-colors"
                     >
                       <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polyline points="22 2 15 22 11 13 2 9 22 2"/></svg>
                     </button>
                   </div>
                 )}
               </div>
             </div>
          </div>
        ))}
      </div>

      {/* Floating Bottom Nav */}
      <div className="fixed bottom-10 left-0 right-0 flex justify-center px-10 pointer-events-none z-50">
        <div className="bg-neutral-900/90 backdrop-blur-2xl border border-white/5 px-6 py-4 rounded-[40px] flex items-center space-x-10 shadow-2xl pointer-events-auto">
           <button onClick={() => navigate('/')} className="text-neutral-500 hover:text-white transition-all active:scale-90">
             <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zm0 0l-4-4m4 4l4-4"/></svg>
           </button>
           <button onClick={() => navigate('/feed')} className="text-yellow-400 active:scale-90 transition-transform">
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

export default React.memo(Feed);

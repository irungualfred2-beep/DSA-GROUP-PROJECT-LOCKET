
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LocketPhoto } from '../types';
import { storageService } from '../services/storageService';

interface HistoryProps {
  user: User;
  onReply: (photo: LocketPhoto) => void;
}

const History: React.FC<HistoryProps> = ({ user, onReply }) => {
  const navigate = useNavigate();
  const [photos, setPhotos] = useState<LocketPhoto[]>([]);
  const [filter, setFilter] = useState<'all' | 'pinned'>('all');

  const loadPhotos = useCallback(() => {
    setPhotos(storageService.getPhotos());
  }, []);

  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);

  const handleReply = (photo: LocketPhoto) => {
    onReply(photo);
    navigate('/');
  };

  const handleTogglePin = (e: React.MouseEvent, photo: LocketPhoto) => {
    e.stopPropagation();
    storageService.updatePhoto(photo.id, { isPinned: !photo.isPinned });
    loadPhotos();
  };

  const filteredPhotos = useMemo(() => {
    if (filter === 'pinned') return photos.filter(p => p.isPinned);
    return photos;
  }, [photos, filter]);

  const photoGroups = useMemo(() => {
    const groups: { [key: string]: LocketPhoto[] } = {};
    filteredPhotos.forEach(photo => {
      const date = new Date(photo.timestamp).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      if (!groups[date]) groups[date] = [];
      groups[date].push(photo);
    });
    return groups;
  }, [filteredPhotos]);

  return (
    <div className="flex-1 flex flex-col h-full bg-black overflow-y-auto selection:bg-yellow-400">
      <div className="sticky top-0 bg-black/90 backdrop-blur-xl px-6 pt-10 pb-6 flex flex-col space-y-6 z-30 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => navigate('/')}
              className="w-10 h-10 rounded-full bg-neutral-900 flex items-center justify-center text-xl hover:bg-neutral-800 transition-colors"
            >
              ←
            </button>
            <h1 className="text-3xl font-black tracking-tighter text-white">Memories</h1>
          </div>
          
          <div className="bg-neutral-900 p-1 rounded-2xl flex items-center shadow-inner">
            <button 
              onClick={() => setFilter('all')}
              className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'all' ? 'bg-yellow-400 text-black shadow-lg' : 'text-neutral-500 hover:text-white'}`}
            >
              All
            </button>
            <button 
              onClick={() => setFilter('pinned')}
              className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'pinned' ? 'bg-yellow-400 text-black shadow-lg' : 'text-neutral-500 hover:text-white'}`}
            >
              Pinned
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-10">
        {filteredPhotos.length === 0 ? (
          <div className="py-20 text-center space-y-4">
            <div className="text-6xl grayscale opacity-20">
              {filter === 'all' ? '📅' : '📌'}
            </div>
            <p className="text-neutral-500 font-bold">
              {filter === 'all' ? 'Your timeline is empty.' : 'No pinned memories yet.'}
            </p>
          </div>
        ) : (
          Object.entries(photoGroups).map(([date, group]) => (
            <section key={date} className="space-y-4">
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-600 px-1">{date}</h2>
              <div className="grid grid-cols-2 gap-4">
                {group.map((photo) => (
                  <div key={photo.id} className="relative group aspect-square rounded-[32px] overflow-hidden border border-white/5 bg-neutral-900 shadow-xl">
                    <img src={photo.imageUrl} alt="Memory" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    
                    {/* Top Icons Layer */}
                    <div className="absolute top-2 right-2 flex space-x-1.5 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => handleTogglePin(e, photo)}
                        className={`p-2 rounded-xl shadow-lg active:scale-90 transition-all ${photo.isPinned ? 'bg-yellow-400 text-black' : 'bg-black/60 text-white backdrop-blur-md hover:bg-black/80'}`}
                      >
                         <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill={photo.isPinned ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="17" x2="12" y2="22"></line><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.79-.9A.5.5 0 0 1 16 12.1V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v7.1a.5.5 0 0 1-.1.31l-1.79.9A2 2 0 0 0 5 15.24V17z"></path></svg>
                      </button>
                    </div>

                    {/* Badge for pinned (Visible when not hovering/active) */}
                    {photo.isPinned && (
                      <div className="absolute top-2 left-2 bg-yellow-400 text-black p-1 rounded-lg shadow-md opacity-100 sm:group-hover:opacity-0 transition-opacity">
                         <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.79-.9A.5.5 0 0 1 16 12.1V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v7.1a.5.5 0 0 1-.1.31l-1.79.9A2 2 0 0 0 5 15.24V17z"></path></svg>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end items-start">
                       <div className="flex justify-between w-full items-end">
                         <div>
                           <p className="text-[10px] font-black uppercase tracking-widest text-yellow-400 mb-1">
                             {photo.senderName === user.name ? 'You' : photo.senderName}
                           </p>
                           <p className="text-[11px] leading-tight text-white/90 font-medium line-clamp-2">
                             {photo.aiDescription || 'No description'}
                           </p>
                         </div>
                         <button 
                          onClick={() => handleReply(photo)}
                          className="bg-yellow-400 text-black p-2 rounded-xl shadow-lg active:scale-90 transition-transform"
                         >
                           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                         </button>
                       </div>
                    </div>
                    {photo.replyToId && (
                      <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-full border border-white/10 flex items-center space-x-1">
                         <span className="text-[8px] font-black text-white/80 tracking-tighter uppercase">REPLY</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))
        )}
      </div>

      <div className="h-32"></div>
    </div>
  );
};

export default History;


import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Friend } from '../types';
import { storageService } from '../services/storageService';

interface FriendsProps {
  user: User;
}

const Friends: React.FC<FriendsProps> = ({ user }) => {
  const navigate = useNavigate();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [newName, setNewName] = useState('');
  const [now, setNow] = useState(Date.now());
  const [activeEvent, setActiveEvent] = useState<string | null>(null);

  // High-precision relative time formatter
  const formatLastActive = useCallback((timestamp: number) => {
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 10) return 'Just now';
    if (seconds < 60) return `${seconds}s ago`;
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return 'Yesterday';
    return `${days}d ago`;
  }, [now]);

  const loadFriends = useCallback(() => {
    setFriends(storageService.getFriends());
  }, []);

  useEffect(() => {
    loadFriends();

    // Heartbeat for UI relative timestamps
    const timeInterval = setInterval(() => setNow(Date.now()), 2000);

    // Simulation of dynamic social activity
    const activityInterval = setInterval(() => {
      setFriends(currentFriends => {
        let updated = false;
        let eventMsg = '';
        
        const nextFriends = currentFriends.map(f => {
          const chance = Math.random();
          
          // 10% chance to toggle status for organic feel
          if (chance < 0.1) {
            updated = true;
            const newStatus = f.status === 'online' ? 'offline' : 'online';
            eventMsg = `${f.name} is now ${newStatus}`;
            return {
              ...f,
              status: newStatus as 'online' | 'offline',
              lastActive: Date.now()
            };
          }
          
          // 20% chance to refresh 'last active' for online friends
          if (f.status === 'online' && chance < 0.3) {
            return { ...f, lastActive: Date.now() };
          }
          
          return f;
        });

        if (updated) {
          storageService.saveFriends(nextFriends);
          setActiveEvent(eventMsg);
          setTimeout(() => setActiveEvent(null), 3000);
        }
        return nextFriends;
      });
    }, 6000);

    return () => {
      clearInterval(timeInterval);
      clearInterval(activityInterval);
    };
  }, [loadFriends]);

  const handleAddFriend = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (name) {
      const added = storageService.addFriend(name);
      setFriends(prev => [added, ...prev]);
      setNewName('');
      setActiveEvent(`Invited ${name}`);
      setTimeout(() => setActiveEvent(null), 3000);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-black overflow-y-auto selection:bg-yellow-400 selection:text-black">
      {/* Premium Header */}
      <div className="sticky top-0 bg-black/80 backdrop-blur-2xl px-6 py-8 flex items-center justify-between z-30 border-b border-white/5 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
        <div className="flex items-center space-x-5">
          <button 
            onClick={() => navigate('/')}
            className="w-12 h-12 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-2xl hover:bg-neutral-800 transition-all active:scale-90"
          >
            ←
          </button>
          <div>
            <h1 className="text-2xl font-black tracking-tighter">Friends</h1>
            {activeEvent ? (
              <p className="text-[10px] font-bold text-yellow-400 uppercase tracking-widest animate-pulse">
                {activeEvent}
              </p>
            ) : (
              <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                {friends.filter(f => f.status === 'online').length} active now
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2 bg-green-500/10 px-3 py-1.5 rounded-full border border-green-500/20">
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </div>
          <span className="text-[9px] font-black text-green-500 tracking-wider uppercase">Live</span>
        </div>
      </div>

      <div className="px-6 py-8 space-y-12">
        {/* Add Friend Component */}
        <section className="space-y-4">
          <div className="px-1 flex justify-between items-end">
            <h2 className="text-neutral-500 uppercase text-[10px] tracking-[0.3em] font-black">Add Friends</h2>
          </div>
          <form onSubmit={handleAddFriend} className="flex space-x-3">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Who are you looking for?"
              className="flex-1 bg-neutral-900 border border-neutral-800 rounded-3xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-yellow-400/20 focus:border-yellow-400 transition-all placeholder:text-neutral-700 text-lg font-medium shadow-inner"
            />
            <button 
              type="submit"
              className="bg-yellow-400 text-black px-8 py-4 rounded-3xl font-black active:scale-95 transition-all hover:bg-yellow-300 shadow-lg shadow-yellow-400/10"
            >
              ADD
            </button>
          </form>
        </section>

        {/* Dynamic List */}
        <section className="space-y-6 pb-32">
          <h2 className="text-neutral-500 uppercase text-[10px] tracking-[0.3em] font-black px-1">Your Circle</h2>
          <div className="grid gap-4">
            {friends
              .sort((a, b) => {
                if (a.status === 'online' && b.status === 'offline') return -1;
                if (a.status === 'offline' && b.status === 'online') return 1;
                return b.lastActive - a.lastActive;
              })
              .map((friend) => (
                <div 
                  key={friend.id} 
                  className={`group relative overflow-hidden bg-neutral-900/40 p-5 rounded-[40px] flex items-center justify-between border border-white/5 transition-all duration-500 hover:bg-neutral-900/60 hover:border-white/10 ${friend.status === 'online' ? 'ring-1 ring-green-500/10' : ''}`}
                >
                  <div className="flex items-center space-x-5">
                    <div className="relative">
                      {/* Animated Avatar Container */}
                      <div className={`w-16 h-16 rounded-[24px] p-0.5 transition-all duration-1000 transform ${friend.status === 'online' ? 'bg-gradient-to-tr from-yellow-400 via-green-400 to-emerald-500 scale-105 rotate-3 shadow-[0_0_20px_rgba(34,197,94,0.2)]' : 'bg-neutral-800 grayscale'}`}>
                        <div className="w-full h-full rounded-[22px] bg-black overflow-hidden border-2 border-black">
                          <img 
                            src={`https://picsum.photos/seed/${friend.id}/200`} 
                            alt={friend.name} 
                            className={`w-full h-full object-cover transition-transform duration-700 ${friend.status === 'online' ? 'scale-110 opacity-100' : 'scale-100 opacity-40'}`} 
                          />
                        </div>
                      </div>
                      
                      {/* Detailed Status Indicator */}
                      <div className={`absolute -bottom-1 -right-1 w-6 h-6 border-[4px] border-black rounded-full transition-all duration-700 flex items-center justify-center ${friend.status === 'online' ? 'bg-green-500 scale-110' : 'bg-neutral-700 scale-90'}`}>
                        {friend.status === 'online' && (
                          <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col">
                      <h3 className="font-black text-xl text-white group-hover:text-yellow-400 transition-colors tracking-tight">
                        {friend.name}
                      </h3>
                      <div className="flex items-center space-x-2">
                        {friend.status === 'online' ? (
                          <div className="flex items-center space-x-1">
                            <span className="text-[10px] font-black text-green-500 uppercase tracking-widest animate-pulse">
                              Active now
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest">
                            Seen {formatLastActive(friend.lastActive)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center pr-2">
                    <button 
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-neutral-600 hover:text-white hover:bg-white/5 transition-all active:scale-90"
                      title="Send Locket"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    </button>
                  </div>
                </div>
              ))}

            {friends.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 px-10 text-center space-y-6 bg-neutral-900/10 rounded-[50px] border-2 border-dashed border-neutral-900">
                <div className="w-24 h-24 bg-neutral-900 rounded-[36px] flex items-center justify-center text-5xl shadow-inner ring-1 ring-white/5 grayscale">
                  👤
                </div>
                <div className="space-y-2">
                  <p className="text-neutral-300 font-black text-xl">Circle is empty</p>
                  <p className="text-neutral-500 text-sm max-w-[220px] mx-auto leading-relaxed font-medium">Add your closest friends to see their live status and shared spontaneous photos.</p>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Friends;

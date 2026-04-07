
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import History from './components/History';
import Friends from './components/Friends';
import { User, LocketPhoto } from './types';

const Dashboard = lazy(() => import('./components/Dashboard'));
const Feed = lazy(() => import('./components/Feed'));

const LoadingFallback = () => (
  <div className="flex-1 flex flex-col items-center justify-center bg-black">
    <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
    <p className="mt-4 text-neutral-500 font-black uppercase tracking-widest text-[10px]">Opening Locket...</p>
  </div>
);

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [replyTarget, setReplyTarget] = useState<LocketPhoto | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('locket_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (name: string) => {
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      avatar: `https://picsum.photos/seed/${name}/200`
    };
    localStorage.setItem('locket_user', JSON.stringify(newUser));
    setUser(newUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('locket_user');
    setUser(null);
  };

  const startReply = (photo: LocketPhoto) => {
    setReplyTarget(photo);
  };

  const clearReply = () => {
    setReplyTarget(null);
  };

  return (
    <Router>
      <div className="min-h-screen bg-neutral-950 flex flex-col max-w-md mx-auto relative overflow-hidden shadow-2xl border-x border-white/5">
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route 
              path="/" 
              element={user ? (
                <Dashboard 
                  user={user} 
                  onLogout={handleLogout} 
                  replyTarget={replyTarget}
                  onReplyComplete={clearReply}
                />
              ) : <Login onLogin={handleLogin} />} 
            />
            <Route 
              path="/feed" 
              element={user ? <Feed user={user} onReply={startReply} /> : <Navigate to="/" />} 
            />
            <Route 
              path="/history" 
              element={user ? <History user={user} onReply={startReply} /> : <Navigate to="/" />} 
            />
            <Route 
              path="/friends" 
              element={user ? <Friends user={user} /> : <Navigate to="/" />} 
            />
          </Routes>
        </Suspense>
      </div>
    </Router>
  );
};

export default App;

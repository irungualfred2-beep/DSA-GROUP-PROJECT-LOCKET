
import React, { useState } from 'react';

interface LoginProps {
  onLogin: (name: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) onLogin(name);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-8 bg-black">
      <div className="w-32 h-32 bg-yellow-400 rounded-3xl flex items-center justify-center shadow-2xl shadow-yellow-400/20">
        <span className="text-6xl">📸</span>
      </div>
      
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-black tracking-tight">Locket</h1>
        <p className="text-neutral-400">Spontaneous photos for friends</p>
      </div>

      <form onSubmit={handleSubmit} className="w-full space-y-4">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="What's your name?"
          className="w-full px-6 py-4 bg-neutral-900 border-2 border-neutral-800 rounded-2xl focus:outline-none focus:border-yellow-400 transition-colors text-lg"
          required
        />
        <button
          type="submit"
          className="w-full bg-yellow-400 text-black font-bold py-4 rounded-2xl hover:bg-yellow-300 transition-all active:scale-95 text-lg"
        >
          Get Started
        </button>
      </form>
    </div>
  );
};

export default Login;

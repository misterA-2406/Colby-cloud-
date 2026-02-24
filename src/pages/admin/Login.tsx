import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Lock, User, ArrowRight } from 'lucide-react';
import { api } from '@/services/api';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const data = await api.login(username, password);
      
      if (data.success) {
        toast.success('Welcome back, Admin');
        navigate('/admin/dashboard');
      } else {
        toast.error('Invalid credentials');
      }
    } catch (error) {
      toast.error('Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-900 px-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-emerald-900/20 rounded-full blur-[100px]" />
        <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] bg-amber-900/10 rounded-full blur-[100px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 md:p-12 rounded-3xl shadow-2xl w-full max-w-md relative z-10"
      >
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/20">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-serif text-3xl font-bold text-white mb-2">Admin Access</h1>
          <p className="text-stone-400">Enter your credentials to continue</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-medium text-stone-400 uppercase tracking-wider ml-1">Username</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-500" />
              <input 
                type="text" 
                className="w-full pl-12 pr-4 py-3.5 bg-stone-800/50 border border-stone-700 rounded-xl text-white placeholder-stone-600 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all"
                placeholder="Enter username"
                value={username}
                onChange={e => setUsername(e.target.value)}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-medium text-stone-400 uppercase tracking-wider ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-500" />
              <input 
                type="password" 
                className="w-full pl-12 pr-4 py-3.5 bg-stone-800/50 border border-stone-700 rounded-xl text-white placeholder-stone-600 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 text-white py-4 rounded-xl font-bold hover:from-emerald-500 hover:to-emerald-400 transition-all shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed mt-8"
          >
            {isLoading ? 'Authenticating...' : (
              <>
                Sign In <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

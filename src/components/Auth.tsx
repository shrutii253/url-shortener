import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Zap, AlertCircle, User, UserPlus, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Particles from 'react-tsparticles';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const { signIn, signUp } = useAuth();

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        await signIn(email, password);
        navigate('/dashboard');
      } else {
        await signUp(email, password);
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={
      `min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden ` +
      (theme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-white')
    }>
      {/* Animated Dots Background */}
      <Particles
        className="absolute inset-0 z-0"
        options={{
          background: { color: { value: theme === 'dark' ? '#0a0a0a' : '#fff' } },
          fpsLimit: 60,
          particles: {
            color: { value: '#6e5cff' },
            links: { enable: false },
            move: { enable: true, speed: 1, direction: 'none', outModes: { default: 'bounce' } },
            number: { value: 40 },
            opacity: { value: 0.5 },
            shape: { type: 'circle' },
            size: { value: { min: 2, max: 4 } },
          },
          detectRetina: true,
        }}
      />
      
      {/* Header */}
      <header className="w-full max-w-md mx-auto flex items-center justify-between py-8 z-10">
        <div className="flex items-center gap-2">
          <Zap className={theme === 'dark' ? 'w-8 h-8 text-white' : 'w-8 h-8 text-[#6e5cff]'} />
          <span className={theme === 'dark' ? 'text-2xl font-bold text-white tracking-tight' : 'text-2xl font-bold text-[#6e5cff] tracking-tight'}>Snipr</span>
        </div>
        <button
          onClick={toggleTheme}
          className={
            'px-4 py-2 rounded-lg font-medium transition-colors duration-200 border ' +
            (theme === 'dark'
              ? 'bg-[#232323] text-white border-[#232323] hover:bg-[#18181b]'
              : 'bg-[#f3f3f3] text-[#6e5cff] border-[#6e5cff] hover:bg-[#e0e0ff]')
          }
        >
          {theme === 'dark' ? '🌙 Dark' : '☀️ Light'}
        </button>
      </header>

      {/* Auth Card */}
      <main className="w-full max-w-md mx-auto z-10">
        <div className={
          (theme === 'dark'
            ? 'bg-[#18181b] border border-[#232323]'
            : 'bg-[#f8f8ff] border border-[#e0e0ff]') +
          ' rounded-2xl shadow-xl p-8'
        }>
          <div className="text-center mb-8">
            <div className={
              'w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center ' +
              (theme === 'dark'
                ? 'bg-gradient-to-r from-[#6e5cff] to-[#a855f7]'
                : 'bg-gradient-to-r from-[#6e5cff] to-[#a855f7]')
            }>
              {isLogin ? (
                <User className="w-8 h-8 text-white" />
              ) : (
                <UserPlus className="w-8 h-8 text-white" />
              )}
            </div>
            <h2 className={theme === 'dark' ? 'text-2xl font-bold text-white' : 'text-2xl font-bold text-[#6e5cff]'}>
              {isLogin ? 'Welcome back' : 'Create account'}
            </h2>
            <p className={theme === 'dark' ? 'text-gray-400 mt-2' : 'text-[#6e5cff] opacity-70 mt-2'}>
              {isLogin ? 'Sign in to your account' : 'Join Snipr today'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Display */}
            {error && (
              <div className={
                (theme === 'dark'
                  ? 'p-4 bg-[#2a1a1a] border border-red-500 rounded-xl flex items-center gap-3'
                  : 'p-4 bg-[#ffeaea] border border-red-500 rounded-xl flex items-center gap-3')
              }>
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-red-400">{error}</p>
              </div>
            )}

            {/* Email Input */}
            <div className="space-y-2">
              <label className={theme === 'dark' ? 'block text-sm font-medium text-gray-300' : 'block text-sm font-medium text-[#6e5cff]'}>Email</label>
              <div className="relative">
                <Mail className={theme === 'dark' ? 'absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5' : 'absolute left-4 top-1/2 transform -translate-y-1/2 text-[#6e5cff] w-5 h-5'} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className={
                    (theme === 'dark'
                      ? 'w-full pl-12 pr-4 py-4 bg-[#232323] border border-[#232323] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6e5cff] focus:border-transparent text-lg text-white placeholder-gray-500'
                      : 'w-full pl-12 pr-4 py-4 bg-white border border-[#e0e0ff] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6e5cff] focus:border-transparent text-lg text-[#232323] placeholder-[#6e5cff]')
                  }
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label className={theme === 'dark' ? 'block text-sm font-medium text-gray-300' : 'block text-sm font-medium text-[#6e5cff]'}>Password</label>
              <div className="relative">
                <Lock className={theme === 'dark' ? 'absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5' : 'absolute left-4 top-1/2 transform -translate-y-1/2 text-[#6e5cff] w-5 h-5'} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className={
                    (theme === 'dark'
                      ? 'w-full pl-12 pr-12 py-4 bg-[#232323] border border-[#232323] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6e5cff] focus:border-transparent text-lg text-white placeholder-gray-500'
                      : 'w-full pl-12 pr-12 py-4 bg-white border border-[#e0e0ff] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6e5cff] focus:border-transparent text-lg text-[#232323] placeholder-[#6e5cff]')
                  }
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={theme === 'dark' ? 'absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-300' : 'absolute right-4 top-1/2 transform -translate-y-1/2 text-[#6e5cff] hover:text-[#a855f7]'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !email.trim() || !password.trim()}
              className={
                (theme === 'dark'
                  ? 'w-full py-4 px-6 bg-gradient-to-r from-[#382d88] to-[#b50b9f] text-white font-semibold rounded-xl hover:from-[#7c6aff] hover:to-[#b573f7] focus:outline-none focus:ring-2 focus:ring-[#6e5cff] focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-lg'
                  : 'w-full py-4 px-6 bg-gradient-to-r from-[#6e5cff] to-[#a855f7] text-white font-semibold rounded-xl hover:from-[#7c6aff] hover:to-[#b573f7] focus:outline-none focus:ring-2 focus:ring-[#6e5cff] focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-lg')
              }
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {isLogin ? 'Signing in...' : 'Creating account...'}
                </div>
              ) : (
                isLogin ? 'Sign In' : 'Create Account'
              )}
            </button>

            {/* Toggle Auth Mode */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                }}
                className={theme === 'dark' ? 'text-[#6e5cff] hover:text-[#a855f7] font-medium transition-colors duration-200' : 'text-[#6e5cff] hover:text-[#a855f7] font-medium transition-colors duration-200'}
              >
                {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
              </button>
            </div>
          </form>

          {/* Footer */}
          <div className={theme === 'dark' ? 'mt-8 pt-6 border-t border-[#232323] text-center' : 'mt-8 pt-6 border-t border-[#e0e0ff] text-center'}>
            <p className={theme === 'dark' ? 'text-gray-500 text-sm' : 'text-[#6e5cff] text-sm'}>Powered by Supabase • Fast, secure, and reliable</p>
          </div>
        </div>
      </main>
    </div>
  );
}
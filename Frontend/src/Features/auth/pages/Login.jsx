import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import LoginForm from '../components/login-form';
import MagicRings from '@/components/ui/MagicRings';

export default function Login() {
  const location = useLocation();

  useEffect(() => {
    if (location.state?.from) {
      if (location.state?.reason === 'no-tenant') {
        toast.error('Tenant account is inactive.');
      } else {
        toast.warning('Please Login To Access.');
      }
    }
  }, [location.state]);

  return (
    <main className="relative grid min-h-screen w-full place-items-center overflow-hidden bg-slate-950 p-4 text-slate-100 antialiased">
      {/* Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <MagicRings
          color="#ffffff"
          colorTwo="#64748b"
          ringCount={6}
          speed={0.8}
          attenuation={10}
          lineThickness={2}
          baseRadius={0.35}
          radiusStep={0.1}
          scaleRate={0.1}
          opacity={0.75}
          blur={0}
          noiseAmount={0.08}
          rotation={0}
          ringGap={1.5}
          fadeIn={0.7}
          fadeOut={0.5}
          followMouse={true}
          mouseInfluence={0.15}
          hoverScale={1.1}
          parallax={0.05}
        />
      </div>

      {/* Login Card - perfectly centered on all screen sizes */}
      <div className="relative z-10 w-full max-w-md mx-auto rounded-2xl border border-white/10 bg-slate-900/60 p-6 sm:p-8 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] transition-all duration-300 hover:border-white/20">
        <LoginForm />
      </div>
    </main>
  );
}
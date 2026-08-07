import LoginForm from '../components/login-form';
import { useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { toast } from 'sonner';
import MagicRings from '@/components/ui/MagicRings';
export default function Login() {
const location = useLocation();

  useEffect(() => {
    if (location.state?.from) {
      if (location.state?.reason === 'no-tenant') {
        toast.error("The is inactive.");
      } else {
        toast.warning('Please Login To Access.');
      }
    }
  }, [location.state]);
  return (
    <main className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-slate-950 text-slate-100 antialiased">
      {/*  Background Rings Animation */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <MagicRings
          color="#a855f7"
          colorTwo="#6366f1"
          ringCount={6}
          speed={0.8}
          attenuation={10}
          lineThickness={2}
          baseRadius={0.35}
          radiusStep={0.1}
          scaleRate={0.1}
          opacity={0.85}
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

      <div className="relative z-10 mx-auto w-full max-w-md p-6 sm:p-8 rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] transition-all duration-300 hover:border-purple-500/30">
        <LoginForm />
      </div>
    </main>
  );
}
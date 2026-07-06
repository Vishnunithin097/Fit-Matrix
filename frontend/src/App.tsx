import React from 'react';
import { UserProvider, useUser } from './context/UserContext.tsx';
import { AuthPage } from './pages/AuthPage.tsx';
import { OnboardingForm } from './components/OnboardingForm.tsx';
import { DashboardCore } from './components/DashboardCore.tsx';
import DailyProgressDashboard from './components/DailyProgressDashboard.tsx';
import { Shield, RefreshCw } from 'lucide-react';

// Central router enforcing strict sequential access control
const RootNavigator: React.FC = () => {
  const { user, loading } = useUser();

  // 1. LOADING HUB SCREEN
  if (loading) {
    return (
      <div className="min-h-screen bg-black text-gray-200 flex flex-col justify-center items-center font-mono relative p-4">
        {/* Background mesh */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#141125_1px,transparent_1px),linear-gradient(to_bottom,#141125_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-30" />
        <div className="absolute w-80 h-80 bg-purple-500/5 rounded-full blur-[100px]" />

        <div className="z-10 text-center space-y-6">
          <div className="inline-flex w-12 h-12 bg-gradient-to-tr from-purple-600 to-pink-500 rounded-lg items-center justify-center text-white border border-purple-500/20 animate-spin">
            <Shield size={24} />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-sm font-bold tracking-[0.3em] text-pink-500">SYNCING CORE_</h2>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest">// DECRYPTING BIO-TELEMETRY CHANNELS</p>
          </div>
        </div>
      </div>
    );
  }

  // 2. AUTHENTICATION SHIELD (Forces login/registration)
  if (!user) {
    return <AuthPage />;
  }

  // 3. MANDATORY ONBOARDING GATEWAY (Restricts direct dashboard jumps)
  if (!user.is_onboarded) {
    return (
      <div className="min-h-screen bg-black text-gray-200 flex flex-col justify-center items-center p-4 font-mono relative">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#141125_1px,transparent_1px),linear-gradient(to_bottom,#141125_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20" />
        <OnboardingForm onSuccess={() => console.log('Biometrics successfully synced.')} />
      </div>
    );
  }

  // 4. DAILY PROGRESS DASHBOARD - New day-by-day interface
  return <DailyProgressDashboard />;
};

export default function App() {
  return (
    <UserProvider>
      <RootNavigator />
    </UserProvider>
  );
}

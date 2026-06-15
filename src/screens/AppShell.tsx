import React from 'react';
import { useTracker } from '@context/TrackerContext';
import { OnboardingModal } from '@modals/OnboardingModal';
import { Dashboard } from './Dashboard';

export const AppShell: React.FC = () => {
  const { babies } = useTracker();
  const showOnboarding = babies.length === 0;

  return (
    <>
      <Dashboard />
      <OnboardingModal visible={showOnboarding} onComplete={() => {}} />
    </>
  );
};

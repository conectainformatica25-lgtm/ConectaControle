import { create } from 'zustand';

import type { Company, Profile } from '@/types/models';

type AuthState = {
  profile: Profile | null;
  company: Company | null;
  initialized: boolean;
  setSession: (p: { profile: Profile | null; company: Company | null }) => void;
  setInitialized: (v: boolean) => void;
  signOutLocal: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  profile: null,
  company: null,
  initialized: false,
  setSession: ({ profile, company }) => set({ profile, company }),
  setInitialized: (initialized) => set({ initialized }),
  signOutLocal: () => set({ profile: null, company: null }),
}));

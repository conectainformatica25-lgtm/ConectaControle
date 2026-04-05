import { useEffect } from 'react';

import * as authService from '@/services/authService';
import { isApiMode } from '@/services/api/config';
import { getStoredToken } from '@/services/api/tokenStorage';
import { isMockMode } from '@/services/mock/env';
import { isSupabaseConfigured, supabase } from '@/services/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';

export function useAuthSession() {
  const setSession = useAuthStore((s) => s.setSession);
  const setInitialized = useAuthStore((s) => s.setInitialized);
  const setBrand = useThemeStore((s) => s.setBrand);
  const resetBrand = useThemeStore((s) => s.resetBrand);

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      if (isMockMode() || isApiMode()) {
        const token = await getStoredToken();
        if (!token) {
          setSession({ profile: null, company: null });
          resetBrand();
          setInitialized(true);
          return;
        }
        try {
          const profile = await authService.fetchProfile();
          const company = profile ? await authService.fetchCompany(profile.company_id) : null;
          if (!cancelled) {
            setSession({ profile, company });
            if (company?.brand_primary) {
              setBrand({
                primary: company.brand_primary,
                secondary: company.brand_secondary ?? undefined,
              });
            } else {
              resetBrand();
            }
          }
        } catch {
          if (!cancelled) {
            setSession({ profile: null, company: null });
            resetBrand();
          }
        } finally {
          if (!cancelled) setInitialized(true);
        }
        return;
      }

      if (!isSupabaseConfigured) {
        setSession({ profile: null, company: null });
        resetBrand();
        setInitialized(true);
        return;
      }
      try {
        const profile = await authService.fetchProfile();
        const company = profile ? await authService.fetchCompany(profile.company_id) : null;
        if (!cancelled) {
          setSession({ profile, company });
          if (company?.brand_primary) {
            setBrand({
              primary: company.brand_primary,
              secondary: company.brand_secondary ?? undefined,
            });
          } else {
            resetBrand();
          }
        }
      } catch {
        if (!cancelled) {
          setSession({ profile: null, company: null });
          resetBrand();
        }
      } finally {
        if (!cancelled) setInitialized(true);
      }
    }

    hydrate();

    let sub: ReturnType<typeof supabase.auth.onAuthStateChange> | undefined;
    if (!isMockMode() && !isApiMode() && isSupabaseConfigured) {
      sub = supabase.auth.onAuthStateChange(async () => {
        const profile = await authService.fetchProfile();
        const company = profile ? await authService.fetchCompany(profile.company_id) : null;
        setSession({ profile, company });
        if (company?.brand_primary) {
          setBrand({
            primary: company.brand_primary,
            secondary: company.brand_secondary ?? undefined,
          });
        } else {
          resetBrand();
        }
      });
    }

    return () => {
      cancelled = true;
      sub?.data.subscription.unsubscribe();
    };
  }, [resetBrand, setBrand, setInitialized, setSession]);
}

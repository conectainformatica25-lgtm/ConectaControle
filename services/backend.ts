import { isApiMode } from '@/services/api/config';
import { isMockMode } from '@/services/mock/env';
import { isSupabaseConfigured } from '@/services/supabase/client';

export function isBackendConfigured(): boolean {
  return isMockMode() || isApiMode() || isSupabaseConfigured;
}

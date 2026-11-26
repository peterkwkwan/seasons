import { createClient } from '@supabase/supabase-js';

/**
 * Optional Supabase client for future clinic-nav persistence.
 * Pilot uses local/demo session; Google OAuth is not required to click through.
 */
const url =
  import.meta.env.VITE_SUPABASE_URL ?? 'https://YOUR_PROJECT_REF.supabase.co';
const anonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.placeholder';

export const usingPlaceholders =
  url.includes('YOUR_PROJECT_REF') || anonKey.includes('placeholder');

export const supabase = createClient(url, anonKey);

export function logClinicEmailStub(payload: {
  to: string;
  subject: string;
  refId: string;
}): void {
  // eslint-disable-next-line no-console
  console.info('[clinic-nav] email stub', payload);
}

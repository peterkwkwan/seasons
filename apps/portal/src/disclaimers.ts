/** Care-navigation disclaimer (clinic-nav pilot). */
export const CARE_NAV_DISCLAIMER =
  'Care navigation · not a diagnosis';

export const PORTAL_NOTE =
  'Hong Kong pilot · English UI · employer invite only';

export const INTAKE_CONSENT =
  'By continuing you agree to share intake with seasons and partner clinics in this pilot.';

export function assertsNotDiagnosis(copy: string): boolean {
  const lower = copy.toLowerCase();
  return (
    lower.includes('not a diagnosis') || lower.includes('care navigation')
  );
}

/** Clinic-nav dual-track portal types (demo / pilot). */

export type Track = 'partner' | 'contracted';

export type PathwayStatus =
  | 'invited'
  | 'intake'
  | 'nurture'
  | 'clinic_ready'
  | 'handed_off'
  | 'gp_matched'
  | 'visit_booked'
  | 'plan_ready'
  | 'follow_up_booked';

export type IntakeAnswers = {
  hotFlashes: 'mild' | 'moderate' | 'severe' | null;
  sleep: 'ok' | 'disrupted' | 'severe' | null;
  duration: 'under_3m' | '3_12m' | 'over_12m' | null;
  priorCare: 'none' | 'gp' | 'specialist' | null;
  notes: string;
};

export type DemoSession = {
  displayName: string;
  employer: string;
  email: string;
  inviteToken: string;
  track: Track;
  pathwayStatus: PathwayStatus;
  intake: IntakeAnswers;
  intakeStep: number;
  criteriaMet: boolean | null;
  refId: string | null;
  handoffAt: string | null;
  bookedConfirmed: boolean;
  visitId: string | null;
  visitSlotLabel: string | null;
  followUpSlot: string | null;
  /** When true, second intake pass on partner track yields clinic-ready. */
  reIntake: boolean;
};

export const INTAKE_STEP_COUNT = 5;

export const DEFAULT_INTAKE: IntakeAnswers = {
  hotFlashes: null,
  sleep: null,
  duration: null,
  priorCare: null,
  notes: '',
};

export type GpProfile = {
  id: string;
  initials: string;
  name: string;
  blurb: string;
  tags: string[];
  nextSlot: string;
  followUpSlots: string[];
};

export type ClinicHandoff = {
  name: string;
  waNumber: string;
  email: string;
};

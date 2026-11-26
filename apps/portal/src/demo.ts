import {
  DEFAULT_INTAKE,
  type ClinicHandoff,
  type DemoSession,
  type GpProfile,
  type Track,
} from './types';

const STORAGE_KEY = 'seasons.clinic-nav.demo.v1';

export const DEMO_GP: GpProfile = {
  id: 'gp-chen',
  initials: 'C',
  name: 'Dr. Lena Chen',
  blurb: 'Menopause-focused GP · tele visits on seasons',
  tags: ['Independent · contracted', 'English'],
  nextSlot: 'Thu 20 Nov · 6:30 pm',
  followUpSlots: [
    'Tue 2 Dec · 7:00 pm',
    'Wed 3 Dec · 12:30 pm',
    'Fri 5 Dec · 6:00 pm',
  ],
};

export const DEMO_CLINIC: ClinicHandoff = {
  name: 'Amber Health',
  waNumber: '85291234567',
  email: 'pilot@amber-health.example',
};

export function mintRefId(): string {
  const n = Math.floor(1000 + Math.random() * 9000);
  return `SH-${n}`;
}

export function defaultSession(track: Track = 'partner'): DemoSession {
  return {
    displayName: 'Mei',
    employer: 'Northwind HK · HR',
    email: 'mei.demo@northwind.hk',
    inviteToken: 'demo',
    track,
    pathwayStatus: 'invited',
    intake: { ...DEFAULT_INTAKE },
    intakeStep: 0,
    criteriaMet: null,
    refId: null,
    handoffAt: null,
    bookedConfirmed: false,
    visitId: null,
    visitSlotLabel: null,
    followUpSlot: null,
    reIntake: false,
  };
}

export function loadSession(): DemoSession {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultSession(readTrackFromUrl());
    const parsed = JSON.parse(raw) as DemoSession;
    const track = readTrackFromUrl() ?? parsed.track ?? 'partner';
    return { ...defaultSession(track), ...parsed, track };
  } catch {
    return defaultSession(readTrackFromUrl());
  }
}

export function saveSession(session: DemoSession): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function resetSession(track?: Track): DemoSession {
  const next = defaultSession(track ?? readTrackFromUrl() ?? 'partner');
  saveSession(next);
  return next;
}

/** Query `?track=partner|contracted` wins when present. */
export function readTrackFromUrl(): Track {
  const q = new URLSearchParams(window.location.search).get('track');
  if (q === 'contracted' || q === 'partner') return q;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const t = (JSON.parse(raw) as DemoSession).track;
      if (t === 'partner' || t === 'contracted') return t;
    }
  } catch {
    /* ignore */
  }
  return 'partner';
}

export function whatsAppHandoffUrl(refId: string): string {
  const text = `Hi ${DEMO_CLINIC.name} — booking via seasons. Ref ${refId}. Please share available menopause consult slots.`;
  return `https://wa.me/${DEMO_CLINIC.waNumber}?text=${encodeURIComponent(text)}`;
}

/** Partner track: first submit → nurture; re-intake → clinic ready. */
export function evaluatePartnerCriteria(session: DemoSession): boolean {
  if (session.reIntake) return true;
  const { hotFlashes, sleep } = session.intake;
  // Demo: only severe hot flashes + severe sleep would meet on first pass —
  // default moderate answers stay in nurture so the rail is clickable.
  return hotFlashes === 'severe' && sleep === 'severe';
}

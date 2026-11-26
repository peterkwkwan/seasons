import { CARE_NAV_DISCLAIMER, INTAKE_CONSENT } from './disclaimers';
import {
  DEMO_CLINIC,
  DEMO_GP,
  evaluatePartnerCriteria,
  mintRefId,
  whatsAppHandoffUrl,
} from './demo';
import { logClinicEmailStub } from './supabase';
import type { DemoSession, IntakeAnswers, Track } from './types';
import { INTAKE_STEP_COUNT } from './types';

export function esc(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function shell(
  body: string,
  opts: { navRight?: string; showTrackChip?: Track } = {},
): string {
  const navRight = opts.navRight ?? 'Help';
  const chip =
    opts.showTrackChip != null
      ? `<button type="button" class="nav-quiet linkish" id="go-settings" title="Demo settings">${opts.showTrackChip === 'partner' ? 'Track A' : 'Track B'}</button>`
      : `<button type="button" class="nav-quiet linkish" id="go-settings">${esc(navRight)}</button>`;
  return `
    <div class="phone">
      <div class="status"><span>9:41</span><span class="dots">●●●</span></div>
      <div class="nav">
        <div class="brand">seasons</div>
        ${chip}
      </div>
      <div class="screen-body">${body}</div>
    </div>
  `;
}

function greeting(name: string): string {
  const h = new Date().getHours();
  const when = h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening';
  return `Good ${when}, ${name}`;
}

export function renderInvite(session: DemoSession): string {
  if (session.track === 'contracted') {
    return shell(
      `
      <div class="eyebrow">Workplace benefit</div>
      <h2 class="headline">Menopause care, covered by your employer</h2>
      <p class="copy">Your company covers seasons care navigation and tele-visits with a contracted menopause GP.</p>
      <div class="panel soft">
        <p class="label">Includes</p>
        <p class="value">Intake · GP tele-visit · follow-ups in app</p>
      </div>
      <div class="cta-stack">
        <button type="button" class="cta" id="invite-continue">Continue</button>
        <p class="tiny">${esc(INTAKE_CONSENT)}</p>
      </div>
    `,
      { showTrackChip: session.track },
    );
  }

  return shell(
    `
    <div class="eyebrow">Workplace benefit</div>
    <h2 class="headline">Menopause care, covered by your employer</h2>
    <p class="copy">Your company is piloting seasons with ${esc(DEMO_CLINIC.name)}. A short intake routes you into the right next step.</p>
    <div class="panel soft">
      <p class="label">From</p>
      <p class="value">${esc(session.employer)}</p>
      <p class="copy" style="margin-top:8px">Private invite · not transferable</p>
    </div>
    <div class="cta-stack">
      <button type="button" class="cta" id="invite-continue">Continue</button>
      <p class="tiny">${esc(INTAKE_CONSENT)}</p>
    </div>
  `,
    { showTrackChip: session.track },
  );
}

type IntakeStepDef = {
  key: keyof IntakeAnswers;
  title: string;
  options?: { value: string; label: string }[];
  notes?: boolean;
};

const INTAKE_STEPS: IntakeStepDef[] = [
  {
    key: 'hotFlashes',
    title: 'How have hot flashes felt the last 4 weeks?',
    options: [
      { value: 'mild', label: 'Mild · occasional' },
      { value: 'moderate', label: 'Moderate · several days a week' },
      { value: 'severe', label: 'Severe · daily / disrupting sleep' },
    ],
  },
  {
    key: 'sleep',
    title: 'How is your sleep lately?',
    options: [
      { value: 'ok', label: 'Mostly fine' },
      { value: 'disrupted', label: 'Disrupted · waking often' },
      { value: 'severe', label: 'Severe · rarely restorative' },
    ],
  },
  {
    key: 'duration',
    title: 'How long have these changes been going on?',
    options: [
      { value: 'under_3m', label: 'Under 3 months' },
      { value: '3_12m', label: '3–12 months' },
      { value: 'over_12m', label: 'Over a year' },
    ],
  },
  {
    key: 'priorCare',
    title: 'Have you sought care for this before?',
    options: [
      { value: 'none', label: 'Not yet' },
      { value: 'gp', label: 'Seen a GP' },
      { value: 'specialist', label: 'Seen a specialist' },
    ],
  },
  {
    key: 'notes',
    title: 'Anything else your clinician should know?',
    notes: true,
  },
];

export function renderIntake(session: DemoSession): string {
  const step = Math.min(
    Math.max(session.intakeStep, 0),
    INTAKE_STEP_COUNT - 1,
  );
  const def = INTAKE_STEPS[step]!;
  const progress = ((step + 1) / INTAKE_STEP_COUNT) * 100;
  const eyebrow =
    step === INTAKE_STEP_COUNT - 1
      ? 'Intake · almost done'
      : `Intake · ${step + 1} of ${INTAKE_STEP_COUNT}`;

  let bodyInner = '';
  if (def.notes) {
    bodyInner = `
      <div class="panel">
        <p class="copy">Optional. Medications, recent labs, or questions for the visit.</p>
        <textarea id="intake-notes" class="notes" rows="4" placeholder="Optional notes…">${esc(session.intake.notes)}</textarea>
      </div>
    `;
  } else {
    const current = session.intake[def.key];
    bodyInner = `
      <div class="q">
        ${(def.options ?? [])
          .map(
            (o) => `
          <button type="button" class="opt${current === o.value ? ' on' : ''}" data-opt="${esc(o.value)}">
            ${esc(o.label)}
          </button>`,
          )
          .join('')}
      </div>
    `;
  }

  return shell(
    `
    <div class="eyebrow">${esc(eyebrow)}</div>
    <div class="progress"><span style="width:${progress}%"></span></div>
    <h2 class="headline">${esc(def.title)}</h2>
    ${bodyInner}
    <div class="cta-stack">
      <button type="button" class="cta" id="intake-next">${step === INTAKE_STEP_COUNT - 1 ? 'Submit intake' : 'Next'}</button>
      ${step > 0 ? '<button type="button" class="cta secondary" id="intake-back">Back</button>' : ''}
    </div>
  `,
    { showTrackChip: session.track },
  );
}

export function renderCriteriaNo(session: DemoSession): string {
  return shell(
    `
    <div class="eyebrow">Care pathway</div>
    <h2 class="headline">Not ready for clinic consult yet</h2>
    <p class="copy">Based on ${esc(DEMO_CLINIC.name)}’s criteria, we’ll stay close with short check-ins until timing is better.</p>
    <div class="panel">
      <p class="label">Next check-in</p>
      <p class="value">WhatsApp · in 14 days</p>
      <div class="chips" style="margin-top:10px">
        <span class="chip">Clinic-set cadence</span>
        <span class="chip">You can update anytime</span>
      </div>
    </div>
    <div class="cta-stack">
      <button type="button" class="cta" id="open-home">Open home</button>
      <button type="button" class="cta secondary" id="update-symptoms">Update symptoms now</button>
    </div>
  `,
    { showTrackChip: session.track },
  );
}

export function renderHomeNurture(session: DemoSession): string {
  return shell(
    `
    <div class="eyebrow">${esc(greeting(session.displayName))}</div>
    <h2 class="headline">We’ll check in on Nov 28</h2>
    <p class="copy">You’re in a short monitoring stretch with ${esc(DEMO_CLINIC.name)}. Update symptoms if anything changes sooner.</p>
    <div class="panel soft">
      <p class="label">Next step</p>
      <p class="value">WhatsApp check-in · 14 days</p>
    </div>
    <div class="cta-stack">
      <button type="button" class="cta" id="update-symptoms">Update symptoms</button>
      <p class="tiny">${esc(CARE_NAV_DISCLAIMER)}</p>
    </div>
  `,
    { navRight: 'Home', showTrackChip: session.track },
  );
}

export function renderPreconsult(session: DemoSession): string {
  const ref = session.refId ?? 'SH-4821';
  const chips: string[] = [];
  if (session.intake.hotFlashes === 'mild') chips.push('Hot flashes · mild');
  if (session.intake.hotFlashes === 'moderate')
    chips.push('Hot flashes · moderate');
  if (session.intake.hotFlashes === 'severe') chips.push('Hot flashes · severe');
  if (session.intake.sleep === 'disrupted' || session.intake.sleep === 'severe') {
    chips.push('Sleep · disrupted');
  }
  chips.push(
    session.intake.priorCare === 'none' || !session.intake.priorCare
      ? 'Prior care · none'
      : `Prior care · ${session.intake.priorCare}`,
  );

  return shell(
    `
    <div class="eyebrow">Ready for ${esc(DEMO_CLINIC.name)}</div>
    <h2 class="headline">Your pre-consult summary</h2>
    <div class="panel">
      <p class="label">Reference ID</p>
      <p class="ref">${esc(ref)}</p>
      <p class="copy" style="margin-top:8px">1-page co-branded PDF is ready. We’ll email it to the clinic when you book.</p>
    </div>
    <div class="chips">
      ${chips.map((c) => `<span class="chip">${esc(c)}</span>`).join('')}
    </div>
    <div class="cta-stack">
      <button type="button" class="cta" id="to-handoff">Continue to booking</button>
      <button type="button" class="cta secondary" id="preview-pdf">Preview PDF</button>
    </div>
  `,
    { showTrackChip: session.track },
  );
}

export function renderHandoff(session: DemoSession): string {
  const ref = session.refId ?? 'SH-4821';
  return shell(
    `
    <div class="eyebrow">Book with ${esc(DEMO_CLINIC.name)}</div>
    <h2 class="headline">Hand off on WhatsApp</h2>
    <p class="copy">We’ll open a pre-filled chat with your Ref ID. The clinic already gets your PDF by email.</p>
    <div class="panel soft">
      <p class="label">Message preview</p>
      <p class="value" style="font-weight:500;font-size:0.88rem">Hi ${esc(DEMO_CLINIC.name)} — booking via seasons. Ref ${esc(ref)}. Please share available menopause consult slots.</p>
    </div>
    <div class="cta-stack">
      <button type="button" class="cta" id="wa-handoff">Message clinic to book</button>
      <p class="tiny">Opens WhatsApp · PDF emailed to clinic</p>
    </div>
  `,
    { showTrackChip: session.track },
  );
}

export function renderHomeHandedOff(session: DemoSession): string {
  const ref = session.refId ?? 'SH-4821';
  return shell(
    `
    <div class="eyebrow">${esc(greeting(session.displayName))}</div>
    <h2 class="headline">${esc(DEMO_CLINIC.name)} has your dossier</h2>
    <div class="panel ok">
      <p class="label">Status</p>
      <p class="value">${session.bookedConfirmed ? 'Booking confirmed' : 'Handoff sent'} · Ref ${esc(ref)}</p>
      <p class="copy" style="margin-top:8px">${
        session.bookedConfirmed
          ? 'Follow-ups stay with the clinic. seasons steps back unless you need navigation again.'
          : 'Finish booking on WhatsApp if you haven’t already. Follow-ups stay with the clinic.'
      }</p>
    </div>
    <div class="cta-stack">
      <button type="button" class="cta" id="wa-reopen">Reopen WhatsApp</button>
      ${
        session.bookedConfirmed
          ? ''
          : '<button type="button" class="cta secondary" id="confirm-booked">I already booked</button>'
      }
    </div>
  `,
    { navRight: 'Home', showTrackChip: session.track },
  );
}

export function renderGpMatch(session: DemoSession): string {
  const gp = DEMO_GP;
  return shell(
    `
    <div class="eyebrow">Your seasons clinician</div>
    <h2 class="headline">Matched with ${esc(gp.name.replace(/^Dr\.\s*/, 'Dr. '))}</h2>
    <div class="panel">
      <div class="row">
        <div class="avatar">${esc(gp.initials)}</div>
        <div>
          <p class="value">${esc(gp.name)}</p>
          <p class="copy">${esc(gp.blurb)}</p>
        </div>
      </div>
      <div class="chips" style="margin-top:12px">
        ${gp.tags.map((t) => `<span class="chip">${esc(t)}</span>`).join('')}
      </div>
    </div>
    <div class="panel soft">
      <p class="label">Next available</p>
      <p class="value">${esc(gp.nextSlot)}</p>
    </div>
    <div class="cta-stack">
      <button type="button" class="cta" id="book-tele">Book tele-appointment</button>
      <p class="tiny">${esc(CARE_NAV_DISCLAIMER)}</p>
    </div>
  `,
    { showTrackChip: session.track },
  );
}

export function renderTeleVisit(session: DemoSession): string {
  return shell(
    `
    <div class="eyebrow">Today · ${esc(session.visitSlotLabel?.split('·')[1]?.trim() ?? '6:30 pm')}</div>
    <h2 class="headline">Visit with ${esc(DEMO_GP.name)}</h2>
    <div class="panel ok">
      <p class="label">Clinician prep</p>
      <p class="value">Intake open in seasons portal</p>
      <p class="copy" style="margin-top:8px">No PDF relay. Your answers are already structured for the visit.</p>
    </div>
    <div class="panel">
      <p class="label">Duration</p>
      <p class="value">25 minutes · video</p>
    </div>
    <div class="cta-stack">
      <button type="button" class="cta" id="join-visit">Join video visit</button>
      <button type="button" class="cta secondary" id="reschedule">Reschedule</button>
    </div>
  `,
    { navRight: 'Visit', showTrackChip: session.track },
  );
}

export function renderPlan(session: DemoSession): string {
  return shell(
    `
    <div class="eyebrow">After your visit</div>
    <h2 class="headline">Plan from ${esc(DEMO_GP.name)}</h2>
    <div class="panel">
      <p class="label">Today</p>
      <p class="value">Discussed HRT options · labs suggested</p>
    </div>
    <div class="panel soft">
      <p class="label">Referral</p>
      <p class="value">Pelvic physio · seasons panel</p>
      <p class="copy" style="margin-top:6px">Optional · you choose when</p>
    </div>
    <div class="cta-stack">
      <button type="button" class="cta" id="book-followup">Book follow-up with ${esc(DEMO_GP.name)}</button>
      <button type="button" class="cta secondary" id="view-physio">View physio options</button>
    </div>
  `,
    { showTrackChip: session.track },
  );
}

export function renderFollowUp(session: DemoSession): string {
  const selected = session.followUpSlot;
  return shell(
    `
    <div class="eyebrow">Stay with your GP</div>
    <h2 class="headline">Book your next check-in</h2>
    <div class="panel">
      <div class="row">
        <div class="avatar">${esc(DEMO_GP.initials)}</div>
        <div>
          <p class="value">${esc(DEMO_GP.name)}</p>
          <p class="copy">Follow-up · covered by employer plan</p>
        </div>
      </div>
    </div>
    <div class="chips slot-chips">
      ${DEMO_GP.followUpSlots
        .map(
          (s) =>
            `<button type="button" class="chip chip-btn${selected === s ? ' on' : ''}" data-slot="${esc(s)}">${esc(s)}</button>`,
        )
        .join('')}
    </div>
    <div class="cta-stack">
      <button type="button" class="cta" id="confirm-followup" ${selected ? '' : 'disabled'}>Confirm follow-up</button>
      <p class="tiny">Included visits first · excess billed to employer monthly</p>
    </div>
  `,
    { showTrackChip: session.track },
  );
}

export function renderFollowUpDone(session: DemoSession): string {
  return shell(
    `
    <div class="eyebrow">${esc(greeting(session.displayName))}</div>
    <h2 class="headline">Follow-up booked</h2>
    <div class="panel ok">
      <p class="label">With ${esc(DEMO_GP.name)}</p>
      <p class="value">${esc(session.followUpSlot ?? '')}</p>
      <p class="copy" style="margin-top:8px">We’ll remind you before the visit. Continuity stays with the same GP.</p>
    </div>
    <div class="cta-stack">
      <button type="button" class="cta" id="open-home">Back to home</button>
      <p class="tiny">${esc(CARE_NAV_DISCLAIMER)}</p>
    </div>
  `,
    { navRight: 'Home', showTrackChip: session.track },
  );
}

export function renderHomeGp(session: DemoSession): string {
  if (session.pathwayStatus === 'follow_up_booked') {
    return renderFollowUpDone(session);
  }
  if (session.pathwayStatus === 'plan_ready') {
    return shell(
      `
      <div class="eyebrow">${esc(greeting(session.displayName))}</div>
      <h2 class="headline">Your plan is ready</h2>
      <p class="copy">Review Dr. Chen’s after-visit notes and book a follow-up when you’re ready.</p>
      <div class="panel soft">
        <p class="label">Next step</p>
        <p class="value">Open care plan</p>
      </div>
      <div class="cta-stack">
        <button type="button" class="cta" id="open-plan">View plan</button>
        <p class="tiny">${esc(CARE_NAV_DISCLAIMER)}</p>
      </div>
    `,
      { navRight: 'Home', showTrackChip: session.track },
    );
  }
  if (session.pathwayStatus === 'visit_booked') {
    return shell(
      `
      <div class="eyebrow">${esc(greeting(session.displayName))}</div>
      <h2 class="headline">Tele-visit booked</h2>
      <p class="copy">${esc(session.visitSlotLabel ?? DEMO_GP.nextSlot)} with ${esc(DEMO_GP.name)}.</p>
      <div class="panel soft">
        <p class="label">Next step</p>
        <p class="value">Join when it’s time</p>
      </div>
      <div class="cta-stack">
        <button type="button" class="cta" id="open-visit">Open visit</button>
        <p class="tiny">${esc(CARE_NAV_DISCLAIMER)}</p>
      </div>
    `,
      { navRight: 'Home', showTrackChip: session.track },
    );
  }
  return renderGpMatch(session);
}

const HOT_FLASH_LABELS: Record<string, string> = {
  mild: 'Mild · occasional',
  moderate: 'Moderate · several days a week',
  severe: 'Severe · daily / disrupting sleep',
};
const SLEEP_LABELS: Record<string, string> = {
  ok: 'Mostly fine',
  disrupted: 'Disrupted · waking often',
  severe: 'Severe · rarely restorative',
};
const DURATION_LABELS: Record<string, string> = {
  under_3m: 'Under 3 months',
  '3_12m': '3–12 months',
  over_12m: 'Over a year',
};
const PRIOR_CARE_LABELS: Record<string, string> = {
  none: 'Not yet',
  gp: 'Seen a GP',
  specialist: 'Seen a specialist',
};

function labelOrDash(
  map: Record<string, string>,
  value: string | null,
): string {
  if (!value) return '—';
  return map[value] ?? value;
}

export function renderPdfPreview(session: DemoSession): string {
  const ref = session.refId ?? 'SH-4821';
  return `
    <div class="pdf-sheet">
      <header class="pdf-head">
        <div>
          <p class="brand">seasons</p>
          <p class="pdf-co">× ${esc(DEMO_CLINIC.name)}</p>
        </div>
        <button type="button" class="cta secondary compact" id="close-pdf">Close</button>
      </header>
      <h1>Pre-consult symptom summary</h1>
      <p class="copy">Reference <strong>${esc(ref)}</strong> · ${esc(session.displayName)} · employer pilot</p>
      <div class="panel">
        <p class="label">Hot flashes</p>
        <p class="value">${esc(labelOrDash(HOT_FLASH_LABELS, session.intake.hotFlashes))}</p>
        <p class="label" style="margin-top:10px">Sleep</p>
        <p class="value">${esc(labelOrDash(SLEEP_LABELS, session.intake.sleep))}</p>
        <p class="label" style="margin-top:10px">Duration</p>
        <p class="value">${esc(labelOrDash(DURATION_LABELS, session.intake.duration))}</p>
        <p class="label" style="margin-top:10px">Prior care</p>
        <p class="value">${esc(labelOrDash(PRIOR_CARE_LABELS, session.intake.priorCare))}</p>
        ${
          session.intake.notes
            ? `<p class="label" style="margin-top:10px">Notes</p><p class="copy">${esc(session.intake.notes)}</p>`
            : ''
        }
      </div>
      <p class="tiny">${esc(CARE_NAV_DISCLAIMER)} · Demo one-pager · not a clinical record</p>
    </div>
  `;
}

export function renderSettings(session: DemoSession): string {
  return `
    <div class="phone">
      <div class="status"><span>9:41</span><span class="dots">●●●</span></div>
      <div class="nav">
        <div class="brand">seasons</div>
        <button type="button" class="nav-quiet linkish" id="settings-back">Back</button>
      </div>
      <div class="screen-body">
        <div class="eyebrow">Pilot controls</div>
        <h2 class="headline">Demo settings</h2>
        <p class="copy">Switch tracks or reset local session. Query <code>?track=partner|contracted</code> also works.</p>
        <div class="panel">
          <p class="label">Track</p>
          <div class="chips" style="margin-top:8px">
            <button type="button" class="chip chip-btn${session.track === 'partner' ? ' on' : ''}" data-track="partner">A · Partner clinic</button>
            <button type="button" class="chip chip-btn${session.track === 'contracted' ? ' on' : ''}" data-track="contracted">B · Contracted GP</button>
          </div>
        </div>
        <div class="panel soft">
          <p class="label">Session</p>
          <p class="value" style="font-size:0.88rem;font-weight:500">${esc(session.displayName)} · ${esc(session.pathwayStatus)}</p>
          <p class="copy" style="margin-top:6px">Ref ${esc(session.refId ?? '—')}</p>
        </div>
        <div class="cta-stack">
          <button type="button" class="cta" id="reset-demo">Reset demo</button>
          <button type="button" class="cta secondary" id="settings-back-2">Continue flow</button>
        </div>
      </div>
    </div>
  `;
}

/** Bind shared chrome actions; returns true if handled. */
export function bindChrome(root: HTMLElement, onSettings: () => void): void {
  root.querySelector('#go-settings')?.addEventListener('click', onSettings);
}

export {
  DEMO_CLINIC,
  DEMO_GP,
  evaluatePartnerCriteria,
  mintRefId,
  whatsAppHandoffUrl,
  logClinicEmailStub,
  INTAKE_STEP_COUNT,
  INTAKE_STEPS,
};

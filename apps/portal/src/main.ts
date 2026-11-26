import './style.css';
import { loadSession, resetSession, saveSession } from './demo';
import {
  DEFAULT_INTAKE,
  INTAKE_STEP_COUNT,
  type DemoSession,
  type Track,
} from './types';
import { navigate, parseRoute, type Route } from './router';
import {
  DEMO_CLINIC,
  DEMO_GP,
  bindChrome,
  evaluatePartnerCriteria,
  logClinicEmailStub,
  mintRefId,
  renderCriteriaNo,
  renderFollowUp,
  renderFollowUpDone,
  renderGpMatch,
  renderHandoff,
  renderHomeGp,
  renderHomeHandedOff,
  renderHomeNurture,
  renderIntake,
  renderInvite,
  renderPdfPreview,
  renderPlan,
  renderPreconsult,
  renderSettings,
  renderTeleVisit,
  whatsAppHandoffUrl,
} from './screens';

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('#app root missing');

let session: DemoSession = loadSession();

function persist(): void {
  saveSession(session);
}

function setTrack(track: Track): void {
  const url = new URL(window.location.href);
  url.searchParams.set('track', track);
  history.replaceState(null, '', url.pathname + url.search);
  session = resetSession(track);
  persist();
  navigate({ name: 'invite', token: session.inviteToken }, true);
}

function goHome(): void {
  navigate({ name: 'home' });
}

function paint(): void {
  const route = parseRoute();
  app!.innerHTML = htmlFor(route);
  wire(route);
}

function htmlFor(route: Route): string {
  switch (route.name) {
    case 'invite':
      return renderInvite(session);
    case 'intake':
      return renderIntake(session);
    case 'pathway-result':
      return renderCriteriaNo(session);
    case 'home':
      if (session.track === 'contracted') return renderHomeGp(session);
      if (session.pathwayStatus === 'handed_off') {
        return renderHomeHandedOff(session);
      }
      if (
        session.pathwayStatus === 'clinic_ready' &&
        session.refId &&
        !session.handoffAt
      ) {
        return renderPreconsult(session);
      }
      return renderHomeNurture(session);
    case 'preconsult':
      return renderPreconsult(session);
    case 'handoff':
      return renderHandoff(session);
    case 'gp-match':
      return renderGpMatch(session);
    case 'visit':
      return renderTeleVisit(session);
    case 'plan':
      return renderPlan(session);
    case 'follow-up':
      if (session.pathwayStatus === 'follow_up_booked') {
        return renderFollowUpDone(session);
      }
      return renderFollowUp(session);
    case 'settings':
      return renderSettings(session);
    case 'pdf-preview':
      return renderPdfPreview(session);
  }
}

function wire(route: Route): void {
  bindChrome(app!, () => navigate({ name: 'settings' }));

  if (route.name === 'invite') {
    app!.querySelector('#invite-continue')?.addEventListener('click', () => {
      session.pathwayStatus = 'intake';
      session.intakeStep = 0;
      persist();
      navigate({ name: 'intake' });
    });
    return;
  }

  if (route.name === 'intake') {
    wireIntake();
    return;
  }

  if (route.name === 'pathway-result') {
    app!.querySelector('#open-home')?.addEventListener('click', goHome);
    app!.querySelector('#update-symptoms')?.addEventListener('click', () => {
      startReIntake();
    });
    return;
  }

  if (route.name === 'home') {
    app!.querySelector('#update-symptoms')?.addEventListener('click', () => {
      startReIntake();
    });
    app!.querySelector('#wa-reopen')?.addEventListener('click', () => {
      openWhatsApp();
    });
    app!.querySelector('#confirm-booked')?.addEventListener('click', () => {
      session.bookedConfirmed = true;
      persist();
      paint();
    });
    app!.querySelector('#open-visit')?.addEventListener('click', () => {
      navigate({
        name: 'visit',
        id: session.visitId ?? 'demo-visit',
      });
    });
    app!.querySelector('#open-plan')?.addEventListener('click', () => {
      navigate({
        name: 'plan',
        visitId: session.visitId ?? 'demo-visit',
      });
    });
    app!.querySelector('#book-tele')?.addEventListener('click', bookTele);
    return;
  }

  if (route.name === 'preconsult') {
    app!.querySelector('#to-handoff')?.addEventListener('click', () => {
      navigate({ name: 'handoff' });
    });
    app!.querySelector('#preview-pdf')?.addEventListener('click', () => {
      navigate({ name: 'pdf-preview' });
    });
    return;
  }

  if (route.name === 'handoff') {
    app!.querySelector('#wa-handoff')?.addEventListener('click', () => {
      ensureRef();
      logClinicEmailStub({
        to: DEMO_CLINIC.email,
        subject: `seasons pre-consult · ${session.refId}`,
        refId: session.refId!,
      });
      openWhatsApp();
      session.pathwayStatus = 'handed_off';
      session.handoffAt = new Date().toISOString();
      persist();
      navigate({ name: 'home' });
    });
    return;
  }

  if (route.name === 'gp-match') {
    app!.querySelector('#book-tele')?.addEventListener('click', bookTele);
    return;
  }

  if (route.name === 'visit') {
    app!.querySelector('#join-visit')?.addEventListener('click', () => {
      // Demo: joining completes the visit and reveals the plan.
      session.pathwayStatus = 'plan_ready';
      persist();
      navigate({
        name: 'plan',
        visitId: session.visitId ?? 'demo-visit',
      });
    });
    app!.querySelector('#reschedule')?.addEventListener('click', () => {
      navigate({ name: 'gp-match' });
    });
    return;
  }

  if (route.name === 'plan') {
    app!.querySelector('#book-followup')?.addEventListener('click', () => {
      navigate({ name: 'follow-up' });
    });
    app!.querySelector('#view-physio')?.addEventListener('click', () => {
      window.alert(
        'Demo stub: physio panel handoff would open here (WA / partner link).',
      );
    });
    return;
  }

  if (route.name === 'follow-up') {
    app!.querySelectorAll('[data-slot]').forEach((el) => {
      el.addEventListener('click', () => {
        const slot = (el as HTMLElement).dataset.slot;
        if (!slot) return;
        session.followUpSlot = slot;
        persist();
        paint();
      });
    });
    app!.querySelector('#confirm-followup')?.addEventListener('click', () => {
      if (!session.followUpSlot) return;
      session.pathwayStatus = 'follow_up_booked';
      persist();
      paint();
    });
    app!.querySelector('#open-home')?.addEventListener('click', goHome);
    return;
  }

  if (route.name === 'pdf-preview') {
    app!.querySelector('#close-pdf')?.addEventListener('click', () => {
      navigate({ name: 'preconsult' });
    });
    return;
  }

  if (route.name === 'settings') {
    const back = () => {
      history.back();
      // If no history, land sensibly.
      setTimeout(() => {
        if (parseRoute().name === 'settings') {
          navigate(
            { name: 'invite', token: session.inviteToken },
            true,
          );
        }
      }, 0);
    };
    app!.querySelector('#settings-back')?.addEventListener('click', back);
    app!.querySelector('#settings-back-2')?.addEventListener('click', () => {
      resumeFlow();
    });
    app!.querySelectorAll('[data-track]').forEach((el) => {
      el.addEventListener('click', () => {
        const t = (el as HTMLElement).dataset.track as Track;
        setTrack(t);
      });
    });
    app!.querySelector('#reset-demo')?.addEventListener('click', () => {
      session = resetSession(session.track);
      persist();
      navigate({ name: 'invite', token: 'demo' }, true);
    });
  }
}

function wireIntake(): void {
  const step = session.intakeStep;
  app!.querySelectorAll('[data-opt]').forEach((el) => {
    el.addEventListener('click', () => {
      const value = (el as HTMLElement).dataset.opt;
      if (!value) return;
      const keys = [
        'hotFlashes',
        'sleep',
        'duration',
        'priorCare',
      ] as const;
      const key = keys[step];
      if (!key) return;
      session.intake = { ...session.intake, [key]: value };
      persist();
      paint();
    });
  });

  app!.querySelector('#intake-back')?.addEventListener('click', () => {
    session.intakeStep = Math.max(0, session.intakeStep - 1);
    persist();
    paint();
  });

  app!.querySelector('#intake-next')?.addEventListener('click', () => {
    const notes = app!.querySelector<HTMLTextAreaElement>('#intake-notes');
    if (notes) {
      session.intake = { ...session.intake, notes: notes.value };
    }

    if (session.intakeStep < INTAKE_STEP_COUNT - 1) {
      const keys = [
        'hotFlashes',
        'sleep',
        'duration',
        'priorCare',
      ] as const;
      const key = keys[session.intakeStep];
      if (key && !session.intake[key]) {
        // Soft default for click-through: pick moderate / disrupted / 3–12m / none
        const defaults = {
          hotFlashes: 'moderate',
          sleep: 'disrupted',
          duration: '3_12m',
          priorCare: 'none',
        } as const;
        session.intake = {
          ...session.intake,
          [key]: defaults[key],
        };
      }
      session.intakeStep += 1;
      persist();
      paint();
      return;
    }

    finishIntake();
  });
}

function startReIntake(): void {
  session.reIntake = true;
  session.intakeStep = 0;
  session.intake = { ...DEFAULT_INTAKE };
  session.pathwayStatus = 'intake';
  persist();
  navigate({ name: 'intake' });
}

function finishIntake(): void {
  if (session.track === 'contracted') {
    session.pathwayStatus = 'gp_matched';
    session.criteriaMet = null;
    persist();
    navigate({ name: 'gp-match' });
    return;
  }

  const met = evaluatePartnerCriteria(session);
  session.criteriaMet = met;
  if (met) {
    ensureRef();
    session.pathwayStatus = 'clinic_ready';
    persist();
    navigate({ name: 'preconsult' });
  } else {
    session.pathwayStatus = 'nurture';
    persist();
    navigate({ name: 'pathway-result' });
  }
}

function ensureRef(): void {
  if (!session.refId) {
    session.refId = mintRefId();
    persist();
  }
}

function openWhatsApp(): void {
  ensureRef();
  const url = whatsAppHandoffUrl(session.refId!);
  window.open(url, '_blank', 'noopener,noreferrer');
}

function bookTele(): void {
  session.visitId = 'demo-visit';
  session.visitSlotLabel = DEMO_GP.nextSlot;
  session.pathwayStatus = 'visit_booked';
  persist();
  navigate({ name: 'visit', id: 'demo-visit' });
}

function resumeFlow(): void {
  switch (session.pathwayStatus) {
    case 'invited':
      navigate({ name: 'invite', token: session.inviteToken }, true);
      break;
    case 'intake':
      navigate({ name: 'intake' }, true);
      break;
    case 'nurture':
      navigate({ name: 'home' }, true);
      break;
    case 'clinic_ready':
      navigate({ name: 'preconsult' }, true);
      break;
    case 'handed_off':
      navigate({ name: 'home' }, true);
      break;
    case 'gp_matched':
      navigate({ name: 'gp-match' }, true);
      break;
    case 'visit_booked':
      navigate({ name: 'visit', id: session.visitId ?? 'demo-visit' }, true);
      break;
    case 'plan_ready':
      navigate(
        { name: 'plan', visitId: session.visitId ?? 'demo-visit' },
        true,
      );
      break;
    case 'follow_up_booked':
      navigate({ name: 'home' }, true);
      break;
    default:
      navigate({ name: 'invite', token: 'demo' }, true);
  }
}

function bootstrapRoute(): void {
  const route = parseRoute();
  // Fresh load at `/` → invite
  if (
    window.location.pathname === '/' ||
    window.location.pathname === ''
  ) {
    navigate({ name: 'invite', token: 'demo' }, true);
    return;
  }
  // Keep invite token on session
  if (route.name === 'invite') {
    session.inviteToken = route.token;
    persist();
  }
  paint();
}

window.addEventListener('popstate', () => paint());
bootstrapRoute();

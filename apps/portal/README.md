# seasons · clinic-nav portal

Mobile-first Vite + TypeScript web app for the **dual-track clinic navigation** patient flow (employer invite → intake → partner clinic handoff **or** contracted GP tele-visits).

Replaces the former Path C practitioner portal (claim clinic / appointments / summary packs). Petal Soft visual language: bg `#F8EFEA`, surface `#FFF9F6`, ink `#2A1F1C`, muted `#7A6560`, accent `#B85C5C`, Cormorant + Inter.

## Tracks

| Track | Flow |
| --- | --- |
| **A · Partner clinic** | Invite → Intake → Criteria NO → Home nurture → (re-intake YES) → Pre-consult PDF/Ref → WhatsApp handoff → Home handed-off |
| **B · Contracted GP** | Invite → Intake → GP match → Tele visit → After-visit plan → Follow-up booking |

Toggle with `?track=partner` or `?track=contracted`, or the in-app **Track A / Track B** control (top-right → settings).

## Run

```bash
cd apps/portal
npm install
npm run dev
```

Or from repo root: `npm run portal:dev`. Open `http://localhost:5173` (lands on `/invite/demo`).

Demo session lives in `localStorage` — no Google auth required for the click-through. Optional `VITE_SUPABASE_*` in `.env.local` keeps the Supabase client available for later persistence; it is not required for the pilot UI.

## Routes

| Path | Screen |
| --- | --- |
| `/invite/:token` | Employer invite |
| `/intake` | Retrospective intake (5 steps) |
| `/pathway/result` | Below clinic criteria (Track A) |
| `/home` | Pathway-status hero (nurture / handed-off / GP states) |
| `/preconsult` | Co-branded summary + Ref ID |
| `/handoff/whatsapp` | `wa.me` deep link |
| `/pdf-preview` | Static demo one-pager |
| `/gp/match` | Contracted GP match |
| `/visit/:id` | Tele-visit day |
| `/plan/:visitId` | After-visit plan |
| `/gp/follow-up` | Follow-up slot picker |
| `/settings` | Track toggle + reset |

## Stubs / limitations

- Criteria, Ref ID, GP profile, and slots are **local demo data** (clinic-nav schema not required).
- WhatsApp opens `wa.me` with a prefilled Ref message; clinic PDF **email is console-logged**.
- Video join is a demo advance into the after-visit plan (no real WebRTC vendor).
- Physio referral is an alert stub.
- Flutter mobile app is unchanged by this portal replace.

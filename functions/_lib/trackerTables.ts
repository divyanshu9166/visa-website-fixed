// Mirrors src/lib/trackers.ts on the frontend (TRACKERS[*].table / .fields).
// Kept as a separate, server-side source of truth so the API never trusts a
// field list sent by the client — only fields listed here are ever read from
// the request body and written to the database.

export const TRACKER_TABLES = {
  h1b_cases: {
    model: 'h1bCase' as const,
    fields: [
      'fiscalYear', 'petitionType', 'quotaType', 'registrationStatus', 'registrationDate',
      'receiptNumber', 'caseStatus', 'caseStatusDate', 'serviceCenter', 'premiumProcessing',
    ],
    dateFields: ['registrationDate', 'caseStatusDate'],
    intFields: ['fiscalYear'],
    boolFields: ['premiumProcessing'],
  },
  i485_cases: {
    model: 'i485Case' as const,
    fields: [
      'category', 'countryOfBirth', 'priorityDate', 'filingDate', 'serviceCenter',
      'caseStatus', 'caseStatusDate', 'eadReceived', 'travelDocReceived',
    ],
    dateFields: ['priorityDate', 'filingDate', 'caseStatusDate'],
    intFields: [],
    boolFields: ['eadReceived', 'travelDocReceived'],
  },
  dropbox_cases: {
    model: 'dropboxCase' as const,
    fields: ['visaType', 'consulate', 'eligibilitySubmittedDate', 'dropboxDate', 'outcome', 'daysWaited'],
    dateFields: ['eligibilitySubmittedDate', 'dropboxDate'],
    intFields: ['daysWaited'],
    boolFields: [],
  },
  consulate_reschedule_cases: {
    model: 'rescheduleCase' as const,
    fields: ['consulate', 'originalAppointmentDate', 'rescheduledDate', 'reason', 'success'],
    dateFields: ['originalAppointmentDate', 'rescheduledDate'],
    intFields: [],
    boolFields: ['success'],
  },
  cases_221g: {
    model: 'case221g' as const,
    fields: ['visaType', 'consulate', 'dateIssued', 'documentsRequested', 'resolutionStatus', 'daysToResolve'],
    dateFields: ['dateIssued'],
    intFields: ['daysToResolve'],
    boolFields: [],
  },
  emergency_appointment_cases: {
    model: 'emergencyCase' as const,
    fields: ['visaType', 'consulate', 'requestReason', 'requestDate', 'outcome', 'appointmentGrantedDate'],
    dateFields: ['requestDate', 'appointmentGrantedDate'],
    intFields: [],
    boolFields: [],
  },
} as const;

export type TrackerTableKey = keyof typeof TRACKER_TABLES;

export function isValidTable(table: string): table is TrackerTableKey {
  return Object.prototype.hasOwnProperty.call(TRACKER_TABLES, table);
}

/** Picks + coerces only the allow-listed fields from an arbitrary request body. */
export function sanitizePayload(table: TrackerTableKey, body: Record<string, unknown>) {
  const config = TRACKER_TABLES[table];
  const out: Record<string, unknown> = {};
  for (const key of config.fields) {
    if (!(key in body)) continue;
    const raw = body[key];
    if (raw === '' || raw === null || raw === undefined) {
      out[key] = null;
      continue;
    }
    if ((config.dateFields as readonly string[]).includes(key)) {
      const d = new Date(raw as string);
      out[key] = isNaN(d.getTime()) ? null : d;
    } else if ((config.intFields as readonly string[]).includes(key)) {
      const n = parseInt(String(raw), 10);
      out[key] = isNaN(n) ? null : n;
    } else if ((config.boolFields as readonly string[]).includes(key)) {
      out[key] = raw === true || raw === 'true' || raw === 'on';
    } else {
      out[key] = String(raw);
    }
  }
  return out;
}

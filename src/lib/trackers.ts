// Registry of every community tracker type. Driving config for:
//  - the add-case form fields
//  - which fields get charted as donut breakdowns
//  - the API path each tracker reads/writes (/api/trackers/{table})
//  - deterministic demo data shown before any real cases are submitted
//
// Field keys are camelCase to match the Prisma model field names exactly
// (see prisma/schema.prisma and functions/_lib/trackerTables.ts) — the API
// returns Prisma's native JSON shape directly, no key remapping.

export type FieldType = 'text' | 'date' | 'select' | 'boolean' | 'number';

export interface TrackerField {
  key: string;
  label: string;
  type: FieldType;
  options?: string[];
  required?: boolean;
}

export interface TrackerConfig {
  slug: string;
  table: string;
  label: string;
  description: string;
  urlPath: string;
  fields: TrackerField[];
  chartFields: string[]; // up to 3 field keys, charted as donuts
  demoCount: number;
}

export const TRACKERS: Record<string, TrackerConfig> = {
  h1b: {
    slug: 'h1b',
    table: 'h1b_cases',
    label: 'H-1B Visa Tracker',
    description: 'Community-submitted H-1B registration and petition cases — registration outcomes, quota type, and live case status.',
    urlPath: '/uscis-trackers/h1b-visa',
    demoCount: 180,
    chartFields: ['registrationStatus', 'quotaType', 'caseStatus'],
    fields: [
      { key: 'fiscalYear', label: 'Fiscal Year', type: 'select', options: ['2027', '2026', '2025'], required: true },
      { key: 'petitionType', label: 'Petition Type', type: 'select', options: ['Cap-Subject New', 'Change of Employer', 'Extension', 'Cap-Exempt'], required: true },
      { key: 'quotaType', label: 'Quota Type', type: 'select', options: ['Regular Cap', 'Masters Cap', 'Cap-Exempt'] },
      { key: 'registrationStatus', label: 'Registration Status', type: 'select', options: ['Selected', 'Not Selected', 'Pending'] },
      { key: 'registrationDate', label: 'Registration Date', type: 'date' },
      { key: 'receiptNumber', label: 'Receipt Number (optional)', type: 'text' },
      { key: 'caseStatus', label: 'Case Status', type: 'select', options: ['Receipt Notice', 'RFE Issued', 'Approved', 'Denied', 'Pending'], required: true },
      { key: 'caseStatusDate', label: 'Case Status Date', type: 'date' },
      { key: 'serviceCenter', label: 'Service Center', type: 'select', options: ['California Service Center', 'Nebraska Service Center', 'Texas Service Center', 'Vermont Service Center'] },
      { key: 'premiumProcessing', label: 'Premium Processing', type: 'boolean' },
    ],
  },
  i485: {
    slug: 'i485',
    table: 'i485_cases',
    label: 'I-485 Adjustment of Status Tracker',
    description: 'Community-submitted I-485 timelines — priority dates, biometrics, interview, and EAD/AP milestones.',
    urlPath: '/green-card/i485-tracker',
    demoCount: 220,
    chartFields: ['category', 'caseStatus', 'countryOfBirth'],
    fields: [
      { key: 'category', label: 'Category', type: 'select', options: ['Employment-Based', 'Family-Based'], required: true },
      { key: 'countryOfBirth', label: 'Country of Birth', type: 'text' },
      { key: 'priorityDate', label: 'Priority Date', type: 'date' },
      { key: 'filingDate', label: 'I-485 Filing Date', type: 'date', required: true },
      { key: 'serviceCenter', label: 'Service Center / Field Office', type: 'text' },
      { key: 'caseStatus', label: 'Case Status', type: 'select', options: ['Filed', 'Biometrics Complete', 'Interview Scheduled', 'RFE Issued', 'Approved', 'Denied'], required: true },
      { key: 'caseStatusDate', label: 'Case Status Date', type: 'date' },
      { key: 'eadReceived', label: 'EAD Received', type: 'boolean' },
      { key: 'travelDocReceived', label: 'Advance Parole Received', type: 'boolean' },
    ],
  },
  dropbox: {
    slug: 'dropbox',
    table: 'dropbox_cases',
    label: 'Drop Box / Interview Waiver Tracker',
    description: 'Community-submitted interview waiver (dropbox) timelines by consulate.',
    urlPath: '/trackers/us-drop-box-visa-appointments',
    demoCount: 140,
    chartFields: ['outcome', 'consulate', 'visaType'],
    fields: [
      { key: 'visaType', label: 'Visa Type', type: 'text', required: true },
      { key: 'consulate', label: 'Consulate', type: 'text', required: true },
      { key: 'eligibilitySubmittedDate', label: 'Eligibility Submitted', type: 'date' },
      { key: 'dropboxDate', label: 'Dropbox Date', type: 'date' },
      { key: 'outcome', label: 'Outcome', type: 'select', options: ['Approved', 'RFE', 'Administrative Processing', 'Denied', 'Pending'], required: true },
      { key: 'daysWaited', label: 'Days Waited', type: 'number' },
    ],
  },
  reschedule: {
    slug: 'reschedule',
    table: 'consulate_reschedule_cases',
    label: 'Consulate Reschedule Tracker',
    description: 'Community reports on how far out reschedule slots opened up, by consulate.',
    urlPath: '/trackers/us-consulate-reschedule-tracker',
    demoCount: 95,
    chartFields: ['consulate', 'reason', 'success'],
    fields: [
      { key: 'consulate', label: 'Consulate', type: 'text', required: true },
      { key: 'originalAppointmentDate', label: 'Original Appointment', type: 'date' },
      { key: 'rescheduledDate', label: 'New Appointment', type: 'date' },
      { key: 'reason', label: 'Reason', type: 'select', options: ['Travel Conflict', 'Document Not Ready', 'Earlier Slot Found', 'Other'] },
      { key: 'success', label: 'Successfully Rescheduled', type: 'boolean' },
    ],
  },
  '221g': {
    slug: '221g',
    table: 'cases_221g',
    label: '221(g) Administrative Processing Tracker',
    description: 'Community-submitted 221(g) administrative processing timelines, by consulate and resolution.',
    urlPath: '/us-visa-trackers/221g-tracker',
    demoCount: 110,
    chartFields: ['resolutionStatus', 'visaType', 'consulate'],
    fields: [
      { key: 'visaType', label: 'Visa Type', type: 'text', required: true },
      { key: 'consulate', label: 'Consulate', type: 'text', required: true },
      { key: 'dateIssued', label: 'Date 221(g) Issued', type: 'date' },
      { key: 'documentsRequested', label: 'Documents Requested', type: 'text' },
      { key: 'resolutionStatus', label: 'Resolution Status', type: 'select', options: ['Pending', 'Resolved - Approved', 'Resolved - Denied'], required: true },
      { key: 'daysToResolve', label: 'Days to Resolve', type: 'number' },
    ],
  },
  emergency: {
    slug: 'emergency',
    table: 'emergency_appointment_cases',
    label: 'Emergency Appointment Tracker',
    description: 'Community reports on emergency/expedite appointment requests and outcomes, by consulate.',
    urlPath: '/trackers/us-emergency-visa-appointments',
    demoCount: 85,
    chartFields: ['outcome', 'requestReason', 'consulate'],
    fields: [
      { key: 'visaType', label: 'Visa Type', type: 'text', required: true },
      { key: 'consulate', label: 'Consulate', type: 'text', required: true },
      { key: 'requestReason', label: 'Request Reason', type: 'select', options: ['Medical Emergency', 'Death in Family', 'Business Critical Travel', 'Other'] },
      { key: 'requestDate', label: 'Request Date', type: 'date' },
      { key: 'outcome', label: 'Outcome', type: 'select', options: ['Granted', 'Denied', 'Pending'], required: true },
      { key: 'appointmentGrantedDate', label: 'Appointment Date (if granted)', type: 'date' },
    ],
  },
};

function seededRand(seedStr: string) {
  let h = 0;
  for (let i = 0; i < seedStr.length; i++) h = (h * 31 + seedStr.charCodeAt(i)) >>> 0;
  return (h % 10000) / 10000;
}

function pick<T>(arr: T[], seed: string): T {
  const idx = Math.floor(seededRand(seed) * arr.length);
  return arr[Math.min(idx, arr.length - 1)];
}

function randomDate(seed: string, monthsBack = 12) {
  const days = Math.floor(seededRand(seed) * monthsBack * 30.44);
  const d = new Date(2026, 5, 19);
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

const COUNTRIES = ['India', 'China', 'Mexico', 'Philippines', 'Vietnam', 'Nigeria', 'Brazil', 'South Korea', 'Canada', 'United Kingdom'];
const CONSULATES = ['New Delhi', 'Mumbai', 'Chennai', 'Beijing', 'Shanghai', 'Mexico City', 'Manila', 'London', 'Toronto', 'Sao Paulo'];
const VISA_TYPES = ['B1/B2', 'F-1', 'H-1B', 'L-1', 'O-1', 'J-1'];

/** Generates deterministic demo rows for a tracker so pages never render empty
 *  before any real cases have been submitted. */
export function generateDemoRows(config: TrackerConfig): Record<string, any>[] {
  const rows: Record<string, any>[] = [];
  for (let i = 0; i < config.demoCount; i++) {
    const seedBase = `${config.slug}-${i}`;
    const row: Record<string, any> = {
      id: `demo-${config.slug}-${i}`,
      createdAt: randomDate(`${seedBase}-created`, 14),
    };
    for (const field of config.fields) {
      const fieldSeed = `${seedBase}-${field.key}`;
      switch (field.type) {
        case 'select':
          row[field.key] = field.options ? pick(field.options, fieldSeed) : null;
          break;
        case 'boolean':
          row[field.key] = seededRand(fieldSeed) > 0.55;
          break;
        case 'number':
          row[field.key] = Math.floor(seededRand(fieldSeed) * 90) + 5;
          break;
        case 'date':
          row[field.key] = randomDate(fieldSeed);
          break;
        case 'text':
        default:
          if (field.key === 'consulate') row[field.key] = pick(CONSULATES, fieldSeed);
          else if (field.key === 'countryOfBirth') row[field.key] = pick(COUNTRIES, fieldSeed);
          else if (field.key === 'visaType') row[field.key] = pick(VISA_TYPES, fieldSeed);
          else if (field.key === 'receiptNumber') row[field.key] = `EAC${2600000000 + Math.floor(seededRand(fieldSeed) * 99999)}`;
          else row[field.key] = '';
      }
    }
    rows.push(row);
  }
  return rows;
}

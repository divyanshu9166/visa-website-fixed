// Master registry of every visa/form page the site generates.
// This drives the data fetcher, the content collection files, and getStaticPaths()
// on /uscis-processing-times/[visaSlug].astro.
//
// `ustcisFormType` + `uscisSubtype` map to the real egov.uscis.gov processing-times
// API, e.g.:
//   https://egov.uscis.gov/processing-times/api/processingtime/{formType}/{serviceCenterSlug}
//
// Real public service-center slugs used by that API:
const SERVICE_CENTERS = [
  { name: 'California Service Center', slug: 'california-service-center', code: 'CSC' },
  { name: 'Nebraska Service Center', slug: 'nebraska-service-center', code: 'NSC' },
  { name: 'Texas Service Center', slug: 'texas-service-center', code: 'TSC' },
  { name: 'Vermont Service Center', slug: 'vermont-service-center', code: 'VSC' },
  { name: 'Potomac Service Center', slug: 'potomac-service-center', code: 'POS' },
  { name: 'National Benefits Center', slug: 'national-benefits-center', code: 'NBC' },
];

const byCode = (codes) => SERVICE_CENTERS.filter((sc) => codes.includes(sc.code));

export const FORMS = [
  {
    visaSlug: 'h1b-visa',
    visaLabel: 'H-1B Visa',
    formType: 'I-129',
    formName: 'Petition for a Nonimmigrant Worker',
    category: 'work-visas',
    centers: byCode(['CSC', 'NSC', 'TSC', 'VSC']),
    caseTypes: [
      'H-1B - Specialty occupation - Extension of stay in the U.S.',
      'H-1B - Specialty occupation - Change of employer',
      'H-1B - Specialty occupation - New employment',
    ],
    baseMonths: [4.5, 5.5],
  },
  {
    visaSlug: 'l1-visa',
    visaLabel: 'L-1 Visa',
    formType: 'I-129',
    formName: 'Petition for a Nonimmigrant Worker',
    category: 'work-visas',
    centers: byCode(['CSC', 'NSC', 'TSC', 'VSC']),
    caseTypes: [
      'L-1A - Intracompany transferee - Extension of stay in the U.S.',
      'L-1B - Intracompany transferee - New employment',
    ],
    baseMonths: [5, 7.5],
  },
  {
    visaSlug: 'o1-visa',
    visaLabel: 'O-1 Visa',
    formType: 'I-129',
    formName: 'Petition for a Nonimmigrant Worker',
    category: 'work-visas',
    centers: byCode(['CSC', 'VSC']),
    caseTypes: ['O-1 - Extraordinary ability - New employment'],
    baseMonths: [2.5, 4],
  },
  {
    visaSlug: 'h4-visa',
    visaLabel: 'H-4 Dependent Visa',
    formType: 'I-539',
    formName: 'Application to Extend/Change Nonimmigrant Status',
    category: 'dependent',
    centers: byCode(['CSC', 'NSC', 'TSC', 'VSC']),
    caseTypes: ['H-4 - Spouse or child of H-1B - Extension of stay'],
    baseMonths: [5, 9],
  },
  {
    visaSlug: 'l2-visa',
    visaLabel: 'L-2 Dependent Visa',
    formType: 'I-539',
    formName: 'Application to Extend/Change Nonimmigrant Status',
    category: 'dependent',
    centers: byCode(['CSC', 'NSC', 'TSC', 'VSC']),
    caseTypes: ['L-2 - Spouse or child of L-1 - Extension of stay'],
    baseMonths: [4.5, 8],
  },
  {
    visaSlug: 'h4-ead',
    visaLabel: 'H-4 EAD (Work Permit)',
    formType: 'I-765',
    formName: 'Application for Employment Authorization',
    category: 'dependent',
    centers: byCode(['NSC', 'TSC']),
    caseTypes: ['c(26) - H-4 spouse work authorization'],
    baseMonths: [3, 5.5],
  },
  {
    visaSlug: 'i-140',
    visaLabel: 'I-140 Immigrant Petition',
    formType: 'I-140',
    formName: 'Immigrant Petition for Alien Worker',
    category: 'green-card',
    centers: byCode(['NSC', 'TSC']),
    caseTypes: [
      'I-140 - EB-1 - Extraordinary ability / outstanding researcher',
      'I-140 - EB-2 - Advanced degree / National Interest Waiver',
      'I-140 - EB-3 - Skilled worker / professional',
    ],
    baseMonths: [6, 11],
  },
  {
    visaSlug: 'i-485-eb',
    visaLabel: 'I-485 Adjustment of Status (Employment-Based)',
    formType: 'I-485',
    formName: 'Application to Register Permanent Residence or Adjust Status',
    category: 'green-card',
    centers: byCode(['NBC']),
    caseTypes: ['I-485 - Employment-based adjustment of status'],
    baseMonths: [10, 18],
  },
  {
    visaSlug: 'i-485-family',
    visaLabel: 'I-485 Adjustment of Status (Family-Based)',
    formType: 'I-485',
    formName: 'Application to Register Permanent Residence or Adjust Status',
    category: 'green-card',
    centers: byCode(['NBC']),
    caseTypes: ['I-485 - Family-based adjustment of status (immediate relative)'],
    baseMonths: [12, 22],
  },
  {
    visaSlug: 'i-131',
    visaLabel: 'I-131 Advance Parole / Travel Document',
    formType: 'I-131',
    formName: 'Application for Travel Document',
    category: 'green-card',
    centers: byCode(['NBC']),
    caseTypes: ['I-131 - Advance Parole (pending I-485)', 'I-131 - Reentry Permit'],
    baseMonths: [4, 7],
  },
  {
    visaSlug: 'i485-ead',
    visaLabel: 'EAD for Pending I-485 (c(9))',
    formType: 'I-765',
    formName: 'Application for Employment Authorization',
    category: 'green-card',
    centers: byCode(['NBC']),
    caseTypes: ['c(9) - Pending adjustment of status applicant'],
    baseMonths: [3.5, 6],
  },
  {
    visaSlug: 'opt-ead',
    visaLabel: 'OPT / STEM OPT EAD',
    formType: 'I-765',
    formName: 'Application for Employment Authorization',
    category: 'student',
    centers: byCode(['NSC', 'TSC', 'CSC']),
    caseTypes: ['c(3)(B) - Post-completion OPT', 'c(3)(C) - 24-month STEM OPT extension'],
    baseMonths: [2.5, 4.5],
  },
  {
    visaSlug: 'i-90',
    visaLabel: 'I-90 Green Card Renewal/Replacement',
    formType: 'I-90',
    formName: 'Application to Replace Permanent Resident Card',
    category: 'green-card',
    centers: byCode(['NBC']),
    caseTypes: ['I-90 - Renewal of expiring green card', 'I-90 - Replacement of lost/stolen card'],
    baseMonths: [5, 9],
  },
  {
    visaSlug: 'n-400',
    visaLabel: 'N-400 Naturalization',
    formType: 'N-400',
    formName: 'Application for Naturalization',
    category: 'citizenship',
    centers: byCode(['NBC']),
    caseTypes: ['N-400 - Naturalization application (field office average)'],
    baseMonths: [6, 13],
  },
  {
    visaSlug: 'i-526',
    visaLabel: 'I-526 EB-5 Investor Petition',
    formType: 'I-526',
    formName: 'Immigrant Petition by Standalone Investor',
    category: 'green-card',
    centers: byCode(['POS']),
    caseTypes: ['I-526 - EB-5 standalone investor petition'],
    baseMonths: [28, 44],
  },
  {
    visaSlug: 'i-829',
    visaLabel: 'I-829 Removal of Conditions (EB-5)',
    formType: 'I-829',
    formName: 'Petition by Investor to Remove Conditions',
    category: 'green-card',
    centers: byCode(['POS']),
    caseTypes: ['I-829 - Removal of conditions on EB-5 permanent residence'],
    baseMonths: [30, 48],
  },
];

export { SERVICE_CENTERS };

// Countries tracked for Visa Bulletin (Phase 1: the historically backlogged countries
// plus a "Rest of World" / "All Chargeability Areas" bucket).
export const BULLETIN_COUNTRIES = [
  { name: 'India', slug: 'india' },
  { name: 'China', slug: 'china' },
  { name: 'Mexico', slug: 'mexico' },
  { name: 'Philippines', slug: 'philippines' },
  { name: 'Vietnam', slug: 'vietnam' },
  { name: 'All Chargeability Areas (Rest of World)', slug: 'rest-of-world' },
];

export const BULLETIN_CATEGORIES = ['EB-1', 'EB-2', 'EB-3', 'EB-4', 'EB-5'];

// Representative set of countries for the appointment-wait-times section.
// (The real State Dept XML covers 190+ posts; this seed covers the highest-traffic
// posts. fetchWaitTimes() in waitTimes.mjs will pull ALL of them when run with
// real network access — see that file.)
export const WAIT_TIME_COUNTRIES = [
  { name: 'India', slug: 'india', countryCode: 'IN', consulates: ['New Delhi', 'Mumbai', 'Chennai', 'Hyderabad', 'Kolkata'] },
  { name: 'China', slug: 'china', countryCode: 'CN', consulates: ['Beijing', 'Shanghai', 'Guangzhou'] },
  { name: 'Mexico', slug: 'mexico', countryCode: 'MX', consulates: ['Mexico City', 'Guadalajara', 'Tijuana', 'Ciudad Juarez'] },
  { name: 'Philippines', slug: 'philippines', countryCode: 'PH', consulates: ['Manila'] },
  { name: 'Nigeria', slug: 'nigeria', countryCode: 'NG', consulates: ['Lagos', 'Abuja'] },
  { name: 'Brazil', slug: 'brazil', countryCode: 'BR', consulates: ['Sao Paulo', 'Rio de Janeiro', 'Brasilia'] },
  { name: 'United Kingdom', slug: 'united-kingdom', countryCode: 'GB', consulates: ['London'] },
  { name: 'Canada', slug: 'canada', countryCode: 'CA', consulates: ['Toronto', 'Vancouver', 'Montreal'] },
  { name: 'Vietnam', slug: 'vietnam', countryCode: 'VN', consulates: ['Ho Chi Minh City', 'Hanoi'] },
  { name: 'Pakistan', slug: 'pakistan', countryCode: 'PK', consulates: ['Islamabad', 'Karachi', 'Lahore'] },
  { name: 'Bangladesh', slug: 'bangladesh', countryCode: 'BD', consulates: ['Dhaka'] },
  { name: 'Nepal', slug: 'nepal', countryCode: 'NP', consulates: ['Kathmandu'] },
  { name: 'Colombia', slug: 'colombia', countryCode: 'CO', consulates: ['Bogota'] },
  { name: 'Indonesia', slug: 'indonesia', countryCode: 'ID', consulates: ['Jakarta', 'Surabaya'] },
  { name: 'South Korea', slug: 'south-korea', countryCode: 'KR', consulates: ['Seoul'] },
  { name: 'Egypt', slug: 'egypt', countryCode: 'EG', consulates: ['Cairo'] },
  { name: 'Turkey', slug: 'turkey', countryCode: 'TR', consulates: ['Istanbul', 'Ankara'] },
  { name: 'Ethiopia', slug: 'ethiopia', countryCode: 'ET', consulates: ['Addis Ababa'] },
  { name: 'Ghana', slug: 'ghana', countryCode: 'GH', consulates: ['Accra'] },
  { name: 'Dominican Republic', slug: 'dominican-republic', countryCode: 'DO', consulates: ['Santo Domingo'] },
  { name: 'Peru', slug: 'peru', countryCode: 'PE', consulates: ['Lima'] },
  { name: 'Argentina', slug: 'argentina', countryCode: 'AR', consulates: ['Buenos Aires'] },
  { name: 'France', slug: 'france', countryCode: 'FR', consulates: ['Paris'] },
  { name: 'Germany', slug: 'germany', countryCode: 'DE', consulates: ['Frankfurt', 'Berlin'] },
  { name: 'South Africa', slug: 'south-africa', countryCode: 'ZA', consulates: ['Johannesburg', 'Cape Town'] },
  { name: 'Saudi Arabia', slug: 'saudi-arabia', countryCode: 'SA', consulates: ['Riyadh', 'Jeddah'] },
  { name: 'United Arab Emirates', slug: 'united-arab-emirates', countryCode: 'AE', consulates: ['Dubai', 'Abu Dhabi'] },
  { name: 'Israel', slug: 'israel', countryCode: 'IL', consulates: ['Jerusalem', 'Tel Aviv'] },
  { name: 'Kenya', slug: 'kenya', countryCode: 'KE', consulates: ['Nairobi'] },
  { name: 'Jamaica', slug: 'jamaica', countryCode: 'JM', consulates: ['Kingston'] },
];

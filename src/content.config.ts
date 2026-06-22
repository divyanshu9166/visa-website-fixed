import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const uscisQuarterlyStats = defineCollection({
  loader: glob({ pattern: "*.json", base: "./src/content/uscisQuarterlyStats" }),
  schema: z.object({
    formType: z.string(),        // e.g. "I-485"
    formName: z.string(),        // e.g. "Adjustment of Status"
    fiscalYear: z.number(),
    quarter: z.number(),         // 1-4
    receipts: z.number().optional(),
    completions: z.number().optional(),
    pending: z.number().optional(),
    rfeRate: z.number().optional(),   // % of cases issued a Request for Evidence
    sourceUrl: z.string(),        // the exact USCIS XLSX this came from
    lastUpdated: z.string(),     // ISO date
  }),
});

const visaBulletin = defineCollection({
  loader: glob({ pattern: "*.json", base: "./src/content/visaBulletin" }),
  schema: z.object({
    month: z.string(),
    category: z.string(),
    country: z.string(),
    finalActionDate: z.string().nullable(),
    dateForFiling: z.string().nullable(),
  }),
});

// Per-form USCIS processing times (mirrors egov.uscis.gov/processing-times API shape)
const caseTypeSchema = z.object({
  caseType: z.string(),
  minMonths: z.number(),
  maxMonths: z.number(),
  serviceRequestDate: z.string().nullable(),
  history: z.array(z.object({
    period: z.string(),      // "2026-05"
    min: z.number(),
    max: z.number(),
  })).default([]),
});

const serviceCenterSchema = z.object({
  name: z.string(),
  slug: z.string(),
  code: z.string(),
  cases: z.array(caseTypeSchema),
});

const processingTimes = defineCollection({
  loader: glob({ pattern: "*.json", base: "./src/content/processingTimes" }),
  schema: z.object({
    visaSlug: z.string(),          // URL key, e.g. "h1b-visa"
    visaLabel: z.string(),         // e.g. "H-1B Visa"
    formType: z.string(),          // e.g. "I-129"
    formName: z.string(),
    category: z.enum(['work-visas', 'green-card', 'student', 'dependent', 'citizenship', 'other']),
    seoTitle: z.string(),
    seoDesc: z.string(),
    lastUpdated: z.string(),
    dataSource: z.enum(['live', 'seed']).default('seed'),
    sourceUrl: z.string(),
    servicecenters: z.array(serviceCenterSchema),
    relatedPages: z.array(z.string()).default([]),
    seoText: z.string().default(''),
    faqs: z.array(z.object({ q: z.string(), a: z.string() })).default([]),
  }),
});

// State Dept appointment wait times by country
const appointmentWaitTimes = defineCollection({
  loader: glob({ pattern: "*.json", base: "./src/content/appointmentWaitTimes" }),
  schema: z.object({
    country: z.string(),
    slug: z.string(),
    countryCode: z.string(),
    lastUpdated: z.string(),
    dataSource: z.enum(['live', 'seed']).default('seed'),
    consulates: z.array(z.object({
      name: z.string(),
      waitTimeB1B2: z.number().nullable(),
      waitTimeStudent: z.number().nullable(),
      waitTimeOther: z.number().nullable(),
      hasEmergencyAppointments: z.boolean().default(false),
      notes: z.string().default(''),
      history: z.array(z.object({
        period: z.string(),
        waitTimeB1B2: z.number().nullable(),
      })).default([]),
    })),
  }),
});

export const collections = { uscisQuarterlyStats, visaBulletin, processingTimes, appointmentWaitTimes };

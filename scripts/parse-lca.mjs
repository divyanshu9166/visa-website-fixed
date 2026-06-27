import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Expects CSV file path as first argument
const inputFile = process.argv[2] || path.join(process.cwd(), 'lca-data.csv');

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' && line[i + 1] === '"') {
      current += '"';
      i++;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function generateSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function main() {
  if (!fs.existsSync(inputFile)) {
    console.error(`File not found: ${inputFile}. Please download the DOL LCA CSV and provide its path.`);
    process.exit(1);
  }

  console.log(`Parsing LCA data from ${inputFile}...`);
  const fileStream = fs.createReadStream(inputFile);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let headers = [];
  let isFirstLine = true;

  // We'll aggregate stats in memory for simplicity, though for 30K employers it could take some RAM.
  // We'll keep it as a map of employer Name to stats.
  const employers = new Map();

  let lineCount = 0;

  for await (const line of rl) {
    if (isFirstLine) {
      headers = parseCSVLine(line).map(h => h.trim().toUpperCase());
      isFirstLine = false;
      continue;
    }

    lineCount++;
    if (lineCount % 10000 === 0) {
      console.log(`Processed ${lineCount} rows...`);
    }

    const rowArray = parseCSVLine(line);
    const row = {};
    headers.forEach((h, i) => { row[h] = rowArray[i]; });

    // The column names depend on the DOL format. Typical columns:
    // EMPLOYER_NAME, CASE_STATUS, WAGE_RATE_OF_PAY_FROM, SOC_TITLE, WORKSITE_STATE, PW_WAGE_LEVEL
    const employerName = row['EMPLOYER_NAME'] || row['EMPLOYER_BUSINESS_NAME'];
    const caseStatus = row['CASE_STATUS'];
    const wageStr = row['WAGE_RATE_OF_PAY_FROM'];
    const socTitle = row['SOC_TITLE'] || row['SOC_NAME'];
    const state = row['WORKSITE_STATE'];
    const wageLevel = row['PW_WAGE_LEVEL'];

    if (!employerName) continue;

    const empNameUpper = employerName.trim().toUpperCase();
    if (!employers.has(empNameUpper)) {
      employers.set(empNameUpper, {
        originalName: employerName.trim(),
        totalLCAs: 0,
        approvedLCAs: 0,
        wages: [],
        titles: {},
        states: {},
        wageLevels: { L1: 0, L2: 0, L3: 0, L4: 0 }
      });
    }

    const emp = employers.get(empNameUpper);
    emp.totalLCAs++;

    if (caseStatus && caseStatus.toUpperCase().includes('CERTIFIED')) {
      emp.approvedLCAs++;
    }

    if (wageStr) {
      const wage = parseFloat(wageStr.replace(/[^0-9.]/g, ''));
      if (!isNaN(wage) && wage > 0) {
        // Assume annual. If too small, might be hourly, but keep simple for now
        emp.wages.push(wage);
      }
    }

    if (socTitle) {
      emp.titles[socTitle] = (emp.titles[socTitle] || 0) + 1;
    }

    if (state) {
      emp.states[state] = (emp.states[state] || 0) + 1;
    }

    if (wageLevel) {
      let l = wageLevel.trim().toUpperCase();
      if (l.includes('I') && !l.includes('II')) emp.wageLevels.L1++;
      if (l.includes('II') && !l.includes('III')) emp.wageLevels.L2++;
      if (l.includes('III')) emp.wageLevels.L3++;
      if (l.includes('IV')) emp.wageLevels.L4++;
    }
  }

  console.log(`Aggregation complete. Found ${employers.size} unique employers. Seeding to database...`);

  // Transform and insert
  const dataToInsert = [];
  for (const [_, emp] of employers) {
    emp.wages.sort((a, b) => a - b);
    let avgWage = 0;
    let medianWage = 0;
    if (emp.wages.length > 0) {
      avgWage = emp.wages.reduce((a, b) => a + b, 0) / emp.wages.length;
      medianWage = emp.wages[Math.floor(emp.wages.length / 2)];
    }

    const topTitles = Object.entries(emp.titles)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([title, count]) => ({ title, count, avgWage: 0, socCode: '' }));

    const topStates = Object.entries(emp.states)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([state, count]) => ({ state, count }));

    dataToInsert.push({
      employerName: emp.originalName,
      slug: generateSlug(emp.originalName) + '-' + Math.random().toString(36).substring(2, 7), // Ensure uniqueness
      totalLCAs: emp.totalLCAs,
      approvalRate: emp.totalLCAs > 0 ? parseFloat(((emp.approvedLCAs / emp.totalLCAs) * 100).toFixed(2)) : 0,
      avgWage: Math.round(avgWage),
      medianWage: Math.round(medianWage),
      topTitles,
      topStates,
      wageLevelDist: emp.wageLevels,
      fiscalYear: 2024,
      grade: emp.totalLCAs > 100 && (emp.approvedLCAs / emp.totalLCAs) > 0.95 ? 'A' : 'B',
      lastUpdated: new Date()
    });
  }

  // Insert in chunks to avoid blowing up Prisma connection
  const chunkSize = 1000;
  for (let i = 0; i < dataToInsert.length; i += chunkSize) {
    const chunk = dataToInsert.slice(i, i + chunkSize);
    await prisma.lcaEmployer.createMany({
      data: chunk,
      skipDuplicates: true
    });
    console.log(`Inserted chunk ${Math.floor(i/chunkSize) + 1} of ${Math.ceil(dataToInsert.length/chunkSize)}`);
  }

  console.log('Seeding complete!');
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});

/**
 * Claude Learning Tracker
 * Background service that monitors logs and captures:
 * - Errors and their solutions
 * - User corrections and guidelines
 * - Repeated mistakes
 * - Configuration facts
 */

const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');

const MEMORY_FILE = path.join(__dirname, '..', 'CLAUDE_MEMORY.md');
const ERRORS_DB = path.join(__dirname, '..', '.claude', 'errors.json');
const CORRECTIONS_DB = path.join(__dirname, '..', '.claude', 'corrections.json');
const LOG_DIR = path.join(__dirname, '..', 'log');

// Ensure directories exist
const claudeDir = path.join(__dirname, '..', '.claude');
if (!fs.existsSync(claudeDir)) {
  fs.mkdirSync(claudeDir, { recursive: true });
}

// Initialize databases
let errorsDB = loadJSON(ERRORS_DB, { errors: [], patterns: {} });
let correctionsDB = loadJSON(CORRECTIONS_DB, { corrections: [], facts: {} });

function loadJSON(filePath, defaultValue = {}) {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  } catch (error) {
    console.error(`Error loading ${filePath}:`, error.message);
  }
  return defaultValue;
}

function saveJSON(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error(`Error saving ${filePath}:`, error.message);
  }
}

function captureError(errorText, context = {}) {
  const errorHash = hashString(errorText);

  if (!errorsDB.patterns[errorHash]) {
    errorsDB.patterns[errorHash] = {
      error: errorText,
      occurrences: 0,
      firstSeen: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
      contexts: [],
      solutions: []
    };
  }

  errorsDB.patterns[errorHash].occurrences++;
  errorsDB.patterns[errorHash].lastSeen = new Date().toISOString();
  errorsDB.patterns[errorHash].contexts.push({
    timestamp: new Date().toISOString(),
    ...context
  });

  // Alert if error repeats more than 3 times
  if (errorsDB.patterns[errorHash].occurrences > 3) {
    console.warn(`\n⚠️  REPEATED ERROR (${errorsDB.patterns[errorHash].occurrences}x): ${errorText.substring(0, 100)}...\n`);
    updateMemoryFile('REPEATED_ERROR', errorText, errorsDB.patterns[errorHash]);
  }

  saveJSON(ERRORS_DB, errorsDB);
}

function captureCorrection(wrongAssumption, correctFact, userQuote = '') {
  const correctionHash = hashString(wrongAssumption);

  correctionsDB.facts[correctionHash] = {
    wrong: wrongAssumption,
    correct: correctFact,
    userQuote: userQuote,
    timestamp: new Date().toISOString(),
    violations: (correctionsDB.facts[correctionHash]?.violations || 0) + 1
  };

  console.log(`\n📝 CORRECTION CAPTURED:`);
  console.log(`   ❌ Wrong: ${wrongAssumption}`);
  console.log(`   ✅ Correct: ${correctFact}`);
  if (userQuote) {
    console.log(`   💬 User said: "${userQuote}"`);
  }

  saveJSON(CORRECTIONS_DB, correctionsDB);
  updateMemoryFile('CORRECTION', wrongAssumption, correctFact, userQuote);
}

function updateMemoryFile(type, key, value, extra = '') {
  let memoryContent = '';

  if (fs.existsSync(MEMORY_FILE)) {
    memoryContent = fs.readFileSync(MEMORY_FILE, 'utf8');
  }

  const timestamp = new Date().toISOString();

  if (type === 'REPEATED_ERROR') {
    const section = `\n\n### ⚠️ Repeated Error Alert (${timestamp})\n\n`;
    const content = `**Error**: ${key}\n\n**Occurrences**: ${value.occurrences}\n\n**Last Seen**: ${value.lastSeen}\n\n`;

    if (!memoryContent.includes(key.substring(0, 50))) {
      memoryContent += section + content;
    }
  } else if (type === 'CORRECTION') {
    const section = `\n\n### 📝 Correction Captured (${timestamp})\n\n`;
    const content = `**❌ Wrong Assumption**: ${key}\n\n**✅ Correct Fact**: ${value}\n\n${extra ? `**💬 User Quote**: "${extra}"\n\n` : ''}`;

    if (!memoryContent.includes(key)) {
      memoryContent += section + content;
    }
  }

  fs.writeFileSync(MEMORY_FILE, memoryContent, 'utf8');
}

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

function parseLogFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    for (const line of lines) {
      // Detect errors
      if (line.includes('error') || line.includes('Error') || line.includes('failed')) {
        const errorMatch = line.match(/error[:\s]+(.+?)(?:\n|$)/i);
        if (errorMatch) {
          captureError(errorMatch[1], { file: filePath, line: line.trim() });
        }
      }

      // Detect user corrections
      if (line.includes('NO!!!') || line.includes('wrong') || line.includes('stupid')) {
        const context = lines[lines.indexOf(line) + 1] || '';
        console.log(`\n🚨 USER FRUSTRATION DETECTED: ${line.substring(0, 100)}...\n`);
      }

      // Detect model name mentions
      if (line.includes('gemini-1.5') && !line.includes('gemini-2.5')) {
        captureCorrection(
          'Suggesting gemini-1.5-flash',
          'Use gemini-2.5-flash as configured',
          'User has confirmed gemini-2.5-flash multiple times'
        );
      }
    }
  } catch (error) {
    // Ignore file read errors
  }
}

function watchLogs() {
  console.log('📚 Claude Learning Tracker started');
  console.log(`   Watching: ${LOG_DIR}`);
  console.log(`   Errors DB: ${ERRORS_DB}`);
  console.log(`   Corrections DB: ${CORRECTIONS_DB}`);
  console.log(`   Memory File: ${MEMORY_FILE}\n`);

  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }

  const watcher = chokidar.watch(LOG_DIR, {
    ignored: /^\./,
    persistent: true,
    ignoreInitial: false
  });

  watcher
    .on('add', filePath => {
      if (filePath.endsWith('.txt') || filePath.endsWith('.md')) {
        console.log(`📄 Analyzing: ${path.basename(filePath)}`);
        parseLogFile(filePath);
      }
    })
    .on('change', filePath => {
      if (filePath.endsWith('.txt') || filePath.endsWith('.md')) {
        parseLogFile(filePath);
      }
    });
}

// API to query learned facts
function queryFact(keyword) {
  const results = [];

  for (const hash in correctionsDB.facts) {
    const fact = correctionsDB.facts[hash];
    if (fact.wrong.toLowerCase().includes(keyword.toLowerCase()) ||
        fact.correct.toLowerCase().includes(keyword.toLowerCase())) {
      results.push(fact);
    }
  }

  return results;
}

// API to get repeated errors
function getRepeatedErrors(minOccurrences = 2) {
  const repeated = [];

  for (const hash in errorsDB.patterns) {
    const error = errorsDB.patterns[hash];
    if (error.occurrences >= minOccurrences) {
      repeated.push(error);
    }
  }

  return repeated.sort((a, b) => b.occurrences - a.occurrences);
}

// Generate summary report
function generateReport() {
  const report = {
    timestamp: new Date().toISOString(),
    totalErrors: Object.keys(errorsDB.patterns).length,
    repeatedErrors: getRepeatedErrors(2).length,
    totalCorrections: Object.keys(correctionsDB.facts).length,
    topErrors: getRepeatedErrors(2).slice(0, 5),
    criticalFacts: Object.values(correctionsDB.facts)
      .filter(f => f.violations > 1)
      .sort((a, b) => b.violations - a.violations)
  };

  console.log('\n' + '='.repeat(60));
  console.log('📊 LEARNING TRACKER REPORT');
  console.log('='.repeat(60));
  console.log(`Total Unique Errors: ${report.totalErrors}`);
  console.log(`Repeated Errors (2+): ${report.repeatedErrors}`);
  console.log(`Total Corrections: ${report.totalCorrections}`);
  console.log('\nTop Repeated Errors:');
  report.topErrors.forEach((err, i) => {
    console.log(`${i + 1}. [${err.occurrences}x] ${err.error.substring(0, 80)}...`);
  });
  console.log('\nCritical Facts (violated multiple times):');
  report.criticalFacts.forEach((fact, i) => {
    console.log(`${i + 1}. [${fact.violations}x violations]`);
    console.log(`   ❌ Wrong: ${fact.wrong}`);
    console.log(`   ✅ Correct: ${fact.correct}`);
  });
  console.log('='.repeat(60) + '\n');

  return report;
}

// Command line interface
if (require.main === module) {
  const command = process.argv[2];

  if (command === 'watch') {
    watchLogs();
  } else if (command === 'report') {
    generateReport();
  } else if (command === 'query' && process.argv[3]) {
    const results = queryFact(process.argv[3]);
    console.log(`Found ${results.length} facts matching "${process.argv[3]}":`);
    results.forEach((fact, i) => {
      console.log(`\n${i + 1}.`);
      console.log(`   ❌ Wrong: ${fact.wrong}`);
      console.log(`   ✅ Correct: ${fact.correct}`);
      if (fact.userQuote) {
        console.log(`   💬 User: "${fact.userQuote}"`);
      }
    });
  } else if (command === 'add-correction') {
    const wrong = process.argv[3];
    const correct = process.argv[4];
    const quote = process.argv[5] || '';
    if (wrong && correct) {
      captureCorrection(wrong, correct, quote);
      console.log('✅ Correction added successfully');
    } else {
      console.log('Usage: node learning-tracker.js add-correction "wrong assumption" "correct fact" "optional user quote"');
    }
  } else {
    console.log('Claude Learning Tracker');
    console.log('\nCommands:');
    console.log('  watch              - Start watching logs for errors and corrections');
    console.log('  report             - Generate summary report');
    console.log('  query <keyword>    - Search for learned facts');
    console.log('  add-correction "wrong" "correct" "quote" - Manually add a correction');
    console.log('\nExample:');
    console.log('  node learning-tracker.js watch');
    console.log('  node learning-tracker.js query "gemini"');
    console.log('  node learning-tracker.js add-correction "gemini-1.5-flash" "gemini-2.5-flash" "User confirmed multiple times"');
  }
}

module.exports = {
  captureError,
  captureCorrection,
  queryFact,
  getRepeatedErrors,
  generateReport,
  watchLogs
};

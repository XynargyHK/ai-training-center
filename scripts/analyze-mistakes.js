/**
 * Analyze Claude's Mistakes from Logs
 * Extracts patterns of mistakes from session logs
 */

const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '..', 'log');
const OUTPUT_FILE = path.join(__dirname, '..', 'ANALYZED_MISTAKES.md');

function analyzeLogs() {
  const mistakes = {
    coding: [],
    testing: [],
    debugging: [],
    communication: [],
    assumptions: [],
    configuration: []
  };

  const files = fs.readdirSync(LOG_DIR).filter(f => f.endsWith('.txt') || f.endsWith('.md'));

  for (const file of files) {
    const content = fs.readFileSync(path.join(LOG_DIR, file), 'utf8');
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const nextLine = lines[i + 1] || '';

      // Pattern: User says something is wrong, followed by Claude's explanation
      if (line.includes('what is wrong') || line.includes('stupid') || line.includes('error')) {
        // Look for Claude's response in next few lines
        for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
          const responseLine = lines[j];

          // Coding mistakes
          if (responseLine.includes('hardcod') || responseLine.includes('wrong model') || responseLine.includes('wrong default')) {
            mistakes.coding.push({
              context: line.substring(0, 100),
              mistake: responseLine.substring(0, 150)
            });
          }

          // Configuration mistakes
          if (responseLine.includes('.env') || responseLine.includes('environment') || responseLine.includes('API')) {
            mistakes.configuration.push({
              context: line.substring(0, 100),
              mistake: responseLine.substring(0, 150)
            });
          }

          // Communication mistakes
          if (line.includes('dont fix') || line.includes('tell me what')) {
            mistakes.communication.push({
              context: line.substring(0, 100),
              mistake: 'Not explaining before fixing'
            });
          }

          // Assumption mistakes
          if (responseLine.includes('doesn\'t exist') || responseLine.includes('should be')) {
            mistakes.assumptions.push({
              context: line.substring(0, 100),
              mistake: responseLine.substring(0, 150)
            });
          }
        }
      }

      // Pattern: "I was wrong about..."
      if (line.includes('I was wrong') || line.includes('I apologize') || line.includes('My mistake')) {
        const match = line.match(/wrong about (.+)/i) || line.match(/mistake: (.+)/i);
        if (match) {
          mistakes.debugging.push({
            admission: match[1].substring(0, 150)
          });
        }
      }
    }
  }

  return mistakes;
}

function generateReport(mistakes) {
  let report = '# Analyzed Mistakes from Logs\n\n';
  report += `Generated: ${new Date().toISOString()}\n\n`;
  report += '---\n\n';

  // Coding Mistakes
  report += '## 💻 Coding Mistakes\n\n';
  const uniqueCoding = [...new Set(mistakes.coding.map(m => m.mistake))];
  uniqueCoding.forEach((mistake, i) => {
    report += `${i + 1}. ${mistake}\n`;
  });
  report += `\n**Total Found**: ${uniqueCoding.length}\n\n`;

  // Configuration Mistakes
  report += '## 🔧 Configuration Mistakes\n\n';
  const uniqueConfig = [...new Set(mistakes.configuration.map(m => m.mistake))];
  uniqueConfig.forEach((mistake, i) => {
    report += `${i + 1}. ${mistake}\n`;
  });
  report += `\n**Total Found**: ${uniqueConfig.length}\n\n`;

  // Communication Mistakes
  report += '## 📝 Communication Mistakes\n\n';
  const uniqueComm = [...new Set(mistakes.communication.map(m => m.mistake))];
  uniqueComm.forEach((mistake, i) => {
    report += `${i + 1}. ${mistake}\n`;
  });
  report += `\n**Total Found**: ${uniqueComm.length}\n\n`;

  // Assumption Mistakes
  report += '## 🚫 Assumption Mistakes\n\n';
  const uniqueAssump = [...new Set(mistakes.assumptions.map(m => m.mistake))];
  uniqueAssump.forEach((mistake, i) => {
    report += `${i + 1}. ${mistake}\n`;
  });
  report += `\n**Total Found**: ${uniqueAssump.length}\n\n`;

  // Wrong Diagnoses
  report += '## 🔍 Wrong Diagnoses / Admissions\n\n';
  const uniqueDebug = [...new Set(mistakes.debugging.map(m => m.admission))];
  uniqueDebug.forEach((mistake, i) => {
    report += `${i + 1}. ${mistake}\n`;
  });
  report += `\n**Total Found**: ${uniqueDebug.length}\n\n`;

  // Summary
  report += '---\n\n## 📊 Summary\n\n';
  report += `- Coding Mistakes: ${uniqueCoding.length}\n`;
  report += `- Configuration Mistakes: ${uniqueConfig.length}\n`;
  report += `- Communication Mistakes: ${uniqueComm.length}\n`;
  report += `- Assumption Mistakes: ${uniqueAssump.length}\n`;
  report += `- Wrong Diagnoses: ${uniqueDebug.length}\n`;
  report += `\n**Total Unique Mistakes**: ${uniqueCoding.length + uniqueConfig.length + uniqueComm.length + uniqueAssump.length + uniqueDebug.length}\n`;

  return report;
}

console.log('🔍 Analyzing logs for mistakes...\n');

const mistakes = analyzeLogs();
const report = generateReport(mistakes);

fs.writeFileSync(OUTPUT_FILE, report, 'utf8');

console.log('✅ Analysis complete!');
console.log(`📄 Report saved to: ${OUTPUT_FILE}\n`);
console.log(report);

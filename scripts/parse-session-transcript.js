const fs = require('fs');
const path = require('path');

// Parse session JSONL file and format as readable conversation transcript
function parseSessionTranscript(sessionFilePath, outputPath) {
  console.log('Reading session file:', sessionFilePath);

  const content = fs.readFileSync(sessionFilePath, 'utf-8');
  const lines = content.split('\n').filter(l => l.trim());

  console.log('Total entries:', lines.length);

  let transcript = '';
  let messageCount = 0;
  let sessionStartTime = null;
  let sessionEndTime = null;

  for (let i = 0; i < lines.length; i++) {
    try {
      const entry = JSON.parse(lines[i]);

      // Track session times
      if (entry.timestamp) {
        if (!sessionStartTime) sessionStartTime = entry.timestamp;
        sessionEndTime = entry.timestamp;
      }

      // User messages
      if (entry.type === 'user' && entry.message && entry.message.content) {
        const content = entry.message.content;

        // Skip tool results (these are system messages)
        if (typeof content === 'string') {
          messageCount++;
          transcript += `\n> ${content}\n\n`;
        } else if (Array.isArray(content)) {
          // Check if it's a user message with text content (not tool results)
          const textContent = content.find(c => c.type === 'text');
          if (textContent) {
            messageCount++;
            transcript += `\n> ${textContent.text}\n\n`;
          }
        }
      }

      // Assistant messages
      if (entry.type === 'assistant' && entry.message && entry.message.content) {
        const content = entry.message.content;

        if (Array.isArray(content)) {
          let textParts = [];
          let toolUses = [];

          content.forEach(item => {
            if (item.type === 'text') {
              textParts.push(item.text);
            } else if (item.type === 'tool_use') {
              toolUses.push(item);
            }
          });

          // Output text in bullet points
          if (textParts.length > 0) {
            const fullText = textParts.join('\n\n');
            // Split into paragraphs and add bullet points
            const paragraphs = fullText.split('\n\n').filter(p => p.trim());
            paragraphs.forEach(para => {
              transcript += `● ${para}\n\n`;
            });
          }

          // Output tool uses
          if (toolUses.length > 0) {
            toolUses.forEach(tool => {
              transcript += `● ${tool.name}(`;

              if (tool.input) {
                const inputs = Object.entries(tool.input)
                  .map(([k, v]) => {
                    if (typeof v === 'string' && v.length > 60) {
                      return `${k}: ${v.substring(0, 60)}...`;
                    }
                    return `${k}: ${JSON.stringify(v)}`;
                  })
                  .join(', ');
                transcript += inputs;
              }

              transcript += `)\n`;
            });
            transcript += '\n';
          }
        }
      }

      // File edit results (show diffs)
      if (entry.type === 'user' && entry.toolUseResult) {
        const result = entry.toolUseResult;

        if (result.type === 'edit' && result.diff) {
          transcript += `  ⎿  Updated ${result.file.filePath}\n`;

          const diffLines = result.diff.split('\n');
          let addCount = 0;
          let removeCount = 0;

          // Count additions and removals
          diffLines.forEach(line => {
            if (line.startsWith('+') && !line.startsWith('+++')) addCount++;
            if (line.startsWith('-') && !line.startsWith('---')) removeCount++;
          });

          if (addCount > 0 || removeCount > 0) {
            transcript += `       with ${addCount} addition${addCount !== 1 ? 's' : ''} and ${removeCount} removal${removeCount !== 1 ? 's' : ''}\n`;
          }

          // Show first few lines of diff
          const contextLines = diffLines.slice(0, 15);
          contextLines.forEach(line => {
            if (line.startsWith('@@')) {
              // Line numbers
              transcript += `       ${line.substring(3)}\n`;
            } else if (line.startsWith('+') && !line.startsWith('+++')) {
              transcript += ` +     ${line.substring(1)}\n`;
            } else if (line.startsWith('-') && !line.startsWith('---')) {
              transcript += ` -     ${line.substring(1)}\n`;
            } else if (!line.startsWith('---') && !line.startsWith('+++')) {
              transcript += `       ${line}\n`;
            }
          });

          if (diffLines.length > 15) {
            transcript += `       … +${diffLines.length - 15} more lines\n`;
          }

          transcript += '\n';
        } else if (result.type === 'write') {
          transcript += `  ⎿  Created ${result.file.filePath}\n\n`;
        } else if (result.type === 'bash') {
          if (result.stdout) {
            const stdoutLines = result.stdout.split('\n');
            if (stdoutLines.length <= 5) {
              stdoutLines.forEach(line => {
                transcript += `  ⎿  ${line}\n`;
              });
            } else {
              transcript += `  ⎿  ${stdoutLines[0]}\n`;
              transcript += `     ${stdoutLines[1]}\n`;
              transcript += `     … +${stdoutLines.length - 2} lines (output truncated)\n`;
            }
            transcript += '\n';
          }
        }
      }

    } catch (e) {
      // Skip malformed entries
    }
  }

  // Write to file
  fs.writeFileSync(outputPath, transcript, 'utf-8');
  console.log(`\n✅ Transcript saved to: ${outputPath}`);
  console.log(`📊 Total user messages: ${messageCount}`);
  console.log(`📄 File size: ${Math.round(transcript.length / 1024)}KB`);

  // Return session metadata
  return {
    transcript,
    messageCount,
    startTime: sessionStartTime,
    endTime: sessionEndTime
  };
}

// Main execution
const sessionId = process.argv[2] || '70d966d2-a5e9-4f34-96d4-f2d55802f021';
const sessionFile = `C:\\Users\\Denny\\.claude\\projects\\C--Users-Denny-ai-training-center\\${sessionId}.jsonl`;

// First, read the file to get timestamp info
const content = fs.readFileSync(sessionFile, 'utf-8');
const lines = content.split('\n').filter(l => l.trim());

let sessionStartTime = null;
for (let i = 0; i < Math.min(100, lines.length); i++) {
  try {
    const entry = JSON.parse(lines[i]);
    if (entry.timestamp) {
      sessionStartTime = new Date(entry.timestamp);
      break;
    }
  } catch (e) {}
}

// Format: session-2025-11-12.txt
let dateStr = '';
if (sessionStartTime) {
  const year = sessionStartTime.getFullYear();
  const month = String(sessionStartTime.getMonth() + 1).padStart(2, '0');
  const day = String(sessionStartTime.getDate()).padStart(2, '0');
  dateStr = `${year}-${month}-${day}`;
} else {
  dateStr = 'unknown-date';
}

const outputFile = `C:\\Users\\Denny\\ai-training-center\\log\\session-${dateStr}.txt`;

// Create log directory if it doesn't exist
const logDir = path.dirname(outputFile);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

parseSessionTranscript(sessionFile, outputFile);

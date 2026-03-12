const fs = require('fs');
const path = require('path');

const editorsDir = path.join(__dirname, '../src/components/admin/landing-page/blocks');
const renderersDir = path.join(__dirname, '../src/components/landing-page/blocks');

const editors = fs.readdirSync(editorsDir).filter(f => f.endsWith('Editor.tsx')).map(f => f.replace('Editor.tsx', ''));
const renderers = fs.readdirSync(renderersDir).filter(f => f.endsWith('.tsx')).map(f => f.replace('.tsx', '').replace('SSR', ''));

const allTypes = [...new Set([...editors, ...renderers])];

console.log('=== Block Consistency Check ===');
allTypes.sort().forEach(type => {
  const hasEditor = editors.includes(type);
  const hasRenderer = renderers.includes(type);
  console.log(`${type.padEnd(20)} | Editor: ${hasEditor ? '✅' : '❌'} | Renderer: ${hasRenderer ? '✅' : '❌'}`);
});

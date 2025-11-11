const XLSX = require('xlsx');
const fs = require('fs');

// Read the most recent Excel file
const excelFile = 'knowledgebase/Booster descriptions and pricing_1762329426212.xlsx';

console.log('📖 Reading Excel file:', excelFile);
console.log('');

try {
  // Read workbook
  const workbook = XLSX.readFile(excelFile);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  // Get the range
  const range = XLSX.utils.decode_range(worksheet['!ref']);

  // Read first row (headers)
  const headers = [];
  for (let col = range.s.c; col <= range.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
    const cell = worksheet[cellAddress];
    if (cell && cell.v) {
      headers.push(cell.v);
    }
  }

  console.log('📋 Excel Column Headers:');
  console.log('========================');
  headers.forEach((header, index) => {
    console.log(`${index + 1}. ${header}`);
  });

  console.log('');
  console.log('📊 Total columns:', headers.length);
  console.log('');

  // Generate SQL table schema
  console.log('🗄️  Generated SQL Schema:');
  console.log('========================');

  const sqlColumns = headers.map(header => {
    // Clean column name (remove special chars, spaces -> underscores)
    const columnName = header
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 63); // PostgreSQL column name limit

    // Determine data type (you can refine this)
    let dataType = 'TEXT';
    if (header.toLowerCase().includes('price') || header.toLowerCase().includes('cost')) {
      dataType = 'DECIMAL(10,2)';
    } else if (header.toLowerCase().includes('quantity') || header.toLowerCase().includes('stock')) {
      dataType = 'INTEGER';
    } else if (header.toLowerCase().includes('date')) {
      dataType = 'TIMESTAMPTZ';
    }

    return { original: header, columnName, dataType };
  });

  console.log('CREATE TABLE products (');
  console.log('  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),');
  console.log('  business_unit_id UUID REFERENCES business_units(id) ON DELETE CASCADE,');
  console.log('');

  sqlColumns.forEach((col, index) => {
    const comma = index < sqlColumns.length - 1 ? ',' : '';
    console.log(`  ${col.columnName} ${col.dataType}${comma}  -- ${col.original}`);
  });

  console.log('');
  console.log('  created_at TIMESTAMPTZ DEFAULT NOW(),');
  console.log('  updated_at TIMESTAMPTZ DEFAULT NOW()');
  console.log(');');

  console.log('');
  console.log('📝 Column Mapping:');
  console.log('==================');
  sqlColumns.forEach(col => {
    console.log(`"${col.original}" → ${col.columnName} (${col.dataType})`);
  });

  // Save schema to file
  const schemaSQL = `-- Auto-generated from Excel: ${excelFile}
-- Headers: ${headers.join(', ')}

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_unit_id UUID REFERENCES business_units(id) ON DELETE CASCADE,

${sqlColumns.map(col => `  ${col.columnName} ${col.dataType}`).join(',\n')},

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_products_business_unit ON products(business_unit_id);

-- Column mapping for reference
-- ${sqlColumns.map(col => `"${col.original}" = ${col.columnName}`).join('\n-- ')}
`;

  fs.writeFileSync('sql-migrations/002_create_products_table.sql', schemaSQL);
  console.log('');
  console.log('✅ Schema saved to: sql-migrations/002_create_products_table.sql');

} catch (error) {
  console.error('❌ Error:', error.message);
}

const fs = require('fs');

// Read the file
const filePath = 'C:\\Users\\Denny\\ai-training-center\\src\\components\\admin\\ai-training-center.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Simple replacements - button text
const replacements = [
  // Common buttons
  [/>Save</g, '>{t.save}<'],
  [/>Cancel</g, '>{t.cancel}<'],
  [/>Add</g, '>{t.add}<'],
  [/>Edit</g, '>{t.edit}<'],
  [/>Delete</g, '>{t.delete}<'],
  [/>Update</g, '>{t.update}<'],
  [/>Create</g, '>{t.create}<'],
  [/>Search</g, '>{t.search}<'],

  // Status
  [/'Active'/g, 't.active'],
  [/'Inactive'/g, 't.inactive'],

  // Knowledge Base
  [/>Upload Files</g, '>{t.uploadFiles}<'],
  [/>Add URL</g, '>{t.addUrl}<'],
  [/placeholder="Search entries\.\.\."/g, 'placeholder={t.searchEntries}'],
  [/>Fetching\.\.\.</g, '>{t.fetching}<'],

  // Training
  [/>Add Guideline</g, '>{t.addGuideline}<'],
  [/>Training Guidelines</g, '>{t.trainingGuidelines}<'],
  [/>Edit Guideline</g, '>{t.editGuideline}<'],

  // FAQ
  [/>Generate FAQ</g, '>{t.generateFaq}<'],
  [/>Generating\.\.\.</g, '>{t.generating}<'],
  [/>Add Category</g, '>{t.addCategory}<'],
  [/>Edit FAQ</g, '>{t.editFaq}<'],
  [/>Question</g, '>{t.question}<'],
  [/>Answer</g, '>{t.answer}<'],
  [/>Regenerate</g, '>{t.regenerate}<'],
  [/>Regenerating\.\.\.</g, '>{t.regenerating}<'],

  // Booking - Services
  [/>Add Service</g, '>{t.addService}<'],
  [/>Edit Service</g, '>{t.editService}<'],
  [/>Add New Service</g, '>{t.addNewService}<'],
  [/>Service Name</g, '>{t.serviceName}<'],
  [/>Description</g, '>{t.description}<'],
  [/>Price \(USD\)</g, '>{t.priceUsd}<'],

  // Booking - Staff
  [/>Add Staff Member</g, '>{t.addStaffMember}<'],
  [/>Edit Staff Member</g, '>{t.editStaffMember}<'],
  [/>Add New Staff Member</g, '>{t.addNewStaffMember}<'],
  [/>Name \*</g, '>{t.nameRequired}<'],
  [/>Email \(optional\)</g, '>{t.emailOptional}<'],

  // Booking - Outlets
  [/>Add Outlet</g, '>{t.addOutlet}<'],
  [/>Edit Outlet</g, '>{t.editOutlet}<'],
  [/>Add New Outlet</g, '>{t.addNewOutlet}<'],

  // Booking - Rooms
  [/>Add Room</g, '>{t.addRoom}<'],
  [/>Edit Room</g, '>{t.editRoom}<'],
  [/>Add New Room</g, '>{t.addNewRoom}<'],

  // Section headers
  [/>Services</g, '>{t.services}<'],
  [/>Staff</g, '>{t.staff}<'],
  [/>Booking Management</g, '>{t.bookingManagement}<'],
];

// Apply all replacements
for (const [search, replace] of replacements) {
  content = content.replace(search, replace);
}

// Write back
fs.writeFileSync(filePath, content, 'utf8');

console.log('✓ Applied translations!');
console.log('Check the file for results.');

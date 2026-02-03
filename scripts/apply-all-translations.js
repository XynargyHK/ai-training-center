const fs = require('fs');

const filePath = 'C:\\Users\\Denny\\ai-training-center\\src\\components\\admin\\ai-training-center.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// ALL replacements
const replacements = [
  // Placeholders
  [/placeholder="e\.g\., AIA Insurance, FitCoach, etc\."/g, 'placeholder={t.businessNamePlaceholder}'],
  [/placeholder="e\.g\., Insurance, Fitness, etc\."/g, 'placeholder={t.industryPlaceholder}'],
  [/placeholder="Search entries\.\.\."/g, 'placeholder={t.searchEntries}'],
  [/placeholder="Enter URL \(website or YouTube video\)\.\.\."/g, 'placeholder={t.enterUrl}'],
  [/placeholder="Guideline title"/g, 'placeholder={t.guidelineTitlePlaceholder}'],
  [/placeholder="Enter guideline content here\.\.\."/g, 'placeholder={t.guidelineContentPlaceholder}'],
  [/placeholder="Category name\.\.\."/g, 'placeholder={t.categoryNamePlaceholder}'],
  [/placeholder="Ask the AI a question\.\.\."/g, 'placeholder={t.testQueryPlaceholder}'],
  [/placeholder="price, cost, how much"/g, 'placeholder={t.keywordsPlaceholder}'],
  [/placeholder="e\.g\., User says 'too expensive'"/g, 'placeholder={t.scenarioPlaceholder}'],
  [/placeholder="userName, productName"/g, 'placeholder={t.variablesPlaceholder}'],
  [/placeholder="Select a service\.\.\."/g, 'placeholder={t.selectService}'],
  [/placeholder="e\.g\., Classic Facial, Deep Tissue Massage"/g, 'placeholder={t.serviceNamePlaceholder}'],
  [/placeholder="Brief description of the service\.\.\."/g, 'placeholder={t.descriptionPlaceholder}'],
  [/placeholder="e\.g\., 89\.99"/g, 'placeholder={t.pricePlaceholder}'],
  [/placeholder="e\.g\., Sarah Johnson"/g, 'placeholder={t.namePlaceholder}'],
  [/placeholder="sarah@example\.com"/g, 'placeholder={t.emailPlaceholder}'],
  [/placeholder="e\.g\., Therapist, Esthetician"/g, 'placeholder={t.staffTypePlaceholder}'],
  [/placeholder="e\.g\., Downtown Location, Main Street Salon"/g, 'placeholder={t.outletNamePlaceholder}'],
  [/placeholder="Street address"/g, 'placeholder={t.addressLine1Placeholder}'],
  [/placeholder="Apartment, suite, unit, building, floor, etc\."/g, 'placeholder={t.addressLine2Placeholder}'],
  [/placeholder="City"/g, 'placeholder={t.cityPlaceholder}'],
  [/placeholder="e\.g\., CA, NY"/g, 'placeholder={t.statePlaceholder}'],
  [/placeholder="ZIP\/Postal code"/g, 'placeholder={t.postalPlaceholder}'],
  [/placeholder="Country"/g, 'placeholder={t.countryPlaceholder}'],
  [/placeholder="\+1 \(555\) 123-4567"/g, 'placeholder={t.phonePlaceholder}'],
  [/placeholder="location@example\.com"/g, 'placeholder={t.emailLocationPlaceholder}'],
  [/placeholder="e\.g\., 101, A1, Suite 1"/g, 'placeholder={t.roomNumberPlaceholder}'],
  [/placeholder="e\.g\., Luxury Suite, Relaxation Room"/g, 'placeholder={t.roomNamePlaceholder}'],
  [/placeholder="claude-3-haiku-20240307"/g, 'placeholder={t.modelPlaceholderAnthropic}'],
  [/placeholder="qwen2\.5:7b"/g, 'placeholder={t.modelPlaceholderOllama}'],
  [/placeholder="gpt-4"/g, 'placeholder={t.modelPlaceholderOpenAI}'],
  [/placeholder="http:\/\/localhost:11434"/g, 'placeholder={t.ollamaUrlPlaceholder}'],

  // Labels - need to check these don't break JSX
  [/>Category</g, '>{t.category}<'],
  [/>Title</g, '>{t.title}<'],
  [/>Content</g, '>{t.content}<'],
  [/>Priority</g, '>{t.priority}<'],
  [/>Comments</g, '>{t.comments}<'],
  [/>Keywords \(comma-separated\)</g, '>{t.keywords}<'],
  [/>ID</g, '>{t.id}<'],
  [/>Scenario Description</g, '>{t.scenarioDescription}<'],
  [/>Template</g, '>{t.template}<'],
  [/>Variables \(comma-separated\)</g, '>{t.variables}<'],
  [/>Variables:</g, '>{t.variablesLabel}:<'],
  [/>Service</g, '>{t.service}<'],
  [/>Email</g, '>{t.email}<'],
  [/>Type</g, '>{t.type}<'],
  [/>Phone</g, '>{t.phone}<'],
  [/>Display Order</g, '>{t.displayOrder}<'],
  [/>Address Line 1 \*</g, '>{t.addressLine1Required}<'],
  [/>Address Line 2</g, '>{t.addressLine2}<'],
  [/>City \*</g, '>{t.cityRequired}<'],
  [/>State\/Province</g, '>{t.stateProvince}<'],
  [/>Postal Code</g, '>{t.postalCode}<'],
  [/>Country</g, '>{t.country}<'],
  [/>Room Number \*</g, '>{t.roomNumberRequired}<'],
  [/>LLM Provider</g, '>{t.llmProvider}<'],
  [/>Model Name</g, '>{t.modelName}<'],
  [/>Ollama Base URL</g, '>{t.ollamaBaseUrl}<'],
  [/>Current Configuration</g, '>{t.currentConfiguration}<'],
  [/>Provider:</g, '>{t.provider}:<'],
  [/>Model:</g, '>{t.model}:<'],

  // Section titles
  [/>Knowledge Base</g, '>{t.knowledgeBase}<'],
  [/>AI Testing</g, '>{t.aiTesting}<'],
  [/>Test Query</g, '>{t.testQuery}<'],
  [/>AI Response</g, '>{t.aiResponse}<'],
  [/>FAQ Library</g, '>{t.faqLibrary}<'],
  [/>Service Assignments</g, '>{t.serviceAssignments}<'],
  [/>Outlets \/ Locations</g, '>{t.outlets}<'],
  [/>Treatment Rooms</g, '>{t.treatmentRooms}<'],
  [/>AI Model Settings</g, '>{t.aiModelSettings}<'],

  // Specific provider names
  [/>Anthropic Claude</g, '>{t.providerAnthropic}<'],
  [/>Ollama \(Local\)</g, '>{t.providerOllama}<'],
  [/>OpenAI GPT</g, '>{t.providerOpenAI}<'],

  // Messages and alerts - these need special handling
  [/"No services yet\. Click \\"Add Service\\" to create one\."/g, 't.noServicesYet'],
  [/"No staff members yet\. Click \\"Add Staff Member\\" to create one\."/g, 't.noStaffYet'],
  [/"No outlets yet\. Click \\"Add Outlet\\" to create one\."/g, 't.noOutletsYet'],
  [/"No rooms yet\. Click \\"Add Room\\" to create one\."/g, 't.noRoomsYet'],
  [/"Service saved successfully!"/g, 't.serviceSaved'],
  [/"Service deleted successfully"/g, 't.serviceDeleted'],
  [/"Staff member saved successfully!"/g, 't.staffMemberSaved'],
  [/"Staff member deleted successfully"/g, 't.staffMemberDeleted'],
  [/"Outlet created successfully"/g, 't.outletCreated'],
  [/"Outlet updated successfully"/g, 't.outletUpdated'],
  [/"Outlet deleted successfully"/g, 't.outletDeleted'],
  [/"Room saved successfully!"/g, 't.roomSaved'],
  [/"Room deleted successfully"/g, 't.roomDeleted'],
  [/"Please fill in all fields"/g, 't.pleaseFilldAll'],
  [/"Please enter a name"/g, 't.pleaseEnterName'],
  [/"Please select a service"/g, 't.pleaseSelectService'],
  [/"Please select at least one staff member"/g, 't.pleaseSelectStaff'],
  [/"Staff assignments updated successfully!"/g, 't.assignmentsSaved'],
  [/"Please enter a room number"/g, 't.pleaseEnterRoomNumber'],

  // Button titles (tooltips)
  [/title="Upload files: TXT, JSON, CSV, PDF, DOCX"/g, 'title={t.uploadFilesTitle}'],
  [/title="Add content from URL \(websites, YouTube\)"/g, 'title={t.addUrlTitle}'],
  [/title="Generate 10 FAQs from knowledge base"/g, 'title={t.generateFaqTitle}'],
  [/title="Double-click to edit or delete"/g, 'title={t.doubleClickToEdit}'],
  [/title="View schedule"/g, 'title={t.viewSchedule}'],
  [/title="Manage Services"/g, 'title={t.manageServicesBtn}'],

  // Testing states
  [/>Testing\.\.\.</g, '>{t.testing}<'],
  [/>Test AI Response</g, '>{t.testAiResponse}<'],
  [/>Researching\.\.\.</g, '>{t.researching}<'],

  // Manage buttons
  [/>Manage Appointments</g, '>{t.manageAppointments}<'],
  [/>Manage Services</g, '>{t.manageServices}<'],
  [/>Manage Staff Assignments</g, '>{t.manageStaffAssignments}<'],
  [/>Save Settings</g, '>{t.saveSettings}<'],
  [/>Save Assignments</g, '>{t.saveAssignments}<'],
  [/>Save Services</g, '>{t.saveServices}<'],

  // Select placeholders
  [/>Select a service\.\.\.</g, '>{t.selectService}<'],
  [/>Select All</g, '>{t.selectAll}<'],
  [/>Clear All</g, '>{t.clearAll}<'],

  // Other buttons
  [/>🔄 Research Again</g, '>{t.researchAgain}<'],
  [/>Deep AI Research</g, '>{t.deepAiResearch}<'],
  [/>Generate</g, '>{t.generate}<'],
];

let changeCount = 0;
for (const [search, replace] of replacements) {
  const before = content;
  content = content.replace(search, replace);
  if (content !== before) changeCount++;
}

fs.writeFileSync(filePath, content, 'utf8');

console.log(`✓ Applied ${changeCount} more translations!`);
console.log('Total translations in file:', (content.match(/{t\./g) || []).length);

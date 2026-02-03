const fs = require('fs');

const filePath = 'C:\\Users\\Denny\\ai-training-center\\src\\components\\admin\\ai-training-center.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Final comprehensive replacements - all remaining text
const replacements = [
  // Form labels that were missed
  [/>Outlet Name \*</g, '>{t.outletNameRequired}<'],
  [/>Outlet \/ Location</g, '>{t.outletLocation}<'],
  [/>Room Name \(optional\)</g, '>{t.roomNameOptional}<'],
  [/>Staff Type \(optional\)</g, '>{t.staffTypeOptional}<'],
  [/>Email \(optional\)</g, '>{t.emailOptional}<'],
  [/>Name \*</g, '>{t.nameRequired}<'],

  // Section descriptions
  [/>Manage appointment services available for booking</g, '>{t.servicesDescription}<'],
  [/>Add and manage real staff members for appointments</g, '>{t.staffDescription}<'],
  [/>Assign staff members to services they can perform</g, '>{t.assignmentsDescription}<'],
  [/>Manage business locations and their addresses</g, '>{t.outletsDescription}<'],
  [/>Manage treatment rooms and facilities</g, '>{t.roomsDescription}<'],

  // Empty state messages
  [/>No training guidelines yet\.</g, '>{t.noGuidelinesYet}<'],
  [/>Add guidelines to help the AI understand how to respond correctly\.</g, '>{t.addGuidelinesHelp}<'],
  [/>No completed training sessions yet\.</g, '>{t.noTrainingSessionsYet}<'],
  [/>Complete a roleplay training session to see it here\.</g, '>{t.trainingSessionsHelp}<'],
  [/>No knowledge base entries yet\.</g, '>{t.noKnowledgeYet}<'],
  [/>Upload files in the Knowledge Base tab\.</g, '>{t.uploadInKnowledgeTab}<'],
  [/>No assignments yet\. Click "Manage Staff Assignments" to create one\.</g, '>{t.noAssignmentsYet}<'],

  // Confirmation dialogs - need to handle these carefully
  [/confirm\('Delete this guideline\?'\)/g, 'confirm(t.deleteGuideline)'],
  [/confirm\('Delete this FAQ\?'\)/g, 'confirm(t.deleteFaq)'],
  [/confirm\('Delete this canned message\?'\)/g, 'confirm(t.deleteCannedMessage)'],
  [/confirm\(`Delete service "\$\{service\.name\}"\?`\)/g, 'confirm(t.confirmDeleteService(service.name))'],
  [/confirm\(`Delete staff member "\$\{staff\.name\}"\?`\)/g, 'confirm(t.confirmDeleteStaff(staff.name))'],
  [/confirm\(`Delete outlet "\$\{outlet\.name\}"\? This will also delete all associated rooms\.`\)/g, 'confirm(t.confirmDeleteOutlet(outlet.name))'],
  [/confirm\(`Delete room \$\{room\.room_number\}\?`\)/g, 'confirm(t.confirmDeleteRoom(room.room_number))'],

  // Category options
  [/'FAQ Library'/g, 't.categoryFaqLibrary'],
  [/'Canned Messages'/g, 't.categoryCannedMessages'],
  [/'Role-Play Training'/g, 't.categoryRoleplay'],
  [/'General Guidelines'/g, 't.categoryGeneral'],

  // Help text
  [/>Lower numbers appear first in customer selection</g, '>{t.displayOrderHelp}<'],
  [/>Select the location for this room</g, '>{t.selectLocationHelp}<'],
  [/>Select which services can be performed in this room\. If no services are selected, this room can handle any service\.</g, '>{t.roomServicesDescription}<'],
  [/>No outlets available\. Create an outlet first\.</g, '>{t.noOutletsAvailable}<'],
  [/>No services available\. Create services first\.</g, '>{t.noServicesAvailable}<'],

  // Select options
  [/>Select an outlet \(optional\)</g, '>{t.selectOutletOptional}<'],
  [/>Select Knowledge Base Files</g, '>{t.selectKnowledgeFiles}<'],
  [/>Select Expert Sources</g, '>{t.selectExpertSources}<'],
  [/>Assign Staff to Service</g, '>{t.assignStaffToService}<'],

  // Analytics labels
  [/>Knowledge Entries</g, '>{t.knowledgeEntries}<'],
  [/>Training Examples</g, '>{t.trainingExamples}<'],
  [/>Active Training</g, '>{t.activeTraining}<'],

  // AI Model settings descriptions
  [/>Configure which AI model to use for chat and training\. Changes apply immediately\.</g, '>{t.aiModelDescription}<'],
  [/>Lower = more focused, Higher = more creative \(0\.7 recommended\)</g, '>{t.temperatureHelp}<'],
  [/>Make sure Ollama is running locally\.</g, '>{t.ollamaHelp}<'],

  // Examples text
  [/>Examples: claude-3-haiku-20240307, claude-3-5-sonnet-20241022</g, '>{t.modelExamplesAnthropic}<'],
  [/>Examples: qwen2\.5:7b, llama3\.1:8b, mistral:7b</g, '>{t.modelExamplesOllama}<'],
  [/>Examples: gpt-4o \(recommended\), gpt-4-turbo, gpt-4o-mini, gpt-4, gpt-3\.5-turbo</g, '>{t.modelExamplesOpenAI}<'],

  // Support text
  [/>Supports: Web pages, YouTube videos, and any public URLs</g, '>{t.urlSupportsText}<'],

  // Alert messages with backticks
  [/alert\('Service saved successfully!'\)/g, 'alert(t.serviceSaved)'],
  [/alert\('Service deleted successfully'\)/g, 'alert(t.serviceDeleted)'],
  [/alert\('Staff member saved successfully!'\)/g, 'alert(t.staffMemberSaved)'],
  [/alert\('Staff member deleted successfully'\)/g, 'alert(t.staffMemberDeleted)'],
  [/alert\('Outlet created successfully'\)/g, 'alert(t.outletCreated)'],
  [/alert\('Outlet updated successfully'\)/g, 'alert(t.outletUpdated)'],
  [/alert\('Outlet deleted successfully'\)/g, 'alert(t.outletDeleted)'],
  [/alert\('Room saved successfully!'\)/g, 'alert(t.roomSaved)'],
  [/alert\('Room deleted successfully'\)/g, 'alert(t.roomDeleted)'],
  [/alert\('Please fill in all fields'\)/g, 'alert(t.pleaseFilldAll)'],
  [/alert\('Please enter a name'\)/g, 'alert(t.pleaseEnterName)'],
  [/alert\('Please select a service'\)/g, 'alert(t.pleaseSelectService)'],
  [/alert\('Please select at least one staff member'\)/g, 'alert(t.pleaseSelectStaff)'],
  [/alert\('Staff assignments updated successfully!'\)/g, 'alert(t.assignmentsSaved)'],
  [/alert\('Please enter a room number'\)/g, 'alert(t.pleaseEnterRoomNumber)'],
  [/alert\('Room can now handle any service'\)/g, 'alert(t.roomCanHandleAny)'],
  [/alert\(`Room can now handle \$\{selectedServices\.length\} service\(s\)`\)/g, 'alert(t.roomCanHandle(selectedServices.length))'],

  // Staff member count display
  [/`Staff Members \(\$\{selectedStaff\.size\} selected\)`/g, 't.staffMembers(selectedStaff.size)'],

  // Display functions
  [/`📞 \$\{outlet\.phone\}`/g, 't.phoneDisplay(outlet.phone)'],
  [/`✉️ \$\{outlet\.email\}`/g, 't.emailDisplay(outlet.email)'],
  [/`📍 \$\{outlet\.name\} - \$\{outlet\.city\}`/g, 't.locationDisplay(outlet.name, outlet.city)'],
  [/`Room \$\{room\.room_number\}`/g, 't.room(room.room_number)'],

  // Services label for rooms
  [/>Services:</g, '>{t.servicesLabel}:<'],
  [/>All services \(no restrictions\)</g, '>{t.allServicesText}<'],

  // Edit/Delete canned message modals
  [/>Edit Canned Message</g, '>{t.editCannedMessage}<'],

  // Completed Training Sessions
  [/>Completed Training Sessions</g, '>{t.completedTrainingSessions}<'],
  [/>Training Session</g, '>{t.trainingSession}<'],
  [/>Customer</g, '>{t.customer}<'],
  [/>Score:</g, '>{t.score}:<'],
  [/>Messages:</g, '>{t.messages}:<'],
  [/>Feedback:</g, '>{t.feedback}:<'],
  [/>Duration:</g, '>{t.duration}:<'],
  [/>min</g, '>{t.min}<'],
  [/>Objectives:</g, '>{t.objectives}:<'],

  // Training guidelines description
  [/>Guidelines control AI behavior across different features:</g, '>{t.guidelinesDescription}<'],

  // FAQ comments note
  [/>\(How to improve this answer\)</g, '>{t.commentsNote}<'],

  // Placeholder for comments
  [/placeholder="Add notes on how to improve this answer, specific requirements, tone preferences, etc\."/g, 'placeholder={t.commentsPlaceholder}'],

  // "Leave blank to delete" for categories
  [/placeholder="Leave blank to delete"/g, 'placeholder={t.leaveBlankToDelete}'],

  // Security note
  [/>🔐 Security Note: API keys are configured in the \.env\.local file on the server\. This interface only allows you to change the provider and model settings\.</g, '>{t.securityNote}<'],

  // Temperature display
  [/`Temperature: \$\{llmConfig\.temperature\}`/g, 't.temperature(llmConfig.temperature)'],

  // Status display everywhere
  [/>Status: Active</g, '>{t.status}: {t.active}<'],
  [/>Status: Inactive</g, '>{t.status}: {t.inactive}<'],
];

let changeCount = 0;
for (const [search, replace] of replacements) {
  const before = content;
  content = content.replace(search, replace);
  if (content !== before) changeCount++;
}

fs.writeFileSync(filePath, content, 'utf8');

console.log(`✓ Applied ${changeCount} final translations!`);
console.log('Total translations in file:', (content.match(/t\./g) || []).length);
console.log('\n✅ Translation application complete!');

const fs = require('fs');

const filePath = 'C:\\Users\\Denny\\ai-training-center\\src\\components\\admin\\ai-training-center.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// MASSIVE list of ALL possible replacements - covering EVERYTHING
const replacements = [
  // Every possible label pattern
  [/<label[^>]*>Business Name<\/label>/g, '<label className="block text-sm font-medium text-slate-400 mb-2">{t.businessName}</label>'],
  [/<label[^>]*>Industry<\/label>/g, '<label className="block text-sm font-medium text-slate-400 mb-2">{t.industry}</label>'],
  [/<label[^>]*>Category<\/label>/g, '<label className="block text-sm font-medium text-slate-400 mb-2">{t.category}</label>'],
  [/<label[^>]*>Title<\/label>/g, '<label className="block text-sm font-medium text-slate-400 mb-2">{t.title}</label>'],
  [/<label[^>]*>Content<\/label>/g, '<label className="block text-sm font-medium text-slate-400 mb-2">{t.content}</label>'],
  [/<label[^>]*>Question<\/label>/g, '<label className="block text-sm font-medium text-slate-400 mb-2">{t.question}</label>'],
  [/<label[^>]*>Answer<\/label>/g, '<label className="block text-sm font-medium text-slate-400 mb-2">{t.answer}</label>'],
  [/<label[^>]*>Comments<\/label>/g, '<label className="block text-sm font-medium text-slate-400 mb-2">{t.comments}</label>'],
  [/<label[^>]*>Keywords \(comma-separated\)<\/label>/g, '<label className="block text-sm font-medium text-slate-400 mb-2">{t.keywords}</label>'],
  [/<label[^>]*>ID<\/label>/g, '<label className="block text-sm font-medium text-slate-400 mb-2">{t.id}</label>'],
  [/<label[^>]*>Scenario Description<\/label>/g, '<label className="block text-sm font-medium text-slate-400 mb-2">{t.scenarioDescription}</label>'],
  [/<label[^>]*>Template<\/label>/g, '<label className="block text-sm font-medium text-slate-400 mb-2">{t.template}</label>'],
  [/<label[^>]*>Variables \(comma-separated\)<\/label>/g, '<label className="block text-sm font-medium text-slate-400 mb-2">{t.variables}</label>'],
  [/<label[^>]*>Service Name<\/label>/g, '<label className="block text-sm font-medium text-slate-400 mb-2">{t.serviceName}</label>'],
  [/<label[^>]*>Description<\/label>/g, '<label className="block text-sm font-medium text-slate-400 mb-2">{t.description}</label>'],
  [/<label[^>]*>Price \(USD\)<\/label>/g, '<label className="block text-sm font-medium text-slate-400 mb-2">{t.priceUsd}</label>'],
  [/<label[^>]*>Service<\/label>/g, '<label className="block text-sm font-medium text-slate-400 mb-2">{t.service}</label>'],
  [/<label[^>]*>Outlet Name \*<\/label>/g, '<label className="block text-sm font-medium mb-2">{t.outletNameRequired}</label>'],
  [/<label[^>]*>Address Line 1 \*<\/label>/g, '<label className="block text-sm font-medium mb-2">{t.addressLine1Required}</label>'],
  [/<label[^>]*>Address Line 2<\/label>/g, '<label className="block text-sm font-medium mb-2">{t.addressLine2}</label>'],
  [/<label[^>]*>City \*<\/label>/g, '<label className="block text-sm font-medium mb-2">{t.cityRequired}</label>'],
  [/<label[^>]*>State\/Province<\/label>/g, '<label className="block text-sm font-medium mb-2">{t.stateProvince}</label>'],
  [/<label[^>]*>Postal Code<\/label>/g, '<label className="block text-sm font-medium mb-2">{t.postalCode}</label>'],
  [/<label[^>]*>Country<\/label>/g, '<label className="block text-sm font-medium mb-2">{t.country}</label>'],
  [/<label[^>]*>Phone<\/label>/g, '<label className="block text-sm font-medium mb-2">{t.phone}</label>'],
  [/<label[^>]*>Email<\/label>/g, '<label className="block text-sm font-medium mb-2">{t.emailLabel}</label>'],
  [/<label[^>]*>Display Order<\/label>/g, '<label className="block text-sm font-medium mb-2">{t.displayOrder}</label>'],
  [/<label[^>]*>Outlet \/ Location<\/label>/g, '<label className="block text-sm font-medium mb-2">{t.outletLocation}</label>'],
  [/<label[^>]*>Room Number \*<\/label>/g, '<label className="block text-sm font-medium mb-2">{t.roomNumberRequired}</label>'],
  [/<label[^>]*>Room Name \(optional\)<\/label>/g, '<label className="block text-sm font-medium mb-2">{t.roomNameOptional}</label>'],
  [/<label[^>]*>Name \*<\/label>/g, '<label className="block text-sm font-medium mb-2">{t.nameRequired}</label>'],
  [/<label[^>]*>Email \(optional\)<\/label>/g, '<label className="block text-sm font-medium mb-2">{t.emailOptional}</label>'],
  [/<label[^>]*>Staff Type \(optional\)<\/label>/g, '<label className="block text-sm font-medium mb-2">{t.staffTypeOptional}</label>'],
  [/<label[^>]*>LLM Provider<\/label>/g, '<label className="block text-sm font-medium mb-2">{t.llmProvider}</label>'],
  [/<label[^>]*>Model Name<\/label>/g, '<label className="block text-sm font-medium mb-2">{t.modelName}</label>'],
  [/<label[^>]*>Ollama Base URL<\/label>/g, '<label className="block text-sm font-medium mb-2">{t.ollamaBaseUrl}</label>'],
  [/<label[^>]*>Test Query<\/label>/g, '<label className="block text-sm font-medium mb-2">{t.testQuery}</label>'],
  [/<label[^>]*>AI Response<\/label>/g, '<label className="block text-sm font-medium mb-2">{t.aiResponse}</label>'],

  // Section headers that might have been missed
  [/<h2[^>]*>Knowledge Base<\/h2>/g, '<h2 className="text-xl font-semibold mb-4">{t.knowledgeBase}</h2>'],
  [/<h2[^>]*>Training Guidelines<\/h2>/g, '<h2 className="text-xl font-semibold mb-4">{t.trainingGuidelines}</h2>'],
  [/<h2[^>]*>AI Testing<\/h2>/g, '<h2 className="text-xl font-semibold mb-4">{t.aiTesting}</h2>'],
  [/<h2[^>]*>FAQ Library<\/h2>/g, '<h2 className="text-xl font-semibold mb-4">{t.faqLibrary}</h2>'],
  [/<h2[^>]*>Booking Management<\/h2>/g, '<h2 className="text-xl font-semibold mb-4">{t.bookingManagement}</h2>'],
  [/<h2[^>]*>AI Model Settings<\/h2>/g, '<h2 className="text-xl font-semibold mb-4">{t.aiModelSettings}</h2>'],

  [/<h3[^>]*>Services<\/h3>/g, '<h3 className="text-lg font-semibold mb-3">{t.services}</h3>'],
  [/<h3[^>]*>Staff<\/h3>/g, '<h3 className="text-lg font-semibold mb-3">{t.staff}</h3>'],
  [/<h3[^>]*>Service Assignments<\/h3>/g, '<h3 className="text-lg font-semibold mb-3">{t.serviceAssignments}</h3>'],
  [/<h3[^>]*>Outlets \/ Locations<\/h3>/g, '<h3 className="text-lg font-semibold mb-3">{t.outlets}</h3>'],
  [/<h3[^>]*>Treatment Rooms<\/h3>/g, '<h3 className="text-lg font-semibold mb-3">{t.treatmentRooms}</h3>'],
  [/<h3[^>]*>Completed Training Sessions<\/h3>/g, '<h3 className="text-lg font-semibold mb-3">{t.completedTrainingSessions}</h3>'],
  [/<h3[^>]*>Current Configuration<\/h3>/g, '<h3 className="text-lg font-semibold mb-3">{t.currentConfiguration}</h3>'],

  // Modal titles with conditional logic
  [/\{editingService \? 'Edit Service' : 'Add New Service'\}/g, '{editingService ? t.editService : t.addNewService}'],
  [/\{editingStaff \? 'Edit Staff Member' : 'Add New Staff Member'\}/g, '{editingStaff ? t.editStaffMember : t.addNewStaffMember}'],
  [/\{editingOutlet \? 'Edit Outlet' : 'Add New Outlet'\}/g, '{editingOutlet ? t.editOutlet : t.addNewOutlet}'],
  [/\{editingRoom \? 'Edit Room' : 'Add New Room'\}/g, '{editingRoom ? t.editRoom : t.addNewRoom}'],
  [/\{editingGuideline \? 'Edit Guideline' : 'Add Guideline'\}/g, '{editingGuideline ? t.editGuideline : t.addGuideline}'],

  // Text content in paragraphs and divs
  [/>Manage appointment services available for booking</g, '>{t.servicesDescription}<'],
  [/>Add and manage real staff members for appointments</g, '>{t.staffDescription}<'],
  [/>Assign staff members to services they can perform</g, '>{t.assignmentsDescription}<'],
  [/>Manage business locations and their addresses</g, '>{t.outletsDescription}<'],
  [/>Manage treatment rooms and facilities</g, '>{t.roomsDescription}<'],
  [/>Configure which AI model to use for chat and training\. Changes apply immediately\.</g, '>{t.aiModelDescription}<'],
  [/>Guidelines control AI behavior across different features:</g, '>{t.guidelinesDescription}<'],

  // Option values in selects
  [/<option value="faq">FAQ Library<\/option>/g, '<option value="faq">{t.categoryFaqLibrary}</option>'],
  [/<option value="canned">Canned Messages<\/option>/g, '<option value="canned">{t.categoryCannedMessages}</option>'],
  [/<option value="roleplay">Role-Play Training<\/option>/g, '<option value="roleplay">{t.categoryRoleplay}</option>'],
  [/<option value="general">General Guidelines<\/option>/g, '<option value="general">{t.categoryGeneral}</option>'],
  [/<option value="anthropic">Anthropic Claude<\/option>/g, '<option value="anthropic">{t.providerAnthropic}</option>'],
  [/<option value="ollama">Ollama \(Local\)<\/option>/g, '<option value="ollama">{t.providerOllama}</option>'],
  [/<option value="openai">OpenAI GPT<\/option>/g, '<option value="openai">{t.providerOpenAI}</option>'],
];

console.log('Starting comprehensive translation...');
let totalChanges = 0;

for (const [search, replace] of replacements) {
  const matches = (content.match(search) || []).length;
  if (matches > 0) {
    content = content.replace(search, replace);
    totalChanges += matches;
    console.log(`  ✓ Replaced ${matches} instance(s)`);
  }
}

fs.writeFileSync(filePath, content, 'utf8');

console.log(`\n✅ Complete! Applied ${totalChanges} replacements`);
console.log('Total translation references:', (content.match(/\{t\./g) || []).length);

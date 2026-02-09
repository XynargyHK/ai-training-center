// Translation dictionary for AI chat interface
export type Language = 'en' | 'zh-CN' | 'zh-TW' | 'vi'

export interface Translations {
  // Header
  aiStaff: string
  selectStaffMember: string

  // Language selector
  language: string

  // Staff roles
  coach: string
  sales: string
  customerService: string
  scientist: string

  // Role-specific tasks
  coachTasks: string
  salesTasks: string
  customerServiceTasks: string
  scientistTasks: string

  // Greetings
  greeting: (name: string, emoji: string, tasks: string) => string

  // Messages
  aiTyping: string

  // Input
  placeholder: string
  send: string

  // Buttons
  close: string
  chatNow: string

  // FAQ
  faqAbout: (category: string) => string
  noFaqAvailable: (category: string) => string

  // Loading
  loadingKnowledge: string

  // Welcome
  welcomeTo: (businessName: string) => string
  clickToChat: string
  noAiStaff: string
  availableStaff: string

  // Pre-Chat Form
  welcome: string
  helpUsServeYou: string
  yourName: string
  yourNamePlaceholder: string
  yourEmail: string
  yourEmailPlaceholder: string
  startChat: string
  continueAsGuest: string
  chatSavedNotice: string
  orSignInWith: string

  // Admin Panel - Main Navigation
  adminTitle: string
  adminSubtitle: string
  viewLiveChat: string
  profile: string
  personalProfile: string
  companyProfile: string
  businessUnit: string
  knowledge: string
  products: string
  training: string
  analytics: string
  roleplay: string
  faq: string
  cannedMessages: string
  aiModel: string
  booking: string

  // Common Buttons
  add: string
  edit: string
  delete: string
  save: string
  cancel: string
  update: string
  create: string
  search: string

  // Common Status
  active: string
  inactive: string
  status: string

  // Business Unit Management
  addBusinessUnit: string
  businessName: string
  industry: string
  businessNamePlaceholder: string
  industryPlaceholder: string
  cannotDeleteDefault: string
  confirmDeleteBusinessUnit: string

  // Knowledge Base Tab
  knowledgeBase: string
  searchEntries: string
  uploadFiles: string
  uploadFilesTitle: string
  addUrl: string
  addUrlTitle: string
  enterUrl: string
  fetching: string
  urlSupportsText: string
  pleaseEnterUrl: string
  pleaseAddKnowledgeFirst: string
  importSuccess: (count: number) => string
  errorProcessingFile: (name: string) => string
  unsupportedFileType: (type: string) => string
  failedToFetchUrl: string
  youtubeVideo: string
  webContent: string

  // Training Tab
  trainingGuidelines: string
  guidelinesDescription: string
  addGuideline: string
  noGuidelinesYet: string
  addGuidelinesHelp: string
  editGuideline: string
  deleteGuideline: string
  category: string
  title: string
  content: string
  guidelineTitlePlaceholder: string
  guidelineContentPlaceholder: string
  categoryFaqLibrary: string
  categoryCannedMessages: string
  categoryRoleplay: string
  categoryGeneral: string

  // Training Sessions
  completedTrainingSessions: string
  noTrainingSessionsYet: string
  trainingSessionsHelp: string
  trainingSession: string
  customer: string
  score: string
  messages: string
  feedback: string
  duration: string
  min: string
  na: string
  objectives: string

  // Training Data
  priority: string
  question: string
  answer: string
  variations: string

  // Test AI
  aiTesting: string
  testQuery: string
  testQueryPlaceholder: string
  testing: string
  testAiResponse: string
  aiResponse: string
  errorTestingAi: (error: string) => string

  // FAQ Tab
  faqLibrary: string
  generateFaq: string
  generateFaqTitle: string
  generating: string
  addCategory: string
  doubleClickToEdit: string
  leaveBlankToDelete: string
  categoryNamePlaceholder: string
  editFaq: string
  deleteFaq: string
  comments: string
  commentsNote: string
  commentsPlaceholder: string
  keywords: string
  keywordsPlaceholder: string
  regenerate: string
  regenerating: string
  error: (error: string) => string
  failedToGenerateFaqs: string

  // Canned Messages Tab
  knowledgeBaseBtn: string
  deepAiResearch: string
  researching: string
  generate: string
  selectService: string
  selectKnowledgeFiles: string
  selectAll: string
  clearAll: string
  noKnowledgeYet: string
  uploadInKnowledgeTab: string
  selectExpertSources: string
  researchAgain: string
  editCannedMessage: string
  deleteCannedMessage: string
  id: string
  scenarioDescription: string
  scenarioPlaceholder: string
  template: string
  variables: string
  variablesPlaceholder: string
  variablesLabel: string

  // Booking Tab
  bookingManagement: string
  manageAppointments: string

  // Services
  services: string
  addService: string
  manageServices: string
  servicesDescription: string
  noServicesYet: string
  editService: string
  addNewService: string
  serviceName: string
  serviceNamePlaceholder: string
  description: string
  descriptionPlaceholder: string
  priceUsd: string
  pricePlaceholder: string
  pleaseFilldAll: string
  serviceDeleted: string
  serviceSaved: string
  confirmDeleteService: (name: string) => string

  // Staff
  staff: string
  addStaffMember: string
  staffDescription: string
  noStaffYet: string
  editStaffMember: string
  addNewStaffMember: string
  nameRequired: string
  namePlaceholder: string
  emailOptional: string
  emailPlaceholder: string
  staffTypeOptional: string
  staffTypePlaceholder: string
  email: string
  type: string
  viewSchedule: string
  pleaseEnterName: string
  staffMemberSaved: string
  confirmDeleteStaff: (name: string) => string
  staffMemberDeleted: string

  // Service Assignments
  serviceAssignments: string
  manageStaffAssignments: string
  assignmentsDescription: string
  noAssignmentsYet: string
  assignStaffToService: string
  service: string
  staffMembers: (count: number) => string
  pleaseSelectService: string
  pleaseSelectStaff: string
  assignmentsSaved: string
  saveAssignments: string

  // Outlets/Locations
  outlets: string
  addOutlet: string
  outletsDescription: string
  noOutletsYet: string
  editOutlet: string
  addNewOutlet: string
  outletNameRequired: string
  outletNamePlaceholder: string
  addressLine1Required: string
  addressLine1Placeholder: string
  addressLine2: string
  addressLine2Placeholder: string
  cityRequired: string
  cityPlaceholder: string
  stateProvince: string
  statePlaceholder: string
  postalCode: string
  postalPlaceholder: string
  country: string
  countryPlaceholder: string
  phone: string
  phonePlaceholder: string
  emailLabel: string
  emailLocationPlaceholder: string
  displayOrder: string
  displayOrderHelp: string
  phoneDisplay: (phone: string) => string
  emailDisplay: (email: string) => string
  pleaseProvideRequired: string
  outletCreated: string
  outletUpdated: string
  confirmDeleteOutlet: (name: string) => string
  outletDeleted: string

  // Treatment Rooms
  treatmentRooms: string
  addRoom: string
  roomsDescription: string
  noRoomsYet: string
  editRoom: string
  addNewRoom: string
  outletLocation: string
  selectOutletOptional: string
  noOutletsAvailable: string
  selectLocationHelp: string
  roomNumberRequired: string
  roomNumberPlaceholder: string
  roomNameOptional: string
  roomNamePlaceholder: string
  pleaseEnterRoomNumber: string
  roomSaved: string
  room: (number: string) => string
  roomDeleted: string
  confirmDeleteRoom: (number: string) => string
  manageServicesForRoom: (number: string) => string
  roomServicesDescription: string
  noServicesAvailable: string
  manageServicesBtn: string
  roomCanHandleAny: string
  roomCanHandle: (count: number) => string
  saveServices: string
  servicesLabel: string
  allServicesText: string
  locationDisplay: (outlet: string, city: string) => string
  roomServicesDisplay: (names: string) => string

  // Analytics Tab
  knowledgeEntries: string
  trainingExamples: string
  activeTraining: string

  // AI Model Settings Tab
  aiModelSettings: string
  aiModelDescription: string
  securityNote: string
  llmProvider: string
  providerAnthropic: string
  providerOllama: string
  providerOpenAI: string
  modelName: string
  modelPlaceholderAnthropic: string
  modelPlaceholderOllama: string
  modelPlaceholderOpenAI: string
  modelExamplesAnthropic: string
  modelExamplesOllama: string
  modelExamplesOpenAI: string
  ollamaBaseUrl: string
  ollamaUrlPlaceholder: string
  ollamaHelp: string
  temperature: (value: string) => string
  temperatureHelp: string
  saveSettings: string
  currentConfiguration: string
  provider: string
  model: string
  settingsSaved: string
  failedToSave: (error: string) => string
  errorSavingSettings: string

  // Confirmations & Alerts
  areYouSure: string
  actionCannotBeUndone: string
  yes: string
  no: string

  // Roleplay Training
  aiStaffTrainingCenter: string
  aiStaffTrainingDesc: string
  aiStaffMembers: string
  addStaff: string
  aiCoachTrainingSession: string
  complete: string
  aiTrainingWillAppear: string
  selectScenarioToBegin: string
  trainingScenarios: string
  createScenario: string
  scenarioName: string
  scenarioNamePlaceholder: string
  customerTypePlaceholder: string
  scenarioSituation: string
  scenarioSituationPlaceholder: string
  trainingObjectives: string
  objectivesPlaceholder: string
  difficulty: string
  beginner: string
  intermediate: string
  advanced: string
  timeLimit: string
  minutes: string
  startTraining: string
  provideCoachFeedback: string
  feedbackPlaceholder: string
  submitFeedback: string
  customerMessage: string
  aiCoachResponse: string
  thinking: string
  guidelinesCreated: string
  roleCoach: string
  roleSales: string
  roleSupport: string
  roleScientist: string

  // Training Scenarios Section
  trainingScenariosFor: string
  coachRoleDesc: string
  salesRoleDesc: string
  customerServiceRoleDesc: string
  scientistRoleDesc: string
  allScenariosGenerated: string
  generate3MoreScenarios: string
  scenario: string
  successCriteria: string
  startTrainingSession: string
  noScenariosYet: string
  createFirstScenario: string
  createCustomScenario: string
  deleteScenario: string
  addNewStaff: string
  staffName: string
  staffNamePlaceholder: string
  selectRole: string

  // AI Coach Training Session
  aiCustomer: string
  typeQuestionPlaceholder: string
  autoBtn: string
  feedbackBtn: string
  saveAsGuideline: string
  trainingPurpose: string
  activeTrainingMemory: string
  feedbackItems: string
  forCustomers: string

  // Training Data Tab
  trainingDataTitle: string
  newGuideline: string
  expand: string
  collapse: string
  created: string
  updated: string

  // Booking Dashboard
  bookingDashboard: string
  scheduleFor: string
  viewingAppointmentsFor: string
  manageAppointmentsAvailability: string
  clearFilter: string
  today: string
  groupBy: string
  staff: string
  roomLabel: string
  service: string
  selectStaff: string
  selectRooms: string
  selectServices: string
  previous: string
  next: string
  day: string
  week: string
  month: string
  allStatuses: string
  pending: string
  confirmed: string
  completed: string
  cancelled: string
  pendingEdit: string
  pendingCancellation: string
  blockedTime: string
  noSelectionMade: string
  pleaseSelectStaff: string
  pleaseSelectRoom: string
  pleaseSelectService: string
  appointmentsThisWeek: string
  noAppointments: string
  client: string
  location: string
  statusLabel: string
  appointments: string
  noAppointmentsFound: string
  email: string
  phone: string
  notes: string
  confirm: string
  decline: string
  blockTime: string
  blockTimeDescription: string
  addBlockedTime: string
  loadingAppointments: string

  // Appointment Actions
  noStaffAssigned: string
  appointmentConfirmed: string
  failedToConfirm: string
  provideDeclineReason: string
  appointmentDeclined: string
  failedToDecline: string

  // Edit Appointment Modal
  editAppointment: string
  currentDetails: string
  newDate: string
  startTime: string
  endTime: string
  assignedStaff: string
  selectStaffOption: string
  treatmentRoom: string
  selectRoomOption: string
  reasonForChange: string
  reasonForChangePlaceholder: string
  editRequestNotice: string
  submitEditRequest: string
  noChangesDetected: string
  provideChangeReason: string
  editRequestSubmitted: string
  failedToSubmitEdit: string

  // Cancel Appointment Modal
  cancelAppointment: string
  appointmentToCancel: string
  reasonForCancellation: string
  reasonForCancellationPlaceholder: string
  cancellationNotice: string
  submitCancellationRequest: string
  keepAppointment: string
  provideCancellationReason: string
  cancellationRequestSubmitted: string
  failedToSubmitCancellation: string

  // Block Time Modal
  blockTimeTitle: string
  startDate: string
  endDate: string
  reasonForBlocking: string
  reasonForBlockingPlaceholder: string
  recurringWeekly: string
  blockTimeNotice: string
  blocking: string
  selectDates: string
  provideBlockingReason: string
  endDateAfterStart: string
  successfullyBlocked: string

  // Booking Modal (Customer)
  bookAppointment: string
  bookingConfirmed: string
  selectAService: string
  noStaffAssignedToService: string
  changeService: string
  selectedService: string
  selectLocation: string
  changeLocation: string
  selected: string
  selectStaffMemberTitle: string
  noStaffAvailable: string
  changeStaff: string
  bookingDetails: string
  selectDateTime: string
  continueToDetails: string
  changeDateTime: string
  bookingSummary: string
  phoneOptional: string
  phonePlaceholder: string
  specialRequestsOptional: string
  specialRequestsPlaceholder: string
  confirmBooking: string
  bookingSuccessMessage: string
  bookingConfirmationNotice: string
  done: string

  // Slot Picker
  loadingAvailability: string
  errorLoadingSlots: string
  tryAgain: string
  noAppointmentsAvailable: string
  selectDifferentDate: string
  selectATime: string
  available: string
  unavailable: string

  // Weekly Calendar Picker
  nextWeek: string
  selectedTime: string
  hours: string

  // Common
  minutes: string
  at: string
  with: string
  date: string
  time: string
  status: string
  noAppointmentsForPeriod: string
  edit: string
  cancel: string
  manageAppointmentsAndAvailability: string
  statusPending: string
  statusConfirmed: string
  statusCompleted: string
  statusCancelled: string
  statusPendingEdit: string
  statusPendingCancellation: string
  statusBlocked: string
  reasonPlaceholder: string
  editRequestInfo: string
  submitting: string
  cancellationPlaceholder: string
  importantNotice: string
  cancellationWarning: string
  blockReasonPlaceholder: string
  recurringOption: string
  blockTimeInfo: string
  blockingTime: string
  selectStaffMember: string
  noAssignedStaffAtLocation: string
  changeStaff: string
  phoneNumberOptional: string
  specialRequestsPlaceholder: string
  booking: string
  appointmentBookedSuccess: string
  confirmationNotificationMessage: string

  // Knowledge Base - Sub-tabs
  industryKnowledge: string
  landingPageTab: string
  imageLibrary: string
  conversations: string

  // Industry Knowledge Section
  uploadDocumentsDesc: string
  uploadDocument: string
  browseFiles: string
  supportedFileTypes: string

  // Landing Page Editor
  landingPageEditor: string
  saving: string
  preview: string
  viewLive: string
  addBlock: string
  publish: string
  publishedStatus: string
  liveStatus: string
  loading: string
  noLandingPageYet: string
  createLandingPage: string

  // Block Types
  splitBlock: string
  splitBlockDesc: string
  cardBlock: string
  cardBlockDesc: string
  accordionBlock: string
  accordionBlockDesc: string
  pricingTableBlock: string
  pricingTableBlockDesc: string
  testimonialsBlock: string
  testimonialsBlockDesc: string
  textImageGridBlock: string
  textImageGridBlockDesc: string

  // Landing Page Sections
  announcementBanner: string
  rotatingAnnouncements: string
  translateBtn: string
  menuBar: string
  menuBarDesc: string
  heroBanner: string
  carouselWithSlides: (count: number) => string
  addSlide: string
  carouselSlides: string
  horizontalScroll: string

  // Logo Settings
  logoSettings: string
  positionLabel: string
  leftPosition: string
  centerPosition: string
  logoText: string
  brandNamePlaceholder: string
  logoImage: string

  // Menu Items
  menuItemsLeft: string
  rightSideUtilities: string

  // Publishing
  saveLandingPageFirst: string
  unpublish: string
  confirmUnpublish: string
  confirmPublish: string
  confirmUpdateLive: string
  updateLive: string
  landingPageUnpublished: string
  landingPageNowLive: string
  landingPageLiveUpdated: string
  failedToUpdatePublish: string

  // Translation Mode
  exitTranslationMode: string
  enableTranslationMode: string

  // Common Actions
  copyUrl: string
  remove: string
  moveUp: string
  moveDown: string
  deleteSlide: string
  afterAddClickSave: string
  rememberClickSave: string
  boldText: string
  italicText: string
  alignLeft: string
  alignCenter: string
  alignRight: string
  textColor: string
  bgColor: string
  removeFeature: string
}

export const translations: Record<Language, Translations> = {
  'en': {
    aiStaff: 'AI Staff',
    selectStaffMember: 'Select a staff member to chat',
    language: 'Language',

    coach: 'coach',
    sales: 'sales',
    customerService: 'customer service',
    scientist: 'scientist',

    coachTasks: 'beauty tips, skincare advice, and personalized recommendations',
    salesTasks: 'product information, pricing, promotions, and purchase assistance',
    customerServiceTasks: 'order tracking, returns, technical support, and general inquiries',
    scientistTasks: 'advanced skin analysis, ingredient information, and scientific research',

    greeting: (name, emoji, tasks) => `Hi! I'm ${name} ${emoji} I can help you with ${tasks}. What would you like to know?`,

    aiTyping: 'AI is typing...',
    placeholder: 'Ask about products, pricing, support...',
    send: 'Send',
    close: 'Close',
    chatNow: 'Chat now',

    faqAbout: (category) => `Here are our FAQs about ${category}:`,
    noFaqAvailable: (category) => `I don't have any specific FAQs for ${category} at the moment, but feel free to ask me anything!`,

    loadingKnowledge: 'Loading knowledge base...',
    welcomeTo: (name) => `Welcome to ${name}!`,
    clickToChat: 'Click on any sparkle button to chat with our trained AI staff',
    noAiStaff: 'No AI staff available. Please train some AI staff first in the admin panel.',
    availableStaff: 'Available staff:',

    // Pre-Chat Form
    welcome: 'Welcome! 👋',
    helpUsServeYou: 'Help us serve you better by sharing your information (optional)',
    yourName: 'Your Name',
    yourNamePlaceholder: 'Enter your name (optional)',
    yourEmail: 'Your Email',
    yourEmailPlaceholder: 'Enter your email (optional)',
    startChat: 'Start Chat',
    continueAsGuest: 'Continue as Guest',
    chatSavedNotice: 'By continuing, your chat will be saved for quality and compliance purposes',
    orSignInWith: 'or sign in with',

    adminTitle: 'AI Business Center',
    adminSubtitle: 'Train and manage your AI customer support agent',
    viewLiveChat: 'View Live Chat',
    profile: 'Profile',
    personalProfile: 'Personal Profile',
    companyProfile: 'Company Profile',
    businessUnit: 'Business Unit',
    knowledge: 'Knowledge',
    products: 'Products',
    training: 'Training',
    analytics: 'Analytics',
    roleplay: 'Roleplay',
    faq: 'FAQ',
    cannedMessages: 'Canned Messages',
    aiModel: 'AI Model',
    booking: 'Booking',
    landingPage: 'Landing Page',

    add: 'Add',
    edit: 'Edit',
    delete: 'Delete',
    save: 'Save',
    cancel: 'Cancel',
    update: 'Update',
    create: 'Create',
    search: 'Search',

    active: 'Active',
    inactive: 'Inactive',
    status: 'Status',

    addBusinessUnit: 'Add Business Unit',
    businessName: 'Business Name',
    industry: 'Industry',
    businessNamePlaceholder: 'e.g., AIA Insurance, FitCoach, etc.',
    industryPlaceholder: 'e.g., Insurance, Fitness, etc.',
    cannotDeleteDefault: 'Cannot delete the default SkinCoach business unit',
    confirmDeleteBusinessUnit: 'Are you sure you want to delete this business unit? All associated data will be removed.',

    knowledgeBase: 'Knowledge Base',
    searchEntries: 'Search entries...',
    uploadFiles: 'Upload Files',
    uploadFilesTitle: 'Upload files: TXT, JSON, CSV, PDF, DOCX',
    addUrl: 'Add URL',
    addUrlTitle: 'Add content from URL (websites, YouTube)',
    enterUrl: 'Enter URL (website or YouTube video)...',
    fetching: 'Fetching...',
    urlSupportsText: 'Supports: Web pages, YouTube videos, and any public URLs',
    pleaseEnterUrl: 'Please enter a URL',
    pleaseAddKnowledgeFirst: 'Please add some knowledge base entries first',
    importSuccess: (count) => `Successfully imported ${count} knowledge entries!`,
    errorProcessingFile: (name) => `Error processing file ${name}`,
    unsupportedFileType: (type) => `Unsupported file type: ${type}`,
    failedToFetchUrl: 'Failed to fetch URL. Please check the URL and try again.',
    youtubeVideo: 'YouTube Video',
    webContent: 'Web Content',

    trainingGuidelines: 'Training Guidelines',
    guidelinesDescription: 'Guidelines control AI behavior across different features:',
    addGuideline: 'Add Guideline',
    noGuidelinesYet: 'No training guidelines yet.',
    addGuidelinesHelp: 'Add guidelines to help the AI understand how to respond correctly.',
    editGuideline: 'Edit Guideline',
    deleteGuideline: 'Delete this guideline?',
    category: 'Category',
    title: 'Title',
    content: 'Content',
    guidelineTitlePlaceholder: 'Guideline title',
    guidelineContentPlaceholder: 'Enter guideline content here...',
    categoryFaqLibrary: 'FAQ Library',
    categoryCannedMessages: 'Canned Messages',
    categoryRoleplay: 'Role-Play Training',
    categoryGeneral: 'General Guidelines',

    completedTrainingSessions: 'Completed Training Sessions',
    noTrainingSessionsYet: 'No completed training sessions yet.',
    trainingSessionsHelp: 'Complete a roleplay training session to see it here.',
    trainingSession: 'Training Session',
    customer: 'Customer',
    score: 'Score',
    messages: 'Messages',
    feedback: 'Feedback',
    duration: 'Duration',
    min: 'min',
    na: 'N/A',
    objectives: 'Objectives',

    priority: 'Priority',
    question: 'Question',
    answer: 'Answer',
    variations: 'Variations',

    aiTesting: 'AI Testing',
    testQuery: 'Test Query',
    testQueryPlaceholder: 'Ask the AI a question...',
    testing: 'Testing...',
    testAiResponse: 'Test AI Response',
    aiResponse: 'AI Response',
    errorTestingAi: (error) => `Error testing AI: ${error}`,

    faqLibrary: 'FAQ Library',
    generateFaq: 'Generate FAQ',
    generateFaqTitle: 'Generate 10 FAQs from knowledge base',
    generating: 'Generating...',
    addCategory: 'Add Category',
    doubleClickToEdit: 'Double-click to edit or delete',
    leaveBlankToDelete: 'Leave blank to delete',
    categoryNamePlaceholder: 'Category name...',
    editFaq: 'Edit FAQ',
    deleteFaq: 'Delete this FAQ?',
    comments: 'Comments',
    commentsNote: '(How to improve this answer)',
    commentsPlaceholder: 'Add notes on how to improve this answer, specific requirements, tone preferences, etc.',
    keywords: 'Keywords (comma-separated)',
    keywordsPlaceholder: 'price, cost, how much',
    regenerate: 'Regenerate',
    regenerating: 'Regenerating...',
    error: (error) => `Error: ${error}`,
    failedToGenerateFaqs: 'Failed to generate FAQs. Please try again.',

    knowledgeBaseBtn: 'Knowledge Base',
    deepAiResearch: 'Deep AI Research',
    researching: 'Researching...',
    generate: 'Generate',
    selectService: 'Select a service...',
    selectKnowledgeFiles: 'Select Knowledge Base Files',
    selectAll: 'Select All',
    clearAll: 'Clear All',
    noKnowledgeYet: 'No knowledge base entries yet.',
    uploadInKnowledgeTab: 'Upload files in the Knowledge Base tab.',
    selectExpertSources: 'Select Expert Sources',
    researchAgain: '🔄 Research Again',
    editCannedMessage: 'Edit Canned Message',
    deleteCannedMessage: 'Delete this canned message?',
    id: 'ID',
    scenarioDescription: 'Scenario Description',
    scenarioPlaceholder: 'e.g., User says \'too expensive\'',
    template: 'Template',
    variables: 'Variables (comma-separated)',
    variablesPlaceholder: 'userName, productName',
    variablesLabel: 'Variables',

    bookingManagement: 'Booking Management',
    manageAppointments: 'Manage Appointments',

    services: 'Services',
    addService: 'Add Service',
    manageServices: 'Manage Services',
    servicesDescription: 'Manage appointment services available for booking',
    noServicesYet: 'No services yet. Click "Add Service" to create one.',
    editService: 'Edit Service',
    addNewService: 'Add New Service',
    serviceName: 'Service Name',
    serviceNamePlaceholder: 'e.g., Classic Facial, Deep Tissue Massage',
    description: 'Description',
    descriptionPlaceholder: 'Brief description of the service...',
    priceUsd: 'Price (USD)',
    pricePlaceholder: 'e.g., 89.99',
    pleaseFilldAll: 'Please fill in all fields',
    serviceDeleted: 'Service deleted successfully',
    serviceSaved: 'Service saved successfully!',
    confirmDeleteService: (name) => `Delete service "${name}"?`,

    staff: 'Staff',
    addStaffMember: 'Add Staff Member',
    staffDescription: 'Add and manage real staff members for appointments',
    noStaffYet: 'No staff members yet. Click "Add Staff Member" to create one.',
    editStaffMember: 'Edit Staff Member',
    addNewStaffMember: 'Add New Staff Member',
    nameRequired: 'Name *',
    namePlaceholder: 'e.g., Sarah Johnson',
    emailOptional: 'Email (optional)',
    emailPlaceholder: 'sarah@example.com',
    staffTypeOptional: 'Staff Type (optional)',
    staffTypePlaceholder: 'e.g., Therapist, Esthetician',
    email: 'Email',
    type: 'Type',
    viewSchedule: 'View schedule',
    pleaseEnterName: 'Please enter a name',
    staffMemberSaved: 'Staff member saved successfully!',
    confirmDeleteStaff: (name) => `Delete staff member "${name}"?`,
    staffMemberDeleted: 'Staff member deleted successfully',

    serviceAssignments: 'Service Assignments',
    manageStaffAssignments: 'Manage Staff Assignments',
    assignmentsDescription: 'Assign staff members to services they can perform',
    noAssignmentsYet: 'No assignments yet. Click "Manage Staff Assignments" to create one.',
    assignStaffToService: 'Assign Staff to Service',
    service: 'Service',
    staffMembers: (count) => `Staff Members (${count} selected)`,
    pleaseSelectService: 'Please select a service',
    pleaseSelectStaff: 'Please select at least one staff member',
    assignmentsSaved: 'Staff assignments updated successfully!',
    saveAssignments: 'Save Assignments',

    outlets: 'Outlets / Locations',
    addOutlet: 'Add Outlet',
    outletsDescription: 'Manage business locations and their addresses',
    noOutletsYet: 'No outlets yet. Click "Add Outlet" to create one.',
    editOutlet: 'Edit Outlet',
    addNewOutlet: 'Add New Outlet',
    outletNameRequired: 'Outlet Name *',
    outletNamePlaceholder: 'e.g., Downtown Location, Main Street Salon',
    addressLine1Required: 'Address Line 1 *',
    addressLine1Placeholder: 'Street address',
    addressLine2: 'Address Line 2',
    addressLine2Placeholder: 'Apartment, suite, unit, building, floor, etc.',
    cityRequired: 'City *',
    cityPlaceholder: 'City',
    stateProvince: 'State/Province',
    statePlaceholder: 'e.g., CA, NY',
    postalCode: 'Postal Code',
    postalPlaceholder: 'ZIP/Postal code',
    country: 'Country',
    countryPlaceholder: 'Country',
    phone: 'Phone',
    phonePlaceholder: '+1 (555) 123-4567',
    emailLabel: 'Email',
    emailLocationPlaceholder: 'location@example.com',
    displayOrder: 'Display Order',
    displayOrderHelp: 'Lower numbers appear first in customer selection',
    phoneDisplay: (phone) => `📞 ${phone}`,
    emailDisplay: (email) => `✉️ ${email}`,
    pleaseProvideRequired: 'Please fill in all required fields (Name, Address Line 1, City)',
    outletCreated: 'Outlet created successfully',
    outletUpdated: 'Outlet updated successfully',
    confirmDeleteOutlet: (name) => `Delete outlet "${name}"? This will also delete all associated rooms.`,
    outletDeleted: 'Outlet deleted successfully',

    treatmentRooms: 'Treatment Rooms',
    addRoom: 'Add Room',
    roomsDescription: 'Manage treatment rooms and facilities',
    noRoomsYet: 'No rooms yet. Click "Add Room" to create one.',
    editRoom: 'Edit Room',
    addNewRoom: 'Add New Room',
    outletLocation: 'Outlet / Location',
    selectOutletOptional: 'Select an outlet (optional)',
    noOutletsAvailable: 'No outlets available. Create an outlet first.',
    selectLocationHelp: 'Select the location for this room',
    roomNumberRequired: 'Room Number *',
    roomNumberPlaceholder: 'e.g., 101, A1, Suite 1',
    roomNameOptional: 'Room Name (optional)',
    roomNamePlaceholder: 'e.g., Luxury Suite, Relaxation Room',
    pleaseEnterRoomNumber: 'Please enter a room number',
    roomSaved: 'Room saved successfully!',
    room: (number) => `Room ${number}`,
    roomDeleted: 'Room deleted successfully',
    confirmDeleteRoom: (number) => `Delete room ${number}?`,
    manageServicesForRoom: (number) => `Manage Services for Room ${number}`,
    roomServicesDescription: 'Select which services can be performed in this room. If no services are selected, this room can handle any service.',
    noServicesAvailable: 'No services available. Create services first.',
    manageServicesBtn: 'Manage Services',
    roomCanHandleAny: 'Room can now handle any service',
    roomCanHandle: (count) => `Room can now handle ${count} service(s)`,
    saveServices: 'Save Services',
    servicesLabel: 'Services',
    allServicesText: 'All services (no restrictions)',
    locationDisplay: (outlet, city) => `📍 ${outlet} - ${city}`,
    roomServicesDisplay: (names) => `🔧 Services: ${names}`,

    knowledgeEntries: 'Knowledge Entries',
    trainingExamples: 'Training Examples',
    activeTraining: 'Active Training',

    aiModelSettings: 'AI Model Settings',
    aiModelDescription: 'Configure which AI model to use for chat and training. Changes apply immediately.',
    securityNote: '🔐 Security Note: API keys are configured in the .env.local file on the server. This interface only allows you to change the provider and model settings.',
    llmProvider: 'LLM Provider',
    providerAnthropic: 'Anthropic Claude',
    providerOllama: 'Ollama (Local)',
    providerOpenAI: 'OpenAI GPT',
    modelName: 'Model Name',
    modelPlaceholderAnthropic: 'claude-3-haiku-20240307',
    modelPlaceholderOllama: 'qwen2.5:7b',
    modelPlaceholderOpenAI: 'gpt-4',
    modelExamplesAnthropic: 'Examples: claude-3-haiku-20240307, claude-3-5-sonnet-20241022',
    modelExamplesOllama: 'Examples: qwen2.5:7b, llama3.1:8b, mistral:7b',
    modelExamplesOpenAI: 'Examples: gpt-4o (recommended), gpt-4-turbo, gpt-4o-mini, gpt-4, gpt-3.5-turbo',
    ollamaBaseUrl: 'Ollama Base URL',
    ollamaUrlPlaceholder: 'http://localhost:11434',
    ollamaHelp: 'Make sure Ollama is running locally.',
    temperature: (value) => `Temperature: ${value}`,
    temperatureHelp: 'Lower = more focused, Higher = more creative (0.7 recommended)',
    saveSettings: 'Save Settings',
    currentConfiguration: 'Current Configuration',
    provider: 'Provider',
    model: 'Model',
    settingsSaved: 'LLM settings saved successfully! Changes will apply to new conversations.\n\nNote: API keys remain configured in .env.local file.',
    failedToSave: (error) => `Failed to save settings: ${error}`,
    errorSavingSettings: 'Error saving LLM settings. Please check your configuration.',

    // Landing Page Editor
    landingPageEditor: 'Landing Page Editor',
    landingPageDescription: 'Customize the landing page that customers see when they visit your shop.',
    noLandingPageYet: 'No landing page configured yet. Create one to customize what customers see.',
    createLandingPage: 'Create Landing Page',
    heroSection: 'Hero Section',
    announcementText: 'Announcement Text',
    announcementPlaceholder: 'e.g., FREE SHIPPING ON ORDERS OVER $50',
    heroHeadline: 'Hero Headline',
    heroHeadlinePlaceholder: 'e.g., Transform Your Skin',
    heroSubheadline: 'Hero Subheadline',
    heroSubheadlinePlaceholder: 'e.g., Discover the secret to radiant, youthful skin',
    heroProductName: 'Product Name',
    heroProductNamePlaceholder: 'e.g., Triple Regeneration Kit',
    heroBenefits: 'Hero Benefits (one per line)',
    heroBenefitsPlaceholder: 'e.g., Reduces fine lines\n30x absorption\n5-minute treatment',
    heroCTA: 'CTA Button Text',
    heroCTAPlaceholder: 'e.g., Shop Now - 60% OFF',
    clinicalResults: 'Clinical Results',
    addResult: 'Add Result',
    resultValue: 'Value (e.g., 94%)',
    resultLabel: 'Label (e.g., Improved)',
    pricingSection: 'Pricing Options',
    addPricingOption: 'Add Pricing Option',
    optionLabel: 'Label',
    originalPrice: 'Original Price',
    salePrice: 'Sale Price',
    discount: 'Discount %',
    markAsPopular: 'Mark as Popular',
    showSoldIndicator: 'Show Sold Indicator',
    soldPercentage: 'Sold Percentage',
    testimonialsSection: 'Testimonials',
    addTestimonial: 'Add Testimonial',
    customerName: 'Customer Name',
    customerAge: 'Age',
    testimonialText: 'Testimonial Text',
    faqSection: 'FAQ Section',
    addFaqItem: 'Add FAQ',
    trustBadges: 'Trust Badges',
    addBadge: 'Add Badge',
    badgeIcon: 'Icon (emoji)',
    badgeLabel: 'Label',
    footerDisclaimer: 'Footer Disclaimer',
    themeColors: 'Theme Colors',
    primaryColor: 'Primary Color',
    secondaryColor: 'Secondary Color',
    saveLandingPage: 'Save Landing Page',
    landingPageSaved: 'Landing page saved successfully!',
    previewLandingPage: 'Preview Landing Page',

    areYouSure: 'Are you sure?',
    actionCannotBeUndone: 'This action cannot be undone.',
    yes: 'Yes',
    no: 'No',

    aiStaffTrainingCenter: 'AI Staff Training Center',
    aiStaffTrainingDesc: 'Train your AI staff members with different roles through automated dialogue with AI customers',
    aiStaffMembers: 'AI Staff Members',
    addStaff: 'Add Staff',
    aiCoachTrainingSession: 'AI Coach Training Session',
    complete: 'Complete',
    aiTrainingWillAppear: 'AI training conversation will appear here',
    selectScenarioToBegin: 'Select a scenario below to begin training',
    trainingScenarios: 'Training Scenarios',
    createScenario: 'Create Scenario',
    scenarioName: 'Scenario Name',
    scenarioNamePlaceholder: 'e.g., Handle Price Objection',
    customerTypePlaceholder: 'Select customer type...',
    scenarioSituation: 'Scenario Situation',
    scenarioSituationPlaceholder: 'Describe the customer situation...',
    trainingObjectives: 'Training Objectives',
    objectivesPlaceholder: 'Enter objectives, one per line',
    difficulty: 'Difficulty',
    beginner: 'Beginner',
    intermediate: 'Intermediate',
    advanced: 'Advanced',
    timeLimit: 'Time Limit',
    minutes: 'minutes',
    startTraining: 'Start Training',
    provideCoachFeedback: 'Provide feedback to coach',
    feedbackPlaceholder: 'Type feedback for the AI coach...',
    submitFeedback: 'Submit Feedback',
    customerMessage: 'Customer',
    aiCoachResponse: 'AI Coach',
    thinking: 'Thinking...',
    guidelinesCreated: 'Guideline created! You can view and edit it in the Training Data tab under "Training Guidelines".',
    roleCoach: 'Coach',
    roleSales: 'Sales',
    roleSupport: 'Support',
    roleScientist: 'Scientist',

    trainingScenariosFor: 'Training Scenarios for',
    coachRoleDesc: 'Practice educating and guiding customers with empathy',
    salesRoleDesc: 'Practice closing deals, handling objections, and upselling',
    customerServiceRoleDesc: 'Practice resolving issues and ensuring customer satisfaction',
    scientistRoleDesc: 'Practice providing evidence-based, technical explanations',
    allScenariosGenerated: 'All Scenarios Generated',
    generate3MoreScenarios: 'Generate 3 More Scenarios',
    scenario: 'Scenario',
    successCriteria: 'Success Criteria',
    startTrainingSession: 'Start Training Session',
    noScenariosYet: 'No training scenarios yet. Create your first scenario to get started!',
    createFirstScenario: 'Create Your First Scenario',
    createCustomScenario: 'Create Custom Training Scenario',
    deleteScenario: 'Delete scenario',
    addNewStaff: 'Add New AI Staff',
    staffName: 'Staff Name',
    staffNamePlaceholder: 'Enter staff name',
    selectRole: 'Select Role',

    aiCustomer: 'AI Customer',
    typeQuestionPlaceholder: 'Type your question as a customer...',
    autoBtn: 'Auto',
    feedbackBtn: 'Feedback',
    saveAsGuideline: 'Save as Guideline',
    trainingPurpose: 'Training Purpose',
    activeTrainingMemory: 'Active Training Memory',
    feedbackItems: 'feedback items',
    forCustomers: 'customers',

    trainingDataTitle: 'Training Data',
    newGuideline: 'New Guideline',
    expand: 'Expand',
    collapse: 'Collapse',
    created: 'Created',
    updated: 'Updated',

    // Booking Dashboard
    bookingDashboard: 'Booking Dashboard',
    scheduleFor: "'s Schedule",
    viewingAppointmentsFor: 'Viewing appointments for',
    manageAppointmentsAvailability: 'Manage appointments and availability',
    clearFilter: 'Clear Filter',
    today: 'Today',
    groupBy: 'Group by:',
    staff: 'Staff',
    roomLabel: 'Room',
    service: 'Service',
    selectStaff: 'Select Staff:',
    selectRooms: 'Select Rooms:',
    selectServices: 'Select Services:',
    previous: '← Previous',
    next: 'Next →',
    day: 'Day',
    week: 'Week',
    month: 'Month',
    allStatuses: 'All Statuses',
    pending: 'Pending',
    confirmed: 'Confirmed',
    completed: 'Completed',
    cancelled: 'Cancelled',
    pendingEdit: 'Pending Edit',
    pendingCancellation: 'Pending Cancellation',
    blockedTime: 'Blocked Time',
    noSelectionMade: 'No Selection Made',
    pleaseSelectStaff: 'Please select at least one staff member to view their schedule.',
    pleaseSelectRoom: 'Please select at least one room to view its schedule.',
    pleaseSelectService: 'Please select at least one service to view its schedule.',
    appointmentsThisWeek: 'appointment(s) this week',
    noAppointments: 'No appointments',
    client: 'Client',
    location: 'Location',
    statusLabel: 'Status',
    appointments: 'Appointments',
    noAppointmentsFound: 'No appointments found for this period',
    email: 'Email',
    phone: 'Phone',
    notes: 'Notes',
    confirm: 'Confirm',
    decline: 'Decline',
    blockTime: 'Block Time',
    blockTimeDescription: 'Block specific time slots for holidays, breaks, or personal time',
    addBlockedTime: 'Add Blocked Time',
    loadingAppointments: 'Loading appointments...',

    // Appointment Actions
    noStaffAssigned: 'No staff assigned to this appointment',
    appointmentConfirmed: 'Appointment confirmed successfully!',
    failedToConfirm: 'Failed to confirm appointment',
    provideDeclineReason: 'Please provide a reason for declining:',
    appointmentDeclined: 'Appointment declined',
    failedToDecline: 'Failed to decline appointment',

    // Edit Appointment Modal
    editAppointment: 'Edit Appointment',
    currentDetails: 'Current Details',
    newDate: 'New Date',
    startTime: 'Start Time',
    endTime: 'End Time',
    assignedStaff: 'Assigned Staff',
    selectStaffOption: 'Select Staff',
    treatmentRoom: 'Treatment Room',
    selectRoomOption: 'Select Room',
    reasonForChange: 'Reason for Change *',
    reasonForChangePlaceholder: 'Please explain why this appointment needs to be changed...',
    editRequestNotice: 'This request will be sent to your manager for approval, and then to the client for confirmation.',
    submitEditRequest: 'Submit Edit Request',
    noChangesDetected: 'No changes detected',
    provideChangeReason: 'Please provide a reason for the change',
    editRequestSubmitted: 'Edit request submitted successfully! Awaiting manager approval.',
    failedToSubmitEdit: 'Failed to submit edit request',

    // Cancel Appointment Modal
    cancelAppointment: 'Cancel Appointment',
    appointmentToCancel: 'Appointment to Cancel',
    reasonForCancellation: 'Reason for Cancellation *',
    reasonForCancellationPlaceholder: 'Please explain why this appointment needs to be cancelled...',
    cancellationNotice: 'This cancellation request will be sent to your manager for approval, and then to the client for confirmation. The appointment will remain active until the client confirms the cancellation.',
    submitCancellationRequest: 'Submit Cancellation Request',
    keepAppointment: 'Keep Appointment',
    provideCancellationReason: 'Please provide a reason for cancellation',
    cancellationRequestSubmitted: 'Cancellation request submitted successfully! Awaiting manager approval.',
    failedToSubmitCancellation: 'Failed to submit cancellation request',

    // Block Time Modal
    blockTimeTitle: 'Block Time',
    startDate: 'Start Date *',
    endDate: 'End Date *',
    reasonForBlocking: 'Reason for Blocking *',
    reasonForBlockingPlaceholder: 'e.g., Vacation, Training, Personal Time Off',
    recurringWeekly: 'Recurring (same time every week)',
    blockTimeNotice: 'During this blocked time, new appointments cannot be booked. Existing appointments are not affected.',
    blocking: 'Blocking Time...',
    selectDates: 'Please select start and end dates',
    provideBlockingReason: 'Please provide a reason for blocking this time',
    endDateAfterStart: 'End date must be after start date',
    successfullyBlocked: 'Successfully blocked',

    // Booking Modal (Customer)
    bookAppointment: 'Book Appointment',
    bookingConfirmed: 'Booking Confirmed!',
    selectAService: 'Select a Service',
    noStaffAssignedToService: 'No staff is assigned to this service yet. Please contact support.',
    changeService: '← Change Service',
    selectedService: 'Selected Service',
    selectLocation: 'Select Location',
    changeLocation: '← Change Location',
    selected: 'Selected',
    selectStaffMemberTitle: 'Select Staff Member',
    noStaffAvailable: 'No assigned staff available at this location',
    changeStaff: '← Change Staff',
    bookingDetails: 'Booking Details',
    selectDateTime: 'Select Date & Time',
    continueToDetails: 'Continue to Details',
    changeDateTime: '← Change Date/Time',
    bookingSummary: 'Booking Summary',
    phoneOptional: 'Phone Number (Optional)',
    phonePlaceholder: '+1 (555) 123-4567',
    specialRequestsOptional: 'Special Requests (Optional)',
    specialRequestsPlaceholder: 'Any special requests or notes...',
    confirmBooking: 'Confirm Booking',
    bookingSuccessMessage: 'Your appointment has been successfully booked.',
    bookingConfirmationNotice: 'You will receive a confirmation notification soon. A room will be assigned for your appointment.',
    done: 'Done',

    // Slot Picker
    loadingAvailability: 'Loading availability...',
    errorLoadingSlots: 'Error loading slots:',
    tryAgain: 'Try again',
    noAppointmentsAvailable: 'No appointments available on this date.',
    selectDifferentDate: 'Please select a different date.',
    selectATime: 'Select a Time',
    available: 'Available',
    unavailable: 'Unavailable',

    // Weekly Calendar Picker
    nextWeek: 'Next Week',
    selectedTime: 'Selected Time',
    hours: 'hours',

    // Common
    minutes: 'minutes',
    at: 'at',
    with: 'with',
    date: 'Date',
    time: 'Time',
    status: 'Status',
    noAppointmentsForPeriod: 'No appointments found for this period',
    edit: 'Edit',
    cancel: 'Cancel',
    manageAppointmentsAndAvailability: 'Manage appointments and availability',
    statusPending: 'Pending',
    statusConfirmed: 'Confirmed',
    statusCompleted: 'Completed',
    statusCancelled: 'Cancelled',
    statusPendingEdit: 'Pending Edit',
    statusPendingCancellation: 'Pending Cancellation',
    statusBlocked: 'Blocked Time',
    reasonPlaceholder: 'Please explain why this appointment needs to be changed...',
    editRequestInfo: 'This request will be sent to your manager for approval, and then to the client for confirmation.',
    submitting: 'Submitting...',
    cancellationPlaceholder: 'Please explain why this appointment needs to be cancelled...',
    importantNotice: 'Important Notice',
    cancellationWarning: 'This cancellation request will be sent to your manager for approval, and then to the client for confirmation. The appointment will remain active until the client confirms the cancellation.',
    blockReasonPlaceholder: 'e.g., Vacation, Training, Personal Time Off',
    recurringOption: 'Recurring (same time every week)',
    blockTimeInfo: 'During this blocked time, new appointments cannot be booked. Existing appointments are not affected.',
    blockingTime: 'Blocking Time...',
    selectStaffMember: 'Select Staff Member',
    noAssignedStaffAtLocation: 'No assigned staff available at this location',
    changeStaff: 'Change Staff',
    phoneNumberOptional: 'Phone Number (Optional)',
    specialRequestsPlaceholder: 'Any special requests or notes...',
    booking: 'Booking...',
    appointmentBookedSuccess: 'Your appointment has been successfully booked.',
    confirmationNotificationMessage: 'You will receive a confirmation notification soon. A room will be assigned for your appointment.',

    // Knowledge Base - Sub-tabs
    industryKnowledge: 'Industry Knowledge',
    landingPageTab: 'Landing Page',
    imageLibrary: 'Image Library',
    conversations: 'Conversations',

    // Industry Knowledge Section
    uploadDocumentsDesc: 'Upload documents or scrape websites for AI staff to learn from',
    uploadDocument: 'Upload Document',
    browseFiles: 'Browse Files',
    supportedFileTypes: 'PDFs, Word docs, product manuals, training guides, FAQs, etc.',

    // Landing Page Editor
    landingPageEditor: 'Landing Page Editor',
    saving: 'Saving...',
    preview: 'Preview',
    viewLive: 'View Live',
    addBlock: 'Add Block',
    publish: 'Publish',
    publishedStatus: 'Published',
    liveStatus: 'Live',
    loading: 'Loading...',
    noLandingPageYet: 'No landing page configured yet. Create one to customize what customers see.',
    createLandingPage: 'Create Landing Page',

    // Block Types
    splitBlock: 'Split',
    splitBlockDesc: 'Text alongside image',
    cardBlock: 'Card',
    cardBlockDesc: 'Testimonials & reviews grid',
    accordionBlock: 'Accordion',
    accordionBlockDesc: 'Expandable FAQ sections',
    pricingTableBlock: 'Pricing Table',
    pricingTableBlockDesc: 'Pricing comparison with discounts',
    testimonialsBlock: 'Testimonials',
    testimonialsBlockDesc: 'Customer reviews carousel',
    textImageGridBlock: 'Text/Image Grid',
    textImageGridBlockDesc: 'Flexible text & image layout',

    // Landing Page Sections
    announcementBanner: 'Announcement Banner',
    rotatingAnnouncements: 'Rotating announcements (5s interval)',
    translateBtn: 'Translate',
    menuBar: 'Menu Bar',
    menuBarDesc: 'Logo, navigation links & utilities',
    heroBanner: 'Hero Banner',
    carouselWithSlides: (count: number) => `Carousel with ${count} slides`,
    addSlide: 'Add Slide',
    carouselSlides: 'Carousel Slides',
    horizontalScroll: 'Horizontal Scroll',

    // Logo Settings
    logoSettings: 'Logo Settings',
    positionLabel: 'Position',
    leftPosition: 'Left',
    centerPosition: 'Center',
    logoText: 'Logo Text',
    brandNamePlaceholder: 'Brand Name',
    logoImage: 'Logo Image',

    // Menu Items
    menuItemsLeft: 'Menu Items (Left Side)',
    rightSideUtilities: 'Right Side Utilities',

    // Publishing
    saveLandingPageFirst: 'Please save the landing page first before publishing.',
    unpublish: 'Unpublish',
    confirmUnpublish: 'This will unpublish the landing page. Continue?',
    confirmPublish: 'This will make the landing page live. Continue?',
    confirmUpdateLive: 'This will update the live page with your latest changes. Continue?',
    updateLive: 'Update Live',
    landingPageUnpublished: 'Landing page unpublished!',
    landingPageNowLive: 'Landing page is now live!',
    landingPageLiveUpdated: 'Live page updated with latest changes!',
    failedToUpdatePublish: 'Failed to update publish status',

    // Translation Mode
    exitTranslationMode: 'Exit Translation Mode',
    enableTranslationMode: 'Enable Translation Mode',

    // Common Actions
    copyUrl: 'Copy URL',
    remove: 'Remove',
    moveUp: 'Move up',
    moveDown: 'Move down',
    deleteSlide: 'Delete slide',
    afterAddClickSave: 'After adding, click "Save" to save',
    rememberClickSave: 'Remember to click "Save" to save your changes',
    boldText: 'Bold',
    italicText: 'Italic',
    alignLeft: 'Align Left',
    alignCenter: 'Align Center',
    alignRight: 'Align Right',
    textColor: 'Text color',
    bgColor: 'Background color',
    removeFeature: 'Remove feature',
  },

  'zh-CN': {
    aiStaff: 'AI 客服',
    selectStaffMember: '选择一位客服进行对话',
    language: '语言',

    coach: '顾问',
    sales: '销售',
    customerService: '客户服务',
    scientist: '科学家',

    coachTasks: '美容建议、护肤指导和个性化推荐',
    salesTasks: '产品信息、价格、促销和购买协助',
    customerServiceTasks: '订单跟踪、退货、技术支持和一般咨询',
    scientistTasks: '高级皮肤分析、成分信息和科学研究',

    greeting: (name, emoji, tasks) => `您好！我是 ${name} ${emoji} 我可以帮您提供${tasks}。有什么我可以帮到您的吗？`,

    aiTyping: 'AI 正在输入...',
    placeholder: '询问产品、价格、支持等问题...',
    send: '发送',
    close: '关闭',
    chatNow: '立即咨询',

    faqAbout: (category) => `以下是关于${category}的常见问题：`,
    noFaqAvailable: (category) => `目前还没有关于${category}的常见问题，但欢迎随时向我提问！`,

    loadingKnowledge: '正在加载知识库...',
    welcomeTo: (name) => `欢迎来到${name}！`,
    clickToChat: '点击任意按钮与我们训练有素的AI客服对话',
    noAiStaff: '暂无可用的AI客服。请先在管理面板中训练AI客服。',
    availableStaff: '可用客服：',

    // Pre-Chat Form
    welcome: '欢迎！👋',
    helpUsServeYou: '请分享您的信息，帮助我们更好地为您服务（选填）',
    yourName: '您的姓名',
    yourNamePlaceholder: '请输入您的姓名（选填）',
    yourEmail: '您的电子邮箱',
    yourEmailPlaceholder: '请输入您的电子邮箱（选填）',
    startChat: '开始聊天',
    continueAsGuest: '以访客身份继续',
    chatSavedNotice: '继续即表示您同意我们为质量和合规目的保存您的聊天记录',
    orSignInWith: '或使用以下方式登录',

    close: '关闭',

    adminTitle: 'BNI AI 中心',
    adminSubtitle: '训练和管理您的AI客户支持助手',
    viewLiveChat: '查看实时聊天',
    profile: '个人资料',
    personalProfile: '个人资料',
    companyProfile: '公司资料',
    businessUnit: '业务单位',
    knowledge: '知识库',
    products: '产品',
    training: '训练',
    analytics: '分析',
    roleplay: '角色扮演',
    faq: '常见问题',
    cannedMessages: '预设消息',
    aiModel: 'AI模型',
    booking: '预约',

    add: '添加',
    edit: '编辑',
    delete: '删除',
    save: '保存',
    cancel: '取消',
    update: '更新',
    create: '创建',
    search: '搜索',

    active: '启用',
    inactive: '禁用',
    status: '状态',

    addBusinessUnit: '添加业务单位',
    businessName: '业务名称',
    industry: '行业',
    businessNamePlaceholder: '例如：AIA保险、FitCoach等',
    industryPlaceholder: '例如：保险、健身等',
    cannotDeleteDefault: '无法删除默认的SkinCoach业务单位',
    confirmDeleteBusinessUnit: '确定要删除此业务单位吗？所有相关数据都将被删除。',

    knowledgeBase: '知识库',
    searchEntries: '搜索条目...',
    uploadFiles: '上传文件',
    uploadFilesTitle: '上传文件：TXT、JSON、CSV、PDF、DOCX',
    addUrl: '添加URL',
    addUrlTitle: '从URL添加内容（网站、YouTube）',
    enterUrl: '输入URL（网站或YouTube视频）...',
    fetching: '获取中...',
    urlSupportsText: '支持：网页、YouTube视频和任何公共URL',
    pleaseEnterUrl: '请输入URL',
    pleaseAddKnowledgeFirst: '请先添加一些知识库条目',
    importSuccess: (count) => `成功导入${count}条知识条目！`,
    errorProcessingFile: (name) => `处理文件${name}时出错`,
    unsupportedFileType: (type) => `不支持的文件类型：${type}`,
    failedToFetchUrl: '获取URL失败。请检查URL后重试。',
    youtubeVideo: 'YouTube视频',
    webContent: '网页内容',

    trainingGuidelines: '训练指南',
    guidelinesDescription: '指南控制AI在不同功能中的行为：',
    addGuideline: '添加指南',
    noGuidelinesYet: '还没有训练指南。',
    addGuidelinesHelp: '添加指南以帮助AI了解如何正确响应。',
    editGuideline: '编辑指南',
    deleteGuideline: '删除此指南？',
    category: '类别',
    title: '标题',
    content: '内容',
    guidelineTitlePlaceholder: '指南标题',
    guidelineContentPlaceholder: '在此输入指南内容...',
    categoryFaqLibrary: 'FAQ库',
    categoryCannedMessages: '预设消息',
    categoryRoleplay: '角色扮演训练',
    categoryGeneral: '一般指南',

    completedTrainingSessions: '已完成的训练会话',
    noTrainingSessionsYet: '尚无已完成的训练会话。',
    trainingSessionsHelp: '完成角色扮演训练会话后将在此处显示。',
    trainingSession: '训练会话',
    customer: '客户',
    score: '得分',
    messages: '消息',
    feedback: '反馈',
    duration: '时长',
    min: '分钟',
    na: '不适用',
    objectives: '目标',

    priority: '优先级',
    question: '问题',
    answer: '答案',
    variations: '变体',

    aiTesting: 'AI测试',
    testQuery: '测试查询',
    testQueryPlaceholder: '向AI提问...',
    testing: '测试中...',
    testAiResponse: '测试AI响应',
    aiResponse: 'AI响应',
    errorTestingAi: (error) => `测试AI时出错：${error}`,

    faqLibrary: 'FAQ库',
    generateFaq: '生成FAQ',
    generateFaqTitle: '从知识库生成10个FAQ',
    generating: '生成中...',
    addCategory: '添加类别',
    doubleClickToEdit: '双击以编辑或删除',
    leaveBlankToDelete: '留空以删除',
    categoryNamePlaceholder: '类别名称...',
    editFaq: '编辑FAQ',
    deleteFaq: '删除此FAQ？',
    comments: '备注',
    commentsNote: '（如何改进此答案）',
    commentsPlaceholder: '添加关于如何改进此答案的备注、具体要求、语气偏好等。',
    keywords: '关键词（逗号分隔）',
    keywordsPlaceholder: '价格、成本、多少钱',
    regenerate: '重新生成',
    regenerating: '重新生成中...',
    error: (error) => `错误：${error}`,
    failedToGenerateFaqs: '生成FAQ失败。请重试。',

    knowledgeBaseBtn: '知识库',
    deepAiResearch: '深度AI研究',
    researching: '研究中...',
    generate: '生成',
    selectService: '选择服务...',
    selectKnowledgeFiles: '选择知识库文件',
    selectAll: '全选',
    clearAll: '清除全部',
    noKnowledgeYet: '还没有知识库条目。',
    uploadInKnowledgeTab: '在知识库选项卡中上传文件。',
    selectExpertSources: '选择专家来源',
    researchAgain: '🔄 再次研究',
    editCannedMessage: '编辑预设消息',
    deleteCannedMessage: '删除此预设消息？',
    id: 'ID',
    scenarioDescription: '场景描述',
    scenarioPlaceholder: '例如：用户说"太贵了"',
    template: '模板',
    variables: '变量（逗号分隔）',
    variablesPlaceholder: 'userName, productName',
    variablesLabel: '变量',

    bookingManagement: '预约管理',
    manageAppointments: '管理预约',

    services: '服务',
    addService: '添加服务',
    manageServices: '管理服务',
    servicesDescription: '管理可供预约的服务',
    noServicesYet: '还没有服务。点击"添加服务"创建一个。',
    editService: '编辑服务',
    addNewService: '添加新服务',
    serviceName: '服务名称',
    serviceNamePlaceholder: '例如：经典面部护理、深层组织按摩',
    description: '描述',
    descriptionPlaceholder: '服务的简要描述...',
    priceUsd: '价格（美元）',
    pricePlaceholder: '例如：89.99',
    pleaseFilldAll: '请填写所有字段',
    serviceDeleted: '服务已成功删除',
    serviceSaved: '服务已成功保存！',
    confirmDeleteService: (name) => `删除服务"${name}"？`,

    staff: '员工',
    addStaffMember: '添加员工',
    staffDescription: '添加和管理预约的真实员工',
    noStaffYet: '还没有员工。点击"添加员工"创建一个。',
    editStaffMember: '编辑员工',
    addNewStaffMember: '添加新员工',
    nameRequired: '姓名 *',
    namePlaceholder: '例如：张晓丽',
    emailOptional: '电子邮件（可选）',
    emailPlaceholder: 'sarah@example.com',
    staffTypeOptional: '员工类型（可选）',
    staffTypePlaceholder: '例如：治疗师、美容师',
    email: '电子邮件',
    type: '类型',
    viewSchedule: '查看日程',
    pleaseEnterName: '请输入姓名',
    staffMemberSaved: '员工已成功保存！',
    confirmDeleteStaff: (name) => `删除员工"${name}"？`,
    staffMemberDeleted: '员工已成功删除',

    serviceAssignments: '服务分配',
    manageStaffAssignments: '管理员工分配',
    assignmentsDescription: '将员工分配给他们可以执行的服务',
    noAssignmentsYet: '还没有分配。点击"管理员工分配"创建一个。',
    assignStaffToService: '将员工分配给服务',
    service: '服务',
    staffMembers: (count) => `员工（已选择${count}个）`,
    pleaseSelectService: '请选择服务',
    pleaseSelectStaff: '请至少选择一名员工',
    assignmentsSaved: '员工分配已成功更新！',
    saveAssignments: '保存分配',

    outlets: '门店/位置',
    addOutlet: '添加门店',
    outletsDescription: '管理业务位置及其地址',
    noOutletsYet: '还没有门店。点击"添加门店"创建一个。',
    editOutlet: '编辑门店',
    addNewOutlet: '添加新门店',
    outletNameRequired: '门店名称 *',
    outletNamePlaceholder: '例如：市中心位置、主街沙龙',
    addressLine1Required: '地址行1 *',
    addressLine1Placeholder: '街道地址',
    addressLine2: '地址行2',
    addressLine2Placeholder: '公寓、套房、单元、建筑、楼层等',
    cityRequired: '城市 *',
    cityPlaceholder: '城市',
    stateProvince: '州/省',
    statePlaceholder: '例如：CA、NY',
    postalCode: '邮政编码',
    postalPlaceholder: 'ZIP/邮政编码',
    country: '国家',
    countryPlaceholder: '国家',
    phone: '电话',
    phonePlaceholder: '+1 (555) 123-4567',
    emailLabel: '电子邮件',
    emailLocationPlaceholder: 'location@example.com',
    displayOrder: '显示顺序',
    displayOrderHelp: '数字越小在客户选择中越靠前',
    phoneDisplay: (phone) => `📞 ${phone}`,
    emailDisplay: (email) => `✉️ ${email}`,
    pleaseProvideRequired: '请填写所有必填字段（名称、地址行1、城市）',
    outletCreated: '门店已成功创建',
    outletUpdated: '门店已成功更新',
    confirmDeleteOutlet: (name) => `删除门店"${name}"？这也将删除所有关联的房间。`,
    outletDeleted: '门店已成功删除',

    treatmentRooms: '治疗室',
    addRoom: '添加房间',
    roomsDescription: '管理治疗室和设施',
    noRoomsYet: '还没有房间。点击"添加房间"创建一个。',
    editRoom: '编辑房间',
    addNewRoom: '添加新房间',
    outletLocation: '门店/位置',
    selectOutletOptional: '选择门店（可选）',
    noOutletsAvailable: '没有可用的门店。请先创建门店。',
    selectLocationHelp: '选择此房间的位置',
    roomNumberRequired: '房间号 *',
    roomNumberPlaceholder: '例如：101、A1、套房1',
    roomNameOptional: '房间名称（可选）',
    roomNamePlaceholder: '例如：豪华套房、放松室',
    pleaseEnterRoomNumber: '请输入房间号',
    roomSaved: '房间已成功保存！',
    room: (number) => `房间${number}`,
    roomDeleted: '房间已成功删除',
    confirmDeleteRoom: (number) => `删除房间${number}？`,
    manageServicesForRoom: (number) => `管理房间${number}的服务`,
    roomServicesDescription: '选择可在此房间执行的服务。如果未选择任何服务，此房间可以处理任何服务。',
    noServicesAvailable: '没有可用的服务。请先创建服务。',
    manageServicesBtn: '管理服务',
    roomCanHandleAny: '房间现在可以处理任何服务',
    roomCanHandle: (count) => `房间现在可以处理${count}个服务`,
    saveServices: '保存服务',
    servicesLabel: '服务',
    allServicesText: '所有服务（无限制）',
    locationDisplay: (outlet, city) => `📍 ${outlet} - ${city}`,
    roomServicesDisplay: (names) => `🔧 服务：${names}`,

    knowledgeEntries: '知识条目',
    trainingExamples: '训练示例',
    activeTraining: '活跃训练',

    aiModelSettings: 'AI模型设置',
    aiModelDescription: '配置用于聊天和训练的AI模型。更改立即生效。',
    securityNote: '🔐 安全提示：API密钥在服务器上的.env.local文件中配置。此界面仅允许您更改提供商和模型设置。',
    llmProvider: 'LLM提供商',
    providerAnthropic: 'Anthropic Claude',
    providerOllama: 'Ollama（本地）',
    providerOpenAI: 'OpenAI GPT',
    modelName: '模型名称',
    modelPlaceholderAnthropic: 'claude-3-haiku-20240307',
    modelPlaceholderOllama: 'qwen2.5:7b',
    modelPlaceholderOpenAI: 'gpt-4',
    modelExamplesAnthropic: '示例：claude-3-haiku-20240307、claude-3-5-sonnet-20241022',
    modelExamplesOllama: '示例：qwen2.5:7b、llama3.1:8b、mistral:7b',
    modelExamplesOpenAI: '示例：gpt-4o（推荐）、gpt-4-turbo、gpt-4o-mini、gpt-4、gpt-3.5-turbo',
    ollamaBaseUrl: 'Ollama基础URL',
    ollamaUrlPlaceholder: 'http://localhost:11434',
    ollamaHelp: '确保Ollama在本地运行。',
    temperature: (value) => `温度：${value}`,
    temperatureHelp: '越低=越专注，越高=越有创意（推荐0.7）',
    saveSettings: '保存设置',
    currentConfiguration: '当前配置',
    provider: '提供商',
    model: '模型',
    settingsSaved: 'LLM设置已成功保存！更改将应用于新对话。\n\n注意：API密钥保留在.env.local文件中配置。',
    failedToSave: (error) => `保存设置失败：${error}`,
    errorSavingSettings: '保存LLM设置时出错。请检查您的配置。',

    areYouSure: '确定吗？',
    actionCannotBeUndone: '此操作无法撤消。',
    yes: '是',
    no: '否',

    aiStaffTrainingCenter: 'AI员工培训中心',
    aiStaffTrainingDesc: '通过与AI客户的自动对话，培训您的AI员工',
    aiStaffMembers: 'AI员工列表',
    addStaff: '添加员工',
    aiCoachTrainingSession: 'AI教练培训会话',
    complete: '完成',
    aiTrainingWillAppear: 'AI培训对话将在此显示',
    selectScenarioToBegin: '选择下方场景开始培训',
    trainingScenarios: '培训场景',
    createScenario: '创建场景',
    scenarioName: '场景名称',
    scenarioNamePlaceholder: '例如：处理价格异议',
    customerTypePlaceholder: '选择客户类型...',
    scenarioSituation: '场景情况',
    scenarioSituationPlaceholder: '描述客户情况...',
    trainingObjectives: '培训目标',
    objectivesPlaceholder: '输入目标，每行一个',
    difficulty: '难度',
    beginner: '初级',
    intermediate: '中级',
    advanced: '高级',
    timeLimit: '时间限制',
    minutes: '分钟',
    startTraining: '开始培训',
    provideCoachFeedback: '向教练提供反馈',
    feedbackPlaceholder: '输入给AI教练的反馈...',
    submitFeedback: '提交反馈',
    customerMessage: '客户',
    aiCoachResponse: 'AI教练',
    thinking: '思考中...',
    guidelinesCreated: '指南已创建！您可以在"培训数据"标签下的"培训指南"中查看和编辑。',
    roleCoach: '顾问',
    roleSales: '销售',
    roleSupport: '客服',
    roleScientist: '科学家',

    trainingScenariosFor: '培训场景 -',
    coachRoleDesc: '练习以同理心教育和引导客户',
    salesRoleDesc: '练习成交、处理异议和追加销售',
    customerServiceRoleDesc: '练习解决问题并确保客户满意',
    scientistRoleDesc: '练习提供基于证据的技术解释',
    allScenariosGenerated: '所有场景已生成',
    generate3MoreScenarios: '生成更多3个场景',
    scenario: '场景',
    successCriteria: '成功标准',
    startTrainingSession: '开始培训会话',
    noScenariosYet: '暂无培训场景。创建您的第一个场景开始吧！',
    createFirstScenario: '创建您的第一个场景',
    createCustomScenario: '创建自定义培训场景',
    deleteScenario: '删除场景',
    addNewStaff: '添加新AI员工',
    staffName: '员工姓名',
    staffNamePlaceholder: '输入员工姓名',
    selectRole: '选择角色',

    aiCustomer: 'AI客户',
    typeQuestionPlaceholder: '以客户身份输入您的问题...',
    autoBtn: '自动',
    feedbackBtn: '反馈',
    saveAsGuideline: '保存为指南',
    trainingPurpose: '培训目的',
    activeTrainingMemory: '活跃培训记忆',
    feedbackItems: '条反馈',
    forCustomers: '客户',

    trainingDataTitle: '培训数据',
    newGuideline: '新指南',
    expand: '展开',
    collapse: '收起',
    created: '创建于',
    updated: '更新于',

    // Booking Dashboard
    bookingDashboard: '预约管理',
    scheduleFor: '的日程',
    viewingAppointmentsFor: '查看预约：',
    manageAppointmentsAvailability: '管理预约和可用时间',
    clearFilter: '清除筛选',
    today: '今天',
    groupBy: '分组方式：',
    staff: '员工',
    roomLabel: '房间',
    service: '服务',
    selectStaff: '选择员工：',
    selectRooms: '选择房间：',
    selectServices: '选择服务：',
    previous: '← 上一页',
    next: '下一页 →',
    day: '日',
    week: '周',
    month: '月',
    allStatuses: '全部状态',
    pending: '待确认',
    confirmed: '已确认',
    completed: '已完成',
    cancelled: '已取消',
    pendingEdit: '待修改',
    pendingCancellation: '待取消',
    blockedTime: '已屏蔽时间',
    noSelectionMade: '未选择',
    pleaseSelectStaff: '请至少选择一名员工以查看其日程。',
    pleaseSelectRoom: '请至少选择一个房间以查看其日程。',
    pleaseSelectService: '请至少选择一项服务以查看其日程。',
    appointmentsThisWeek: '本周预约数',
    noAppointments: '暂无预约',
    client: '客户',
    location: '位置',
    statusLabel: '状态',
    appointments: '预约',
    noAppointmentsFound: '该时段暂无预约',
    email: '邮箱',
    phone: '电话',
    notes: '备注',
    confirm: '确认',
    decline: '拒绝',
    blockTime: '屏蔽时间',
    blockTimeDescription: '为假期、休息或个人时间屏蔽特定时间段',
    addBlockedTime: '添加屏蔽时间',
    loadingAppointments: '加载预约中...',

    noStaffAssigned: '此预约未分配员工',
    appointmentConfirmed: '预约确认成功！',
    failedToConfirm: '确认预约失败',
    provideDeclineReason: '请提供拒绝原因：',
    appointmentDeclined: '预约已拒绝',
    failedToDecline: '拒绝预约失败',

    editAppointment: '编辑预约',
    currentDetails: '当前详情',
    newDate: '新日期',
    startTime: '开始时间',
    endTime: '结束时间',
    assignedStaff: '分配员工',
    selectStaffOption: '选择员工',
    treatmentRoom: '治疗室',
    selectRoomOption: '选择房间',
    reasonForChange: '修改原因 *',
    reasonForChangePlaceholder: '请说明需要修改此预约的原因...',
    editRequestNotice: '此请求将发送给您的经理审批，然后发送给客户确认。',
    submitEditRequest: '提交修改请求',
    noChangesDetected: '未检测到更改',
    provideChangeReason: '请提供修改原因',
    editRequestSubmitted: '修改请求已提交！等待经理审批。',
    failedToSubmitEdit: '提交修改请求失败',

    cancelAppointment: '取消预约',
    appointmentToCancel: '待取消预约',
    reasonForCancellation: '取消原因 *',
    reasonForCancellationPlaceholder: '请说明需要取消此预约的原因...',
    cancellationNotice: '此取消请求将发送给您的经理审批，然后发送给客户确认。预约在客户确认取消前保持有效。',
    submitCancellationRequest: '提交取消请求',
    keepAppointment: '保留预约',
    provideCancellationReason: '请提供取消原因',
    cancellationRequestSubmitted: '取消请求已提交！等待经理审批。',
    failedToSubmitCancellation: '提交取消请求失败',

    blockTimeTitle: '屏蔽时间',
    startDate: '开始日期 *',
    endDate: '结束日期 *',
    reasonForBlocking: '屏蔽原因 *',
    reasonForBlockingPlaceholder: '例如：休假、培训、个人休息',
    recurringWeekly: '每周重复（相同时间）',
    blockTimeNotice: '在屏蔽时间内，无法预约新的服务。现有预约不受影响。',
    blocking: '屏蔽中...',
    selectDates: '请选择开始和结束日期',
    provideBlockingReason: '请提供屏蔽此时间的原因',
    endDateAfterStart: '结束日期必须晚于开始日期',
    successfullyBlocked: '成功屏蔽',

    bookAppointment: '预约服务',
    bookingConfirmed: '预约成功！',
    selectAService: '选择服务',
    noStaffAssignedToService: '此服务暂未分配员工，请联系客服。',
    changeService: '← 更换服务',
    selectedService: '已选服务',
    selectLocation: '选择地点',
    changeLocation: '← 更换地点',
    selected: '已选',
    selectStaffMemberTitle: '选择员工',
    noStaffAvailable: '此地点暂无可用员工',
    changeStaff: '← 更换员工',
    bookingDetails: '预约详情',
    selectDateTime: '选择日期和时间',
    continueToDetails: '继续填写详情',
    changeDateTime: '← 更换日期/时间',
    bookingSummary: '预约摘要',
    phoneOptional: '电话（可选）',
    phonePlaceholder: '+86 138 0000 0000',
    specialRequestsOptional: '特殊要求（可选）',
    specialRequestsPlaceholder: '任何特殊要求或备注...',
    confirmBooking: '确认预约',
    bookingSuccessMessage: '您的预约已成功提交。',
    bookingConfirmationNotice: '您将很快收到确认通知。我们将为您的预约分配房间。',
    done: '完成',

    loadingAvailability: '加载可用时间...',
    errorLoadingSlots: '加载时段出错：',
    tryAgain: '重试',
    noAppointmentsAvailable: '该日期暂无可用预约。',
    selectDifferentDate: '请选择其他日期。',
    selectATime: '选择时间',
    available: '可用',
    unavailable: '不可用',

    // Weekly Calendar Picker
    nextWeek: '下一周',
    selectedTime: '已选时间',
    hours: '小时',

    // Common
    minutes: '分钟',
    at: '于',
    with: '与',
    date: '日期',
    time: '时间',
    status: '状态',
    noAppointmentsForPeriod: '此时段暂无预约',
    edit: '编辑',
    cancel: '取消',
    manageAppointmentsAndAvailability: '管理预约和可用性',
    statusPending: '待确认',
    statusConfirmed: '已确认',
    statusCompleted: '已完成',
    statusCancelled: '已取消',
    statusPendingEdit: '待修改',
    statusPendingCancellation: '待取消',
    statusBlocked: '已屏蔽',
    reasonPlaceholder: '请说明需要更改此预约的原因...',
    editRequestInfo: '此请求将发送给您的经理审批,然后发送给客户确认。',
    submitting: '提交中...',
    cancellationPlaceholder: '请说明需要取消此预约的原因...',
    importantNotice: '重要通知',
    cancellationWarning: '此取消请求将发送给您的经理审批,然后发送给客户确认。在客户确认取消之前,预约将保持有效。',
    blockReasonPlaceholder: '例如:假期、培训、个人休假',
    recurringOption: '重复(每周同一时间)',
    blockTimeInfo: '在此屏蔽期间,无法预约新的预约。现有预约不受影响。',
    blockingTime: '屏蔽时间中...',
    selectStaffMember: '选择员工',
    noAssignedStaffAtLocation: '此地点暂无可用的指定员工',
    changeStaff: '更换员工',
    phoneNumberOptional: '电话号码(可选)',
    specialRequestsPlaceholder: '任何特殊要求或备注...',
    booking: '预约中...',
    appointmentBookedSuccess: '您的预约已成功预订。',
    confirmationNotificationMessage: '您将很快收到确认通知。我们会为您的预约分配房间。',

    industryKnowledge: '行业知识',
    landingPageTab: '落地页',
    imageLibrary: '图片库',
    conversations: '对话记录',
    uploadDocumentsDesc: '上传文件或抓取网站内容供AI员工学习',
    uploadDocument: '上传文件',
    browseFiles: '浏览文件',
    supportedFileTypes: 'PDF、Word文档、产品手册、培训指南、常见问题等',
    landingPageEditor: '落地页编辑器',
    saving: '保存中...',
    preview: '预览',
    viewLive: '查看线上版',
    addBlock: '添加模块',
    publish: '发布',
    publishedStatus: '已发布',
    liveStatus: '上线中',
    loading: '加载中...',
    noLandingPageYet: '尚未配置落地页。创建一个来自定义客户看到的内容。',
    createLandingPage: '创建落地页',
    splitBlock: '分栏',
    splitBlockDesc: '文字配图片',
    cardBlock: '卡片',
    cardBlockDesc: '评价与评论网格',
    accordionBlock: '手风琴',
    accordionBlockDesc: '可展开的FAQ区域',
    pricingTableBlock: '价格表',
    pricingTableBlockDesc: '价格对比与折扣',
    testimonialsBlock: '客户评价',
    testimonialsBlockDesc: '客户评论轮播',
    textImageGridBlock: '文图网格',
    textImageGridBlockDesc: '灵活的文字与图片布局',
    announcementBanner: '公告横幅',
    rotatingAnnouncements: '轮播公告（5秒间隔）',
    translateBtn: '翻译',
    menuBar: '菜单栏',
    menuBarDesc: 'Logo、导航链接和工具',
    heroBanner: '首屏横幅',
    carouselWithSlides: (count: number) => `轮播共 ${count} 页`,
    addSlide: '添加幻灯片',
    carouselSlides: '轮播幻灯片',
    horizontalScroll: '横向滚动',
    logoSettings: 'Logo 设置',
    positionLabel: '位置',
    leftPosition: '左',
    centerPosition: '居中',
    logoText: 'Logo 文字',
    brandNamePlaceholder: '品牌名称',
    logoImage: 'Logo 图片',
    menuItemsLeft: '菜单项（左侧）',
    rightSideUtilities: '右侧工具',
    saveLandingPageFirst: '请先保存落地页再发布。',
    unpublish: '取消发布',
    confirmUnpublish: '这将取消发布落地页。确定继续？',
    confirmPublish: '这将使落地页上线。确定继续？',
    confirmUpdateLive: '这将用最新更改更新上线页面。确定继续？',
    updateLive: '更新上线',
    landingPageUnpublished: '落地页已取消发布！',
    landingPageNowLive: '落地页已上线！',
    landingPageLiveUpdated: '上线页面已更新为最新更改！',
    failedToUpdatePublish: '更新发布状态失败',
    exitTranslationMode: '退出翻译模式',
    enableTranslationMode: '启用翻译模式',
    copyUrl: '复制链接',
    remove: '移除',
    moveUp: '上移',
    moveDown: '下移',
    deleteSlide: '删除幻灯片',
    afterAddClickSave: '添加后，点击"保存"来保存',
    rememberClickSave: '记得点击"保存"来保存更改',
    boldText: '粗体',
    italicText: '斜体',
    alignLeft: '左对齐',
    alignCenter: '居中对齐',
    alignRight: '右对齐',
    textColor: '文字颜色',
    bgColor: '背景颜色',
    removeFeature: '移除特性',
  },

  'zh-TW': {
    aiStaff: 'AI 客服',
    selectStaffMember: '選擇一位客服進行對話',
    language: '語言',

    coach: '顧問',
    sales: '銷售',
    customerService: '客戶服務',
    scientist: '科學家',

    coachTasks: '美容建議、護膚指導和個性化推薦',
    salesTasks: '產品資訊、價格、促銷和購買協助',
    customerServiceTasks: '訂單追蹤、退貨、技術支援和一般諮詢',
    scientistTasks: '進階皮膚分析、成分資訊和科學研究',

    greeting: (name, emoji, tasks) => `您好！我是 ${name} ${emoji} 我可以幫您提供${tasks}。有什麼我可以幫到您的嗎？`,

    aiTyping: 'AI 正在輸入...',
    placeholder: '詢問產品、價格、支援等問題...',
    send: '發送',
    close: '關閉',
    chatNow: '立即諮詢',

    faqAbout: (category) => `以下是關於${category}的常見問題：`,
    noFaqAvailable: (category) => `目前還沒有關於${category}的常見問題，但歡迎隨時向我提問！`,

    loadingKnowledge: '正在載入知識庫...',
    welcomeTo: (name) => `歡迎來到${name}！`,
    clickToChat: '點擊任意按鈕與我們訓練有素的AI客服對話',
    noAiStaff: '暫無可用的AI客服。請先在管理面板中訓練AI客服。',
    availableStaff: '可用客服：',

    // Pre-Chat Form
    welcome: '歡迎！👋',
    helpUsServeYou: '請分享您的資訊，幫助我們更好地為您服務（選填）',
    yourName: '您的姓名',
    yourNamePlaceholder: '請輸入您的姓名（選填）',
    yourEmail: '您的電子郵件',
    yourEmailPlaceholder: '請輸入您的電子郵件（選填）',
    startChat: '開始聊天',
    continueAsGuest: '以訪客身份繼續',
    chatSavedNotice: '繼續即表示您同意我們為品質和合規目的保存您的聊天記錄',
    orSignInWith: '或使用以下方式登入',

    adminTitle: 'BNI AI 中心',
    adminSubtitle: '訓練和管理您的AI客戶支援助手',
    viewLiveChat: '查看即時聊天',
    profile: '個人資料',
    personalProfile: '個人資料',
    companyProfile: '公司資料',
    businessUnit: '業務單位',
    knowledge: '知識庫',
    training: '訓練',
    analytics: '分析',
    roleplay: '角色扮演',
    faq: '常見問題',
    cannedMessages: '預設訊息',
    aiModel: 'AI模型',
    booking: '預約',

    add: '新增',
    edit: '編輯',
    delete: '刪除',
    save: '儲存',
    cancel: '取消',
    update: '更新',
    create: '建立',
    search: '搜尋',

    active: '啟用',
    inactive: '停用',
    status: '狀態',

    addBusinessUnit: '新增業務單位',
    businessName: '業務名稱',
    industry: '行業',
    businessNamePlaceholder: '例如：AIA保險、FitCoach等',
    industryPlaceholder: '例如：保險、健身等',
    cannotDeleteDefault: '無法刪除預設的SkinCoach業務單位',
    confirmDeleteBusinessUnit: '確定要刪除此業務單位嗎？所有相關資料都將被刪除。',

    knowledgeBase: '知識庫',
    searchEntries: '搜尋條目...',
    uploadFiles: '上傳檔案',
    uploadFilesTitle: '上傳檔案：TXT、JSON、CSV、PDF、DOCX',
    addUrl: '新增URL',
    addUrlTitle: '從URL新增內容（網站、YouTube）',
    enterUrl: '輸入URL（網站或YouTube影片）...',
    fetching: '獲取中...',
    urlSupportsText: '支援：網頁、YouTube影片和任何公共URL',
    pleaseEnterUrl: '請輸入URL',
    pleaseAddKnowledgeFirst: '請先新增一些知識庫條目',
    importSuccess: (count) => `成功匯入${count}條知識條目！`,
    errorProcessingFile: (name) => `處理檔案${name}時發生錯誤`,
    unsupportedFileType: (type) => `不支援的檔案類型：${type}`,
    failedToFetchUrl: '獲取URL失敗。請檢查URL後重試。',
    youtubeVideo: 'YouTube影片',
    webContent: '網頁內容',

    trainingGuidelines: '訓練指南',
    guidelinesDescription: '指南控制AI在不同功能中的行為：',
    addGuideline: '新增指南',
    noGuidelinesYet: '還沒有訓練指南。',
    addGuidelinesHelp: '新增指南以幫助AI了解如何正確回應。',
    editGuideline: '編輯指南',
    deleteGuideline: '刪除此指南？',
    category: '類別',
    title: '標題',
    content: '內容',
    guidelineTitlePlaceholder: '指南標題',
    guidelineContentPlaceholder: '在此輸入指南內容...',
    categoryFaqLibrary: 'FAQ庫',
    categoryCannedMessages: '預設訊息',
    categoryRoleplay: '角色扮演訓練',
    categoryGeneral: '一般指南',

    completedTrainingSessions: '已完成的訓練會話',
    noTrainingSessionsYet: '尚無已完成的訓練會話。',
    trainingSessionsHelp: '完成角色扮演訓練會話後將在此處顯示。',
    trainingSession: '訓練會話',
    customer: '客戶',
    score: '得分',
    messages: '訊息',
    feedback: '回饋',
    duration: '時長',
    min: '分鐘',
    na: '不適用',
    objectives: '目標',

    priority: '優先順序',
    question: '問題',
    answer: '答案',
    variations: '變體',

    aiTesting: 'AI測試',
    testQuery: '測試查詢',
    testQueryPlaceholder: '向AI提問...',
    testing: '測試中...',
    testAiResponse: '測試AI回應',
    aiResponse: 'AI回應',
    errorTestingAi: (error) => `測試AI時發生錯誤：${error}`,

    faqLibrary: 'FAQ庫',
    generateFaq: '產生FAQ',
    generateFaqTitle: '從知識庫產生10個FAQ',
    generating: '產生中...',
    addCategory: '新增類別',
    doubleClickToEdit: '雙擊以編輯或刪除',
    leaveBlankToDelete: '留空以刪除',
    categoryNamePlaceholder: '類別名稱...',
    editFaq: '編輯FAQ',
    deleteFaq: '刪除此FAQ？',
    comments: '備註',
    commentsNote: '（如何改進此答案）',
    commentsPlaceholder: '新增關於如何改進此答案的備註、具體要求、語氣偏好等。',
    keywords: '關鍵詞（逗號分隔）',
    keywordsPlaceholder: '價格、成本、多少錢',
    regenerate: '重新產生',
    regenerating: '重新產生中...',
    error: (error) => `錯誤：${error}`,
    failedToGenerateFaqs: '產生FAQ失敗。請重試。',

    knowledgeBaseBtn: '知識庫',
    deepAiResearch: '深度AI研究',
    researching: '研究中...',
    generate: '產生',
    selectService: '選擇服務...',
    selectKnowledgeFiles: '選擇知識庫檔案',
    selectAll: '全選',
    clearAll: '清除全部',
    noKnowledgeYet: '還沒有知識庫條目。',
    uploadInKnowledgeTab: '在知識庫選項卡中上傳檔案。',
    selectExpertSources: '選擇專家來源',
    researchAgain: '🔄 再次研究',
    editCannedMessage: '編輯預設訊息',
    deleteCannedMessage: '刪除此預設訊息？',
    id: 'ID',
    scenarioDescription: '場景描述',
    scenarioPlaceholder: '例如：使用者說「太貴了」',
    template: '範本',
    variables: '變數（逗號分隔）',
    variablesPlaceholder: 'userName, productName',
    variablesLabel: '變數',

    bookingManagement: '預約管理',
    manageAppointments: '管理預約',

    services: '服務',
    addService: '新增服務',
    manageServices: '管理服務',
    servicesDescription: '管理可供預約的服務',
    noServicesYet: '還沒有服務。點擊「新增服務」建立一個。',
    editService: '編輯服務',
    addNewService: '新增服務',
    serviceName: '服務名稱',
    serviceNamePlaceholder: '例如：經典面部護理、深層組織按摩',
    description: '描述',
    descriptionPlaceholder: '服務的簡要描述...',
    priceUsd: '價格（美元）',
    pricePlaceholder: '例如：89.99',
    pleaseFilldAll: '請填寫所有欄位',
    serviceDeleted: '服務已成功刪除',
    serviceSaved: '服務已成功儲存！',
    confirmDeleteService: (name) => `刪除服務「${name}」？`,

    staff: '員工',
    addStaffMember: '新增員工',
    staffDescription: '新增和管理預約的真實員工',
    noStaffYet: '還沒有員工。點擊「新增員工」建立一個。',
    editStaffMember: '編輯員工',
    addNewStaffMember: '新增員工',
    nameRequired: '姓名 *',
    namePlaceholder: '例如：張曉麗',
    emailOptional: '電子郵件（可選）',
    emailPlaceholder: 'sarah@example.com',
    staffTypeOptional: '員工類型（可選）',
    staffTypePlaceholder: '例如：治療師、美容師',
    email: '電子郵件',
    type: '類型',
    viewSchedule: '查看日程',
    pleaseEnterName: '請輸入姓名',
    staffMemberSaved: '員工已成功儲存！',
    confirmDeleteStaff: (name) => `刪除員工「${name}」？`,
    staffMemberDeleted: '員工已成功刪除',

    serviceAssignments: '服務分配',
    manageStaffAssignments: '管理員工分配',
    assignmentsDescription: '將員工分配給他們可以執行的服務',
    noAssignmentsYet: '還沒有分配。點擊「管理員工分配」建立一個。',
    assignStaffToService: '將員工分配給服務',
    service: '服務',
    staffMembers: (count) => `員工（已選擇${count}個）`,
    pleaseSelectService: '請選擇服務',
    pleaseSelectStaff: '請至少選擇一名員工',
    assignmentsSaved: '員工分配已成功更新！',
    saveAssignments: '儲存分配',

    outlets: '門市/位置',
    addOutlet: '新增門市',
    outletsDescription: '管理業務位置及其地址',
    noOutletsYet: '還沒有門市。點擊「新增門市」建立一個。',
    editOutlet: '編輯門市',
    addNewOutlet: '新增門市',
    outletNameRequired: '門市名稱 *',
    outletNamePlaceholder: '例如：市中心位置、主街沙龍',
    addressLine1Required: '地址行1 *',
    addressLine1Placeholder: '街道地址',
    addressLine2: '地址行2',
    addressLine2Placeholder: '公寓、套房、單元、建築、樓層等',
    cityRequired: '城市 *',
    cityPlaceholder: '城市',
    stateProvince: '州/省',
    statePlaceholder: '例如：CA、NY',
    postalCode: '郵遞區號',
    postalPlaceholder: 'ZIP/郵遞區號',
    country: '國家',
    countryPlaceholder: '國家',
    phone: '電話',
    phonePlaceholder: '+1 (555) 123-4567',
    emailLabel: '電子郵件',
    emailLocationPlaceholder: 'location@example.com',
    displayOrder: '顯示順序',
    displayOrderHelp: '數字越小在客戶選擇中越靠前',
    phoneDisplay: (phone) => `📞 ${phone}`,
    emailDisplay: (email) => `✉️ ${email}`,
    pleaseProvideRequired: '請填寫所有必填欄位（名稱、地址行1、城市）',
    outletCreated: '門市已成功建立',
    outletUpdated: '門市已成功更新',
    confirmDeleteOutlet: (name) => `刪除門市「${name}」？這也將刪除所有關聯的房間。`,
    outletDeleted: '門市已成功刪除',

    treatmentRooms: '治療室',
    addRoom: '新增房間',
    roomsDescription: '管理治療室和設施',
    noRoomsYet: '還沒有房間。點擊「新增房間」建立一個。',
    editRoom: '編輯房間',
    addNewRoom: '新增房間',
    outletLocation: '門市/位置',
    selectOutletOptional: '選擇門市（可選）',
    noOutletsAvailable: '沒有可用的門市。請先建立門市。',
    selectLocationHelp: '選擇此房間的位置',
    roomNumberRequired: '房間號 *',
    roomNumberPlaceholder: '例如：101、A1、套房1',
    roomNameOptional: '房間名稱（可選）',
    roomNamePlaceholder: '例如：豪華套房、放鬆室',
    pleaseEnterRoomNumber: '請輸入房間號',
    roomSaved: '房間已成功儲存！',
    room: (number) => `房間${number}`,
    roomDeleted: '房間已成功刪除',
    confirmDeleteRoom: (number) => `刪除房間${number}？`,
    manageServicesForRoom: (number) => `管理房間${number}的服務`,
    roomServicesDescription: '選擇可在此房間執行的服務。如果未選擇任何服務，此房間可以處理任何服務。',
    noServicesAvailable: '沒有可用的服務。請先建立服務。',
    manageServicesBtn: '管理服務',
    roomCanHandleAny: '房間現在可以處理任何服務',
    roomCanHandle: (count) => `房間現在可以處理${count}個服務`,
    saveServices: '儲存服務',
    servicesLabel: '服務',
    allServicesText: '所有服務（無限制）',
    locationDisplay: (outlet, city) => `📍 ${outlet} - ${city}`,
    roomServicesDisplay: (names) => `🔧 服務：${names}`,

    knowledgeEntries: '知識條目',
    trainingExamples: '訓練範例',
    activeTraining: '活躍訓練',

    aiModelSettings: 'AI模型設定',
    aiModelDescription: '設定用於聊天和訓練的AI模型。變更立即生效。',
    securityNote: '🔐 安全提示：API金鑰在伺服器上的.env.local檔案中設定。此介面僅允許您變更提供商和模型設定。',
    llmProvider: 'LLM提供商',
    providerAnthropic: 'Anthropic Claude',
    providerOllama: 'Ollama（本機）',
    providerOpenAI: 'OpenAI GPT',
    modelName: '模型名稱',
    modelPlaceholderAnthropic: 'claude-3-haiku-20240307',
    modelPlaceholderOllama: 'qwen2.5:7b',
    modelPlaceholderOpenAI: 'gpt-4',
    modelExamplesAnthropic: '範例：claude-3-haiku-20240307、claude-3-5-sonnet-20241022',
    modelExamplesOllama: '範例：qwen2.5:7b、llama3.1:8b、mistral:7b',
    modelExamplesOpenAI: '範例：gpt-4o（推薦）、gpt-4-turbo、gpt-4o-mini、gpt-4、gpt-3.5-turbo',
    ollamaBaseUrl: 'Ollama基礎URL',
    ollamaUrlPlaceholder: 'http://localhost:11434',
    ollamaHelp: '確保Ollama在本機執行。',
    temperature: (value) => `溫度：${value}`,
    temperatureHelp: '越低=越專注，越高=越有創意（推薦0.7）',
    saveSettings: '儲存設定',
    currentConfiguration: '目前設定',
    provider: '提供商',
    model: '模型',
    settingsSaved: 'LLM設定已成功儲存！變更將套用於新對話。\n\n注意：API金鑰保留在.env.local檔案中設定。',
    failedToSave: (error) => `儲存設定失敗：${error}`,
    errorSavingSettings: '儲存LLM設定時發生錯誤。請檢查您的設定。',

    areYouSure: '確定嗎？',
    actionCannotBeUndone: '此操作無法復原。',
    yes: '是',
    no: '否',

    aiStaffTrainingCenter: 'AI員工培訓中心',
    aiStaffTrainingDesc: '透過與AI客戶的自動對話，培訓您的AI員工',
    aiStaffMembers: 'AI員工列表',
    addStaff: '新增員工',
    aiCoachTrainingSession: 'AI教練培訓會話',
    complete: '完成',
    aiTrainingWillAppear: 'AI培訓對話將在此顯示',
    selectScenarioToBegin: '選擇下方情境開始培訓',
    trainingScenarios: '培訓情境',
    createScenario: '建立情境',
    scenarioName: '情境名稱',
    scenarioNamePlaceholder: '例如：處理價格異議',
    customerTypePlaceholder: '選擇客戶類型...',
    scenarioSituation: '情境狀況',
    scenarioSituationPlaceholder: '描述客戶情況...',
    trainingObjectives: '培訓目標',
    objectivesPlaceholder: '輸入目標，每行一個',
    difficulty: '難度',
    beginner: '初級',
    intermediate: '中級',
    advanced: '高級',
    timeLimit: '時間限制',
    minutes: '分鐘',
    startTraining: '開始培訓',
    provideCoachFeedback: '向教練提供回饋',
    feedbackPlaceholder: '輸入給AI教練的回饋...',
    submitFeedback: '提交回饋',
    customerMessage: '客戶',
    aiCoachResponse: 'AI教練',
    thinking: '思考中...',
    guidelinesCreated: '指南已建立！您可以在「培訓資料」標籤下的「培訓指南」中查看和編輯。',
    roleCoach: '顧問',
    roleSales: '銷售',
    roleSupport: '客服',
    roleScientist: '科學家',

    trainingScenariosFor: '培訓場景 -',
    coachRoleDesc: '練習以同理心教育和引導客戶',
    salesRoleDesc: '練習成交、處理異議和追加銷售',
    customerServiceRoleDesc: '練習解決問題並確保客戶滿意',
    scientistRoleDesc: '練習提供基於證據的技術解釋',
    allScenariosGenerated: '所有場景已產生',
    generate3MoreScenarios: '產生更多3個場景',
    scenario: '場景',
    successCriteria: '成功標準',
    startTrainingSession: '開始培訓會話',
    noScenariosYet: '暫無培訓場景。建立您的第一個場景開始吧！',
    createFirstScenario: '建立您的第一個場景',
    createCustomScenario: '建立自訂培訓場景',
    deleteScenario: '刪除場景',
    addNewStaff: '新增AI員工',
    staffName: '員工姓名',
    staffNamePlaceholder: '輸入員工姓名',
    selectRole: '選擇角色',

    aiCustomer: 'AI客戶',
    typeQuestionPlaceholder: '以客戶身份輸入您的問題...',
    autoBtn: '自動',
    feedbackBtn: '回饋',
    saveAsGuideline: '儲存為指南',
    trainingPurpose: '培訓目的',
    activeTrainingMemory: '活躍培訓記憶',
    feedbackItems: '條回饋',
    forCustomers: '客戶',

    trainingDataTitle: '培訓資料',
    newGuideline: '新指南',
    expand: '展開',
    collapse: '收合',
    created: '建立於',
    updated: '更新於',

    // Booking Dashboard
    bookingDashboard: '預約管理',
    scheduleFor: '的日程',
    viewingAppointmentsFor: '查看預約：',
    manageAppointmentsAvailability: '管理預約和可用時間',
    clearFilter: '清除篩選',
    today: '今天',
    groupBy: '分組方式：',
    staff: '員工',
    roomLabel: '房間',
    service: '服務',
    selectStaff: '選擇員工：',
    selectRooms: '選擇房間：',
    selectServices: '選擇服務：',
    previous: '← 上一頁',
    next: '下一頁 →',
    day: '日',
    week: '週',
    month: '月',
    allStatuses: '全部狀態',
    pending: '待確認',
    confirmed: '已確認',
    completed: '已完成',
    cancelled: '已取消',
    pendingEdit: '待修改',
    pendingCancellation: '待取消',
    blockedTime: '已封鎖時間',
    noSelectionMade: '未選擇',
    pleaseSelectStaff: '請至少選擇一名員工以查看其日程。',
    pleaseSelectRoom: '請至少選擇一個房間以查看其日程。',
    pleaseSelectService: '請至少選擇一項服務以查看其日程。',
    appointmentsThisWeek: '本週預約數',
    noAppointments: '暫無預約',
    client: '客戶',
    location: '位置',
    statusLabel: '狀態',
    appointments: '預約',
    noAppointmentsFound: '該時段暫無預約',
    email: '電子郵件',
    phone: '電話',
    notes: '備註',
    confirm: '確認',
    decline: '拒絕',
    blockTime: '封鎖時間',
    blockTimeDescription: '為假期、休息或個人時間封鎖特定時段',
    addBlockedTime: '新增封鎖時間',
    loadingAppointments: '載入預約中...',

    noStaffAssigned: '此預約未分配員工',
    appointmentConfirmed: '預約確認成功！',
    failedToConfirm: '確認預約失敗',
    provideDeclineReason: '請提供拒絕原因：',
    appointmentDeclined: '預約已拒絕',
    failedToDecline: '拒絕預約失敗',

    editAppointment: '編輯預約',
    currentDetails: '目前詳情',
    newDate: '新日期',
    startTime: '開始時間',
    endTime: '結束時間',
    assignedStaff: '指派員工',
    selectStaffOption: '選擇員工',
    treatmentRoom: '治療室',
    selectRoomOption: '選擇房間',
    reasonForChange: '修改原因 *',
    reasonForChangePlaceholder: '請說明需要修改此預約的原因...',
    editRequestNotice: '此請求將發送給您的經理審批，然後發送給客戶確認。',
    submitEditRequest: '提交修改請求',
    noChangesDetected: '未偵測到更改',
    provideChangeReason: '請提供修改原因',
    editRequestSubmitted: '修改請求已提交！等待經理審批。',
    failedToSubmitEdit: '提交修改請求失敗',

    cancelAppointment: '取消預約',
    appointmentToCancel: '待取消預約',
    reasonForCancellation: '取消原因 *',
    reasonForCancellationPlaceholder: '請說明需要取消此預約的原因...',
    cancellationNotice: '此取消請求將發送給您的經理審批，然後發送給客戶確認。預約在客戶確認取消前保持有效。',
    submitCancellationRequest: '提交取消請求',
    keepAppointment: '保留預約',
    provideCancellationReason: '請提供取消原因',
    cancellationRequestSubmitted: '取消請求已提交！等待經理審批。',
    failedToSubmitCancellation: '提交取消請求失敗',

    blockTimeTitle: '封鎖時間',
    startDate: '開始日期 *',
    endDate: '結束日期 *',
    reasonForBlocking: '封鎖原因 *',
    reasonForBlockingPlaceholder: '例如：休假、培訓、個人休息',
    recurringWeekly: '每週重複（相同時間）',
    blockTimeNotice: '在封鎖時間內，無法預約新的服務。現有預約不受影響。',
    blocking: '封鎖中...',
    selectDates: '請選擇開始和結束日期',
    provideBlockingReason: '請提供封鎖此時間的原因',
    endDateAfterStart: '結束日期必須晚於開始日期',
    successfullyBlocked: '成功封鎖',

    bookAppointment: '預約服務',
    bookingConfirmed: '預約成功！',
    selectAService: '選擇服務',
    noStaffAssignedToService: '此服務暫未分配員工，請聯繫客服。',
    changeService: '← 更換服務',
    selectedService: '已選服務',
    selectLocation: '選擇地點',
    changeLocation: '← 更換地點',
    selected: '已選',
    selectStaffMemberTitle: '選擇員工',
    noStaffAvailable: '此地點暫無可用員工',
    changeStaff: '← 更換員工',
    bookingDetails: '預約詳情',
    selectDateTime: '選擇日期和時間',
    continueToDetails: '繼續填寫詳情',
    changeDateTime: '← 更換日期/時間',
    bookingSummary: '預約摘要',
    phoneOptional: '電話（選填）',
    phonePlaceholder: '+886 912 345 678',
    specialRequestsOptional: '特殊要求（選填）',
    specialRequestsPlaceholder: '任何特殊要求或備註...',
    confirmBooking: '確認預約',
    bookingSuccessMessage: '您的預約已成功提交。',
    bookingConfirmationNotice: '您將很快收到確認通知。我們將為您的預約分配房間。',
    done: '完成',

    loadingAvailability: '載入可用時間...',
    errorLoadingSlots: '載入時段出錯：',
    tryAgain: '重試',
    noAppointmentsAvailable: '該日期暫無可用預約。',
    selectDifferentDate: '請選擇其他日期。',
    selectATime: '選擇時間',
    available: '可用',
    unavailable: '不可用',

    // Weekly Calendar Picker
    nextWeek: '下一週',
    selectedTime: '已選時間',
    hours: '小時',

    // Common
    minutes: '分鐘',
    at: '於',
    with: '與',
    date: '日期',
    time: '時間',
    status: '狀態',
    noAppointmentsForPeriod: '此時段暫無預約',
    edit: '編輯',
    cancel: '取消',
    manageAppointmentsAndAvailability: '管理預約和可用性',
    statusPending: '待確認',
    statusConfirmed: '已確認',
    statusCompleted: '已完成',
    statusCancelled: '已取消',
    statusPendingEdit: '待修改',
    statusPendingCancellation: '待取消',
    statusBlocked: '已封鎖',
    reasonPlaceholder: '請說明需要更改此預約的原因...',
    editRequestInfo: '此請求將發送給您的經理審批,然後發送給客戶確認。',
    submitting: '提交中...',
    cancellationPlaceholder: '請說明需要取消此預約的原因...',
    importantNotice: '重要通知',
    cancellationWarning: '此取消請求將發送給您的經理審批,然後發送給客戶確認。在客戶確認取消之前,預約將保持有效。',
    blockReasonPlaceholder: '例如:假期、培訓、個人休假',
    recurringOption: '重複(每週同一時間)',
    blockTimeInfo: '在此封鎖期間,無法預約新的預約。現有預約不受影響。',
    blockingTime: '封鎖時間中...',
    selectStaffMember: '選擇員工',
    noAssignedStaffAtLocation: '此地點暫無可用的指定員工',
    changeStaff: '更換員工',
    phoneNumberOptional: '電話號碼(可選)',
    specialRequestsPlaceholder: '任何特殊要求或備註...',
    booking: '預約中...',
    appointmentBookedSuccess: '您的預約已成功預訂。',
    confirmationNotificationMessage: '您將很快收到確認通知。我們會為您的預約分配房間。',

    industryKnowledge: '行業知識',
    landingPageTab: '著陸頁',
    imageLibrary: '圖片庫',
    conversations: '對話記錄',
    uploadDocumentsDesc: '上傳文件或擷取網站內容供AI員工學習',
    uploadDocument: '上傳文件',
    browseFiles: '瀏覽文件',
    supportedFileTypes: 'PDF、Word文件、產品手冊、培訓指南、常見問題等',
    landingPageEditor: '著陸頁編輯器',
    saving: '儲存中...',
    preview: '預覽',
    viewLive: '查看線上版',
    addBlock: '新增模組',
    publish: '發佈',
    publishedStatus: '已發佈',
    liveStatus: '上線中',
    loading: '載入中...',
    noLandingPageYet: '尚未設定著陸頁。建立一個來自訂客戶看到的內容。',
    createLandingPage: '建立著陸頁',
    splitBlock: '分欄',
    splitBlockDesc: '文字配圖片',
    cardBlock: '卡片',
    cardBlockDesc: '評價與評論網格',
    accordionBlock: '手風琴',
    accordionBlockDesc: '可展開的FAQ區域',
    pricingTableBlock: '價格表',
    pricingTableBlockDesc: '價格對比與折扣',
    testimonialsBlock: '客戶評價',
    testimonialsBlockDesc: '客戶評論輪播',
    textImageGridBlock: '文圖網格',
    textImageGridBlockDesc: '靈活的文字與圖片佈局',
    announcementBanner: '公告橫幅',
    rotatingAnnouncements: '輪播公告（5秒間隔）',
    translateBtn: '翻譯',
    menuBar: '選單列',
    menuBarDesc: 'Logo、導航連結和工具',
    heroBanner: '首屏橫幅',
    carouselWithSlides: (count: number) => `輪播共 ${count} 頁`,
    addSlide: '新增幻燈片',
    carouselSlides: '輪播幻燈片',
    horizontalScroll: '橫向捲動',
    logoSettings: 'Logo 設定',
    positionLabel: '位置',
    leftPosition: '左',
    centerPosition: '居中',
    logoText: 'Logo 文字',
    brandNamePlaceholder: '品牌名稱',
    logoImage: 'Logo 圖片',
    menuItemsLeft: '選單項目（左側）',
    rightSideUtilities: '右側工具',
    saveLandingPageFirst: '請先儲存著陸頁再發佈。',
    unpublish: '取消發佈',
    confirmUnpublish: '這將取消發佈著陸頁。確定繼續？',
    confirmPublish: '這將使著陸頁上線。確定繼續？',
    confirmUpdateLive: '這將用最新更改更新上線頁面。確定繼續？',
    updateLive: '更新上線',
    landingPageUnpublished: '著陸頁已取消發佈！',
    landingPageNowLive: '著陸頁已上線！',
    landingPageLiveUpdated: '上線頁面已更新為最新更改！',
    failedToUpdatePublish: '更新發佈狀態失敗',
    exitTranslationMode: '退出翻譯模式',
    enableTranslationMode: '啟用翻譯模式',
    copyUrl: '複製連結',
    remove: '移除',
    moveUp: '上移',
    moveDown: '下移',
    deleteSlide: '刪除幻燈片',
    afterAddClickSave: '新增後，點擊「儲存」來儲存',
    rememberClickSave: '記得點擊「儲存」來儲存更改',
    boldText: '粗體',
    italicText: '斜體',
    alignLeft: '靠左對齊',
    alignCenter: '置中對齊',
    alignRight: '靠右對齊',
    textColor: '文字顏色',
    bgColor: '背景顏色',
    removeFeature: '移除特性',
  },

  'vi': {
    aiStaff: 'Nhân viên AI',
    selectStaffMember: 'Chọn một nhân viên để trò chuyện',
    language: 'Ngôn ngữ',

    coach: 'cố vấn',
    sales: 'bán hàng',
    customerService: 'dịch vụ khách hàng',
    scientist: 'nhà khoa học',

    coachTasks: 'lời khuyên làm đẹp, tư vấn chăm sóc da và đề xuất cá nhân hóa',
    salesTasks: 'thông tin sản phẩm, giá cả, khuyến mãi và hỗ trợ mua hàng',
    customerServiceTasks: 'theo dõi đơn hàng, trả hàng, hỗ trợ kỹ thuật và các câu hỏi chung',
    scientistTasks: 'phân tích da nâng cao, thông tin thành phần và nghiên cứu khoa học',

    greeting: (name, emoji, tasks) => `Xin chào! Tôi là ${name} ${emoji} Tôi có thể giúp bạn với ${tasks}. Bạn muốn biết điều gì?`,

    aiTyping: 'AI đang nhập...',
    placeholder: 'Hỏi về sản phẩm, giá cả, hỗ trợ...',
    send: 'Gửi',
    close: 'Đóng',
    chatNow: 'Chat ngay',

    faqAbout: (category) => `Đây là các câu hỏi thường gặp về ${category}:`,
    noFaqAvailable: (category) => `Hiện tại tôi không có câu hỏi thường gặp cụ thể nào về ${category}, nhưng hãy thoải mái hỏi tôi bất cứ điều gì!`,

    loadingKnowledge: 'Đang tải cơ sở kiến thức...',
    welcomeTo: (name) => `Chào mừng đến với ${name}!`,
    clickToChat: 'Nhấp vào bất kỳ nút nào để trò chuyện với nhân viên AI được đào tạo của chúng tôi',
    noAiStaff: 'Không có nhân viên AI nào. Vui lòng đào tạo nhân viên AI trong bảng quản trị.',
    availableStaff: 'Nhân viên có sẵn:',

    // Pre-Chat Form
    welcome: 'Chào mừng! 👋',
    helpUsServeYou: 'Giúp chúng tôi phục vụ bạn tốt hơn bằng cách chia sẻ thông tin của bạn (tùy chọn)',
    yourName: 'Tên của bạn',
    yourNamePlaceholder: 'Nhập tên của bạn (tùy chọn)',
    yourEmail: 'Email của bạn',
    yourEmailPlaceholder: 'Nhập email của bạn (tùy chọn)',
    startChat: 'Bắt đầu trò chuyện',
    continueAsGuest: 'Tiếp tục với tư cách khách',
    chatSavedNotice: 'Bằng cách tiếp tục, cuộc trò chuyện của bạn sẽ được lưu vì mục đích chất lượng và tuân thủ',
    orSignInWith: 'hoặc đăng nhập với',

    adminTitle: 'AI Business Center',
    adminSubtitle: 'Đào tạo và quản lý trợ lý hỗ trợ khách hàng AI của bạn',
    viewLiveChat: 'Xem Trò Chuyện Trực Tiếp',
    profile: 'Hồ Sơ',
    personalProfile: 'Hồ Sơ Cá Nhân',
    companyProfile: 'Hồ Sơ Công Ty',
    businessUnit: 'Đơn Vị Kinh Doanh',
    knowledge: 'Kiến Thức',
    training: 'Đào Tạo',
    analytics: 'Phân Tích',
    roleplay: 'Nhập Vai',
    faq: 'Câu Hỏi Thường Gặp',
    cannedMessages: 'Tin Nhắn Mẫu',
    aiModel: 'Mô Hình AI',
    booking: 'Đặt Lịch',

    add: 'Thêm',
    edit: 'Sửa',
    delete: 'Xóa',
    save: 'Lưu',
    cancel: 'Hủy',
    update: 'Cập Nhật',
    create: 'Tạo Mới',
    search: 'Tìm Kiếm',

    active: 'Hoạt Động',
    inactive: 'Không Hoạt Động',
    status: 'Trạng Thái',

    addBusinessUnit: 'Thêm Đơn Vị Kinh Doanh',
    businessName: 'Tên Doanh Nghiệp',
    industry: 'Ngành',
    businessNamePlaceholder: 'ví dụ: AIA Bảo Hiểm, FitCoach, v.v.',
    industryPlaceholder: 'ví dụ: Bảo Hiểm, Thể Dục, v.v.',
    cannotDeleteDefault: 'Không thể xóa đơn vị kinh doanh SkinCoach mặc định',
    confirmDeleteBusinessUnit: 'Bạn có chắc muốn xóa đơn vị kinh doanh này? Tất cả dữ liệu liên quan sẽ bị xóa.',

    knowledgeBase: 'Cơ Sở Kiến Thức',
    searchEntries: 'Tìm kiếm mục...',
    uploadFiles: 'Tải Lên Tệp',
    uploadFilesTitle: 'Tải lên tệp: TXT, JSON, CSV, PDF, DOCX',
    addUrl: 'Thêm URL',
    addUrlTitle: 'Thêm nội dung từ URL (trang web, YouTube)',
    enterUrl: 'Nhập URL (trang web hoặc video YouTube)...',
    fetching: 'Đang tải...',
    urlSupportsText: 'Hỗ trợ: Trang web, video YouTube và mọi URL công khai',
    pleaseEnterUrl: 'Vui lòng nhập URL',
    pleaseAddKnowledgeFirst: 'Vui lòng thêm một số mục kiến thức trước',
    importSuccess: (count) => `Đã nhập thành công ${count} mục kiến thức!`,
    errorProcessingFile: (name) => `Lỗi khi xử lý tệp ${name}`,
    unsupportedFileType: (type) => `Loại tệp không được hỗ trợ: ${type}`,
    failedToFetchUrl: 'Không thể tải URL. Vui lòng kiểm tra URL và thử lại.',
    youtubeVideo: 'Video YouTube',
    webContent: 'Nội Dung Web',

    trainingGuidelines: 'Hướng Dẫn Đào Tạo',
    guidelinesDescription: 'Hướng dẫn kiểm soát hành vi AI trên các tính năng khác nhau:',
    addGuideline: 'Thêm Hướng Dẫn',
    noGuidelinesYet: 'Chưa có hướng dẫn đào tạo.',
    addGuidelinesHelp: 'Thêm hướng dẫn để giúp AI hiểu cách phản hồi chính xác.',
    editGuideline: 'Sửa Hướng Dẫn',
    deleteGuideline: 'Xóa hướng dẫn này?',
    category: 'Danh Mục',
    title: 'Tiêu Đề',
    content: 'Nội Dung',
    guidelineTitlePlaceholder: 'Tiêu đề hướng dẫn',
    guidelineContentPlaceholder: 'Nhập nội dung hướng dẫn tại đây...',
    categoryFaqLibrary: 'Thư Viện FAQ',
    categoryCannedMessages: 'Tin Nhắn Mẫu',
    categoryRoleplay: 'Đào Tạo Nhập Vai',
    categoryGeneral: 'Hướng Dẫn Chung',

    completedTrainingSessions: 'Phiên Đào Tạo Đã Hoàn Thành',
    noTrainingSessionsYet: 'Chưa có phiên đào tạo nào hoàn thành.',
    trainingSessionsHelp: 'Hoàn thành phiên đào tạo nhập vai để xem tại đây.',
    trainingSession: 'Phiên Đào Tạo',
    customer: 'Khách Hàng',
    score: 'Điểm',
    messages: 'Tin Nhắn',
    feedback: 'Phản Hồi',
    duration: 'Thời Lượng',
    min: 'phút',
    na: 'N/A',
    objectives: 'Mục Tiêu',

    priority: 'Ưu Tiên',
    question: 'Câu Hỏi',
    answer: 'Câu Trả Lời',
    variations: 'Biến Thể',

    aiTesting: 'Kiểm Tra AI',
    testQuery: 'Truy Vấn Thử',
    testQueryPlaceholder: 'Hỏi AI một câu hỏi...',
    testing: 'Đang kiểm tra...',
    testAiResponse: 'Kiểm Tra Phản Hồi AI',
    aiResponse: 'Phản Hồi AI',
    errorTestingAi: (error) => `Lỗi khi kiểm tra AI: ${error}`,

    faqLibrary: 'Thư Viện FAQ',
    generateFaq: 'Tạo FAQ',
    generateFaqTitle: 'Tạo 10 FAQ từ cơ sở kiến thức',
    generating: 'Đang tạo...',
    addCategory: 'Thêm Danh Mục',
    doubleClickToEdit: 'Nhấp đúp để sửa hoặc xóa',
    leaveBlankToDelete: 'Để trống để xóa',
    categoryNamePlaceholder: 'Tên danh mục...',
    editFaq: 'Sửa FAQ',
    deleteFaq: 'Xóa FAQ này?',
    comments: 'Ghi Chú',
    commentsNote: '(Cách cải thiện câu trả lời này)',
    commentsPlaceholder: 'Thêm ghi chú về cách cải thiện câu trả lời, yêu cầu cụ thể, sở thích về giọng điệu, v.v.',
    keywords: 'Từ Khóa (phân cách bằng dấu phẩy)',
    keywordsPlaceholder: 'giá, chi phí, bao nhiêu',
    regenerate: 'Tạo Lại',
    regenerating: 'Đang tạo lại...',
    error: (error) => `Lỗi: ${error}`,
    failedToGenerateFaqs: 'Không thể tạo FAQ. Vui lòng thử lại.',

    knowledgeBaseBtn: 'Cơ Sở Kiến Thức',
    deepAiResearch: 'Nghiên Cứu AI Sâu',
    researching: 'Đang nghiên cứu...',
    generate: 'Tạo',
    selectService: 'Chọn dịch vụ...',
    selectKnowledgeFiles: 'Chọn Tệp Cơ Sở Kiến Thức',
    selectAll: 'Chọn Tất Cả',
    clearAll: 'Xóa Tất Cả',
    noKnowledgeYet: 'Chưa có mục kiến thức nào.',
    uploadInKnowledgeTab: 'Tải lên tệp trong tab Cơ Sở Kiến Thức.',
    selectExpertSources: 'Chọn Nguồn Chuyên Gia',
    researchAgain: '🔄 Nghiên Cứu Lại',
    editCannedMessage: 'Sửa Tin Nhắn Mẫu',
    deleteCannedMessage: 'Xóa tin nhắn mẫu này?',
    id: 'ID',
    scenarioDescription: 'Mô Tả Kịch Bản',
    scenarioPlaceholder: 'ví dụ: Người dùng nói \'quá đắt\'',
    template: 'Mẫu',
    variables: 'Biến (phân cách bằng dấu phẩy)',
    variablesPlaceholder: 'userName, productName',
    variablesLabel: 'Biến',

    bookingManagement: 'Quản Lý Đặt Lịch',
    manageAppointments: 'Quản Lý Lịch Hẹn',

    services: 'Dịch Vụ',
    addService: 'Thêm Dịch Vụ',
    manageServices: 'Quản Lý Dịch Vụ',
    servicesDescription: 'Quản lý dịch vụ có thể đặt lịch',
    noServicesYet: 'Chưa có dịch vụ. Nhấp "Thêm Dịch Vụ" để tạo.',
    editService: 'Sửa Dịch Vụ',
    addNewService: 'Thêm Dịch Vụ Mới',
    serviceName: 'Tên Dịch Vụ',
    serviceNamePlaceholder: 'ví dụ: Chăm Sóc Da Cơ Bản, Massage Sâu',
    description: 'Mô Tả',
    descriptionPlaceholder: 'Mô tả ngắn về dịch vụ...',
    priceUsd: 'Giá (USD)',
    pricePlaceholder: 'ví dụ: 89.99',
    pleaseFilldAll: 'Vui lòng điền tất cả các trường',
    serviceDeleted: 'Đã xóa dịch vụ thành công',
    serviceSaved: 'Đã lưu dịch vụ thành công!',
    confirmDeleteService: (name) => `Xóa dịch vụ "${name}"?`,

    staff: 'Nhân Viên',
    addStaffMember: 'Thêm Nhân Viên',
    staffDescription: 'Thêm và quản lý nhân viên thực cho lịch hẹn',
    noStaffYet: 'Chưa có nhân viên. Nhấp "Thêm Nhân Viên" để tạo.',
    editStaffMember: 'Sửa Nhân Viên',
    addNewStaffMember: 'Thêm Nhân Viên Mới',
    nameRequired: 'Tên *',
    namePlaceholder: 'ví dụ: Nguyễn Văn A',
    emailOptional: 'Email (tùy chọn)',
    emailPlaceholder: 'email@example.com',
    staffTypeOptional: 'Loại Nhân Viên (tùy chọn)',
    staffTypePlaceholder: 'ví dụ: Chuyên Viên, Kỹ Thuật Viên',
    email: 'Email',
    type: 'Loại',
    viewSchedule: 'Xem lịch',
    pleaseEnterName: 'Vui lòng nhập tên',
    staffMemberSaved: 'Đã lưu nhân viên thành công!',
    confirmDeleteStaff: (name) => `Xóa nhân viên "${name}"?`,
    staffMemberDeleted: 'Đã xóa nhân viên thành công',

    serviceAssignments: 'Phân Công Dịch Vụ',
    manageStaffAssignments: 'Quản Lý Phân Công Nhân Viên',
    assignmentsDescription: 'Phân công nhân viên cho các dịch vụ họ có thể thực hiện',
    noAssignmentsYet: 'Chưa có phân công. Nhấp "Quản Lý Phân Công Nhân Viên" để tạo.',
    assignStaffToService: 'Phân Công Nhân Viên Cho Dịch Vụ',
    service: 'Dịch Vụ',
    staffMembers: (count) => `Nhân Viên (đã chọn ${count})`,
    pleaseSelectService: 'Vui lòng chọn dịch vụ',
    pleaseSelectStaff: 'Vui lòng chọn ít nhất một nhân viên',
    assignmentsSaved: 'Đã cập nhật phân công nhân viên thành công!',
    saveAssignments: 'Lưu Phân Công',

    outlets: 'Chi Nhánh / Địa Điểm',
    addOutlet: 'Thêm Chi Nhánh',
    outletsDescription: 'Quản lý địa điểm kinh doanh và địa chỉ',
    noOutletsYet: 'Chưa có chi nhánh. Nhấp "Thêm Chi Nhánh" để tạo.',
    editOutlet: 'Sửa Chi Nhánh',
    addNewOutlet: 'Thêm Chi Nhánh Mới',
    outletNameRequired: 'Tên Chi Nhánh *',
    outletNamePlaceholder: 'ví dụ: Chi Nhánh Trung Tâm, Salon Chính',
    addressLine1Required: 'Địa Chỉ Dòng 1 *',
    addressLine1Placeholder: 'Địa chỉ đường',
    addressLine2: 'Địa Chỉ Dòng 2',
    addressLine2Placeholder: 'Căn hộ, phòng, tầng, v.v.',
    cityRequired: 'Thành Phố *',
    cityPlaceholder: 'Thành phố',
    stateProvince: 'Tỉnh/Thành',
    statePlaceholder: 'ví dụ: TP.HCM, Hà Nội',
    postalCode: 'Mã Bưu Điện',
    postalPlaceholder: 'Mã bưu điện',
    country: 'Quốc Gia',
    countryPlaceholder: 'Quốc gia',
    phone: 'Điện Thoại',
    phonePlaceholder: '+84 123 456 789',
    emailLabel: 'Email',
    emailLocationPlaceholder: 'chinhanh@example.com',
    displayOrder: 'Thứ Tự Hiển Thị',
    displayOrderHelp: 'Số nhỏ hơn hiển thị trước trong lựa chọn của khách hàng',
    phoneDisplay: (phone) => `📞 ${phone}`,
    emailDisplay: (email) => `✉️ ${email}`,
    pleaseProvideRequired: 'Vui lòng điền tất cả các trường bắt buộc (Tên, Địa Chỉ Dòng 1, Thành Phố)',
    outletCreated: 'Đã tạo chi nhánh thành công',
    outletUpdated: 'Đã cập nhật chi nhánh thành công',
    confirmDeleteOutlet: (name) => `Xóa chi nhánh "${name}"? Điều này cũng sẽ xóa tất cả các phòng liên quan.`,
    outletDeleted: 'Đã xóa chi nhánh thành công',

    treatmentRooms: 'Phòng Điều Trị',
    addRoom: 'Thêm Phòng',
    roomsDescription: 'Quản lý phòng điều trị và cơ sở vật chất',
    noRoomsYet: 'Chưa có phòng. Nhấp "Thêm Phòng" để tạo.',
    editRoom: 'Sửa Phòng',
    addNewRoom: 'Thêm Phòng Mới',
    outletLocation: 'Chi Nhánh / Địa Điểm',
    selectOutletOptional: 'Chọn chi nhánh (tùy chọn)',
    noOutletsAvailable: 'Không có chi nhánh. Vui lòng tạo chi nhánh trước.',
    selectLocationHelp: 'Chọn địa điểm cho phòng này',
    roomNumberRequired: 'Số Phòng *',
    roomNumberPlaceholder: 'ví dụ: 101, A1, Suite 1',
    roomNameOptional: 'Tên Phòng (tùy chọn)',
    roomNamePlaceholder: 'ví dụ: Phòng VIP, Phòng Thư Giãn',
    pleaseEnterRoomNumber: 'Vui lòng nhập số phòng',
    roomSaved: 'Đã lưu phòng thành công!',
    room: (number) => `Phòng ${number}`,
    roomDeleted: 'Đã xóa phòng thành công',
    confirmDeleteRoom: (number) => `Xóa phòng ${number}?`,
    manageServicesForRoom: (number) => `Quản Lý Dịch Vụ Cho Phòng ${number}`,
    roomServicesDescription: 'Chọn dịch vụ có thể thực hiện trong phòng này. Nếu không chọn dịch vụ nào, phòng này có thể thực hiện bất kỳ dịch vụ nào.',
    noServicesAvailable: 'Không có dịch vụ. Vui lòng tạo dịch vụ trước.',
    manageServicesBtn: 'Quản Lý Dịch Vụ',
    roomCanHandleAny: 'Phòng có thể thực hiện bất kỳ dịch vụ nào',
    roomCanHandle: (count) => `Phòng có thể thực hiện ${count} dịch vụ`,
    saveServices: 'Lưu Dịch Vụ',
    servicesLabel: 'Dịch Vụ',
    allServicesText: 'Tất cả dịch vụ (không giới hạn)',
    locationDisplay: (outlet, city) => `📍 ${outlet} - ${city}`,
    roomServicesDisplay: (names) => `🔧 Dịch vụ: ${names}`,

    knowledgeEntries: 'Mục Kiến Thức',
    trainingExamples: 'Ví Dụ Đào Tạo',
    activeTraining: 'Đào Tạo Đang Hoạt Động',

    aiModelSettings: 'Cài Đặt Mô Hình AI',
    aiModelDescription: 'Cấu hình mô hình AI để sử dụng cho trò chuyện và đào tạo. Thay đổi có hiệu lực ngay.',
    securityNote: '🔐 Lưu Ý Bảo Mật: Khóa API được cấu hình trong tệp .env.local trên máy chủ. Giao diện này chỉ cho phép bạn thay đổi cài đặt nhà cung cấp và mô hình.',
    llmProvider: 'Nhà Cung Cấp LLM',
    providerAnthropic: 'Anthropic Claude',
    providerOllama: 'Ollama (Cục Bộ)',
    providerOpenAI: 'OpenAI GPT',
    modelName: 'Tên Mô Hình',
    modelPlaceholderAnthropic: 'claude-3-haiku-20240307',
    modelPlaceholderOllama: 'qwen2.5:7b',
    modelPlaceholderOpenAI: 'gpt-4',
    modelExamplesAnthropic: 'Ví dụ: claude-3-haiku-20240307, claude-3-5-sonnet-20241022',
    modelExamplesOllama: 'Ví dụ: qwen2.5:7b, llama3.1:8b, mistral:7b',
    modelExamplesOpenAI: 'Ví dụ: gpt-4o (khuyến nghị), gpt-4-turbo, gpt-4o-mini, gpt-4, gpt-3.5-turbo',
    ollamaBaseUrl: 'URL Cơ Sở Ollama',
    ollamaUrlPlaceholder: 'http://localhost:11434',
    ollamaHelp: 'Đảm bảo Ollama đang chạy cục bộ.',
    temperature: (value) => `Nhiệt Độ: ${value}`,
    temperatureHelp: 'Thấp hơn = tập trung hơn, Cao hơn = sáng tạo hơn (khuyến nghị 0.7)',
    saveSettings: 'Lưu Cài Đặt',
    currentConfiguration: 'Cấu Hình Hiện Tại',
    provider: 'Nhà Cung Cấp',
    model: 'Mô Hình',
    settingsSaved: 'Đã lưu cài đặt LLM thành công! Thay đổi sẽ áp dụng cho các cuộc trò chuyện mới.\n\nLưu ý: Khóa API vẫn được cấu hình trong tệp .env.local.',
    failedToSave: (error) => `Không thể lưu cài đặt: ${error}`,
    errorSavingSettings: 'Lỗi khi lưu cài đặt LLM. Vui lòng kiểm tra cấu hình của bạn.',

    areYouSure: 'Bạn có chắc không?',
    actionCannotBeUndone: 'Hành động này không thể hoàn tác.',
    yes: 'Có',
    no: 'Không',

    aiStaffTrainingCenter: 'Trung Tâm Đào Tạo Nhân Viên AI',
    aiStaffTrainingDesc: 'Đào tạo nhân viên AI của bạn với các vai trò khác nhau thông qua đối thoại tự động với khách hàng AI',
    aiStaffMembers: 'Danh Sách Nhân Viên AI',
    addStaff: 'Thêm Nhân Viên',
    aiCoachTrainingSession: 'Phiên Đào Tạo AI Coach',
    complete: 'Hoàn Thành',
    aiTrainingWillAppear: 'Cuộc trò chuyện đào tạo AI sẽ xuất hiện ở đây',
    selectScenarioToBegin: 'Chọn kịch bản bên dưới để bắt đầu đào tạo',
    trainingScenarios: 'Kịch Bản Đào Tạo',
    createScenario: 'Tạo Kịch Bản',
    scenarioName: 'Tên Kịch Bản',
    scenarioNamePlaceholder: 'ví dụ: Xử Lý Phản Đối Giá',
    customerTypePlaceholder: 'Chọn loại khách hàng...',
    scenarioSituation: 'Tình Huống Kịch Bản',
    scenarioSituationPlaceholder: 'Mô tả tình huống khách hàng...',
    trainingObjectives: 'Mục Tiêu Đào Tạo',
    objectivesPlaceholder: 'Nhập mục tiêu, mỗi dòng một mục',
    difficulty: 'Độ Khó',
    beginner: 'Cơ Bản',
    intermediate: 'Trung Cấp',
    advanced: 'Nâng Cao',
    timeLimit: 'Giới Hạn Thời Gian',
    minutes: 'phút',
    startTraining: 'Bắt Đầu Đào Tạo',
    provideCoachFeedback: 'Cung cấp phản hồi cho huấn luyện viên',
    feedbackPlaceholder: 'Nhập phản hồi cho AI coach...',
    submitFeedback: 'Gửi Phản Hồi',
    customerMessage: 'Khách Hàng',
    aiCoachResponse: 'AI Coach',
    thinking: 'Đang suy nghĩ...',
    guidelinesCreated: 'Đã tạo hướng dẫn! Bạn có thể xem và chỉnh sửa trong tab "Dữ Liệu Đào Tạo" dưới mục "Hướng Dẫn Đào Tạo".',
    roleCoach: 'Cố Vấn',
    roleSales: 'Bán Hàng',
    roleSupport: 'Hỗ Trợ',
    roleScientist: 'Nhà Khoa Học',

    trainingScenariosFor: 'Kịch Bản Đào Tạo cho',
    coachRoleDesc: 'Thực hành giáo dục và hướng dẫn khách hàng với sự đồng cảm',
    salesRoleDesc: 'Thực hành chốt đơn, xử lý phản đối và bán thêm',
    customerServiceRoleDesc: 'Thực hành giải quyết vấn đề và đảm bảo sự hài lòng của khách hàng',
    scientistRoleDesc: 'Thực hành cung cấp giải thích kỹ thuật dựa trên bằng chứng',
    allScenariosGenerated: 'Đã Tạo Tất Cả Kịch Bản',
    generate3MoreScenarios: 'Tạo Thêm 3 Kịch Bản',
    scenario: 'Kịch Bản',
    successCriteria: 'Tiêu Chí Thành Công',
    startTrainingSession: 'Bắt Đầu Phiên Đào Tạo',
    noScenariosYet: 'Chưa có kịch bản đào tạo. Tạo kịch bản đầu tiên của bạn để bắt đầu!',
    createFirstScenario: 'Tạo Kịch Bản Đầu Tiên',
    createCustomScenario: 'Tạo Kịch Bản Đào Tạo Tùy Chỉnh',
    deleteScenario: 'Xóa Kịch Bản',
    addNewStaff: 'Thêm Nhân Viên AI Mới',
    staffName: 'Tên Nhân Viên',
    staffNamePlaceholder: 'Nhập tên nhân viên',
    selectRole: 'Chọn Vai Trò',

    aiCustomer: 'Khách Hàng AI',
    typeQuestionPlaceholder: 'Nhập câu hỏi với tư cách khách hàng...',
    autoBtn: 'Tự Động',
    feedbackBtn: 'Phản Hồi',
    saveAsGuideline: 'Lưu Làm Hướng Dẫn',
    trainingPurpose: 'Mục Đích Đào Tạo',
    activeTrainingMemory: 'Bộ Nhớ Đào Tạo Đang Hoạt Động',
    feedbackItems: 'mục phản hồi',
    forCustomers: 'khách hàng',

    trainingDataTitle: 'Dữ Liệu Đào Tạo',
    newGuideline: 'Hướng Dẫn Mới',
    expand: 'Mở Rộng',
    collapse: 'Thu Gọn',
    created: 'Tạo Lúc',
    updated: 'Cập Nhật',

    // Booking Dashboard
    bookingDashboard: 'Quản Lý Đặt Lịch',
    scheduleFor: ' - Lịch Trình',
    viewingAppointmentsFor: 'Xem lịch hẹn của',
    manageAppointmentsAvailability: 'Quản lý lịch hẹn và thời gian rảnh',
    clearFilter: 'Xóa Bộ Lọc',
    today: 'Hôm Nay',
    groupBy: 'Nhóm theo:',
    staff: 'Nhân Viên',
    roomLabel: 'Phòng',
    service: 'Dịch Vụ',
    selectStaff: 'Chọn Nhân Viên:',
    selectRooms: 'Chọn Phòng:',
    selectServices: 'Chọn Dịch Vụ:',
    previous: '← Trước',
    next: 'Sau →',
    day: 'Ngày',
    week: 'Tuần',
    month: 'Tháng',
    allStatuses: 'Tất Cả Trạng Thái',
    pending: 'Chờ Xác Nhận',
    confirmed: 'Đã Xác Nhận',
    completed: 'Hoàn Thành',
    cancelled: 'Đã Hủy',
    pendingEdit: 'Chờ Chỉnh Sửa',
    pendingCancellation: 'Chờ Hủy',
    blockedTime: 'Thời Gian Bị Khóa',
    noSelectionMade: 'Chưa Chọn',
    pleaseSelectStaff: 'Vui lòng chọn ít nhất một nhân viên để xem lịch trình.',
    pleaseSelectRoom: 'Vui lòng chọn ít nhất một phòng để xem lịch trình.',
    pleaseSelectService: 'Vui lòng chọn ít nhất một dịch vụ để xem lịch trình.',
    appointmentsThisWeek: 'lịch hẹn tuần này',
    noAppointments: 'Không có lịch hẹn',
    client: 'Khách Hàng',
    location: 'Địa Điểm',
    statusLabel: 'Trạng Thái',
    appointments: 'Lịch Hẹn',
    noAppointmentsFound: 'Không tìm thấy lịch hẹn trong khoảng thời gian này',
    email: 'Email',
    phone: 'Điện Thoại',
    notes: 'Ghi Chú',
    confirm: 'Xác Nhận',
    decline: 'Từ Chối',
    blockTime: 'Khóa Thời Gian',
    blockTimeDescription: 'Khóa các khung giờ cụ thể cho kỳ nghỉ, giải lao hoặc thời gian cá nhân',
    addBlockedTime: 'Thêm Thời Gian Khóa',
    loadingAppointments: 'Đang tải lịch hẹn...',

    noStaffAssigned: 'Lịch hẹn này chưa được phân công nhân viên',
    appointmentConfirmed: 'Xác nhận lịch hẹn thành công!',
    failedToConfirm: 'Không thể xác nhận lịch hẹn',
    provideDeclineReason: 'Vui lòng cung cấp lý do từ chối:',
    appointmentDeclined: 'Lịch hẹn đã bị từ chối',
    failedToDecline: 'Không thể từ chối lịch hẹn',

    editAppointment: 'Chỉnh Sửa Lịch Hẹn',
    currentDetails: 'Chi Tiết Hiện Tại',
    newDate: 'Ngày Mới',
    startTime: 'Giờ Bắt Đầu',
    endTime: 'Giờ Kết Thúc',
    assignedStaff: 'Nhân Viên Phụ Trách',
    selectStaffOption: 'Chọn Nhân Viên',
    treatmentRoom: 'Phòng Điều Trị',
    selectRoomOption: 'Chọn Phòng',
    reasonForChange: 'Lý Do Thay Đổi *',
    reasonForChangePlaceholder: 'Vui lòng giải thích tại sao cần thay đổi lịch hẹn này...',
    editRequestNotice: 'Yêu cầu này sẽ được gửi đến quản lý để phê duyệt, sau đó gửi đến khách hàng để xác nhận.',
    submitEditRequest: 'Gửi Yêu Cầu Chỉnh Sửa',
    noChangesDetected: 'Không phát hiện thay đổi',
    provideChangeReason: 'Vui lòng cung cấp lý do thay đổi',
    editRequestSubmitted: 'Yêu cầu chỉnh sửa đã được gửi! Đang chờ quản lý phê duyệt.',
    failedToSubmitEdit: 'Không thể gửi yêu cầu chỉnh sửa',

    cancelAppointment: 'Hủy Lịch Hẹn',
    appointmentToCancel: 'Lịch Hẹn Cần Hủy',
    reasonForCancellation: 'Lý Do Hủy *',
    reasonForCancellationPlaceholder: 'Vui lòng giải thích tại sao cần hủy lịch hẹn này...',
    cancellationNotice: 'Yêu cầu hủy này sẽ được gửi đến quản lý để phê duyệt, sau đó gửi đến khách hàng để xác nhận. Lịch hẹn vẫn hoạt động cho đến khi khách hàng xác nhận hủy.',
    submitCancellationRequest: 'Gửi Yêu Cầu Hủy',
    keepAppointment: 'Giữ Lịch Hẹn',
    provideCancellationReason: 'Vui lòng cung cấp lý do hủy',
    cancellationRequestSubmitted: 'Yêu cầu hủy đã được gửi! Đang chờ quản lý phê duyệt.',
    failedToSubmitCancellation: 'Không thể gửi yêu cầu hủy',

    blockTimeTitle: 'Khóa Thời Gian',
    startDate: 'Ngày Bắt Đầu *',
    endDate: 'Ngày Kết Thúc *',
    reasonForBlocking: 'Lý Do Khóa *',
    reasonForBlockingPlaceholder: 'Ví dụ: Nghỉ phép, Đào tạo, Nghỉ cá nhân',
    recurringWeekly: 'Lặp lại hàng tuần (cùng giờ)',
    blockTimeNotice: 'Trong thời gian bị khóa, không thể đặt lịch hẹn mới. Các lịch hẹn hiện có không bị ảnh hưởng.',
    blocking: 'Đang khóa...',
    selectDates: 'Vui lòng chọn ngày bắt đầu và kết thúc',
    provideBlockingReason: 'Vui lòng cung cấp lý do khóa thời gian này',
    endDateAfterStart: 'Ngày kết thúc phải sau ngày bắt đầu',
    successfullyBlocked: 'Đã khóa thành công',

    bookAppointment: 'Đặt Lịch Hẹn',
    bookingConfirmed: 'Đặt Lịch Thành Công!',
    selectAService: 'Chọn Dịch Vụ',
    noStaffAssignedToService: 'Dịch vụ này chưa có nhân viên phụ trách. Vui lòng liên hệ hỗ trợ.',
    changeService: '← Đổi Dịch Vụ',
    selectedService: 'Dịch Vụ Đã Chọn',
    selectLocation: 'Chọn Địa Điểm',
    changeLocation: '← Đổi Địa Điểm',
    selected: 'Đã Chọn',
    selectStaffMemberTitle: 'Chọn Nhân Viên',
    noStaffAvailable: 'Không có nhân viên khả dụng tại địa điểm này',
    changeStaff: '← Đổi Nhân Viên',
    bookingDetails: 'Chi Tiết Đặt Lịch',
    selectDateTime: 'Chọn Ngày & Giờ',
    continueToDetails: 'Tiếp Tục Điền Chi Tiết',
    changeDateTime: '← Đổi Ngày/Giờ',
    bookingSummary: 'Tóm Tắt Đặt Lịch',
    phoneOptional: 'Số Điện Thoại (Tùy Chọn)',
    phonePlaceholder: '+84 912 345 678',
    specialRequestsOptional: 'Yêu Cầu Đặc Biệt (Tùy Chọn)',
    specialRequestsPlaceholder: 'Bất kỳ yêu cầu đặc biệt hoặc ghi chú nào...',
    confirmBooking: 'Xác Nhận Đặt Lịch',
    bookingSuccessMessage: 'Lịch hẹn của bạn đã được đặt thành công.',
    bookingConfirmationNotice: 'Bạn sẽ sớm nhận được thông báo xác nhận. Phòng sẽ được phân bổ cho lịch hẹn của bạn.',
    done: 'Hoàn Tất',

    loadingAvailability: 'Đang tải thời gian rảnh...',
    errorLoadingSlots: 'Lỗi khi tải khung giờ:',
    tryAgain: 'Thử Lại',
    noAppointmentsAvailable: 'Không có lịch hẹn khả dụng vào ngày này.',
    selectDifferentDate: 'Vui lòng chọn ngày khác.',
    selectATime: 'Chọn Giờ',
    available: 'Khả Dụng',
    unavailable: 'Không Khả Dụng',

    // Weekly Calendar Picker
    nextWeek: 'Tuần Sau',
    selectedTime: 'Thời Gian Đã Chọn',
    hours: 'giờ',

    // Common
    minutes: 'phút',
    at: 'tại',
    with: 'với',
    date: 'Ngày',
    time: 'Giờ',
    status: 'Trạng Thái',
    noAppointmentsForPeriod: 'Không tìm thấy lịch hẹn trong thời gian này',
    edit: 'Sửa',
    cancel: 'Hủy',
    manageAppointmentsAndAvailability: 'Quản lý lịch hẹn và lịch trống',
    statusPending: 'Đang Chờ',
    statusConfirmed: 'Đã Xác Nhận',
    statusCompleted: 'Hoàn Thành',
    statusCancelled: 'Đã Hủy',
    statusPendingEdit: 'Đang Chờ Sửa',
    statusPendingCancellation: 'Đang Chờ Hủy',
    statusBlocked: 'Thời Gian Bị Chặn',
    reasonPlaceholder: 'Vui lòng giải thích lý do cần thay đổi lịch hẹn này...',
    editRequestInfo: 'Yêu cầu này sẽ được gửi đến quản lý của bạn để phê duyệt, sau đó gửi đến khách hàng để xác nhận.',
    submitting: 'Đang Gửi...',
    cancellationPlaceholder: 'Vui lòng giải thích lý do cần hủy lịch hẹn này...',
    importantNotice: 'Thông Báo Quan Trọng',
    cancellationWarning: 'Yêu cầu hủy này sẽ được gửi đến quản lý của bạn để phê duyệt, sau đó gửi đến khách hàng để xác nhận. Lịch hẹn sẽ vẫn hoạt động cho đến khi khách hàng xác nhận hủy.',
    blockReasonPlaceholder: 'Ví dụ: Nghỉ phép, Đào tạo, Nghỉ cá nhân',
    recurringOption: 'Lặp lại (cùng giờ mỗi tuần)',
    blockTimeInfo: 'Trong thời gian bị chặn này, không thể đặt lịch hẹn mới. Các lịch hẹn hiện tại không bị ảnh hưởng.',
    blockingTime: 'Đang Chặn Thời Gian...',
    selectStaffMember: 'Chọn Nhân Viên',
    noAssignedStaffAtLocation: 'Không có nhân viên được phân công tại địa điểm này',
    changeStaff: 'Đổi Nhân Viên',
    phoneNumberOptional: 'Số Điện Thoại (Tùy Chọn)',
    specialRequestsPlaceholder: 'Bất kỳ yêu cầu đặc biệt hoặc ghi chú nào...',
    booking: 'Đang Đặt...',
    appointmentBookedSuccess: 'Lịch hẹn của bạn đã được đặt thành công.',
    confirmationNotificationMessage: 'Bạn sẽ sớm nhận được thông báo xác nhận. Phòng sẽ được phân bổ cho lịch hẹn của bạn.',

    industryKnowledge: 'Kiến Thức Ngành',
    landingPageTab: 'Trang Đích',
    imageLibrary: 'Thư Viện Hình Ảnh',
    conversations: 'Cuộc Hội Thoại',
    uploadDocumentsDesc: 'Tải lên tài liệu hoặc thu thập nội dung web để AI nhân viên học hỏi',
    uploadDocument: 'Tải Lên Tài Liệu',
    browseFiles: 'Duyệt Tệp',
    supportedFileTypes: 'PDF, Word, sổ tay sản phẩm, hướng dẫn đào tạo, FAQ, v.v.',
    landingPageEditor: 'Trình Biên Tập Trang Đích',
    saving: 'Đang lưu...',
    preview: 'Xem Trước',
    viewLive: 'Xem Trực Tuyến',
    addBlock: 'Thêm Khối',
    publish: 'Xuất Bản',
    publishedStatus: 'Đã Xuất Bản',
    liveStatus: 'Đang Hoạt Động',
    loading: 'Đang tải...',
    noLandingPageYet: 'Chưa có trang đích nào. Tạo một trang để tùy chỉnh nội dung khách hàng thấy.',
    createLandingPage: 'Tạo Trang Đích',
    splitBlock: 'Chia Đôi',
    splitBlockDesc: 'Văn bản bên cạnh hình ảnh',
    cardBlock: 'Thẻ',
    cardBlockDesc: 'Lưới đánh giá & nhận xét',
    accordionBlock: 'Accordion',
    accordionBlockDesc: 'Mục FAQ có thể mở rộng',
    pricingTableBlock: 'Bảng Giá',
    pricingTableBlockDesc: 'So sánh giá với giảm giá',
    testimonialsBlock: 'Nhận Xét',
    testimonialsBlockDesc: 'Băng chuyền đánh giá khách hàng',
    textImageGridBlock: 'Lưới Văn Bản/Hình Ảnh',
    textImageGridBlockDesc: 'Bố cục văn bản & hình ảnh linh hoạt',
    announcementBanner: 'Biểu Ngữ Thông Báo',
    rotatingAnnouncements: 'Thông báo xoay vòng (5 giây)',
    translateBtn: 'Dịch',
    menuBar: 'Thanh Menu',
    menuBarDesc: 'Logo, liên kết điều hướng & tiện ích',
    heroBanner: 'Biểu Ngữ Chính',
    carouselWithSlides: (count: number) => `Băng chuyền với ${count} trang`,
    addSlide: 'Thêm Slide',
    carouselSlides: 'Slide Băng Chuyền',
    horizontalScroll: 'Cuộn Ngang',
    logoSettings: 'Cài Đặt Logo',
    positionLabel: 'Vị Trí',
    leftPosition: 'Trái',
    centerPosition: 'Giữa',
    logoText: 'Văn Bản Logo',
    brandNamePlaceholder: 'Tên Thương Hiệu',
    logoImage: 'Hình Ảnh Logo',
    menuItemsLeft: 'Mục Menu (Bên Trái)',
    rightSideUtilities: 'Tiện Ích Bên Phải',
    saveLandingPageFirst: 'Vui lòng lưu trang đích trước khi xuất bản.',
    unpublish: 'Hủy Xuất Bản',
    confirmUnpublish: 'Thao tác này sẽ hủy xuất bản trang đích. Tiếp tục?',
    confirmPublish: 'Thao tác này sẽ đưa trang đích lên trực tuyến. Tiếp tục?',
    confirmUpdateLive: 'Thao tác này sẽ cập nhật trang trực tuyến với các thay đổi mới nhất. Tiếp tục?',
    updateLive: 'Cập Nhật Trực Tuyến',
    landingPageUnpublished: 'Trang đích đã hủy xuất bản!',
    landingPageNowLive: 'Trang đích đã lên trực tuyến!',
    landingPageLiveUpdated: 'Trang trực tuyến đã được cập nhật!',
    failedToUpdatePublish: 'Không thể cập nhật trạng thái xuất bản',
    exitTranslationMode: 'Thoát Chế Độ Dịch',
    enableTranslationMode: 'Bật Chế Độ Dịch',
    copyUrl: 'Sao Chép Liên Kết',
    remove: 'Xóa',
    moveUp: 'Di chuyển lên',
    moveDown: 'Di chuyển xuống',
    deleteSlide: 'Xóa slide',
    afterAddClickSave: 'Sau khi thêm, nhấn "Lưu" để lưu',
    rememberClickSave: 'Nhớ nhấn "Lưu" để lưu thay đổi',
    boldText: 'Đậm',
    italicText: 'Nghiêng',
    alignLeft: 'Căn Trái',
    alignCenter: 'Căn Giữa',
    alignRight: 'Căn Phải',
    textColor: 'Màu chữ',
    bgColor: 'Màu nền',
    removeFeature: 'Xóa tính năng',
  }
}

export function getTranslation(lang: Language): Translations {
  return translations[lang] || translations['en']
}

export const languageNames: Record<Language, string> = {
  'en': 'English',
  'zh-CN': '简体中文',
  'zh-TW': '繁體中文',
  'vi': 'Tiếng Việt'
}

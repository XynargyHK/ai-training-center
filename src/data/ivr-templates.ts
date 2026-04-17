/**
 * IVR Industry Templates — pre-built menu trees that users can
 * one-click import into their BU. Stored as code, inserted into
 * ivr_menus table on import. No hardcoding per-BU — templates are
 * generic and adapt to whatever BU the user selects.
 */

export interface IvrTemplateNode {
  label: string
  description?: string
  action: string
  payload?: Record<string, any>
  children?: IvrTemplateNode[]
}

export interface IvrTemplate {
  id: string
  name: string
  industry: string
  icon: string
  description: string
  tree: IvrTemplateNode
}

export const ivrTemplates: IvrTemplate[] = [
  {
    id: 'spa-salon',
    name: 'Spa & Salon',
    industry: 'Beauty & Wellness',
    icon: '💆',
    description: 'Booking, services, prices, gift cards, AI coaching',
    tree: {
      label: 'Main Menu',
      action: 'sub_menu',
      payload: { greeting: "Hi! Welcome. I'm your AI assistant. How can I help you today?" },
      children: [
        { label: '📅 Book an appointment', action: 'ai_chat', payload: { prompt: 'I want to book an appointment' } },
        { label: '💆 Browse services & prices', action: 'ai_chat', payload: { prompt: 'What services do you offer and what are the prices?' } },
        { label: '🎁 Gift cards', action: 'ai_chat', payload: { prompt: 'I want to buy a gift card' } },
        { label: '📍 Location & hours', action: 'ai_chat', payload: { prompt: 'Where are you located and what are your opening hours?' } },
        { label: '💬 Chat with AI coach', action: 'ai_chat' },
        { label: '🎤 Voice call with AI', action: 'voice_ai', payload: { url: 'https://www.aistaffs.app/voice5922922en' } },
        { label: '📞 Phone call back', action: 'phone_call' },
      ],
    },
  },
  {
    id: 'medical-clinic',
    name: 'Medical Clinic',
    industry: 'Healthcare',
    icon: '🏥',
    description: 'Appointments, test results, prescriptions, insurance, urgent care',
    tree: {
      label: 'Main Menu',
      action: 'sub_menu',
      payload: { greeting: "Thank you for contacting us. How can we help you today?" },
      children: [
        { label: '📅 Schedule appointment', action: 'ai_chat', payload: { prompt: 'I need to schedule an appointment' } },
        { label: '📋 Check test results', action: 'ai_chat', payload: { prompt: 'I want to check my test results' } },
        { label: '💊 Prescription refill', action: 'ai_chat', payload: { prompt: 'I need a prescription refill' } },
        { label: '🏥 Urgent care info', action: 'ai_chat', payload: { prompt: 'I need urgent care, what should I do?' } },
        { label: '💳 Insurance & billing', action: 'ai_chat', payload: { prompt: 'I have a question about insurance or billing' } },
        { label: '👤 Talk to staff', action: 'transfer_human', payload: { message: 'Connecting you with our team. Please hold.' } },
        { label: '📞 Request callback', action: 'phone_call' },
      ],
    },
  },
  {
    id: 'restaurant',
    name: 'Restaurant & F&B',
    industry: 'Food & Beverage',
    icon: '🍽️',
    description: 'Reservations, menu, hours, catering, delivery status',
    tree: {
      label: 'Main Menu',
      action: 'sub_menu',
      payload: { greeting: "Welcome! How can we serve you today?" },
      children: [
        { label: '📅 Make a reservation', action: 'ai_chat', payload: { prompt: 'I want to make a reservation' } },
        { label: '📖 View menu & specials', action: 'ai_chat', payload: { prompt: 'What is on your menu? Any specials today?' } },
        { label: '🕐 Hours & location', action: 'ai_chat', payload: { prompt: 'What are your opening hours and where are you located?' } },
        { label: '🍱 Catering inquiry', action: 'ai_chat', payload: { prompt: 'I need catering for an event' } },
        { label: '🚗 Delivery status', action: 'ai_chat', payload: { prompt: 'I want to check my delivery order status' } },
        { label: '👤 Speak to manager', action: 'transfer_human', payload: { message: 'Connecting you with the manager.' } },
      ],
    },
  },
  {
    id: 'ecommerce',
    name: 'E-commerce & Retail',
    industry: 'Retail',
    icon: '🛒',
    description: 'Order tracking, returns, product info, sales support',
    tree: {
      label: 'Main Menu',
      action: 'sub_menu',
      payload: { greeting: "Hi! Welcome to our store. How can I help?" },
      children: [
        { label: '📦 Track my order', action: 'ai_chat', payload: { prompt: 'I want to track my order' } },
        { label: '🔄 Returns & exchanges', action: 'ai_chat', payload: { prompt: 'I want to return or exchange a product' } },
        { label: '🛍️ Browse products', action: 'send_link', payload: { url: '' } },
        { label: '💬 Product questions', action: 'ai_chat', payload: { prompt: 'I have a question about a product' } },
        { label: '💰 Current promotions', action: 'ai_chat', payload: { prompt: 'What promotions or discounts are available?' } },
        { label: '🎤 Voice AI assistant', action: 'voice_ai', payload: { url: 'https://www.aistaffs.app/voice5922922en' } },
        { label: '👤 Talk to sales team', action: 'transfer_human', payload: { message: 'Connecting you with sales.' } },
      ],
    },
  },
  {
    id: 'real-estate',
    name: 'Real Estate',
    industry: 'Property',
    icon: '🏠',
    description: 'Property viewings, listings, mortgage, agent callback',
    tree: {
      label: 'Main Menu',
      action: 'sub_menu',
      payload: { greeting: "Welcome! Looking for your dream property? Let me help." },
      children: [
        { label: '🏠 Browse listings', action: 'ai_chat', payload: { prompt: 'Show me available property listings' } },
        { label: '📅 Schedule a viewing', action: 'ai_chat', payload: { prompt: 'I want to schedule a property viewing' } },
        { label: '💰 Mortgage calculator', action: 'ai_chat', payload: { prompt: 'Help me calculate mortgage payments' } },
        { label: '📋 Property valuation', action: 'ai_chat', payload: { prompt: 'I want to get my property valued' } },
        { label: '👤 Talk to an agent', action: 'transfer_human', payload: { message: 'Connecting you with an agent.' } },
        { label: '📞 Agent callback', action: 'phone_call' },
      ],
    },
  },
  {
    id: 'dental',
    name: 'Dental Practice',
    industry: 'Healthcare',
    icon: '🦷',
    description: 'Appointments, emergency, cleaning, insurance',
    tree: {
      label: 'Main Menu',
      action: 'sub_menu',
      payload: { greeting: "Thank you for calling. How can we help with your dental care?" },
      children: [
        { label: '📅 Book appointment', action: 'ai_chat', payload: { prompt: 'I need to book a dental appointment' } },
        { label: '🚨 Dental emergency', action: 'ai_chat', payload: { prompt: 'I have a dental emergency' } },
        { label: '🪥 Cleaning & check-up', action: 'ai_chat', payload: { prompt: 'I want to schedule a cleaning and check-up' } },
        { label: '💳 Insurance & payment', action: 'ai_chat', payload: { prompt: 'Do you accept my insurance?' } },
        { label: '📍 Location & hours', action: 'ai_chat', payload: { prompt: 'Where are you located and what are your hours?' } },
        { label: '📞 Call us back', action: 'phone_call' },
      ],
    },
  },
  {
    id: 'legal',
    name: 'Law Firm',
    industry: 'Legal',
    icon: '⚖️',
    description: 'Consultations, case status, document requests',
    tree: {
      label: 'Main Menu',
      action: 'sub_menu',
      payload: { greeting: "Thank you for reaching out. How can we assist you?" },
      children: [
        { label: '📅 Book consultation', action: 'ai_chat', payload: { prompt: 'I need to book a legal consultation' } },
        { label: '📋 Case status', action: 'ai_chat', payload: { prompt: 'I want to check the status of my case' } },
        { label: '📄 Request documents', action: 'ai_chat', payload: { prompt: 'I need to request legal documents' } },
        { label: '💰 Fee information', action: 'ai_chat', payload: { prompt: 'What are your fees and payment options?' } },
        { label: '👤 Speak to a lawyer', action: 'transfer_human', payload: { message: 'Connecting you with a lawyer.' } },
        { label: '📞 Request callback', action: 'phone_call' },
      ],
    },
  },
  {
    id: 'fitness-gym',
    name: 'Fitness & Gym',
    industry: 'Fitness',
    icon: '💪',
    description: 'Memberships, classes, trainer booking, free trial',
    tree: {
      label: 'Main Menu',
      action: 'sub_menu',
      payload: { greeting: "Hey! Ready to get fit? Let me help you get started." },
      children: [
        { label: '🏋️ Membership plans', action: 'ai_chat', payload: { prompt: 'What membership plans do you offer?' } },
        { label: '📅 Book a class', action: 'ai_chat', payload: { prompt: 'I want to book a fitness class' } },
        { label: '👤 Personal trainer', action: 'ai_chat', payload: { prompt: 'I want to book a personal training session' } },
        { label: '🎫 Free trial', action: 'ai_chat', payload: { prompt: 'How can I get a free trial?' } },
        { label: '🕐 Opening hours', action: 'ai_chat', payload: { prompt: 'What are your opening hours?' } },
        { label: '🎤 AI fitness coach', action: 'voice_ai', payload: { url: 'https://www.aistaffs.app/voice5922922en' } },
      ],
    },
  },
  {
    id: 'hotel',
    name: 'Hotel & Hospitality',
    industry: 'Hospitality',
    icon: '🏨',
    description: 'Room booking, check-in, concierge, dining, events',
    tree: {
      label: 'Main Menu',
      action: 'sub_menu',
      payload: { greeting: "Welcome! Thank you for choosing us. How may I assist you?" },
      children: [
        { label: '🛏️ Book a room', action: 'ai_chat', payload: { prompt: 'I want to book a room' } },
        { label: '📋 Check-in / Check-out', action: 'ai_chat', payload: { prompt: 'I need help with check-in or check-out' } },
        { label: '🍽️ Restaurant & dining', action: 'ai_chat', payload: { prompt: 'What dining options are available?' } },
        { label: '🎉 Events & meetings', action: 'ai_chat', payload: { prompt: 'I need to book an event or meeting room' } },
        { label: '🛎️ Concierge', action: 'ai_chat', payload: { prompt: 'I need concierge assistance' } },
        { label: '👤 Front desk', action: 'transfer_human', payload: { message: 'Connecting you with the front desk.' } },
      ],
    },
  },
  {
    id: 'education',
    name: 'Education & Training',
    industry: 'Education',
    icon: '🎓',
    description: 'Enrollment, courses, tutor booking, fees, campus info',
    tree: {
      label: 'Main Menu',
      action: 'sub_menu',
      payload: { greeting: "Welcome! How can we help with your learning journey?" },
      children: [
        { label: '📚 Browse courses', action: 'ai_chat', payload: { prompt: 'What courses do you offer?' } },
        { label: '📝 Enroll now', action: 'ai_chat', payload: { prompt: 'I want to enroll in a course' } },
        { label: '👩‍🏫 Book a tutor', action: 'ai_chat', payload: { prompt: 'I want to book a tutoring session' } },
        { label: '💰 Fees & scholarships', action: 'ai_chat', payload: { prompt: 'What are the fees and scholarship options?' } },
        { label: '📍 Campus info', action: 'ai_chat', payload: { prompt: 'Where is your campus and what facilities do you have?' } },
        { label: '👤 Talk to admissions', action: 'transfer_human', payload: { message: 'Connecting you with admissions.' } },
      ],
    },
  },
]

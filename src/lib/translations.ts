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
  closeDemo: string
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
    welcomeTo: (name) => `Welcome to ${name} Demo!`,
    clickToChat: 'Click on any sparkle button to chat with our trained AI staff',
    noAiStaff: 'No AI staff available. Please train some AI staff first in the admin panel.',
    availableStaff: 'Available staff:',
    closeDemo: 'Close Demo',
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
    welcomeTo: (name) => `欢迎来到${name}演示！`,
    clickToChat: '点击任意按钮与我们训练有素的AI客服对话',
    noAiStaff: '暂无可用的AI客服。请先在管理面板中训练AI客服。',
    availableStaff: '可用客服：',
    closeDemo: '关闭演示',
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
    welcomeTo: (name) => `歡迎來到${name}演示！`,
    clickToChat: '點擊任意按鈕與我們訓練有素的AI客服對話',
    noAiStaff: '暫無可用的AI客服。請先在管理面板中訓練AI客服。',
    availableStaff: '可用客服：',
    closeDemo: '關閉演示',
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
    welcomeTo: (name) => `Chào mừng đến với Demo ${name}!`,
    clickToChat: 'Nhấp vào bất kỳ nút nào để trò chuyện với nhân viên AI được đào tạo của chúng tôi',
    noAiStaff: 'Không có nhân viên AI nào. Vui lòng đào tạo nhân viên AI trong bảng quản trị.',
    availableStaff: 'Nhân viên có sẵn:',
    closeDemo: 'Đóng Demo',
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

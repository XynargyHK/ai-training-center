// Locale mapping utility
// Two code systems exist in the database:
// - Landing pages + Products: country='HK', language_code='tw' (short codes)
// - FAQ/Canned/Guidelines/Knowledge tables: language='zh-TW' (ISO codes)
// - URL params: ?country=HK&lang=tw

const URL_TO_DB: Record<string, string> = {
  'tw': 'zh-TW',
  'cn': 'zh-CN',
  'en': 'en',
  'vi': 'vi',
}

const DB_TO_URL: Record<string, string> = {
  'zh-TW': 'tw',
  'zh-CN': 'cn',
  'en': 'en',
  'vi': 'vi',
}

/**
 * Maps URL/short language code to database ISO language code.
 * Used for knowledge_base, faq_library, canned_messages, guidelines queries.
 * 'tw' -> 'zh-TW', 'cn' -> 'zh-CN', 'en' -> 'en', 'vi' -> 'vi'
 */
export function urlLangToDbLang(lang: string): string {
  return URL_TO_DB[lang] || lang
}

/**
 * Maps database ISO language code back to URL/short language code.
 * 'zh-TW' -> 'tw', 'zh-CN' -> 'cn', 'en' -> 'en', 'vi' -> 'vi'
 */
export function dbLangToUrlLang(lang: string): string {
  return DB_TO_URL[lang] || lang
}

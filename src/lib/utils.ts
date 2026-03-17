/**
 * Utility to strip HTML tags and Word-specific junk from strings.
 * Use this for fields that should be PURE plain text (Headlines).
 */
export const stripHtml = (html?: string): string => {
  if (!html) return ''
  if (!html.includes('<') && !html.includes('&') && !html.includes('<!--')) return html
  
  return html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<xml[\s\S]*?<\/xml>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]*>?/gm, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&[a-z0-9#]+;/gi, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n/g, '\n\n')
    .trim()
}

/**
 * Utility to clean HTML but KEEP basic formatting (bold, italic, spans, breaks).
 * 
 * This version is "Safety-First": it removes Word metadata but keeps 
 * the structure and styling you applied in the editor.
 */
export const cleanHtml = (html?: string): string => {
  if (!html) return ''
  
  // 1. Remove Word/XML/CSS metadata junk ONLY
  let cleaned = html
    .replace(/<!--[\s\S]*?-->/g, '') // Remove Word comments
    .replace(/<style[\s\S]*?<\/style>/gi, '') // Remove style blocks
    .replace(/<xml[\s\S]*?<\/xml>/gi, '') // Remove XML
    .replace(/<meta[\s\S]*?>/gi, '') // Remove meta
    .replace(/<link[\s\S]*?>/gi, '') // Remove links
    .replace(/class="MsoNormal"/gi, '')
    .replace(/class='MsoNormal'/gi, '')
    .replace(/mso-[\w-]+:[\w\s.-]+;?/gi, '') // Remove Word-specific CSS properties
    .replace(/<o:p>[\s\S]*?<\/o:p>/gi, '') // Remove Word paragraph markers
    .replace(/&nbsp;/g, ' ');

  // Note: We NO LONGER convert <p> to <br>. We keep the paragraphs.
  // We also keep style="" attributes because they might contain the user's chosen font-size (24px).
  
  return cleaned.trim();
}

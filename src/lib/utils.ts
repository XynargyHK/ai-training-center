/**
 * Utility to strip ALL HTML tags and Word-specific junk.
 * Use this ONLY when you want 100% plain text.
 */
export const stripHtml = (html?: string): string => {
  if (!html) return ''
  return html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<xml[\s\S]*?<\/xml>/gi, '')
    .replace(/<[^>]*>?/gm, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&[a-z0-9#]+;/gi, '')
    .trim()
}

/**
 * The "Smart Cleaner" for Landing Page Content.
 * 
 * 1. Keeps formatting: <b>, <strong>, <i>, <em>, <u>, <span>
 * 2. Keeps your custom styles (like font-size: 24px)
 * 3. STRIPS Word Junk: <!--EndFragment-->, MsoNormal, etc.
 * 4. STRIPS Layout Blocks: <div>, <p>, <html>, <body> (to prevent gaps)
 */
export const cleanHtml = (html?: string): string => {
  if (!html) return ''
  
  let cleaned = html
    // Remove Word/XML metadata blocks
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<xml[\s\S]*?<\/xml>/gi, '')
    .replace(/<meta[\s\S]*?>/gi, '')
    .replace(/<link[\s\S]*?>/gi, '')
    
    // Remove Word-specific classes and properties
    .replace(/class="MsoNormal"/gi, '')
    .replace(/class='MsoNormal'/gi, '')
    .replace(/mso-[\w-]+:[\w\s.-]+;?/gi, '')
    .replace(/<o:p>[\s\S]*?<\/o:p>/gi, '')
    
    // STRIP layout blocks but KEEP their content (this prevents the gaps)
    // We convert <p> and <div> into simple line breaks <br>
    .replace(/<p[\s\S]*?>([\s\S]*?)<\/p>/gi, '$1<br/>')
    .replace(/<div[\s\S]*?>([\s\S]*?)<\/div>/gi, '$1<br/>')
    .replace(/<html[\s\S]*?>([\s\S]*?)<\/html>/gi, '$1')
    .replace(/<body[\s\S]*?>([\s\S]*?)<\/body>/gi, '$1')
    
    // Clean up entities
    .replace(/&nbsp;/g, ' ')
    
    // Clean up multiple line breaks (allow max 2)
    .replace(/(<br\s*\/?>){3,}/gi, '<br/><br/>')
    .trim();

  return cleaned;
}

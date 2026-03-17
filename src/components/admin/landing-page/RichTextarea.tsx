'use client'

import React, { useRef, useEffect } from 'react'

interface RichTextareaProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export default function RichTextarea({ value, onChange, placeholder, className }: RichTextareaProps) {
  const editorRef = useRef<HTMLDivElement>(null)

  // Sync internal state with external value ONLY if they differ
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || ''
    }
  }, [value])

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text/plain')
    const html = e.clipboardData.getData('text/html')
    
    // If there is HTML, we try to sanitize it a bit but keep bold/italic
    if (html && (html.includes('MsoNormal') || html.includes('<!--') || html.includes('<xml'))) {
      // 1. Try to extract content between StartFragment and EndFragment
      const fragmentMatch = html.match(/<!--StartFragment-->([\s\S]*?)<!--EndFragment-->/);
      let rawContent = fragmentMatch ? fragmentMatch[1] : html;

      // 2. Clean and convert blocks to line breaks for tight spacing
      let contentToInsert = rawContent
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<xml[\s\S]*?<\/xml>/gi, '')
        .replace(/class="MsoNormal"/gi, '')
        .replace(/style="[\s\S]*?"/gi, '') // Strip styles
        .replace(/<p[\s\S]*?>([\s\S]*?)<\/p>/gi, '$1<br/>') // Convert P to BR
        .replace(/<div[\s\S]*?>([\s\S]*?)<\/div>/gi, '$1<br/>') // Convert DIV to BR
        .replace(/<o:p>[\s\S]*?<\/o:p>/gi, '')
        .replace(/<span[\s\S]*?>([\s\S]*?)<\/span>/gi, '$1')
        .replace(/&nbsp;/g, ' ')
        .replace(/(<br\s*\/?>){3,}/gi, '<br/><br/>')
        .trim();

      // If after cleaning we have almost nothing, fallback to text
      if (contentToInsert.replace(/<[^>]*>/g, '').trim().length === 0) {
        contentToInsert = text.trim().replace(/\n/g, '<br>');
      }
      
      document.execCommand('insertHTML', false, contentToInsert);
    } else if (html) {
      // Basic sanitization for normal HTML
      const div = document.createElement('div')
      div.innerHTML = html
      const allowedTags = ['B', 'I', 'STRONG', 'EM', 'SPAN', 'P', 'BR', 'DIV']
      const walk = (node: Node) => {
        if (node.nodeType === 1) { // Element
          const el = node as HTMLElement
          if (!allowedTags.includes(el.tagName)) {
            const textNode = document.createTextNode(el.innerText)
            el.parentNode?.replaceChild(textNode, el)
          } else {
            while (el.attributes.length > 0) {
              el.removeAttribute(el.attributes[0].name)
            }
            Array.from(el.childNodes).forEach(walk)
          }
        }
      }
      walk(div)
      document.execCommand('insertHTML', false, div.innerHTML)
    } else {
      document.execCommand('insertText', false, text)
    }
    handleInput()
  }

  return (
    <div className="relative group">
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onPaste={handlePaste}
        className={`min-h-[80px] p-2 bg-white border border-gray-200 rounded-none text-gray-800 text-xs focus:outline-none focus:ring-1 focus:ring-violet-500 overflow-y-auto break-words whitespace-pre-wrap ${className}`}
        style={{ direction: 'ltr' }}
      />
      {!value && (
        <div className="absolute top-2 left-2 text-gray-400 text-xs pointer-events-none">
          {placeholder}
        </div>
      )}
    </div>
  )
}

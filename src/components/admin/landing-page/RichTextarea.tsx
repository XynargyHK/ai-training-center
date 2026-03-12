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
    if (html) {
      // Use a temporary div to sanitize
      const div = document.createElement('div')
      div.innerHTML = html
      
      // Basic sanitization - only keep b, i, strong, em, span, p, br
      const allowedTags = ['B', 'I', 'STRONG', 'EM', 'SPAN', 'P', 'BR', 'DIV']
      const walk = (node: Node) => {
        if (node.nodeType === 1) { // Element
          const el = node as HTMLElement
          if (!allowedTags.includes(el.tagName)) {
            // Replace with text content or nothing
            const textNode = document.createTextNode(el.innerText)
            el.parentNode?.replaceChild(textNode, el)
          } else {
            // Remove attributes except maybe style if we want to keep some
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

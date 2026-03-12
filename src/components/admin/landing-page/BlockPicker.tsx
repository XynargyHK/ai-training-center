'use client'

import React from 'react'
import { X } from 'lucide-react'
import { getAllBlockTypes, type BlockTypeConfig } from './block-registry'

interface BlockPickerProps {
  onSelect: (blockType: string) => void
  onClose: () => void
}

const BlockPreview = ({ type }: { type: string }) => {
  const commonBase = "w-full h-full bg-white border border-gray-100 rounded-md overflow-hidden flex flex-col p-2 gap-1.5 shadow-inner"
  const line = "h-1 bg-gray-100 rounded-full w-full"
  const midLine = "h-1 bg-gray-100 rounded-full w-3/4"
  const shortLine = "h-1 bg-gray-100 rounded-full w-1/2"
  const textTiny = "text-[5px] font-bold leading-tight"
  const textMicro = "text-[4px] font-medium leading-none text-gray-400"

  switch (type) {
    case 'split':
      return (
        <div className={commonBase}>
          <div className="flex gap-2 h-full items-center">
            <div className="w-1/2 aspect-square bg-gray-100 rounded-md flex items-center justify-center text-[10px]">📷</div>
            <div className="w-1/2 flex flex-col gap-1">
              <div className="text-[6px] font-black text-gray-800">AMAZING FEATURE</div>
              <div className="text-[4px] text-gray-500 leading-tight">Better results in just 3 days with our unique approach.</div>
              <div className="h-3 w-10 bg-violet-600 rounded-[2px] mt-1 flex items-center justify-center text-[4px] text-white font-bold">GET STARTED</div>
            </div>
          </div>
        </div>
      )
    case 'card':
      return (
        <div className={commonBase}>
          <div className="grid grid-cols-2 gap-2 h-full">
            {[1, 2].map(i => (
              <div key={i} className="bg-white border border-gray-100 rounded-md p-1.5 flex flex-col gap-1 shadow-sm">
                <div className="w-full aspect-video bg-gray-50 rounded-sm flex items-center justify-center text-[8px]">⭐</div>
                <div className="text-[5px] font-bold">Review Title</div>
                <div className="text-[4px] text-gray-400 line-clamp-2">Great experience, loved the interface!</div>
              </div>
            ))}
          </div>
        </div>
      )
    case 'accordion':
      return (
        <div className={commonBase}>
          <div className="flex flex-col gap-1.5 pt-1">
            <div className="border-b border-gray-100 pb-1 flex justify-between items-center px-1">
              <div className="text-[5px] font-bold text-gray-700">How does it work?</div>
              <div className="text-[6px]">▼</div>
            </div>
            <div className="bg-violet-50/50 p-1 rounded-sm">
              <div className="text-[4px] text-gray-500">Our process is simple: connect, sync, and analyze.</div>
            </div>
            <div className="border-b border-gray-100 pb-1 flex justify-between items-center px-1">
              <div className="text-[5px] font-bold text-gray-700">Is it secure?</div>
              <div className="text-[6px]">▶</div>
            </div>
          </div>
        </div>
      )
    case 'pricing':
      return (
        <div className={commonBase}>
          <div className="flex gap-2 h-full items-end">
            <div className="flex-1 bg-white border border-gray-100 rounded-md p-1.5 flex flex-col items-center gap-1">
              <div className="text-[4px] font-bold text-gray-400">FREE</div>
              <div className="text-[8px] font-black">$0</div>
              <div className="text-[3px] text-gray-400 mb-1">per month</div>
              <div className="w-full space-y-0.5"><div className="h-0.5 bg-gray-100 w-full"/><div className="h-0.5 bg-gray-100 w-full"/></div>
              <div className="h-2.5 w-full bg-gray-100 rounded-[1px] mt-1" />
            </div>
            <div className="flex-1 bg-violet-50 border border-violet-200 rounded-md p-1.5 flex flex-col items-center gap-1 relative shadow-md scale-110 z-10">
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-violet-600 text-[3.5px] text-white px-1 py-0.5 rounded-full font-bold whitespace-nowrap shadow-sm">MOST POPULAR</div>
              <div className="text-[4px] font-bold text-violet-600">PRO</div>
              <div className="text-[8px] font-black text-violet-900">$29</div>
              <div className="text-[3px] text-violet-400 mb-1">per month</div>
              <div className="w-full space-y-0.5"><div className="h-0.5 bg-violet-200 w-full"/><div className="h-0.5 bg-violet-200 w-full"/></div>
              <div className="h-2.5 w-full bg-violet-600 rounded-[1px] mt-1 flex items-center justify-center text-[3.5px] text-white font-bold">BUY PRO</div>
            </div>
          </div>
        </div>
      )
    case 'testimonials':
      return (
        <div className={commonBase + " items-center justify-center text-center px-4"}>
          <div className="w-8 h-8 rounded-full bg-gray-100 border border-white shadow-sm mb-1 flex items-center justify-center text-[10px]">👩</div>
          <div className="text-[6px] font-black text-gray-800 uppercase tracking-tighter">SARAH JOHNSON</div>
          <div className="flex gap-0.5 my-1">
            {[1,2,3,4,5].map(i => <div key={i} className="w-1.5 h-1.5 text-[6px] text-yellow-400">★</div>)}
          </div>
          <div className="text-[4px] text-gray-500 italic leading-tight">&ldquo;This changed my entire workflow. Highly recommended!&rdquo;</div>
        </div>
      )
    case 'steps':
    case 'text_image_grid':
      return (
        <div className={commonBase}>
          <div className="flex flex-col gap-2 h-full pt-1">
            <div className="flex gap-2 items-center px-1">
              <div className="w-4 h-4 rounded-full bg-violet-600 text-white flex items-center justify-center text-[6px] font-black shrink-0">1</div>
              <div className="flex-1 flex flex-col">
                <div className="text-[5px] font-bold">Register Account</div>
                <div className="text-[3px] text-gray-400">Enter your basic location details.</div>
              </div>
            </div>
            <div className="flex gap-2 items-center px-1">
              <div className="w-4 h-4 rounded-full bg-violet-600 text-white flex items-center justify-center text-[6px] font-black shrink-0">2</div>
              <div className="flex-1 flex flex-col">
                <div className="text-[5px] font-bold">Connect Device</div>
                <div className="text-[3px] text-gray-400">Plug in and pair with Wi-Fi.</div>
              </div>
            </div>
          </div>
        </div>
      )
    case 'static_banner':
      return (
        <div className="w-full h-full bg-slate-900 rounded-md flex flex-col items-center justify-center p-4 gap-1 relative overflow-hidden">
          <div className="absolute inset-0 opacity-40 bg-[url('https://images.unsplash.com/photo-1497215728101-856f4ea42174')] bg-cover bg-center" />
          <div className="absolute inset-0 bg-black/50" />
          <div className="text-[10px] font-black text-white text-center z-10 leading-none">THE NEW STANDARD</div>
          <div className="text-[5px] text-white/70 text-center z-10 mb-1">Innovation starts here. Join today.</div>
          <div className="h-4 w-16 bg-violet-600 rounded-[2px] z-10 flex items-center justify-center text-[4px] text-white font-bold shadow-lg border border-violet-400">DISCOVER NOW</div>
        </div>
      )
    case 'table':
      return (
        <div className={commonBase}>
          <div className="flex flex-col h-full border border-gray-100 rounded-sm overflow-hidden text-[3px]">
            <div className="h-3 bg-gray-50 flex gap-1 px-1 items-center border-b border-gray-200 font-bold uppercase">
              <div className="flex-1">FEATURE</div><div className="flex-1 text-center">BASIC</div><div className="flex-1 text-center">PRO</div>
            </div>
            <div className="h-3 bg-white flex gap-1 px-1 items-center border-b border-gray-50">
              <div className="flex-1">Speed</div><div className="flex-1 text-center text-gray-300">1x</div><div className="flex-1 text-center font-bold">10x</div>
            </div>
            <div className="h-3 bg-white flex gap-1 px-1 items-center border-b border-gray-50">
              <div className="flex-1">Support</div><div className="flex-1 text-center">Chat</div><div className="flex-1 text-center font-bold">24/7</div>
            </div>
          </div>
        </div>
      )
    case 'form':
      return (
        <div className={commonBase}>
          <div className="flex flex-col gap-2 pt-1">
            <div className="space-y-0.5">
              <div className="text-[4px] font-bold text-gray-500 uppercase">FULL NAME</div>
              <div className="h-3.5 bg-gray-50 border border-gray-100 rounded-[1px] w-full px-1 flex items-center text-[4px] text-gray-300">John Doe</div>
            </div>
            <div className="space-y-0.5">
              <div className="text-[4px] font-bold text-gray-500 uppercase">EMAIL ADDRESS</div>
              <div className="h-3.5 bg-gray-50 border border-gray-100 rounded-[1px] w-full px-1 flex items-center text-[4px] text-gray-300">john@example.com</div>
            </div>
            <div className="h-4.5 bg-violet-600 rounded-[1px] w-full mt-0.5 flex items-center justify-center text-[4px] text-white font-bold shadow-sm">SUBMIT FORM</div>
          </div>
        </div>
      )
    case 'video':
      return (
        <div className="w-full h-full bg-black rounded-md flex items-center justify-center relative group overflow-hidden border border-slate-800">
          <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white">
            <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-white border-b-[6px] border-b-transparent ml-1" />
          </div>
          <div className="absolute top-2 left-2 right-2 flex justify-between items-center px-1">
            <div className="text-[4px] text-white/80 font-bold bg-black/40 px-1 rounded-sm uppercase tracking-widest">PRODUCT DEMO</div>
            <div className="text-[4px] text-white/80">02:45</div>
          </div>
          <div className="absolute bottom-2 left-2 right-2 flex items-center gap-2">
            <div className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
              <div className="w-1/3 h-full bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.8)]" />
            </div>
            <div className="w-2 h-2 rounded-full bg-white/80" />
          </div>
        </div>
      )
    case 'social_feed':
      return (
        <div className={commonBase + " bg-gray-50/50"}>
          <div className="text-[5px] font-black text-center mb-1 text-gray-400">@INSTAGRAM_FEED</div>
          <div className="grid grid-cols-3 gap-1 h-full">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="aspect-square bg-white rounded-sm relative overflow-hidden border border-gray-100 flex items-center justify-center text-[6px]">
                📸
              </div>
            ))}
          </div>
        </div>
      )
    case 'logo_cloud':
      return (
        <div className={commonBase + " flex-row flex-wrap items-center justify-center content-center gap-x-4 gap-y-2 bg-gray-50/20"}>
          <div className="text-[5px] font-bold text-gray-300 mb-1 w-full text-center tracking-[0.2em]">TRUSTED BY</div>
          <div className="text-[6px] font-black text-gray-400 grayscale opacity-50">GOOGLE</div>
          <div className="text-[6px] font-black text-gray-400 grayscale opacity-50">APPLE</div>
          <div className="text-[6px] font-black text-gray-400 grayscale opacity-50">ADIDAS</div>
          <div className="text-[6px] font-black text-gray-400 grayscale opacity-50">NIKE</div>
          <div className="text-[6px] font-black text-gray-400 grayscale opacity-50">SAMSUNG</div>
        </div>
      )
    case 'image_grid':
      return (
        <div className={commonBase}>
          <div className="grid grid-cols-3 gap-1.5 h-full">
            <div className="col-span-2 row-span-2 bg-gray-100 rounded-md border border-gray-200 flex items-center justify-center text-[12px]">🖼️</div>
            <div className="bg-gray-100 rounded-md border border-gray-200" />
            <div className="bg-gray-100 rounded-md border border-gray-200" />
          </div>
        </div>
      )
    case 'stats_grid':
      return (
        <div className={commonBase + " bg-violet-600 border-none"}>
          <div className="grid grid-cols-2 gap-4 h-full items-center px-2">
            <div className="text-center space-y-0.5 border-r border-white/20">
              <div className="text-[12px] font-black text-white leading-none">99%</div>
              <div className="text-[3px] font-bold text-violet-200 uppercase tracking-widest">SUCCESS</div>
            </div>
            <div className="text-center space-y-0.5">
              <div className="text-[12px] font-black text-white leading-none">10k+</div>
              <div className="text-[3px] font-bold text-violet-200 uppercase tracking-widest">CLIENTS</div>
            </div>
          </div>
        </div>
      )
    default:
      return <div className={commonBase} />
  }
}

export default function BlockPicker({ onSelect, onClose }: BlockPickerProps) {
  const blockTypes = getAllBlockTypes()
  
  const categories = {
    content: blockTypes.filter(b => b.category === 'content'),
    social: blockTypes.filter(b => b.category === 'social'),
    interactive: blockTypes.filter(b => b.category === 'interactive')
  }

  const categoryLabels = {
    content: 'Content & Layout',
    social: 'Trust & Social',
    interactive: 'Interactive'
  }

  const handleSelectBlock = (type: string) => {
    onSelect(type)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-xl border border-gray-200 shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200 text-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Add New Block</h2>
            <p className="text-xs text-gray-500 font-medium">Select a component to add to your landing page</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all p-2 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Block Types Grid */}
        <div className="p-6 overflow-y-auto flex-1 space-y-8">
          {Object.entries(categories).map(([category, blocks]) => (
            blocks.length > 0 && (
              <div key={category} className="space-y-4">
                <h3 className="text-xs font-black text-violet-600 uppercase tracking-[0.2em] flex items-center gap-3">
                  {categoryLabels[category as keyof typeof categoryLabels]}
                  <div className="h-px bg-violet-100 flex-1" />
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {blocks.map((blockType) => (
                    <button
                      key={blockType.type}
                      onClick={() => handleSelectBlock(blockType.type)}
                      className="group flex flex-col bg-white hover:bg-violet-50 border border-gray-200 hover:border-violet-400 rounded-xl overflow-hidden text-left transition-all hover:shadow-xl hover:-translate-y-1"
                    >
                      {/* Visual Preview Area */}
                      <div className="aspect-[16/9] w-full bg-gray-50 p-4 group-hover:bg-violet-100/30 transition-colors border-b border-gray-100 flex items-center justify-center">
                        <div className="w-full max-w-[200px] aspect-[16/10]">
                          <BlockPreview type={blockType.type} />
                        </div>
                      </div>
                      
                      {/* Text Area */}
                      <div className="p-4 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{blockType.icon}</span>
                          <h4 className="text-gray-900 text-sm font-bold group-hover:text-violet-700 transition-colors">
                            {blockType.label}
                          </h4>
                        </div>
                        <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-2">
                          {blockType.description}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 text-center">
          <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">
            14 Professional Blocks Available
          </p>
        </div>
      </div>
    </div>
  )
}

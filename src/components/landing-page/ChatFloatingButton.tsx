'use client'

import dynamic from 'next/dynamic'

const AICoach = dynamic(() => import('@/components/ui/ai-coach'), { ssr: false })

interface ChatFloatingButtonProps {
  businessUnit: string
  country: string
  lang: string
  aiStaffList: { id: string; name: string; role: string }[]
  enableSocialLogin?: boolean
}

export default function ChatFloatingButton({ businessUnit, country, lang, aiStaffList, enableSocialLogin }: ChatFloatingButtonProps) {
  if (aiStaffList.length === 0) return null

  return (
    <AICoach
      businessUnit={businessUnit}
      country={country}
      language={lang}
      aiStaffList={aiStaffList}
      initialOpen={false}
      enableSocialLogin={enableSocialLogin}
    />
  )
}

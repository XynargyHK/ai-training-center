import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://skincoach.ai',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: 'https://skincoach.ai/livechat?businessUnit=skincoach&country=US&lang=en&page=micro-infusion-system-face',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: 'https://skincoach.ai/livechat?businessUnit=skincoach&country=HK&lang=en&page=micro-infusion-system-face',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
  ]
}

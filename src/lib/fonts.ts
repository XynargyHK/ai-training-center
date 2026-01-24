import { Cormorant_Garamond, Josefin_Sans, Playfair_Display, Montserrat, Inter, Lora, Raleway, Open_Sans, Noto_Sans_TC, Noto_Sans_SC } from 'next/font/google'

// Chinese fonts for Traditional and Simplified Chinese
export const notoSansTC = Noto_Sans_TC({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  display: 'swap',
  variable: '--font-noto-tc',
})

export const notoSansSC = Noto_Sans_SC({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  display: 'swap',
  variable: '--font-noto-sc',
})

// Elegant serif font for body text and logo
export const serifFont = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  display: 'swap',
  variable: '--font-serif',
})

// Elegant geometric sans-serif for headlines (Chanel-like)
export const headlineFont = Josefin_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  display: 'swap',
  variable: '--font-headline',
})

// Additional popular fonts
export const playfairFont = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-playfair',
})

export const montserratFont = Montserrat({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-montserrat',
})

export const interFont = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-inter',
})

export const loraFont = Lora({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-lora',
})

export const ralewayFont = Raleway({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-raleway',
})

export const openSansFont = Open_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-open-sans',
})

// Font mapping helper
export const getFontClass = (fontFamily?: string) => {
  switch (fontFamily) {
    case 'Playfair Display': return playfairFont.className
    case 'Montserrat': return montserratFont.className
    case 'Inter': return interFont.className
    case 'Lora': return loraFont.className
    case 'Raleway': return ralewayFont.className
    case 'Open Sans': return openSansFont.className
    case 'Josefin Sans': return headlineFont.className
    case 'Cormorant Garamond': return serifFont.className
    case 'Noto Sans TC': return notoSansTC.className
    case 'Noto Sans SC': return notoSansSC.className
    default: return headlineFont.className
  }
}

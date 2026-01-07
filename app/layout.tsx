import type { Metadata } from "next"
import { JetBrains_Mono } from "next/font/google"
import "./globals.css"
import { generateThemeInitScript } from "@/lib/theme/cssVars"

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "MathPad",
  description: "A calculator with a different take",
}

// Inline script to prevent theme flash - reads saved preference and sets CSS vars before paint
const themeInitScript = generateThemeInitScript()

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-title" content="MathPad" />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={`${jetbrainsMono.variable} antialiased flex flex-col min-h-screen`}>
        {children}
      </body>
    </html>
  )
}

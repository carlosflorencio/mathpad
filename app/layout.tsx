import type { Metadata } from "next"
import "./globals.css"
import { generateThemeInitScript } from "@/lib/theme/cssVars"

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
      <body className="antialiased flex flex-col min-h-screen">{children}</body>
    </html>
  )
}

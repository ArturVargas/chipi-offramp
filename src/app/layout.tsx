import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
// import { ThemeProvider } from "@/components/theme-provider"
// import { Toaster } from "react-hot-toast"
import { ClerkProvider } from "@clerk/nextjs"
import { Providers } from "./providers"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Chipi Pay | MoneyGram Integration",
  description: "Send and receive money globally with Chipi Pay's MoneyGram integration",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
<ClerkProvider signInFallbackRedirectUrl="/dashboard" signUpFallbackRedirectUrl="/dashboard" afterSignOutUrl="/" >      <Providers>
        <html lang="en" suppressHydrationWarning>
          <body className={inter.className}>
            {/* <ThemeProvider attribute="class" defaultTheme="light" enableSystem> */}
              {children}
              {/* <Toaster
                position="top-center"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: "#363636",
                    color: "#fff",
                    borderRadius: "8px",
                  },
                  success: {
                    style: {
                      background: "#10b981",
                    },
                  },
                  error: {
                    style: {
                      background: "#ef4444",
                    },
                  },
                }}
              /> */}
            {/* </ThemeProvider> */}
          </body>
        </html>
      </Providers>
    </ClerkProvider>
  )
}

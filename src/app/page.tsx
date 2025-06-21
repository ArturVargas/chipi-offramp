import Link from "next/link"
// import { ArrowRight, Banknote, Globe, Shield, Zap } from "lucide-react"
// import { Button } from "@/components/ui/button"
import { SignUpButton, SignedIn, SignedOut } from "@clerk/nextjs"

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <header className="border-b">
        <div className="container max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-purple-600">Chipi Pay</h1>
          </div>
          <SignedOut>
            <SignUpButton
              mode="modal"
              forceRedirectUrl="/dashboard"
              signInForceRedirectUrl="/dashboard"
            >
              <button className="bg-purple-600 hover:bg-purple-700">Get Started</button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <button className="bg-purple-600 hover:bg-purple-700">
              <Link href="/dashboard">Go to Dashboard</Link>
            </button>
          </SignedIn>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 md:py-20 bg-gradient-to-b from-purple-50 to-white">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                Money Transfers with <span className="text-purple-600">Zero Fees</span>
                <span className="text-xl block mt-2 font-normal text-gray-600">(Yes, you read that right! 🤯)</span>
              </h1>
              <p className="text-xl text-gray-600">
                Thanks to magical tech, we&apos;ve eliminated those pesky fees that eat up your hard-earned cash.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <SignedOut>
                  <SignUpButton
                    mode="modal"
                    forceRedirectUrl="/dashboard"
                    signInForceRedirectUrl="/dashboard"
                  >
                    <button className="bg-purple-600 hover:bg-purple-700 text-lg h-14">
                      Show Me The Money
                    </button>
                  </SignUpButton>
                </SignedOut>
                <SignedIn>
                  <button className="bg-purple-600 hover:bg-purple-700 text-lg h-14">
                    <Link href="/dashboard">
                      Show Me The Money
                    </Link>
                  </button>
                </SignedIn>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -top-6 -left-6 w-24 h-24 bg-purple-100 rounded-full z-0"></div>
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-purple-100 rounded-full z-0"></div>
              <div className="relative z-10">
                <img
                  src="/chipi.png"
                  alt="Chipi Pay Logo"
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Zero Fees Callout */}
      <section className="py-10 bg-purple-600 text-white">
        <div className="container max-w-6xl mx-auto px-4 text-center">
          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            <h2 className="text-2xl md:text-3xl font-bold">Powered by Stellar & Chipi Pay = Zero Transfer Fees</h2>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Chipi Pay Rocks</h2>
            <p className="text-lg text-gray-600">No boring financial jargon, just awesome benefits.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              </div>
              <h3 className="text-xl font-bold mb-2">Zero Fees</h3>
              <p className="text-gray-600">
                Thanks to Stellar, we&apos;ve kicked fees to the curb. Your money stays YOUR money.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              </div>
              <h3 className="text-xl font-bold mb-2">Global Cash</h3>
              <p className="text-gray-600">MoneyGram locations everywhere. Like, seriously, they&apos;re EVERYWHERE.</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              </div>
              <h3 className="text-xl font-bold mb-2">Super Secure</h3>
              <p className="text-gray-600">Fort Knox-level security, but without the scary guards and lasers.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section - Simplified */}
      <section className="py-16 bg-gray-50">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How It Works (It&apos;s Easy, Promise!)</h2>
          </div>

          <div className="flex flex-col md:flex-row gap-8 max-w-4xl mx-auto">
            <div className="flex-1 text-center">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-bold mb-2">Create Wallet</h3>
              <p className="text-gray-600">Takes 30 seconds. Seriously, we timed it! ⏱️</p>
            </div>

            <div className="flex-1 text-center">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-bold mb-2">Add Money</h3>
              <p className="text-gray-600">Visit MoneyGram. Say the magic words. 💰</p>
            </div>

            <div className="flex-1 text-center">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-bold mb-2">Enjoy Zero Fees</h3>
              <p className="text-gray-600">Thanks, Stellar! 🎉</p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <SignedOut>
              <SignUpButton
                mode="modal"
                forceRedirectUrl="/dashboard"
                signInForceRedirectUrl="/dashboard"
              >
                <button className="bg-purple-600 hover:bg-purple-700 text-lg h-14">
                  I&apos;m Convinced! Let&apos;s Go
                </button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <button className="bg-purple-600 hover:bg-purple-700 text-lg h-14">
                <Link href="/dashboard">
                  I&apos;m Convinced! Let&apos;s Go
                </Link>
              </button>
            </SignedIn>
          </div>
        </div>
      </section>

      {/* Testimonial - Just One Funny One */}
      <section className="py-16">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow-md border border-gray-100">
            <div className="flex items-center mb-6">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                <span className="text-purple-600 font-bold text-xl">JD</span>
              </div>
              <div>
                <h4 className="text-xl font-bold">Juan &quot;Money Saver&quot; Diaz</h4>
                <p className="text-gray-500">Formerly paid too many fees</p>
              </div>
            </div>
            <p className="text-xl italic text-gray-600">
              &quot;I used to lose so much money on fees that I considered starting a &apos;Fee Jar&apos; to save for retirement. Then
              I found Chipi Pay with ZERO fees thanks to Stellar. Now I&apos;m using that jar for vacation money instead! 🏝️&quot;
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 bg-purple-600 text-white">
        <div className="container max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Stop Paying Fees? (Silly Question, We Know)</h2>
          <SignedOut>
            <SignUpButton
              mode="modal"
              forceRedirectUrl="/dashboard"
              signInForceRedirectUrl="/dashboard"
            >
              <button className="bg-white text-purple-600 hover:bg-gray-100 text-lg h-14">
                Let&apos;s Do This!
              </button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <button className="bg-white text-purple-600 hover:bg-gray-100 text-lg h-14">
              <Link href="/dashboard">
                Let&apos;s Do This!
              </Link>
            </button>
          </SignedIn>
        </div>
      </section>

      {/* Simple Footer */}
      <footer className="py-8 bg-gray-900 text-gray-300">
        <div className="container max-w-6xl mx-auto px-4 text-center">
          <p className="mb-4">
            <span className="font-bold text-white">Chipi Pay</span> — Powered by Stellar for Zero-Fee Money Transfers
          </p>
          <p className="text-sm">
            &copy; {new Date().getFullYear()} Chipi Pay. No rights reserved. Money should be free! (Transfers, that is.)
          </p>
        </div>
      </footer>
    </div>
  )
}

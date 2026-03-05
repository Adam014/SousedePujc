import Link from "next/link"
import { ArrowRight, Leaf, Wallet, Users } from "lucide-react"

export const metadata = {
  title: "Jak to funguje - SousedePůjč",
  description: "Zjistěte, jak snadno si půjčit nebo pronajmout věci na platformě SousedePůjč.",
}

function SearchIllustration() {
  return (
    <svg viewBox="0 0 280 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
      {/* Background card grid */}
      <rect x="20" y="30" width="75" height="90" rx="12" fill="#EFF6FF" stroke="#BFDBFE" strokeWidth="1.5" />
      <rect x="28" y="38" width="59" height="40" rx="8" fill="#DBEAFE" />
      <rect x="28" y="86" width="35" height="6" rx="3" fill="#93C5FD" />
      <rect x="28" y="98" width="50" height="4" rx="2" fill="#BFDBFE" />
      <rect x="28" y="106" width="25" height="4" rx="2" fill="#BFDBFE" />

      <rect x="105" y="30" width="75" height="90" rx="12" fill="#EFF6FF" stroke="#BFDBFE" strokeWidth="1.5" />
      <rect x="113" y="38" width="59" height="40" rx="8" fill="#DBEAFE" />
      <rect x="113" y="86" width="40" height="6" rx="3" fill="#93C5FD" />
      <rect x="113" y="98" width="50" height="4" rx="2" fill="#BFDBFE" />
      <rect x="113" y="106" width="30" height="4" rx="2" fill="#BFDBFE" />

      <rect x="190" y="30" width="75" height="90" rx="12" fill="#EFF6FF" stroke="#BFDBFE" strokeWidth="1.5" />
      <rect x="198" y="38" width="59" height="40" rx="8" fill="#DBEAFE" />
      <rect x="198" y="86" width="30" height="6" rx="3" fill="#93C5FD" />
      <rect x="198" y="98" width="50" height="4" rx="2" fill="#BFDBFE" />
      <rect x="198" y="106" width="40" height="4" rx="2" fill="#BFDBFE" />

      {/* Magnifying glass - prominent */}
      <circle cx="200" cy="145" r="28" fill="white" stroke="#3B82F6" strokeWidth="3" />
      <circle cx="200" cy="145" r="20" fill="#EFF6FF" stroke="#93C5FD" strokeWidth="1.5" />
      <line x1="222" y1="167" x2="242" y2="187" stroke="#3B82F6" strokeWidth="4" strokeLinecap="round" />
      {/* Sparkle inside magnifier */}
      <circle cx="193" cy="139" r="3" fill="#3B82F6" opacity="0.6" />
      <circle cx="205" cy="148" r="2" fill="#3B82F6" opacity="0.4" />

      {/* Person browsing */}
      <circle cx="70" cy="145" r="14" fill="#FBBF24" />
      <circle cx="70" cy="145" r="14" fill="url(#personGrad1)" />
      <rect x="58" y="162" width="24" height="30" rx="10" fill="#3B82F6" />
      <rect x="50" y="168" width="12" height="4" rx="2" fill="#3B82F6" />
      <rect x="82" y="168" width="12" height="4" rx="2" fill="#3B82F6" />

      {/* Phone in hand */}
      <rect x="90" y="155" width="22" height="36" rx="4" fill="#1E3A5F" />
      <rect x="92" y="158" width="18" height="28" rx="2" fill="#DBEAFE" />
      <rect x="95" y="162" width="12" height="3" rx="1" fill="#93C5FD" />
      <rect x="95" y="168" width="8" height="3" rx="1" fill="#93C5FD" />

      {/* Floating dots */}
      <circle cx="150" cy="140" r="3" fill="#3B82F6" opacity="0.3" />
      <circle cx="160" cy="155" r="2" fill="#8B5CF6" opacity="0.3" />
      <circle cx="140" cy="160" r="2.5" fill="#3B82F6" opacity="0.2" />

      <defs>
        <linearGradient id="personGrad1" x1="56" y1="131" x2="84" y2="159">
          <stop stopColor="#FBBF24" />
          <stop offset="1" stopColor="#F59E0B" />
        </linearGradient>
      </defs>
    </svg>
  )
}

function ChatIllustration() {
  return (
    <svg viewBox="0 0 280 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
      {/* Person 1 */}
      <circle cx="60" cy="90" r="18" fill="url(#chatPerson1)" />
      <rect x="44" y="112" width="32" height="35" rx="12" fill="#8B5CF6" />

      {/* Person 2 */}
      <circle cx="220" cy="90" r="18" fill="url(#chatPerson2)" />
      <rect x="204" y="112" width="32" height="35" rx="12" fill="#3B82F6" />

      {/* Chat bubble left */}
      <rect x="88" y="50" width="90" height="36" rx="12" fill="#8B5CF6" />
      <polygon points="88,72 78,80 92,76" fill="#8B5CF6" />
      <rect x="98" y="62" width="40" height="4" rx="2" fill="white" opacity="0.7" />
      <rect x="98" y="70" width="55" height="4" rx="2" fill="white" opacity="0.5" />

      {/* Chat bubble right */}
      <rect x="110" y="100" width="80" height="36" rx="12" fill="#3B82F6" />
      <polygon points="190,118 200,126 186,122" fill="#3B82F6" />
      <rect x="120" y="112" width="50" height="4" rx="2" fill="white" opacity="0.7" />
      <rect x="120" y="120" width="35" height="4" rx="2" fill="white" opacity="0.5" />

      {/* Chat bubble left again */}
      <rect x="88" y="148" width="70" height="30" rx="12" fill="#8B5CF6" opacity="0.7" />
      <polygon points="88,164 78,172 92,168" fill="#8B5CF6" opacity="0.7" />
      <rect x="98" y="158" width="30" height="4" rx="2" fill="white" opacity="0.6" />
      <rect x="98" y="166" width="45" height="4" rx="2" fill="white" opacity="0.4" />

      {/* Connection dots */}
      <circle cx="140" cy="45" r="3" fill="#8B5CF6" opacity="0.3" />
      <circle cx="155" cy="38" r="2" fill="#3B82F6" opacity="0.3" />
      <circle cx="130" cy="188" r="2.5" fill="#8B5CF6" opacity="0.2" />

      {/* Typing indicator */}
      <circle cx="175" cy="155" r="2.5" fill="#3B82F6" opacity="0.4" />
      <circle cx="183" cy="155" r="2.5" fill="#3B82F6" opacity="0.6" />
      <circle cx="191" cy="155" r="2.5" fill="#3B82F6" opacity="0.8" />

      <defs>
        <linearGradient id="chatPerson1" x1="42" y1="72" x2="78" y2="108">
          <stop stopColor="#FBBF24" />
          <stop offset="1" stopColor="#F59E0B" />
        </linearGradient>
        <linearGradient id="chatPerson2" x1="202" y1="72" x2="238" y2="108">
          <stop stopColor="#34D399" />
          <stop offset="1" stopColor="#10B981" />
        </linearGradient>
      </defs>
    </svg>
  )
}

function BookingIllustration() {
  return (
    <svg viewBox="0 0 280 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
      {/* Calendar */}
      <rect x="55" y="25" width="170" height="140" rx="16" fill="white" stroke="#E5E7EB" strokeWidth="1.5" />
      <rect x="55" y="25" width="170" height="36" rx="16" fill="url(#calGrad)" />
      <rect x="55" y="45" width="170" height="16" fill="url(#calGrad)" />

      {/* Calendar header dots */}
      <circle cx="80" cy="43" r="4" fill="white" opacity="0.8" />
      <circle cx="140" cy="43" r="4" fill="white" opacity="0.8" />
      <circle cx="200" cy="43" r="4" fill="white" opacity="0.8" />

      {/* Calendar grid */}
      {[0, 1, 2, 3, 4].map((row) =>
        [0, 1, 2, 3, 4, 5, 6].map((col) => {
          const x = 70 + col * 21
          const y = 72 + row * 18
          const isSelected = (row === 1 && col >= 2 && col <= 5) || (row === 2 && col >= 0 && col <= 2)
          const isStart = row === 1 && col === 2
          const isEnd = row === 2 && col === 2
          return (
            <rect
              key={`${row}-${col}`}
              x={x}
              y={y}
              width="16"
              height="13"
              rx="4"
              fill={isSelected ? (isStart || isEnd ? "#3B82F6" : "#DBEAFE") : "#F9FAFB"}
              stroke={isSelected ? "#3B82F6" : "none"}
              strokeWidth={isStart || isEnd ? "1.5" : "0"}
            />
          )
        })
      )}

      {/* Checkmark badge */}
      <circle cx="225" cy="155" r="22" fill="url(#checkGrad)" />
      <path d="M214 155 L222 163 L236 147" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />

      {/* Small sparkles */}
      <circle cx="248" cy="135" r="3" fill="#10B981" opacity="0.4" />
      <circle cx="252" cy="148" r="2" fill="#10B981" opacity="0.3" />
      <circle cx="45" cy="80" r="2.5" fill="#3B82F6" opacity="0.2" />

      <defs>
        <linearGradient id="calGrad" x1="55" y1="25" x2="225" y2="61">
          <stop stopColor="#3B82F6" />
          <stop offset="1" stopColor="#8B5CF6" />
        </linearGradient>
        <linearGradient id="checkGrad" x1="203" y1="133" x2="247" y2="177">
          <stop stopColor="#10B981" />
          <stop offset="1" stopColor="#059669" />
        </linearGradient>
      </defs>
    </svg>
  )
}

function ReviewIllustration() {
  return (
    <svg viewBox="0 0 280 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
      {/* Review card */}
      <rect x="40" y="40" width="200" height="120" rx="16" fill="white" stroke="#E5E7EB" strokeWidth="1.5" />

      {/* Avatar in card */}
      <circle cx="75" cy="75" r="18" fill="url(#reviewPerson)" />

      {/* Name and text */}
      <rect x="100" y="65" width="60" height="6" rx="3" fill="#1F2937" opacity="0.7" />
      <rect x="100" y="77" width="40" height="4" rx="2" fill="#9CA3AF" />

      {/* Stars */}
      {[0, 1, 2, 3, 4].map((i) => (
        <g key={i} transform={`translate(${60 + i * 26}, 105)`}>
          <path
            d="M10 0 L12.35 7.26 L20 7.64 L14.12 12.24 L16.18 19.51 L10 15.4 L3.82 19.51 L5.88 12.24 L0 7.64 L7.65 7.26 Z"
            fill={i < 5 ? "#FBBF24" : "#E5E7EB"}
          />
        </g>
      ))}

      {/* Review text lines */}
      <rect x="60" y="132" width="140" height="4" rx="2" fill="#D1D5DB" />
      <rect x="60" y="140" width="100" height="4" rx="2" fill="#D1D5DB" />

      {/* Floating hearts/trust */}
      <g transform="translate(230, 50)">
        <path d="M10 18 C10 18 0 11 0 5.5 C0 2.5 2.5 0 5.5 0 C7.5 0 9 1 10 2.5 C11 1 12.5 0 14.5 0 C17.5 0 20 2.5 20 5.5 C20 11 10 18 10 18Z" fill="#F87171" opacity="0.8" />
      </g>
      <g transform="translate(245, 80) scale(0.7)">
        <path d="M10 18 C10 18 0 11 0 5.5 C0 2.5 2.5 0 5.5 0 C7.5 0 9 1 10 2.5 C11 1 12.5 0 14.5 0 C17.5 0 20 2.5 20 5.5 C20 11 10 18 10 18Z" fill="#F87171" opacity="0.5" />
      </g>

      {/* Confetti */}
      <rect x="30" y="35" width="8" height="3" rx="1.5" fill="#3B82F6" opacity="0.4" transform="rotate(-20 34 36)" />
      <rect x="240" y="140" width="8" height="3" rx="1.5" fill="#8B5CF6" opacity="0.4" transform="rotate(15 244 141)" />
      <circle cx="250" cy="45" r="3" fill="#FBBF24" opacity="0.5" />
      <circle cx="35" cy="150" r="2.5" fill="#10B981" opacity="0.4" />

      <defs>
        <linearGradient id="reviewPerson" x1="57" y1="57" x2="93" y2="93">
          <stop stopColor="#A78BFA" />
          <stop offset="1" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>
    </svg>
  )
}

const steps = [
  {
    title: "Najděte, co potřebujete",
    description:
      "Procházejte nabídky ve vašem okolí. Filtrujte podle kategorie, ceny nebo vzdálenosti a najděte přesně to, co hledáte.",
    illustration: <SearchIllustration />,
    accent: "blue",
  },
  {
    title: "Domluvte se s majitelem",
    description:
      "Napište majiteli přímo přes náš chat. Dohodněte se na termínu, předání a všech detailech ještě před rezervací.",
    illustration: <ChatIllustration />,
    accent: "violet",
  },
  {
    title: "Rezervujte a vyzvedněte",
    description:
      "Vytvořte rezervaci na požadované dny. Po schválení majitelem si předmět vyzvednete na domluveném místě.",
    illustration: <BookingIllustration />,
    accent: "emerald",
  },
  {
    title: "Vraťte a ohodnoťte",
    description:
      "Po skončení výpůjčky předmět vraťte a zanechte hodnocení. Pomůžete tak budovat důvěru v komunitě.",
    illustration: <ReviewIllustration />,
    accent: "amber",
  },
]

const accentColors: Record<string, { badge: string; number: string; border: string }> = {
  blue: { badge: "bg-blue-100 text-blue-700", number: "bg-blue-600 text-white", border: "border-blue-200" },
  violet: { badge: "bg-violet-100 text-violet-700", number: "bg-violet-600 text-white", border: "border-violet-200" },
  emerald: { badge: "bg-emerald-100 text-emerald-700", number: "bg-emerald-600 text-white", border: "border-emerald-200" },
  amber: { badge: "bg-amber-100 text-amber-700", number: "bg-amber-600 text-white", border: "border-amber-200" },
}

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-violet-50 pt-16 pb-12 sm:pt-24 sm:pb-16">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100/40 via-transparent to-transparent" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight mb-4">
              Jak to{" "}
              <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                funguje?
              </span>
            </h1>
            <p className="text-lg text-gray-500 leading-relaxed max-w-lg mx-auto">
              Čtyři jednoduché kroky vás dělí od sdílení věcí s vašimi sousedy.
            </p>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="py-12 sm:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto space-y-16 sm:space-y-24">
            {steps.map((step, index) => {
              const colors = accentColors[step.accent]
              const isReversed = index % 2 === 1
              return (
                <div
                  key={step.title}
                  className={`flex flex-col ${isReversed ? "md:flex-row-reverse" : "md:flex-row"} items-center gap-8 md:gap-16`}
                >
                  {/* Illustration */}
                  <div className={`w-full md:w-1/2 rounded-3xl border ${colors.border} bg-gradient-to-br from-gray-50/50 to-white p-4 sm:p-6`}>
                    {step.illustration}
                  </div>

                  {/* Content */}
                  <div className="w-full md:w-1/2">
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${colors.badge} text-xs font-semibold mb-4`}>
                      <span className={`w-5 h-5 rounded-full ${colors.number} flex items-center justify-center text-[11px] font-bold`}>
                        {index + 1}
                      </span>
                      Krok {index + 1}
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
                      {step.title}
                    </h2>
                    <p className="text-gray-500 leading-relaxed text-lg">
                      {step.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 sm:py-20 bg-gray-50/80 border-y border-gray-100">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-12">
              Proč sdílet s&nbsp;
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                SousedePůjč?
              </span>
            </h2>
            <div className="grid sm:grid-cols-3 gap-6">
              {[
                {
                  icon: Wallet,
                  title: "Ušetřete peníze",
                  description: "Proč kupovat věci, které použijete jednou? Půjčte si je za zlomek ceny.",
                  gradient: "from-blue-500 to-blue-600",
                },
                {
                  icon: Leaf,
                  title: "Šetřete planetu",
                  description: "Sdílením věcí snižujeme zbytečnou výrobu a odpad.",
                  gradient: "from-emerald-500 to-emerald-600",
                },
                {
                  icon: Users,
                  title: "Poznejte sousedy",
                  description: "Budujte komunitu a vztahy ve vašem okolí.",
                  gradient: "from-violet-500 to-violet-600",
                },
              ].map((benefit) => (
                <div
                  key={benefit.title}
                  className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all duration-300 group"
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${benefit.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <benefit.icon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{benefit.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">Připraveni začít?</h2>
            <p className="text-gray-500 mb-8">
              Zaregistrujte se zdarma a začněte půjčovat nebo nabízet věci ve vašem okolí.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-xl shadow-sm hover:shadow-md transition-all duration-300"
              >
                Vytvořit účet zdarma
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3 text-gray-600 font-medium rounded-xl border border-gray-200 hover:bg-gray-50 transition-all duration-300"
              >
                Procházet nabídky
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

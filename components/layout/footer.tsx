import Link from "next/link"
import { Package, Heart, Mail, MapPin, ArrowUpRight } from "lucide-react"

const footerLinks = {
  platform: {
    title: "Platforma",
    links: [
      { label: "Procházet předměty", href: "/" },
      { label: "Přidat předmět", href: "/items/new" },
      { label: "Jak to funguje", href: "/jak-to-funguje" },
    ],
  },
  legal: {
    title: "Právní informace",
    links: [
      { label: "Podmínky použití", href: "/terms" },
      { label: "Ochrana osobních údajů", href: "/privacy" },
    ],
  },
  account: {
    title: "Účet",
    links: [
      { label: "Přihlášení", href: "/login" },
      { label: "Registrace", href: "/register" },
      { label: "Můj profil", href: "/profile" },
    ],
  },
}

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="relative bg-gradient-to-b from-gray-50 to-gray-100 border-t">
      {/* Dekorativní horní okraj */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />

      <div className="container mx-auto px-4 pt-12 pb-8">
        {/* Hlavní grid patičky */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Sloupec značky */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="inline-flex items-center space-x-2 group mb-4">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-sm group-hover:shadow-md transition-all duration-300">
                <Package className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                SousedePůjč
              </span>
            </Link>
            <p className="text-sm text-gray-500 leading-relaxed mt-3 max-w-xs">
              Sdílej, půjčuj, šetři. Platforma pro půjčování věcí mezi sousedy ve vašem okolí.
            </p>
            <div className="flex items-center gap-1.5 mt-4 text-xs text-gray-400">
              <MapPin className="h-3.5 w-3.5" />
              <span>Česká republika</span>
            </div>
          </div>

          {/* Sloupce odkazů */}
          {Object.values(footerLinks).map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
                {section.title}
              </h3>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="group inline-flex items-center text-sm text-gray-500 hover:text-blue-600 transition-colors duration-200"
                    >
                      <span className="border-b border-transparent group-hover:border-blue-600/30 transition-colors duration-200">
                        {link.label}
                      </span>
                      <ArrowUpRight className="h-3 w-3 ml-1 opacity-0 -translate-y-0.5 translate-x-[-2px] group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all duration-200" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Oddělovač */}
        <div className="mt-10 pt-6 border-t border-gray-200/80">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-gray-400 order-2 sm:order-1">
              &copy; {currentYear} SousedePůjč. Všechna práva vyhrazena.
            </p>
            <div className="flex items-center gap-1 text-xs text-gray-400 order-1 sm:order-2">
              <span>Vytvořeno s</span>
              <Heart className="h-3 w-3 text-red-400 fill-red-400 animate-pulse" />
              <span>pro sousedy</span>
            </div>
            <Link
              href="mailto:podpora@sousedepujc.cz"
              className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-blue-600 transition-colors order-3"
            >
              <Mail className="h-3.5 w-3.5" />
              podpora@sousedepujc.cz
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

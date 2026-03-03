import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export const metadata = {
  title: "Zásady ochrany osobních údajů - SousedePůjč",
  description: "Zásady ochrany osobních údajů platformy SousedePůjč",
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-3xl px-4 py-12">
        <Link
          href="/register"
          className="inline-flex items-center text-sm text-blue-600 hover:underline mb-8"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Zpět na registraci
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Zásady ochrany osobních údajů</h1>
        <p className="text-sm text-gray-500 mb-10">Poslední aktualizace: 3. března 2026</p>

        <div className="space-y-10">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Správce osobních údajů</h2>
            <p className="text-gray-600 leading-relaxed">
              Správcem vašich osobních údajů je tým SousedePůjč, provozovatel platformy SousedePůjč (dále jen &quot;Platforma&quot;), která je dostupná na adrese sousedepujc.vercel.app.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Jaké údaje shromažďujeme</h2>
            <p className="text-gray-600 leading-relaxed mb-3">Při používání Platformy shromažďujeme následující osobní údaje:</p>

            <h3 className="text-base font-medium text-gray-800 mt-4 mb-2">Údaje poskytnuté přímo vámi</h3>
            <ul className="list-disc list-inside text-gray-600 leading-relaxed space-y-2">
              <li>Jméno a příjmení</li>
              <li>E-mailová adresa</li>
              <li>Profilová fotografie (volitelné)</li>
              <li>Informace o nabízených předmětech (popis, fotografie, cena, lokalita)</li>
              <li>Obsah zpráv v rámci chatu mezi uživateli</li>
              <li>Hodnocení a recenze</li>
            </ul>

            <h3 className="text-base font-medium text-gray-800 mt-4 mb-2">Údaje shromažďované automaticky</h3>
            <ul className="list-disc list-inside text-gray-600 leading-relaxed space-y-2">
              <li>IP adresa a informace o prohlížeči</li>
              <li>Datum a čas přístupu</li>
              <li>Informace o používání Platformy (navštívené stránky, interakce)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Účel zpracování</h2>
            <p className="text-gray-600 leading-relaxed mb-3">Vaše osobní údaje zpracováváme za těmito účely:</p>
            <ul className="list-disc list-inside text-gray-600 leading-relaxed space-y-2">
              <li>Vytvoření a správa vašeho uživatelského účtu</li>
              <li>Zprostředkování půjčování předmětů mezi uživateli</li>
              <li>Umožnění komunikace mezi uživateli prostřednictvím chatu</li>
              <li>Zasílání oznámení souvisejících s vaší aktivitou na Platformě (rezervace, zprávy)</li>
              <li>Zajištění bezpečnosti a prevence zneužití Platformy</li>
              <li>Zlepšování služeb a uživatelského zážitku</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Právní základ zpracování</h2>
            <p className="text-gray-600 leading-relaxed">Vaše údaje zpracováváme na základě:</p>
            <ul className="list-disc list-inside text-gray-600 leading-relaxed space-y-2 mt-3">
              <li><strong>Plnění smlouvy</strong> — zpracování nezbytné pro poskytování služeb Platformy (čl. 6 odst. 1 písm. b) GDPR).</li>
              <li><strong>Oprávněný zájem</strong> — zajištění bezpečnosti a zlepšování Platformy (čl. 6 odst. 1 písm. f) GDPR).</li>
              <li><strong>Souhlas</strong> — pro zasílání marketingových sdělení, pokud jste k tomu udělili souhlas (čl. 6 odst. 1 písm. a) GDPR).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Sdílení údajů</h2>
            <p className="text-gray-600 leading-relaxed">
              Vaše osobní údaje nesdílíme s třetími stranami za účelem marketingu. Údaje mohou být sdíleny pouze v následujících případech:
            </p>
            <ul className="list-disc list-inside text-gray-600 leading-relaxed space-y-2 mt-3">
              <li><strong>Ostatní uživatelé</strong> — vaše jméno, profilová fotografie a nabízené předměty jsou viditelné ostatním uživatelům Platformy.</li>
              <li><strong>Poskytovatelé služeb</strong> — využíváme služby třetích stran pro provoz Platformy (Supabase pro databázi a autentizaci, Vercel pro hosting, Brevo pro zasílání e-mailů).</li>
              <li><strong>Zákonné požadavky</strong> — pokud to vyžaduje zákon nebo soudní příkaz.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Uchovávání údajů</h2>
            <p className="text-gray-600 leading-relaxed">
              Vaše osobní údaje uchováváme po dobu trvání vašeho účtu na Platformě. Po zrušení účtu budou vaše údaje smazány do 30 dnů, s výjimkou údajů, které jsme povinni uchovávat na základě právních předpisů.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Zabezpečení údajů</h2>
            <p className="text-gray-600 leading-relaxed">
              K ochraně vašich osobních údajů používáme odpovídající technická a organizační opatření. Veškerá komunikace mezi vaším prohlížečem a Platformou je šifrována pomocí protokolu HTTPS. Hesla jsou ukládána v hashované podobě.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Vaše práva</h2>
            <p className="text-gray-600 leading-relaxed mb-3">V souladu s GDPR máte následující práva:</p>
            <ul className="list-disc list-inside text-gray-600 leading-relaxed space-y-2">
              <li><strong>Právo na přístup</strong> — můžete požádat o kopii svých osobních údajů.</li>
              <li><strong>Právo na opravu</strong> — můžete požádat o opravu nepřesných údajů.</li>
              <li><strong>Právo na výmaz</strong> — můžete požádat o smazání svých údajů.</li>
              <li><strong>Právo na omezení zpracování</strong> — můžete požádat o omezení zpracování vašich údajů.</li>
              <li><strong>Právo na přenositelnost</strong> — můžete požádat o export svých údajů ve strojově čitelném formátu.</li>
              <li><strong>Právo vznést námitku</strong> — můžete vznést námitku proti zpracování založenému na oprávněném zájmu.</li>
              <li><strong>Právo odvolat souhlas</strong> — udělený souhlas můžete kdykoli odvolat.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Soubory cookies</h2>
            <p className="text-gray-600 leading-relaxed">
              Platforma využívá pouze technicky nezbytné cookies pro zajištění správného fungování přihlášení a uživatelských relací. Nepoužíváme sledovací ani marketingové cookies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Změny těchto zásad</h2>
            <p className="text-gray-600 leading-relaxed">
              Tyto zásady můžeme příležitostně aktualizovat. O podstatných změnách vás budeme informovat prostřednictvím e-mailu nebo oznámení na Platformě. Doporučujeme tyto zásady pravidelně kontrolovat.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Kontakt</h2>
            <p className="text-gray-600 leading-relaxed">
              Pokud máte jakékoli dotazy ohledně zpracování vašich osobních údajů nebo chcete uplatnit svá práva, kontaktujte nás prostřednictvím chatu na Platformě.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-400">&copy; 2026 SousedePůjč. Všechna práva vyhrazena.</p>
        </div>
      </div>
    </div>
  )
}

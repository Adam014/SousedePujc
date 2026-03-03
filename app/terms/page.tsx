import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export const metadata = {
  title: "Podmínky použití - SousedePůjč",
  description: "Podmínky použití platformy SousedePůjč",
}

export default function TermsPage() {
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

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Podmínky použití</h1>
        <p className="text-sm text-gray-500 mb-10">Poslední aktualizace: 3. března 2026</p>

        <div className="space-y-10">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Úvodní ustanovení</h2>
            <p className="text-gray-600 leading-relaxed">
              Tyto podmínky použití (dále jen &quot;Podmínky&quot;) upravují práva a povinnosti uživatelů platformy SousedePůjč (dále jen &quot;Platforma&quot;), která slouží jako zprostředkovatel půjčování věcí mezi uživateli. Provozovatelem Platformy je tým SousedePůjč.
            </p>
            <p className="text-gray-600 leading-relaxed mt-3">
              Registrací na Platformě vyjadřujete souhlas s těmito Podmínkami. Pokud s nimi nesouhlasíte, Platformu prosím nepoužívejte.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Definice pojmů</h2>
            <ul className="list-disc list-inside text-gray-600 leading-relaxed space-y-2">
              <li><strong>Uživatel</strong> — každá fyzická osoba, která se zaregistruje na Platformě.</li>
              <li><strong>Půjčitel</strong> — uživatel, který nabízí svůj předmět k zapůjčení.</li>
              <li><strong>Vypůjčitel</strong> — uživatel, který si předmět půjčuje.</li>
              <li><strong>Předmět</strong> — věc nabízená k zapůjčení prostřednictvím Platformy.</li>
              <li><strong>Rezervace</strong> — závazná žádost vypůjčitele o zapůjčení předmětu na určité období.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Registrace a účet</h2>
            <p className="text-gray-600 leading-relaxed">
              Pro využívání služeb Platformy je nutná registrace. Při registraci jste povinni uvést pravdivé a aktuální údaje. Každý uživatel smí mít pouze jeden účet.
            </p>
            <p className="text-gray-600 leading-relaxed mt-3">
              Jste zodpovědní za zabezpečení svého účtu a hesla. V případě podezření na neoprávněný přístup k vašemu účtu nás neprodleně kontaktujte.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Pravidla půjčování</h2>
            <div className="space-y-3 text-gray-600 leading-relaxed">
              <p>Při používání Platformy se zavazujete dodržovat následující pravidla:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>Nabízet k zapůjčení pouze předměty, které vlastníte nebo k jejichž půjčování máte oprávnění.</li>
                <li>Uvádět pravdivý popis stavu předmětu včetně případných vad.</li>
                <li>Dodržovat sjednané termíny vyzvednutí a vrácení předmětu.</li>
                <li>Vrátit předmět ve stejném stavu, v jakém byl převzat (s přihlédnutím k běžnému opotřebení).</li>
                <li>Komunikovat s ostatními uživateli slušně a s respektem.</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Ceny a platby</h2>
            <p className="text-gray-600 leading-relaxed">
              Cenu za zapůjčení předmětu stanovuje půjčitel. Platforma slouží pouze jako zprostředkovatel a neprovádí finanční transakce mezi uživateli. Způsob platby si uživatelé dohodnou vzájemně.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Odpovědnost a škody</h2>
            <p className="text-gray-600 leading-relaxed">
              Platforma neodpovídá za stav půjčovaných předmětů, za škody vzniklé při půjčování ani za jednání jednotlivých uživatelů. Veškeré spory mezi uživateli řeší uživatelé vzájemně.
            </p>
            <p className="text-gray-600 leading-relaxed mt-3">
              Vypůjčitel odpovídá za škody způsobené na předmětu po dobu výpůjčky. Doporučujeme při předání předmět zdokumentovat (například fotografií).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Zakázaný obsah a chování</h2>
            <p className="text-gray-600 leading-relaxed mb-3">Na Platformě je zakázáno:</p>
            <ul className="list-disc list-inside text-gray-600 leading-relaxed space-y-2">
              <li>Nabízet předměty, jejichž půjčování je v rozporu se zákonem.</li>
              <li>Zveřejňovat nepravdivé, zavádějící nebo urážlivé informace.</li>
              <li>Obtěžovat ostatní uživatele nevyžádanými zprávami.</li>
              <li>Pokoušet se o neoprávněný přístup k účtům jiných uživatelů.</li>
              <li>Používat Platformu k jakémukoli protiprávnímu účelu.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Hodnocení a recenze</h2>
            <p className="text-gray-600 leading-relaxed">
              Uživatelé mohou po dokončení výpůjčky zanechat hodnocení. Hodnocení musí být pravdivé a věcné. Platforma si vyhrazuje právo odstranit hodnocení, která porušují tyto Podmínky.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Zrušení účtu</h2>
            <p className="text-gray-600 leading-relaxed">
              Svůj účet můžete kdykoli zrušit prostřednictvím nastavení profilu. Platforma si vyhrazuje právo zrušit nebo pozastavit účet uživatele, který porušuje tyto Podmínky.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Změny podmínek</h2>
            <p className="text-gray-600 leading-relaxed">
              Platforma si vyhrazuje právo tyto Podmínky kdykoli změnit. O podstatných změnách budou uživatelé informováni prostřednictvím e-mailu nebo oznámení na Platformě. Pokračováním v používání Platformy po změně Podmínek vyjadřujete souhlas s jejich novým zněním.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Závěrečná ustanovení</h2>
            <p className="text-gray-600 leading-relaxed">
              Tyto Podmínky se řídí právním řádem České republiky. V případě, že některé ustanovení těchto Podmínek bude shledáno neplatným, ostatní ustanovení zůstávají v platnosti.
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

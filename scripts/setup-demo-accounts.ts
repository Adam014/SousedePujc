import { createServerClient } from "../lib/supabase"

// Demo účty, které chceme nastavit
const DEMO_ACCOUNTS = [
  { email: "jan.novak@email.cz", password: "heslo123", name: "Jan Novák" },
  { email: "marie.svoboda@email.cz", password: "heslo123", name: "Marie Svoboda" },
  { email: "admin@community.cz", password: "admin123", name: "Admin" },
]

/**
 * Tento skript nastaví hesla pro demo účty v Supabase Auth
 * Spouštějte pouze jednou při inicializaci projektu nebo při změně hesel
 */
async function setupDemoAccounts() {
  const supabase = createServerClient()

  for (const account of DEMO_ACCOUNTS) {
    try {
      // Zkontrolujeme, zda uživatel již existuje v Supabase Auth
      const { data: existingUsers } = await supabase.auth.admin.listUsers({
        filters: {
          email: account.email,
        },
      })

      if (existingUsers && existingUsers.users.length > 0) {
        // Uživatel již existuje, aktualizujeme heslo
        const userId = existingUsers.users[0].id
        const { error } = await supabase.auth.admin.updateUserById(userId, {
          password: account.password,
        })

        if (error) {
          console.error(`Chyba při aktualizaci hesla pro ${account.email}:`, error.message)
        } else {
          console.log(`Heslo aktualizováno pro ${account.email}`)
        }
      } else {
        // Uživatel neexistuje, vytvoříme nového
        const { error } = await supabase.auth.admin.createUser({
          email: account.email,
          password: account.password,
          email_confirm: true, // Automaticky potvrdíme email
          user_metadata: {
            name: account.name,
          },
        })

        if (error) {
          console.error(`Chyba při vytváření uživatele ${account.email}:`, error.message)
        } else {
          console.log(`Uživatel vytvořen: ${account.email}`)
        }
      }
    } catch (error) {
      console.error(`Chyba při zpracování účtu ${account.email}:`, error)
    }
  }

  console.log("Nastavení demo účtů dokončeno")
}

// Spustíme skript
setupDemoAccounts()
  .catch(console.error)
  .finally(() => process.exit())

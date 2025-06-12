# Nastavení autentizace pro Sousedé Půjč

## Nastavení demo účtů v Supabase

Pro správné fungování autentizace je potřeba nastavit hesla pro demo účty v Supabase Auth.

### Prerekvizity

1. Mít nastavené proměnné prostředí:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (důležité pro admin operace)

### Postup

1. Spusťte následující příkaz pro nastavení demo účtů:

\`\`\`bash
npx tsx scripts/setup-demo-accounts.ts
\`\`\`

2. Skript vytvoří nebo aktualizuje následující demo účty:
   - jan.novak@email.cz (heslo: heslo123)
   - marie.svoboda@email.cz (heslo: heslo123)
   - admin@community.cz (heslo: admin123)

## Bezpečnostní doporučení

- V produkčním prostředí změňte hesla na silnější
- Service role key (`SUPABASE_SERVICE_ROLE_KEY`) nikdy nepoužívejte na klientské straně
- Zvažte implementaci dvoufaktorové autentizace pro administrátorské účty
\`\`\`

Toto řešení:
1. Využívá vestavěnou autentizaci Supabase místo vlastní implementace
2. Bezpečně ukládá hesla (Supabase používá bcrypt pro hashování)
3. Poskytuje skript pro nastavení demo účtů
4. Implementuje správné přihlášení a odhlášení
5. Zachovává kompatibilitu s existující databází uživatelů

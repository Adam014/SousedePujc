-- Přidání sloupce is_edited do tabulky chat_messages, pokud ještě neexistuje
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'chat_messages' AND column_name = 'is_edited'
    ) THEN
        ALTER TABLE chat_messages ADD COLUMN is_edited BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

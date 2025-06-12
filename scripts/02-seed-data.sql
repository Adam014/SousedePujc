-- Vložení základních dat

-- Kategorie
INSERT INTO categories (name, description, icon) VALUES
('Nářadí', 'Ruční a elektrické nářadí pro domácí práce', 'wrench'),
('Sportovní vybavení', 'Sportovní potřeby a vybavení', 'dumbbell'),
('Domácí spotřebiče', 'Elektrické spotřebiče pro domácnost', 'zap'),
('Zahradní technika', 'Sekačky, křovinořezy a další zahradní nástroje', 'leaf'),
('Elektronika', 'Fotoaparáty, projektory, audio technika', 'camera'),
('Doprava', 'Kola, koloběžky, přívěsy', 'bike'),
('Ostatní', 'Vše ostatní co se může hodit', 'package');

-- Přidám více kategorií a rozšířím existující data

-- Přidání více kategorií
INSERT INTO categories (name, description, icon) VALUES
('Hudební nástroje', 'Hudební nástroje a audio vybavení', 'music'),
('Kuchyňské spotřebiče', 'Mixéry, roboty, grily a další kuchyňské pomocníky', 'chef-hat'),
('Cestování', 'Kufry, batohy, cestovní doplňky', 'plane'),
('Dětské vybavení', 'Kočárky, autosedačky, hračky', 'baby'),
('Knihy a média', 'Knihy, filmy, hry', 'book'),
('Hobby a řemesla', 'Šicí stroje, malířské potřeby, řemeslné nástroje', 'palette'),
('Úklid a péče', 'Vysavače, parní čističe, žehličky', 'spray-can'),
('Party a oslavy', 'Stany, osvětlení, dekorace', 'party-popper');

-- Testovací uživatelé
INSERT INTO users (email, name, phone, address, is_verified, reputation_score) VALUES
('jan.novak@email.cz', 'Jan Novák', '+420 123 456 789', 'Hlavní 123, Praha 1', TRUE, 4.8),
('marie.svoboda@email.cz', 'Marie Svobodová', '+420 987 654 321', 'Krátká 45, Praha 1', TRUE, 4.9),
('petr.dvorak@email.cz', 'Petr Dvořák', '+420 555 123 456', 'Dlouhá 67, Praha 1', TRUE, 4.5),
('admin@community.cz', 'Administrátor', '+420 111 222 333', 'Úřední 1, Praha 1', TRUE, 5.0);

-- Nastavení admin práv
UPDATE users SET is_admin = TRUE WHERE email = 'admin@community.cz';

-- Testovací předměty
INSERT INTO items (owner_id, category_id, title, description, condition, daily_rate, deposit_amount, location, images) 
SELECT 
    u.id,
    c.id,
    'Aku vrtačka Bosch',
    'Výkonná aku vrtačka s příslušenstvím. Ideální pro domácí práce.',
    'very_good',
    50.00,
    500.00,
    'Praha 1',
    ARRAY['/placeholder.svg?height=300&width=400']
FROM users u, categories c 
WHERE u.email = 'jan.novak@email.cz' AND c.name = 'Nářadí';

INSERT INTO items (owner_id, category_id, title, description, condition, daily_rate, deposit_amount, location, images)
SELECT 
    u.id,
    c.id,
    'Horské kolo Trek',
    'Kvalitní horské kolo, velikost M. Pravidelně servisované.',
    'good',
    100.00,
    2000.00,
    'Praha 1',
    ARRAY['/placeholder.svg?height=300&width=400']
FROM users u, categories c 
WHERE u.email = 'marie.svoboda@email.cz' AND c.name = 'Doprava';

INSERT INTO items (owner_id, category_id, title, description, condition, daily_rate, deposit_amount, location, images)
SELECT 
    u.id,
    c.id,
    'Sekačka na trávu',
    'Benzínová sekačka s pojezdem. Perfektní pro větší zahrady.',
    'good',
    150.00,
    1000.00,
    'Praha 1',
    ARRAY['/placeholder.svg?height=300&width=400']
FROM users u, categories c 
WHERE u.email = 'petr.dvorak@email.cz' AND c.name = 'Zahradní technika';

-- Přidání více testovačích předmětů
INSERT INTO items (owner_id, category_id, title, description, condition, daily_rate, deposit_amount, location, images)
SELECT 
    u.id,
    c.id,
    'Digitální fotoaparát Canon',
    'Profesionální zrcadlovka s objektivy. Ideální pro svatby a události.',
    'excellent',
    200.00,
    5000.00,
    'Praha 2',
    ARRAY['/placeholder.svg?height=300&width=400']
FROM users u, categories c 
WHERE u.email = 'marie.svoboda@email.cz' AND c.name = 'Elektronika';

INSERT INTO items (owner_id, category_id, title, description, condition, daily_rate, deposit_amount, location, images)
SELECT 
    u.id,
    c.id,
    'KitchenAid mixér',
    'Výkonný planetární mixér pro pečení a vaření. Kompletní s nástavci.',
    'very_good',
    80.00,
    1500.00,
    'Praha 1',
    ARRAY['/placeholder.svg?height=300&width=400']
FROM users u, categories c 
WHERE u.email = 'petr.dvorak@email.cz' AND c.name = 'Kuchyňské spotřebiče';

-- Přidání testovacích rezervací
INSERT INTO bookings (item_id, borrower_id, start_date, end_date, status, total_amount, message)
SELECT 
    i.id,
    u.id,
    '2024-12-20',
    '2024-12-22',
    'pending',
    150.00,
    'Potřeboval bych na víkendový projekt, děkuji!'
FROM items i, users u
WHERE i.title = 'Aku vrtačka Bosch' AND u.email = 'marie.svoboda@email.cz';

INSERT INTO bookings (item_id, borrower_id, start_date, end_date, status, total_amount, message)
SELECT 
    i.id,
    u.id,
    '2024-12-15',
    '2024-12-17',
    'confirmed',
    300.00,
    'Na víkendovou cyklistiku, těším se!'
FROM items i, users u
WHERE i.title = 'Horské kolo Trek' AND u.email = 'jan.novak@email.cz';

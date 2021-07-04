CREATE TABLE IF NOT EXISTS markets (
    id INTEGER PRIMARY KEY,
    asset TEXT,
    base TEXT
);

INSERT INTO markets(id, asset, base) 
SELECT 1, 'bitcoin', 'usd'
WHERE NOT EXISTS(SELECT 1 FROM markets WHERE asset = 'bitcoin' AND base = 'usd');
INSERT INTO markets(id, asset, base) 
SELECT 2, 'ethereum', 'usd'
WHERE NOT EXISTS(SELECT 1 FROM markets WHERE asset = 'ethereum' AND base = 'usd');
INSERT INTO markets(id, asset, base) 
SELECT 3, 'cardano', 'usd'
WHERE NOT EXISTS(SELECT 1 FROM markets WHERE asset = 'cardano' AND base = 'usd');




CREATE TABLE IF NOT EXISTS minutely_prices (
    id INTEGER PRIMARY KEY,
    market INTEGER,
    condensed INTEGER, -- boolean. Alway true for minutely prices. Coingecko limitation
    date INTEGER,
    `timestamp` INTEGER,
    priceOpen INTEGER,
    priceClose INTEGER,
    priceBottom INTEGER,
    priceTop INTEGER
);


CREATE TABLE IF NOT EXISTS hourly_prices (
    id INTEGER PRIMARY KEY,
    market INTEGER,
    condensed INTEGER, -- boolean. True if data comes from CoinGecko's historical data. False if it was aggregated by us
    date INTEGER,
    `timestamp` INTEGER,
    priceOpen INTEGER,
    priceClose INTEGER,
    priceBottom INTEGER,
    priceTop INTEGER
);

CREATE TABLE IF NOT EXISTS daily_prices (
    id INTEGER PRIMARY KEY,
    market INTEGER,
    condensed INTEGER, -- boolean. True if data comes from CoinGecko's historical data. False if it was aggregated by us
    date INTEGER,
    `timestamp` INTEGER,
    priceOpen INTEGER,
    priceClose INTEGER,
    priceBottom INTEGER,
    priceTop INTEGER
);

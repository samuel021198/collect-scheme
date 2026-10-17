# Collect Scheme

給收藏家的寶可夢卡牌圖鑑。這個 MVP 有卡牌圖鑑、系列目錄、香港卡店、同好交換板，以及一個尚未開放的拍賣頁。

## 怎樣跑

```bash
npm install
npm run dev
```

瀏覽器打開 [http://127.0.0.1:43123](http://127.0.0.1:43123)。預設會依瀏覽器語言進入 `/zh` 或 `/en`，頁首可以切換 **EN** 和 **中文**。

```bash
npm test
npm run lint
```

## 環境變數

複製 `.env.example` 成 `.env.local`。

圖鑑同系列目錄在 `data/tcg/`。卡名、編號、系列代號同卡圖跟 TCG Collector 的國際版同日文系列，不列市價。寶可夢中文名用 `data/names/species-zh.json` 對到英文物種名，所以搜尋「噴火龍」會對上 Charizard。`POKEMONTCG_API_KEY` 不再用來搜圖鑑。

## 現在有什麼

- **卡牌搜尋**：只找一張卡。未搜尋時先顯示熱門卡。可以打卡名，或者「噴火龍 006/165」、「SV2a 006」呢類指定編號。英文卡同日文卡分開。同一編號如果有普通、閃卡、反向閃等外表，會在現有卡圖上蓋標記；日文卡另外連去官方卡表，不轉載那邊的圖。
- **系列搜尋**：只找系列。代號「SV2A」對上日文 151。英文卡同日文卡分開瀏覽。不列市價。
- **店舖（香港）**：MOONROAD 信和 246、Bengal TCG、PikaBox、Card Holo。地址整理自各店公開頁面，出門前請再確認。
- **交換**：用瀏覽器裡的暱稱刊登收購或出讓，標一張卡，並在貼文下留言。沒有帳號密碼。貼文寫進 `data/trades.local.json`（已 gitignore）。刪掉那個檔案就回到兩則示範貼文。
- **拍賣**：只有「即將推出」頁，不能出價。

交換板寫明交易由雙方自行進行。Collect Scheme 不收款、不保管卡、不運送。

## 之後再做

- 語言：在 `src/i18n/routing.ts` 加上 `ja`、`zh-Hans`，並新增 `messages/ja.json`、`messages/zh-Hans.json`，以及 `data/names/ja.json`。`src/i18n/request.ts` 的 catalogs 要一併補上。
- 中文名：寶可夢物種名在 `data/names/species-zh.json`（英文名對繁中）。訓練家卡如果對不上，會繼續顯示英文名。
- 資料庫：現在的貼文是單機 JSON。要換 Supabase 或 Postgres 時，把 `src/lib/trades.ts` 換成資料表 `trade_posts`、`trade_replies`，暱稱改成 Supabase Auth。店舖可以放進 `shops`。卡名對照可以放 `card_names(card_id, locale, name)`。Prisma 可以指到同一套 Postgres，這個 MVP 刻意沒有裝它，避免本機還要編 native engine。
- 更多城市、真實拍賣、價格、個人卡冊。

## English

Collect Scheme is a collector's encyclopedia for the Pokémon TCG. This MVP ships a card catalog, a set index, Hong Kong shops, a peer-to-peer trade board, and an auction page that is not open.

### Run

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:43123](http://127.0.0.1:43123). The first visit follows the browser language (`/zh` or `/en`). The header switches **EN** and **中文**.

```bash
npm test
npm run lint
```

### Environment

Copy `.env.example` to `.env.local`.

The encyclopedia and set index live in `data/tcg/`. Names, numbers, set codes, and scans follow TCG Collector's international and Japanese indexes. Prices are not included. Chinese Pokémon names come from `data/names/species-zh.json`, so searching 噴火龍 matches Charizard. `POKEMONTCG_API_KEY` is no longer used for search.

### What works now

- **Card search**: finds one card. Popular cards stay at the front until you search. A name, or a name plus a number such as `Charizard 006/165` or `SV2a 006`, narrows to that card. English and Japanese prints are separate. When one number exists as a non-holo, holo, reverse holo, or another finish, that finish is stamped on the scan we already have. Japanese cards also link to the official search; those photos are not copied.
- **Set search**: finds an expansion. The code SV2A matches Japanese 151. English and Japanese sets are browsed separately. Prices are not included.
- **Shops (HK)**: MOONROAD Sino Centre 246, Bengal TCG, PikaBox, Card Holo. Addresses are copied from the shops' public pages. Confirm hours before you visit.
- **Trade**: pick a nickname stored in the browser, post a buy or sell tagged to a card, and reply on the thread. There is no password. New posts go to `data/trades.local.json` (gitignored). Delete that file to return to the two demo posts.
- **Auction**: a coming-soon page only. Bidding is disabled.

The trade board says deals are peer-to-peer. Collect Scheme does not take payment, hold cards, or ship.

### Later

- Locales: add `ja` and `zh-Hans` to `src/i18n/routing.ts`, then add `messages/<locale>.json`, `data/names/<locale>.json`, and an entry in `src/i18n/request.ts`.
- Chinese names: Pokémon species live in `data/names/species-zh.json` (English name to Traditional Chinese). Trainer cards that do not match stay in English.
- Database: posts are a single-process JSON file. For Supabase or Postgres, replace `src/lib/trades.ts` with `trade_posts` and `trade_replies`, and replace the nickname with Supabase Auth. Shops can move to a `shops` table. Names can move to `card_names(card_id, locale, name)`. Prisma can point at that same Postgres. This MVP skips Prisma so `npm run dev` does not need a native engine.
- More cities, a real auction, prices, and personal binders.

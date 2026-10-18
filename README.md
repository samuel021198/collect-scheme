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

複製 `.env.example` 成 `.env.local`。帳戶同卡簿一定要 `DATABASE_URL`（Neon Postgres）。未設定時，交換貼文同搜尋次數先會退回本機 JSON。

圖鑑同系列目錄在 `data/tcg/`。卡名、編號、系列代號同卡圖跟 TCG Collector 的國際版同日文系列，不列市價。寶可夢中文名用 `data/names/species-zh.json` 對到英文物種名，所以搜尋「噴火龍」會對上 Charizard。`POKEMONTCG_API_KEY` 不再用來搜圖鑑。

## 現在有什麼

- **卡牌搜尋**：只找一張卡。打字時會即時列出相關卡牌同系列。未搜尋時顯示近兩個星期呢個語言搜得最多嘅卡。可以打卡名，或者「噴火龍 006/165」、「SV2a 006」呢類指定編號。完整結果仍然可以分英文卡同日文卡。每張卡嘅版本跟該卡實際印過嘅清單（普通、反向閃、宇宙閃、印章），冇印過就唔會加。標記蓋喺現有卡圖上；日文卡另外連去官方卡表，不轉載那邊的圖。
- **系列搜尋**：只找系列。代號「SV2A」對上日文 151。英文卡同日文卡分開瀏覽。不列市價。
- **店舖（香港）**：MOONROAD 信和 246、Bengal TCG、PikaBox、Card Holo。地址整理自各店公開頁面，出門前請再確認。
- **帳戶**：電郵同密碼註冊、登入、登出。Session 放喺 httpOnly cookie。一定要 `DATABASE_URL`。
- **收藏**：記錄你實際擁有嘅卡。每筆有狀態（Raw / PSA / BGS / CGC / TAG）同分數，同一狀態會合併數量。首頁有總張數、卡種、原卡同鑑定數，以及擁有最多嘅寶可夢。
- **卡簿**：用 3×3、4×3 或 4×4 格子排卡。放入卡簿時如果收藏未有呢張，要先填狀態。拖卡可以換位。由格子取出唔會刪收藏。
- **交換**：用瀏覽器裡的暱稱刊登收購或出讓，標一張卡，並在貼文下留言。有 `DATABASE_URL` 時，貼文同搜尋次數寫入 Neon Postgres。未設定時仍然寫入 `data/trades.local.json`（已 gitignore）。
- **拍賣**：只有「即將推出」頁，不能出價。

交換板寫明交易由雙方自行進行。Collect Scheme 不收款、不保管卡、不運送。

## 之後再做

- 語言：在 `src/i18n/routing.ts` 加上 `ja`、`zh-Hans`，並新增 `messages/ja.json`、`messages/zh-Hans.json`，以及 `data/names/ja.json`。`src/i18n/request.ts` 的 catalogs 要一併補上。
- 中文名：寶可夢物種名在 `data/names/species-zh.json`（英文名對繁中）。訓練家卡如果對不上，會繼續顯示英文名。
- 更多城市、真實拍賣、價格。卡簿之後可以加公開連結。BGS 子分數同 TAG 1000 分制未做。

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

Copy `.env.example` to `.env.local`. Accounts and binders need `DATABASE_URL` (Neon Postgres). Without it, only trade posts and search counts fall back to local JSON.

The encyclopedia and set index live in `data/tcg/`. Names, numbers, set codes, and scans follow TCG Collector's international and Japanese indexes. Prices are not included. Chinese Pokémon names come from `data/names/species-zh.json`, so searching 噴火龍 matches Charizard. `POKEMONTCG_API_KEY` is no longer used for search.

### What works now

- **Card search**: finds one card. Related cards and sets appear while you type. Before a search, the shelf shows the cards people looked up most in the last two weeks in that language. A name, or a name plus a number such as `Charizard 006/165` or `SV2a 006`, narrows to that card. The full result list can still be limited to one print. Printings follow the list recorded for that exact card (non-holo, reverse holo, cosmos, stamp). A printing that was not made is not added. The mark is stamped on the scan we already have. Japanese cards also link to the official search; those photos are not copied.
- **Set search**: finds an expansion. The code SV2A matches Japanese 151. English and Japanese sets are browsed separately. Prices are not included.
- **Shops (HK)**: MOONROAD Sino Centre 246, Bengal TCG, PikaBox, Card Holo. Addresses are copied from the shops' public pages. Confirm hours before you visit.
- **Account**: register, log in, and log out with email and password. The session is an httpOnly cookie. `DATABASE_URL` is required.
- **Collection**: records cards you actually own, with condition (Raw / PSA / BGS / CGC / TAG) and grade. The same condition stacks quantity. The page shows copy count, distinct cards, raw versus graded, and the Pokémon you own the most.
- **Binders**: pages of 3×3, 4×3, or 4×4 slots. Adding a card to a binder also adds it to the collection when it is not there yet. Drag a card to another slot to swap. Taking a card out of a slot does not delete the collection row.
- **Trade**: pick a nickname stored in the browser, post a buy or sell tagged to a card, and reply on the thread. With `DATABASE_URL`, posts and search counts go to Neon Postgres. Without that variable, posts stay in `data/trades.local.json` (gitignored).
- **Auction**: a coming-soon page only. Bidding is disabled.

The trade board says deals are peer-to-peer. Collect Scheme does not take payment, hold cards, or ship.

### Later

- Locales: add `ja` and `zh-Hans` to `src/i18n/routing.ts`, then add `messages/<locale>.json`, `data/names/<locale>.json`, and an entry in `src/i18n/request.ts`.
- Chinese names: Pokémon species live in `data/names/species-zh.json` (English name to Traditional Chinese). Trainer cards that do not match stay in English.
- More cities, a real auction, and prices. Binders can later add a public link. BGS subgrades and the TAG 1000-point score are not stored yet.

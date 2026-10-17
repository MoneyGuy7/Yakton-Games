# Yakton Games

A single page of browser games, served by a Cloudflare Worker at https://games.yakton.net.

Games: Heli Duel (1v1 dogfight vs a bot or a friend, mouse aim, WASD, rockets, touch controls, `public/new.js`), Heli Royale (battle royale, `public/royal.js`), Chess (vs computer, two players, or online with a room code), Pizza Clicker, Traffic Racer (`public/retouch.js`; Subway Rush (obstacles close together, ramps up onto train roofs) is in `public/subway.js`), Cube Dash (Geometry Dash style, 3 levels with ship and gravity-flip modes, pads, orbs, saws, coins, practice mode and cube colors, `public/cubedash.js`), Block Drop, Pizza Rush (city delivery with traffic, tips and a Garage, `public/pizzarush.js`), Flappy Pizza, Brick Breaker, Jungle Dash (side-scrolling temple runner with a boulder chasing you and moving hazards, `public/jungle.js`), Void Run (Run 3 style four-wall tunnel: run on the floor, walls and ceiling, `public/voidrun.js`), Drift King (Drift Boss style with a smooth difficulty curve, color themes, tire marks and a gem Garage for upgrades and cars, `public/drift.js`), Road Hop (Crossy Road style, in `public/roadhop.js`), Link Blast (connect-the-dots shooter, `public/linkblast.js`), Sudoku (three difficulties, notes, hints, `public/puzzles.js`), Connect 4 (computer, two players, or online with a room code, `public/puzzles.js`), Solitaire (Klondike, draw 1 or 3, undo), Lights Out, Slide Puzzle, Slope Run (endless rolling ball, `public/action.js`), Pixel Hopper (8 platformer levels plus Endless mode, `public/action.js`), Candy Snip (cut-the-rope physics, 18 levels, tutorial, no timer, green-glow hints, `public/action.js`), Snake, Reaction Time, 2048, Memory Match, Minesweeper, Tic-Tac-Toe.

## Admin panel

Open `/admin` (there is an "Admin" button at the bottom of the site and on the downtime screen).

1. Set the password: Cloudflare dashboard > Workers & Pages > yakton-games > Settings > Variables and Secrets > add `ADMIN_PASSWORD` (type Secret). Or run `npx wrangler secret put ADMIN_PASSWORD`. Do not put it in `wrangler.jsonc`.
2. Deploy. The `STATE` Durable Object and the `v3` migration are created on the next deploy.
3. Log in. Five wrong tries from one IP locks that IP out for 5 minutes. A login lasts 12 hours.

What it does:
- **Downtime.** One button puts the whole site (pages, rooms, lobbies) behind a downtime screen, with an optional message. You can still browse the site while logged in. Visitors who already have the site open see a banner.
- **Warning notice.** First-time visitors see a warning (icon, your text, Accept). Edit the text, turn it on or off, and choose whether people who already accepted see it again, in the admin panel.
- **Feedback.** Visitors send feedback from the Feedback tab beside any game, the Feedback button under it, or the link above the categories. In the admin panel you can filter it by game, delete entries, and download everything as CSV or text (game, feedback, name, date). Stored in the STATE Durable Object (max 2000 entries, 5 per visitor per 10 minutes).
- **Coins and unlocks.** Add, set or zero the coins/gems/cash of every game that has them, max the Drift King and Pizza Rush Garages, beat every Cube Dash level (all cube colors), unlock all Pixel Hopper and Candy Snip levels, clear high scores, or reset data. Game saves live in the browser, so these changes apply to the browser you use the panel in.

## Deploy from GitHub

1. Create a GitHub repo and push this folder to it.
2. In the Cloudflare dashboard: Workers & Pages > Create > Import a repository, and pick the repo.
3. Leave the build command empty. Set the deploy command to `npx wrangler deploy`.
4. Every push to the main branch now deploys. The `routes` entry in `wrangler.jsonc` attaches
   games.yakton.net (the yakton.net zone must be on your Cloudflare account).

## Sound and settings

`public/site.js` has the sound engine (`SFX.play("hop")`, no audio files needed) and the Settings panel (sound on or off, volume, press M to mute). Settings are saved in the browser.

## Run locally

    npm install
    npm run dev

## Add a game

Write a function `myGame(el)` that draws into `el` (see `public/more.js`), and add an entry to the `G` list in `public/boot.js`.
Use `st("text")` for the status line and `best(id, score)` to keep a local high score.
Return a cleanup function if you start timers.

## Heli Royale rooms

Heli Royale lobbies (up to 8 pilots) use a second Durable Object, `Arena`, reached at `/arena/ROOMCODE`. The `ARENAS` binding and the `v2` migration in `wrangler.jsonc` create it on the next deploy. The first pilot in is the host: their browser runs the bots, the storm and the crates, and the server only relays messages.

## Online chess

Online games use a Durable Object (`Room` in `src/index.js`) that relays moves between two players with the same room code. The `durable_objects` and `migrations` entries in `wrangler.jsonc` set it up on the first deploy.

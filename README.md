# Yakton Games

A single page of browser games, served by a Cloudflare Worker at https://games.yakton.net.

Games: Heli Royale (battle royale, `public/royal.js`), Chess (vs computer, two players, or online with a room code), Pizza Clicker, Traffic Racer (Subway Rush is in `public/subway.js`), Cube Dash (Geometry Dash style, 3 levels with ship and gravity-flip modes, pads, orbs, saws, coins, practice mode and cube colors, `public/cubedash.js`), Block Drop, Pizza Rush (city delivery with traffic, tips and a Garage, `public/pizzarush.js`), Flappy Pizza, Brick Breaker, Jungle Dash (side-scrolling temple runner with a boulder chasing you, `public/jungle.js`), Void Run (Run 3 style, `public/voidrun.js`), Drift King (Drift Boss style with a gem Garage for upgrades and cars, `public/drift.js`), Road Hop (Crossy Road style, in `public/roadhop.js`), Link Blast (connect-the-dots shooter, `public/linkblast.js`), Snake, Reaction Time, 2048, Memory Match, Minesweeper, Tic-Tac-Toe.

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

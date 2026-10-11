# Yakton Games

A single page of browser games, served by a Cloudflare Worker at https://games.yakton.net.

Games: Chess (vs computer, two players, or online with a room code), Pizza Clicker, Traffic Racer, Cube Dash, Block Drop, Pizza Rush, Flappy Pizza, Brick Breaker, Road Hop, Snake, Reaction Time, 2048, Memory Match, Minesweeper, Tic-Tac-Toe.

## Deploy from GitHub

1. Create a GitHub repo and push this folder to it.
2. In the Cloudflare dashboard: Workers & Pages > Create > Import a repository, and pick the repo.
3. Leave the build command empty. Set the deploy command to `npx wrangler deploy`.
4. Every push to the main branch now deploys. The `routes` entry in `wrangler.jsonc` attaches
   games.yakton.net (the yakton.net zone must be on your Cloudflare account).

## Run locally

    npm install
    npm run dev

## Add a game

Write a function `myGame(el)` that draws into `el` (see `public/more.js`), and add an entry to the `G` list in `public/boot.js`.
Use `st("text")` for the status line and `best(id, score)` to keep a local high score.
Return a cleanup function if you start timers.

## Online chess

Online games use a Durable Object (`Room` in `src/index.js`) that relays moves between two players with the same room code. The `durable_objects` and `migrations` entries in `wrangler.jsonc` set it up on the first deploy.

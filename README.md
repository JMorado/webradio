# PomboRadio

A small internet radio station run from a home Mac: AutoDJ plays music 24/7,
and friends can jump in and go live whenever they want.

- 🎧 **Listen:** https://pomboradio.pages.dev
- 📻 **Station page:** see [docs/LISTENING.md](docs/LISTENING.md)
- 🎙️ **Going live as a DJ:** see [docs/DJ-GUIDE.md](docs/DJ-GUIDE.md)
- 🛠️ **Running / restarting the whole thing:** see [docs/OPERATOR-GUIDE.md](docs/OPERATOR-GUIDE.md)

## What this is

| Piece | What it does | Runs on |
|---|---|---|
| [AzuraCast](https://www.azuracast.com/) | The actual radio server: AutoDJ, music library, Icecast stream, DJ/streamer accounts | This Mac, in Docker |
| Cloudflare Quick Tunnel (`cloudflared`) | Makes the station reachable over HTTPS from the internet, without opening router ports | This Mac |
| This website (`site/`) | A minimal public page with a play button and live "now playing" info | [Cloudflare Pages](https://pages.cloudflare.com/) (free, always-on, separate from the Mac) |

```
listener's browser
   │
   ├── loads the website ───────────────► Cloudflare Pages (pomboradio.pages.dev)
   │                                              │
   └── plays audio / reads now-playing ───────────┘
                     │
                     ▼
         Cloudflare Quick Tunnel (https://*.trycloudflare.com)
                     │
                     ▼
         AzuraCast in Docker, on this Mac
         (Icecast stream + AutoDJ + Liquidsoap)
```

The **website** is hosted for free and permanently on Cloudflare Pages — it's
always reachable. The **radio stream itself** still depends on this Mac being
on, awake, and connected to the internet, and on the Cloudflare Tunnel
process staying up. See [docs/OPERATOR-GUIDE.md](docs/OPERATOR-GUIDE.md) for
what to do after a reboot, and its known limitations.

## Repo layout

```
radio-setup-plan.md   the original step-by-step setup plan for this project
site/                 the public website (static HTML/CSS/JS, deployed to Cloudflare Pages)
docs/                 guides for listeners, DJs, and whoever operates the Mac
```

## Important: this repo is public

Don't commit passwords, API tokens, or `.env` files with real secrets here.
Station/DJ credentials are shared privately (chat, password manager), never
in this repo.

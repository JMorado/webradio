# PomboRadio

PomboRadio is an independent internet radio station from Montouro. AutoDJ
keeps the music going between sets from guest DJs.

- [Listen to PomboRadio](https://pomboradio.pages.dev/)
- [See the programme schedule](https://pomboradio.pages.dev/#programacao)
- [Read the listener guide](docs/LISTENING.md)
- [Broadcast a guest set](docs/DJ-GUIDE.md)
- [Manage the programme schedule](docs/PROGRAMACAO.md)
- [Run the station and deploy the website](docs/OPERATOR-GUIDE.md)

## How it works

| Component | Role | Where it runs |
| --- | --- | --- |
| Cloudflare Pages | Listener site, programme admin and schedule API | Cloudflare |
| Cloudflare D1 | Programme entries and admin sessions | Cloudflare |
| AzuraCast | AutoDJ, live audio, track metadata and DJ accounts | The station Mac, in Docker |
| Cloudflare Quick Tunnel | Public HTTPS access to AzuraCast | The station Mac |

The homepage, schedule and programme editor are hosted separately from the
stream. The audio, track metadata and Web DJ depend on the Mac and its tunnel
being online.

## Develop and publish

Follow the [local setup](docs/PROGRAMACAO.md#pré-visualização-local) to run
the site, Pages Functions and a local D1 database together. The local site
runs at [127.0.0.1:8789](http://127.0.0.1:8789/). Pushes to `main` deploy
to Cloudflare Pages via GitHub Actions.

```text
site/           Homepage, player, schedule, admin panel and Web DJ redirect
functions/      Public schedule and authenticated admin API
lib/            Schedule processing and HTTP helpers
migrations/     D1 schema migrations
docs/           Listener, DJ, programme admin and operator guides
```

The repository is public. Keep DJ credentials, Cloudflare tokens and
`ADMIN_ACCESS_KEY` in private storage. Wrangler's local database and
secret files are ignored by Git.

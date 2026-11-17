# Listening to PomboRadio

No app, no account, no download needed — it plays straight from your browser.

## Easiest way

1. Open **https://pomboradio.pages.dev**
2. Press the big play button (▶) in the middle of the page.
3. That's it. You'll hear whatever is on air: AutoDJ playing music automatically,
   or a friend broadcasting live if someone's on.

The little dot next to "NO AR" (on air) turns orange and pulses when the
station is live, and the line underneath shows the current song (or the name
of whoever is live-DJing).

## If the website is ever down

The website (`pomboradio.pages.dev`) is hosted separately and should always be
reachable. If it's down, or you want to check the stream directly, ask
whoever runs the station for:

- the current **station page** link (something like
  `https://<random-words>.trycloudflare.com/public/pomboradio`)
- or the direct **stream link** (ends in `/listen/pomboradio/radio.mp3`),
  which you can paste into any audio player (VLC, browser, etc.)

That link changes whenever the station's tunnel gets restarted — see
[OPERATOR-GUIDE.md](OPERATOR-GUIDE.md) for why.

## Nothing plays / "offline"

A few things to try, in order:

1. **Refresh the page** — sometimes the "now playing" info is just a few
   seconds behind.
2. **Check with the station operator** that the Mac running the station is
   on and connected (see the limitations in
   [OPERATOR-GUIDE.md](OPERATOR-GUIDE.md)).
3. If you have an **old link saved**, it may have expired — ask for the
   current one, since the public tunnel link changes on restart.

## Can I request a song or chat?

Not yet — this is intentionally bare-bones. If that'd be fun, ask the
operator; AzuraCast supports a request system that could be turned on later.

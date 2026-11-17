# Going live as a DJ

Anyone can be a guest DJ on PomboRadio, straight from a browser tab — no
software to install. This is called "Web DJ".

## 1. Get an account

Ask whoever runs the station (currently João / `pombo`) to create you a DJ
account. You'll get:

- a **username**
- a **password**

These are sent to you privately (chat, not email/public channels) — don't
share them or post them anywhere.

## 2. Open the Web DJ page

Ask the operator for the current link — it looks like:

```
https://<current-tunnel>.trycloudflare.com/public/pomboradio/dj
```

(The `<current-tunnel>` part changes whenever the station restarts, so
always ask for the latest link rather than reusing an old one.)

## 3. Log in and go live

1. Open the link above in **Chrome or Firefox** (Safari can be flaky with
   this kind of browser streaming).
2. **Wear headphones.** If you use your laptop speakers, the mic will pick
   up the stream and cause an echo/feedback loop for everyone listening.
3. Log in with your username and password.
4. Allow microphone access when the browser asks — this only works because
   the page is HTTPS (that's what the tunnel is for).
5. Hit the on-air / broadcast button. You should see a "connected" /
   "streaming" indicator.
6. Talk, play music into your mic (e.g. hold a phone speaker up to your
   mic, or route audio through a mixer if you have one), whatever you like.

While you're live, **you replace the AutoDJ** — listeners hear you directly.

## 4. When you're done

Just close the tab / stop broadcasting. The AutoDJ picks back up
automatically within a few seconds — you don't need to tell anyone or clean
anything up.

## Rules of thumb

- **Only one DJ can be live at a time.** If someone else is already on,
  wait your turn.
- If your connection is shaky, the stream may stutter or drop — that's a
  limitation of browser-based streaming over an upload connection, not
  something you're doing wrong.
- If you can't get mic access to work, double-check the browser's site
  permissions (padlock icon in the address bar → Microphone → Allow).

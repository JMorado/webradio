# Operator guide (running the Mac side of things)

This is for whoever administers the actual station — right now, that's
João, on his Mac.

## The moving parts, and where they live

| Thing | Where | Started with |
|---|---|---|
| Docker Desktop | this Mac | `open -a Docker` |
| AzuraCast (radio server) | `~/azuracast`, running in Docker | `cd ~/azuracast && ./docker.sh start` (or `docker compose up -d`) |
| Cloudflare Quick Tunnel | this Mac, its own terminal/process | `cloudflared tunnel --url http://localhost:80` |
| Keep-awake | this Mac, its own terminal/process | `caffeinate -d` |
| Website | Cloudflare Pages (not on this Mac) | `npx wrangler pages deploy site --project-name=pomboradio` from the `radio` repo |

The website is independent of the Mac (always up). Everything else
(the actual stream) needs the Mac on, awake, and online, plus the tunnel
process alive.

## Restarting everything after a reboot

```bash
open -a Docker                                  # wait until Docker is fully up
cd ~/azuracast && ./docker.sh start              # or: docker compose up -d
cloudflared tunnel --url http://localhost:80     # leave this running in its own terminal
caffeinate -d                                    # leave this running too, in another terminal
```

`cloudflared` will print a **new** `https://<random-words>.trycloudflare.com`
URL every time. You then have to update it in two places, or listeners/DJs
will be sent to a dead stream and the website's live indicator will stop
working:

1. **AzuraCast → Administration → System Settings → Site Base URL** — paste
   the new tunnel URL, make sure **Use Web Proxy for Radio** is still on, save.
2. **`site/config.js`** in this repo — update `STATION_BASE_URL` to the new
   tunnel URL, then redeploy the website:
   ```bash
   cd ~/Workspace/repos/radio
   npx wrangler pages deploy site --project-name=pomboradio --branch=main
   git add -A && git commit -m "Update tunnel URL" && git push
   ```

After changing the base URL in AzuraCast, restart the station so it picks it up:
```bash
docker exec azuracast azuracast_cli azuracast:radio:restart 1
```

## Managing DJ accounts

Easiest: AzuraCast admin → your station → **Streamers / DJs** → Add
Streamer. Fill in username, display name, a strong password, and make sure
**Account is Active** is checked and the station has **Allow Streamers/DJs**
turned on (Station Profile settings).

Give the DJ their username/password **privately** (chat, password manager —
never in this repo or any public place), plus a link to
[docs/DJ-GUIDE.md](DJ-GUIDE.md).

## Adding music

Either:
- **Web UI:** AzuraCast → Media Files → Upload, drag in MP3s, then add them
  to a playlist (Playlists → your playlist → Media tab) and make sure the
  playlist is enabled.
- **Faster for a big batch:** copy files straight into the container and
  resync, e.g.:
  ```bash
  docker cp /path/to/mp3s/. azuracast:/var/azuracast/stations/pomboradio/media/
  docker exec azuracast azuracast_cli azuracast:media:sync 1
  ```
  You still need to add the new files to a playlist afterwards (UI, or see
  "Known quirks" below for the SQL shortcut used during initial setup).

## Known quirks we hit while setting this up

- **A brand-new station doesn't start automatically.** AzuraCast marks a
  station as "not started" until someone restarts/reloads it once (normally
  by clicking Restart in the dashboard, or via the API `POST
  /station/{id}/restart`). If `docker exec azuracast azuracast_cli
  azuracast:radio:restart` logs `Station has not started yet.` /
  `Supervisor fault: BAD_NAME`, that's why — restart it once via the web UI
  (Station → Restart Services) and it'll stick.
- **Some networks block `*.trycloudflare.com` DNS** (we saw this on a
  university/campus network). If the tunnel URL won't resolve, try it from
  a public DNS resolver (`dig @1.1.1.1 <url>`) or a different network before
  assuming the tunnel is broken.
- **New media isn't automatically added to a playlist** — media sync only
  registers files in the library; you still need to assign them to an
  enabled playlist.

## Security notes

- The Cloudflare Tunnel forwards **everything** on port 80, including the
  AzuraCast admin login and DJ streamer login — not just the public
  stream. The tunnel URL is long and random, but treat it as semi-public:
  don't post it anywhere public, and use strong passwords for admin/DJ
  accounts.
- Don't commit `.env`, `azuracast.env`, or any real credentials to this
  (public) repo.

## Not set up yet (possible future work)

- **Auto-deploy via GitHub Actions**: currently the website is deployed
  manually with `wrangler pages deploy`. A GitHub Actions workflow using a
  `CLOUDFLARE_API_TOKEN` secret could auto-deploy on every push to `main`
  instead.
- **Self-hosted GitHub Actions runner on this Mac**: would let pushes to
  this repo also trigger `docker compose pull && up -d` / restarts locally
  for the AzuraCast config itself (not just the website). Not configured
  yet — would need a registered runner service on this Mac.
- **A permanent (non-Quick) Cloudflare Tunnel**: requires owning a domain
  added to your Cloudflare account. Would remove the "URL changes on
  restart" problem entirely. Not done since there's no domain yet.

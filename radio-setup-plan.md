# Plan: Run an AzuraCast internet radio on this Mac and open it to friends

## Goal
Set up an online radio station on this Mac using **AzuraCast** (open source, runs in Docker). Make it reachable from the internet over HTTPS with a **Cloudflare Quick Tunnel**, so that:
- listeners open a public link in any browser and hear the station
- my friends broadcast live from their own homes with **Web DJ** (in the browser, nothing to install), each with their own DJ login
- an AutoDJ plays music whenever nobody is live

Target: working in about 30 minutes.

## Fill these in before running
- Station name: `PomboRadio`
- Station short name (lowercase, no spaces, used in URLs): `pomboradio`
- Folder with starter music (MP3s): `~/Music/PomboRadio`
- Friends who need DJ accounts (display name → username):
  - `DJ Pombo` → `pombo`
  - `__________` → `__________`
  - `__________` → `__________`

## Rules for the agent
- Work step by step. Run the **Check** after each step and don't move on until it passes.
- **Ask me first** before: entering my password (sudo), changing anything outside `~/azuracast`, or stopping or uninstalling other software that uses port 80/443.
- Never print passwords in logs or commit them anywhere. Generate strong random passwords for the DJ accounts and give them to me only in the final report.
- If a step fails twice, stop and show me the exact error instead of trying other approaches.
- Leave long-running processes (the tunnel) in their own terminal and don't kill them at the end.

---

## Step 1: Check the Mac
- Check the macOS version (`sw_vers`), chip (`uname -m`), RAM (at least 4 GB) and free disk space (at least 10 GB).
- Check whether Homebrew is installed (`brew -v`). If not, ask me before installing it from https://brew.sh.
- Check what's using ports 80 and 443: `lsof -nP -iTCP:80 -sTCP:LISTEN` and `lsof -nP -iTCP:443 -sTCP:LISTEN`.

**Check:** Report the results. If 80/443 are busy, plan to use **8080/8443** for AzuraCast instead of stopping anything.

## Step 2: Install and start Docker Desktop
```bash
brew install --cask docker
open -a Docker
```
Wait until `docker info` succeeds. The first launch may show a license/permissions dialog that I have to accept. If so, tell me and wait.

**Check:** `docker info` and `docker compose version` both work.

## Step 3: Install AzuraCast
```bash
mkdir -p ~/azuracast && cd ~/azuracast
curl -fsSL https://raw.githubusercontent.com/AzuraCast/AzuraCast/main/docker.sh > docker.sh
chmod a+x docker.sh
./docker.sh install
```
- Use the **stable** release channel if asked.
- Accept defaults, except: if ports 80/443 were busy in Step 1, set the HTTP port to **8080** and the HTTPS port to **8443** (in `~/azuracast/.env`, `AZURACAST_HTTP_PORT` and `AZURACAST_HTTPS_PORT`).
- If `docker.sh` refuses to run on macOS, follow the manual Docker Compose install in the official docs (https://www.azuracast.com/docs/getting-started/installation/docker) using the same folder. Don't try any other method.

**Check:** `docker ps` shows the AzuraCast container running, and `curl -I http://localhost:<HTTP_PORT>` returns an HTTP response.

## Step 4: Create the station (in the browser at http://localhost:<HTTP_PORT>)
1. Run the first-time setup wizard and create the admin account. **Ask me for the email and password to use**, or let me type them myself.
2. Create the station with the name and short name above. Leave the defaults: Icecast as the broadcasting server and **AutoDJ enabled**.
3. **Music Files:** upload the MP3s from the music folder above and add them to the default playlist. Make sure that playlist is enabled.
4. Station **Profile → Streamers/DJs:** enable streamers. In the station settings, turn on **Allow Streamers / DJs** and save.
5. **Streamer/DJ Accounts → Add Streamer:** create one account per friend from the list above, with a strong random password each, and **Account is Active** turned on.

**Check:** The station's public page at `http://localhost:<HTTP_PORT>/public/<short_name>` plays music, and the DJ accounts appear in the list.

## Step 5: Open it to the internet with a Cloudflare Quick Tunnel
In a separate terminal that stays open:
```bash
brew install cloudflared
cloudflared tunnel --url http://localhost:<HTTP_PORT>
```
Copy the `https://<random>.trycloudflare.com` URL it prints.

Then in AzuraCast **Administration → System Settings**:
- set **Site Base URL** to the trycloudflare URL
- turn on **Use Web Proxy for Radio**, so listeners get the audio through the same HTTPS link instead of a separate port
- save.

**Check:** From a network other than my Wi-Fi (or via a fetch through the tunnel URL):
- `https://<tunnel>/public/<short_name>` loads and plays audio
- the Web DJ page loads over HTTPS. The browser needs HTTPS before it allows microphone access.

## Step 6: Keep the Mac awake
In another terminal that stays open:
```bash
caffeinate -d
```
Remind me to keep the Mac plugged in.

## Step 7: Final report for me
Give me a short message I can forward to friends, plus a private part for me only:

**For listeners:**
- Listen link: `https://<tunnel>/public/<short_name>`

**For each DJ (send privately to each friend):**
- Web DJ link (copy it from the station's profile page)
- their username and password
- how to go live: open the link → log in → allow the microphone → start broadcasting. Use Chrome or Firefox, and headphones to avoid echo. The AutoDJ comes back automatically when they stop.

**For me:**
- admin URL (local and tunnel)
- which terminals must stay open (tunnel, caffeinate)
- how to restart everything after a reboot:
  ```bash
  open -a Docker              # wait until it's running
  cd ~/azuracast && ./docker.sh start   # or: docker compose up -d
  cloudflared tunnel --url http://localhost:<HTTP_PORT>
  ```
  Then update **Site Base URL** with the new tunnel URL and send friends the new links.

---

## Known limitations (don't try to fix these now)
- **The tunnel URL changes every time it restarts**, and Quick Tunnels have no uptime guarantee. Fixing that later needs a free Cloudflare account, a named tunnel and my own domain.
- **Quick Tunnels don't support Server-Sent Events**, so song titles on the public page may not update live. Audio and Web DJ (WebSockets) still work. Don't spend time on this.
- **Quick Tunnels allow about 200 requests at once**, which is plenty for friends.
- **Only Web DJ works through this tunnel.** BUTT and Mixxx connect on a separate port that the tunnel doesn't carry. Don't open router ports.
- **My home upload speed limits the number of listeners** (about 128 kbps each).
- **Only one DJ can be live at a time.**

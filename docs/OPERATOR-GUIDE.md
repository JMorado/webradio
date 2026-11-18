# Operating PomboRadio

The station Mac runs AzuraCast, AutoDJ and Web DJ. Cloudflare hosts the
website and its programme editor. For schedule changes and its database,
see [Programme admin](PROGRAMACAO.md).

## Restart the station and its tunnel

Start Docker Desktop, then start AzuraCast from its installation directory.

```sh
cd ~/azuracast
./docker.sh start
```

Keep these running in separate terminal tabs on the station Mac.

```sh
cloudflared tunnel --url http://localhost:80
```

```sh
caffeinate -i
```

A Quick Tunnel prints a new HTTPS address each time it starts. Update both
places before testing the stream.

1. In AzuraCast, open **Administration → System Settings**, set **Site Base URL**
   to the new tunnel address and confirm **Use Web Proxy for Radio** is enabled.
2. In the website repo, set `STATION_BASE_URL` in [site/config.js](../site/config.js)
   to the same address. Commit that file and push to `main`.

Restart the station in the AzuraCast UI if it continues using the old
address. Use this command for station ID 1.

```sh
docker exec azuracast azuracast_cli azuracast:radio:restart 1
```

After deployment, try **Ouvir rádio** on the homepage and open
[/dj/](https://pomboradio.pages.dev/dj/) to check the redirect. The tunnel
address is visible to listeners because their browsers connect to it
directly. The AzuraCast admin and DJs use separate private accounts.

## Manage DJs and music

- In AzuraCast, go to **Streamers / DJs** and add a streamer account. Check
  that the account is active and that the station allows streamers. Share
  the login and the [DJ guide](DJ-GUIDE.md) privately.
- To add music through the browser, upload files in **Media Files** and
  add them to an enabled playlist.
- For larger uploads to the station on this Mac, copy files into its media
  directory and rescan. Then assign the tracks to an enabled playlist.

  ```sh
  docker cp /path/to/mp3s/. azuracast:/var/azuracast/stations/pomboradio/media/
  docker exec azuracast azuracast_cli azuracast:media:sync 1
  ```

## Deploy and verify the website

Push to `main` from the repository. The
[Cloudflare Pages workflow](../.github/workflows/deploy.yml) uploads `site/`
and compiles the Pages Functions in `functions/`. Its Cloudflare account ID
and API token are configured in GitHub Actions secrets. The workflow
publishes code and assets. Apply any new D1 migration before deploying code
that uses it.

Once the workflow succeeds, open the homepage, the programme editor and
the public schedule API. A successful schedule response contains an
`entries` array, which is empty when there are no upcoming shows.
The programme editor asks for its own access key.

- [Listener homepage](https://pomboradio.pages.dev/)
- [Public schedule API](https://pomboradio.pages.dev/api/programacao)
- [Programme admin](https://pomboradio.pages.dev/admin/)

## Troubleshooting

- **The station is off air after boot.** Check Docker, the tunnel, and the
  station's **Restart Services** control. A newly created AzuraCast
  station may need its first start from the UI.
- **The homepage loads but there is no audio.** Check the current tunnel
  address against `site/config.js` and the AzuraCast **Site Base URL**.
  If several networks behave differently, test DNS resolution of that
  tunnel hostname.
- **The schedule is unavailable while the player works.** Check the
  `PROGRAMACAO_DB` binding on the production Pages project and confirm
  the database migration has been applied.

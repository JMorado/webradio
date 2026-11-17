(function () {
  "use strict";

  var cfg = window.POMBORADIO_CONFIG || {};
  var BASE_URL = cfg.STATION_BASE_URL || "";
  var SHORTCODE = cfg.STATION_SHORTCODE || "pomboradio";
  var NOWPLAYING_URL = BASE_URL + "/api/nowplaying/" + SHORTCODE;
  var STREAM_URL = BASE_URL + "/listen/" + SHORTCODE + "/radio.mp3";
  var POLL_MS = 15000;

  var audio = document.getElementById("stream");
  var playBtn = document.getElementById("playBtn");
  var iconPlay = document.getElementById("iconPlay");
  var iconPause = document.getElementById("iconPause");
  var liveDot = document.getElementById("liveDot");
  var statusText = document.getElementById("statusText");
  var trackTitle = document.getElementById("trackTitle");

  var isPlaying = false;

  function setPlayingUI(playing) {
    isPlaying = playing;
    iconPlay.style.display = playing ? "none" : "block";
    iconPause.style.display = playing ? "block" : "none";
  }

  playBtn.addEventListener("click", function () {
    if (!audio.src) {
      audio.src = STREAM_URL;
    }
    if (isPlaying) {
      audio.pause();
      setPlayingUI(false);
    } else {
      audio.play().then(function () {
        setPlayingUI(true);
      }).catch(function () {
        statusText.textContent = "não foi possível tocar";
      });
    }
  });

  audio.addEventListener("waiting", function () {
    statusText.textContent = "a carregar\u2026";
  });

  function renderNowPlaying(data) {
    var online = !!data.is_online;
    liveDot.classList.toggle("live", online);
    statusText.textContent = online ? "no ar" : "offline";

    var song = (data.now_playing && data.now_playing.song) || {};
    var isLiveDj = data.live && data.live.is_live;

    if (isLiveDj && data.live.streamer_name) {
      trackTitle.textContent = "ao vivo: " + data.live.streamer_name;
    } else if (song.artist && song.title) {
      trackTitle.textContent = song.artist + " — " + song.title;
    } else if (song.title) {
      trackTitle.textContent = song.title;
    } else {
      trackTitle.textContent = "\u00A0";
    }
  }

  function fetchNowPlaying() {
    fetch(NOWPLAYING_URL, { cache: "no-store" })
      .then(function (res) {
        if (!res.ok) {
          throw new Error("bad response");
        }
        return res.json();
      })
      .then(renderNowPlaying)
      .catch(function () {
        statusText.textContent = "sem ligação";
      });
  }

  fetchNowPlaying();
  setInterval(fetchNowPlaying, POLL_MS);
})();

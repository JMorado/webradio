(function () {
  "use strict";

  var cfg = window.POMBORADIO_CONFIG || {};
  var BASE_URL = cfg.STATION_BASE_URL || "";
  var SHORTCODE = cfg.STATION_SHORTCODE || "pomboradio";
  var NOWPLAYING_URL = BASE_URL + "/api/nowplaying/" + SHORTCODE;
  var STREAM_URL = BASE_URL + "/listen/" + SHORTCODE + "/radio.mp3";
  var POLL_MS = 15000;

  var audio = document.getElementById("stream");

  // Main hero player
  var playBtn = document.getElementById("playBtn");
  var iconPlay = document.getElementById("iconPlay");
  var iconPause = document.getElementById("iconPause");
  var liveDot = document.getElementById("liveDot");
  var statusText = document.getElementById("statusText");
  var trackTitle = document.getElementById("trackTitle");

  // Sticky mini player (mirrors the hero player)
  var miniPlayBtn = document.getElementById("miniPlayBtn");
  var miniIconPlay = miniPlayBtn.querySelector(".mini-icon-play");
  var miniIconPause = miniPlayBtn.querySelector(".mini-icon-pause");
  var miniLiveDot = document.getElementById("miniLiveDot");
  var miniStatusText = document.getElementById("miniStatusText");
  var miniTrack = document.getElementById("miniTrack");

  var historyGrid = document.getElementById("historyGrid");

  var isPlaying = false;

  function setPlayingUI(playing) {
    isPlaying = playing;
    iconPlay.style.display = playing ? "none" : "block";
    iconPause.style.display = playing ? "block" : "none";
    miniIconPlay.style.display = playing ? "none" : "block";
    miniIconPause.style.display = playing ? "block" : "none";
  }

  function togglePlay() {
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
        miniStatusText.textContent = "erro";
      });
    }
  }

  playBtn.addEventListener("click", togglePlay);
  miniPlayBtn.addEventListener("click", togglePlay);

  audio.addEventListener("waiting", function () {
    statusText.textContent = "a carregar\u2026";
  });

  function renderNowPlaying(data) {
    var online = !!data.is_online;
    liveDot.classList.toggle("live", online);
    miniLiveDot.classList.toggle("live", online);

    var label = online ? "no ar" : "offline";
    statusText.textContent = label;
    miniStatusText.textContent = label;

    var song = (data.now_playing && data.now_playing.song) || {};
    var isLiveDj = data.live && data.live.is_live;

    var display;
    if (isLiveDj && data.live.streamer_name) {
      display = "ao vivo: " + data.live.streamer_name;
    } else if (song.artist && song.title) {
      display = song.artist + " — " + song.title;
    } else if (song.title) {
      display = song.title;
    } else {
      display = "";
    }

    trackTitle.textContent = display || "\u00A0";
    miniTrack.textContent = display;

    renderHistory(data.song_history || []);
  }

  function songDisplayName(song) {
    if (!song) return "—";
    if (song.artist && song.title) return song.artist + " — " + song.title;
    return song.title || song.text || "—";
  }

  function renderHistory(history) {
    if (!historyGrid) return;
    if (!history.length) return;

    historyGrid.innerHTML = "";
    history.slice(0, 8).forEach(function (entry) {
      var card = document.createElement("div");
      card.className = "episode-card";

      var tag = document.createElement("span");
      tag.className = "ep-tag";
      tag.textContent = entry.streamer ? "ao vivo" : "autodj";

      var title = document.createElement("div");
      title.className = "ep-title";
      title.textContent = songDisplayName(entry.song);

      card.appendChild(tag);
      card.appendChild(title);
      historyGrid.appendChild(card);
    });
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
        miniStatusText.textContent = "sem ligação";
      });
  }

  fetchNowPlaying();
  setInterval(fetchNowPlaying, POLL_MS);
})();

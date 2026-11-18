(function () {
  "use strict";

  var cfg = window.POMBORADIO_CONFIG || {};
  var baseUrl = cfg.STATION_BASE_URL || "";
  var shortcode = cfg.STATION_SHORTCODE || "pomboradio";
  var nowPlayingUrl = baseUrl + "/api/nowplaying/" + shortcode;
  var streamUrl = baseUrl + "/listen/" + shortcode + "/radio.mp3";

  var audio = document.getElementById("stream");
  var header = document.querySelector(".site-header");
  var playBtn = document.getElementById("playBtn");
  var playLabel = document.getElementById("playLabel");
  var stationStatus = document.getElementById("stationStatus");
  var trackTitle = document.getElementById("trackTitle");
  var sourceText = document.getElementById("sourceText");
  var playbackMessage = document.getElementById("playbackMessage");
  var miniPlayer = document.getElementById("miniPlayer");
  var miniPlayBtn = document.getElementById("miniPlayBtn");
  var miniTrack = document.getElementById("miniTrack");
  var miniFeedback = document.getElementById("miniFeedback");
  var volumeSlider = document.getElementById("volumeSlider");

  var playbackState = "paused";
  var playAttempt = 0;

  function setText(element, text) {
    if (element.textContent !== text) element.textContent = text;
  }

  function syncMiniPlayer() {
    var mainControlIsBelowHeader = playBtn.getBoundingClientRect().bottom > header.offsetHeight;
    if (miniPlayer.hidden !== mainControlIsBelowHeader) {
      miniPlayer.hidden = mainControlIsBelowHeader;
    }
  }

  function setPlayback(state, message) {
    playbackState = state;
    playBtn.dataset.playback = state;
    miniPlayBtn.dataset.playback = state;

    var label = "Ouvir rádio";
    if (state === "loading") label = "Cancelar";
    if (state === "playing") label = "Pausar";
    setText(playLabel, label);
    miniPlayBtn.setAttribute("aria-label", label);

    setText(playbackMessage, message || "");
    setText(miniFeedback, message || "");
    syncMiniPlayer();
  }

  function playbackFailed() {
    setPlayback("paused", "Não foi possível ouvir a emissão.");
  }

  function togglePlay() {
    var attempt = ++playAttempt;
    if (playbackState !== "paused" || !audio.paused) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      setPlayback("paused");
      return;
    }

    audio.src = streamUrl;
    setPlayback("loading", "A ligar à emissão…");
    audio.play().catch(function () {
      if (attempt === playAttempt) playbackFailed();
    });
  }

  playBtn.addEventListener("click", togglePlay);
  miniPlayBtn.addEventListener("click", togglePlay);

  audio.addEventListener("playing", function () {
    if (!audio.paused) setPlayback("playing");
  });

  audio.addEventListener("waiting", function () {
    if (playbackState === "playing") setPlayback("playing", "A carregar a emissão…");
  });

  audio.addEventListener("pause", function () {
    if (audio.paused && playbackState !== "paused") setPlayback("paused");
  });

  audio.addEventListener("error", function () {
    if (audio.error && playbackState !== "paused") playbackFailed();
  });

  audio.volume = 0.5;
  if (audio.volume === 0.5) {
    audio.volume = Number(volumeSlider.value);
    volumeSlider.addEventListener("input", function () {
      audio.volume = Number(volumeSlider.value);
    });
  } else {
    volumeSlider.closest("label").hidden = true;
  }

  window.addEventListener("scroll", syncMiniPlayer, { passive: true });
  window.addEventListener("resize", syncMiniPlayer);
  window.addEventListener("pageshow", syncMiniPlayer);
  syncMiniPlayer();

  function setStation(status, online, track, source) {
    stationStatus.dataset.online = String(online);
    setText(stationStatus, status);
    setText(trackTitle, track);
    setText(sourceText, source);
    sourceText.hidden = !source;
    setText(miniTrack, online ? track : status);
    syncMiniPlayer();
  }

  function renderNowPlaying(data) {
    if (!data.is_online) {
      setStation("Fora do ar", false, "Não há emissão neste momento.", "");
      return;
    }

    var song = (data.now_playing && data.now_playing.song) || {};
    var track = song.title || song.text || "Música em emissão";
    if (song.artist && song.title) track = song.artist + " — " + song.title;

    var live = data.live;
    var source = "AutoDJ";
    if (live && live.is_live) {
      source = "DJ ao vivo";
      if (live.streamer_name) source += " · " + live.streamer_name;
    }

    setStation("No ar", true, track, source);
  }

  function fetchNowPlaying() {
    fetch(nowPlayingUrl, { cache: "no-store" })
      .then(function (response) {
        if (!response.ok) throw new Error("Erro ao consultar a emissão");
        return response.json();
      })
      .then(renderNowPlaying)
      .catch(function () {
        setStation("Sem ligação", false, "Informação da emissão indisponível.", "");
      });
  }

  fetchNowPlaying();
  setInterval(fetchNowPlaying, 15000);
})();

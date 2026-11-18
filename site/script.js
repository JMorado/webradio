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
  var playbackLabels = {
    paused: "Ouvir rádio",
    loading: "Cancelar",
    playing: "Pausar",
    failed: "Tentar novamente",
  };

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

    var label = playbackLabels[state];
    setText(playLabel, label);
    miniPlayBtn.setAttribute("aria-label", label);

    setText(playbackMessage, message || "");
    setText(miniFeedback, message || "");
    syncMiniPlayer();
  }

  function isPlaybackActive() {
    return playbackState === "loading" || playbackState === "playing";
  }

  function stopPlayback(state, message) {
    ++playAttempt;
    setPlayback(state, message);
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
  }

  function playbackFailed() {
    stopPlayback("failed", "Não foi possível reproduzir a emissão.");
  }

  function togglePlay() {
    if (isPlaybackActive()) {
      stopPlayback("paused");
      return;
    }

    var attempt = ++playAttempt;
    audio.src = streamUrl;
    setPlayback("loading", "A ligar à emissão…");
    audio.play().catch(function () {
      if (attempt === playAttempt) playbackFailed();
    });
  }

  playBtn.addEventListener("click", togglePlay);
  miniPlayBtn.addEventListener("click", togglePlay);

  audio.addEventListener("playing", function () {
    if (isPlaybackActive() && !audio.paused) setPlayback("playing");
  });

  audio.addEventListener("waiting", function () {
    if (playbackState === "playing") setPlayback("playing", "A carregar a emissão…");
  });

  audio.addEventListener("pause", function () {
    if (playbackState === "playing" && audio.paused && !audio.error && !audio.ended) stopPlayback("paused");
  });

  audio.addEventListener("error", function () {
    if (isPlaybackActive() && audio.error) playbackFailed();
  });

  audio.addEventListener("ended", function () {
    if (isPlaybackActive() && audio.ended) playbackFailed();
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
      setStation("Fora do ar", false, "Emissão indisponível de momento.", "");
      return;
    }

    var song = (data.now_playing && data.now_playing.song) || {};
    var track = song.title || song.text || "Música em emissão";
    if (song.artist && song.title) track = song.artist + " — " + song.title;

    var isLive = data.live && data.live.is_live;
    var source = isLive ? data.live.streamer_name || "Sessão de DJ" : "Seleção automática";
    setStation(isLive ? "Em direto" : "No ar", true, track, source);
  }

  function fetchNowPlaying() {
    fetch(nowPlayingUrl, { cache: "no-store" })
      .then(function (response) {
        if (!response.ok) throw new Error("Informação da emissão indisponível");
        return response.json();
      })
      .then(renderNowPlaying)
      .catch(function () {
        setStation("Sem informação", false, "Não foi possível carregar a faixa atual.", "");
      });
  }

  fetchNowPlaying();
  setInterval(fetchNowPlaying, 15000);
})();

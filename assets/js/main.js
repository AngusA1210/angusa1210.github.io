/* =========================================================================
   Andrew Angus — portfolio behaviour
   No dependencies. Everything degrades if a piece is unavailable.
   ========================================================================= */
(function () {
  "use strict";

  const $  = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const fmt = (s) => {
    if (!isFinite(s) || s < 0) s = 0;
    const m = Math.floor(s / 60);
    const r = Math.floor(s % 60);
    return m + ":" + String(r).padStart(2, "0");
  };

  const ICON_PLAY  = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M8 5.14v13.72L19 12z"/></svg>';
  const ICON_PAUSE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>';

  /* ---------- static content ------------------------------------------ */

  function fillStatic() {
    $("#hero-eyebrow").textContent = SITE.role;
    $("#hero-lede").textContent = SITE.lede;
    $("#year").textContent = new Date().getFullYear();

    $("#hero-facts").innerHTML = SITE.facts
      .map((f) => "<div><dt>" + f.k + "</dt><dd>" + f.v + "</dd></div>")
      .join("");

    [["#nav-linkedin", SITE.linkedin], ["#resume-linkedin", SITE.linkedin],
     ["#footer-linkedin", SITE.linkedin], ["#nav-github", SITE.github],
     ["#footer-github", SITE.github]
    ].forEach(([sel, href]) => { const el = $(sel); if (el) el.href = href; });

    const mail = $("#footer-mail");
    mail.href = "mailto:" + SITE.email;
    mail.textContent = SITE.email;
    $("#footer-loc").textContent = SITE.location;
  }

  function renderResumes() {
    const tabs = $("#resume-tabs");

    function show(r, focus) {
      $$(".resume-tab", tabs).forEach((b) => {
        const on = b.dataset.id === r.id;
        b.setAttribute("aria-selected", on);
        b.tabIndex = on ? 0 : -1;
        if (on && focus) b.focus();
      });
      $("#resume-dl").href = r.file;
      $("#resume-open").href = r.file;
      $("#resume-fallback-link").href = r.file;
      // Fresh <object> each time: swapping .data on a live one is unreliable.
      const old = $("#resume-embed");
      const fresh = old.cloneNode(true);
      fresh.data = r.file + "#view=FitH";
      old.replaceWith(fresh);
    }

    tabs.innerHTML = RESUMES.map((r) =>
      '<button class="resume-tab" role="tab" type="button" data-id="' + r.id + '">' +
      r.label + "</button>").join("");

    $$(".resume-tab", tabs).forEach((b, i) => {
      b.addEventListener("click", () => show(RESUMES[i], false));
      b.addEventListener("keydown", (e) => {
        if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
        const n = (i + (e.key === "ArrowRight" ? 1 : RESUMES.length - 1)) % RESUMES.length;
        e.preventDefault();
        show(RESUMES[n], true);
      });
    });

    $("#footer-resumes").innerHTML = RESUMES.map((r) =>
      '<a href="' + r.file + '" download>Resume — ' + r.label.toLowerCase() + "</a>").join("");

    show(RESUMES[0], false);
  }

  function renderProjects() {
    $("#projects-list").innerHTML = PROJECTS.map((p) => {
      const links = p.links.length
        ? p.links.map((l) =>
            '<a href="' + l.href + '" target="_blank" rel="noopener">' + l.label +
            ' <svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true">' +
            '<path fill="currentColor" d="M14 3v2h3.59l-9.3 9.29 1.42 1.42L19 6.41V10h2V3h-7zM5 5h5V3H3v18h18v-7h-2v5H5V5z"/>' +
            "</svg></a>").join("")
        : '<span class="private">Private repository — happy to walk through it</span>';

      return (
        '<article class="project reveal">' +
          '<div class="project-top"><h3>' + p.title + "</h3>" +
            '<span class="project-year">' + p.year + "</span></div>" +
          '<p class="project-tag">' + p.tag + "</p>" +
          '<p class="project-blurb">' + p.blurb + "</p>" +
          '<ul class="stack">' + p.stack.map((s) => "<li>" + s + "</li>").join("") + "</ul>" +
          '<div class="project-links">' + links + "</div>" +
        "</article>"
      );
    }).join("");
  }

  /* ---------- audio ---------------------------------------------------- */

  let audioCtx = null, analyser = null, freqData = null;
  let activePlayer = null;
  const players = [];

  function ensureGraph(audio) {
    // One shared AudioContext + analyser; each <audio> is wired in once.
    if (!window.AudioContext && !window.webkitAudioContext) return;
    try {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.75;
        freqData = new Uint8Array(analyser.frequencyBinCount);
        analyser.connect(audioCtx.destination);
      }
      if (!audio._wired) {
        audioCtx.createMediaElementSource(audio).connect(analyser);
        audio._wired = true;
      }
      if (audioCtx.state === "suspended") audioCtx.resume();
    } catch (e) {
      // Visualiser is decorative — playback must never depend on it.
      audioCtx = null; analyser = null;
    }
  }

  function makePlayer(track, peaks) {
    const el = document.createElement("article");
    el.className = "track reveal";
    el.innerHTML =
      '<div class="track-head">' +
        '<button class="play" type="button" aria-label="Play ' + track.title + '">' + ICON_PLAY + "</button>" +
        '<div class="track-meta"><h3>' + track.title + "</h3>" +
          '<p class="track-credit">' +
            (track.artist ? track.artist + '<span class="sep">/</span>' : "") +
            '<span class="role">' + track.role + "</span>" +
            '<span class="sep">/</span>' + track.year + "</p></div>" +
        '<div class="track-time"><span class="cur">0:00</span> / <span class="dur">—:—</span></div>' +
      "</div>" +
      '<div class="wave-wrap" role="slider" tabindex="0" aria-label="Seek ' + track.title +
        '" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-valuetext="0:00">' +
        '<canvas class="wave"></canvas>' +
      "</div>";

    const audio = new Audio("assets/audio/" + track.id + ".m4a");
    audio.preload = "metadata";

    const btn    = $(".play", el);
    const canvas = $(".wave", el);
    const wrap   = $(".wave-wrap", el);
    const curEl  = $(".cur", el);
    const durEl  = $(".dur", el);
    const ctx    = canvas.getContext("2d");

    let progress = 0;

    function draw() {
      const w = canvas.width, h = canvas.height, dpr = canvas._dpr || 1;
      ctx.clearRect(0, 0, w, h);
      const n = peaks.length;
      const barW = w / n;
      const gap = Math.max(1 * dpr, barW * 0.32);
      const mid = h / 2;
      const cut = progress * w;

      for (let i = 0; i < n; i++) {
        const x = i * barW;
        const bh = Math.max(2 * dpr, peaks[i] * h * 0.94);
        const played = x + barW / 2 <= cut;
        if (played) {
          ctx.fillStyle = i / n > 0.0 && peaks[i] > 0.82 ? "#ffb578" : "#ff9548";
        } else {
          ctx.fillStyle = peaks[i] > 0.82 ? "#3a4048" : "#2b3037";
        }
        ctx.fillRect(x, mid - bh / 2, Math.max(1, barW - gap), bh);
      }

      if (progress > 0) {
        ctx.fillStyle = "rgba(255,245,235,.85)";
        ctx.fillRect(cut - 0.5 * dpr, 0, Math.max(1, dpr), h);
      }
    }

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = canvas.getBoundingClientRect();
      if (!r.width) return;
      canvas.width = Math.round(r.width * dpr);
      canvas.height = Math.round(r.height * dpr);
      canvas._dpr = dpr;
      draw();
    }

    function setProgress(p) {
      progress = Math.min(1, Math.max(0, p));
      draw();
      const t = progress * (audio.duration || 0);
      curEl.textContent = fmt(t);
      wrap.setAttribute("aria-valuenow", Math.round(progress * 100));
      wrap.setAttribute("aria-valuetext", fmt(t));
    }

    function seekFromEvent(e) {
      const r = wrap.getBoundingClientRect();
      const x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
      const p = Math.min(1, Math.max(0, x / r.width));
      if (audio.duration) audio.currentTime = p * audio.duration;
      setProgress(p);
    }

    const player = {
      el, audio,
      stop() {
        audio.pause();
        el.classList.remove("playing");
        btn.innerHTML = ICON_PLAY;
        btn.setAttribute("aria-label", "Play " + track.title);
      }
    };

    btn.addEventListener("click", () => {
      if (audio.paused) {
        players.forEach((p) => { if (p !== player) p.stop(); });
        ensureGraph(audio);
        audio.play().then(() => {
          activePlayer = player;
          el.classList.add("playing");
          btn.innerHTML = ICON_PAUSE;
          btn.setAttribute("aria-label", "Pause " + track.title);
        }).catch(() => { /* autoplay blocked or decode error — button stays as play */ });
      } else {
        player.stop();
      }
    });

    audio.addEventListener("loadedmetadata", () => { durEl.textContent = fmt(audio.duration); });
    audio.addEventListener("timeupdate", () => {
      if (audio.duration) setProgress(audio.currentTime / audio.duration);
    });
    audio.addEventListener("ended", () => { player.stop(); setProgress(0); audio.currentTime = 0; });
    audio.addEventListener("pause", () => {
      if (activePlayer === player) activePlayer = null;
    });

    wrap.addEventListener("click", seekFromEvent);
    wrap.addEventListener("keydown", (e) => {
      const d = audio.duration || 0;
      let handled = true;
      if (e.key === "ArrowRight") audio.currentTime = Math.min(d, audio.currentTime + 5);
      else if (e.key === "ArrowLeft") audio.currentTime = Math.max(0, audio.currentTime - 5);
      else if (e.key === "Home") audio.currentTime = 0;
      else if (e.key === "End") audio.currentTime = Math.max(0, d - 1);
      else if (e.key === " " || e.key === "Enter") btn.click();
      else handled = false;
      if (handled) { e.preventDefault(); if (d) setProgress(audio.currentTime / d); }
    });

    window.addEventListener("resize", resize);
    requestAnimationFrame(resize);

    players.push(player);
    return el;
  }

  function placeholderPeaks(n) {
    // Used only when waveforms.json can't be fetched (e.g. opened as a file://).
    const out = [];
    for (let i = 0; i < n; i++) {
      const t = i / n;
      const env = 0.35 + 0.55 * Math.sin(Math.PI * Math.min(1, t * 1.15));
      out.push(Math.max(0.08, env * (0.55 + 0.45 * Math.abs(Math.sin(i * 0.7)))));
    }
    return out;
  }

  function renderTracks(waveforms) {
    const host = $("#tracks");
    TRACKS.forEach((t) => {
      const peaks = (waveforms && waveforms[t.id]) || placeholderPeaks(320);
      host.appendChild(makePlayer(t, peaks));
    });
    observeReveals();
  }

  /* ---------- hero visualiser ------------------------------------------ */

  function heroViz() {
    const canvas = $("#hero-viz");
    const ctx = canvas.getContext("2d");
    let dpr = 1, w = 0, h = 0, t = 0;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = canvas.getBoundingClientRect();
      w = canvas.width = Math.round(r.width * dpr);
      h = canvas.height = Math.round(r.height * dpr);
    }
    resize();
    window.addEventListener("resize", resize);

    const BARS = 96;

    let onScreen = true;
    if ("IntersectionObserver" in window) {
      new IntersectionObserver((es) => { onScreen = es[0].isIntersecting; })
        .observe(canvas);
    }

    function frame() {
      if (!onScreen) { requestAnimationFrame(frame); return; }
      t += 0.02;
      ctx.clearRect(0, 0, w, h);

      const live = analyser && activePlayer && !activePlayer.audio.paused;
      if (live) analyser.getByteFrequencyData(freqData);

      const barW = w / BARS;
      const base = h * 0.88;

      for (let i = 0; i < BARS; i++) {
        let v;
        if (live) {
          const idx = Math.floor(Math.pow(i / BARS, 1.7) * (freqData.length * 0.7));
          v = freqData[idx] / 255;
          v = Math.pow(v, 1.25);
        } else {
          // Idle: a slow travelling swell so the hero reads as a waveform at rest.
          const p = i / BARS;
          const env = 0.35 + 0.65 * Math.pow(Math.sin(Math.PI * p), 0.6);
          v = env * (0.18 + 0.12 * Math.sin(p * 9 - t * 1.1)
                          + 0.07 * Math.sin(p * 23 + t * 1.9)
                          + 0.05 * Math.sin(p * 41 - t * 0.7));
          v = Math.max(0.03, v);
        }

        const bh = Math.max(2 * dpr, v * base);
        const x = i * barW;
        const g = ctx.createLinearGradient(0, h - bh, 0, h);
        g.addColorStop(0, live ? "rgba(255,149,72,.95)" : "rgba(255,149,72,.52)");
        g.addColorStop(1, "rgba(255,149,72,0)");
        ctx.fillStyle = g;
        ctx.fillRect(x, h - bh, Math.max(1, barW - Math.max(1.5 * dpr, barW * 0.42)), bh);
      }

      // Baseline
      ctx.fillStyle = "rgba(34,38,44,.9)";
      ctx.fillRect(0, h - 1 * dpr, w, 1 * dpr);

      requestAnimationFrame(frame);
    }

    if (reduceMotion) {
      // Draw one static frame instead of animating.
      const barW = w / BARS;
      for (let i = 0; i < BARS; i++) {
        const v = 0.05 + 0.04 * Math.abs(Math.sin(i * 0.6));
        const bh = v * h * 0.88;
        ctx.fillStyle = "rgba(255,149,72,.25)";
        ctx.fillRect(i * barW, h - bh, Math.max(1, barW * 0.55), bh);
      }
      ctx.fillStyle = "rgba(34,38,44,.9)";
      ctx.fillRect(0, h - 1, w, 1);
    } else {
      requestAnimationFrame(frame);
    }
  }

  /* ---------- nav + reveals -------------------------------------------- */

  function navBehaviour() {
    const nav = $("#nav");
    const onScroll = () => nav.classList.toggle("stuck", window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const links = $$('.nav-links a[href^="#"]');
    const sections = links
      .map((a) => ({ a, sec: document.querySelector(a.getAttribute("href")) }))
      .filter((x) => x.sec);

    if (!("IntersectionObserver" in window)) return;
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        sections.forEach((x) => x.a.classList.toggle("active", x.sec === e.target));
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach((x) => spy.observe(x.sec));
  }

  let revealObserver = null;
  function observeReveals() {
    if (reduceMotion || !("IntersectionObserver" in window)) {
      $$(".reveal").forEach((el) => el.classList.add("in"));
      return;
    }
    if (!revealObserver) {
      revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((e, i) => {
          if (!e.isIntersecting) return;
          const el = e.target;
          setTimeout(() => el.classList.add("in"), i * 70);
          revealObserver.unobserve(el);
        });
      }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    }
    $$(".reveal:not(.in)").forEach((el) => revealObserver.observe(el));
  }

  /* ---------- listening (Last.fm) -------------------------------------- */

  // Last.fm's placeholder for "no artwork"; showing it would look like a bug.
  const NO_ART = "2a96cbd8b46e442fc41c2b86b821562f";

  function ago(uts) {
    const s = Math.max(0, Math.floor(Date.now() / 1000) - uts);
    if (s < 90) return "just now";
    const units = [["day", 86400], ["hour", 3600], ["minute", 60]];
    for (const [name, size] of units) {
      const n = Math.floor(s / size);
      if (n >= 1) return n + " " + name + (n > 1 ? "s" : "") + " ago";
    }
    return "just now";
  }

  function listening() {
    const cfg = SITE.lastfm || {};
    const card = $("#listening");
    if (!cfg.user || !cfg.apiKey || !card) return;   // not configured: stay hidden

    const url = "https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks" +
      "&user=" + encodeURIComponent(cfg.user) +
      "&api_key=" + encodeURIComponent(cfg.apiKey) +
      "&format=json&limit=1";

    function paint(t) {
      const live = !!(t["@attr"] && t["@attr"].nowplaying === "true");
      const status = $("#listening-status");
      card.classList.toggle("live", live);
      status.textContent = "";
      if (live) {
        const eq = document.createElement("span");
        eq.className = "eq";
        eq.setAttribute("aria-hidden", "true");
        eq.innerHTML = "<i></i><i></i><i></i>";
        status.append(eq, "Listening now");
      } else {
        status.textContent = t.date ? "Last played · " + ago(+t.date.uts) : "Last played";
      }

      $("#listening-title").textContent = t.name || "";
      $("#listening-artist").textContent = t.artist ? (t.artist["#text"] || t.artist.name || "") : "";
      card.href = t.url || "https://www.last.fm/user/" + encodeURIComponent(cfg.user);

      const imgs = (t.image || []).map((i) => i["#text"]).filter((u) => u && !u.includes(NO_ART));
      const art = $("#listening-art");
      art.style.backgroundImage = imgs.length ? 'url("' + imgs[imgs.length - 1] + '")' : "";

      card.hidden = false;
    }

    function refresh() {
      if (document.hidden) return;
      fetch(url)
        .then((r) => r.json())
        .then((d) => {
          // API errors (bad key, unknown user) arrive as 200/403 JSON with .error
          if (d.error || !d.recenttracks) return;
          const t = [].concat(d.recenttracks.track || [])[0];
          if (t) paint(t);
        })
        .catch(() => { /* offline or blocked: leave whatever is showing */ });
    }

    refresh();
    setInterval(refresh, 45000);
    document.addEventListener("visibilitychange", refresh);
  }

  /* ---------- boot ------------------------------------------------------ */

  function init() {
    fillStatic();
    renderResumes();
    renderProjects();
    navBehaviour();
    heroViz();
    listening();

    fetch("assets/data/waveforms.json")
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null)
      .then((data) => { renderTracks(data); });

    observeReveals();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

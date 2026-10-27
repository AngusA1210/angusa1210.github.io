# angusa1210.github.io

Andrew Angus — audio engineer and software developer.
Mixes, projects and resume: <https://angusa1210.github.io>

Static HTML/CSS/JS, served by GitHub Pages. No build step, no dependencies,
no trackers.

```
index.html              markup
assets/css/             styling
assets/js/main.js       audio player and hero spectrum analyser
assets/data/            site content, waveform peak data
assets/audio/           mixes, 192k AAC
tools/                  helper scripts
```

Site content is data: `assets/data/content.js` holds the bio, the track list
and the projects. The player draws each waveform from pre-computed peaks rather
than decoding the audio, so a track renders before its file has loaded.

To run it locally — `fetch()` needs a real server, so don't open the file
directly:

```bash
python3 -m http.server 4173
```

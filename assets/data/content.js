/* ---------------------------------------------------------------------------
   All editable site content lives here. Change a string, reload, done.
   --------------------------------------------------------------------------- */

const SITE = {
  name: "Andrew Angus",
  role: "Audio Engineer · Software Developer",
  location: "New York, NY",
  email: "cras.aangus@gmail.com",
  linkedin: "https://www.linkedin.com/in/andrew-angus-226612287/",
  github: "https://github.com/AngusA1210",
  resume: "assets/docs/Andrew-Angus-Resume.pdf",

  lede:
    "I record, mix, and master music — and I write software. Formal training " +
    "on SSL and API consoles, and a computer science degree.",

  facts: [
    { k: "Currently", v: "Mixing &amp; mastering out of New York" },
    { k: "Recently", v: "Audio Engineering Intern, Electric Lady Studios" },
    { k: "Trained at", v: "CRAS Master Recording Program II" },
    { k: "Also", v: "B.S. Computer Science, Northern Arizona University" }
  ]
};

const TRACKS = [
  {
    id: "jakes-sad-song",                // matches assets/audio/<id>.m4a
    title: "Jake's Sad Song",
    artist: "",                          // TODO: artist name
    role: "Mix",
    year: "2026"
  },
  {
    id: "white-girl-music",
    title: "White Girl Music",
    artist: "Pick Me Girls",
    role: "Recording &amp; Mix",
    year: "2026"
  },
  {
    id: "undone-cover",
    title: "Undone (Cover)",
    artist: "Pick Me Girls",
    role: "Mix &amp; Master",
    year: "2026"
  }
];

const PROJECTS = [
  {
    title: "StreamerIsolate",
    tag: "Audio ML · Browser extension",
    year: "2025 – 2026",
    blurb:
      "Strips background music out of a livestream in near-real-time and leaves " +
      "the speech. A Demucs source-separation model runs on buffered audio while " +
      "a browser extension holds the video back by the same amount, so picture " +
      "and sound stay locked. A PANNs classifier gates the vocal stem so singing " +
      "gets removed but talking doesn't.",
    stack: ["Python", "PyTorch", "Demucs", "PANNs", "WebCodecs", "WebSocket", "Firefox / Chrome"],
    links: [{ label: "Source on GitHub", href: "https://github.com/AngusA1210/StreamerIsolate" }]
  },
  {
    title: "RomanticSequencer",
    tag: "Generative audio · DSP",
    year: "2026",
    blurb:
      "Software that reads a work of literature and renders it as sound — an " +
      "automated program-music engine. A synthesis engine and score format sit " +
      "downstream of a text-analysis layer, and neither half knows about the other.",
    stack: ["Python", "Additive / subtractive synthesis", "LLM text analysis", "Score IR"],
    links: []
  }
];

/* ---------------------------------------------------------------------------
   All editable site content lives here. Change a string, reload, done.
   --------------------------------------------------------------------------- */

const SITE = {
  name: "Andrew Angus",
  role: "Software Developer · Audio Engineer",
  location: "New York, NY",
  email: "cras.aangus@gmail.com",
  linkedin: "https://www.linkedin.com/in/andrew-angus-226612287/",
  github: "https://github.com/AngusA1210",

  lede:
    "I'm a software developer and an audio engineer. I have a Bachelor of " +
    "Science in Computer Science from Northern Arizona University, and formal " +
    "training in recording, mixing and mastering.",

  facts: [
    { k: "Degree", v: "B.S. Computer Science, Northern Arizona University" },
    { k: "Audio training", v: "CRAS Master Recording Program II" },
    { k: "Recently", v: "Audio Engineering Intern, Electric Lady Studios" },
    { k: "Based in", v: "New York, NY" }
  ]
};

// The first entry is the one shown by default.
const RESUMES = [
  { id: "software", label: "Software",
    file: "assets/docs/Andrew-Angus-Software-Resume.pdf" },
  { id: "audio", label: "Audio engineering",
    file: "assets/docs/Andrew-Angus-Audio-Engineering-Resume.pdf" }
];

const TRACKS = [
  {
    id: "undone-cover",                  // matches assets/audio/<id>.m4a
    title: "Undone (Cover)",
    artist: "Pick Me Girls",
    role: "Recording, Mix &amp; Master",
    year: "2026"
  },
  {
    id: "jakes-sad-song",
    title: "Jake's Sad Song",
    artist: "Pick Me Girls",
    role: "Recording, Mix &amp; Master",
    year: "2026"
  },
  {
    id: "white-girl-music",
    title: "White Girl Music",
    artist: "Pick Me Girls",
    role: "Recording, Mix &amp; Master",
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

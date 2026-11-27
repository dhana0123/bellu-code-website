import Lenis from "lenis";
import "lenis/dist/lenis.css";
import "./style.css";
import "./theme.js";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

// Soft, eased scrolling. Each wheel step glides over 1s on an ease-out
// curve (fast start, long slow finish). It runs even when the OS reports
// reduced motion, because it only follows the user's own scrolling.
// Inner scroll areas opt out with data-lenis-prevent.
new Lenis({
  autoRaf: true,
  duration: 1,
  easing: (t) => 1 - (1 - t) ** 3, // easeOutCubic
  wheelMultiplier: 1,
  respectReducedMotion: false,
  // Sticky header height (alpha banner + nav) plus a little space.
  anchors: { offset: -112 },
});

// Hero: pastel isometric floor with labelled slabs (static; animation can be
// added later on the .iso-tile and .iso-slab groups).
function seededRandom(seed) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function renderHeroGrid(svg) {
  const NS = "http://www.w3.org/2000/svg";
  const W = 150;
  const H = 75;
  const ox = 700;
  const oy = -300;
  const point = (i, j, z = 0) => [ox + (i - j) * (W / 2), oy + (i + j) * (H / 2) - z];
  const poly = (points, fill, extra = "") => `<polygon points="${points.map((p) => p.join(",")).join(" ")}" fill="${fill}" ${extra}/>`;
  const random = seededRandom(7);
  const palette = [
    ["#e4dbf8", 5], ["#efeaf9", 4], ["#eef1ec", 3], ["#d8f4de", 2], ["#fbd3f2", 2],
    ["#c9b5f3", 1.2], ["#d3e4ff", 1.2], ["#ffe4c6", 1], ["#a27ce9", 0.6], ["#8fb8f8", 0.5],
    ["#fcc58a", 0.5], ["#9fe6b0", 0.5],
  ];
  const total = palette.reduce((sum, [, weight]) => sum + weight, 0);
  const pick = () => {
    let r = random() * total;
    for (const [color, weight] of palette) { r -= weight; if (r <= 0) return color; }
    return palette[0][0];
  };

  let tiles = "";
  for (let j = 0; j < 26; j += 1) {
    let i = 0;
    while (i < 26) {
      const length = random() < 0.55 ? 2 : 1;
      const corners = [point(i, j), point(i + length, j), point(i + length, j + 1), point(i, j + 1)];
      const visible = corners.some(([x, y]) => x > -W && x < 1400 + W && y > -H && y < 640 + H);
      if (visible) tiles += poly(corners, pick(), 'class="iso-tile"');
      i += length;
    }
  }

  const slabs = [
    { i: 9, j: 10, a: 1, b: 3, z: 150, label: "DISCOVER", sub: "DEPENDENCY INVENTORY" },
    { i: 12, j: 7, a: 1, b: 3, z: 120, label: "ASSESS", sub: "RISK PRIORITIZATION" },
    { i: 13, j: 12, a: 1, b: 2, z: 230, label: "BELLU CODE", sub: "SECURITY-FIRST", hero: true },
    { i: 16, j: 9, a: 1, b: 3, z: 140, label: "DETECT", sub: "ALERT TRIAGE" },
  ].sort((p, q) => (p.i + p.j) - (q.i + q.j));

  const slabMarkup = slabs.map(({ i, j, a, b, z, label, sub, hero }) => {
    const top = hero ? "#b99af0" : "#d6c6f6";
    const left = hero ? "#7c4fd6" : "#a98be8";
    const right = hero ? "#6a3fc4" : "#9270e0";
    const shadow = poly([point(i, j + b), point(i + a, j + b), point(i + a + 0.6, j + b + 0.6), point(i + 0.6, j + b + 0.6)], "rgb(80 40 160 / 18%)");
    const faceTop = poly([point(i, j, z), point(i + a, j, z), point(i + a, j + b, z), point(i, j + b, z)], top, 'stroke="#ffffff" stroke-opacity=".5"');
    const faceLeft = poly([point(i, j + b, z), point(i + a, j + b, z), point(i + a, j + b), point(i, j + b)], left);
    const faceRight = poly([point(i + a, j + b, z), point(i + a, j, z), point(i + a, j), point(i + a, j + b)], right);
    // Labels sit on the right face, which runs up and to the right.
    const [tx, ty] = point(i + a, j + b, z);
    const text = `<g transform="matrix(1,-0.5,0,1,${tx + 14},${ty + 30})" fill="#ffffff" font-family="IBM Plex Mono, monospace">
      <text font-size="15" letter-spacing="1.5">${label}</text>
      <text y="22" font-size="10" letter-spacing="1" opacity=".75">${sub}</text>
    </g>`;
    return `<g class="iso-slab">${shadow}${faceLeft}${faceRight}${faceTop}${text}</g>`;
  }).join("");

  svg.innerHTML = `<g stroke="#ffffff" stroke-width="1.5" stroke-linejoin="round">${tiles}</g>${slabMarkup}`;
}

// Alpha notice: stays closed once a visitor dismisses it.
const alphaBanner = $("#alpha-banner");
if (alphaBanner) {
  const key = "bellu-alpha-dismissed";
  try { if (localStorage.getItem(key) === "1") alphaBanner.hidden = true; } catch { /* storage blocked */ }
  $(".alpha-close", alphaBanner).addEventListener("click", () => {
    alphaBanner.hidden = true;
    try { localStorage.setItem(key, "1"); } catch { /* storage blocked */ }
  });
}

const heroGrid = $("#hero-grid");
if (heroGrid) renderHeroGrid(heroGrid);

// Sources: a pale isometric cube field with a line running through it. Each
// connector is a coloured box on the line with its real logo on the front
// face. Logos are read from the screen-reader list (#source-list) so the
// markup lives in one place.
function renderSourcesScene(svg, list) {
  const W = 1200;
  const H = 440;
  const point = (x, y) => `${x.toFixed(1)},${y.toFixed(1)}`;
  const poly = (pts, fill, extra = "") => `<polygon points="${pts.map(([x, y]) => point(x, y)).join(" ")}" fill="${fill}" ${extra}/>`;
  // (x, y) is the front corner of the top face; the body hangs below it.
  const cubeFaces = (x, y, s) => {
    const h = s * 0.866;
    return {
      top: [[x, y - s], [x + h, y - s / 2], [x, y], [x - h, y - s / 2]],
      left: [[x - h, y - s / 2], [x, y], [x, y + s], [x - h, y + s / 2]],
      right: [[x, y], [x + h, y - s / 2], [x + h, y + s / 2], [x, y + s]],
    };
  };

  // Background field: scattered cubes one or two high, drawn back to front.
  const random = seededRandom(11);
  const S = 92;
  const cells = [];
  for (let gx = -8; gx <= 16; gx += 1) {
    for (let gy = -8; gy <= 16; gy += 1) {
      const x = 600 + (gx - gy) * S * 0.866;
      const y = 40 + (gx + gy) * S * 0.5;
      if (x < -S || x > W + S || y < -S || y > H + S * 1.6) continue;
      const r = random();
      if (r > 0.42) continue;
      cells.push({ x, y, height: r < 0.12 ? 2 : 1, depth: gx + gy });
    }
  }
  cells.sort((a, b) => a.depth - b.depth || a.x - b.x);
  let field = "";
  cells.forEach(({ x, y, height }) => {
    for (let z = 0; z < height; z += 1) {
      const f = cubeFaces(x, y - z * S, S);
      field += poly(f.left, "#d3dbce") + poly(f.right, "#e2e8de") + poly(f.top, "#edf1ea");
    }
  });

  // Boxes sit up and down across the scene and are wired as a network. Every
  // link runs only along the two isometric directions (30 degrees down-right
  // and up-right, the same angles as the cube edges), so it bends once like a
  // track on the grid instead of cutting straight across.
  const nodes = [
    { x: 110, y: 160 }, { x: 255, y: 320 }, { x: 395, y: 135 }, { x: 540, y: 290 },
    { x: 680, y: 120 }, { x: 820, y: 300 }, { x: 960, y: 150 }, { x: 1095, y: 310 },
  ];
  // Neighbours along the row, plus fixed cross links one box further away.
  const links = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [0, 2], [1, 3], [3, 5], [4, 6], [5, 7]];
  const T = Math.tan(Math.PI / 6); // isometric slope, about 0.577
  // Split the gap into a down-right run (+x, +T·x) and an up-right run (+x, -T·x).
  const isoPath = ([x1, y1], [x2, y2]) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const down = (dx + dy / T) / 2; // horizontal length of the down-right run
    const corner = [x1 + down, y1 + down * T];
    return `M${point(x1, y1)} L${point(...corner)} L${point(x2, y2)}`;
  };
  // Lead-ins from the scene edges, each one a single isometric run.
  const edgeRun = ({ x, y }, dir, length) => [x + dir[0] * length, y + dir[1] * length * T];
  const edgeLinks = [
    [edgeRun(nodes[0], [-1, -1], 200), nodes[0]], [edgeRun(nodes[1], [-1, 1], 300), nodes[1]],
    [edgeRun(nodes[4], [-1, -1], 260), nodes[4]], [edgeRun(nodes[6], [1, -1], 300), nodes[6]],
    [edgeRun(nodes[7], [1, 1], 200), nodes[7]], [edgeRun(nodes[3], [1, 1], 300), nodes[3]],
  ];
  const linkPaths = links.map(([a, b]) => isoPath([nodes[a].x, nodes[a].y], [nodes[b].x, nodes[b].y]));
  const allPaths = [
    ...linkPaths,
    ...edgeLinks.map(([[x1, y1], { x, y }]) => `M${point(x1, y1)} L${point(x, y)}`),
  ];
  const lineMarkup = allPaths.map((d, i) => `<path class="sources-link" style="--i:${i}" d="${d}" pathLength="1"/>`).join("");

  // [top, left] per box; the right face stays white so every logo reads.
  const colors = [
    ["#ffd08a", "#f29a2e"], ["#bcd9ff", "#3d86e8"], ["#fbd3f2", "#e58fd0"], ["#c9d4ff", "#5a72e6"],
    ["#d9c6ff", "#9b6be8"], ["#ffd2c2", "#f2754a"], ["#cfe3ff", "#3f7fe8"], ["#c8f3d4", "#2fb563"],
  ];
  const s = 50;
  const h = s * 0.866;
  const logoSize = Math.round(s * 0.57); // logo scales with the box
  const items = $$("li", list);
  const nodeMarkup = items.map((item, i) => {
    const { x, y } = nodes[i % nodes.length];
    const name = $("h3", item)?.textContent.trim() ?? "";
    const logo = $("svg", item);
    const viewBox = logo?.getAttribute("viewBox") ?? "0 0 256 256";
    // Gradient ids must stay unique, so the scene copy gets its own.
    const art = (logo?.innerHTML ?? "").replaceAll('id="src-', 'id="scene-src-').replaceAll("url(#src-", "url(#scene-src-");
    const [top, left] = colors[i % colors.length];
    const f = cubeFaces(x, y, s);
    const labelWidth = name.length * 7.4 + 18;
    // The logo is mapped onto the right face: it runs up 1 unit per ~1.73 across.
    return `<g class="source-node" style="--i:${i}"><title>${name}</title><g class="source-node-body">
      ${poly([[x - h + 6, y + s / 2 + 10], [x + 6, y + s + 10], [x + h + 6, y + s / 2 + 10], [x + 6, y + 10]], "rgb(40 60 30 / 12%)")}
      ${poly(f.left, left)}${poly(f.right, "#ffffff")}${poly(f.top, top)}
      <g transform="matrix(1 -0.57735 0 1 ${x.toFixed(1)} ${y.toFixed(1)})"><svg x="${((h - logoSize) / 2).toFixed(1)}" y="${((s - logoSize) / 2).toFixed(1)}" width="${logoSize}" height="${logoSize}" viewBox="${viewBox}" aria-hidden="true">${art}</svg></g>
      <g class="source-label"><rect x="${(x - labelWidth / 2).toFixed(1)}" y="${(y + s + 14).toFixed(1)}" width="${labelWidth.toFixed(1)}" height="22" fill="#ffffff"/><text x="${x.toFixed(1)}" y="${(y + s + 29).toFixed(1)}" text-anchor="middle">${name.toUpperCase()}</text></g>
    </g></g>`;
  }).join("");

  // The cubes and green streaks run even when the OS reports reduced motion
  // (Windows "Animation effects" off), same as the scroll and dominoes.
  // Small isometric cubes travel along the links like data packets. Each one
  // is centred on (0, 0) and moved by animateMotion without rotating, so it
  // stays square to the grid. Every other cube runs in reverse.
  const packetColors = [
    ["#ffb37a", "#ff4a23"], ["#bcd9ff", "#3d86e8"], ["#c8f3d4", "#2fb563"], ["#d9c6ff", "#7c4fd6"],
  ];
  const packet = ([top, side], size) => {
    const f = cubeFaces(0, size / 2, size);
    return poly(f.left, side) + poly(f.right, "#ffffff") + poly(f.top, top);
  };
  const pulse = linkPaths.map((path, i) => {
    const dur = (4 + (i % 5) * 0.9).toFixed(1);
    const begin = (-(i * 1.3) % 6).toFixed(1); // negative start so cubes are spread out from the first frame
    const points = i % 2 ? "1;0" : "0;1";
    return `<g class="source-packet">${packet(packetColors[i % packetColors.length], 9)}<animateMotion dur="${dur}s" begin="${begin}s" repeatCount="indefinite" keyPoints="${points}" keyTimes="0;1" calcMode="linear" path="${path}"/></g>`;
  }).join("");

  // Three stacked SVGs with the same viewBox, each on its own compositor layer:
  //   1. static background (cube field, dots, lines): painted once, never again
  //   2. moving parts (green streaks, packet cubes): small and cheap to repaint
  //   3. connector boxes on top, so packets pass under them
  // Before this, every animation frame repainted the whole scene, including
  // thousands of pattern dots, which made scrolling past it stutter.
  const NS = "http://www.w3.org/2000/svg";
  const canvas = document.createElement("div");
  canvas.className = "sources-canvas";
  svg.replaceWith(canvas);
  const fx = document.createElementNS(NS, "svg");
  const top = document.createElementNS(NS, "svg");
  [svg, fx, top].forEach((layer) => {
    layer.setAttribute("viewBox", `0 0 ${W} ${H}`);
    layer.setAttribute("preserveAspectRatio", "xMidYMid slice");
    canvas.append(layer);
  });
  fx.setAttribute("class", "sources-scene-fx");
  top.setAttribute("class", "sources-scene-top");
  fx.setAttribute("aria-hidden", "true");
  top.setAttribute("aria-hidden", "true");

  const title = $("title", svg)?.outerHTML ?? "";
  svg.innerHTML = `${title}
    <defs><pattern id="sources-dots" width="7" height="7" patternUnits="userSpaceOnUse"><circle cx="1.2" cy="1.2" r="0.8" fill="#c7d0c1"/></pattern></defs>
    <rect width="${W}" height="${H}" fill="#f3f5f0"/><rect width="${W}" height="${H}" fill="url(#sources-dots)"/>
    <g stroke="#f8faf6" stroke-width="1.5" stroke-linejoin="round">${field}</g>
    <g fill="none" stroke="#0a0a0a" stroke-width="1.1" stroke-opacity="0.75">${lineMarkup}</g>`;
  fx.innerHTML = `<g class="sources-tracers" fill="none" stroke="#1f6b3a" stroke-width="2.6" stroke-linecap="square"></g>${pulse}`;
  top.innerHTML = nodeMarkup;

  const tracers = startSourceTracers($(".sources-tracers", fx), allPaths);

  // Only animate while the scene is on screen and the tab is visible.
  let onScreen = true;
  const sync = () => {
    if (onScreen && !document.hidden) { fx.unpauseAnimations?.(); tracers?.play(); } else { fx.pauseAnimations?.(); tracers?.pause(); }
  };
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([entry]) => { onScreen = entry.isIntersecting; sync(); }, { rootMargin: "120px 0px" }).observe(canvas);
  }
  document.addEventListener("visibilitychange", sync);
}

// Dark-green streaks that keep running along the links. Each streak picks a
// random link, a random direction and a random speed, runs once, then picks
// again, so the pattern never repeats. Each streak is one dash followed by a
// gap longer than the path, slid from one end to the other with the Web
// Animations API.
// Returns { pause, play } so the scene can stop them while off screen.
function startSourceTracers(layer, paths, count = 4) {
  if (!layer || !paths.length || !("animate" in Element.prototype)) return null;
  const NS = "http://www.w3.org/2000/svg";
  const pick = () => paths[Math.floor(Math.random() * paths.length)];
  const current = new Set();
  let paused = false;
  for (let i = 0; i < count; i += 1) {
    const tracer = document.createElementNS(NS, "path");
    layer.append(tracer);
    const run = () => {
      tracer.setAttribute("d", pick());
      // Measure in real pixels so the dash maths works in every browser.
      const total = tracer.getTotalLength() || 1;
      const length = total * (0.12 + Math.random() * 0.14);
      tracer.style.strokeDasharray = `${length} ${total * 2}`;
      const forward = Math.random() < 0.5;
      // Offset `length` hides the dash before the start; -total slides it past the end.
      const frames = forward
        ? [{ strokeDashoffset: length }, { strokeDashoffset: -total }]
        : [{ strokeDashoffset: -total }, { strokeDashoffset: length }];
      const animation = tracer.animate(frames, {
        duration: 1300 + Math.random() * 1700,
        delay: Math.random() * 900,
        easing: "cubic-bezier(0.45, 0, 0.25, 1)",
        fill: "both",
      });
      if (paused) animation.pause();
      current.add(animation);
      animation.onfinish = () => { current.delete(animation); run(); };
    };
    run();
  }
  return {
    pause() { paused = true; current.forEach((a) => a.pause()); },
    play() { paused = false; current.forEach((a) => a.play()); },
  };
}

const sourcesScene = $("#sources-scene");
const sourceList = $("#source-list");
if (sourcesScene && sourceList) renderSourcesScene(sourcesScene, sourceList);

// Scale the 1024px-wide app preview to its frame so it keeps the reference
// screenshot's proportions at every screen width.
const appFrame = $(".app-frame");
if (appFrame) {
  const fitApp = () => appFrame.style.setProperty("--app-scale", String(appFrame.clientWidth / 1024));
  fitApp();
  if ("ResizeObserver" in window) new ResizeObserver(fitApp).observe(appFrame);
  else window.addEventListener("resize", fitApp, { passive: true });
}

$(".menu-toggle").addEventListener("click", (event) => {
  const button = event.currentTarget;
  const open = button.getAttribute("aria-expanded") !== "true";
  button.setAttribute("aria-expanded", String(open));
  button.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  $("#primary-links").classList.toggle("is-open", open);
});

$$(".nav-links a").forEach((link) => {
  link.addEventListener("click", () => {
    $("#primary-links").classList.remove("is-open");
    $(".menu-toggle").setAttribute("aria-expanded", "false");
    $(".menu-toggle").setAttribute("aria-label", "Open menu");
  });
});

const securityStages = {
  discover: {
    label: "Discover",
    features: [
      { id: "dependency-inventory", title: "Dependency inventory", description: "See the packages in your project and review sample findings from a single searchable view." },
      { id: "code-analysis", title: "Code analysis", description: "Explore code findings, group related results, and focus on the issues that need attention." },
      { id: "secret-discovery", title: "Secret discovery", description: "Review potential secrets with filters that help narrow the list to unresolved findings." },
    ],
  },
  assess: {
    label: "Assess",
    features: [
      { id: "risk-prioritization", title: "Risk prioritization", description: "Compare finding priorities and statuses to decide what your team should review first." },
      { id: "exposure-context", title: "Exposure context", description: "Organize sample findings by source and inspect their current review status." },
      { id: "impact-review", title: "Impact review", description: "Search and group findings to understand where a potential issue appears." },
    ],
  },
  prevent: {
    label: "Prevent",
    features: [
      { id: "secure-workflows", title: "Secure workflows", description: "Review sample checks alongside their source and priority before changes move forward." },
      { id: "policy-checks", title: "Policy checks", description: "Filter review items by status and organize them around the signal that matters to you." },
      { id: "change-review", title: "Change review", description: "Search the sample queue and select a row to inspect its summary." },
    ],
  },
  detect: {
    label: "Detect",
    features: [
      { id: "continuous-monitoring", title: "Continuous monitoring", description: "Explore a sample findings queue and quickly narrow it to open items." },
      { id: "alert-triage", title: "Alert triage", description: "Group sample alerts by priority, source, or status to make review easier." },
      { id: "anomaly-review", title: "Anomaly review", description: "Select a finding to highlight it, or search for a particular source or issue." },
    ],
  },
  manage: {
    label: "Manage",
    features: [
      { id: "findings-overview", title: "Findings overview", description: "Keep a searchable view of sample findings with flexible grouping and status filters." },
      { id: "team-ownership", title: "Team ownership", description: "Organize sample work by finding source and review state." },
      { id: "security-posture", title: "Security posture", description: "Use the sample queue to review priority distribution and open items." },
    ],
  },
  fix: {
    label: "Fix",
    features: [
      { id: "guided-remediation", title: "Guided remediation", description: "Find an open item, inspect its sample summary, and keep the review focused." },
      { id: "patch-validation", title: "Patch validation", description: "Group findings by status to distinguish open work from resolved sample items." },
      { id: "regression-checks", title: "Regression checks", description: "Search and review sample checks, then select a row to focus its details." },
    ],
  },
};

const sampleFindings = [
  { name: "Dependency advisory", source: "Dependencies", priority: "High", status: "Open" },
  { name: "Exposed credential", source: "Repository", priority: "Critical", status: "Open" },
  { name: "Outdated package", source: "Dependencies", priority: "Medium", status: "Resolved" },
  { name: "Input validation", source: "Code scan", priority: "Low", status: "Open" },
  { name: "Unreviewed change", source: "Repository", priority: "Medium", status: "Resolved" },
];

const SVG_NS = "http://www.w3.org/2000/svg";
const explorerScene = $("#explorer-scene");

// Isometric cube stack for the product explorer. Layout is derived from the
// stage and feature so each tab shows a different arrangement.
// [top, left, right] faces: mint, blue, near-black, white. Without outlines the
// left face is the darkest, the right face mid, the top lightest.
const sceneShades = [
  ["#d8f4de", "#3fbf6a", "#7fdc9a"],
  ["#c4dafd", "#3f7fe8", "#6f9ff2"],
  ["#4a4a4a", "#0a0a0a", "#262626"],
  ["#ffffff", "#c9d6ea", "#e4ecf8"],
];
function renderExplorerScene(stage, featureId) {
  if (!explorerScene) return;
  const stageIndex = Object.keys(securityStages).indexOf(stage);
  const featureIndex = securityStages[stage].features.findIndex((feature) => feature.id === featureId);
  const seed = stageIndex * 3 + featureIndex;
  explorerScene.setAttribute("viewBox", "0 0 600 640");
  explorerScene.replaceChildren();
  const size = 58;
  // No outlines: the three face shades define the edges.
  const cube = (gx, gy, gz, shade) => {
    const x = 300 + (gx - gy) * size * 0.866;
    const y = 380 + (gx + gy) * size * 0.5 - gz * size;
    const [top, left, right] = sceneShades[shade];
    const h = size * 0.866;
    return `
      <polygon points="${x},${y - size} ${x + h},${y - size / 2} ${x},${y} ${x - h},${y - size / 2}" fill="${top}"/>
      <polygon points="${x - h},${y - size / 2} ${x},${y} ${x},${y + size} ${x - h},${y + size / 2}" fill="${left}"/>
      <polygon points="${x},${y} ${x + h},${y - size / 2} ${x + h},${y + size / 2} ${x},${y + size}" fill="${right}"/>`;
  };
  const cells = [];
  for (let gx = -2; gx <= 2; gx += 1) {
    for (let gy = -2; gy <= 2; gy += 1) {
      const n = Math.abs(Math.sin((gx + 3) * 12.9898 + (gy + 3) * 78.233 + seed * 3.17)) * 43758.5453 % 1;
      if (n < 0.35) continue;
      const height = 1 + Math.floor(n * (gx + gy < 0 ? 4 : 2));
      const shade = (gx === 0 && gy === 0) || n > 0.93 ? 1 : n > 0.82 ? 2 : n > 0.6 ? 0 : 3;
      cells.push({ gx, gy, height, shade });
    }
  }
  // Painter's order: back to front, bottom to top.
  cells.sort((a, b) => (a.gx + a.gy) - (b.gx + b.gy) || a.gx - b.gx);
  // Each column is one group so the whole stack lifts together on hover.
  cells.forEach(({ gx, gy, height, shade }) => {
    const column = document.createElementNS(SVG_NS, "g");
    column.setAttribute("class", "cube-col");
    let markup = "";
    for (let gz = 0; gz < height; gz += 1) markup += cube(gx, gy, gz, gz === height - 1 ? shade : 3);
    column.innerHTML = markup;
    explorerScene.append(column);
  });
}

const explorerCard = $(".explorer-card");
const explorerContent = $(".explorer-detail-content");
const featureList = $(".explorer-list");
const featureRotationDuration = 5000;
let explorerIsVisible = false;
let activeStage = "discover";
let activeFeatureId = securityStages.discover.features[0].id;
let selectedFinding = "";
let explorerTransition;
let featureRotationTimer;

function clearFeatureRotation() {
  window.clearTimeout(featureRotationTimer);
  featureRotationTimer = undefined;
}

function scheduleFeatureRotation() {
  clearFeatureRotation();
  const keyboardFocus = explorerCard.querySelector(":focus-visible");
  if (!explorerIsVisible || document.hidden || keyboardFocus) {
    featureList.classList.add("is-paused");
    return;
  }

  if (featureList.classList.contains("is-paused")) {
    featureList.classList.add("progress-restarting");
    const activeFeature = $(".feature-choice.active", featureList);
    if (activeFeature) void activeFeature.offsetWidth;
    featureList.classList.remove("is-paused", "progress-restarting");
  }
  featureList.classList.remove("is-paused");
  featureRotationTimer = window.setTimeout(() => {
    const stages = Object.entries(securityStages);
    const stageIndex = stages.findIndex(([stageId]) => stageId === activeStage);
    const [stageId, stage] = stages[stageIndex];
    const featureIndex = stage.features.findIndex((feature) => feature.id === activeFeatureId);
    const nextFeature = stage.features[featureIndex + 1];

    if (nextFeature) {
      updateExplorer(stageId, nextFeature.id, { replaceUrl: true });
      return;
    }

    const [nextStageId, nextStage] = stages[(stageIndex + 1) % stages.length];
    updateExplorer(nextStageId, nextStage.features[0].id, { replaceUrl: true });
  }, featureRotationDuration);
}

function currentFeature() {
  return securityStages[activeStage].features.find((feature) => feature.id === activeFeatureId);
}

function renderFeatureNavigation() {
  featureList.replaceChildren();
  Object.entries(securityStages).forEach(([stageId, stage]) => {
    const group = document.createElement("section");
    group.className = "feature-group";
    group.dataset.stageGroup = stageId;

    const heading = document.createElement("button");
    heading.type = "button";
    heading.className = "stage-heading";
    heading.dataset.stage = stageId;
    heading.textContent = stage.label;
    group.append(heading);

    const submenu = document.createElement("div");
    submenu.className = "feature-submenu";
    stage.features.forEach((feature) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "feature-choice";
      button.dataset.stage = stageId;
      button.dataset.feature = feature.id;
      button.textContent = feature.title;
      submenu.append(button);
    });
    group.append(submenu);
    featureList.append(group);
  });
}

function updateFeatureNavigation() {
  $$(".feature-group", featureList).forEach((group) => {
    const stageActive = group.dataset.stageGroup === activeStage;
    group.classList.toggle("is-active", stageActive);
    const heading = $(".stage-heading", group);
    heading.setAttribute("aria-current", stageActive ? "step" : "false");
    $$(".feature-choice", group).forEach((button) => {
      const active = stageActive && button.dataset.feature === activeFeatureId;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  });
}

function renderFindings() {
  const query = $("#finding-search").value.trim().toLowerCase();
  const onlyOpen = $(".filter-toggle").getAttribute("aria-pressed") === "true";
  const groupBy = $("#group-by").value;
  const rows = sampleFindings
    .filter((finding) => (!onlyOpen || finding.status === "Open"))
    .filter((finding) => `${finding.name} ${finding.source} ${finding.priority} ${finding.status}`.toLowerCase().includes(query))
    .sort((a, b) => a[groupBy].localeCompare(b[groupBy]) || a.name.localeCompare(b.name));
  const body = $("#finding-rows");
  body.replaceChildren();
  let previousGroup = "";

  rows.forEach((finding) => {
    const group = finding[groupBy];
    if (group !== previousGroup) {
      const groupRow = document.createElement("tr");
      groupRow.className = "finding-group";
      const groupCell = document.createElement("td");
      groupCell.colSpan = 4;
      groupCell.textContent = group;
      groupRow.append(groupCell);
      body.append(groupRow);
      previousGroup = group;
    }

    const row = document.createElement("tr");
    row.tabIndex = 0;
    row.setAttribute("aria-label", `${finding.name}, ${finding.priority} priority, ${finding.status}`);
    row.classList.toggle("selected", selectedFinding === finding.name);
    [finding.name, finding.source, finding.priority, finding.status].forEach((value) => {
      const cell = document.createElement("td");
      cell.textContent = value;
      row.append(cell);
    });
    const selectRow = () => {
      selectedFinding = finding.name;
      $$(".finding-table tbody tr:not(.finding-group)").forEach((item) => item.classList.toggle("selected", item === row));
      $(".finding-selection").textContent = `${finding.name} · ${finding.priority} priority · ${finding.status}`;
    };
    row.addEventListener("click", selectRow);
    row.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        selectRow();
      }
    });
    body.append(row);
  });

  $(".empty-findings").hidden = rows.length > 0;
  $(".finding-table").hidden = rows.length === 0;
  if (!rows.some((finding) => finding.name === selectedFinding)) {
    selectedFinding = "";
    $(".finding-selection").textContent = rows.length ? "Select a row to inspect the finding." : "No matching findings.";
  }
}

function updateExplorer(stage, featureId, { updateUrl = true, animate = true, replaceUrl = false } = {}) {
  const features = securityStages[stage]?.features;
  const featureExists = features?.some((feature) => feature.id === featureId);
  if (!featureExists) return;

  activeStage = stage;
  activeFeatureId = featureId;
  selectedFinding = "";
  updateFeatureNavigation();

  const feature = currentFeature();
  const render = () => {
    $("#explorer-stage-label").textContent = securityStages[stage].label.toUpperCase();
    $("#explorer-title").textContent = feature.title;
    $("#explorer-description").textContent = feature.description;
    $("#screen-section-name").textContent = feature.title;
    $("#finding-search").value = "";
    $(".filter-toggle").setAttribute("aria-pressed", "false");
    renderFindings();
  };

  if (animate) {
    window.clearTimeout(explorerTransition);
    explorerContent.classList.add("is-changing");
    explorerScene?.classList.add("is-swapping");
    explorerTransition = window.setTimeout(() => {
      render();
      renderExplorerScene(stage, featureId);
      explorerContent.classList.remove("is-changing");
      explorerScene?.classList.remove("is-swapping");
    }, 200);
  } else {
    render();
    renderExplorerScene(stage, featureId);
    explorerContent.classList.remove("is-changing");
  }

  if (updateUrl) {
    const hash = `#security/${stage}/${featureId}`;
    if (window.location.hash !== hash) {
      if (replaceUrl && /^#security\/[a-z-]+\/[a-z-]+$/.test(window.location.hash)) {
        window.history.replaceState(null, "", hash);
      } else if (!replaceUrl) {
        window.history.pushState(null, "", hash);
      }
    }
  }
  scheduleFeatureRotation();
}

featureList.addEventListener("click", (event) => {
  const stageButton = event.target.closest(".stage-heading");
  if (stageButton) {
    const stage = stageButton.dataset.stage;
    updateExplorer(stage, securityStages[stage].features[0].id);
    return;
  }
  const featureButton = event.target.closest("[data-feature]");
  if (featureButton) updateExplorer(featureButton.dataset.stage, featureButton.dataset.feature);
});

featureList.addEventListener("keydown", (event) => {
  if (!["ArrowDown", "ArrowUp"].includes(event.key) || !event.target.matches(".feature-choice")) return;
  const items = $$(".feature-choice", featureList);
  const currentIndex = items.indexOf(document.activeElement);
  if (currentIndex < 0) return;
  event.preventDefault();
  const offset = event.key === "ArrowDown" ? 1 : -1;
  const next = items[(currentIndex + offset + items.length) % items.length];
  updateExplorer(next.dataset.stage, next.dataset.feature);
  window.requestAnimationFrame(() => featureList.querySelector(`[data-feature="${next.dataset.feature}"]`)?.focus());
});

explorerCard.addEventListener("focusin", scheduleFeatureRotation);
explorerCard.addEventListener("focusout", () => window.setTimeout(scheduleFeatureRotation, 0));
document.addEventListener("visibilitychange", scheduleFeatureRotation);
if ("IntersectionObserver" in window) {
  const explorerVisibility = new IntersectionObserver(([entry]) => {
    explorerIsVisible = entry.isIntersecting;
    scheduleFeatureRotation();
  }, { threshold: 0.1 });
  explorerVisibility.observe(explorerCard);
} else {
  explorerIsVisible = true;
}

$("#finding-search").addEventListener("input", renderFindings);
$("#group-by").addEventListener("change", renderFindings);
$(".filter-toggle").addEventListener("click", (event) => {
  const button = event.currentTarget;
  button.setAttribute("aria-pressed", String(button.getAttribute("aria-pressed") !== "true"));
  renderFindings();
});

$(".share-feature").addEventListener("click", async (event) => {
  const button = event.currentTarget;
  const url = `${window.location.origin}${window.location.pathname}#security/${activeStage}/${activeFeatureId}`;
  try {
    await navigator.clipboard.writeText(url);
    button.textContent = "✓";
    button.setAttribute("aria-label", "Feature link copied");
  } catch (error) {
    console.error("Could not copy the feature link.", error);
    button.textContent = "!";
    button.setAttribute("aria-label", "Could not copy feature link");
  }
  window.setTimeout(() => {
    button.textContent = "↗";
    button.setAttribute("aria-label", "Copy link to this feature");
  }, 1800);
});

function restoreExplorerFromHash() {
  const match = window.location.hash.match(/^#security\/([a-z-]+)\/([a-z-]+)$/);
  if (match && securityStages[match[1]]?.features.some((feature) => feature.id === match[2])) {
    updateExplorer(match[1], match[2], { updateUrl: false, animate: false });
  }
}
renderFeatureNavigation();
window.addEventListener("popstate", restoreExplorerFromHash);
restoreExplorerFromHash();
if (!/^#security\/[a-z-]+\/[a-z-]+$/.test(window.location.hash)) {
  updateExplorer(activeStage, activeFeatureId, { updateUrl: false, animate: false });
}

window.addEventListener("scroll", () => {
  $(".site-header").classList.toggle("is-scrolled", window.scrollY > 8);
}, { passive: true });

$("#year").textContent = String(new Date().getFullYear());

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Section fade-up and staggered children.
if ("IntersectionObserver" in window && !reduceMotion) {
  document.documentElement.classList.add("js");
  $$("[data-stagger]").forEach((group) => {
    [...group.children].forEach((child, index) => { child.style.transitionDelay = `${index * 50}ms`; });
  });
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-in");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
  $$("[data-reveal], [data-stagger]").forEach((target) => revealObserver.observe(target));
}

// Closing CTA: row of isometric slabs that tip over as you scroll.
const dominoes = $("#dominoes");
const dominoSlabs = [];
if (dominoes) {
  const count = 10;
  dominoes.setAttribute("viewBox", "0 0 1200 380");
  // [top, front, side] per slab: a pastel run ending in two black slabs.
  const dominoColors = [
    ["#f3eefd", "#e4dbf8", "#c9b5f3"],
    ["#fde8f8", "#fbd3f2", "#f2a9e0"],
    ["#e6f0ff", "#d3e4ff", "#8fb8f8"],
    ["#eafaee", "#d8f4de", "#9fe6b0"],
    ["#fff1e0", "#ffe4c6", "#fcc58a"],
    ["#f3eefd", "#c9b5f3", "#a27ce9"],
    ["#e6f0ff", "#8fb8f8", "#5f95ee"],
    ["#d8f4de", "#4ade80", "#2fb563"],
    ["#3a3a3a", "#1f1f1f", "#0a0a0a"],
    ["#3a3a3a", "#1f1f1f", "#0a0a0a"],
  ];
  for (let index = 0; index < count; index += 1) {
    const [top, front, side] = dominoColors[index];
    // group: position (SVG attribute). hover: CSS lift. inner: scroll rotation.
    const group = document.createElementNS(SVG_NS, "g");
    const hover = document.createElementNS(SVG_NS, "g");
    hover.setAttribute("class", "domino");
    const inner = document.createElementNS(SVG_NS, "g");
    inner.innerHTML = `
      <polygon points="0,0 60,-34 78,-24 18,10" fill="${top}"/>
      <polygon points="0,0 18,10 18,210 0,200" fill="${front}"/>
      <polygon points="18,10 78,-24 78,176 18,210" fill="${side}"/>`;
    hover.append(inner);
    group.append(hover);
    dominoes.append(group);
    dominoSlabs.push({ group, inner, x: 60 + index * 110 });
  }
  const layoutDominoes = (progress) => {
    dominoSlabs.forEach((slab, index) => {
      // Slabs on the left fall first; each slab lags the previous one a little.
      const local = Math.min(1, Math.max(0, progress * 1.6 - (index / dominoSlabs.length) * 0.6));
      const angle = (1 - index / (dominoSlabs.length - 1)) * 62 * local;
      slab.group.setAttribute("transform", `translate(${slab.x} 150)`);
      slab.inner.setAttribute("transform", `rotate(${angle.toFixed(2)} 18 210)`);
    });
  };
  // Scroll-driven, so it runs regardless of the reduced-motion setting.
  layoutDominoes(0);
  {
    // Progress is 0 when the slabs enter at the bottom of the screen and 1
    // once they are about 40% down it. It is eased every frame so the fall
    // stays smooth, and it is reachable on tall desktop screens too.
    let target = 0;
    let current = 0;
    let frame = 0;
    const tick = () => {
      const rect = dominoes.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      // Wait until the whole row is on screen (bottom edge inside the
      // viewport), then fall over the next ~30% of the screen height.
      const start = vh;
      // Never place the end past the furthest point the page can scroll to,
      // so the fall always completes on short pages and tall screens.
      const maxScroll = document.documentElement.scrollHeight - vh;
      const lowestBottom = rect.bottom + window.scrollY - maxScroll;
      const end = Math.min(start - 80, Math.max(vh * 0.7, lowestBottom + 10));
      target = Math.min(1, Math.max(0, (start - rect.bottom) / (start - end)));
      current += (target - current) * 0.08;
      if (Math.abs(target - current) < 0.001) current = target;
      layoutDominoes(current);
      frame = current === target ? 0 : requestAnimationFrame(tick);
    };
    const kick = () => { if (!frame) frame = requestAnimationFrame(tick); };
    const dominoObserver = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        window.addEventListener("scroll", kick, { passive: true });
        window.addEventListener("resize", kick, { passive: true });
        kick();
      } else {
        window.removeEventListener("scroll", kick);
        window.removeEventListener("resize", kick);
      }
    }, { rootMargin: "100px 0px" });
    dominoObserver.observe(dominoes);
    kick();
  }
}

// Stats count up once when they enter the viewport.
const counters = $$("[data-count]");
if (counters.length && "IntersectionObserver" in window && !reduceMotion) {
  const countObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);
      const target = Number(entry.target.dataset.count);
      const start = performance.now();
      const step = (now) => {
        const t = Math.min(1, (now - start) / 1200);
        entry.target.textContent = String(Math.round(target * (1 - (1 - t) ** 3)));
        if (t < 1) requestAnimationFrame(step);
      };
      entry.target.textContent = "0";
      requestAnimationFrame(step);
    });
  }, { threshold: 0.6 });
  counters.forEach((counter) => countObserver.observe(counter));
}

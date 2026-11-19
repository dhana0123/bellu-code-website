import "./style.css";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

function selectScreen(index) {
  $$(".window-tab").forEach((tab) => {
    const active = Number(tab.dataset.screen) === index;
    tab.classList.toggle("is-active", active);
    tab.setAttribute("aria-selected", String(active));
  });
  $$(".sidebar-item").forEach((item) => {
    const active = Number(item.dataset.screen) === index;
    item.classList.toggle("active", active);
    item.setAttribute("aria-current", active ? "page" : "false");
  });
  $(".screen-placeholder span").textContent = `Your screen ${index + 1}`;
  $(".hero-window-back .window-titlebar > span").textContent = `Screen ${((index + 1) % 3) + 1}`;
}

$$("[data-screen]").forEach((control) => {
  control.addEventListener("click", () => selectScreen(Number(control.dataset.screen)));
});

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

const explorerCard = $(".explorer-card");
const explorerContent = $(".explorer-detail-content");
const featureList = $(".explorer-list");
const stageTabs = $$(".stage-tab");
let activeStage = "discover";
let activeFeatureId = securityStages.discover.features[0].id;
let selectedFinding = "";
let explorerTransition;

function currentFeature() {
  return securityStages[activeStage].features.find((feature) => feature.id === activeFeatureId);
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

function updateExplorer(stage, featureId, { updateUrl = true, animate = true } = {}) {
  const features = securityStages[stage]?.features;
  const featureExists = features?.some((feature) => feature.id === featureId);
  if (!featureExists) return;

  activeStage = stage;
  activeFeatureId = featureId;
  selectedFinding = "";
  stageTabs.forEach((tab) => {
    const active = tab.dataset.stage === stage;
    tab.classList.toggle("active", active);
    tab.setAttribute("aria-selected", String(active));
  });

  const feature = currentFeature();
  const render = () => {
    featureList.replaceChildren();
    features.forEach((item) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `feature-choice${item.id === featureId ? " active" : ""}`;
      button.setAttribute("role", "tab");
      button.setAttribute("aria-selected", String(item.id === featureId));
      button.textContent = item.title;
      button.dataset.feature = item.id;
      featureList.append(button);
    });
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
    explorerTransition = window.setTimeout(() => {
      render();
      explorerContent.classList.remove("is-changing");
    }, 100);
  } else {
    render();
    explorerContent.classList.remove("is-changing");
  }

  if (updateUrl) {
    const hash = `#security/${stage}/${featureId}`;
    if (window.location.hash !== hash) window.history.pushState(null, "", hash);
  }
}

stageTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const stage = tab.dataset.stage;
    updateExplorer(stage, securityStages[stage].features[0].id);
  });
});

featureList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-feature]");
  if (button) updateExplorer(activeStage, button.dataset.feature);
});

featureList.addEventListener("keydown", (event) => {
  if (!["ArrowDown", "ArrowUp"].includes(event.key)) return;
  const items = $$(".feature-choice", featureList);
  const currentIndex = items.indexOf(document.activeElement);
  if (currentIndex < 0) return;
  event.preventDefault();
  const offset = event.key === "ArrowDown" ? 1 : -1;
  const next = items[(currentIndex + offset + items.length) % items.length];
  updateExplorer(activeStage, next.dataset.feature);
  window.requestAnimationFrame(() => featureList.querySelector(`[data-feature="${next.dataset.feature}"]`)?.focus());
});

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
window.addEventListener("popstate", restoreExplorerFromHash);
restoreExplorerFromHash();
if (!/^#security\/[a-z-]+\/[a-z-]+$/.test(window.location.hash)) {
  updateExplorer(activeStage, activeFeatureId, { updateUrl: false, animate: false });
}

window.addEventListener("scroll", () => {
  $(".site-header").classList.toggle("is-scrolled", window.scrollY > 8);
}, { passive: true });

$(".theme-toggle").addEventListener("click", (event) => {
  const dark = document.body.classList.toggle("dark-theme");
  event.currentTarget.textContent = dark ? "Light theme" : "Dark theme";
  event.currentTarget.setAttribute("aria-label", dark ? "Switch to light theme" : "Switch to dark theme");
  document.querySelector('meta[name="theme-color"]').content = dark ? "#111110" : "#faf9f6";
});

$(".copy-command").addEventListener("click", async (event) => {
  const button = event.currentTarget;
  try {
    await navigator.clipboard.writeText($(".install-pill code").textContent);
    button.textContent = "Copied";
    window.setTimeout(() => { button.textContent = "Copy"; }, 1500);
  } catch (error) {
    button.textContent = "Unavailable";
    console.error("Could not copy the install command.", error);
    window.setTimeout(() => { button.textContent = "Copy"; }, 2000);
  }
});

$("#year").textContent = String(new Date().getFullYear());

const revealTargets = $$(".hero-copy, .hero-panel, .trusted-section, .feature-row, .testimonials-section, .frontier-section, .changelog-section, .mission-panel, .blog-section, .closing-cta");
if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  document.documentElement.classList.add("reveal-ready");
  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("reveal", "is-visible");
        currentObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });
  revealTargets.forEach((target) => {
    target.classList.add("reveal");
    observer.observe(target);
  });
}

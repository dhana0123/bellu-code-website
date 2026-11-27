// Shared light/dark toggle. The choice is saved in localStorage and applied
// before first paint by a small inline script at the top of each page's <body>.
const KEY = "bellu-theme";
const meta = document.querySelector('meta[name="theme-color"]');
const lightColor = meta ? meta.content : "";

const read = () => {
  try { return localStorage.getItem(KEY); } catch { return null; }
};
const save = (dark) => {
  try { localStorage.setItem(KEY, dark ? "dark" : "light"); } catch { /* storage blocked */ }
};

const apply = (dark) => {
  document.body.classList.toggle("dark-theme", dark);
  const label = dark ? "Switch to light theme" : "Switch to dark theme";
  document.querySelectorAll(".theme-toggle").forEach((button) => {
    button.setAttribute("aria-label", label);
    button.setAttribute("aria-pressed", String(dark));
    button.title = label;
  });
  if (meta) meta.content = dark ? "#0b0b0b" : lightColor;
};

apply(read() === "dark");

document.querySelectorAll(".theme-toggle").forEach((button) => {
  button.addEventListener("click", () => {
    const dark = !document.body.classList.contains("dark-theme");
    apply(dark);
    save(dark);
  });
});

// Keep other open tabs in sync.
window.addEventListener("storage", (event) => {
  if (event.key === KEY) apply(event.newValue === "dark");
});

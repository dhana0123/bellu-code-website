import "./style.css";
import "./theme.js";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

// Alpha notice: shares the dismissal flag with the landing page.
const alphaBanner = $("#alpha-banner");
if (alphaBanner) {
  const key = "bellu-alpha-dismissed";
  try { if (localStorage.getItem(key) === "1") alphaBanner.hidden = true; } catch { /* storage blocked */ }
  $(".alpha-close", alphaBanner).addEventListener("click", () => {
    alphaBanner.hidden = true;
    try { localStorage.setItem(key, "1"); } catch { /* storage blocked */ }
  });
}

const menuToggle = $(".menu-toggle");
const setMenu = (open) => {
  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  $("#primary-links").classList.toggle("is-open", open);
};
menuToggle.addEventListener("click", () => setMenu(menuToggle.getAttribute("aria-expanded") !== "true"));
$$(".nav-links a").forEach((link) => link.addEventListener("click", () => setMenu(false)));

$("#year").textContent = String(new Date().getFullYear());

// Same fade-up reveal as the landing page.
if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  document.documentElement.classList.add("js");
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-in");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.08, rootMargin: "0px 0px -40px 0px" });
  $$("[data-reveal]").forEach((target) => observer.observe(target));
}

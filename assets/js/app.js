// La Ristopatica — interazioni di base

// Menu mobile
const toggle = document.querySelector(".nav-toggle");
const nav = document.querySelector(".site-nav");
if (toggle && nav) {
  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
  });
}

// Ricerca guide in home
const search = document.getElementById("search");
if (search) {
  const cards = Array.from(document.querySelectorAll("[data-searchable] .card"));
  search.addEventListener("input", () => {
    const q = search.value.trim().toLowerCase();
    for (const c of cards) {
      const match = !q || c.textContent.toLowerCase().includes(q);
      c.style.display = match ? "" : "none";
    }
    // nasconde le sezioni rimaste vuote
    document.querySelectorAll("[data-searchable]").forEach((grid) => {
      const visible = grid.querySelectorAll(".card:not([style*='none'])").length;
      grid.closest("section").style.display = visible ? "" : "none";
    });
  });
}

// PWA: registra il service worker
if ("serviceWorker" in navigator && location.protocol !== "file:") {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}

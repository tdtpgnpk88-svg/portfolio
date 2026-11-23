/* =========================================================
   PORTFOLIO — script principal
   - Menu mobile
   - Apparition des sections au scroll
   - projets.json → aperçu de chaîne (hero), PDP de l'offre, galerie + filtres
   - Lightbox (clavier, boutons, swipe sur mobile)
   ========================================================= */

document.documentElement.classList.remove("no-js");

/* Noms affichés pour chaque catégorie (clé = valeur "categorie" dans projets.json) */
const CATEGORIES = {
  pdp: "PDP",
  miniatures: "Miniature",
  bannieres: "Bannière",
  "3d": "3D",
};

/* Format approximatif de chaque catégorie, utilisé avant le chargement
   de l'image pour éviter que la mise en page « saute ». */
const FORMATS = {
  pdp: "1 / 1",
  miniatures: "16 / 9",
  bannieres: "3 / 1",
  "3d": "4 / 5",
};

/* ---------- Petits utilitaires ---------- */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/* "Bannières" → "bannieres", "3D" → "3d" : tolère les accents et majuscules dans le JSON */
const normaliser = (txt = "") =>
  txt.toString().trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

/* "Miniature — Top 10 des jeux" → "Top 10 des jeux" (pour l'aperçu de chaîne) */
const titreCourt = (titre) => titre.split(/\s[—–-]\s/).pop();

/* "1280 × 720", la signature : les dimensions comme sur un plan de travail */
const dimensions = (img) => `${img.naturalWidth} × ${img.naturalHeight}`;

/* ---------- Année dans le pied de page ---------- */
$("#year").textContent = new Date().getFullYear();

/* ---------- En-tête : bordure au scroll ---------- */
const header = $(".header");
const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

/* ---------- Menu mobile ---------- */
const toggle = $(".nav__toggle");
const menu = $("#nav-menu");

function setMenu(open) {
  toggle.setAttribute("aria-expanded", String(open));
  toggle.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
  menu.classList.toggle("is-open", open);
}
toggle.addEventListener("click", () => setMenu(toggle.getAttribute("aria-expanded") !== "true"));
$$("a", menu).forEach((a) => a.addEventListener("click", () => setMenu(false)));
document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });

/* ---------- Apparition au scroll ---------- */
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      revealObserver.unobserve(entry.target);
    });
  },
  { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
);
$$(".reveal").forEach((el) => revealObserver.observe(el));

/* =========================================================
   TEXTES ET CONTACT (site.json, modifiable depuis /admin/)
   ========================================================= */
async function chargerSite() {
  try {
    const res = await fetch("site.json", { cache: "no-cache" });
    if (res.ok) {
      const site = await res.json();
      appliquerSite(site);
      return site;
    }
  } catch (err) {
    console.warn("site.json non chargé, textes par défaut utilisés :", err);
  } finally {
    document.documentElement.classList.remove("is-loading");
  }
  return {};
}

/* Aperçu de chaîne : nom, pseudo, abonnés et lien « S'abonner » */
function appliquerChaine(chaine = {}) {
  const propre = (v = "") => v.toString().trim();
  const handle = propre(chaine.handle)
    .replace(/^https?:\/\/(www\.)?youtube\.com\//i, "").replace(/^@/, "").replace(/[/?].*$/, "");
  const nom = propre(chaine.nom);
  const abonnes = propre(chaine.abonnes);

  const champ = (cle) => $(`[data-chaine="${cle}"]`);
  if (nom) champ("nom").textContent = nom;
  if (handle) {
    champ("handle").textContent = `@${handle}`;
    const lien = champ("lien");
    lien.href = `https://www.youtube.com/@${encodeURIComponent(handle)}?sub_confirmation=1`;
    lien.target = "_blank";
    lien.rel = "noopener";
    lien.setAttribute("aria-label", `S'abonner à ${nom || "@" + handle} sur YouTube`);
  }
  // « 1,2 k » → « · 1,2 k abonnés » ; vide → masqué
  const subs = champ("abonnes");
  if (abonnes) subs.textContent = ` · ${/abonn/i.test(abonnes) ? abonnes : `${abonnes} abonnés`}`;
  else if (handle) subs.hidden = true;
}

function appliquerSite({ textes = {}, contact = {}, chaine = {} } = {}) {
  appliquerChaine(chaine);
  $$("[data-texte]").forEach((el) => {
    const v = textes[el.dataset.texte];
    if (typeof v === "string" && v.trim()) el.textContent = v.trim();
  });

  const propre = (v = "") => v.toString().trim();
  const insta = propre(contact.instagram)
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/[/?].*$/, "").replace(/^@/, "");
  const discord = propre(contact.discord).replace(/^@/, "");
  const discordId = propre(contact.discordId).replace(/\D/g, "");
  const email = propre(contact.email);

  const carte = (nom) => $(`[data-contact="${nom}"]`);
  const remplir = (nom, href, handle) => {
    const a = carte(nom);
    if (!a) return;
    if (!handle) { a.hidden = true; return; }
    a.hidden = false;
    $("[data-handle]", a).textContent = handle;
    if (href) a.href = href; else a.removeAttribute("href");
  };

  remplir("instagram", insta && `https://instagram.com/${encodeURIComponent(insta)}`, insta && `@${insta}`);
  remplir("email", email && `mailto:${email}`, email);
  remplir("discord", discordId && `https://discord.com/users/${discordId}`, discord);

  // Sans identifiant Discord, un clic copie le pseudo
  const d = carte("discord");
  if (d && discord && !discordId) {
    d.removeAttribute("target");
    d.setAttribute("role", "button");
    d.tabIndex = 0;
    const copier = async (e) => {
      e.preventDefault();
      const handle = $("[data-handle]", d);
      try { await navigator.clipboard.writeText(discord); handle.textContent = "Pseudo copié"; }
      catch { handle.textContent = discord; }
      setTimeout(() => (handle.textContent = discord), 2000);
    };
    d.addEventListener("click", copier);
    d.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") copier(e); });
  }
}

const sitePret = chargerSite();
setTimeout(() => document.documentElement.classList.remove("is-loading"), 1500);

/* =========================================================
   DONNÉES
   ========================================================= */
const gallery = $("#gallery");
const emptyMsg = $("#gallery-empty");
let projets = [];        // tous les projets du JSON
let visibles = [];       // projets affichés avec le filtre actuel

async function chargerProjets() {
  try {
    const res = await fetch("projets.json", { cache: "no-cache" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    projets = (Array.isArray(data) ? data : data.projets || [])
      .filter((p) => p && p.image)
      .map((p) => ({
        titre: p.titre || "Sans titre",
        categorie: normaliser(p.categorie),
        image: p.image,
      }));

    remplirEmplacements(await sitePret);
    compterFiltres();
    afficher("tout");

    // La galerie vient d'allonger la page : si on est arrivé via un lien
    // comme …/#offre ou …/#contact, on se replace sur la bonne section.
    const cible = location.hash && document.getElementById(location.hash.slice(1));
    if (cible && cible.id !== "accueil") cible.scrollIntoView({ behavior: "instant" });
  } catch (err) {
    console.error("Impossible de charger projets.json :", err);
    remplirEmplacements(await sitePret);
    emptyMsg.hidden = false;
    emptyMsg.textContent =
      location.protocol === "file:"
        ? "La galerie ne peut pas se charger en ouvrant le fichier directement. Lance un petit serveur local (voir le README) ou ouvre le site en ligne."
        : "La galerie n'a pas pu être chargée. Vérifie que projets.json est bien formé.";
  }
}

/* ---------- Aperçu de chaîne + PDP de l'offre ----------
   Chaque emplacement data-slot="categorie" data-n="rang" reçoit
   la création correspondante. S'il n'y en a pas, il reste un aplat gris. */
function remplirEmplacements(site = {}) {
  const parCategorie = (cat) => projets.filter((p) => p.categorie === cat);
  // "chaine.avatar" → site.chaine.avatar (image choisie dans le panel admin)
  const reglage = (chemin = "") => chemin.split(".").reduce((o, k) => (o || {})[k], site);

  $$("[data-slot]").forEach((slot) => {
    if (slot.querySelector("img")) return;
    const choisie = reglage(slot.dataset.override);
    const liste = parCategorie(slot.dataset.slot);
    const p = liste[Number(slot.dataset.n)] || liste[0];
    const src = (typeof choisie === "string" && choisie.trim()) || (p && p.image);
    if (!src) return;
    const img = document.createElement("img");
    img.src = src;
    img.alt = "";
    img.decoding = "async";
    slot.prepend(img);
  });

  $$("[data-title]").forEach((el) => {
    const p = parCategorie(el.dataset.title)[Number(el.dataset.n)];
    el.textContent = p ? titreCourt(p.titre) : "";
  });
}

/* ---------- Filtres : nombre de créations par catégorie ---------- */
function compterFiltres() {
  $$(".filter").forEach((btn) => {
    const f = btn.dataset.filter;
    const n = f === "tout" ? projets.length : projets.filter((p) => p.categorie === f).length;
    $(".filter__count", btn).textContent = n;
  });
}

/* =========================================================
   GALERIE
   ========================================================= */
function afficher(filtre) {
  visibles = filtre === "tout" ? projets : projets.filter((p) => p.categorie === filtre);
  gallery.innerHTML = "";

  if (!visibles.length) {
    emptyMsg.hidden = false;
    emptyMsg.textContent = "Rien dans cette catégorie pour l'instant, ça arrive bientôt.";
    return;
  }
  emptyMsg.hidden = true;

  const fragment = document.createDocumentFragment();
  visibles.forEach((p, i) => {
    const btn = document.createElement("button");
    btn.className = `gallery__item gallery__item--${p.categorie}`;
    btn.type = "button";
    btn.dataset.index = i;
    btn.style.animationDelay = `${Math.min(i, 5) * 50}ms`;
    btn.setAttribute("aria-label", `Agrandir : ${p.titre}`);

    const frame = document.createElement("span");
    frame.className = "gallery__frame";

    const img = document.createElement("img");
    img.src = p.image;
    img.alt = p.titre;
    img.loading = "lazy";
    img.decoding = "async";
    if (FORMATS[p.categorie]) img.style.aspectRatio = FORMATS[p.categorie];
    frame.append(img);

    const caption = document.createElement("span");
    caption.className = "gallery__caption";
    const title = document.createElement("span");
    title.className = "gallery__title";
    title.textContent = p.titre;
    const meta = document.createElement("span");
    meta.className = "gallery__meta mono";
    const nomCat = CATEGORIES[p.categorie] || p.categorie;
    meta.textContent = nomCat;
    caption.append(title, meta);

    // une fois l'image chargée : vraies proportions + dimensions affichées
    img.addEventListener("load", () => {
      img.style.aspectRatio = "";
      meta.textContent = `${nomCat} · ${dimensions(img)}`;
      p.dimensions = dimensions(img);
      ajuster(btn);
    }, { once: true });

    btn.append(frame, caption);
    fragment.append(btn);
  });
  gallery.append(fragment);
  toutAjuster();
}

/* Mosaïque : chaque case occupe autant de lignes fines que sa hauteur */
function ajuster(item) {
  const style = getComputedStyle(gallery);
  const ligne = parseFloat(style.gridAutoRows);
  const ecart = parseFloat(style.rowGap);
  const hauteur = item.offsetHeight; // ignore l'animation d'apparition
  item.style.gridRowEnd = `span ${Math.max(1, Math.ceil((hauteur + ecart) / (ligne + ecart)))}`;
}
const toutAjuster = () => $$(".gallery__item", gallery).forEach(ajuster);

/* Recalcule quand la largeur change (rotation du téléphone, fenêtre redimensionnée) */
let largeur = 0;
new ResizeObserver(([entry]) => {
  if (Math.abs(entry.contentRect.width - largeur) < 1) return;
  largeur = entry.contentRect.width;
  toutAjuster();
}).observe(gallery);

/* Les polices changent la hauteur des légendes : on recalcule une fois chargées */
if (document.fonts) document.fonts.ready.then(toutAjuster);

/* Filtres */
$$(".filter").forEach((btn) => {
  btn.addEventListener("click", () => {
    $$(".filter").forEach((b) => {
      b.classList.toggle("is-active", b === btn);
      b.setAttribute("aria-pressed", String(b === btn));
    });
    afficher(btn.dataset.filter);
  });
});

/* Clic sur une création → lightbox */
gallery.addEventListener("click", (e) => {
  const item = e.target.closest(".gallery__item");
  if (item) ouvrirLightbox(Number(item.dataset.index));
});

chargerProjets();

/* =========================================================
   LIGHTBOX
   ========================================================= */
const lb = $("#lightbox");
const lbImg = $(".lightbox__img", lb);
const lbCaption = $(".lightbox__caption", lb);
const lbPrev = $(".lightbox__prev", lb);
const lbNext = $(".lightbox__next", lb);
let current = 0;
let lastFocus = null;

function montrer(index) {
  current = (index + visibles.length) % visibles.length;
  const p = visibles[current];
  lbImg.style.opacity = 0;
  lbImg.onload = () => (lbImg.style.opacity = 1);
  lbImg.src = p.image;
  lbImg.alt = p.titre;

  lbCaption.replaceChildren(p.titre);
  const meta = document.createElement("span");
  meta.className = "mono";
  meta.textContent = [CATEGORIES[p.categorie] || p.categorie, p.dimensions, `${current + 1}/${visibles.length}`]
    .filter(Boolean).join(" · ");
  lbCaption.append(meta);

  // précharge les voisines pour une navigation fluide
  [current - 1, current + 1].forEach((i) => {
    const v = visibles[(i + visibles.length) % visibles.length];
    if (v) new Image().src = v.image;
  });
}

function ouvrirLightbox(index) {
  lastFocus = document.activeElement;
  lbPrev.hidden = lbNext.hidden = visibles.length < 2;
  montrer(index);
  lb.hidden = false;
  document.body.classList.add("no-scroll");
  requestAnimationFrame(() => lb.classList.add("is-open"));
  $(".lightbox__close", lb).focus();
}

function fermerLightbox() {
  lb.classList.remove("is-open");
  document.body.classList.remove("no-scroll");
  setTimeout(() => { lb.hidden = true; lbImg.removeAttribute("src"); }, 200);
  if (lastFocus) lastFocus.focus();
}

$(".lightbox__close", lb).addEventListener("click", fermerLightbox);
lbPrev.addEventListener("click", () => montrer(current - 1));
lbNext.addEventListener("click", () => montrer(current + 1));

/* Clic sur le fond (hors image et boutons) → fermer */
lb.addEventListener("click", (e) => {
  if (e.target === lb || e.target.classList.contains("lightbox__figure")) fermerLightbox();
});

/* Clavier : Échap, flèches, et Tab qui reste dans la lightbox */
document.addEventListener("keydown", (e) => {
  if (lb.hidden) return;
  if (e.key === "Escape") fermerLightbox();
  else if (e.key === "ArrowLeft" && visibles.length > 1) montrer(current - 1);
  else if (e.key === "ArrowRight" && visibles.length > 1) montrer(current + 1);
  else if (e.key === "Tab") {
    const focusables = $$(".lightbox__btn", lb).filter((b) => !b.hidden);
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
});

/* Swipe gauche/droite sur mobile */
let touchX = null;
lb.addEventListener("touchstart", (e) => { touchX = e.changedTouches[0].clientX; }, { passive: true });
lb.addEventListener("touchend", (e) => {
  if (touchX === null || visibles.length < 2) return;
  const dx = e.changedTouches[0].clientX - touchX;
  if (Math.abs(dx) > 50) montrer(current + (dx < 0 ? 1 : -1));
  touchX = null;
}, { passive: true });

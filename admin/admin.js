/* =========================================================
   PANEL ADMIN — modifie le site en écrivant directement dans
   le dépôt GitHub (projets.json, site.json et les images).
   Tout se passe dans le navigateur : pas de serveur.
   Chaque « Publier » crée un seul commit, puis GitHub Pages
   met le site à jour tout seul (1 à 2 minutes).
   ========================================================= */

/* ---------- Dépôt ciblé ----------
   Sur GitHub Pages, il est déduit de l'adresse : https://PSEUDO.github.io/DEPOT/admin/
   En local (localhost), on utilise les valeurs ci-dessous. */
const DEPOT_PAR_DEFAUT = { owner: "tdtpgnpk88-svg", repo: "portfolio", branch: "main" };

const DEPOT = (() => {
  const host = location.hostname;
  if (!host.endsWith(".github.io")) return DEPOT_PAR_DEFAUT;
  const owner = host.replace(/\.github\.io$/, "");
  const segments = location.pathname.split("/").filter(Boolean);
  const iAdmin = segments.indexOf("admin");
  const repo = iAdmin > 0 ? segments[0] : `${owner}.github.io`;
  return { owner, repo, branch: "main" };
})();

const CATEGORIES = [
  { id: "pdp", nom: "PDP", dossier: "pdp" },
  { id: "miniatures", nom: "Miniature", dossier: "miniatures" },
  { id: "bannieres", nom: "Bannière", dossier: "bannieres" },
  { id: "3d", nom: "3D", dossier: "3d" },
];
const nomCategorie = (id) => (CATEGORIES.find((c) => c.id === id) || {}).nom || id;

/* Champs modifiables de site.json */
const CHAMPS = {
  textes: [
    { cle: "nom", label: "Ligne au-dessus du titre", aide: "Ton nom ou pseudo, par exemple « Antoine · graphiste freelance »" },
    { cle: "accroche", label: "Accroche (grand titre)" },
    { cle: "sousTitre", label: "Sous-titre", type: "textarea" },
    { cle: "aPropos1", label: "À propos · 1er paragraphe", type: "textarea" },
    { cle: "aPropos2", label: "À propos · 2e paragraphe", type: "textarea" },
  ],
  contact: [
    { cle: "instagram", label: "Instagram", aide: "Ton pseudo, sans le @", placeholder: "ton_pseudo" },
    { cle: "discord", label: "Discord · pseudo", aide: "Affiché sur le site", placeholder: "ton_pseudo" },
    { cle: "discordId", label: "Discord · identifiant (facultatif)", aide: "Chiffres seulement. Discord › Paramètres › Avancés › Mode développeur, puis clic droit sur ton profil › Copier l'identifiant. Sans lui, un clic sur la carte copie ton pseudo.", placeholder: "123456789012345678", mono: true },
    { cle: "email", label: "Email", placeholder: "toi@exemple.com", inputType: "email" },
  ],
  chaine: [
    { cle: "nom", label: "Nom de la chaîne", placeholder: "NekoWasHere59" },
    { cle: "handle", label: "Pseudo YouTube", aide: "Sans le @. Le bouton « S'abonner » mène à cette chaîne.", placeholder: "NekoWasHere59", mono: true },
    { cle: "abonnes", label: "Abonnés (facultatif)", aide: "Par exemple « 1,2 k ». Vide = non affiché.", placeholder: "1,2 k" },
  ],
};

/* Images du site choisies dans le panel (sinon le site prend celles de la galerie) */
const IMAGES_SITE = {
  chaine: [
    { cle: "avatar", label: "Photo de profil", forme: "rond", max: 800, defaut: "1re PDP de tes créations" },
    { cle: "banniere", label: "Bannière", forme: "banniere", max: 2560, defaut: "1re bannière de tes créations" },
  ],
  offre: [
    { cle: "image", label: "Image de l'offre", forme: "rond", max: 800, defaut: "2e PDP de tes créations" },
  ],
};
/* Les 3 vidéos de l'aperçu de chaîne : miniature, titre et durée */
const NB_VIDEOS = 3;
const VIDEOS = Array.from({ length: NB_VIDEOS }, (_, i) => ({
  cle: "image", video: i, label: `Vidéo ${i + 1}`, forme: "miniature", max: 1280,
  defaut: `${i + 1}${i ? "e" : "re"} miniature de tes créations`,
}));

/* Objet qui contient l'image : etat.site.chaine, etat.site.offre ou une vidéo */
const cible = (groupe, d) => (d.video !== undefined ? etat.site.chaine.videos[d.video] : etat.site[groupe]);

const cheminsImagesSite = () => [
  ...Object.entries(IMAGES_SITE).flatMap(([g, defs]) => defs.map((d) => (etat.site[g] || {})[d.cle])),
  ...((etat.site.chaine || {}).videos || []).map((v) => v.image),
].filter((c) => typeof c === "string" && c.trim());

const IMAGE_MAX = 2400;       // largeur max après optimisation (px)
const POIDS_ALERTE = 15e6;    // au-delà, on refuse (15 Mo)

/* ---------- Utilitaires ---------- */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const el = (tag, props = {}, ...enfants) => {
  const n = document.createElement(tag);
  Object.entries(props).forEach(([k, v]) => {
    if (k === "class") n.className = v;
    else if (k === "dataset") Object.assign(n.dataset, v);
    else if (k.startsWith("on")) n.addEventListener(k.slice(2), v);
    else if (v !== undefined && v !== null && v !== false) n.setAttribute(k, v === true ? "" : v);
  });
  enfants.flat().forEach((e) => e != null && n.append(e));
  return n;
};
const icone = (d) => {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("class", "icon");
  svg.setAttribute("aria-hidden", "true");
  svg.innerHTML = `<path d="${d}"/>`;
  return svg;
};
const ICONES = {
  haut: "M12 19V5M5 12l7-7 7 7",
  bas: "M12 5v14M19 12l-7 7-7-7",
  premier: "M5 4h14M12 20V9M6 15l6-6 6 6",
  suppr: "M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3",
};
const normaliser = (t = "") => t.toString().trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const slug = (t) => normaliser(t).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "creation";
const cloner = (o) => JSON.parse(JSON.stringify(o));
const enBase64 = (blob) => new Promise((ok, ko) => {
  const r = new FileReader();
  r.onload = () => ok(r.result.split(",")[1]);
  r.onerror = ko;
  r.readAsDataURL(blob);
});
const urlRaw = (chemin) => `https://raw.githubusercontent.com/${DEPOT.owner}/${DEPOT.repo}/${DEPOT.branch}/${chemin}`;

/* ---------- Jeton ---------- */
const CLE_JETON = "portfolio-admin-jeton";
let jeton = localStorage.getItem(CLE_JETON) || sessionStorage.getItem(CLE_JETON) || "";

/* ---------- API GitHub ---------- */
async function gh(chemin, { method = "GET", body, raw = false } = {}) {
  const res = await fetch(`https://api.github.com/repos/${DEPOT.owner}/${DEPOT.repo}${chemin}`, {
    method,
    cache: "no-store",
    headers: {
      Accept: raw ? "application/vnd.github.raw+json" : "application/vnd.github+json",
      Authorization: `Bearer ${jeton}`,
      "X-GitHub-Api-Version": "2022-11-28",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    let message = res.statusText;
    try { message = (await res.json()).message || message; } catch {}
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }
  if (res.status === 204) return null;
  return raw ? res.text() : res.json();
}

function messageErreur(err, contexte) {
  if (err.status === 401) return "Jeton invalide ou expiré. Déconnecte-toi et colle un nouveau jeton.";
  if (err.status === 403 || (err.status === 404 && contexte === "ecriture"))
    return "Ce jeton n'a pas le droit de modifier le dépôt. Vérifie la permission « Contents : Read and write ».";
  if (err.status === 404) return `Dépôt ${DEPOT.owner}/${DEPOT.repo} introuvable avec ce jeton. Vérifie qu'il donne accès à ce dépôt.`;
  if (err.status === 409 || err.status === 422)
    return "Le site a été modifié ailleurs pendant ce temps. Recharge la page puis refais tes changements.";
  if (err instanceof TypeError) return "Impossible de joindre GitHub. Vérifie ta connexion internet.";
  return `Erreur GitHub : ${err.message}`;
}

/* =========================================================
   ÉTAT
   ========================================================= */
const etat = {
  projets: [],            // [{ titre, categorie, image, _apercu?, _nouveau? }]
  site: { textes: {}, contact: {} },
  imagesConnues: new Set(),   // images présentes dans le dépôt au chargement
  aEnvoyer: new Map(),        // chemin → Blob (nouvelles images)
  apercus: new Map(),         // chemin → URL locale, pour afficher une image pas encore publiée
  reference: "",              // instantané pour savoir s'il y a des changements
  filtre: "tout",
  enCours: false,
};

const propres = () => etat.projets.map(({ titre, categorie, image }) => ({ titre, categorie, image }));
const instantane = () => JSON.stringify({ p: propres(), s: etat.site });
const modifie = () => instantane() !== etat.reference || etat.aEnvoyer.size > 0;

/* =========================================================
   CONNEXION
   ========================================================= */
$("#repo-name").textContent = `${DEPOT.owner}/${DEPOT.repo}`;
$("#repo-name-2").textContent = DEPOT.repo;

$("#login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const saisi = $("#token").value.trim();
  if (!saisi) return;
  const bouton = $("#login-btn");
  const erreur = $("#login-error");
  bouton.disabled = true;
  bouton.textContent = "Connexion…";
  erreur.hidden = true;
  jeton = saisi;
  try {
    await gh("");                     // vérifie l'accès au dépôt
    (($("#remember").checked) ? localStorage : sessionStorage).setItem(CLE_JETON, jeton);
    $("#token").value = "";
    await demarrer();
  } catch (err) {
    jeton = "";
    erreur.textContent = messageErreur(err);
    erreur.hidden = false;
  } finally {
    bouton.disabled = false;
    bouton.textContent = "Se connecter";
  }
});

$("#logout").addEventListener("click", () => {
  localStorage.removeItem(CLE_JETON);
  sessionStorage.removeItem(CLE_JETON);
  jeton = "";
  etat.reference = instantane();   // pas d'alerte « modifications non publiées »
  etat.aEnvoyer.clear();
  location.reload();
});

/* =========================================================
   CHARGEMENT
   ========================================================= */
async function chargerDonnees() {
  const [projetsTxt, siteTxt] = await Promise.all([
    gh(`/contents/projets.json?ref=${DEPOT.branch}`, { raw: true }).catch((e) => (e.status === 404 ? "[]" : Promise.reject(e))),
    gh(`/contents/site.json?ref=${DEPOT.branch}`, { raw: true }).catch((e) => (e.status === 404 ? "{}" : Promise.reject(e))),
  ]);

  let projets = JSON.parse(projetsTxt);
  if (!Array.isArray(projets)) projets = projets.projets || [];
  etat.projets = projets
    .filter((p) => p && p.image)
    .map((p) => ({ titre: p.titre || "", categorie: normaliser(p.categorie), image: p.image }));

  const site = JSON.parse(siteTxt || "{}");
  etat.site = {
    textes: { ...(site.textes || {}) },
    contact: { ...(site.contact || {}) },
    chaine: { nom: "", handle: "", abonnes: "", avatar: "", banniere: "", ...(site.chaine || {}) },
    offre: { image: "", ...(site.offre || {}) },
  };
  const videos = Array.isArray(etat.site.chaine.videos) ? etat.site.chaine.videos : [];
  etat.site.chaine.videos = Array.from({ length: NB_VIDEOS }, (_, i) => ({ image: "", titre: "", duree: "", ...(videos[i] || {}) }));

  etat.imagesConnues = new Set([...etat.projets.map((p) => p.image), ...cheminsImagesSite()]);
  etat.aEnvoyer.clear();
  etat.reference = instantane();
}

async function demarrer() {
  $("#login").hidden = true;
  $("#app").hidden = false;
  statut("Chargement…");
  try {
    await chargerDonnees();
    rendreTout();
  } catch (err) {
    if (err.status === 401 || err.status === 404) {
      // jeton expiré ou sans accès : retour à l'écran de connexion
      localStorage.removeItem(CLE_JETON);
      sessionStorage.removeItem(CLE_JETON);
      jeton = "";
      $("#app").hidden = true;
      $("#login").hidden = false;
      $("#login-error").textContent = messageErreur(err);
      $("#login-error").hidden = false;
      return;
    }
    statut(messageErreur(err), "error");
  }
}

function rendreTout() {
  rendreFiltres();
  rendreListe();
  rendreFormulaire("textes", $("#form-textes"));
  rendreFormulaire("contact", $("#form-contact"));
  rendreFormulaire("chaine", $("#form-chaine"));
  rendreImagesSite();
  majBarre();
}

/* =========================================================
   IMAGES DU SITE (PDP et bannière de la chaîne, image de l'offre)
   ========================================================= */
function rendreImagesSite() {
  Object.entries(IMAGES_SITE).forEach(([groupe, defs]) => {
    const box = $(`#pickers-${groupe}`);
    box.replaceChildren(...defs.map((d) => picker(groupe, d)));
  });

  // vidéos : miniature + titre + durée
  $("#videos-chaine").replaceChildren(...VIDEOS.map((d) => {
    const v = etat.site.chaine.videos[d.video];
    const champ = (cle, label, props = {}) => el("label", { class: "field" },
      el("span", { class: "field__label" }, label),
      el("input", {
        class: "input", type: "text", value: v[cle] || "", ...props,
        oninput: (e) => { v[cle] = e.target.value; majBarre(); },
      }),
    );
    return picker("chaine", d, [
      champ("titre", "Titre", { maxlength: "100", placeholder: "Vide = titre de la création" }),
      champ("duree", "Durée (facultatif)", { placeholder: "7:04", class: "input mono" }),
    ]);
  }));
}

function picker(groupe, d, extra = []) {
  const chemin = (cible(groupe, d)[d.cle] || "").trim();
  const nouveau = chemin && etat.aEnvoyer.has(chemin);

  const apercu = el("div", { class: `picker__preview picker__preview--${d.forme}` });
  if (chemin) {
    const img = el("img", { alt: "", src: etat.apercus.get(chemin) || `../${chemin}` });
    img.addEventListener("error", () => { if (!img.dataset.raw) { img.dataset.raw = "1"; img.src = urlRaw(chemin); } });
    apercu.append(img);
  } else {
    apercu.append(el("span", { class: "picker__defaut" }, "Par défaut"));
  }

  const input = el("input", { type: "file", accept: "image/png,image/jpeg,image/webp", hidden: true });
  input.addEventListener("change", async () => {
    const f = input.files[0];
    input.value = "";
    if (f) await choisirImageSite(groupe, d, f);
  });

  return el("div", { class: `picker${nouveau ? " is-new" : ""}` },
    el("p", { class: "picker__label" }, d.label),
    apercu,
    el("p", { class: "picker__meta mono" }, chemin ? (nouveau ? "Nouvelle, pas encore publiée" : chemin.split("/").pop()) : d.defaut),
    el("div", { class: "picker__actions" },
      el("button", { class: "btn btn--ghost btn--sm", type: "button", onclick: () => input.click() }, chemin ? "Changer" : "Choisir une image"),
      chemin ? el("button", { class: "btn btn--ghost btn--sm", type: "button", onclick: () => definirImageSite(groupe, d, "") }, "Par défaut") : null,
    ),
    input,
    ...extra,
  );
}

async function choisirImageSite(groupe, d, fichier) {
  if (!fichier.type.startsWith("image/")) return statut("Ce fichier n'est pas une image.", "error");
  const source = URL.createObjectURL(fichier);
  try {
    const img = await chargerImage(source);
    const { blob, ext } = await optimiser(fichier, img, d.max);
    if (blob.size > POIDS_ALERTE) throw new Error("Image trop lourde (plus de 15 Mo), même après optimisation.");
    const nom = d.video !== undefined ? `video-${d.video + 1}` : d.cle;
    const chemin = `images/site/${groupe}-${nom}-${Date.now().toString(36)}.${ext}`;
    etat.aEnvoyer.set(chemin, blob);
    etat.apercus.set(chemin, URL.createObjectURL(blob));
    definirImageSite(groupe, d, chemin);
  } catch (err) {
    statut(err.message || "Impossible de lire cette image.", "error");
  } finally {
    URL.revokeObjectURL(source);
  }
}

function definirImageSite(groupe, d, chemin) {
  const objet = cible(groupe, d);
  const ancien = (objet[d.cle] || "").trim();
  // une image choisie puis remplacée avant publication n'est jamais envoyée
  if (ancien && ancien !== chemin && etat.aEnvoyer.has(ancien)) etat.aEnvoyer.delete(ancien);
  objet[d.cle] = chemin;
  rendreImagesSite();
  rendreListe();
  majBarre();
}

/* =========================================================
   CRÉATIONS
   ========================================================= */
function rendreFiltres() {
  const box = $("#chips");
  box.replaceChildren();
  [{ id: "tout", nom: "Tout" }, ...CATEGORIES].forEach((c) => {
    const n = c.id === "tout" ? etat.projets.length : etat.projets.filter((p) => p.categorie === c.id).length;
    box.append(el("button", {
      class: `chip${etat.filtre === c.id ? " is-active" : ""}`,
      type: "button",
      "aria-pressed": String(etat.filtre === c.id),
      onclick: () => { etat.filtre = c.id; rendreFiltres(); rendreListe(); },
    }, c.nom, el("span", { class: "mono" }, String(n))));
  });
}

function rendreListe() {
  const liste = $("#list");
  liste.replaceChildren();
  const visibles = etat.projets
    .map((p, index) => ({ p, index }))
    .filter(({ p }) => etat.filtre === "tout" || p.categorie === etat.filtre);
  $("#list-empty").hidden = visibles.length > 0;

  visibles.forEach(({ p, index }, rang) => {
    const img = el("img", { alt: "", loading: "lazy", src: p._apercu || `../${p.image}` });
    img.addEventListener("error", () => { if (!img.dataset.raw && !p._apercu) { img.dataset.raw = "1"; img.src = urlRaw(p.image); } }, { once: false });

    const titre = el("input", {
      class: "input", value: p.titre, maxlength: "80", "aria-label": "Titre",
      oninput: (e) => { p.titre = e.target.value; majBarre(); },
    });

    const select = el("select", {
      class: "input", "aria-label": "Catégorie",
      onchange: (e) => {
        p.categorie = e.target.value;
        // une image pas encore envoyée change aussi de dossier
        if (p._nouveau) {
          const ancien = p.image;
          p.image = ancien.replace(/^images\/[^/]+\//, `images/${dossier(p.categorie)}/`);
          const blob = etat.aEnvoyer.get(ancien);
          etat.aEnvoyer.delete(ancien);
          etat.aEnvoyer.set(p.image, blob);
        }
        rendreFiltres(); rendreListe(); majBarre();
      },
    }, CATEGORIES.map((c) => el("option", { value: c.id, selected: c.id === p.categorie }, c.nom)));

    const memeCat = etat.projets.filter((x) => x.categorie === p.categorie);
    const rangCat = memeCat.indexOf(p) + 1;
    const usage = usageEnHaut(p.categorie, rangCat);

    const meta = el("p", { class: "item__meta mono" },
      el("span", {}, p.image.split("/").pop()),
      p._nouveau ? el("span", { class: "badge" }, "Nouvelle, pas encore publiée") : null,
      usage ? el("span", {}, usage) : null,
    );

    const filtre = etat.filtre !== "tout";
    const precedent = visibles[rang - 1];
    const suivant = visibles[rang + 1];

    const actions = el("div", { class: "item__actions" },
      el("span", { class: "item__rank mono" }, `#${rang + 1}`),
      boutonIcone(ICONES.premier, "Mettre en premier", rang === 0, () => deplacer(index, visibles[0].index)),
      boutonIcone(ICONES.haut, "Monter", !precedent, () => echanger(index, precedent.index)),
      boutonIcone(ICONES.bas, "Descendre", !suivant, () => echanger(index, suivant.index)),
      boutonIcone(ICONES.suppr, `Supprimer « ${p.titre || "sans titre"} »`, false, () => supprimer(index), "icon-btn--danger"),
    );
    if (filtre) actions.title = "L'ordre est modifié à l'intérieur de cette catégorie";

    liste.append(el("li", { class: `item${p._nouveau ? " is-new" : ""}` },
      el("div", { class: "item__thumb" }, img),
      el("div", { class: "item__fields" }, el("div", { class: "item__row" }, titre, select), meta),
      actions,
    ));
  });
}

/* Indique les créations reprises en haut du site ou dans l'offre */
function usageEnHaut(cat, rang) {
  const choisie = (g, c) => ((etat.site[g] || {})[c] || "").trim();
  if (cat === "bannieres" && rang === 1 && !choisie("chaine", "banniere")) return "Aperçu de chaîne (bannière)";
  if (cat === "pdp" && rang === 1 && !choisie("chaine", "avatar")) return "Aperçu de chaîne (PDP)";
  if (cat === "pdp" && rang === 2 && !choisie("offre", "image")) return "PDP de l'offre";
  const video = ((etat.site.chaine || {}).videos || [])[rang - 1];
  if (cat === "miniatures" && rang <= 3 && !(video && video.image)) return `Aperçu de chaîne (vidéo ${rang})`;
  return "";
}

const dossier = (cat) => (CATEGORIES.find((c) => c.id === cat) || { dossier: "autres" }).dossier;

function boutonIcone(d, label, desactive, action, extra = "") {
  return el("button", {
    class: `icon-btn ${extra}`, type: "button", "aria-label": label, title: label,
    disabled: desactive, onclick: action,
  }, icone(d));
}

function echanger(a, b) {
  [etat.projets[a], etat.projets[b]] = [etat.projets[b], etat.projets[a]];
  rendreListe(); majBarre();
}
function deplacer(de, vers) {
  const [p] = etat.projets.splice(de, 1);
  etat.projets.splice(vers, 0, p);
  rendreListe(); majBarre();
}
function supprimer(index) {
  const [p] = etat.projets.splice(index, 1);
  if (p._nouveau && !etat.projets.some((x) => x.image === p.image)) etat.aEnvoyer.delete(p.image);
  rendreFiltres(); rendreListe(); majBarre();
  statut(`« ${p.titre || "Sans titre"} » retirée. « Annuler les modifications » la remet tant que tu n'as pas publié.`, "dirty");
}

/* ---------- Ajout d'une création ---------- */
let ajout = null;   // { blob, ext, apercu, largeur, hauteur }

const drop = $("#drop");
$("#file").addEventListener("change", (e) => { const f = e.target.files[0]; if (f) preparer(f); e.target.value = ""; });
["dragenter", "dragover"].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.add("is-over"); }));
["dragleave", "drop"].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.remove("is-over"); }));
drop.addEventListener("drop", (e) => { const f = e.dataTransfer.files[0]; if (f) preparer(f); });

$("#add-cat").append(...CATEGORIES.map((c) => el("option", { value: c.id }, c.nom)));

async function preparer(fichier) {
  if (!fichier.type.startsWith("image/")) return statut("Ce fichier n'est pas une image.", "error");
  const source = URL.createObjectURL(fichier);
  try {
    const img = await chargerImage(source);
    const { blob, ext } = await optimiser(fichier, img);
    if (blob.size > POIDS_ALERTE) throw new Error("Image trop lourde (plus de 15 Mo), même après optimisation.");
    const apercu = URL.createObjectURL(blob);
    const ratio = img.naturalWidth / img.naturalHeight;

    ajout = { blob, ext, apercu };
    $("#add-img").src = apercu;
    $("#add-title").value = joliTitre(fichier.name);
    $("#add-cat").value = deviner(ratio);
    const kb = Math.round(blob.size / 1024);
    const reduit = blob !== fichier ? ` · optimisée (${Math.round(fichier.size / 1024)} → ${kb} Ko)` : ` · ${kb} Ko`;
    const w = Math.min(img.naturalWidth, IMAGE_MAX);
    const h = Math.round(w / ratio);
    $("#add-meta").textContent = `${w} × ${h}${reduit}`;
    $("#add-form").hidden = false;
    drop.hidden = true;
    $("#add-title").focus();
    $("#add-title").select();
  } catch (err) {
    statut(err.message || "Impossible de lire cette image.", "error");
  } finally {
    URL.revokeObjectURL(source);
  }
}

const chargerImage = (src) => new Promise((ok, ko) => {
  const img = new Image();
  img.onload = () => ok(img);
  img.onerror = () => ko(new Error("Impossible de lire cette image."));
  img.src = src;
});

/* Réduit les très grandes images et les convertit en WebP si c'est plus léger */
async function optimiser(fichier, img, max = IMAGE_MAX) {
  const extOrigine = (fichier.name.split(".").pop() || "png").toLowerCase().replace("jpeg", "jpg");
  if (fichier.type === "image/gif") return { blob: fichier, ext: "gif" };
  const echelle = Math.min(1, max / img.naturalWidth);
  if (echelle === 1 && fichier.size < 600 * 1024) return { blob: fichier, ext: extOrigine };

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.naturalWidth * echelle);
  canvas.height = Math.round(img.naturalHeight * echelle);
  canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
  const webp = await new Promise((ok) => canvas.toBlob(ok, "image/webp", 0.9));
  if (webp && webp.type === "image/webp" && (webp.size < fichier.size || echelle < 1)) return { blob: webp, ext: "webp" };
  return { blob: fichier, ext: extOrigine };
}

function deviner(ratio) {
  if (ratio > 2.2) return "bannieres";
  if (ratio > 1.4) return "miniatures";
  if (ratio > 0.9) return "pdp";
  return "3d";
}

const joliTitre = (nom) => {
  const base = nom.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
  return base ? base.charAt(0).toUpperCase() + base.slice(1) : "";
};

function fermerAjout() {
  ajout = null;
  $("#add-form").hidden = true;
  drop.hidden = false;
}
$("#add-cancel").addEventListener("click", fermerAjout);

$("#add-form").addEventListener("submit", (e) => {
  e.preventDefault();
  if (!ajout) return;
  const titre = $("#add-title").value.trim();
  const categorie = $("#add-cat").value;
  const chemin = `images/${dossier(categorie)}/${slug(titre)}-${Date.now().toString(36)}.${ajout.ext}`;
  etat.aEnvoyer.set(chemin, ajout.blob);
  etat.projets.unshift({ titre, categorie, image: chemin, _apercu: ajout.apercu, _nouveau: true });
  fermerAjout();
  etat.filtre = "tout";
  rendreFiltres(); rendreListe(); majBarre();
});

/* =========================================================
   TEXTES ET CONTACT
   ========================================================= */
function rendreFormulaire(groupe, conteneur) {
  conteneur.replaceChildren();
  CHAMPS[groupe].forEach((c) => {
    const valeur = etat.site[groupe][c.cle] ?? "";
    const props = {
      class: `input${c.mono ? " mono" : ""}`,
      placeholder: c.placeholder || "",
      oninput: (e) => { etat.site[groupe][c.cle] = e.target.value; majBarre(); },
    };
    const champ = c.type === "textarea"
      ? el("textarea", { ...props, rows: "4" }, valeur)
      : el("input", { ...props, type: c.inputType || "text", value: valeur, spellcheck: c.mono ? "false" : null });
    conteneur.append(el("label", { class: "field" },
      el("span", { class: "field__label" }, c.label),
      champ,
      c.aide ? el("span", { class: "field__help" }, c.aide) : null,
    ));
  });
}

/* =========================================================
   PUBLICATION
   ========================================================= */
function statut(texte, type = "") {
  const s = $("#status");
  s.className = `publish__status${type ? ` is-${type}` : ""}`;
  s.textContent = texte;
}

function majBarre() {
  const sale = modifie();
  $("#publish-btn").disabled = !sale || etat.enCours;
  $("#discard").disabled = !sale || etat.enCours;
  if (etat.enCours) return;
  if (sale) {
    const n = etat.aEnvoyer.size;
    statut(`Modifications non publiées${n ? ` · ${n} image${n > 1 ? "s" : ""} à envoyer` : ""}`, "dirty");
  } else if (!$("#status").classList.contains("is-ok")) {
    statut("Tout est publié");
  }
}

$("#discard").addEventListener("click", async () => {
  statut("Rechargement…");
  try { await chargerDonnees(); rendreTout(); statut("Modifications annulées"); }
  catch (err) { statut(messageErreur(err), "error"); }
});

$("#publish-btn").addEventListener("click", publier);

async function publier() {
  if (etat.enCours || !modifie()) return;
  const vides = etat.projets.filter((p) => !p.titre.trim());
  if (vides.length) {
    statut(`${vides.length} création${vides.length > 1 ? "s" : ""} sans titre : ajoute un titre avant de publier.`, "error");
    return;
  }

  etat.enCours = true;
  majBarre();
  try {
    statut("Publication… préparation");
    const ref = await gh(`/git/ref/heads/${DEPOT.branch}`);
    const parent = ref.object.sha;
    const commit = await gh(`/git/commits/${parent}`);
    const arbreBase = commit.tree.sha;

    const arbre = [];
    const utilisees = new Set([...etat.projets.map((p) => p.image), ...cheminsImagesSite()]);

    // 1. nouvelles images
    let i = 0;
    for (const [chemin, blob] of etat.aEnvoyer) {
      if (!utilisees.has(chemin)) continue;
      i += 1;
      statut(`Publication… envoi de l'image ${i}/${etat.aEnvoyer.size}`);
      const { sha } = await gh("/git/blobs", { method: "POST", body: { content: await enBase64(blob), encoding: "base64" } });
      arbre.push({ path: chemin, mode: "100644", type: "blob", sha });
    }

    // 2. données
    arbre.push({ path: "projets.json", mode: "100644", type: "blob", content: JSON.stringify(propres(), null, 2) + "\n" });
    arbre.push({ path: "site.json", mode: "100644", type: "blob", content: JSON.stringify(etat.site, null, 2) + "\n" });

    // 3. images retirées de la galerie → supprimées du dépôt
    const existants = new Set((await gh(`/git/trees/${arbreBase}?recursive=1`)).tree.map((t) => t.path));
    const retirees = [...etat.imagesConnues].filter((c) =>
      !utilisees.has(c) && existants.has(c) && c.startsWith("images/") && c !== "images/favicon.svg");
    retirees.forEach((c) => arbre.push({ path: c, mode: "100644", type: "blob", sha: null }));

    // 4. un seul commit
    statut("Publication… enregistrement");
    const nouvelArbre = await gh("/git/trees", { method: "POST", body: { base_tree: arbreBase, tree: arbre } });
    const nouveau = await gh("/git/commits", {
      method: "POST",
      body: { message: resume(retirees.length), tree: nouvelArbre.sha, parents: [parent] },
    });
    await gh(`/git/refs/heads/${DEPOT.branch}`, { method: "PATCH", body: { sha: nouveau.sha } });

    // succès
    etat.projets.forEach((p) => { delete p._nouveau; });
    etat.imagesConnues = new Set(utilisees);
    etat.aEnvoyer.clear();
    etat.reference = instantane();
    etat.enCours = false;
    rendreListe();
    majBarre();
    statut("Publié. Le site sera à jour dans 1 à 2 minutes.", "ok");
  } catch (err) {
    etat.enCours = false;
    majBarre();
    statut(messageErreur(err, "ecriture"), "error");
  }
}

function resume(nbRetirees) {
  const nouvelles = etat.projets.filter((p) => p._nouveau).length;
  const imagesSite = [...etat.aEnvoyer.keys()].filter((c) => c.startsWith("images/site/")).length;
  const morceaux = [];
  if (nouvelles) morceaux.push(`${nouvelles} création${nouvelles > 1 ? "s" : ""} ajoutée${nouvelles > 1 ? "s" : ""}`);
  if (imagesSite) morceaux.push(`${imagesSite} image${imagesSite > 1 ? "s" : ""} de la chaîne ou de l'offre`);
  if (nbRetirees) morceaux.push(`${nbRetirees} image${nbRetirees > 1 ? "s" : ""} retirée${nbRetirees > 1 ? "s" : ""}`);
  return `Mise à jour depuis le panel admin${morceaux.length ? ` : ${morceaux.join(", ")}` : ""}`;
}

/* Prévient avant de quitter la page avec des modifications non publiées */
window.addEventListener("beforeunload", (e) => {
  if (jeton && modifie()) { e.preventDefault(); e.returnValue = ""; }
});

/* Déjà connecté sur cet appareil ? */
if (jeton) demarrer();

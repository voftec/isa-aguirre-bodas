import {
  BRAND_CONFIG,
  PORTFOLIO_CATEGORIES,
  PORTFOLIO_ITEMS,
  FEATURED_STORIES,
  COLLECTIONS,
  ADDONS,
  TESTIMONIALS,
  FAQS
} from "./data.js";

const state = {
  activeCategory: "todos",
  filteredItems: [...PORTFOLIO_ITEMS],
  lightboxIndex: 0,
  selectedPackageId: "legado",
  selectedAddons: new Set()
};

const formatUSD = (amount) =>
  "$" + Number(amount).toLocaleString("en-US");

/* ==========================================================================
   1. HEADER SCROLL & MOBILE DRAWER
   ========================================================================== */

function initNavigation() {
  const header = document.getElementById("site-header");
  const toggleBtn = document.getElementById("mobile-menu-toggle");
  const drawer = document.getElementById("mobile-drawer");
  const closeBtn = document.getElementById("mobile-drawer-close");
  const scrim = document.getElementById("mobile-drawer-scrim");
  const stickyCta = document.getElementById("mobile-sticky-cta");
  const bookingSection = document.getElementById("reservar");

  let bookingVisible = false;

  const updateScrollChrome = () => {
    const y = window.scrollY;
    header.classList.toggle("is-scrolled", y > 24);
    if (stickyCta) {
      stickyCta.classList.toggle("is-visible", y > 520 && !bookingVisible);
    }
  };

  if (bookingSection && "IntersectionObserver" in window) {
    const obs = new IntersectionObserver(
      (entries) => {
        bookingVisible = entries[0].isIntersecting;
        updateScrollChrome();
      },
      { threshold: 0.12 }
    );
    obs.observe(bookingSection);
  }

  window.addEventListener("scroll", updateScrollChrome, { passive: true });
  updateScrollChrome();

  const setDrawer = (open) => {
    drawer.classList.toggle("is-open", open);
    drawer.setAttribute("aria-hidden", String(!open));
    toggleBtn.setAttribute("aria-expanded", String(open));
    document.body.classList.toggle("modal-open", open);
  };

  toggleBtn.addEventListener("click", () => setDrawer(true));
  closeBtn.addEventListener("click", () => setDrawer(false));
  scrim.addEventListener("click", () => setDrawer(false));

  drawer.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setDrawer(false));
  });
}

/* ==========================================================================
   2. PORTAFOLIO CON INDICADOR DESLIZANTE & LIGHTBOX CON GESTO FLUIDO
   ========================================================================== */

function moveTabIndicator(activeBtn) {
  const indicator = document.getElementById("tab-indicator");
  if (!indicator || !activeBtn) return;
  indicator.style.width = `${activeBtn.offsetWidth}px`;
  indicator.style.transform = `translateX(${activeBtn.offsetLeft - 5.6}px)`;
}

function renderPortfolioGrid() {
  const grid = document.getElementById("portfolio-grid");
  const isAll = state.activeCategory === "todos";
  grid.classList.toggle("portfolio-grid--filtered", !isAll);

  state.filteredItems = isAll
    ? [...PORTFOLIO_ITEMS]
    : PORTFOLIO_ITEMS.filter(
        (item) =>
          item.category === state.activeCategory ||
          item.secondaryCategory === state.activeCategory
      );

  // En vista completa ("todos"), asignamos ritmo editorial 12 columnas perfecto:
  // Fila 1: 5 + 7 | Fila 2: 4 + 4 + 4 | Fila 3: 7 + 5 | Fila 4: 4 + 4 + 4 | Fila 5: 6 + 6
  const editorialSpans = [5, 7, 4, 4, 4, 7, 5, 4, 4, 4, 6, 6];

  grid.innerHTML = state.filteredItems
    .map((item, idx) => {
      const span = isAll ? editorialSpans[idx] || 4 : 4;
      const spanClass = isAll && span !== 4 ? `gallery-card--span-${span}` : "";
      return `
      <button
        type="button"
        class="gallery-card ${spanClass}"
        data-index="${idx}"
        aria-label="Ver fotografía: ${item.title}"
      >
        <div class="gallery-card__img-wrap">
          <img src="${item.src}" alt="${item.title} — ${item.location}" loading="lazy" />
        </div>
        <div class="gallery-card__meta">
          <span class="gallery-card__title">${item.title}</span>
          <span class="gallery-card__loc">${item.location}</span>
        </div>
      </button>
    `;
    })
    .join("");

  grid.querySelectorAll(".gallery-card").forEach((card) => {
    card.addEventListener("click", () => {
      openLightbox(Number(card.dataset.index));
    });
  });
}

function initPortfolio() {
  const tabsContainer = document.getElementById("portfolio-tabs");
  const grid = document.getElementById("portfolio-grid");

  const buttonsHtml = PORTFOLIO_CATEGORIES.map(
    (cat) => `
    <button
      type="button"
      role="tab"
      class="portfolio-tab ${cat.id === state.activeCategory ? "is-active" : ""}"
      aria-selected="${cat.id === state.activeCategory}"
      data-category="${cat.id}"
    >
      ${cat.label}
    </button>
  `
  ).join("");

  tabsContainer.insertAdjacentHTML("beforeend", buttonsHtml);

  const tabButtons = Array.from(tabsContainer.querySelectorAll(".portfolio-tab"));

  const syncIndicator = () => {
    const current = tabButtons.find((b) => b.classList.contains("is-active"));
    if (current) {
      const indicator = document.getElementById("tab-indicator");
      indicator.style.width = `${current.offsetWidth}px`;
      indicator.style.transform = `translateX(${current.offsetLeft}px)`;
      indicator.style.left = "0px";
    }
  };

  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const cat = btn.dataset.category;
      if (cat === state.activeCategory) return;
      state.activeCategory = cat;

      tabButtons.forEach((b) => {
        const active = b === btn;
        b.classList.toggle("is-active", active);
        b.setAttribute("aria-selected", String(active));
      });
      syncIndicator();

      grid.classList.add("is-filtering");
      window.setTimeout(() => {
        renderPortfolioGrid();
        grid.classList.remove("is-filtering");
      }, 160);
    });
  });

  renderPortfolioGrid();
  requestAnimationFrame(syncIndicator);
  window.addEventListener("resize", syncIndicator, { passive: true });
}

/* Lightbox con navegación instantánea por teclado y swipe por velocidad */
function updateLightboxSlide() {
  const item = state.filteredItems[state.lightboxIndex];
  if (!item) return;

  const img = document.getElementById("lightbox-img");
  img.src = item.src;
  img.alt = `${item.title} — ${item.location}`;

  document.getElementById("lightbox-counter").textContent = `${String(
    state.lightboxIndex + 1
  ).padStart(2, "0")} / ${String(state.filteredItems.length).padStart(2, "0")}`;
  document.getElementById("lightbox-meta").textContent = `${item.moment} · ${item.location}`;
  document.getElementById("lightbox-title").textContent = item.title;
  document.getElementById("lightbox-caption").textContent = item.caption;
}

function openLightbox(index) {
  state.lightboxIndex = index;
  updateLightboxSlide();
  const modal = document.getElementById("lightbox");
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
}

function closeLightbox() {
  const modal = document.getElementById("lightbox");
  if (!modal.classList.contains("is-open")) return;
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

function initLightbox() {
  const modal = document.getElementById("lightbox");
  const stage = document.getElementById("lightbox-stage");
  const prevBtn = document.getElementById("lightbox-prev");
  const nextBtn = document.getElementById("lightbox-next");
  const closeBtn = document.getElementById("lightbox-close");
  const inquireBtn = document.getElementById("lightbox-inquire");

  const step = (dir) => {
    const total = state.filteredItems.length;
    state.lightboxIndex = (state.lightboxIndex + dir + total) % total;
    updateLightboxSlide();
  };

  prevBtn.addEventListener("click", () => step(-1));
  nextBtn.addEventListener("click", () => step(1));
  closeBtn.addEventListener("click", closeLightbox);
  inquireBtn.addEventListener("click", closeLightbox);

  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeLightbox();
  });

  // Swipe táctil con detección de velocidad (velocity > 0.11)
  let startX = 0;
  let startTime = 0;
  let dragging = false;

  stage.addEventListener("pointerdown", (e) => {
    if (e.target.closest("button")) return;
    dragging = true;
    startX = e.clientX;
    startTime = performance.now();
  });

  stage.addEventListener("pointerup", (e) => {
    if (!dragging) return;
    dragging = false;
    const dx = e.clientX - startX;
    const dt = Math.max(1, performance.now() - startTime);
    const velocity = Math.abs(dx) / dt;
    if (Math.abs(dx) > 48 || (Math.abs(dx) > 16 && velocity > 0.15)) {
      step(dx < 0 ? 1 : -1);
    }
  });
}

/* ==========================================================================
   3. HISTORIAS DESTACADAS & MODAL EDITORIAL
   ========================================================================== */

function initFeaturedStories() {
  const grid = document.getElementById("stories-grid");
  const modal = document.getElementById("story-modal");
  const closeBtn = document.getElementById("story-modal-close");
  const ctaBtn = document.getElementById("story-modal-cta");

  grid.innerHTML = FEATURED_STORIES.map(
    (story) => `
    <button type="button" class="story-card reveal" data-story="${story.id}">
      <div class="story-card__media">
        <img src="${story.cover}" alt="Boda de ${story.couple} en ${story.venue}" loading="lazy" />
        <span class="story-card__pill">Historia Real</span>
      </div>
      <div class="story-card__body">
        <span class="story-card__venue">${story.venue}</span>
        <h4 class="story-card__couple">${story.couple}</h4>
        <p class="story-card__summary">${story.summary}</p>
        <span class="story-card__cta">Ver historia completa →</span>
      </div>
    </button>
  `
  ).join("");

  const closeStory = () => {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  };

  grid.querySelectorAll(".story-card").forEach((card) => {
    card.addEventListener("click", () => {
      const story = FEATURED_STORIES.find((s) => s.id === card.dataset.story);
      if (!story) return;

      document.getElementById("story-modal-meta").textContent = `${story.venue} · ${story.season}`;
      document.getElementById("story-modal-couple").textContent = story.couple;
      document.getElementById("story-modal-quote").textContent = `“${story.quote}”`;
      document.getElementById("story-modal-summary").textContent = story.summary;
      document.getElementById("story-modal-gallery").innerHTML = story.photos
        .map(
          (p) => `
          <figure class="story-modal__photo" style="margin: 0;">
            <img src="${p.src}" alt="${p.label}" loading="lazy" />
            <figcaption>${p.label}</figcaption>
          </figure>
        `
        )
        .join("");

      modal.classList.add("is-open");
      modal.setAttribute("aria-hidden", "false");
      document.body.classList.add("modal-open");
    });
  });

  closeBtn.addEventListener("click", closeStory);
  ctaBtn.addEventListener("click", closeStory);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeStory();
  });
}

/* ==========================================================================
   4. COLECCIONES Y PERSONALIZADOR INTERACTIVO DE PRECIOS PLACEHOLDER
   ========================================================================== */

const COLLECTION_SELECT_MAP = {
  esencia: "Colección Esencia — Desde $1,900 USD (5 h)",
  legado: "Colección Legado — $3,200 USD (8 h + 2do Fotógrafo + Pre-Boda)",
  eternidad: "Colección Eternidad — $4,600 USD (10 h + Cena Ensayo + Álbum Lino)"
};

function syncSelectionToForm() {
  const select = document.getElementById("f-collection");
  const pill = document.getElementById("selected-addons-pill");
  const pillText = document.getElementById("selected-addons-text");

  if (select && COLLECTION_SELECT_MAP[state.selectedPackageId]) {
    select.value = COLLECTION_SELECT_MAP[state.selectedPackageId];
  }

  const activeAddons = ADDONS.filter(
    (a) =>
      state.selectedAddons.has(a.id) &&
      !(a.includedIn || []).includes(state.selectedPackageId)
  );

  if (activeAddons.length > 0) {
    const pkg = COLLECTIONS.find((c) => c.id === state.selectedPackageId);
    const total =
      pkg.price + activeAddons.reduce((acc, item) => acc + item.price, 0);
    pillText.textContent = `Extras incluidos (${activeAddons
      .map((a) => a.label)
      .join(" + ")}) · Estimado total: ${formatUSD(total)} USD`;
    pill.classList.add("is-visible");
  } else {
    pill.classList.remove("is-visible");
    pillText.textContent = "";
  }
}

function renderCustomizer() {
  const pkgContainer = document.getElementById("customizer-packages");
  const addonsContainer = document.getElementById("customizer-addons");
  const currentPkg = COLLECTIONS.find((c) => c.id === state.selectedPackageId);

  pkgContainer.innerHTML = COLLECTIONS.map(
    (col) => `
    <button
      type="button"
      class="pkg-pill ${col.id === state.selectedPackageId ? "is-selected" : ""}"
      data-pkg="${col.id}"
    >
      <strong>${col.name}</strong>
      <span>${col.priceLabel} USD · ${col.hours.split("+")[0].trim()}</span>
    </button>
  `
  ).join("");

  addonsContainer.innerHTML = ADDONS.map((addon) => {
    const alreadyIncluded = (addon.includedIn || []).includes(
      state.selectedPackageId
    );
    const checked = !alreadyIncluded && state.selectedAddons.has(addon.id);
    return `
      <label class="addon-row ${checked ? "is-checked" : ""} ${
      alreadyIncluded ? "is-included" : ""
    }">
        <span class="addon-row__left">
          <input
            type="checkbox"
            data-addon="${addon.id}"
            ${checked || alreadyIncluded ? "checked" : ""}
            ${alreadyIncluded ? "disabled" : ""}
          />
          <span>
            <span class="addon-row__title">${addon.label}</span>
            <span class="addon-row__detail">${
              alreadyIncluded
                ? `Ya incluido sin costo extra en ${currentPkg.name}`
                : addon.detail
            }</span>
          </span>
        </span>
        <span class="addon-row__price">${
          alreadyIncluded ? "Incluido" : `+${formatUSD(addon.price)}`
        }</span>
      </label>
    `;
  }).join("");

  let addonsSum = 0;
  ADDONS.forEach((addon) => {
    const alreadyIncluded = (addon.includedIn || []).includes(
      state.selectedPackageId
    );
    if (!alreadyIncluded && state.selectedAddons.has(addon.id)) {
      addonsSum += addon.price;
    }
  });

  const total = currentPkg.price + addonsSum;
  const retainer = Math.round(total * (BRAND_CONFIG.retainerPercent / 100));
  const installment = Math.round((total - retainer) / 3);

  document.getElementById("summary-package-name").textContent =
    addonsSum > 0
      ? `${currentPkg.name} + Extras a medida`
      : currentPkg.name;
  document.getElementById(
    "summary-total"
  ).innerHTML = `${formatUSD(total)} <small style="font-family: var(--font-sans); font-size: 0.8rem; font-weight: 400; color: var(--ink-muted);">USD</small>`;
  document.getElementById("summary-retainer").textContent = `${formatUSD(
    retainer
  )} USD`;
  document.getElementById("summary-installment").textContent = `${formatUSD(
    installment
  )} USD c/u`;

  pkgContainer.querySelectorAll(".pkg-pill").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.selectedPackageId = btn.dataset.pkg;
      renderCustomizer();
      syncSelectionToForm();
    });
  });

  addonsContainer
    .querySelectorAll('input[type="checkbox"]:not(:disabled)')
    .forEach((chk) => {
      chk.addEventListener("change", () => {
        const id = chk.dataset.addon;
        if (chk.checked) {
          state.selectedAddons.add(id);
        } else {
          state.selectedAddons.delete(id);
        }
        renderCustomizer();
        syncSelectionToForm();
      });
    });
}

function initCollections() {
  const grid = document.getElementById("collections-grid");

  grid.innerHTML = COLLECTIONS.map(
    (col) => `
    <article class="collection-card ${
      col.featured ? "collection-card--featured" : ""
    } reveal">
      <div>
        <span class="collection-card__badge">${col.badge}</span>
        <h3 class="collection-card__name">${col.name}</h3>
        <p class="collection-card__sub">${col.subtitle}</p>

        <div class="collection-card__price-box">
          <span class="collection-card__prefix">${col.pricePrefix}</span>
          <div class="collection-card__price">${col.priceLabel} <small>USD</small></div>
          <span class="collection-card__hours">${col.hours}</span>
        </div>

        <p class="collection-card__ideal">${col.idealFor}</p>

        <ul class="collection-card__list">
          ${col.deliverables.map((d) => `<li>${d}</li>`).join("")}
        </ul>
      </div>

      <button
        type="button"
        class="btn ${col.featured ? "btn--primary" : "btn--outline"} btn--full select-collection-btn"
        data-col="${col.id}"
      >
        Elegir ${col.name} →
      </button>
    </article>
  `
  ).join("");

  grid.querySelectorAll(".select-collection-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.selectedPackageId = btn.dataset.col;
      renderCustomizer();
      syncSelectionToForm();
      document.getElementById("reservar").scrollIntoView({ behavior: "smooth" });
    });
  });

  document
    .getElementById("summary-apply-btn")
    .addEventListener("click", () => {
      syncSelectionToForm();
      document.getElementById("reservar").scrollIntoView({ behavior: "smooth" });
    });

  document
    .getElementById("clear-addons-btn")
    .addEventListener("click", () => {
      state.selectedAddons.clear();
      renderCustomizer();
      syncSelectionToForm();
    });

  renderCustomizer();
}

/* ==========================================================================
   5. TESTIMONIOS & PREGUNTAS FRECUENTES
   ========================================================================== */

function initTestimonialsAndFaq() {
  const tGrid = document.getElementById("testimonials-grid");
  tGrid.innerHTML = TESTIMONIALS.map(
    (t) => `
    <article class="testimonial-card reveal">
      <div>
        <span class="testimonial-card__tag">${t.highlight}</span>
        <blockquote class="testimonial-card__quote" style="margin-top: 1rem;">
          “${t.quote}”
        </blockquote>
      </div>
      <div class="testimonial-card__author">
        <strong>${t.author}</strong>
        <span>${t.context}</span>
      </div>
    </article>
  `
  ).join("");

  const faqList = document.getElementById("faq-list");
  faqList.innerHTML = FAQS.map(
    (item, idx) => `
    <div class="faq-item ${idx === 0 ? "is-open" : ""} reveal">
      <button
        type="button"
        class="faq-trigger"
        aria-expanded="${idx === 0}"
      >
        <span>${item.question}</span>
        <span class="faq-trigger__icon" aria-hidden="true">+</span>
      </button>
      <div class="faq-panel">
        <div class="faq-panel__inner">
          <p>${item.answer}</p>
        </div>
      </div>
    </div>
  `
  ).join("");

  faqList.querySelectorAll(".faq-trigger").forEach((trigger) => {
    trigger.addEventListener("click", () => {
      const parent = trigger.closest(".faq-item");
      const willOpen = !parent.classList.contains("is-open");

      faqList.querySelectorAll(".faq-item").forEach((el) => {
        el.classList.remove("is-open");
        el.querySelector(".faq-trigger").setAttribute("aria-expanded", "false");
      });

      if (willOpen) {
        parent.classList.add("is-open");
        trigger.setAttribute("aria-expanded", "true");
      }
    });
  });
}

/* ==========================================================================
   6. FORMULARIO DE CONVERSIÓN Y RESUMEN DIRECTO A WHATSAPP / EMAIL
   ========================================================================== */

function initBookingForm() {
  const form = document.getElementById("inquiry-form");
  const feedback = document.getElementById("form-feedback");
  const successBox = document.getElementById("inquiry-success");
  const resetBtn = document.getElementById("reset-inquiry-btn");
  const dateInput = document.getElementById("f-date");

  // Evita seleccionar fechas en el pasado
  const todayIso = new Date().toISOString().split("T")[0];
  dateInput.min = todayIso;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    feedback.textContent = "";

    const names = document.getElementById("f-names").value.trim();
    const email = document.getElementById("f-email").value.trim();
    const phone = document.getElementById("f-phone").value.trim();
    const date = document.getElementById("f-date").value;
    const venue = document.getElementById("f-venue").value.trim();
    const guests = document.getElementById("f-guests").value;
    const collection = document.getElementById("f-collection").value;
    const addonsSummary = document
      .getElementById("selected-addons-text")
      .textContent.trim();
    const story = document.getElementById("f-story").value.trim();

    if (!names || !email || !phone || !date || !venue) {
      feedback.textContent =
        "Por favor completa sus nombres, correo, teléfono, fecha estimada y lugar de la boda para poder verificar disponibilidad.";
      return;
    }

    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailValid) {
      feedback.textContent =
        "Por favor ingresa un correo electrónico válido para poder enviarte la propuesta.";
      return;
    }

    const formattedDate = new Date(date + "T12:00:00").toLocaleDateString(
      "es-ES",
      {
        day: "numeric",
        month: "long",
        year: "numeric"
      }
    );

    document.getElementById("confirm-names").textContent = names;
    document.getElementById("confirm-summary").innerHTML = `
      <div style="display: grid; gap: 0.35rem;">
        <div><strong>Fecha de boda:</strong> ${formattedDate}</div>
        <div><strong>Lugar / Ciudad:</strong> ${venue} (${guests})</div>
        <div><strong>Colección:</strong> ${collection}</div>
        ${addonsSummary ? `<div><strong>Personalización:</strong> ${addonsSummary}</div>` : ""}
        <div><strong>Contacto:</strong> ${email} · ${phone}</div>
      </div>
    `;

    const plainMessage = [
      `¡Hola Isa! Somos ${names} y nos encantaría consultar disponibilidad para nuestra boda.`,
      ``,
      `• Fecha: ${formattedDate}`,
      `• Lugar / Ciudad: ${venue}`,
      `• Invitados: ${guests}`,
      `• Colección de interés: ${collection}`,
      addonsSummary ? `• ${addonsSummary}` : null,
      story ? `• Sobre nuestra boda: ${story}` : null,
      `• Correo: ${email} | Tel: ${phone}`
    ]
      .filter(Boolean)
      .join("\n");

    const waUrl = `https://wa.me/${
      BRAND_CONFIG.whatsappNumber
    }?text=${encodeURIComponent(plainMessage)}`;
    const mailUrl = `mailto:${BRAND_CONFIG.email}?subject=${encodeURIComponent(
      `Consulta de Boda — ${names} (${formattedDate})`
    )}&body=${encodeURIComponent(plainMessage)}`;

    document.getElementById("whatsapp-direct-btn").href = waUrl;
    document.getElementById("mailto-direct-btn").href = mailUrl;

    form.style.display = "none";
    successBox.classList.add("is-visible");
  });

  resetBtn.addEventListener("click", () => {
    successBox.classList.remove("is-visible");
    form.style.display = "block";
  });
}

/* ==========================================================================
   7. ATAJOS GLOBALES DE TECLADO Y ANIMACIONES DE SCROLL
   ========================================================================== */

function initGlobalListenersAndReveal() {
  document.addEventListener("keydown", (e) => {
    const lightboxOpen = document
      .getElementById("lightbox")
      .classList.contains("is-open");
    const storyOpen = document
      .getElementById("story-modal")
      .classList.contains("is-open");
    const drawerOpen = document
      .getElementById("mobile-drawer")
      .classList.contains("is-open");

    if (e.key === "Escape") {
      if (lightboxOpen) closeLightbox();
      if (storyOpen) document.getElementById("story-modal-close").click();
      if (drawerOpen) document.getElementById("mobile-drawer-close").click();
      return;
    }

    if (lightboxOpen) {
      if (e.key === "ArrowLeft") {
        document.getElementById("lightbox-prev").click();
      } else if (e.key === "ArrowRight") {
        document.getElementById("lightbox-next").click();
      }
    }
  });

  const revealEls = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) {
    revealEls.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
  );

  revealEls.forEach((el) => observer.observe(el));
}

/* ==========================================================================
   BOOT
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  initNavigation();
  initPortfolio();
  initLightbox();
  initFeaturedStories();
  initCollections();
  initTestimonialsAndFaq();
  initBookingForm();
  initGlobalListenersAndReveal();
});

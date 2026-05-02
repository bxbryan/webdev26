const worksPage = document.querySelector(".works-page");

if (worksPage) {
  const nav = document.querySelector(".works-nav");
  const hoverCapable = window.matchMedia("(hover: hover) and (pointer: fine)");
  const HIDE_SCROLL_THRESHOLD = 140;

  const getRevealZoneBottom = () => {
    if (!nav) return 0;

    const computed = window.getComputedStyle(nav);
    const stickyTop = Number.parseFloat(computed.top) || 0;
    const navHeight = nav.getBoundingClientRect().height;

    return stickyTop + navHeight;
  };

  const syncNavState = () => {
    if (!nav) return;

    if (!hoverCapable.matches) {
      worksPage.classList.remove("has-hover-nav", "works-nav-hidden", "works-nav-reveal");
      return;
    }

    worksPage.classList.add("has-hover-nav");
    const hidden = window.scrollY > HIDE_SCROLL_THRESHOLD;
    worksPage.classList.toggle("works-nav-hidden", hidden);

    if (!hidden) {
      worksPage.classList.remove("works-nav-reveal");
    }
  };

  const handlePointerMove = (event) => {
    if (!hoverCapable.matches) return;
    if (!worksPage.classList.contains("works-nav-hidden")) return;

    worksPage.classList.toggle("works-nav-reveal", event.clientY <= getRevealZoneBottom());
  };

  nav?.addEventListener("pointerenter", () => {
    if (worksPage.classList.contains("works-nav-hidden")) {
      worksPage.classList.add("works-nav-reveal");
    }
  });

  nav?.addEventListener("pointerleave", () => {
    if (worksPage.classList.contains("works-nav-hidden")) {
      worksPage.classList.remove("works-nav-reveal");
    }
  });

  window.addEventListener("scroll", syncNavState, { passive: true });
  window.addEventListener("pointermove", handlePointerMove, { passive: true });
  hoverCapable.addEventListener("change", syncNavState);

  syncNavState();
}

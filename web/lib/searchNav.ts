/**
 * Sticky nav scroll-spy + word-prefix search filter. Ported ~1:1 from the
 * original index.html inline scripts — operates directly on the DOM via
 * class markers (`.is-hidden`, `.active`) rather than React state, so the
 * exact matching/debounce/scroll-spy behavior carries over unchanged.
 * Call once from a useEffect in SearchNav.tsx; returns a teardown function.
 */
export function initSearchNav(): () => void {
  const teardown: Array<() => void> = [];
  const gtag = (...args: unknown[]) => {
    if (typeof (window as any).gtag === "function") (window as any).gtag(...args);
  };

  /* ---------- Scroll-spy (nav tabs highlight as you scroll) ---------- */
  const nav = document.getElementById("nav");
  if (nav) {
    const tabs = Array.from(nav.querySelectorAll<HTMLButtonElement>(".nav-tab"));
    const sections = tabs.map((tab) => document.getElementById(tab.dataset.target!));

    function setActive(id: string | undefined) {
      tabs.forEach((tab) => {
        const isActive = tab.dataset.target === id;
        tab.classList.toggle("active", isActive);
        if (isActive) scrollTabIntoView(tab);
      });
    }
    function scrollTabIntoView(tab: HTMLButtonElement) {
      const navRect = nav!.getBoundingClientRect();
      const tabRect = tab.getBoundingClientRect();
      const padding = 24;
      if (tabRect.left < navRect.left) {
        nav!.scrollLeft += tabRect.left - navRect.left - padding;
      } else if (tabRect.right > navRect.right) {
        nav!.scrollLeft += tabRect.right - navRect.right + padding;
      }
    }

    const onTabClick = (tab: HTMLButtonElement) => () => {
      gtag("event", "nav_tab_click", { event_category: "engagement", event_label: tab.textContent?.trim() });
      const target = document.getElementById(tab.dataset.target!);
      if (!target) return;
      const navH = nav!.offsetHeight;
      const top = target.getBoundingClientRect().top + window.scrollY - navH - 8;
      window.scrollTo({ top, behavior: "smooth" });
    };
    const tabHandlers = tabs.map((tab) => {
      const handler = onTabClick(tab);
      tab.addEventListener("click", handler);
      return { tab, handler };
    });
    teardown.push(() => tabHandlers.forEach(({ tab, handler }) => tab.removeEventListener("click", handler)));

    let observer: IntersectionObserver | undefined;
    if ("IntersectionObserver" in window) {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) setActive(entry.target.id);
          });
        },
        { rootMargin: "-15% 0px -70% 0px", threshold: 0 }
      );
      sections.forEach((section) => section && observer!.observe(section));
      teardown.push(() => observer?.disconnect());
    }

    setActive(sections[0]?.id);
  }

  /* ---------- Search filter ---------- */
  const input = document.getElementById("search-input") as HTMLInputElement | null;
  if (input) {
    const sections = Array.from(document.querySelectorAll<HTMLElement>(".cat-section"));
    const navTabs = Array.from(document.querySelectorAll<HTMLElement>(".nav-tab"));
    const emptyMsg = document.getElementById("search-empty");

    function normalize(s: string | null | undefined): string {
      return (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    }
    function matches(text: string, q: string): boolean {
      if (!text) return false;
      if (text.indexOf(q) === 0) return true;
      const tokens = text.split(/[^a-z0-9]+/);
      for (let i = 0; i < tokens.length; i++) {
        if (tokens[i].indexOf(q) === 0) return true;
      }
      return false;
    }
    function applyFilter() {
      const q = normalize(input!.value.trim());
      const active = q.length > 0;
      let anyVisible = false;

      sections.forEach((section) => {
        const titleEl = section.querySelector(".section-title");
        const categoryText = normalize(titleEl?.textContent);
        const cards = Array.from(section.querySelectorAll<HTMLElement>(".card"));
        let sectionHasMatch = false;

        cards.forEach((card) => {
          let match = true;
          if (active) {
            const nameEl = card.querySelector(".card-name");
            const imgEl = card.querySelector(".card-photo img");
            const name = normalize(nameEl?.textContent);
            const alt = normalize(imgEl?.getAttribute("alt"));
            match = matches(categoryText, q) || matches(name, q) || matches(alt, q);
          }
          card.classList.toggle("is-hidden", active && !match);
          if (match) sectionHasMatch = true;
        });

        section.classList.toggle("is-hidden", active && !sectionHasMatch);
        if (!active || sectionHasMatch) anyVisible = true;

        const tab = navTabs.find((t) => t.dataset.target === section.id);
        if (tab) tab.classList.toggle("is-hidden", active && !sectionHasMatch);
      });

      if (emptyMsg) emptyMsg.style.display = active && !anyVisible ? "block" : "none";

      if (active) {
        gtag("event", "search", { event_category: "engagement", search_term: input!.value.trim() });
      }
    }

    let debounceTimer: ReturnType<typeof setTimeout>;
    const onInput = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(applyFilter, 120);
    };
    input.addEventListener("input", onInput);
    teardown.push(() => {
      input.removeEventListener("input", onInput);
      clearTimeout(debounceTimer);
    });
  }

  return () => teardown.forEach((fn) => fn());
}

/**
 * Deterministic print-density resolver.
 *
 * Goal: preserve editorial grouping and avoid sparse continuation pages.
 * Physical page count is not a business gate. If content genuinely requires
 * more space after the two density passes, Chromium is allowed to continue.
 */

export async function applySmartPagination(page) {
  return page.evaluate(() => {
    const probe = document.createElement("div");
    probe.setAttribute("aria-hidden", "true");
    probe.style.cssText = [
      "position:absolute",
      "visibility:hidden",
      "pointer-events:none",
      "width:1px",
      "height:297mm",
      "inset:auto"
    ].join(";");

    document.body.appendChild(probe);
    const a4Height = probe.getBoundingClientRect().height;
    probe.remove();

    const results = [];
    const pages = [...document.querySelectorAll(".report-page:not(.cover)")];

    const px = value => Number.parseFloat(value || "0") || 0;

    const measure = element => {
      const elementRect = element.getBoundingClientRect();
      const shell = element.querySelector(".page-shell");
      const footer = element.querySelector(".footer");
      const shellRect = shell?.getBoundingClientRect() || elementRect;
      const footerRect = footer?.getBoundingClientRect();

      const style = getComputedStyle(element);
      const paddingTop = px(style.paddingTop);
      const paddingBottom = px(style.paddingBottom);

      const contentNodes = [
        ...(shell?.children || [])
      ];

      const contentBottom = contentNodes.length
        ? Math.max(...contentNodes.map(node => node.getBoundingClientRect().bottom))
        : shellRect.bottom;

      const footerReserve = footerRect
        ? Math.max(0, elementRect.bottom - footerRect.top) + 8
        : 34;

      const safeBottom = elementRect.top + a4Height - footerReserve - paddingBottom;
      const contentTop = elementRect.top + paddingTop;
      const safeContentHeight = Math.max(1, safeBottom - contentTop);
      const usedContentHeight = Math.max(0, contentBottom - contentTop);
      const safeRatio = usedContentHeight / safeContentHeight;

      /*
       * Print fragmentation can push an indivisible child even when the
       * section's outer box itself is <= A4. Keep a reserve so cards/tables
       * are not forced wholesale onto the next physical page.
       */
      const fragmentationRisk = contentNodes.some(node => {
        const rect = node.getBoundingClientRect();
        return rect.bottom > safeBottom + 1;
      });

      return {
        height: elementRect.height,
        outerRatio: a4Height > 0 ? elementRect.height / a4Height : 1,
        safeRatio,
        fragmentationRisk
      };
    };

    for (const element of pages) {
      const initial = measure(element);
      let density = "normal";

      /*
       * Target a real printable area rather than only the outer 297mm box.
       * 94% leaves enough room for browser fragmentation and the footer.
       */
      if (
        initial.safeRatio > 0.94 ||
        initial.fragmentationRisk
      ) {
        element.classList.add("density-compact");
        density = "compact";
      }

      const afterCompact = measure(element);

      if (
        afterCompact.safeRatio > 0.97 ||
        afterCompact.fragmentationRisk
      ) {
        element.classList.add("density-tight");
        density = "tight";
      }

      const final = measure(element);
      const continuationRequired =
        final.safeRatio > 1.02 &&
        final.fragmentationRisk;

      element.dataset.paginationDensity = density;
      element.dataset.continuationRequired = String(continuationRequired);

      results.push({
        sectionId: element.dataset.sectionId || "",
        initialRatio: Number(initial.safeRatio.toFixed(3)),
        finalRatio: Number(final.safeRatio.toFixed(3)),
        density,
        fragmentationRiskBefore: initial.fragmentationRisk,
        fragmentationRiskAfter: final.fragmentationRisk,
        continuationRequired
      });
    }

    return {
      a4Height: Number(a4Height.toFixed(2)),
      sections: results,
      compactedSections: results
        .filter(item => item.density !== "normal")
        .map(item => item.sectionId),
      continuationSections: results
        .filter(item => item.continuationRequired)
        .map(item => item.sectionId),
      fragmentationRiskSections: results
        .filter(item => item.fragmentationRiskAfter)
        .map(item => item.sectionId)
    };
  });
}

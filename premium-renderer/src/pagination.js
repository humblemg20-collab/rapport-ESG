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

    const measure = element => {
      const rect = element.getBoundingClientRect();
      return {
        height: rect.height,
        ratio: a4Height > 0 ? rect.height / a4Height : 1
      };
    };

    for (const element of pages) {
      const initial = measure(element);
      let density = "normal";

      if (initial.ratio > 1.005) {
        element.classList.add("density-compact");
        density = "compact";
      }

      let afterCompact = measure(element);

      if (afterCompact.ratio > 1.005) {
        element.classList.add("density-tight");
        density = "tight";
      }

      const final = measure(element);
      const continuationRequired = final.ratio > 1.005;

      element.dataset.paginationDensity = density;
      element.dataset.continuationRequired = String(continuationRequired);

      results.push({
        sectionId: element.dataset.sectionId || "",
        initialRatio: Number(initial.ratio.toFixed(3)),
        finalRatio: Number(final.ratio.toFixed(3)),
        density,
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
        .map(item => item.sectionId)
    };
  });
}

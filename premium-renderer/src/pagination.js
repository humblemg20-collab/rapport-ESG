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

      const atoms = [
        ...element.querySelectorAll("[data-print-atom]")
      ].map(node => {
        const rect = node.getBoundingClientRect();

        return {
          type: node.getAttribute("data-print-atom") || "",
          top: rect.top,
          bottom: rect.bottom,
          height: rect.height,
          crossesSafeBottom:
            rect.top < safeBottom - 1 &&
            rect.bottom > safeBottom + 1,
          startsAfterSafeBottom:
            rect.top >= safeBottom - 1
        };
      });

      const fragmentedAtoms = atoms.filter(atom =>
        atom.crossesSafeBottom ||
        atom.startsAfterSafeBottom
      );

      const orphanAtoms = fragmentedAtoms.filter(atom =>
        atom.height <= safeContentHeight * 0.25
      );

      const atomSegments = {};

      atoms.forEach(atom => {
        const relativeTop = Math.max(0, atom.top - elementRect.top);
        const segmentIndex = Math.floor(relativeTop / a4Height);

        if (!atomSegments[segmentIndex]) {
          atomSegments[segmentIndex] = [];
        }

        atomSegments[segmentIndex].push(atom);
      });

      const continuationSegments = Object.entries(atomSegments)
        .filter(([index]) => Number(index) >= 1)
        .map(([index, segmentAtoms]) => {
          const occupiedHeight = segmentAtoms.reduce(
            (sum, atom) => sum + Math.min(atom.height, safeContentHeight),
            0
          );

          return {
            index: Number(index),
            atomCount: segmentAtoms.length,
            occupiedRatio: occupiedHeight / safeContentHeight
          };
        });

      const sparseContinuationSegments = continuationSegments
        .filter(segment =>
          segment.atomCount > 0 &&
          segment.occupiedRatio < 0.34
        );

      const orphanRisk =
        (
          fragmentedAtoms.length > 0 &&
          orphanAtoms.length === fragmentedAtoms.length &&
          orphanAtoms.reduce((sum, atom) => sum + atom.height, 0) <=
            safeContentHeight * 0.28
        ) ||
        sparseContinuationSegments.length > 0;

      const fragmentationRisk =
        fragmentedAtoms.length > 0 ||
        contentNodes.some(node => {
          const rect = node.getBoundingClientRect();
          return rect.bottom > safeBottom + 1;
        });

      return {
        height: elementRect.height,
        outerRatio: a4Height > 0 ? elementRect.height / a4Height : 1,
        safeRatio,
        fragmentationRisk,
        orphanRisk,
        fragmentedAtomCount: fragmentedAtoms.length,
        orphanAtomCount: orphanAtoms.length,
        continuationSegments,
        sparseContinuationSegments
      };
    };

    for (const element of pages) {
      const initial = measure(element);
      let density = "normal";

      if (
        initial.safeRatio > 0.94 ||
        initial.fragmentationRisk ||
        initial.orphanRisk
      ) {
        element.classList.add("density-compact");
        density = "compact";
      }

      const afterCompact = measure(element);

      if (
        afterCompact.safeRatio > 0.97 ||
        afterCompact.fragmentationRisk ||
        afterCompact.orphanRisk
      ) {
        element.classList.add("density-tight");
        density = "tight";
      }

      const afterTight = measure(element);

      if (
        afterTight.orphanRisk ||
        (
          afterTight.fragmentationRisk &&
          afterTight.safeRatio <= 1.08
        )
      ) {
        element.classList.add("density-packed");
        density = "packed";
      }

      const afterPacked = measure(element);

      if (
        afterPacked.orphanRisk ||
        (
          afterPacked.fragmentationRisk &&
          afterPacked.safeRatio <= 1.14
        )
      ) {
        element.classList.add("density-rescue");
        density = "rescue";
      }

      const final = measure(element);

      const continuationRequired =
        final.safeRatio > 1.02 &&
        final.fragmentationRisk &&
        final.orphanRisk === false;

      element.dataset.paginationDensity = density;
      element.dataset.continuationRequired = String(continuationRequired);
      element.dataset.orphanRisk = String(final.orphanRisk);

      results.push({
        sectionId: element.dataset.sectionId || "",
        initialRatio: Number(initial.safeRatio.toFixed(3)),
        finalRatio: Number(final.safeRatio.toFixed(3)),
        density,
        fragmentationRiskBefore: initial.fragmentationRisk,
        fragmentationRiskAfter: final.fragmentationRisk,
        orphanRiskBefore: initial.orphanRisk,
        orphanRiskAfter: final.orphanRisk,
        fragmentedAtomCountBefore: initial.fragmentedAtomCount,
        fragmentedAtomCountAfter: final.fragmentedAtomCount,
        continuationSegmentsAfter: final.continuationSegments,
        sparseContinuationSegmentsAfter: final.sparseContinuationSegments,
        continuationRequired
      });
    }

    return {
      a4Height: Number(a4Height.toFixed(2)),
      sections: results,
      compactedSections: results
        .filter(item => item.density !== "normal")
        .map(item => item.sectionId),
      packedSections: results
        .filter(item => item.density === "packed")
        .map(item => item.sectionId),
      rescueSections: results
        .filter(item => item.density === "rescue")
        .map(item => item.sectionId),
      continuationSections: results
        .filter(item => item.continuationRequired)
        .map(item => item.sectionId),
      fragmentationRiskSections: results
        .filter(item => item.fragmentationRiskAfter)
        .map(item => item.sectionId),
      orphanRiskSections: results
        .filter(item => item.orphanRiskAfter)
        .map(item => item.sectionId)
    };
  });
}

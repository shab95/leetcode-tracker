(function milestoneCelebrationsFactory(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.MilestoneCelebrations = api;
})(typeof window === "undefined" ? null : window, () => {
  const GRADE_VALUES = new Set(["red", "yellow", "green"]);
  const COUNT_MILESTONES = Object.freeze([
    { value: 50, tier: 1, icon: "50", label: "50 distinct problems graded", title: "Momentum is real." },
    { value: 75, tier: 2, icon: "75", label: "75 distinct problems graded", title: "Seventy-five down." },
    { value: 100, tier: 3, icon: "100", label: "100 distinct problems graded", title: "Welcome to the century club." },
    { value: 150, tier: 4, icon: "150", label: "150 distinct problems graded", title: "This is serious range." },
    { value: 200, tier: 5, icon: "200", label: "200 distinct problems graded", title: "Two hundred strong." },
    { value: 250, tier: 6, icon: "250", label: "250 distinct problems graded", title: "A full 250-title body of work." },
  ]);
  const LIST_MILESTONES = Object.freeze([
    { key: "blind75", tier: 3, icon: "B75", label: "Blind 75 complete", title: "You finished Blind 75." },
    { key: "neetcode150", tier: 5, icon: "150", label: "NeetCode 150 complete", title: "You finished NeetCode 150." },
    { key: "neetcode250", tier: 6, icon: "250", label: "NeetCode 250 complete", title: "You finished NeetCode 250." },
  ]);

  function hasRealGrade(problem) {
    return GRADE_VALUES.has(problem?.lastGrade) ||
      (Array.isArray(problem?.reviewHistory) && problem.reviewHistory.some((entry) => GRADE_VALUES.has(entry?.grade)));
  }

  function normalizeTitle(value) {
    return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  }

  function slugFromUrl(value) {
    const match = String(value || "").match(/leetcode\.com\/problems\/([^/?#]+)/i);
    return match?.[1]?.toLowerCase() || "";
  }

  function identityFor(problem, catalog) {
    const canonical = catalog?.match?.(problem);
    if (canonical?.slug) return `catalog:${canonical.slug}`;
    const slug = String(problem?.titleSlug || problem?.slug || slugFromUrl(problem?.url)).trim().toLowerCase();
    if (slug) return `slug:${slug}`;
    return `title:${normalizeTitle(problem?.title)}`;
  }

  function buildSnapshot(problems = [], catalog = {}) {
    const titles = new Map();
    for (const problem of Array.isArray(problems) ? problems : []) {
      const key = identityFor(problem, catalog);
      if (!key || key === "title:") continue;
      const previous = titles.get(key) || { graded: false, memberships: new Set() };
      previous.graded = previous.graded || hasRealGrade(problem);
      for (const membership of catalog?.membershipsFor?.(problem) || []) previous.memberships.add(membership);
      titles.set(key, previous);
    }

    const totals = Object.fromEntries(LIST_MILESTONES.map(({ key }) => [
      key,
      (catalog?.catalog || []).filter((problem) => problem.listMemberships?.includes(key)).length,
    ]));
    const lists = {};
    for (const { key } of LIST_MILESTONES) {
      const graded = [...titles.values()].filter((title) => title.graded && title.memberships.has(key)).length;
      lists[key] = { graded, total: totals[key] || 0 };
    }

    return {
      gradedTitles: [...titles.values()].filter((title) => title.graded).length,
      lists,
    };
  }

  function findAchievements(before, after) {
    if (!before || !after) return null;
    const items = [];
    for (const milestone of COUNT_MILESTONES) {
      if (before.gradedTitles < milestone.value && after.gradedTitles >= milestone.value) {
        items.push({ ...milestone, type: "count" });
      }
    }
    for (const milestone of LIST_MILESTONES) {
      const previous = before.lists?.[milestone.key] || { graded: 0, total: 0 };
      const current = after.lists?.[milestone.key] || { graded: 0, total: 0 };
      if (current.total > 0 && previous.graded < current.total && current.graded >= current.total) {
        items.push({ ...milestone, type: "list", value: current.total });
      }
    }
    if (items.length === 0) return null;
    const primary = [...items].sort((a, b) => b.tier - a.tier || (a.type === "list" ? -1 : 1))[0];
    return {
      tier: Math.max(...items.map((item) => item.tier)),
      icon: primary.icon,
      title: items.length > 1 ? "Two milestones. One huge finish." : primary.title,
      summary: items.map((item) => item.label).join(" + "),
      gradedTitles: after.gradedTitles,
      items,
    };
  }

  return Object.freeze({ COUNT_MILESTONES, LIST_MILESTONES, buildSnapshot, findAchievements });
});

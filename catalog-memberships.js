(function catalogMembershipsFactory(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.CatalogMemberships = api;
})(typeof window === "undefined" ? null : window, () => {
  const MEMBERSHIPS = Object.freeze(["blind75", "neetcode150", "neetcode250"]);
  const SLUG_ALIASES = Object.freeze({
    "generate-parenthesis": "generate-parentheses",
    "implement-trie": "implement-trie-prefix-tree",
  });
  const canonicalSlug = (value) => SLUG_ALIASES[String(value || "").trim().toLowerCase().replace(/\/+$/g, "")] || String(value || "").trim().toLowerCase().replace(/\/+$/g, "");
  const normalizeTitle = (value) => String(value || "").toLowerCase().replace(/\bsoduku\b/g, "sudoku").replace(/[^a-z0-9]+/g, " ").trim();
  const problemSlug = (problem = {}) => canonicalSlug(problem.titleSlug || problem.slug || slugFromUrl(problem.url));
  function slugFromUrl(value) {
    try { return new URL(value || "").pathname.split("/").filter(Boolean).at(-1) || ""; } catch { return ""; }
  }
  function buildCatalog({ blind75 = [], neetcode150 = [], neetcode250 = [] } = {}) {
    const lists = { blind75, neetcode150, neetcode250 };
    const bySlug = new Map();
    const byTitle = new Map();
    for (const membership of MEMBERSHIPS) {
      for (const item of lists[membership] || []) {
        const slug = problemSlug(item);
        const title = normalizeTitle(item.title);
        const key = slug || title;
        if (!key) continue;
        const existing = bySlug.get(key) || {
          ...item,
          slug: slug || item.slug,
          listMemberships: [],
          listOrders: {},
        };
        existing.listMemberships = [...new Set([...existing.listMemberships, membership])];
        const rank = Number(item.order);
        if (Number.isInteger(rank) && rank > 0) existing.listOrders[membership] = rank;
        bySlug.set(key, existing);
        if (title) byTitle.set(title, existing);
      }
    }
    const catalog = [...bySlug.values()];
    return {
      catalog,
      membershipsFor(problem) {
        const match = bySlug.get(problemSlug(problem)) || byTitle.get(normalizeTitle(problem?.title));
        return match ? [...match.listMemberships] : [];
      },
      match(problem) { return bySlug.get(problemSlug(problem)) || byTitle.get(normalizeTitle(problem?.title)) || null; },
      orderFor(problem, scope) {
        const match = bySlug.get(problemSlug(problem)) || byTitle.get(normalizeTitle(problem?.title));
        if (!match) return Number.MAX_SAFE_INTEGER;
        const membership = scope === "all" ? "neetcode250" : scope;
        const rank = Number(match.listOrders?.[membership]);
        return Number.isInteger(rank) && rank > 0 ? rank : Number.MAX_SAFE_INTEGER;
      },
    };
  }
  return { MEMBERSHIPS, SLUG_ALIASES, canonicalSlug, normalizeTitle, problemSlug, buildCatalog };
});

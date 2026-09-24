const test = require("node:test");
const assert = require("node:assert/strict");
const { loadStudyCatalog } = require("../study-catalog.js");

test("canonical catalog is a 75 / 150 / 250 hierarchy with unique candidates", () => {
  const catalog = loadStudyCatalog();
  assert.equal(catalog.catalog.length, 250);
  assert.equal(catalog.catalog.filter((problem) => problem.listMemberships.includes("blind75")).length, 75);
  assert.equal(catalog.catalog.filter((problem) => problem.listMemberships.includes("neetcode150")).length, 150);
  assert.equal(catalog.catalog.filter((problem) => problem.listMemberships.includes("neetcode250")).length, 250);
  assert.ok(catalog.catalog
    .filter((problem) => problem.listMemberships.includes("blind75"))
    .every((problem) => problem.listMemberships.includes("neetcode150") && problem.listMemberships.includes("neetcode250")));
  assert.ok(catalog.catalog
    .filter((problem) => problem.listMemberships.includes("neetcode150"))
    .every((problem) => problem.listMemberships.includes("neetcode250")));
  assert.deepEqual(catalog.membershipsFor({ titleSlug: "two-sum" }), ["blind75", "neetcode150", "neetcode250"]);
  assert.deepEqual(catalog.membershipsFor({ titleSlug: "permutation-in-string" }), ["neetcode150", "neetcode250"]);
  assert.deepEqual(catalog.membershipsFor({ titleSlug: "concatenation-of-array" }), ["neetcode250"]);
  assert.deepEqual(catalog.membershipsFor({ titleSlug: "not-a-catalog-problem" }), []);
  assert.equal(catalog.orderFor({ titleSlug: "two-sum" }, "blind75"), 3);
  assert.equal(catalog.orderFor({ titleSlug: "two-sum" }, "neetcode150"), 3);
  assert.equal(catalog.orderFor({ titleSlug: "two-sum" }, "neetcode250"), 4);
});

test("NeetCode 250 is the pinned official sequence with one rank per title", () => {
  const catalog = loadStudyCatalog();
  const nc250 = catalog.catalog
    .filter((problem) => problem.listMemberships.includes("neetcode250"))
    .sort((a, b) => a.listOrders.neetcode250 - b.listOrders.neetcode250);
  assert.equal(nc250.length, 250);
  assert.deepEqual(nc250.map((problem) => problem.listOrders.neetcode250), Array.from({ length: 250 }, (_, index) => index + 1));
  assert.deepEqual(nc250.slice(0, 5).map((problem) => problem.slug), [
    "concatenation-of-array", "contains-duplicate", "valid-anagram", "two-sum", "longest-common-prefix",
  ]);
  assert.equal(nc250.at(-1).slug, "minimum-array-end");
});

test("catalog aliases repair historical title variants", () => {
  const catalog = loadStudyCatalog();
  assert.deepEqual(catalog.membershipsFor({ titleSlug: "implement-trie", title: "Implement Trie" }), ["blind75", "neetcode150", "neetcode250"]);
});

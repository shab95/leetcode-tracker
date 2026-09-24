const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const CatalogMemberships = require("./catalog-memberships.js");

function loadBrowserList(root, filename) {
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, "data", filename), "utf8"), { window: root });
}

function loadStudyCatalog() {
  const root = {};
  loadBrowserList(root, "blind-75.js");
  loadBrowserList(root, "neetcode-150.js");
  loadBrowserList(root, "neetcode-250.js");
  return CatalogMemberships.buildCatalog({
    blind75: root.BLIND_75,
    neetcode150: root.NEETCODE_150,
    neetcode250: root.NEETCODE_250,
  });
}

module.exports = { loadStudyCatalog };

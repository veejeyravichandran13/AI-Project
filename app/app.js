const STORAGE_KEY = "marketJournalEntriesV1";

const refs = {
  form: document.getElementById("entryForm"),
  date: document.getElementById("date"),
  assetType: document.getElementById("assetType"),
  name: document.getElementById("name"),
  horizon: document.getElementById("horizon"),
  bias: document.getElementById("bias"),
  confidence: document.getElementById("confidence"),
  risk: document.getElementById("risk"),
  thesis: document.getElementById("thesis"),
  action: document.getElementById("action"),
  clearForm: document.getElementById("clearForm"),
  filterDate: document.getElementById("filterDate"),
  filterType: document.getElementById("filterType"),
  filterBias: document.getElementById("filterBias"),
  exportData: document.getElementById("exportData"),
  importData: document.getElementById("importData"),
  clearAll: document.getElementById("clearAll"),
  statTotal: document.getElementById("statTotal"),
  statConfidence: document.getElementById("statConfidence"),
  statBullish: document.getElementById("statBullish"),
  entryList: document.getElementById("entryList"),
  entryTemplate: document.getElementById("entryTemplate")
};

let entries = loadEntries();

initialize();

function initialize() {
  refs.date.value = new Date().toISOString().slice(0, 10);

  refs.form.addEventListener("submit", handleSave);
  refs.clearForm.addEventListener("click", () => refs.form.reset());
  refs.filterDate.addEventListener("input", render);
  refs.filterType.addEventListener("change", render);
  refs.filterBias.addEventListener("change", render);
  refs.exportData.addEventListener("click", exportEntries);
  refs.importData.addEventListener("change", importEntries);
  refs.clearAll.addEventListener("click", clearAllEntries);

  render();
}

function loadEntries() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveEntries() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function handleSave(event) {
  event.preventDefault();

  const confidence = Number(refs.confidence.value);
  if (!Number.isFinite(confidence) || confidence < 1 || confidence > 10) {
    window.alert("Confidence must be between 1 and 10.");
    return;
  }

  const item = {
    id: crypto.randomUUID(),
    date: refs.date.value,
    assetType: refs.assetType.value,
    name: refs.name.value.trim(),
    horizon: refs.horizon.value,
    bias: refs.bias.value,
    confidence,
    risk: refs.risk.value,
    thesis: refs.thesis.value.trim(),
    action: refs.action.value.trim(),
    createdAt: new Date().toISOString()
  };

  entries.unshift(item);
  saveEntries();
  render();

  refs.form.reset();
  refs.date.value = new Date().toISOString().slice(0, 10);
  refs.confidence.value = "6";
}

function filteredEntries() {
  const date = refs.filterDate.value;
  const type = refs.filterType.value;
  const bias = refs.filterBias.value;

  return entries.filter((item) => {
    if (date && item.date !== date) return false;
    if (type !== "all" && item.assetType !== type) return false;
    if (bias !== "all" && item.bias !== bias) return false;
    return true;
  });
}

function render() {
  const filtered = filteredEntries();

  refs.entryList.innerHTML = "";
  if (!filtered.length) {
    const p = document.createElement("p");
    p.className = "empty";
    p.textContent = "No entries yet. Add your first market note.";
    refs.entryList.appendChild(p);
  } else {
    filtered.forEach((item) => {
      const node = refs.entryTemplate.content.cloneNode(true);
      node.querySelector(".entry-title").textContent = item.name;
      node.querySelector(".entry-meta").textContent = [
        formatDate(item.date),
        labelType(item.assetType),
        item.horizon,
        `Risk: ${item.risk}`
      ].join(" | ");
      const biasPill = node.querySelector(".entry-bias");
      biasPill.textContent = item.bias;
      biasPill.classList.add(item.bias);
      node.querySelector(".entry-thesis").textContent = `Thesis: ${item.thesis}`;
      node.querySelector(".entry-action").textContent = item.action
        ? `Action: ${item.action}`
        : "Action: Not specified";
      node.querySelector(".entry-confidence").textContent = `Confidence: ${item.confidence}/10`;
      node
        .querySelector(".delete-btn")
        .addEventListener("click", () => removeEntry(item.id));
      refs.entryList.appendChild(node);
    });
  }

  updateStats(filtered);
}

function removeEntry(id) {
  entries = entries.filter((entry) => entry.id !== id);
  saveEntries();
  render();
}

function updateStats(current) {
  const total = current.length;
  const avgConfidence =
    total > 0
      ? current.reduce((sum, item) => sum + Number(item.confidence || 0), 0) / total
      : 0;
  const bullishCount = current.filter((item) => item.bias === "bullish").length;
  const bullishRatio = total > 0 ? Math.round((bullishCount / total) * 100) : 0;

  refs.statTotal.textContent = String(total);
  refs.statConfidence.textContent = avgConfidence.toFixed(1);
  refs.statBullish.textContent = `${bullishRatio}%`;
}

function exportEntries() {
  const blob = new Blob([JSON.stringify(entries, null, 2)], {
    type: "application/json"
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `market-journal-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importEntries(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const imported = JSON.parse(String(reader.result || "[]"));
      if (!Array.isArray(imported)) throw new Error("Invalid format");

      const normalized = imported
        .filter((item) => item && typeof item === "object")
        .map((item) => ({
          id: String(item.id || crypto.randomUUID()),
          date: String(item.date || ""),
          assetType: item.assetType === "mutual-fund" ? "mutual-fund" : "stock",
          name: String(item.name || "Untitled"),
          horizon: String(item.horizon || "long-term"),
          bias: ["bullish", "neutral", "bearish"].includes(item.bias)
            ? item.bias
            : "neutral",
          confidence: clampNumber(item.confidence, 1, 10, 5),
          risk: ["low", "medium", "high"].includes(item.risk) ? item.risk : "medium",
          thesis: String(item.thesis || ""),
          action: String(item.action || ""),
          createdAt: String(item.createdAt || new Date().toISOString())
        }));

      entries = normalized.sort((a, b) =>
        String(b.date).localeCompare(String(a.date))
      );

      saveEntries();
      render();
      window.alert("Import complete.");
    } catch {
      window.alert("Could not import this file. Please use a valid JSON export.");
    } finally {
      event.target.value = "";
    }
  };
  reader.readAsText(file);
}

function clearAllEntries() {
  const confirmed = window.confirm("Delete all journal entries?");
  if (!confirmed) return;

  entries = [];
  saveEntries();
  render();
}

function formatDate(dateText) {
  const parsed = new Date(dateText);
  if (Number.isNaN(parsed.getTime())) return dateText;
  return parsed.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

function labelType(value) {
  return value === "mutual-fund" ? "Mutual Fund" : "Stock";
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");

const wb = XLSX.readFile(
  "C:/Users/Cenk/Desktop/Cascade Subat2026 Projeler Listesi.xlsx"
);

const turkiye = XLSX.utils.sheet_to_json(wb.Sheets["Türkiye - Şubat 2026"]);
const kurumsal = XLSX.utils.sheet_to_json(wb.Sheets["Kurumsal - Şubat 2026"]);
const intl = XLSX.utils.sheet_to_json(wb.Sheets["International - Feb 2026"]);

// Parse date helper - handles various Turkish date formats
function parseDate(d) {
  if (!d) return "";
  const s = String(d).trim();

  const trMonths = {
    Oca: "01",
    "\u015eub": "02",
    Mar: "03",
    Nis: "04",
    May: "05",
    Haz: "06",
    Tem: "07",
    "A\u011fu": "08",
    Eyl: "09",
    Eki: "10",
    Kas: "11",
    Ara: "12",
    Des: "12",
  };

  // Format: dd.Mon.yyyy (e.g., 07.Des.2020)
  let m = s.match(/^(\d{1,2})\.(.+?)\.(\d{4})$/);
  if (m && trMonths[m[2]]) {
    const mon = trMonths[m[2]];
    return m[3] + "-" + mon + "-" + m[1].padStart(2, "0");
  }

  // Format: dd.mm.yyyy (e.g., 01.01.2024)
  m = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (m) {
    return m[3] + "-" + m[2].padStart(2, "0") + "-" + m[1].padStart(2, "0");
  }

  // Format: mm/dd/yyyy
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) {
    return m[3] + "-" + m[1].padStart(2, "0") + "-" + m[2].padStart(2, "0");
  }

  return s;
}

let idCounter = 0;
function makeId(prefix) {
  return prefix + "-" + ++idCounter;
}

function buildHierarchyWithHedef(rows, source) {
  const plans = {};
  rows.forEach((r) => {
    const planName = r["Plan Ad\u0131"];
    if (!plans[planName])
      plans[planName] = { hedef: null, projects: [], currentProject: null };

    if (r["Seviye"] === "Hedef") {
      plans[planName].hedef = r;
    } else if (r["Seviye"] === "Proje") {
      const proj = { ...r, tasks: [] };
      plans[planName].projects.push(proj);
      plans[planName].currentProject = proj;
    } else if (r["Seviye"] === "Alt G\u00f6rev") {
      if (plans[planName].currentProject) {
        plans[planName].currentProject.tasks.push(r);
      }
    }
  });

  const hedefler = [];
  Object.entries(plans).forEach(([planName, data]) => {
    const h = data.hedef || {};
    const hedef = {
      id: makeId(
        source
          .toLowerCase()
          .replace(/ü/g, "u")
          .replace(/\s+/g, "-")
      ),
      name: h["G\u00f6rev/Proje Ad\u0131"] || planName,
      source: source,
      status: h["Durum"] || "On Track",
      leader: h["Proje Lideri"] || "",
      startDate: parseDate(h["Ba\u015flang\u0131\u00e7 Tarihi"] || ""),
      endDate: parseDate(h["Biti\u015f Tarihi"] || ""),
      projects: data.projects.map((p) => ({
        id: makeId("prj"),
        name: p["G\u00f6rev/Proje Ad\u0131"],
        status: p["Durum"] || "On Track",
        leader:
          p["Proje Lideri"] || h["Proje Lideri"] || "",
        startDate: parseDate(p["Ba\u015flang\u0131\u00e7 Tarihi"] || ""),
        endDate: parseDate(p["Biti\u015f Tarihi"] || ""),
        tasks: p.tasks.map((t) => ({
          id: makeId("tsk"),
          name: t["G\u00f6rev/Proje Ad\u0131"],
          progress: t["\u0130lerleme (%)"] || 0,
          status: t["Durum"] || "Not Started",
          startDate: parseDate(t["Ba\u015flang\u0131\u00e7 Tarihi"] || ""),
          endDate: parseDate(t["Biti\u015f Tarihi"] || ""),
        })),
      })),
    };
    hedefler.push(hedef);
  });
  return hedefler;
}

function buildKurumsalHierarchy(rows) {
  const plans = {};
  rows.forEach((r) => {
    const planName = r["Plan Ad\u0131"];
    if (!plans[planName])
      plans[planName] = {
        projects: [],
        currentProject: null,
        leader: null,
        startDate: null,
        endDate: null,
      };

    if (r["Seviye"] === "Proje") {
      const proj = { ...r, tasks: [] };
      plans[planName].projects.push(proj);
      plans[planName].currentProject = proj;
      if (r["Proje Lideri"]) plans[planName].leader = r["Proje Lideri"];
      if (!plans[planName].startDate)
        plans[planName].startDate = r["Ba\u015flang\u0131\u00e7 Tarihi"];
      plans[planName].endDate = r["Biti\u015f Tarihi"];
    } else if (r["Seviye"] === "Alt G\u00f6rev") {
      if (plans[planName].currentProject) {
        plans[planName].currentProject.tasks.push(r);
      }
    }
  });

  const hedefler = [];
  Object.entries(plans).forEach(([planName, data]) => {
    const statuses = data.projects.map((p) => p["Durum"]);
    let overallStatus = "On Track";
    if (statuses.includes("At Risk") || statuses.includes("Behind"))
      overallStatus = "At Risk";
    if (statuses.every((s) => s === "Achieved")) overallStatus = "Achieved";
    if (statuses.every((s) => s === "Not Started"))
      overallStatus = "Not Started";

    const hedef = {
      id: makeId("kurumsal"),
      name: planName,
      source: "Kurumsal",
      status: overallStatus,
      leader: data.leader || "",
      startDate: parseDate(data.startDate || ""),
      endDate: parseDate(data.endDate || ""),
      projects: data.projects.map((p) => ({
        id: makeId("prj"),
        name: p["G\u00f6rev/Proje Ad\u0131"],
        status: p["Durum"] || "On Track",
        leader: p["Proje Lideri"] || data.leader || "",
        startDate: parseDate(p["Ba\u015flang\u0131\u00e7 Tarihi"] || ""),
        endDate: parseDate(p["Biti\u015f Tarihi"] || ""),
        tasks: p.tasks.map((t) => ({
          id: makeId("tsk"),
          name: t["G\u00f6rev/Proje Ad\u0131"],
          progress: t["\u0130lerleme (%)"] || 0,
          status: t["Durum"] || "Not Started",
          startDate: parseDate(t["Ba\u015flang\u0131\u00e7 Tarihi"] || ""),
          endDate: parseDate(t["Biti\u015f Tarihi"] || ""),
        })),
      })),
    };
    hedefler.push(hedef);
  });
  return hedefler;
}

const turkiyeHedefler = buildHierarchyWithHedef(turkiye, "T\u00fcrkiye");
const kurumsalHedefler = buildKurumsalHierarchy(kurumsal);
const internationalHedefler = buildHierarchyWithHedef(intl, "International");

const allHedefler = [
  ...turkiyeHedefler,
  ...kurumsalHedefler,
  ...internationalHedefler,
];

// Count stats
let totalProjects = 0;
let onTrackProjects = 0;
let atRiskProjects = 0;
let behindProjects = 0;
let achievedProjects = 0;
let notStartedProjects = 0;
let totalTasks = 0;
let behindTasks = 0;
let atRiskTasks = 0;
let achievedTasks = 0;

allHedefler.forEach((h) => {
  h.projects.forEach((p) => {
    totalProjects++;
    if (p.status === "On Track") onTrackProjects++;
    if (p.status === "At Risk") atRiskProjects++;
    if (p.status === "Behind") behindProjects++;
    if (p.status === "Achieved") achievedProjects++;
    if (p.status === "Not Started") notStartedProjects++;
    p.tasks.forEach((t) => {
      totalTasks++;
      if (t.status === "Behind") behindTasks++;
      if (t.status === "At Risk") atRiskTasks++;
      if (t.status === "Achieved") achievedTasks++;
    });
  });
});

let completedHedefler = 0;
allHedefler.forEach((h) => {
  const allTasks = [];
  h.projects.forEach((p) => p.tasks.forEach((t) => allTasks.push(t)));
  if (allTasks.length > 0 && allTasks.every((t) => t.status === "Achieved")) {
    completedHedefler++;
  }
});

console.log("Turkiye hedefler:", turkiyeHedefler.length);
console.log("Kurumsal hedefler:", kurumsalHedefler.length);
console.log("International hedefler:", internationalHedefler.length);
console.log("Total hedefler:", allHedefler.length);
console.log(
  "Projects - Total:",
  totalProjects,
  "| On Track:",
  onTrackProjects,
  "| At Risk:",
  atRiskProjects,
  "| Behind:",
  behindProjects,
  "| Achieved:",
  achievedProjects,
  "| Not Started:",
  notStartedProjects
);
console.log(
  "Tasks - Total:",
  totalTasks,
  "| Behind:",
  behindTasks,
  "| At Risk:",
  atRiskTasks,
  "| Achieved:",
  achievedTasks
);
console.log(
  "Completed hedefler:",
  completedHedefler,
  "/",
  allHedefler.length
);

// Save parsed data
const outputPath = path.join(__dirname, "parsed-data.json");
fs.writeFileSync(
  outputPath,
  JSON.stringify(
    {
      turkiyeHedefler,
      kurumsalHedefler,
      internationalHedefler,
      allHedefler,
      stats: {
        totalProjects,
        onTrackProjects,
        atRiskProjects,
        behindProjects,
        achievedProjects,
        notStartedProjects,
        totalTasks,
        behindTasks,
        atRiskTasks,
        achievedTasks,
        completedHedefler,
        totalHedefler: allHedefler.length,
      },
    },
    null,
    2
  )
);
console.log("Data saved to", outputPath);

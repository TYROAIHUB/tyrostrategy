const fs = require("fs");
const path = require("path");

const data = JSON.parse(
  fs.readFileSync(path.join(__dirname, "parsed-data.json"), "utf8")
);

const {
  turkiyeHedefler,
  kurumsalHedefler,
  internationalHedefler,
  allHedefler,
  stats,
} = data;

const mockDataDir = path.join(
  __dirname,
  "..",
  "src",
  "lib",
  "mock-data"
);

// Helper to escape strings for TS
function esc(s) {
  if (!s) return "";
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
}

// ==========================================
// 1. cascade-data.ts
// ==========================================
function generateCascadeData() {
  function serializeGorev(t) {
    return `    {
      id: "${t.id}",
      name: "${esc(t.name)}",
      progress: ${t.progress},
      status: "${t.status}",
      startDate: "${t.startDate}",
      endDate: "${t.endDate}",
    }`;
  }

  function serializeProje(p) {
    const tasks = p.tasks.map(serializeGorev).join(",\n");
    return `  {
    id: "${p.id}",
    name: "${esc(p.name)}",
    status: "${p.status}",
    leader: "${esc(p.leader)}",
    startDate: "${p.startDate}",
    endDate: "${p.endDate}",
    tasks: [
${tasks}
    ],
  }`;
  }

  function serializeHedef(h) {
    const projects = h.projects.map(serializeProje).join(",\n");
    return `{
  id: "${h.id}",
  name: "${esc(h.name)}",
  source: "${esc(h.source)}",
  status: "${h.status}",
  leader: "${esc(h.leader)}",
  startDate: "${h.startDate}",
  endDate: "${h.endDate}",
  projects: [
${projects}
  ],
}`;
  }

  const content = `// Auto-generated from Cascade Excel data - Do not edit manually

export interface CascadeTask {
  id: string;
  name: string;
  level: "Hedef" | "Proje" | "Alt G\u00f6rev";
  source: "T\u00fcrkiye" | "Kurumsal" | "International";
  planName: string;
  progress: number;
  status: "On Track" | "Achieved" | "High Risk" | "At Risk" | "Not Started";
  startDate: string;
  endDate: string;
  leader: string;
}

export interface CascadeHedef {
  id: string;
  name: string;
  source: string;
  status: string;
  leader: string;
  startDate: string;
  endDate: string;
  projects: CascadeProje[];
}

export interface CascadeProje {
  id: string;
  name: string;
  status: string;
  leader: string;
  startDate: string;
  endDate: string;
  tasks: CascadeGorev[];
}

export interface CascadeGorev {
  id: string;
  name: string;
  progress: number;
  status: string;
  startDate: string;
  endDate: string;
}

export const turkiyeHedefler: CascadeHedef[] = [
${turkiyeHedefler.map(serializeHedef).join(",\n")}
];

export const kurumsalHedefler: CascadeHedef[] = [
${kurumsalHedefler.map(serializeHedef).join(",\n")}
];

export const internationalHedefler: CascadeHedef[] = [
${internationalHedefler.map(serializeHedef).join(",\n")}
];

export const allHedefler: CascadeHedef[] = [
  ...turkiyeHedefler,
  ...kurumsalHedefler,
  ...internationalHedefler,
];
`;

  fs.writeFileSync(path.join(mockDataDir, "cascade-data.ts"), content, "utf8");
  console.log("Generated cascade-data.ts");
}

// ==========================================
// 2. dashboard.ts
// ==========================================
function generateDashboard() {
  // Aktif projeler = On Track + At Risk
  const activeProjects = stats.onTrackProjects + stats.atRiskProjects;
  // Geciken = Behind + At Risk tasks
  const overdueTasks = stats.behindTasks + stats.atRiskTasks;
  // Hedef completion
  const hedefProgress = Math.round(
    (stats.completedHedefler / stats.totalHedefler) * 100
  );
  // Project progress (achieved / total)
  const projectProgress = Math.round(
    (stats.achievedProjects / stats.totalProjects) * 100
  );

  // Pick some real achieved projects for KPI details
  const achievedProjectNames = [];
  allHedefler.forEach((h) => {
    h.projects.forEach((p) => {
      if (p.status === "Achieved" && achievedProjectNames.length < 4) {
        achievedProjectNames.push(p.name);
      }
    });
  });

  // Pick representative projects for status groups
  const onTrackSamples = [];
  const atRiskSamples = [];
  const achievedSamples = [];
  const notStartedSamples = [];

  allHedefler.forEach((h) => {
    h.projects.forEach((p) => {
      // Calculate progress from tasks
      let prog = 0;
      if (p.tasks.length > 0) {
        const achievedCount = p.tasks.filter(
          (t) => t.status === "Achieved"
        ).length;
        prog = Math.round((achievedCount / p.tasks.length) * 100);
      }

      if (p.status === "On Track" && onTrackSamples.length < 4) {
        onTrackSamples.push({ name: p.name, progress: prog });
      }
      if (
        (p.status === "At Risk" || p.status === "High Risk") &&
        atRiskSamples.length < 4
      ) {
        atRiskSamples.push({ name: p.name, progress: prog });
      }
      if (p.status === "Achieved" && achievedSamples.length < 4) {
        achievedSamples.push({ name: p.name, progress: 100 });
      }
      if (p.status === "Not Started" && notStartedSamples.length < 4) {
        notStartedSamples.push({ name: p.name, progress: 0 });
      }
    });
  });

  // Activity feed from real projects
  const activityItems = [];
  let actIdx = 0;
  allHedefler.forEach((h) => {
    h.projects.forEach((p) => {
      p.tasks.forEach((t) => {
        if (t.status === "Achieved" && activityItems.length < 2) {
          activityItems.push({
            id: `a${++actIdx}`,
            title: `${t.name} tamamland\u0131`,
            description: `${p.name} projesinde g\u00f6rev tamamland\u0131`,
            time: "Bu hafta",
            color: "var(--tyro-success)",
          });
        }
        if (
          (t.status === "At Risk" || t.status === "High Risk") &&
          activityItems.length < 4
        ) {
          activityItems.push({
            id: `a${++actIdx}`,
            title:
              t.status === "High Risk"
                ? `${t.name} gecikiyor`
                : `${t.name} risk alt\u0131nda`,
            description: `${p.name} projesinde dikkat gerektiriyor`,
            time: "Bu hafta",
            color:
              t.status === "High Risk"
                ? "var(--tyro-danger)"
                : "var(--tyro-warning)",
          });
        }
      });
    });
  });

  // Ensure 5 activity items
  if (activityItems.length < 5) {
    activityItems.push({
      id: `a${++actIdx}`,
      title: "\u015eubat 2026 raporu haz\u0131rland\u0131",
      description: "Cascade proje durum raporu g\u00fcncellendi",
      time: "2 g\u00fcn \u00f6nce",
      color: "var(--tyro-navy)",
    });
  }

  function serializeStatusProjects(arr) {
    return arr
      .map(
        (p) =>
          `      { name: "${esc(p.name)}", progress: ${p.progress} }`
      )
      .join(",\n");
  }

  function serializeActivityItem(item) {
    return `  {
    id: "${item.id}",
    title: "${esc(item.title)}",
    description: "${esc(item.description)}",
    time: "${item.time}",
    color: "${item.color}",
  }`;
  }

  // Unique leaders count
  const leaders = new Set();
  allHedefler.forEach((h) => {
    if (h.leader) leaders.add(h.leader);
    h.projects.forEach((p) => {
      if (p.leader) leaders.add(p.leader);
    });
  });

  const content = `import type { ActivityItem, ChartDataPoint } from "@/types";

export const kpiData = [
  {
    id: "goal-completion",
    label: "Hedef Tamamlanma",
    value: ${stats.completedHedefler},
    target: ${stats.totalHedefler},
    suffix: "",
    progress: ${hedefProgress},
    trend: ${hedefProgress > 0 ? Math.round(hedefProgress * 0.1) : 0},
    trendLabel: "vs Q3",
    variant: "active" as const,
    icon: "Target",
    color: "var(--tyro-navy)",
    details: [
${achievedProjectNames
  .map(
    (n) =>
      `      { name: "${esc(n)}", status: "completed" }`
  )
  .join(",\n")}
    ],
  },
  {
    id: "active-projects",
    label: "Aktif Projeler",
    value: ${activeProjects},
    trend: ${stats.onTrackProjects},
    trendLabel: "on track",
    variant: "default" as const,
    icon: "Briefcase",
    color: "var(--tyro-gold)",
    sparklineData: [${Array.from({ length: 12 }, (_, i) => Math.max(5, activeProjects - 12 + i + Math.floor(Math.random() * 5))).join(", ")}],
  },
  {
    id: "budget-usage",
    label: "B\u00fct\u00e7e Kullan\u0131m",
    value: 24,
    suffix: "M",
    prefix: "\u20ba",
    progress: 68,
    trend: 4.7,
    trendLabel: "YoY",
    variant: "ring" as const,
    icon: "Wallet",
    color: "var(--tyro-success)",
    budgetTotal: 35,
  },
  {
    id: "overdue-tasks",
    label: "Geciken G\u00f6revler",
    value: ${overdueTasks},
    trend: ${-Math.round(overdueTasks * 0.15)},
    trendLabel: "vs ge\u00e7en hafta",
    variant: "default" as const,
    icon: "AlertTriangle",
    color: "var(--tyro-danger)",
    sparklineData: [${Array.from({ length: 12 }, () => Math.max(5, overdueTasks + Math.floor(Math.random() * 8) - 4)).join(", ")}],
    criticalCount: ${stats.behindTasks},
  },
];

export const chartData: ChartDataPoint[] = [
  { month: "A\u011fu", budget: 12, spend: 10 },
  { month: "Eyl", budget: 14, spend: 12 },
  { month: "Eki", budget: 11, spend: 13 },
  { month: "Kas", budget: 16, spend: 14 },
  { month: "Ara", budget: 15, spend: 12 },
  { month: "Oca", budget: 18, spend: 16 },
  { month: "\u015eub", budget: 17, spend: 15 },
  { month: "Mar", budget: 20, spend: 18 },
];

export const multiRingData = [
  { label: "Hedefler", progress: ${hedefProgress}, color: "var(--tyro-navy)" },
  { label: "Projeler", progress: ${projectProgress}, color: "var(--tyro-gold)" },
  { label: "B\u00fct\u00e7e", progress: 68, color: "var(--tyro-success)" },
];

export const projectStatusData = [
  {
    status: "Aktif",
    count: ${stats.onTrackProjects},
    color: "var(--tyro-success)",
    projects: [
${serializeStatusProjects(onTrackSamples)}
    ],
  },
  {
    status: "Risk Alt\u0131nda",
    count: ${stats.atRiskProjects + stats.behindProjects},
    color: "var(--tyro-warning)",
    projects: [
${serializeStatusProjects(atRiskSamples)}
    ],
  },
  {
    status: "Tamamlanan",
    count: ${stats.achievedProjects},
    color: "var(--tyro-navy)",
    projects: [
${serializeStatusProjects(achievedSamples)}
    ],
  },
  {
    status: "Planlanan",
    count: ${stats.notStartedProjects},
    color: "var(--tyro-info)",
    projects: [
${serializeStatusProjects(notStartedSamples)}
    ],
  },
];

export const activityFeed: ActivityItem[] = [
${activityItems.map(serializeActivityItem).join(",\n")}
];

export const miniKpiData = {
  teamMembers: ${leaders.size},
  completedTasks: ${stats.achievedTasks},
};
`;

  fs.writeFileSync(path.join(mockDataDir, "dashboard.ts"), content, "utf8");
  console.log("Generated dashboard.ts");
}

// ==========================================
// 3. projects.ts
// ==========================================
function generateProjects() {
  function mapStatus(s) {
    switch (s) {
      case "On Track":
        return "active";
      case "High Risk":
      case "At Risk":
        return "delayed";
      case "Achieved":
        return "completed";
      case "Not Started":
        return "planned";
      default:
        return "active";
    }
  }

  function mapDepartment(source) {
    switch (source) {
      case "T\u00fcrkiye":
        return "T\u00fcrkiye Operasyonlar\u0131";
      case "Kurumsal":
        return "Kurumsal";
      case "International":
        return "International";
      default:
        return "Genel";
    }
  }

  // Pick diverse projects from each source
  const projectList = [];
  let pid = 0;

  allHedefler.forEach((h) => {
    h.projects.forEach((p) => {
      // Calculate progress from tasks
      let prog = 0;
      if (p.tasks.length > 0) {
        const achievedCount = p.tasks.filter(
          (t) => t.status === "Achieved"
        ).length;
        prog = Math.round((achievedCount / p.tasks.length) * 100);
      }
      if (p.status === "Achieved") prog = 100;
      if (p.status === "Not Started") prog = 0;

      projectList.push({
        id: String(++pid),
        name: p.name,
        department: mapDepartment(h.source),
        status: mapStatus(p.status),
        progress: prog,
        owner: p.leader || h.leader || "Atanmam\u0131\u015f",
        deadline: p.endDate,
      });
    });
  });

  function serializeProject(p) {
    return `  {
    id: "${p.id}",
    name: "${esc(p.name)}",
    department: "${esc(p.department)}",
    status: "${p.status}",
    progress: ${p.progress},
    owner: "${esc(p.owner)}",
    deadline: "${p.deadline}",
  }`;
  }

  const content = `import type { Project } from "@/types";

export const projects: Project[] = [
${projectList.map(serializeProject).join(",\n")}
];
`;

  fs.writeFileSync(path.join(mockDataDir, "projects.ts"), content, "utf8");
  console.log("Generated projects.ts (" + projectList.length + " projects)");
}

// ==========================================
// 4. tree.ts
// ==========================================
function generateTree() {
  function buildTreeNode(h, sourceLabel) {
    const hedefNode = {
      id: h.id,
      name: h.name,
      type: "hedef",
      status: h.status,
      children: h.projects.map((p) => {
        let prog = 0;
        if (p.tasks.length > 0) {
          const achievedCount = p.tasks.filter(
            (t) => t.status === "Achieved"
          ).length;
          prog = Math.round((achievedCount / p.tasks.length) * 100);
        }
        return {
          id: p.id,
          name: p.name,
          type: "proje",
          progress: prog,
          status: p.status,
          children: p.tasks.map((t) => ({
            id: t.id,
            name: t.name,
            type: "gorev",
            progress: t.progress,
            status: t.status,
          })),
        };
      }),
    };
    return hedefNode;
  }

  function serializeTreeNode(node, indent) {
    const ind = "  ".repeat(indent);
    let s = `${ind}{\n`;
    s += `${ind}  id: "${node.id}",\n`;
    s += `${ind}  name: "${esc(node.name)}",\n`;
    s += `${ind}  type: "${node.type}",\n`;
    if (node.progress !== undefined)
      s += `${ind}  progress: ${node.progress},\n`;
    if (node.status) s += `${ind}  status: "${node.status}",\n`;
    if (node.children && node.children.length > 0) {
      s += `${ind}  children: [\n`;
      s += node.children
        .map((c) => serializeTreeNode(c, indent + 2))
        .join(",\n");
      s += `\n${ind}  ],\n`;
    }
    s += `${ind}}`;
    return s;
  }

  const treeData = [
    {
      id: "plan-turkiye",
      name: "T\u00fcrkiye Operasyonlar\u0131",
      type: "plan",
      children: turkiyeHedefler.map((h) => buildTreeNode(h, "T\u00fcrkiye")),
    },
    {
      id: "plan-kurumsal",
      name: "Kurumsal Projeler",
      type: "plan",
      children: kurumsalHedefler.map((h) => buildTreeNode(h, "Kurumsal")),
    },
    {
      id: "plan-international",
      name: "International Operations",
      type: "plan",
      children: internationalHedefler.map((h) =>
        buildTreeNode(h, "International")
      ),
    },
  ];

  const content = `import type { TreeNode } from "@/types";

export const treeData: TreeNode[] = [
${treeData.map((n) => serializeTreeNode(n, 1)).join(",\n")}
];
`;

  fs.writeFileSync(path.join(mockDataDir, "tree.ts"), content, "utf8");
  console.log("Generated tree.ts");
}

// ==========================================
// 5. kanban.ts
// ==========================================
function generateKanban() {
  function getInitials(name) {
    if (!name) return "??";
    return name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  function mapPriority(status) {
    switch (status) {
      case "High Risk":
        return "critical";
      case "At Risk":
        return "high";
      case "On Track":
        return "medium";
      default:
        return "low";
    }
  }

  // Collect projects by status
  const notStarted = [];
  const onTrack = [];
  const atRisk = [];
  const achieved = [];

  allHedefler.forEach((h) => {
    h.projects.forEach((p) => {
      const item = {
        name: p.name,
        leader: p.leader || h.leader || "",
        status: p.status,
        endDate: p.endDate,
        tasks: p.tasks,
        source: h.source,
      };
      if (p.status === "Not Started") notStarted.push(item);
      else if (p.status === "On Track") onTrack.push(item);
      else if (p.status === "At Risk" || p.status === "High Risk")
        atRisk.push(item);
      else if (p.status === "Achieved") achieved.push(item);
    });
  });

  function pickProjects(arr, count) {
    // Pick diverse projects
    const result = [];
    const sources = ["T\u00fcrkiye", "Kurumsal", "International"];
    for (const src of sources) {
      const fromSrc = arr.filter((p) => p.source === src);
      if (fromSrc.length > 0 && result.length < count) {
        result.push(fromSrc[0]);
      }
    }
    // Fill remaining
    for (const p of arr) {
      if (result.length >= count) break;
      if (!result.includes(p)) result.push(p);
    }
    return result.slice(0, count);
  }

  function makeCard(p, idx) {
    let prog = 0;
    if (p.tasks.length > 0) {
      const ac = p.tasks.filter((t) => t.status === "Achieved").length;
      prog = Math.round((ac / p.tasks.length) * 100);
    }
    if (p.status === "Achieved") prog = 100;

    return {
      id: `k${idx}`,
      title: p.name,
      description: `${p.source} - ${p.tasks.length} g\u00f6rev`,
      priority: mapPriority(p.status),
      assignee: p.leader,
      assigneeInitials: getInitials(p.leader),
      deadline: p.endDate,
      progress: prog,
      tags: [p.source],
    };
  }

  const yapilacak = pickProjects(notStarted, 3);
  const devamEden = pickProjects(onTrack, 4);
  const riskAltinda = pickProjects(atRisk, 4);
  const tamamlandi = pickProjects(achieved, 3);

  let cardIdx = 0;

  function serializeCard(card) {
    return `      {
        id: "${card.id}",
        title: "${esc(card.title)}",
        description: "${esc(card.description)}",
        priority: "${card.priority}",
        assignee: "${esc(card.assignee)}",
        assigneeInitials: "${card.assigneeInitials}",
        deadline: "${card.deadline}",
        progress: ${card.progress},
        tags: [${card.tags.map((t) => `"${esc(t)}"`).join(", ")}],
      }`;
  }

  function serializeColumn(col) {
    return `  {
    id: "${col.id}",
    title: "${esc(col.title)}",
    color: "${col.color}",
    cards: [
${col.cards.map(serializeCard).join(",\n")}
    ],
  }`;
  }

  const columns = [
    {
      id: "yapilacak",
      title: "Yap\u0131lacak",
      color: "var(--tyro-info)",
      cards: yapilacak.map((p) => makeCard(p, ++cardIdx)),
    },
    {
      id: "devam-eden",
      title: "Devam Eden",
      color: "var(--tyro-success)",
      cards: devamEden.map((p) => makeCard(p, ++cardIdx)),
    },
    {
      id: "risk-altinda",
      title: "Risk Alt\u0131nda",
      color: "var(--tyro-warning)",
      cards: riskAltinda.map((p) => makeCard(p, ++cardIdx)),
    },
    {
      id: "tamamlandi",
      title: "Tamamland\u0131",
      color: "var(--tyro-navy)",
      cards: tamamlandi.map((p) => makeCard(p, ++cardIdx)),
    },
  ];

  const content = `import type { KanbanColumn } from "@/types";

export const kanbanColumns: KanbanColumn[] = [
${columns.map(serializeColumn).join(",\n")}
];
`;

  fs.writeFileSync(path.join(mockDataDir, "kanban.ts"), content, "utf8");
  console.log("Generated kanban.ts");
}

// ==========================================
// 6. gantt.ts
// ==========================================
function generateGantt() {
  // Pick ~12 diverse projects with actual start/end dates
  const ganttProjects = [];
  const sources = ["T\u00fcrkiye", "Kurumsal", "International"];

  for (const src of sources) {
    const srcHedefler = allHedefler.filter((h) => h.source === src);
    let count = 0;
    for (const h of srcHedefler) {
      for (const p of h.projects) {
        if (p.startDate && p.endDate && count < 4) {
          let prog = 0;
          if (p.tasks.length > 0) {
            const ac = p.tasks.filter(
              (t) => t.status === "Achieved"
            ).length;
            prog = Math.round((ac / p.tasks.length) * 100);
          }
          if (p.status === "Achieved") prog = 100;

          ganttProjects.push({
            name: p.name,
            startDate: p.startDate,
            endDate: p.endDate,
            progress: prog,
            type: src,
          });
          count++;
        }
      }
    }
  }

  let gid = 0;
  function serializeGanttTask(t) {
    return `  {
    id: ${++gid},
    text: "${esc(t.name)}",
    start: new Date("${t.startDate}"),
    end: new Date("${t.endDate}"),
    progress: ${t.progress},
    type: "${esc(t.type)}",
  }`;
  }

  const content = `import type { GanttTask } from "@/types";

export const ganttTasks: GanttTask[] = [
${ganttProjects.map(serializeGanttTask).join(",\n")}
];
`;

  fs.writeFileSync(path.join(mockDataDir, "gantt.ts"), content, "utf8");
  console.log(
    "Generated gantt.ts (" + ganttProjects.length + " tasks)"
  );
}

// Run all generators
generateCascadeData();
generateDashboard();
generateProjects();
generateTree();
generateKanban();
generateGantt();

console.log("\nAll mock data files generated successfully!");

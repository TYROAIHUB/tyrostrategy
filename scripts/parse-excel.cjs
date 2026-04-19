const fs = require('fs');
const ExcelJS = require('exceljs');
const wb = new ExcelJS.Workbook();

const trMonths = { Oca: '01', 'Şub': '02', Mar: '03', Nis: '04', May: '05', Haz: '06', Tem: '07', 'Ağu': '08', Eyl: '09', Eki: '10', Kas: '11', Ara: '12' };

function parseDate(v) {
  if (!v) return '';
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  const s = String(v).trim();
  // DD.MM.YYYY
  let m = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (m) return m[3] + '-' + m[2].padStart(2, '0') + '-' + m[1].padStart(2, '0');
  // DD.Mon.YYYY (Turkish)
  m = s.match(/^(\d{1,2})\.(\w+)\.(\d{4})$/);
  if (m && trMonths[m[2]]) return m[3] + '-' + trMonths[m[2]] + '-' + m[1].padStart(2, '0');
  // MM/DD/YYYY
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return m[3] + '-' + m[1].padStart(2, '0') + '-' + m[2].padStart(2, '0');
  return s;
}

function esc(s) {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, ' ');
}

const FILE = 'C:/Users/Cenk/Desktop/Cascade Subat2026 Projeler Listesi.xlsx';

wb.xlsx.readFile(FILE).then(() => {
  const sg = { T: [], K: [], I: [] };
  let gIdx = 0;

  const sheets = [
    ['Türkiye - Şubat 2026', 'T', 'Türkiye'],
    ['Kurumsal - Şubat 2026', 'K', 'Kurumsal'],
    ['International - Feb 2026', 'I', 'International'],
  ];

  for (const [sheetName, key, source] of sheets) {
    const ws = wb.getWorksheet(sheetName);
    const isK = key === 'K';
    let curH = null, curP = null, multiFaz = false, fazP = null, tIdx = 0;

    for (let r = 2; r <= ws.rowCount; r++) {
      const row = ws.getRow(r);
      const tn = String(row.getCell(4).value || '').trim();
      const lv = String(row.getCell(5).value || '').trim();
      if (!tn) continue;

      let prog, st, sd, ed, ld;
      if (isK) {
        prog = 0;
        st = String(row.getCell(6).value || 'Not Started').trim();
        sd = parseDate(row.getCell(7).value);
        ed = parseDate(row.getCell(8).value);
        ld = String(row.getCell(9).value || '').trim();
      } else {
        prog = parseInt(row.getCell(6).value) || 0;
        st = String(row.getCell(7).value || 'Not Started').trim();
        sd = parseDate(row.getCell(8).value);
        ed = parseDate(row.getCell(9).value);
        ld = String(row.getCell(10).value || '').trim();
      }

      if (lv === 'Hedef') {
        if (curH && !multiFaz) sg[key].push(curH);
        gIdx++; tIdx = 0; multiFaz = false; fazP = null; curP = null;
        curH = { id: key.toLowerCase() + '-' + gIdx, name: tn, src: source, st, sd: sd || '2025-01-01', ed: ed || '2026-12-31', ld, tasks: [] };
      } else if (lv === 'Proje') {
        if (isK) {
          gIdx++; tIdx = 0;
          curP = { id: 'k-' + gIdx, name: tn, src: source, st, sd: sd || '2025-01-01', ed: ed || '2026-12-31', ld, tasks: [] };
          sg[key].push(curP);
        } else {
          const isFaz = /faz\s*\d|phase\s*\d/i.test(tn);
          if (isFaz || (curP !== null && curH)) {
            if (!multiFaz) { multiFaz = true; if (curH) curH.tasks = []; }
            gIdx++; tIdx = 0;
            fazP = { id: key.toLowerCase() + '-' + gIdx, name: tn, src: source, st: st || (curH ? curH.st : 'On Track'), sd: sd || (curH ? curH.sd : '2025-01-01'), ed: ed || (curH ? curH.ed : '2026-12-31'), ld: ld || (curH ? curH.ld : ''), tasks: [] };
            sg[key].push(fazP);
          } else {
            curP = { ld: ld || (curH ? curH.ld : '') };
          }
        }
      } else if (lv === 'Alt Görev') {
        tIdx++;
        const task = { id: 'tsk-' + (gIdx * 100 + tIdx), name: tn, prog, st, sd: sd || '2025-01-01', ed: ed || '2026-12-31', ld: ld || '' };
        if (isK && curP) { task.ld = task.ld || curP.ld; curP.tasks.push(task); }
        else if (multiFaz && fazP) { task.ld = task.ld || fazP.ld; fazP.tasks.push(task); }
        else if (curH) { task.ld = task.ld || curH.ld; curH.tasks.push(task); }
      }
    }
    if (key !== 'K' && curH && !multiFaz) sg[key].push(curH);
  }

  // Generate TypeScript
  let ts = `// Auto-generated from Cascade Excel data - Şubat 2026\n// DO NOT EDIT MANUALLY\n\n`;
  ts += `export interface CascadeTask {\n  id: string;\n  name: string;\n  level: "Hedef" | "Proje" | "Alt Görev";\n  source: "Türkiye" | "Kurumsal" | "International";\n  planName: string;\n  progress: number;\n  status: "On Track" | "Achieved" | "High Risk" | "At Risk" | "Not Started";\n  startDate: string;\n  endDate: string;\n  leader: string;\n}\n\n`;
  ts += `export interface CascadeHedef {\n  id: string;\n  name: string;\n  source: string;\n  status: string;\n  leader: string;\n  startDate: string;\n  endDate: string;\n  projects: CascadeProje[];\n}\n\n`;
  ts += `export interface CascadeProje {\n  id: string;\n  name: string;\n  status: string;\n  leader: string;\n  tasks: CascadeTask[];\n}\n\n`;

  const sourceMap = { T: ['Türkiye', 'turkiyeHedefler'], K: ['Kurumsal', 'kurumsalHedefler'], I: ['International', 'internationalHedefler'] };

  for (const [key, [sourceName, varName]] of Object.entries(sourceMap)) {
    const items = sg[key];
    ts += `export const ${varName}: CascadeHedef[] = [\n`;
    for (const h of items) {
      ts += `  {\n`;
      ts += `    id: "${h.id}",\n`;
      ts += `    name: "${esc(h.name)}",\n`;
      ts += `    source: "${sourceName}",\n`;
      ts += `    status: "${h.st}",\n`;
      ts += `    leader: "${esc(h.ld)}",\n`;
      ts += `    startDate: "${h.sd}",\n`;
      ts += `    endDate: "${h.ed}",\n`;
      ts += `    projects: [\n`;
      ts += `      {\n`;
      ts += `        id: "${h.id}-p",\n`;
      ts += `        name: "${esc(h.name)}",\n`;
      ts += `        status: "${h.st}",\n`;
      ts += `        leader: "${esc(h.ld)}",\n`;
      ts += `        tasks: [\n`;
      for (const t of h.tasks) {
        ts += `          { id: "${t.id}", name: "${esc(t.name)}", level: "Alt Görev" as const, source: "${sourceName}" as const, planName: "${esc(h.name)}", progress: ${t.prog}, status: "${t.st}" as const, startDate: "${t.sd}", endDate: "${t.ed}", leader: "${esc(t.ld)}" },\n`;
      }
      ts += `        ],\n`;
      ts += `      },\n`;
      ts += `    ],\n`;
      ts += `  },\n`;
    }
    ts += `];\n\n`;
  }

  // Stats
  let tp = 0, ta = 0;
  for (const arr of Object.values(sg)) { tp += arr.length; for (const h of arr) ta += h.tasks.length; }
  ts += `// Stats: ${tp} projeler, ${ta} aksiyonlar\n`;

  fs.writeFileSync('src/lib/mock-data/cascade-data.ts', ts, 'utf8');
  console.log(`Written cascade-data.ts: ${tp} projeler, ${ta} aksiyonlar, ${ts.length} chars`);
}).catch(e => console.error(e));

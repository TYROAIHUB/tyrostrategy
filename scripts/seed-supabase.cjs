/**
 * Seeds Supabase database with real project data from Excel.
 * Uses service_role key (bypasses RLS).
 * Run: node scripts/seed-supabase.cjs
 */
const { createClient } = require('@supabase/supabase-js');
const ExcelJS = require('exceljs');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Required env vars missing. Run:\n  SUPABASE_URL=https://xxx.supabase.co SUPABASE_SERVICE_ROLE_KEY=sb_secret_xxx node scripts/seed-supabase.cjs');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const trMonths = { Oca:'01','Şub':'02',Mar:'03',Nis:'04',May:'05',Haz:'06',Tem:'07','Ağu':'08',Eyl:'09',Eki:'10',Kas:'11',Ara:'12' };

function parseDate(v) {
  if (!v) return null;
  if (v instanceof Date) return v.toISOString().slice(0,10);
  const s = String(v).trim();
  let m = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (m) return m[3]+'-'+m[2].padStart(2,'0')+'-'+m[1].padStart(2,'0');
  m = s.match(/^(\d{1,2})\.(\w+)\.(\d{4})$/);
  if (m && trMonths[m[2]]) return m[3]+'-'+trMonths[m[2]]+'-'+m[1].padStart(2,'0');
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return m[3]+'-'+m[1].padStart(2,'0')+'-'+m[2].padStart(2,'0');
  return null;
}

function reviewDate(ed) {
  if (!ed) return null;
  const d = new Date(ed); d.setMonth(d.getMonth()-1);
  return d.toISOString().slice(0,10);
}

const DEPT_MAP = {
  'Ozan Yeşilyer':'Tarım','Recep Mergen':'Tarım','Taylan Eğilmez':'Ticaret',
  'İdris İlhan Telci':'Denizcilik','Güven Emrah Erenler':'İnsan Kaynakları',
  'Suat Söbüçovalı':'Ar-Ge','Kerime İkizler':'Bilgi Teknolojileri',
  'Murat Solak':'Üretim','Nazlı Deniz Çetin':'Risk Yönetimi',
  'Arzu Örsel':'Kurumsal İletişim','Burcu Gözen':'Finans',
  'Kübra Dömbek':'Kalite','Devrim Aşkın':'Finans',
  'Tamer Latifoğlu':'Dış Ticaret','Emre Padar':'Üretim',
  'Yiğit Karacı':'Uluslararası Operasyonlar','Tarkan Ferhat Yılmaz':'İnsan Kaynakları',
  'Raif Karacı':'Uluslararası Operasyonlar',
  'Kemal Yıldız':'Uluslararası Operasyonlar','Nevzat Çakmak':'Uluslararası Operasyonlar',
  'Fatih Tiryakioğlu':'Yönetim','Bahadır Açık':'Uluslararası Operasyonlar',
  'Ahmet Kalkan / Halil İbrahim Öztürk':'İş Güvenliği',
};

function projeDesc(n, src) {
  const l = n.toLowerCase();
  if (l.includes('fıstık')||l.includes('çin')) return 'Antep fıstığı ürünlerinin Çin pazarına girişi için pazar araştırması ve dağıtım ağının kurulması.';
  if (l.includes('sulama')) return 'Modern sulama altyapısı ile tarımsal verimliliğin artırılması ve su kaynaklarının etkin yönetimi.';
  if (l.includes('mekanizasyon')) return 'Tarımsal mekanizasyon kapasitesinin güçlendirilmesi ve modern ekipman temini.';
  if (l.includes('gemi')||l.includes('deniz')) return 'Deniz-Nehir tipi gemi inşa projesi kapsamında tersane seçimi ve inşaat takibi.';
  if (l.includes('itsm')) return 'BT servis yönetimi platformunun kurulması ve süreç otomasyonu.';
  if (l.includes('carbon')) return 'Karbon ticareti projesi kapsamında pilot saha hazırlığı ve sertifikasyon.';
  return src+' stratejik projeleri kapsamında planlanan çalışmaların yürütülmesi.';
}

function aksiyonDesc(n) {
  const l = n.toLowerCase();
  if (l.includes('fizibilite')) return 'Fizibilite çalışmasının hazırlanması ve karar raporunun sunulması.';
  if (l.includes('bütçe')||l.includes('onay')) return 'Bütçe taslağının hazırlanması ve yönetim onayının alınması.';
  if (l.includes('test')||l.includes('pilot')) return 'Pilot ortamda test edilmesi ve geri bildirim toplanması.';
  if (l.includes('eğitim')) return 'Kullanıcı eğitimlerinin planlanması ve gerçekleştirilmesi.';
  if (l.includes('analiz')||l.includes('araştırma')) return 'Veri toplama, analiz ve değerlendirme çalışmaları.';
  return 'Belirlenen zaman çizelgesine uygun olarak görevin tamamlanması.';
}

function assignTag(name, prog, st) {
  if ((st==='Behind'||st==='At Risk')&&name.length%3===0) return 'Uygulama';
  if (st==='Not Started'||prog===0) return 'Ön Çalışma';
  if (st==='Achieved'||prog>=80) return 'Uygulama';
  return 'Geliştirme';
}

async function main() {
  console.log('🚀 Starting Supabase seed...\n');

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile('C:/Users/Cenk/Desktop/Cascade Subat2026 Projeler Listesi.xlsx');

  // Parse Excel
  const projeler = [];
  const aksiyonlar = [];
  let gIdx = 0;

  const sheets = [
    ['Türkiye - Şubat 2026', false, 'Türkiye'],
    ['Kurumsal - Şubat 2026', true, 'Kurumsal'],
    ['International - Feb 2026', false, 'International'],
  ];

  for (const [sheetName, isK, source] of sheets) {
    const ws = wb.getWorksheet(sheetName);
    let curH=null, curP=null, multiFaz=false, fazP=null, tIdx=0;

    for (let r=2; r<=ws.rowCount; r++) {
      const row = ws.getRow(r);
      const tn = String(row.getCell(4).value||'').trim();
      const lv = String(row.getCell(5).value||'').trim();
      if (!tn) continue;

      let prog,st,sd,ed,ld;
      if (isK) { prog=0; st=String(row.getCell(6).value||'Not Started').trim(); sd=parseDate(row.getCell(7).value); ed=parseDate(row.getCell(8).value); ld=String(row.getCell(9).value||'').trim(); }
      else { prog=parseInt(row.getCell(6).value)||0; st=String(row.getCell(7).value||'Not Started').trim(); sd=parseDate(row.getCell(8).value); ed=parseDate(row.getCell(9).value); ld=String(row.getCell(10).value||'').trim(); }

      if (lv==='Hedef') {
        if (curH&&!multiFaz) projeler.push(curH);
        gIdx++; tIdx=0; multiFaz=false; fazP=null; curP=null;
        const yr=(sd||'2025-01-01').substring(2,4);
        curH={id:'P'+yr+'-'+String(gIdx).padStart(4,'0'),name:tn,source,status:st,sd:sd||'2025-01-01',ed:ed||'2026-12-31',ld,dept:DEPT_MAP[ld]||source};
      } else if (lv==='Proje') {
        if (isK) {
          gIdx++; tIdx=0;
          const yr=(sd||'2025-01-01').substring(2,4);
          curP={id:'P'+yr+'-'+String(gIdx).padStart(4,'0'),name:tn,source,status:st,sd:sd||'2025-01-01',ed:ed||'2026-12-31',ld,dept:DEPT_MAP[ld]||source};
          projeler.push(curP);
        } else {
          if (/faz\s*\d|phase\s*\d/i.test(tn)||curP) {
            if (!multiFaz) { multiFaz=true; if(curH) curH.tasks=[]; }
            gIdx++; tIdx=0;
            const yr=(sd||curH?.sd||'2025-01-01').substring(2,4);
            fazP={id:'P'+yr+'-'+String(gIdx).padStart(4,'0'),name:tn,source,status:st||curH?.status,sd:sd||curH?.sd||'2025-01-01',ed:ed||curH?.ed||'2026-12-31',ld:ld||curH?.ld,dept:DEPT_MAP[ld||curH?.ld]||source};
            projeler.push(fazP);
          } else { curP={ld:ld||curH?.ld}; }
        }
      } else if (lv==='Alt Görev') {
        tIdx++;
        const pId = (isK&&curP)?curP.id:(multiFaz&&fazP)?fazP.id:curH?.id;
        const pLd = (isK&&curP)?curP.ld:(multiFaz&&fazP)?fazP.ld:curH?.ld;
        const yr=(sd||'2025-01-01').substring(2,4);
        aksiyonlar.push({id:'A'+yr+'-'+String(aksiyonlar.length+1).padStart(4,'0'),projeId:pId,name:tn,prog,status:st,sd:sd||'2025-01-01',ed:ed||'2026-12-31',ld:ld||pLd||'',sort:tIdx});
      }
    }
    if (!isK&&curH&&!multiFaz) projeler.push(curH);
  }

  console.log(`📊 Parsed: ${projeler.length} projeler, ${aksiyonlar.length} aksiyonlar\n`);

  // 1. Insert users
  const leaders = new Set();
  for (const p of projeler) if (p.ld) leaders.add(p.ld);
  for (const a of aksiyonlar) if (a.ld) leaders.add(a.ld);
  leaders.add('Cenk Şayli');

  const userRows = [];
  let uIdx = 0;
  for (const name of leaders) {
    uIdx++;
    const slug = name.toLowerCase().replace(/\s+/g,'.').replace(/[öÖ]/g,'o').replace(/[üÜ]/g,'u').replace(/[çÇ]/g,'c').replace(/[şŞ]/g,'s').replace(/[ığİĞ]/g,'i').replace(/[^a-z.\/]/g,'');
    const email = slug + uIdx + '@tiryaki.com.tr';
    userRows.push({
      azure_oid: 'oid-'+String(uIdx).padStart(3,'0'),
      email, display_name: name,
      department: DEPT_MAP[name]||'Genel',
      role: name==='Cenk Şayli'?'Admin':'Proje Lideri',
    });
  }

  console.log(`👤 Inserting ${userRows.length} users...`);
  const { error: ue } = await supabase.from('users').upsert(userRows, { onConflict: 'azure_oid' });
  if (ue) console.error('  ❌ Users error:', ue.message); else console.log('  ✅ Users inserted');

  // Get user ID map
  const { data: users } = await supabase.from('users').select('id, azure_oid, display_name');
  const userIdMap = new Map();
  for (const u of users || []) userIdMap.set(u.display_name, u.id);

  // 2. Insert tag definitions
  console.log('🏷️  Inserting tag definitions...');
  const { error: te } = await supabase.from('tag_definitions').upsert([
    { name: 'Ön Çalışma', color: '#D4A017' },
    { name: 'Geliştirme', color: '#3b82f6' },
    { name: 'Uygulama', color: '#10b981' },
  ], { onConflict: 'name' });
  if (te) console.error('  ❌ Tags error:', te.message); else console.log('  ✅ Tags inserted');

  // Get tag ID map
  const { data: tags } = await supabase.from('tag_definitions').select('id, name');
  const tagIdMap = new Map();
  for (const t of tags || []) tagIdMap.set(t.name, t.id);

  // 3. Insert projeler (in batches of 20)
  console.log(`📋 Inserting ${projeler.length} projeler...`);
  const projeRows = projeler.map(p => ({
    id: p.id, name: p.name, description: projeDesc(p.name, p.source),
    source: p.source, status: p.status, progress: 0,
    department: p.dept, start_date: p.sd, end_date: p.ed,
    review_date: reviewDate(p.ed),
    owner: p.ld || 'Cenk Şayli',
  }));

  for (let i=0; i<projeRows.length; i+=20) {
    const batch = projeRows.slice(i, i+20);
    const { error } = await supabase.from('projeler').upsert(batch, { onConflict: 'id' });
    if (error) console.error(`  ❌ Projeler batch ${i}: ${error.message}`);
    else process.stdout.write('.');
  }
  console.log('\n  ✅ Projeler inserted');

  // 4. Insert proje_tags
  console.log('🏷️  Assigning tags...');
  const tagRows = projeler.map(p => {
    const tagName = assignTag(p.name, 0, p.status);
    return { proje_id: p.id, tag_id: tagIdMap.get(tagName) };
  }).filter(r => r.tag_id);

  for (let i=0; i<tagRows.length; i+=20) {
    const batch = tagRows.slice(i, i+20);
    const { error } = await supabase.from('proje_tags').upsert(batch, { onConflict: 'proje_id,tag_id' });
    if (error) console.error(`  ❌ Tags batch ${i}: ${error.message}`);
  }
  console.log('  ✅ Tags assigned');

  // 5. Insert proje_participants (owner + Cenk as participant for ~40%)
  console.log('👥 Assigning participants...');
  const participantRows = [];
  const cenkId = userIdMap.get('Cenk Şayli');
  for (const p of projeler) {
    const ownerId = userIdMap.get(p.ld);
    if (ownerId) participantRows.push({ proje_id: p.id, user_id: ownerId });
    // Add Cenk to ~40% of projects
    const hash = p.name.split('').reduce((a,c)=>a+c.charCodeAt(0),0);
    if (hash%5<2 && cenkId && ownerId !== cenkId) {
      participantRows.push({ proje_id: p.id, user_id: cenkId });
    }
  }

  for (let i=0; i<participantRows.length; i+=20) {
    const batch = participantRows.slice(i, i+20);
    const { error } = await supabase.from('proje_participants').upsert(batch, { onConflict: 'proje_id,user_id' });
    if (error && !error.message.includes('duplicate')) console.error(`  ❌ Participants batch ${i}: ${error.message}`);
  }
  console.log('  ✅ Participants assigned');

  // 6. Insert aksiyonlar (in batches of 20)
  console.log(`⚡ Inserting ${aksiyonlar.length} aksiyonlar...`);
  const aksRows = aksiyonlar.map(a => ({
    id: a.id, proje_id: a.projeId, name: a.name,
    description: aksiyonDesc(a.name),
    progress: a.prog, status: a.status,
    start_date: a.sd, end_date: a.ed,
    sort_order: a.sort,
    owner: a.ld || 'Cenk Şayli',
    completed_at: a.status === 'Achieved' ? a.ed : null,
  }));

  for (let i=0; i<aksRows.length; i+=20) {
    const batch = aksRows.slice(i, i+20);
    const { error } = await supabase.from('aksiyonlar').upsert(batch, { onConflict: 'id' });
    if (error) console.error(`  ❌ Aksiyonlar batch ${i}: ${error.message}`);
    else process.stdout.write('.');
  }
  console.log('\n  ✅ Aksiyonlar inserted');

  // 7. Insert role permissions
  console.log('🔒 Inserting role permissions...');
  const { error: re } = await supabase.from('role_permissions').upsert([
    { role: 'Admin', permissions: { canViewAll: true, canEditAll: true, canDeleteAll: true, canCreateProje: true, canCreateAksiyon: true } },
    { role: 'Proje Lideri', permissions: { canViewAll: false, canEditOwn: true, canDeleteOwn: false, canCreateProje: false, canCreateAksiyon: true } },
    { role: 'Kullanıcı', permissions: { canViewAll: false, canEditOwn: true, canDeleteOwn: false, canCreateProje: false, canCreateAksiyon: false } },
  ], { onConflict: 'role' });
  if (re) console.error('  ❌ Roles error:', re.message); else console.log('  ✅ Roles inserted');

  // 8. Insert app settings
  console.log('⚙️  Inserting app settings...');
  const { error: se } = await supabase.from('app_settings').upsert([
    { key: 'companyName', value: 'Tiryaki Agro' },
    { key: 'idTemplate', value: { proje: 'P{YY}-{NNNN}', aksiyon: 'A{YY}-{NNNN}' } },
  ], { onConflict: 'key' });
  if (se) console.error('  ❌ Settings error:', se.message); else console.log('  ✅ Settings inserted');

  console.log('\n🎉 Seed completed!');
  console.log(`   ${projeler.length} projeler, ${aksiyonlar.length} aksiyonlar, ${userRows.length} users`);
}

main().catch(console.error);

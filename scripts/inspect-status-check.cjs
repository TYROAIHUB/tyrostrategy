const { Client } = require('pg');
const c = new Client({
  host: process.env.PGHOST,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE || 'postgres',
  port: Number(process.env.PGPORT || 5432),
  ssl: { rejectUnauthorized: false },
});
(async () => {
  await c.connect();
  const r = await c.query(`
    SELECT conname, conrelid::regclass AS tbl, pg_get_constraintdef(oid) AS def
    FROM pg_constraint
    WHERE conrelid IN ('public.projeler'::regclass, 'public.aksiyonlar'::regclass)
      AND contype = 'c'
  `);
  for (const row of r.rows) console.log(row.tbl, '→', row.conname, '→', row.def);
  console.log('\n-- row counts with status=Behind:');
  const p = await c.query("SELECT count(*) FROM public.projeler WHERE status='Behind'");
  const a = await c.query("SELECT count(*) FROM public.aksiyonlar WHERE status='Behind'");
  console.log('  projeler:', p.rows[0].count, 'aksiyonlar:', a.rows[0].count);
  await c.end();
})().catch((e) => { console.error(e); process.exit(1); });

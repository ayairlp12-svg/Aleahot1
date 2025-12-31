const fs = require('fs');
const path = require('path');
const envPath = path.join(process.cwd(),'backend','.env');
const envRaw = fs.readFileSync(envPath,'utf8');
envRaw.split(/\n/).forEach(line=>{
  if(!line.trim()||line.trim().startsWith('#')) return;
  const idx=line.indexOf('='); if(idx===-1) return;
  const k=line.substring(0,idx).trim(); const v=line.substring(idx+1).trim(); process.env[k]=v;
});
const db = require('./backend/db');
(async()=>{
  try{
    const rows = await db('ordenes').select('id','numero_orden','boletos','estado').orderBy('created_at','desc').limit(20);
    console.log('ROWS_COUNT:', rows.length);
    rows.forEach(r=>{
      console.log('---');
      console.log('id:', r.id, 'numero_orden:', r.numero_orden, 'estado:', r.estado);
      const util = require('util');
      console.log('boletos raw (typeof):', typeof r.boletos);
      console.log('boletos raw (repr):', util.inspect(r.boletos, { depth: 4 }));
      try{
        const asString = (typeof r.boletos === 'string') ? r.boletos : JSON.stringify(r.boletos);
        const parsed = JSON.parse(asString || '[]');
        console.log('boletos parsed:', parsed);
      }catch(e){
        console.log('boletos parse error:', e && e.message ? e.message : e);
      }
    });
    process.exit(0);
  }catch(e){
    console.error('ERROR:', e && e.message? e.message: e);
    process.exit(2);
  }
})();

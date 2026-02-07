const knex = require('knex');

const db = knex({
    client: 'pg',
    connection: {
        connectionString: 'postgresql://rifa_web_op_user:2eTqUwZ58gk2UTleIcvYYuyuaZMudnT2@dpg-d5fn80i4d50c73f9tfh0-a.virginia-postgres.render.com/rifa_web_op',
        ssl: { rejectUnauthorized: false }
    }
});

(async () => {
    try {
        console.log('\n📊 INSPECCIÓN DE BD - ST-AA200\n');
        
        // 1. Estado de la orden
        console.log('1️⃣  ORDEN ST-AA200:');
        const orden = await db('ordenes')
            .where('numero_orden', 'ST-AA200')
            .select('numero_orden', 'estado', 'cantidad_boletos', 'created_at', 'updated_at')
            .first();
        console.log(orden);
        
        // 2. Boletos
        console.log('\n2️⃣  BOLETOS DE ST-AA200:');
        const boletos = await db('boletos_estado')
            .where('numero_orden', 'ST-AA200')
            .groupBy('estado')
            .count('* as cantidad')
            .select('estado');
        console.log(boletos);
        
        // 3. Oportunidades de ST-AA200
        console.log('\n3️⃣  OPORTUNIDADES DE ST-AA200:');
        const opps = await db('orden_oportunidades')
            .where('numero_orden', 'ST-AA200')
            .groupBy('estado')
            .count('* as cantidad')
            .select('estado');
        console.log(opps);
        
        // 4. Todas las oportunidades
        console.log('\n4️⃣  TODAS LAS OPORTUNIDADES EN SISTEMA:');
        const allOpps = await db('orden_oportunidades')
            .groupBy('estado')
            .count('* as cantidad')
            .select('estado')
            .orderBy('cantidad', 'desc');
        console.log(allOpps);
        
        // 5. Total de oportunidades vendidas
        console.log('\n5️⃣  OPORTUNIDADES VENDIDAS EN SISTEMA:');
        const vendidas = await db('orden_oportunidades')
            .where('estado', 'vendido')
            .count('* as total')
            .first();
        console.log(`Total vendidas: ${vendidas.total}`);
        
        await db.destroy();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
})();

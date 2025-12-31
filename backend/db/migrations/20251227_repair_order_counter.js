/**
 * Migración: Reparar contador de órdenes si hubo reinicio
 * Fecha: 27 de diciembre de 2025
 * 
 * Propósito:
 * - Si la tabla order_id_counter fue reiniciada
 * - Detectar el ID más alto usado en la tabla ordenes
 * - Establecer el contador para que comience después de ese ID
 * - Prevenir conflictos de duplicados
 */

exports.up = async (knex) => {
    try {
        // 1. Obtener todas las órdenes existentes
        const ordenes = await knex('ordenes')
            .select('numero_orden')
            .orderBy('numero_orden', 'desc')
            .limit(100);  // Últimas 100 órdenes

        if (ordenes.length === 0) {
            console.log('ℹ️ No hay órdenes existentes, contador de órdenes en estado limpio');
            return;
        }

        // 2. Extraer el ID más alto (formato: SY-AA104, etc)
        let maxSecuencia = 'AA';
        let maxNumero = 0;

        for (const orden of ordenes) {
            // Parsear formato: PREFIJO-SECUENCIA+NUMERO
            // Ejemplo: SY-AA104 → secuencia=AA, numero=104
            const match = orden.numero_orden.match(/([A-Z]{2})(\d{3})$/);
            
            if (match) {
                const [, sec, num] = match;
                const numValue = parseInt(num);
                
                // Comparar secuencia y número
                if (sec > maxSecuencia || (sec === maxSecuencia && numValue > maxNumero)) {
                    maxSecuencia = sec;
                    maxNumero = numValue;
                }
            }
        }

        // 3. Calcular el siguiente número y secuencia
        let nextNum = maxNumero + 1;
        let nextSeq = maxSecuencia;

        if (nextNum > 999) {
            nextNum = 0;
            nextSeq = incrementarSecuencia(maxSecuencia);
        }

        console.log(`ℹ️ Orden más alta encontrada: ${maxSecuencia}${String(maxNumero).padStart(3, '0')}`);
        console.log(`✅ Siguiente ID será: ${nextSeq}${String(nextNum).padStart(3, '0')}`);

        // 4. Actualizar o crear el contador
        const existingCounter = await knex('order_id_counter')
            .where('cliente_id', 'sorteos')
            .first();

        if (existingCounter) {
            // Actualizar contador existente
            await knex('order_id_counter')
                .where('cliente_id', 'sorteos')
                .update({
                    ultima_secuencia: nextSeq,
                    ultimo_numero: maxNumero,
                    proximo_numero: nextNum,
                    updated_at: new Date()
                });

            console.log('✅ Contador existente actualizado');
        } else {
            // Crear nuevo contador con valores correctos
            await knex('order_id_counter').insert({
                cliente_id: 'sorteos',
                ultima_secuencia: maxSecuencia,
                ultimo_numero: maxNumero,
                proximo_numero: nextNum,
                contador_total: ordenes.length,
                activo: true,
                fecha_ultimo_reset: new Date(),
                created_at: new Date(),
                updated_at: new Date()
            });

            console.log('✅ Nuevo contador creado con valores correctos');
        }

    } catch (error) {
        console.error('❌ Error en migración de reparación de contador:', error.message);
        throw error;
    }
};

exports.down = async (knex) => {
    // No hacer rollback de esta migración
    console.log('ℹ️ Rollback de reparación de contador no implementado (no reversible)');
};

/**
 * Helper: Incrementar secuencia alfabética (AA → AB → ... → ZZ)
 */
function incrementarSecuencia(secuencia) {
    if (secuencia.length !== 2) return 'AA';
    
    let letra1 = secuencia.charCodeAt(0);
    let letra2 = secuencia.charCodeAt(1);
    
    letra2++;
    
    if (letra2 > 90) {
        letra2 = 65;
        letra1++;
    }
    
    if (letra1 > 90) {
        return 'AA';
    }
    
    return String.fromCharCode(letra1) + String.fromCharCode(letra2);
}

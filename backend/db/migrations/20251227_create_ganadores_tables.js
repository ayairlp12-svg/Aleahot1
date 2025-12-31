exports.up = function(knex) {
    return knex.schema
        // Tabla de configuración del sorteo
        .createTable('sorteo_configuracion', (table) => {
            table.increments('id').primary();
            table.string('estado', 20).defaultTo('activo'); // 'activo', 'proximo', 'finalizado'
            table.string('nombre_sorteo', 255);
            table.string('premio_principal', 255);
            table.decimal('valor_total_recaudado', 12, 2).defaultTo(0);
            table.bigInteger('total_boletos').defaultTo(0);
            table.bigInteger('total_vendidos').defaultTo(0);
            table.integer('total_participantes').defaultTo(0);
            table.timestamp('fecha_inicio');
            table.timestamp('fecha_cierre');
            table.timestamp('fecha_proximo_sorteo').nullable();
            table.string('acta_sorteo_url', 255).nullable();
            table.string('video_sorteo_url', 255).nullable();
            table.string('certificado_notario', 255).nullable();
            table.timestamps();
        })
        // Tabla de ganadores
        .createTable('ganadores', (table) => {
            table.increments('id').primary();
            table.string('numero_orden', 50).unique();
            table.string('email', 100);
            table.string('whatsapp', 20);
            table.string('nombre_ganador', 100).nullable();
            table.string('apellido_ganador', 100).nullable();
            table.string('estado_domicilio', 100).nullable(); // Para mostrar solo estado
            table.integer('posicion').nullable(); // 1, 2, 3... para orden jerárquico
            table.string('tipo_ganador', 20); // 'principal', 'presorte', 'ruletazo'
            table.string('premio', 255);
            table.decimal('valor_premio', 10, 2);
            table.timestamp('fecha_sorteo');
            table.string('estado', 20).defaultTo('notificado'); // 'notificado', 'reclamado', 'enviado', 'entregado'
            table.timestamp('fecha_notificacion').nullable();
            table.timestamp('fecha_reclamo').nullable();
            table.timestamp('fecha_envio').nullable();
            table.timestamp('fecha_entrega').nullable();
            table.string('codigo_reclamacion', 50).nullable();
            table.text('direccion_envio').nullable();
            table.timestamps();
        });
};

exports.down = function(knex) {
    return knex.schema
        .dropTableIfExists('ganadores')
        .dropTableIfExists('sorteo_configuracion');
};

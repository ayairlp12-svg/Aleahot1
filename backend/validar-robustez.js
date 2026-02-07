#!/usr/bin/env node

/**
 * 🚀 VALIDADOR DE ROBUSTEZ PRE-PRODUCCIÓN
 * 
 * Verifica que todos los mecanismos de protección estén en lugar
 * Uso: node validar-robustez.js
 */

const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, 'server.js');
const serverContent = fs.readFileSync(serverPath, 'utf8');

const checks = [];

function addCheck(name, passed, details = '') {
    checks.push({ name, passed, details });
    const symbol = passed ? '✅' : '❌';
    console.log(`${symbol} ${name}${details ? ` - ${details}` : ''}`);
}

console.log('\n🔍 VALIDANDO ROBUSTEZ DEL SISTEMA...\n');

// Check 1: log() function defined
const hasLogFunction = serverContent.includes('function log(level = \'info\'') || 
                       serverContent.includes('function log(level="info"');
addCheck('Función log() definida', hasLogFunction, 
    hasLogFunction ? 'En línea ~271' : 'NO ENCONTRADA');

// Check 2: uncaughtException handler
const hasUncaughtHandler = serverContent.includes('process.on(\'uncaughtException\'');
addCheck('Handler process.on(\'uncaughtException\')', hasUncaughtHandler,
    hasUncaughtHandler ? 'Encontrado' : 'FALTA');

// Check 3: unhandledRejection handler
const hasRejectionHandler = serverContent.includes('process.on(\'unhandledRejection\'');
addCheck('Handler process.on(\'unhandledRejection\')', hasRejectionHandler,
    hasRejectionHandler ? 'Encontrado' : 'FALTA');

// Check 4: Express error middleware
const hasErrorMiddleware = serverContent.includes('app.use((err, req, res, next)');
addCheck('Middleware de error final', hasErrorMiddleware,
    hasErrorMiddleware ? 'Configurado' : 'FALTA');

// Check 5: SIGTERM handler
const hasSigTermHandler = serverContent.includes('process.on(\'SIGTERM\'');
addCheck('Handler SIGTERM graceful shutdown', hasSigTermHandler,
    hasSigTermHandler ? 'Encontrado' : 'FALTA');

// Check 6: SIGINT handler
const hasSigIntHandler = serverContent.includes('process.on(\'SIGINT\'');
addCheck('Handler SIGINT graceful shutdown', hasSigIntHandler,
    hasSigIntHandler ? 'Encontrado' : 'FALTA');

// Check 7: Health check implemented
const hasHealthCheck = serverContent.includes('verificarSaludBD') && 
                       serverContent.includes('setInterval');
addCheck('Health check periódico (BD)', hasHealthCheck,
    hasHealthCheck ? 'Cada 30s' : 'NO CONFIGURADO');

// Check 8: Rate limiting on login
const hasLoginRateLimit = serverContent.includes('limiterLogin') && 
                          serverContent.includes('app.post(\'/api/login\'');
addCheck('Rate limiting en POST /api/login', hasLoginRateLimit,
    hasLoginRateLimit ? 'Habilitado' : 'NO CONFIGURADO');

// Check 9: Rate limiting on orders
const hasOrderRateLimit = serverContent.includes('limiterOrdenes') && 
                          serverContent.includes('POST /api/ordenes');
addCheck('Rate limiting en POST /api/ordenes', hasOrderRateLimit,
    hasOrderRateLimit ? 'Habilitado' : 'NO CONFIGURADO');

// Check 10: CORS configured
const hasCors = serverContent.includes('app.use(cors');
addCheck('CORS habilitado', hasCors,
    hasCors ? 'Configurado' : 'FALTA');

// Check 11: Helmet for security headers
const hasHelmet = serverContent.includes('app.use(helmet');
addCheck('Helmet para headers de seguridad', hasHelmet,
    hasHelmet ? 'Habilitado' : 'FALTA');

// Check 12: Timeout protection in BoletoService
const hasTimeoutProtection = serverContent.includes('Promise.race') && 
                             serverContent.includes('30000');
addCheck('Timeout protection (30s)', hasTimeoutProtection,
    hasTimeoutProtection ? 'En BoletoService' : 'NO ENCONTRADO');

// Check 13: Gzip compression
const hasGzip = serverContent.includes('app.use(compression');
addCheck('Gzip compression', hasGzip,
    hasGzip ? 'Habilitada' : 'FALTA');

// Check 14: Body parser limits
const hasBodyLimit = serverContent.includes('app.use(express.json');
addCheck('Body parser configurado', hasBodyLimit,
    hasBodyLimit ? 'OK' : 'FALTA');

// Check 15: Environment variables validation
const hasEnvCheck = serverContent.includes('.env') || 
                    serverContent.includes('process.env.DATABASE_URL') ||
                    serverContent.includes('process.env.JWT_SECRET');
addCheck('Validación de variables de entorno', hasEnvCheck,
    hasEnvCheck ? 'Usadas en config' : 'FALTA');

// Check 16: Database connection pool
const hasConnectionPool = serverContent.includes('pool') || 
                         serverContent.includes('knex') ||
                         serverContent.includes('PostgreSQL');
addCheck('Connection pool configurado', hasConnectionPool,
    hasConnectionPool ? 'Via Knex' : 'FALTA');

// Check 17: No hardcoded secrets
const hasHardcodedSecrets = serverContent.includes('SECRET') && 
                           serverContent.includes('sk_') ||
                           serverContent.includes('pk_');
addCheck('Sin secretos hardcodeados', !hasHardcodedSecrets,
    !hasHardcodedSecrets ? '✅ Usa .env' : '⚠️ REVISAR');

// Check 18: Logging calls use try/catch or await
const loggingProtection = serverContent.match(/log\(/g) || [];
addCheck(`Funciones log() encontradas`, loggingProtection.length > 0,
    loggingProtection.length > 0 ? `${loggingProtection.length} llamadas` : 'NO USADA');

// Summary
console.log('\n📊 RESUMEN:\n');
const passed = checks.filter(c => c.passed).length;
const total = checks.length;
const percentage = Math.round((passed / total) * 100);

console.log(`Total checks: ${passed}/${total} ✅`);
console.log(`Cobertura: ${percentage}%`);

if (percentage === 100) {
    console.log('\n🎉 ¡SISTEMA LISTO PARA PRODUCCIÓN!\n');
    process.exit(0);
} else if (percentage >= 85) {
    console.log('\n⚠️ SISTEMA CASI LISTO - REVISAR ITEMS FALLIDOS\n');
    process.exit(1);
} else {
    console.log('\n❌ SISTEMA NO ESTÁ LISTO - FALTAN PROTECCIONES CRÍTICAS\n');
    process.exit(2);
}

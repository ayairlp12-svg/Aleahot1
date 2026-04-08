#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function parseEnvFile(filePath) {
    if (!fs.existsSync(filePath)) {
        return {};
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const result = {};

    content.split(/\r?\n/).forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;

        const index = trimmed.indexOf('=');
        if (index === -1) return;

        const key = trimmed.slice(0, index).trim();
        const value = trimmed.slice(index + 1).trim();
        result[key] = value;
    });

    return result;
}

function getEnvPathFromArgs(argv) {
    const envArg = argv.find((arg) => arg.startsWith('--env='));
    if (!envArg) return path.join(process.cwd(), 'backend', '.env');
    return path.resolve(process.cwd(), envArg.split('=')[1]);
}

function redactUrl(rawUrl) {
    if (!rawUrl) return '(vacía)';
    try {
        const url = new URL(rawUrl);
        return `${url.protocol}//${url.hostname}${url.port ? `:${url.port}` : ''}/${url.pathname.replace(/^\//, '')}`;
    } catch (error) {
        return '(inválida)';
    }
}

function inspectDatabaseUrl(rawUrl) {
    if (!rawUrl) {
        return {
            ok: false,
            issues: ['DATABASE_URL no está configurada'],
            hostname: '',
            database: ''
        };
    }

    try {
        const url = new URL(rawUrl);
        const hostname = (url.hostname || '').toLowerCase();
        const database = url.pathname.replace(/^\//, '');
        const issues = [];

        if (!database) issues.push('DATABASE_URL no incluye nombre de base de datos');
        if (/neondb$/i.test(database)) issues.push('La base se llama "neondb"; esto suele indicar una instancia compartida/default');
        if (/prod/i.test(database)) issues.push('El nombre de base parece de producción');
        if (/production/i.test(hostname) || /prod/i.test(hostname)) issues.push('El host parece de producción');
        if (/railway\.app$/i.test(hostname) || /up\.railway\.app$/i.test(hostname)) {
            issues.push('El host parece infraestructura remota; confirmar que sea staging aislado');
        }
        if (/neon\.tech$/i.test(hostname)) {
            issues.push('El host es Neon; confirmar que no sea la misma rama/base usada por producción');
        }

        return {
            ok: issues.length === 0,
            issues,
            hostname,
            database
        };
    } catch (error) {
        return {
            ok: false,
            issues: ['DATABASE_URL es inválida'],
            hostname: '',
            database: ''
        };
    }
}

function inspectCorsOrigins(rawOrigins) {
    if (!rawOrigins) {
        return ['CORS_ORIGINS está vacío; el staging puede fallar al probar frontend'];
    }

    const origins = rawOrigins
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);

    if (origins.length === 0) {
        return ['CORS_ORIGINS no contiene orígenes válidos'];
    }

    const issues = [];
    const hasLocalUi = origins.some((origin) => /localhost:8080|127\.0\.0\.1:8080/.test(origin));
    if (!hasLocalUi) {
        issues.push('CORS_ORIGINS no incluye localhost:8080 ni 127.0.0.1:8080 para pruebas locales');
    }

    return issues;
}

function main() {
    const envPath = getEnvPathFromArgs(process.argv.slice(2));
    const envVars = parseEnvFile(envPath);
    const dbInspection = inspectDatabaseUrl(envVars.DATABASE_URL || process.env.DATABASE_URL || '');
    const corsIssues = inspectCorsOrigins(envVars.CORS_ORIGINS || process.env.CORS_ORIGINS || '');
    const issues = [...dbInspection.issues, ...corsIssues];

    console.log(`Archivo inspeccionado -> ${envPath}`);
    console.log(`DATABASE_URL -> ${redactUrl(envVars.DATABASE_URL || process.env.DATABASE_URL || '')}`);
    console.log(`CORS_ORIGINS -> ${(envVars.CORS_ORIGINS || process.env.CORS_ORIGINS || '(vacío)')}`);
    console.log('');

    if (issues.length === 0) {
        console.log('✅ Entorno parece apto para staging/load test inicial');
        process.exit(0);
    }

    console.log('⚠️ Hallazgos de seguridad/aislamiento:');
    issues.forEach((issue) => console.log(`- ${issue}`));
    console.log('');
    console.log('No corras load:orders hasta confirmar que el entorno es realmente aislado.');
    process.exit(1);
}

main();

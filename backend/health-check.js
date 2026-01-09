/**
 * ============================================================
 * SCRIPT: backend/health-check.js
 * DESCRIPCIÓN: Verifica salud del sistema (BD, memoria, endpoints)
 * 
 * USO: node health-check.js
 * En producción: Se ejecuta periódicamente desde cron o servicio externo
 * ============================================================
 */

const http = require('http');
const path = require('path');
const fs = require('fs');

// Colores para consola
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

class HealthChecker {
  constructor(baseUrl = 'http://localhost:5001') {
    this.baseUrl = baseUrl;
    this.results = {};
  }

  // Helper para hacer requests HTTP
  async makeRequest(path, timeout = 5000) {
    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        resolve({ error: 'Timeout', status: 0 });
      }, timeout);

      try {
        const url = new URL(path, this.baseUrl);
        const protocol = url.protocol === 'https:' ? require('https') : http;

        protocol.get(url, { timeout }, (res) => {
          clearTimeout(timeoutId);
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            resolve({
              status: res.statusCode,
              data: data.length > 0 ? JSON.parse(data) : {}
            });
          });
        }).on('error', (err) => {
          clearTimeout(timeoutId);
          resolve({ error: err.message, status: 0 });
        });
      } catch (err) {
        clearTimeout(timeoutId);
        resolve({ error: err.message, status: 0 });
      }
    });
  }

  // Verificar endpoint /api/health
  async checkHealth() {
    console.log(`${colors.blue}📋 Verificando API Health...${colors.reset}`);
    const result = await this.makeRequest('/api/health');

    if (result.status === 200 && result.data?.status === 'healthy') {
      console.log(`${colors.green}✅ API saludable${colors.reset}`);
      this.results.api = { status: 'healthy', details: result.data };
      return true;
    } else {
      console.log(`${colors.red}❌ API no responde correctamente${colors.reset}`);
      this.results.api = { status: 'unhealthy', error: result.error || 'Unknown error' };
      return false;
    }
  }

  // Verificar conectividad a BD
  async checkDatabase() {
    console.log(`${colors.blue}🗄️  Verificando base de datos...${colors.reset}`);
    const result = await this.makeRequest('/api/health');

    if (result.data?.database?.healthy) {
      console.log(`${colors.green}✅ Base de datos OK${colors.reset}`);
      this.results.database = { status: 'healthy' };
      return true;
    } else {
      console.log(`${colors.red}❌ Base de datos no responde${colors.reset}`);
      this.results.database = { status: 'unhealthy' };
      return false;
    }
  }

  // Verificar memoria disponible
  checkMemory() {
    console.log(`${colors.blue}💾 Verificando memoria...${colors.reset}`);
    const memUsage = process.memoryUsage();
    const heapUsedPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;

    const threshold = 80; // 80% es alerta
    if (heapUsedPercent < threshold) {
      console.log(`${colors.green}✅ Memoria OK: ${heapUsedPercent.toFixed(1)}%${colors.reset}`);
      this.results.memory = { status: 'healthy', percent: heapUsedPercent };
      return true;
    } else {
      console.log(`${colors.yellow}⚠️  Memoria alta: ${heapUsedPercent.toFixed(1)}%${colors.reset}`);
      this.results.memory = { status: 'warning', percent: heapUsedPercent };
      return false;
    }
  }

  // Verificar archivos críticos
  checkFiles() {
    console.log(`${colors.blue}📁 Verificando archivos críticos...${colors.reset}`);
    const requiredFiles = [
      'config.json',
      '.env',
      'server.js',
      'db.js'
    ];

    let allExists = true;
    for (const file of requiredFiles) {
      const filePath = path.join(__dirname, file);
      if (fs.existsSync(filePath)) {
        console.log(`  ${colors.green}✅${colors.reset} ${file}`);
      } else {
        console.log(`  ${colors.red}❌${colors.reset} ${file}`);
        allExists = false;
      }
    }

    this.results.files = { status: allExists ? 'healthy' : 'unhealthy', allExists };
    return allExists;
  }

  // Verificar público/stats (boletos)
  async checkStats() {
    console.log(`${colors.blue}📊 Verificando stats de boletos...${colors.reset}`);
    const result = await this.makeRequest('/api/public/boletos/stats', 15000);

    if (result.status === 200 && result.data?.totalDisponibles !== undefined) {
      console.log(`${colors.green}✅ Stats disponibles${colors.reset}`);
      this.results.stats = { status: 'healthy', ...result.data };
      return true;
    } else if (result.status === 200 && result.data?.data?.disponibles !== undefined) {
      // Aceptar también el nuevo formato de response
      console.log(`${colors.green}✅ Stats disponibles${colors.reset}`);
      this.results.stats = { status: 'healthy', ...result.data.data };
      return true;
    } else {
      console.log(`${colors.yellow}⚠️  Stats respondiendo lentamente o error${colors.reset}`);
      this.results.stats = { status: 'slow' };
      return false;
    }
  }

  // Generar reporte final
  generateReport() {
    console.log(`\n${colors.blue}${'='.repeat(60)}`);
    console.log('📊 REPORTE DE SALUD DEL SISTEMA');
    console.log(`${'='.repeat(60)}${colors.reset}\n`);

    let totalOk = 0;
    let totalIssues = 0;

    for (const [key, result] of Object.entries(this.results)) {
      const status = result.status || 'unknown';
      const icon = status === 'healthy' ? `${colors.green}✅${colors.reset}` : 
                   status === 'warning' ? `${colors.yellow}⚠️ ${colors.reset}` :
                   `${colors.red}❌${colors.reset}`;

      console.log(`${icon} ${key.toUpperCase()}: ${result.status}`);

      if (status === 'healthy') totalOk++;
      else totalIssues++;
    }

    console.log(`\n${colors.blue}${'='.repeat(60)}${colors.reset}`);
    console.log(`Saludables: ${totalOk} | Problemas: ${totalIssues}`);
    console.log(`${'='.repeat(60)}\n`);

    // Exit code basado en salud
    return totalIssues === 0 ? 0 : 1;
  }

  // Ejecutar todos los chequeos
  async runAll() {
    console.log(`\n${colors.blue}🏥 HEALTH CHECK INICIADO${colors.reset}\n`);

    await this.checkHealth();
    await this.checkDatabase();
    this.checkMemory();
    this.checkFiles();
    await this.checkStats();

    return this.generateReport();
  }
}

// Main
if (require.main === module) {
  const checker = new HealthChecker(
    process.env.API_URL || 'http://localhost:5001'
  );

  checker.runAll().then(exitCode => {
    process.exit(exitCode);
  });
}

module.exports = HealthChecker;

const { test, expect, devices } = require('@playwright/test');

const MOBILE_DEVICE = devices['iPhone 13'];

test.use({
  userAgent: MOBILE_DEVICE.userAgent,
  deviceScaleFactor: MOBILE_DEVICE.deviceScaleFactor,
  isMobile: MOBILE_DEVICE.isMobile,
  hasTouch: MOBILE_DEVICE.hasTouch,
  viewport: { width: 390, height: 844 }
});

async function mockCompraPage(page) {
  await page.route('**/socket.io/socket.io.js', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: `
        window.io = function() {
          return {
            id: 'mock-socket',
            on() {},
            emit() {},
            disconnect() {}
          };
        };
      `
    });
  });

  await page.route('**/api/**', async (route) => {
    const url = route.request().url();

    if (url.includes('/api/public/config') || url.includes('/api/cliente')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            cliente: {
              nombre: 'Chicas Bien',
              logo: 'images/placeholder-logo.svg'
            },
            rifa: {
              totalBoletos: 100,
              precioBoleto: 20,
              oportunidades: {
                enabled: false
              },
              rangos: [
                { inicio: 0, fin: 99, nombre: 'General' }
              ]
            },
            cuentas: []
          }
        })
      });
      return;
    }

    if (url.includes('/api/public/boletos/stats')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            vendidos: 0,
            apartados: 0,
            disponibles: 100
          }
        })
      });
      return;
    }

    if (url.includes('/api/public/boletos?')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            sold: [],
            reserved: [],
            disponibles: 100,
            vendidos: 0,
            apartados: 0
          }
        })
      });
      return;
    }

    if (url.includes('/api/boletos/verificar')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          conflictos: []
        })
      });
      return;
    }

    if (url.includes('/api/boletos/disponibles-aleatorios')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          boletos: [11, 12, 13]
        })
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: {} })
    });
  });

  await page.addInitScript(() => {
    localStorage.setItem('rifaplus_cached_logo', 'images/placeholder-logo.svg');
    localStorage.setItem('rifaplus_config_actual_v2', JSON.stringify({
      cliente: {
        nombre: 'Chicas Bien',
        logo: 'images/placeholder-logo.svg'
      },
      rifa: {
        totalBoletos: 100,
        precioBoleto: 20,
        oportunidades: { enabled: false },
        rangos: [{ inicio: 0, fin: 99, nombre: 'General' }]
      }
    }));
    localStorage.removeItem('rifaplusSelectedNumbers');
  });
}

test.describe('Compra movil critica', () => {
  test.beforeEach(async ({ page }) => {
    await mockCompraPage(page);
    await page.goto('/compra.html', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#numerosGrid .numero-btn').first()).toBeVisible();
  });

  test('los taps rapidos en la maquina suman cada toque sin duplicarse', async ({ page }) => {
    const inputCantidad = page.locator('#cantidadNumeros');
    const btnAumentar = page.locator('#aumentarCantidad');
    const btnDisminuir = page.locator('#disminuirCantidad');

    await expect(inputCantidad).toHaveValue('0');

    await btnAumentar.tap();
    await btnAumentar.tap();
    await expect(inputCantidad).toHaveValue('2');

    await btnDisminuir.tap();
    await expect(inputCantidad).toHaveValue('1');
  });

  test('seleccionar un boleto actualiza el grid y el carrito en movil', async ({ page }) => {
    const primerBoleto = page.locator('#numerosGrid .numero-btn').first();
    const numeroTexto = await primerBoleto.textContent();

    await primerBoleto.tap();

    await expect(primerBoleto).toHaveClass(/selected/);
    await expect(page.locator('.carrito-count')).toHaveText('1');

    await page.locator('#carritoNav').tap();
    await expect(page.locator('#carritoModal')).toHaveClass(/active/);
    await expect(page.locator('#carritoItems')).toContainText((numeroTexto || '').trim());
  });

  test('reconstruye items del carrito si el snapshot coincide pero el DOM quedo vacio', async ({ page }) => {
    const primerBoleto = page.locator('#numerosGrid .numero-btn').first();

    await primerBoleto.tap();
    await expect(page.locator('.carrito-count')).toHaveText('1');

    await page.locator('#carritoNav').tap();
    await expect(page.locator('#carritoItems .carrito-item')).toHaveCount(1);

    await page.evaluate(() => {
      const carritoItems = document.getElementById('carritoItems');
      if (carritoItems) {
        carritoItems.innerHTML = '';
      }
      const modal = document.getElementById('carritoModal');
      if (modal) {
        modal.classList.remove('active');
      }
      if (window.rifaplusModalScrollLock?.sync) {
        window.rifaplusModalScrollLock.sync();
      }
    });

    await page.locator('#carritoNav').tap();
    await expect(page.locator('#carritoItems .carrito-item')).toHaveCount(1);
  });
});

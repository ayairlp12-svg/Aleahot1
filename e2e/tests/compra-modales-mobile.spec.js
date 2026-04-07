const { test, expect, devices } = require('@playwright/test');

const MOBILE_DEVICE = devices['iPhone 13'];

test.use({
  userAgent: MOBILE_DEVICE.userAgent,
  deviceScaleFactor: MOBILE_DEVICE.deviceScaleFactor,
  isMobile: MOBILE_DEVICE.isMobile,
  hasTouch: MOBILE_DEVICE.hasTouch,
  viewport: { width: 390, height: 844 }
});

function buildConfigPayload(cuentas = []) {
  return {
    success: true,
    data: {
      cliente: {
        id: 'cliente-demo',
        nombre: 'Chicas Bien',
        logo: 'images/placeholder-logo.svg',
        prefijoOrden: 'CB'
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
      cuentas
    }
  };
}

async function mockCompraPage(page, opciones = {}) {
  const cuentas = opciones.cuentas || [];
  const configPayload = buildConfigPayload(cuentas);

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
        body: JSON.stringify(configPayload)
      });
      return;
    }

    if (url.includes('/api/public/order-counter/next')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          orden_id: 'CB-AA001'
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

  await page.addInitScript(({ payload }) => {
    localStorage.setItem('rifaplus_cached_logo', 'images/placeholder-logo.svg');
    localStorage.setItem('rifaplus_config_actual_v2', JSON.stringify(payload.data));
    localStorage.removeItem('rifaplusSelectedNumbers');
    localStorage.removeItem('rifaplus_boletos');
    localStorage.removeItem('rifaplus_cliente');
    localStorage.removeItem('rifaplus_orden_actual');
    localStorage.removeItem('rifaplus_total');
  }, { payload: configPayload });
}

async function abrirModalContactoDesdeCarrito(page) {
  await page.locator('#numerosGrid .numero-btn').first().tap();
  await expect(page.locator('.carrito-count')).toHaveText('1');

  await page.locator('#carritoNav').tap();
  await expect(page.locator('#carritoModal')).toHaveClass(/active/);

  const btnProcederCarrito = page.locator('#btnProcederCarrito');
  await expect(btnProcederCarrito).toBeEnabled();
  await btnProcederCarrito.tap();

  await expect(page.locator('#modalContacto')).toHaveClass(/show/);
}

async function llenarFormularioContactoValido(page) {
  await page.locator('#clienteNombre').fill('Ana');
  await page.locator('#clienteApellidos').fill('Tester');
  await page.locator('#clienteWhatsapp').fill('5512345678');
  await page.locator('#clienteEstado').selectOption('Ciudad de México');
  await page.locator('#clienteCiudad').fill('Centro');
}

test.describe('Compra movil modales criticos', () => {
  test('el modal de contacto valida campos obligatorios antes de avanzar', async ({ page }) => {
    await mockCompraPage(page);
    await page.goto('/compra.html', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#numerosGrid .numero-btn').first()).toBeVisible();

    await abrirModalContactoDesdeCarrito(page);
    await page.locator('#btnContinuarContacto').tap();

    await expect(page.locator('#errorNombre')).not.toHaveText('');
    await expect(page.locator('#errorWhatsapp')).not.toHaveText('');
    await expect(page.locator('#errorEstado')).not.toHaveText('');
    await expect(page.locator('#errorCiudad')).not.toHaveText('');
    await expect(page.locator('#modalSeleccionCuenta')).not.toHaveClass(/show/);
  });

  test('con datos validos avanza al modal de seleccion de cuenta', async ({ page }) => {
    await mockCompraPage(page, {
      cuentas: [
        {
          id: 'cta-1',
          paymentType: 'transferencia',
          nombreBanco: 'Banco Demo',
          accountNumber: '1234567890',
          beneficiary: 'Demo QA',
          numero_referencia: 'REF-123'
        }
      ]
    });

    await page.goto('/compra.html', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#numerosGrid .numero-btn').first()).toBeVisible();

    await abrirModalContactoDesdeCarrito(page);
    await llenarFormularioContactoValido(page);
    await page.locator('#btnContinuarContacto').tap();

    await expect(page.locator('#modalSeleccionCuenta')).toHaveClass(/show/);
    await expect(page.locator('#transferenciasLista input[name="cuentaPago"]')).toHaveCount(1);
    await expect(page.locator('#transferenciasLista')).toContainText('Banco Demo');
  });

  test('seleccionar una cuenta abre la orden formal en movil', async ({ page }) => {
    await mockCompraPage(page, {
      cuentas: [
        {
          id: 'cta-1',
          paymentType: 'transferencia',
          nombreBanco: 'Banco Demo',
          accountNumber: '1234567890',
          beneficiary: 'Demo QA',
          numero_referencia: 'REF-123'
        }
      ]
    });

    await page.goto('/compra.html', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#numerosGrid .numero-btn').first()).toBeVisible();

    await abrirModalContactoDesdeCarrito(page);
    await llenarFormularioContactoValido(page);
    await page.locator('#btnContinuarContacto').tap();
    await expect(page.locator('#modalSeleccionCuenta')).toHaveClass(/show/);

    await page.locator('label[for="cuenta_0"]').tap();

    await expect(page.locator('#modalOrdenFormal')).toHaveClass(/show/);
    await expect(page.locator('#contenidoOrdenFormal')).toContainText('CB-AA001');
    await expect(page.locator('#contenidoOrdenFormal')).toContainText('Banco Demo');
  });
});

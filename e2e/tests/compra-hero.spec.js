const { test, expect } = require('@playwright/test');

test.describe('Hero de compra', () => {
  test.use({
    viewport: { width: 390, height: 844 }
  });

  test('mantiene el nombre real del organizador aunque la sincronizacion devuelva un placeholder', async ({ page }) => {
    await page.route('**/api/**', async (route) => {
      const url = route.request().url();

      if (url.includes('/api/cliente')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              cliente: { nombre: 'Sorteo' },
              rifa: { totalBoletos: 100, precioBoleto: 20 },
              cuentas: []
            }
          })
        });
        return;
      }

      if (url.includes('/api/public/config')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              cliente: { nombre: 'Sorteo' },
              rifa: { totalBoletos: 100, precioBoleto: 20 },
              precioBoleto: 20,
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
            vendidos: 0,
            apartados: 0,
            disponibles: 100
          })
        });
        return;
      }

      if (url.includes('/api/public/boletos')) {
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

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: {} })
      });
    });

    await page.addInitScript(() => {
      localStorage.setItem('rifaplus_compra_hero_organizador', 'Chicas Bien');
      localStorage.setItem('rifaplus_config_actual_v2', JSON.stringify({
        cliente: { nombre: 'Sorteo' }
      }));
      localStorage.setItem('rifaplus_cached_logo', 'images/placeholder-cover.svg');
    });

    await page.goto('/compra.html', { waitUntil: 'domcontentloaded' });

    const heroTitle = page.locator('#compraHeroTitle');
    const tituloEsperado = '¿Listo para ser el proximo ganador de Chicas Bien? Elige tus boletos y participa ahora';

    await expect(heroTitle).toHaveText(tituloEsperado);
    await page.waitForTimeout(900);
    await expect(heroTitle).toHaveText(tituloEsperado);
    await expect(heroTitle).not.toContainText('Sorteo');
  });
});

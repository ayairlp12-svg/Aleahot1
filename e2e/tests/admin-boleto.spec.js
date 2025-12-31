const { test, expect } = require('@playwright/test');

test('admin can login and search boleto 10 via API', async ({ request }) => {
  const baseURL = 'http://127.0.0.1:5001';
  
  // 1. Hacer login y obtener token
  const loginRes = await request.post(`${baseURL}/api/admin/login`, { 
    data: { username: 'admin', password: 'admin123' }
  });
  expect(loginRes.ok()).toBeTruthy();
  const loginBody = await loginRes.json();
  const token = loginBody?.token;
  expect(token).toBeTruthy();

  // 2. Consultar el endpoint boleto-simple/10 con token
  const boletoRes = await request.get(`${baseURL}/api/admin/boleto-simple/10`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  expect(boletoRes.ok()).toBeTruthy();
  const boletoData = await boletoRes.json();
  
  // 3. Verificar estructura y que el boleto está "apartado"
  expect(boletoData.success).toBeTruthy();
  expect(boletoData.data).toBeTruthy();
  expect(boletoData.data.numero).toBe(10);
  expect(boletoData.data.estado).toMatch(/apartado|vendido/);
  console.log('✅ Boleto 10 encontrado:', boletoData.data.estado);
});



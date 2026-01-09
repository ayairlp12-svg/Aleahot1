require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Client } = require('pg');

(async () => {
  const username = 'admin';
  const password = 'admin123';
  const email = 'admin@rifas.com';
  
  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);
  
  const connectionString = process.env.DATABASE_URL + '?sslmode=require';
  const client = new Client({ connectionString });
  try {
    await client.connect();
    
    const { rows } = await client.query(
      'INSERT INTO admin_users (username, password_hash, email, rol, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING id, username, email, rol',
      [username, hashedPassword, email, 'admin']
    );
    
    console.log('✅ Admin user created:', rows[0]);
    console.log('📧 Email:', email);
    console.log('🔑 Username:', username);
    console.log('🔐 Password:', password);
    
    await client.end();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();

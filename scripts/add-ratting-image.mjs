import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'vishwaka_vishwakarmagifts'
  });
  
  try {
    console.log('Adding image_url to ratting table...');
    await connection.execute('ALTER TABLE ratting ADD COLUMN image_url VARCHAR(255)');
    console.log('Successfully added image_url to ratting table.');
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('Column image_url already exists.');
    } else {
      console.error('Error adding column:', error);
    }
  } finally {
    await connection.end();
  }
}

main();

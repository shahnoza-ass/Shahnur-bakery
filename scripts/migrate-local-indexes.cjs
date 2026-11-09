const fs = require('node:fs');
const path = require('node:path');
const { MongoClient } = require('../shahnur-bakery-backend/node_modules/mongoose').mongo;
const dotenv = require('../shahnur-bakery-backend/node_modules/dotenv');
const env = dotenv.parse(fs.readFileSync(path.join(__dirname, '../shahnur-bakery-backend/.env'), 'utf8'));
async function main() {
  if (!/^mongodb:\/\/127\.0\.0\.1:27018\/[^?]+_local_rs\?replicaSet=bakery-rs$/.test(env.MONGODB_URI || '')) {
    throw new Error('Indeks migratsiyasi faqat ushbu loyiha yaratgan mahalliy nusxaga ruxsat etilgan');
  }
  const client = new MongoClient(env.MONGODB_URI);
  try {
    await client.connect();
    const collection = client.db().collection('products');
    const indexes = await collection.indexes();
    const old = indexes.find(index => index.name === 'slug_1');
    if (old && !old.sparse) {
      await collection.dropIndex('slug_1');
      await collection.createIndex({ slug: 1 }, { name: 'slug_1', unique: true, sparse: true });
      console.log('Mahalliy mahsulot slug indeksi yangilandi. Hujjatlar saqlandi.');
    }
  } catch (error) {
    if (error.code !== 26) throw error;
  } finally { await client.close(); }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });

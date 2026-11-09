const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const { MongoClient } = require('../shahnur-bakery-backend/node_modules/mongoose').mongo;
const dotenv = require('../shahnur-bakery-backend/node_modules/dotenv');
const envPath = path.join(root, 'shahnur-bakery-backend/.env');
const envSource = fs.readFileSync(envPath, 'utf8');
const env = dotenv.parse(envSource);
async function main() {
  const direct = new MongoClient('mongodb://127.0.0.1:27018/?directConnection=true', { serverSelectionTimeoutMS: 1000 });
  for (let attempt = 0; ; attempt++) {
    try { await direct.connect(); break; }
    catch (error) { if (attempt >= 20) throw error; await new Promise(resolve => setTimeout(resolve, 500)); }
  }
  try {
    const admin = direct.db('admin');
    const hello = await admin.command({ hello: 1 });
    if (!hello.setName) await admin.command({ replSetInitiate: { _id: 'bakery-rs', members: [{ _id: 0, host: '127.0.0.1:27018' }] } });
    for (let attempt = 0; ; attempt++) {
      const state = await admin.command({ hello: 1 });
      if (state.setName !== 'bakery-rs') throw new Error('27018 portida boshqa replica set mavjud');
      if (state.isWritablePrimary) break;
      if (attempt >= 40) throw new Error('Replica set primary holatiga o‘tmadi');
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  } finally { await direct.close(); }
  if (/127\.0\.0\.1:27018/.test(env.MONGODB_URI || '')) {
    console.log('Mahalliy replica set tayyor. Mavjud sozlama saqlandi.');
    return;
  }
  if (!env.MONGODB_URI) throw new Error('Mavjud MONGODB_URI sozlanmagan');
  const source = new MongoClient(env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
  const target = new MongoClient('mongodb://127.0.0.1:27018/?replicaSet=bakery-rs', { serverSelectionTimeoutMS: 10000 });
  try {
    await source.connect(); await target.connect();
    const sourceDb = source.db();
    const targetName = sourceDb.databaseName + '_local_rs';
    const targetDb = target.db(targetName);
    const existing = await targetDb.listCollections().toArray();
    if (existing.length) throw new Error('Yangi mahalliy bazada ma’lumot mavjud; ustidan yozilmadi');
    let count = 0;
    for (const collection of await sourceDb.listCollections().toArray()) {
      if (collection.name.startsWith('system.') || collection.type !== 'collection') continue;
      await targetDb.createCollection(collection.name);
      const destination = targetDb.collection(collection.name);
      const batch = [];
      for await (const document of sourceDb.collection(collection.name).find()) {
        batch.push(document);
        if (batch.length === 100) { await destination.insertMany(batch); count += batch.length; batch.length = 0; }
      }
      if (batch.length) { await destination.insertMany(batch); count += batch.length; }
      for (const index of await sourceDb.collection(collection.name).indexes()) {
        if (index.name === '_id_') continue;
        const options = { name: index.name };
        for (const key of ['unique', 'sparse', 'expireAfterSeconds', 'partialFilterExpression', 'collation']) if (index[key] !== undefined) options[key] = index[key];
        if (collection.name === 'products' && index.name === 'slug_1') options.sparse = true;
        await destination.createIndex(index.key, options);
      }
    }
    const targetUri = 'mongodb://127.0.0.1:27018/' + targetName + '?replicaSet=bakery-rs';
    fs.mkdirSync(path.join(root, '.local'), { recursive: true });
    fs.writeFileSync(path.join(root, '.local/database-migration.json'), JSON.stringify({ completedAt: new Date().toISOString(), documentsCopied: count, sourceDatabase: sourceDb.databaseName, targetDatabase: targetName }, null, 2));
    const updated = /^MONGODB_URI=.*$/m.test(envSource) ? envSource.replace(/^MONGODB_URI=.*$/m, () => 'MONGODB_URI=' + targetUri) : envSource + '\nMONGODB_URI=' + targetUri + '\n';
    // Keep a local, ignored copy of the original configuration for rollback.
    fs.writeFileSync(path.join(root, '.local/backend.env.before-replica'), envSource, { flag: 'wx' });
    fs.writeFileSync(envPath, updated);
    console.log('Alohida replica set tayyor. Nusxalangan hujjatlar: ' + count + '. Asl baza o‘zgartirilmadi.');
  } finally { await source.close(); await target.close(); }
}
main().catch(error => { console.error('Mahalliy bazani tayyorlashda xatolik:', error.message); process.exitCode = 1; });

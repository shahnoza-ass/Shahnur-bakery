const mongoose = require('mongoose');
const Product = require('../models/Product');
const catalog = require('../data/initial-catalog.json');
const migrationId = 'initial-public-catalog-v1';

async function importInitialCatalog(connection = mongoose.connection, Products = Product) {
  const migrations = connection.db.collection('app_migrations');
  if (await migrations.findOne({ _id: migrationId })) return;
  let imported = 0;
  try {
    await connection.transaction(async session => {
      imported = 0;
      if (await migrations.findOne({ _id: migrationId }, { session })) return;
      // An existing catalog is managed by the shop owner and is never replaced.
      const count = await Products.countDocuments({}).session(session);
      if (count === 0) {
        await Products.insertMany(catalog, { session, ordered: true });
        imported = catalog.length;
      }
      await migrations.insertOne({ _id: migrationId, completedAt: new Date(), imported, skippedExistingCatalog: count > 0 }, { session });
    });
  } catch (error) {
    // Another instance may have completed the same atomic import first.
    if (error.code !== 11000 || !await migrations.findOne({ _id: migrationId })) throw error;
    return;
  }
  console.log(`[catalog] Initial import complete: ${imported} products added`);
}

module.exports = { importInitialCatalog };

const mongoose = require('mongoose');
module.exports = async () => {
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  const hello = await mongoose.connection.db.admin().command({ hello: 1 });
  if (!hello.setName && hello.msg !== 'isdbgrid') {
    await mongoose.disconnect();
    throw new Error('Buyurtmalar uchun MongoDB replica set kerak. README dagi sozlamani bajaring.');
  }
  await Promise.all(Object.values(mongoose.models).map(model => model.init()));
  console.log('MongoDB ready');
};

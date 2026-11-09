const mongoose = require('mongoose');
const { Readable } = require('node:stream');
const { pipeline } = require('node:stream/promises');
const cloudinary = require('../config/cloudinary');
function imageType(buffer) {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return 'image/png';
  if (buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
  if (buffer.length >= 6 && ['GIF87a', 'GIF89a'].includes(buffer.toString('ascii', 0, 6))) return 'image/gif';
  return null;
}
const bucket = () => new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'productImages' });
const hasCloud = () => ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'].every(key => Boolean(process.env[key]));
async function storeImage(file) {
  const contentType = imageType(file.buffer);
  if (!contentType) throw Object.assign(new Error('JPG, PNG, WEBP yoki GIF rasm tanlang.'), { statusCode: 400 });
  if (hasCloud()) {
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream({ folder: 'shahnur-bakery/products', resource_type: 'image', transformation: [{ width: 1600, height: 1600, crop: 'limit', quality: 'auto' }] }, (error, result) => error ? reject(error) : resolve(result));
      Readable.from(file.buffer).pipe(stream);
    });
    return { path: result.secure_url, filename: result.public_id };
  }
  const stream = bucket().openUploadStream('product-image', { metadata: { contentType }, contentType });
  await pipeline(Readable.from(file.buffer), stream);
  return { path: `/api/media/${stream.id}`, filename: `mongo:${stream.id}` };
}
async function removeStoredImage(file) {
  if (file.filename?.startsWith('mongo:')) await bucket().delete(new mongoose.Types.ObjectId(file.filename.slice(6)));
  else if (file.filename) await cloudinary.uploader.destroy(file.filename);
}
async function serveImage(req, res, next) {
  if (!/^[a-f\d]{24}$/i.test(req.params.id)) return res.status(404).end();
  try {
    const id = new mongoose.Types.ObjectId(req.params.id);
    const store = bucket();
    const file = await store.find({ _id: id }).next();
    if (!file) return res.status(404).end();
    const contentType = file.metadata?.contentType;
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(contentType)) return res.status(404).end();
    res.set({ 'Content-Type': contentType, 'Content-Length': String(file.length), 'Cache-Control': 'public, max-age=31536000, immutable', 'X-Content-Type-Options': 'nosniff' });
    const stream = store.openDownloadStream(id);
    stream.on('error', error => { if (!res.headersSent) next(error); else res.destroy(); });
    res.on('close', () => stream.destroy());
    stream.pipe(res);
  } catch (error) { next(error); }
}
module.exports = { imageType, storeImage, removeStoredImage, serveImage };

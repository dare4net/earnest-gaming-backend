/*
 One-off migration: Backfill userId for existing users
 Usage: npm run migrate:backfill-userid
*/

const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('../src/models/user.model');

function generateUserId() {
  const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += charset[Math.floor(Math.random() * charset.length)];
  }
  return `USR-${result}`;
}

async function run() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI not set');
    }
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const cursor = User.find({ $or: [{ userId: { $exists: false } }, { userId: null }, { userId: '' }] }).cursor();
    let updated = 0;
    for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
      let newId;
      // Ensure uniqueness by checking collisions
      // Rare due to randomness, but we guard anyway
      // Try up to 5 times
      for (let i = 0; i < 5; i++) {
        const candidate = generateUserId();
        const exists = await User.exists({ userId: candidate });
        if (!exists) { newId = candidate; break; }
      }
      if (!newId) {
        throw new Error('Failed to generate unique userId after retries');
      }

      doc.userId = newId;
      await doc.save({ validateBeforeSave: false });
      updated += 1;
      console.log(`Updated ${doc._id} -> ${newId}`);
    }

    console.log(`Backfill complete. Updated ${updated} users.`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  }
}

run();



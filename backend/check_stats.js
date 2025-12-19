
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function check() {
    try {
        const uri = process.env.MONGODB_URI;
        await mongoose.connect(uri);
        const Product = mongoose.model('Product', new mongoose.Schema({
            contestId: { type: String, uppercase: true },
            rarity: String,
            stock: Number,
            isActive: Boolean
        }));

        const stats = await Product.aggregate([
            { $match: { isActive: true, stock: { $gt: 0 } } },
            { $group: { _id: { contestId: '$contestId', rarity: '$rarity' }, count: { $sum: 1 } } }
        ]);

        console.log(JSON.stringify(stats, null, 2));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
check();

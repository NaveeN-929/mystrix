
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function check() {
    try {
        const uri = process.env.MONGODB_URI;
        await mongoose.connect(uri);

        const Contest = mongoose.model('Contest', new mongoose.Schema({
            contestId: String,
            price: Number,
            wheelRange: { min: Number, max: Number },
            isActive: Boolean
        }));

        const contests = await Contest.find({});
        console.log('CONTESTS_DATA_START');
        console.log(JSON.stringify(contests, null, 2));
        console.log('CONTESTS_DATA_END');

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
check();

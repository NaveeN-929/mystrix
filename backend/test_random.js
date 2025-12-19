
import axios from 'axios';

async function test() {
    try {
        console.log('Testing /api/products/random for Contest A (100 INR)...');
        const res = await axios.post('http://localhost:5000/api/products/random', {
            count: 20, // ask for 20 boxes to see distribution
            contestId: 'A'
        });

        if (!res.data || !res.data.boxes) {
            console.log('Error: Invalid response format', res.data);
            return;
        }

        console.log('Box results:');
        let emptyCount = 0;
        res.data.boxes.forEach((box, i) => {
            if (box.length === 0) {
                emptyCount++;
                console.log(`Box ${i + 1}: EMPTY 😢`);
            } else {
                console.log(`Box ${i + 1}: ${box.length} products - Rarity: ${box[0].rarity}`);
            }
        });
        console.log(`\nSummary: ${emptyCount} empty boxes out of 20`);

    } catch (e) {
        console.error('Error:', e.message);
        if (e.response) {
            console.error('Response data:', e.response.data);
        }
    }
}

test();

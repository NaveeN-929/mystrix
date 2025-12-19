
import axios from 'axios';

async function test() {
    try {
        console.log('Testing /api/products/random for Contest A...');
        const res = await axios.post('http://localhost:5000/api/products/random', {
            count: 10,
            contestId: 'A'
        });

        console.log('Response Keys:', Object.keys(res.data));
        if (res.data.boxes) {
            console.log('Boxes found!', res.data.boxes.length);
            res.data.boxes.forEach((box, i) => {
                console.log(`Box ${i + 1}: ${box.length} items`);
            });
        } else {
            console.log('NO BOXES FIELD IN RESPONSE');
            console.log('Full Response:', JSON.stringify(res.data, null, 2).substring(0, 500));
        }

    } catch (e) {
        console.error('Error:', e.message);
    }
}

test();

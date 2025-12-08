# Testing Guide - My Orders & Shipping Address Features

## Quick Test Checklist

### ✅ Step 1: Test User Registration/Login
1. Open http://localhost:3000
2. Click on "Sign Up" or navigate to `/signup`
3. Create a new account with:
   - Name: Test User
   - Email: test@example.com
   - Phone: 1234567890
   - Password: test123
4. You should be logged in automatically

### ✅ Step 2: Test My Orders Page
1. Navigate to http://localhost:3000/orders
2. You should see the "My Orders" page
3. If you haven't placed any orders yet, you'll see:
   - "No orders yet" message
   - "Start Shopping" button

### ✅ Step 3: Place a Test Order
1. Go to home page (http://localhost:3000)
2. Select a contest (e.g., "Starter Scoop")
3. Spin the wheel
4. If you win boxes, proceed to checkout
5. Fill in the shipping information
6. Complete the order
7. The order should now be linked to your user account

### ✅ Step 4: Verify My Orders Works
1. Go back to http://localhost:3000/orders
2. You should now see your order:
   - Order ID
   - Items ordered
   - Total amount
   - Delivery address
   - Order status
   - Payment status
3. Click on an order to expand and see full details

### ✅ Step 5: Test Profile & Addresses (API)

Since the UI for address management isn't built yet, test via API:

**Using Browser Console or Postman:**

```javascript
// Get your auth token from localStorage
const token = JSON.parse(localStorage.getItem('mystrix-auth')).state.token

// Add a shipping address
fetch('http://localhost:5000/api/user/addresses', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    name: 'John Doe',
    phone: '9876543210',
    address: '123 Main Street',
    city: 'New York',
    pincode: '10001',
    isDefault: true
  })
}).then(r => r.json()).then(console.log)

// Get all addresses
fetch('http://localhost:5000/api/user/addresses', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
}).then(r => r.json()).then(console.log)

// Get profile with addresses
fetch('http://localhost:5000/api/user/profile', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
}).then(r => r.json()).then(console.log)
```

### ✅ Step 6: Verify Database Changes

**Check MongoDB:**

```javascript
// In MongoDB Compass or mongo shell:

// View users collection - should now have shippingAddresses field
db.users.find().pretty()

// View orders collection - should have userId field linking to users
db.orders.find().pretty()

// Find orders for a specific user
db.orders.find({ userId: "USER_ID_HERE" }).pretty()
```

## Expected Results

### User Document (MongoDB)
```json
{
  "_id": "ObjectId(...)",
  "name": "Test User",
  "email": "test@example.com",
  "phone": "1234567890",
  "password": "$2a$...",  // hashed
  "isActive": true,
  "shippingAddresses": [
    {
      "_id": "ObjectId(...)",
      "name": "John Doe",
      "phone": "9876543210",
      "address": "123 Main Street",
      "city": "New York",
      "pincode": "10001",
      "isDefault": true
    }
  ],
  "createdAt": "2024-...",
  "updatedAt": "2024-..."
}
```

### Order Document (MongoDB)
```json
{
  "_id": "ObjectId(...)",
  "orderId": "MS-...",
  "userId": "USER_ID_HERE",  // Links to user._id
  "items": [...],
  "totalAmount": 100,
  "contestFee": 0,
  "customerInfo": {
    "name": "Test User",
    "phone": "1234567890",
    "address": "123 Test St",
    "city": "Test City",
    "pincode": "12345"
  },
  "status": "pending",
  "paymentStatus": "completed",
  "createdAt": "2024-...",
  "updatedAt": "2024-..."
}
```

## API Endpoints Reference

### User Profile & Addresses
- `GET /api/user/profile` - Get user profile with addresses
- `PUT /api/user/profile` - Update user profile
- `GET /api/user/addresses` - Get all addresses
- `POST /api/user/addresses` - Add new address
- `PUT /api/user/addresses/:id` - Update address
- `DELETE /api/user/addresses/:id` - Delete address

### Orders
- `GET /api/orders/my-orders` - Get authenticated user's orders (REQUIRES AUTH)
- `POST /api/orders` - Create new order (OPTIONAL AUTH)
- `GET /api/orders/:id` - Get single order by ID

### Auth (Backward Compatible)
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user (now includes addresses)
- `PUT /api/auth/profile` - Update profile (still works)

## Troubleshooting

### Issue: "No orders showing"
**Solution:** 
1. Make sure you're logged in
2. Check browser console for errors
3. Verify token is valid: Check `localStorage.getItem('mystrix-auth')`
4. Make sure you've actually placed an order while logged in

### Issue: "Failed to fetch orders"
**Solution:**
1. Check backend is running on port 5000
2. Open browser DevTools > Network tab
3. Check the API request to `/api/orders/my-orders`
4. Verify Authorization header is present
5. Check backend terminal for error logs

### Issue: "Orders exist but userId is null"
**Solution:**
- Old orders placed before login won't show in my-orders
- Only orders placed AFTER logging in will be linked to your account
- Place a new order while logged in to test

### Issue: "Cannot add shipping address"
**Solution:**
1. Verify you're authenticated
2. Check the request payload format
3. Ensure all required fields are provided:
   - name, phone, address, city, pincode
4. Check backend logs for validation errors

## Next Steps

Once testing is complete, you can:
1. ✅ Build UI for address management in profile page
2. ✅ Add address selection during checkout
3. ✅ Display saved addresses on checkout page
4. ✅ Add order tracking features
5. ✅ Implement email notifications for orders

## Files Modified

### Backend:
- `backend/src/models/User.ts` - Added shipping addresses
- `backend/src/routes/user.ts` - NEW: User profile routes
- `backend/src/routes/auth.ts` - Updated to return addresses
- `backend/src/index.ts` - Registered user routes

### Frontend:
- `frontend/lib/api.ts` - Added userApi and types
- `frontend/lib/authStore.ts` - Added address support
- `frontend/app/profile/page.tsx` - Updated to use userApi
- `frontend/app/orders/page.tsx` - Already existed, now works!

## Common Test Scenarios

### Scenario 1: Guest Checkout
1. User NOT logged in
2. Place order
3. Order created with userId = null
4. Order won't appear in /orders

### Scenario 2: Logged In Checkout
1. User IS logged in
2. Place order
3. Order created with userId = user._id
4. Order WILL appear in /orders

### Scenario 3: Multiple Addresses
1. User adds multiple shipping addresses
2. Sets one as default
3. During checkout, can select from saved addresses (once UI is built)

### Scenario 4: Profile Update
1. User updates name/phone
2. Changes reflect in all future orders
3. Past orders keep old information (from customerInfo)

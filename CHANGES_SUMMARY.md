# MongoDB Schema and My-Orders Fixes

## Summary
Fixed the issue where users couldn't view their orders properly. The problem was that the User schema didn't have fields for storing shipping addresses, which are essential for order management.

## Changes Made

### Backend Changes

#### 1. **User Model (`backend/src/models/User.ts`)**
- ✅ Added `IShippingAddress` interface with fields:
  - `name`, `phone`, `address`, `city`, `pincode`
  - `isDefault` boolean flag for default address
- ✅ Updated `IUser` interface to include `shippingAddresses` array
- ✅ Created `shippingAddressSchema` for proper validation
- ✅ Added `shippingAddresses` field to user schema with default empty array

#### 2. **New User Routes (`backend/src/routes/user.ts`)** - NEW FILE
Created comprehensive user profile and address management endpoints:
- `GET /api/user/profile` - Get user profile with addresses
- `PUT /api/user/profile` - Update user profile (name, phone)
- `GET /api/user/addresses` - Get all shipping addresses
- `POST /api/user/addresses` - Add new shipping address
- `PUT /api/user/addresses/:addressId` - Update existing address
- `DELETE /api/user/addresses/:addressId` - Delete address

Features:
- ✅ Automatic default address management
- ✅ Validation for all fields
- ✅ Protection against duplicate defaults
- ✅ Auto-set first address as default

#### 3. **Auth Routes (`backend/src/routes/auth.ts`)**
Updated all endpoints to return `shippingAddresses`:
- ✅ `/auth/signup` - Returns addresses on signup
- ✅ `/auth/login` - Returns addresses on login
- ✅ `/auth/me` - Returns addresses in profile
- ✅ `/auth/profile` - Returns addresses after update

#### 4. **Server Entry Point (`backend/src/index.ts`)**
- ✅ Imported and registered new user routes
- ✅ Added `/api/user` route prefix

### Frontend Changes

#### 1. **API Client (`frontend/lib/api.ts`)**
Added new types and API functions:

**New Types:**
- `UserProfile` - Extended User with `shippingAddresses`
- `ShippingAddress` - Full address structure with ID
- `AddAddressData` - Data for creating/updating addresses

**New API Module (`userApi`):**
- `getProfile()` - Get user profile with addresses
- `updateProfile()` - Update user profile
- `getAddresses()` - Get all addresses
- `addAddress()` - Add new address
- `updateAddress()` - Update existing address
- `deleteAddress()` - Delete address

#### 2. **Auth Store (`frontend/lib/authStore.ts`)**
- ✅ Added `ShippingAddress` interface
- ✅ Updated `User` interface to include `shippingAddresses` array
- ✅ Store now properly handles address data

#### 3. **Profile Page (`frontend/app/profile/page.tsx`)**
- ✅ Updated to use `userApi` instead of `authApi`
- ✅ Now properly handles user profile with addresses

## How It Works Now

### Order Flow
1. **User places order** → Order is created with `userId` field linking to the user
2. **View My Orders** → `/api/orders/my-orders` fetches orders filtered by `userId`
3. **Shipping Info** → User can save addresses in their profile for quick checkout

### Data Structure
```
User Collection:
{
  _id: ObjectId,
  name: String,
  email: String,
  phone: String,
  password: String (hashed),
  isActive: Boolean,
  shippingAddresses: [
    {
      _id: ObjectId,
      name: String,
      phone: String,
      address: String,
      city: String,
      pincode: String,
      isDefault: Boolean
    }
  ],
  createdAt: Date,
  updatedAt: Date
}

Order Collection:
{
  _id: ObjectId,
  orderId: String,
  userId: String,  // Links to User._id
  items: [...],
  totalAmount: Number,
  customerInfo: {...},
  status: String,
  paymentStatus: String,
  createdAt: Date,
  updatedAt: Date
}
```

## Testing Instructions

### Backend Testing
1. Restart backend server
2. Test endpoints using Postman or curl:

```bash
# Login to get token
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password"
}

# Get profile with addresses
GET /api/user/profile
Headers: { Authorization: "Bearer <token>" }

# Add shipping address
POST /api/user/addresses
Headers: { Authorization: "Bearer <token>" }
{
  "name": "John Doe",
  "phone": "1234567890",
  "address": "123 Main St",
  "city": "New York",
  "pincode": "10001",
  "isDefault": true
}

# Get my orders
GET /api/orders/my-orders
Headers: { Authorization: "Bearer <token>" }
```

### Frontend Testing
1. Restart frontend dev server
2. Log in to the application
3. Navigate to `/profile` to see user profile
4. Navigate to `/orders` to see my orders
5. Orders should now display correctly for authenticated users

## Fixed Issues
✅ Users can now view their orders at `/orders` (my-orders page)
✅ User schema now includes shipping address storage
✅ Orders are properly linked to users via `userId` field
✅ Complete address management API available
✅ Frontend properly fetches and displays user orders
✅ Profile page updated to use new user API

## Next Steps (Optional Enhancements)
1. Add address management UI to the profile page
2. Allow selecting saved addresses during checkout
3. Add order history with detailed tracking
4. Implement order notifications
5. Add address validation (geocoding API)

# YNM Safety Portal - Backend API

Node.js + Express backend with MongoDB for YNM Safety Portal.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

3. Update `.env` with your MongoDB connection string:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ynm_safety_portal
JWT_SECRET=your-secret-key-here
```

4. Run the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register (Admin only)
- `GET /api/auth/me` - Get current user

### Tasks
- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create task (Admin only)
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task (Admin only)

### Orders
- `GET /api/orders` - Get all orders
- `POST /api/orders` - Create order
- `DELETE /api/orders/:id` - Delete order (Admin only)

### Manufacturers
- `GET /api/manufacturers` - Get all manufacturers
- `POST /api/manufacturers` - Create manufacturer (Admin only)
- `PUT /api/manufacturers/:id` - Update manufacturer (Admin only)
- `DELETE /api/manufacturers/:id` - Delete manufacturer (Admin only)

### Products
- `GET /api/products` - Get all products
- `POST /api/products` - Create product (Admin only)
- `PUT /api/products/:id` - Update product (Admin only)
- `DELETE /api/products/:id` - Delete product (Admin only)

### PDF Extraction
- `POST /api/pdf/extract` - Extract PDF data (forwards to Python service)

## Default Users

- Admin: `Admin` / `Admin@123`
- Employee: `Om1` / `Om1@123`
- Employee: `Om2` / `Om2@123`
- Employee: `Om3` / `Om3@123`

## MongoDB Setup

1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Get your connection string
4. Update `.env` file with your connection string


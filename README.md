# Receiving API - Node.js/Express + Supabase

API สำหรับระบบรับสินค้า เชื่อมต่อกับ Supabase Database

## Features

- ✅ สร้างใบรับสินค้า (Receipt)
- ✅ ดึงรายการใบรับสินค้า พร้อม filter และ pagination
- ✅ Upload รูปภาพสินค้า
- ✅ Authentication ด้วย Supabase API Key
- ✅ TypeScript support
- ✅ Error handling

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **File Upload**: Multer
- **Storage**: Supabase Storage

## Prerequisites

- Node.js 18+
- npm or yarn
- Supabase Account และ Project
- Supabase Database Schema (รัน `supabase-schema.sql` แล้ว)

## Installation

1. Clone หรือสร้างโปรเจค

```bash
cd receiving-api
```

2. ติดตั้ง dependencies

```bash
npm install
```

3. สร้างไฟล์ `.env` จาก `.env.example`

```bash
cp .env.example .env
```

4. แก้ไขค่าใน `.env`

```env
PORT=3000
NODE_ENV=development

# ดูค่าจาก Supabase Dashboard > Settings > API
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

UPLOAD_MAX_SIZE=10485760
```

## Development

รัน server ในโหมด development (auto-reload)

```bash
npm run dev
```

Server จะรันที่: `http://localhost:3000`

## Production

1. Build TypeScript เป็น JavaScript

```bash
npm run build
```

2. รัน production server

```bash
npm start
```

## API Endpoints

### Health Check

```
GET /health
```

ตรวจสอบสถานะ API

**Response:**
```json
{
  "success": true,
  "message": "API is running",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 1. สร้างใบรับสินค้า

```
POST /receipt/create
```

**Headers:**
```
x-supabase-key: YOUR_SUPABASE_ANON_KEY
Content-Type: application/json
```

**Body:**
```json
{
  "item_id": "uuid-of-item",
  "user_id": "uuid-of-user",
  "quantity": 100,
  "defect_quantity": 5,
  "location": "Zone A, Shelf 12",
  "notes": "สินค้ามีตำหนิเล็กน้อย",
  "status": "completed"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "receipt_no": "RCV-20240115-001",
    "item_id": "uuid-of-item",
    "user_id": "uuid-of-user",
    "quantity": 100,
    "defect_quantity": 5,
    "location": "Zone A, Shelf 12",
    "notes": "สินค้ามีตำหนิเล็กน้อย",
    "status": "completed",
    "received_at": "2024-01-15T10:30:00.000Z",
    "items": {
      "id": "uuid",
      "item_no": "ITEM-001",
      "product_name": "โต๊ะทำงาน",
      "category": "เฟอร์นิเจอร์"
    },
    "users": {
      "id": "uuid",
      "employee_code": "E001",
      "name": "สมชาย ใจดี"
    }
  },
  "message": "Receipt created successfully"
}
```

### 2. ดึงรายการใบรับสินค้า

```
GET /receipt/list
```

**Headers:**
```
x-supabase-key: YOUR_SUPABASE_ANON_KEY
```

**Query Parameters:**
- `status` - Filter by status (pending, completed, cancelled)
- `item_id` - Filter by item
- `user_id` - Filter by user
- `start_date` - Filter by start date (ISO format)
- `end_date` - Filter by end date (ISO format)
- `limit` - จำนวนต่อหน้า (default: 50)
- `offset` - เริ่มต้นที่แถวไหน (default: 0)

**Example:**
```
GET /receipt/list?status=completed&limit=10&offset=0
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "receipt_no": "RCV-20240115-001",
      "quantity": 100,
      "defect_quantity": 5,
      "status": "completed",
      "received_at": "2024-01-15T10:30:00.000Z",
      "items": {
        "id": "uuid",
        "item_no": "ITEM-001",
        "product_name": "โต๊ะทำงาน",
        "category": "เฟอร์นิเจอร์"
      },
      "users": {
        "id": "uuid",
        "employee_code": "E001",
        "name": "สมชาย ใจดี"
      },
      "photos": [
        {
          "id": "uuid",
          "photo_url": "https://...",
          "photo_type": "general"
        }
      ],
      "defects": [
        {
          "id": "uuid",
          "defect_type": "สินค้าชำรุด",
          "quantity": 5,
          "severity": "medium"
        }
      ]
    }
  ],
  "pagination": {
    "total": 100,
    "limit": 10,
    "offset": 0,
    "hasMore": true
  }
}
```

### 3. Upload รูปภาพ

```
POST /receipt/upload-photo
```

**Headers:**
```
x-supabase-key: YOUR_SUPABASE_ANON_KEY
Content-Type: multipart/form-data
```

**Form Data:**
- `photo` (file) - ไฟล์รูปภาพ (required)
- `receipt_id` (string) - UUID ของใบรับสินค้า (required)
- `photo_type` (string) - ประเภทรูป: general, defect, label, package (default: general)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "receipt_id": "uuid",
    "photo_url": "https://xxxxx.supabase.co/storage/v1/object/public/receipt-photos/...",
    "photo_type": "general",
    "file_size": 123456,
    "mime_type": "image/jpeg",
    "uploaded_at": "2024-01-15T10:30:00.000Z"
  },
  "message": "Photo uploaded successfully"
}
```

## Error Responses

API จะส่ง error ในรูปแบบ:

```json
{
  "success": false,
  "error": "Error message",
  "details": "Detailed error info (optional)"
}
```

**HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (ข้อมูลไม่ครบหรือไม่ถูกต้อง)
- `401` - Unauthorized (ไม่มี API key)
- `403` - Forbidden (API key ไม่ถูกต้อง)
- `404` - Not Found
- `500` - Internal Server Error

## Testing with cURL

### สร้าง Receipt

```bash
curl -X POST http://localhost:3000/receipt/create \
  -H "x-supabase-key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "item_id": "uuid-of-item",
    "user_id": "uuid-of-user",
    "quantity": 100,
    "defect_quantity": 0,
    "location": "Zone A",
    "status": "completed"
  }'
```

### ดึงรายการ Receipts

```bash
curl -X GET "http://localhost:3000/receipt/list?limit=5" \
  -H "x-supabase-key: YOUR_KEY"
```

### Upload รูปภาพ

```bash
curl -X POST http://localhost:3000/receipt/upload-photo \
  -H "x-supabase-key: YOUR_KEY" \
  -F "photo=@/path/to/image.jpg" \
  -F "receipt_id=uuid-of-receipt" \
  -F "photo_type=general"
```

## Project Structure

```
receiving-api/
├── src/
│   ├── config/
│   │   └── supabase.ts          # Supabase client configuration
│   ├── controllers/
│   │   ├── receiptController.ts # Receipt business logic
│   │   └── photoController.ts   # Photo upload logic
│   ├── middleware/
│   │   └── auth.ts              # Authentication middleware
│   ├── routes/
│   │   └── receipt.routes.ts    # API routes
│   ├── types/
│   │   └── index.ts             # TypeScript types
│   └── index.ts                 # Express app entry point
├── .env.example                 # Environment variables template
├── .gitignore
├── nodemon.json                 # Nodemon configuration
├── package.json
├── tsconfig.json                # TypeScript configuration
└── README.md
```

## Security

- API ใช้ Supabase Key สำหรับ authentication
- File upload จำกัดเฉพาะรูปภาพ
- ขนาดไฟล์ไม่เกิน 10MB (ตั้งค่าได้ใน `.env`)
- Validate ทุก input
- Error messages ไม่เปิดเผยข้อมูลสำคัญ

## Deployment

### Deploy to Railway/Render/Fly.io

1. Set environment variables ใน platform
2. Build command: `npm run build`
3. Start command: `npm start`

### Deploy to PM2 (Production Server)

```bash
# Install PM2
npm install -g pm2

# Build
npm run build

# Start with PM2
pm2 start dist/index.js --name receiving-api

# Save PM2 config
pm2 save

# Setup auto-restart on reboot
pm2 startup
```

## License

ISC

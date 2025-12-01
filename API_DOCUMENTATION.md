# API Documentation - Receiving System

## Base URL
```
http://localhost:3000
```

## Authentication
Currently, all endpoints are public. Consider adding Bearer Token authentication in production.

---

## Endpoints

### 1. Health Check

Check if the API is running.

**Endpoint:** `GET /health`

**Response:**
```json
{
  "success": true,
  "message": "API is running",
  "timestamp": "2024-11-23T10:00:00.000Z"
}
```

---

### 2. Validate QR Code

ตรวจสอบว่า QR Code มีในระบบหรือไม่ (สำหรับหน้ารับสินค้า)

**Endpoint:** `POST /item/verify-qr`

**Request Body:**
```json
{
  "qr_code": "ITEM-001"
}
```

**Response (Valid QR Code):**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "item": {
      "item_id": "550e8400-e29b-41d4-a716-446655440000",
      "item_no": "ITEM-001",
      "product_name": "โต๊ะทำงาน",
      "description": "โต๊ะทำงานไม้สัก ขนาด 120x60 ซม.",
      "category": "โต๊ะทำงาน"
    },
    "message": "QR Code ถูกต้อง พบสินค้าในระบบ"
  }
}
```

**Response (Invalid QR Code):**
```json
{
  "success": true,
  "data": {
    "valid": false,
    "item": null,
    "message": "QR Code ไม่ถูกต้อง หรือสินค้าไม่มีในระบบ"
  }
}
```

**Response (Bad Request):**
```json
{
  "success": false,
  "error": "QR Code is required"
}
```

---

### 3. Get All Items

ดึงรายการสินค้าทั้งหมด พร้อม pagination และ filters

**Endpoint:** `GET /item`

**Query Parameters:**
- `status` (optional): Filter by status (active/inactive)
- `category` (optional): Filter by category
- `limit` (optional): Number of items per page (default: 100)
- `offset` (optional): Starting position (default: 0)

**Example Request:**
```
GET /item?status=active&limit=20&offset=0
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "item_no": "ITEM-001",
      "product_name": "โต๊ะทำงาน",
      "description": "โต๊ะทำงานไม้สัก ขนาด 120x60 ซม.",
      "category": "โต๊ะทำงาน",
      "status": "active",
      "created_at": "2024-11-23T10:00:00.000Z",
      "updated_at": "2024-11-23T10:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 50,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

---

### 4. Create New Item

เพิ่มสินค้าใหม่เข้าระบบ

**Endpoint:** `POST /item`

**Request Body:**
```json
{
  "item_no": "ITEM-001",
  "product_name": "โต๊ะทำงาน",
  "description": "โต๊ะทำงานไม้สัก ขนาด 120x60 ซม.",
  "category": "โต๊ะทำงาน"
}
```

**Required Fields:**
- `item_no` (string): รหัสสินค้า (ต้องไม่ซ้ำกัน)
- `product_name` (string): ชื่อสินค้า

**Optional Fields:**
- `description` (string): รายละเอียดสินค้า
- `category` (string): หมวดหมู่สินค้า

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "item_no": "ITEM-001",
    "product_name": "โต๊ะทำงาน",
    "description": "โต๊ะทำงานไม้สัก ขนาด 120x60 ซม.",
    "category": "โต๊ะทำงาน",
    "status": "active",
    "created_at": "2024-11-23T10:00:00.000Z",
    "updated_at": "2024-11-23T10:00:00.000Z"
  },
  "message": "Item created successfully"
}
```

**Response (Duplicate item_no):**
```json
{
  "success": false,
  "error": "Item with this item_no already exists"
}
```

**Response (Validation Error):**
```json
{
  "success": false,
  "error": "item_no and product_name are required"
}
```

---

### 5. Update Item

แก้ไขข้อมูลสินค้า

**Endpoint:** `PUT /item/:id`

**URL Parameters:**
- `id` (UUID): Item ID

**Request Body:**
```json
{
  "item_no": "ITEM-001-UPDATED",
  "product_name": "โต๊ะทำงานแก้ไข",
  "description": "รายละเอียดใหม่",
  "category": "โต๊ะทำงาน",
  "status": "active"
}
```

**All Fields are Optional** - ส่งเฉพาะฟิลด์ที่ต้องการอัพเดท

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "item_no": "ITEM-001-UPDATED",
    "product_name": "โต๊ะทำงานแก้ไข",
    "description": "รายละเอียดใหม่",
    "category": "โต๊ะทำงาน",
    "status": "active",
    "created_at": "2024-11-23T10:00:00.000Z",
    "updated_at": "2024-11-23T11:00:00.000Z"
  },
  "message": "Item updated successfully"
}
```

**Response (Item Not Found):**
```json
{
  "success": false,
  "error": "Item not found"
}
```

**Response (Duplicate item_no):**
```json
{
  "success": false,
  "error": "Another item with this item_no already exists"
}
```

---

### 6. Delete Item

ลบสินค้าออกจากระบบ (Hard Delete)

**Endpoint:** `DELETE /item/:id`

**URL Parameters:**
- `id` (UUID): Item ID

**Response (Success):**
```json
{
  "success": true,
  "message": "Item deleted successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "item_no": "ITEM-001",
    "product_name": "โต๊ะทำงาน",
    "description": "โต๊ะทำงานไม้สัก ขนาด 120x60 ซม.",
    "category": "โต๊ะทำงาน",
    "status": "active",
    "created_at": "2024-11-23T10:00:00.000Z",
    "updated_at": "2024-11-23T10:00:00.000Z"
  }
}
```

**Response (Item Not Found):**
```json
{
  "success": false,
  "error": "Item not found"
}
```

**Note:** ในการใช้งานจริง แนะนำให้ใช้ **Soft Delete** โดยการเปลี่ยน `status` เป็น `inactive` แทนการลบแบบ hard delete

---

## Error Handling

### General Error Response
```json
{
  "success": false,
  "error": "Error message here"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Endpoint not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Internal server error"
}
```

---

## Testing with cURL

### 1. Validate QR Code
```bash
curl -X POST http://localhost:3000/item/verify-qr \
  -H "Content-Type: application/json" \
  -d '{"qr_code": "ITEM-001"}'
```

### 2. Get All Items
```bash
curl http://localhost:3000/item
```

### 3. Create Item
```bash
curl -X POST http://localhost:3000/item \
  -H "Content-Type: application/json" \
  -d '{
    "item_no": "ITEM-001",
    "product_name": "โต๊ะทำงาน",
    "description": "โต๊ะทำงานไม้สัก ขนาด 120x60 ซม.",
    "category": "โต๊ะทำงาน"
  }'
```

### 4. Update Item
```bash
curl -X PUT http://localhost:3000/item/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -d '{
    "product_name": "โต๊ะทำงานแก้ไข"
  }'
```

### 5. Delete Item
```bash
curl -X DELETE http://localhost:3000/item/550e8400-e29b-41d4-a716-446655440000
```

---

## Status Codes

- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request data
- `404 Not Found` - Resource not found
- `409 Conflict` - Duplicate data (e.g., item_no already exists)
- `500 Internal Server Error` - Server error

---

## Development

### Start Development Server
```bash
cd receiving-api
npm run dev
```

### Build for Production
```bash
npm run build
```

### Start Production Server
```bash
npm start
```

---

## Environment Variables

ตั้งค่าใน `.env`:

```env
PORT=3000
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## Database Schema

ตาราง `items`:

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| item_no | VARCHAR | รหัสสินค้า (Unique) |
| product_name | VARCHAR | ชื่อสินค้า |
| description | TEXT | รายละเอียด (Optional) |
| category | VARCHAR | หมวดหมู่ (Optional) |
| status | VARCHAR | สถานะ (active/inactive) |
| created_at | TIMESTAMP | วันที่สร้าง |
| updated_at | TIMESTAMP | วันที่อัพเดท |

---

## Notes

1. **QR Code = item_no**: QR Code ที่สแกนจะเป็นค่าของ `item_no` โดยตรง (เช่น "ITEM-001")
2. **Active Items Only**: endpoint `/item/verify-qr` จะค้นหาเฉพาะสินค้าที่มี `status = 'active'` เท่านั้น
3. **Pagination**: ใช้ `limit` และ `offset` สำหรับ pagination ใน GET /item
4. **CORS**: API เปิด CORS สำหรับ localhost และ production URLs ที่กำหนดไว้

---

## Support

หากพบปัญหาหรือต้องการความช่วยเหลือ กรุณาติดต่อทีมพัฒนา

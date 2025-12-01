# คู่มือการทดสอบ API - ระบบรับสินค้า

## ขั้นตอนที่ 1: เตรียมความพร้อม

### 1.1 ตรวจสอบไฟล์ `.env`

ตรวจสอบว่ามีไฟล์ `.env` และกรอกข้อมูล Supabase ให้ครบถ้วน:

```bash
cd /Users/chaliepetch/workspace/Project\ Teay/receiving-api
cat .env
```

ไฟล์ `.env` ควรมีข้อมูลดังนี้:

```env
PORT=3000
NODE_ENV=development

# Supabase Configuration
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Upload Configuration
UPLOAD_MAX_SIZE=10485760
```

**หากยังไม่มีไฟล์ `.env`:**
```bash
cp .env.example .env
# แล้วแก้ไขข้อมูล Supabase ให้ถูกต้อง
```

### 1.2 ตรวจสอบ Database Schema

ตรวจสอบว่าตาราง `items` มีอยู่ใน Supabase database:

1. เข้า Supabase Dashboard: https://supabase.com/dashboard
2. เลือก Project ของคุณ
3. ไปที่ Table Editor
4. ตรวจสอบว่ามีตาราง `items` พร้อมคอลัมน์:
   - `id` (uuid, primary key)
   - `item_no` (varchar, unique)
   - `product_name` (varchar)
   - `description` (text, nullable)
   - `category` (varchar, nullable)
   - `status` (varchar, default: 'active')
   - `created_at` (timestamp)
   - `updated_at` (timestamp)

**หากยังไม่มีตาราง `items`:** ให้รัน schema SQL ที่อยู่ในไฟล์ `supabase/schema.sql` (ถ้ามี)

### 1.3 ติดตั้ง Dependencies

```bash
cd receiving-api
npm install
```

---

## ขั้นตอนที่ 2: เริ่ม Development Server

```bash
npm run dev
```

คุณควรเห็น output ประมาณนี้:

```
🚀 Server is running on port 3000
📍 Health check: http://localhost:3000/health
📦 Receipt API: http://localhost:3000/receipt
📦 Product Submission API: http://localhost:3000/product-submission
📦 Item API: http://localhost:3000/item
```

---

## ขั้นตอนที่ 3: ทดสอบ API Endpoints

### วิธีที่ 1: ใช้ cURL (Terminal)

#### 3.1 ทดสอบ Health Check

```bash
curl http://localhost:3000/health
```

**ผลลัพธ์ที่ควรได้:**
```json
{
  "success": true,
  "message": "API is running",
  "timestamp": "2024-11-23T10:00:00.000Z"
}
```

#### 3.2 ทดสอบสร้างสินค้าใหม่ (POST /item)

```bash
curl -X POST http://localhost:3000/item \
  -H "Content-Type: application/json" \
  -d '{
    "item_no": "TEST-001",
    "product_name": "สินค้าทดสอบ",
    "description": "นี่คือสินค้าสำหรับทดสอบ",
    "category": "ทดสอบ"
  }'
```

**ผลลัพธ์ที่ควรได้:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-here",
    "item_no": "TEST-001",
    "product_name": "สินค้าทดสอบ",
    "description": "นี่คือสินค้าสำหรับทดสอบ",
    "category": "ทดสอบ",
    "status": "active",
    "created_at": "...",
    "updated_at": "..."
  },
  "message": "Item created successfully"
}
```

#### 3.3 ทดสอบดึงรายการสินค้าทั้งหมด (GET /item)

```bash
curl http://localhost:3000/item
```

#### 3.4 ทดสอบตรวจสอบ QR Code (POST /item/verify-qr)

**กรณี QR Code ถูกต้อง:**
```bash
curl -X POST http://localhost:3000/item/verify-qr \
  -H "Content-Type: application/json" \
  -d '{"qr_code": "TEST-001"}'
```

**ผลลัพธ์ที่ควรได้:**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "item": {
      "item_id": "uuid-here",
      "item_no": "TEST-001",
      "product_name": "สินค้าทดสอบ",
      "description": "นี่คือสินค้าสำหรับทดสอบ",
      "category": "ทดสอบ"
    },
    "message": "QR Code ถูกต้อง พบสินค้าในระบบ"
  }
}
```

**กรณี QR Code ไม่ถูกต้อง:**
```bash
curl -X POST http://localhost:3000/item/verify-qr \
  -H "Content-Type: application/json" \
  -d '{"qr_code": "FAKE-999"}'
```

**ผลลัพธ์ที่ควรได้:**
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

#### 3.5 ทดสอบแก้ไขสินค้า (PUT /item/:id)

**ก่อนอื่น ให้คัดลอก `id` จากผลลัพธ์ของ POST /item ข้างต้น แล้วแทนที่ `{ITEM_ID}` ด้านล่าง:**

```bash
curl -X PUT http://localhost:3000/item/{ITEM_ID} \
  -H "Content-Type: application/json" \
  -d '{
    "product_name": "สินค้าทดสอบแก้ไขแล้ว"
  }'
```

#### 3.6 ทดสอบลบสินค้า (DELETE /item/:id)

```bash
curl -X DELETE http://localhost:3000/item/{ITEM_ID}
```

---

### วิธีที่ 2: ใช้ Test Script (แนะนำ)

ผมได้สร้าง test script ให้แล้ว รันคำสั่งนี้:

```bash
npm run test:api
```

Script นี้จะทดสอบ endpoints ทั้งหมดอัตโนมัติ

---

### วิธีที่ 3: ใช้ Postman หรือ Thunder Client

#### ใช้ Postman:

1. เปิด Postman
2. Import Collection ใน `receiving-api/postman_collection.json` (ถ้ามี)
3. หรือสร้าง Request เอง:
   - Method: POST
   - URL: `http://localhost:3000/item/verify-qr`
   - Body (JSON):
     ```json
     {
       "qr_code": "TEST-001"
     }
     ```

#### ใช้ VS Code Thunder Client:

1. ติดตั้ง Extension "Thunder Client"
2. สร้าง New Request
3. ตั้งค่าเหมือน Postman ข้างต้น

---

## ขั้นตอนที่ 4: ทดสอบ Edge Cases

### 4.1 ทดสอบ Validation

**ทดสอบสร้างสินค้าโดยไม่ส่ง `item_no`:**
```bash
curl -X POST http://localhost:3000/item \
  -H "Content-Type: application/json" \
  -d '{
    "product_name": "สินค้าทดสอบ"
  }'
```

**ผลลัพธ์ที่ควรได้:**
```json
{
  "success": false,
  "error": "item_no and product_name are required"
}
```

### 4.2 ทดสอบ Duplicate item_no

**ลองสร้างสินค้าด้วย item_no ที่มีอยู่แล้ว:**
```bash
curl -X POST http://localhost:3000/item \
  -H "Content-Type: application/json" \
  -d '{
    "item_no": "TEST-001",
    "product_name": "สินค้าอื่น"
  }'
```

**ผลลัพธ์ที่ควรได้:**
```json
{
  "success": false,
  "error": "Item with this item_no already exists"
}
```

### 4.3 ทดสอบ Not Found

**ลองแก้ไขสินค้าที่ไม่มีอยู่:**
```bash
curl -X PUT http://localhost:3000/item/00000000-0000-0000-0000-000000000000 \
  -H "Content-Type: application/json" \
  -d '{
    "product_name": "แก้ไขสินค้า"
  }'
```

**ผลลัพธ์ที่ควรได้:**
```json
{
  "success": false,
  "error": "Item not found"
}
```

---

## ขั้นตอนที่ 5: ทดสอบกับ Frontend

### 5.1 อัพเดท Frontend .env

ไปที่โปรเจกต์ Frontend (receiving-backoffice) และแก้ไข `.env`:

```env
VITE_API_BASE_URL=http://localhost:3000
```

### 5.2 เริ่ม Frontend

```bash
cd ../receiving-backoffice
npm run dev
```

### 5.3 ทดสอบผ่าน UI

1. เปิด Browser ไปที่ `http://localhost:8080` (หรือ port ที่ frontend รัน)
2. ไปที่หน้า "รับสินค้า" (Receiving)
3. พิมพ์ QR Code: `TEST-001`
4. กดตรวจสอบ
5. ควรเห็นข้อมูลสินค้าปรากฏขึ้น

---

## ขั้นตอนที่ 6: ตรวจสอบ Logs

### 6.1 ดู Server Logs

ในขณะที่ server กำลังรัน (`npm run dev`) คุณจะเห็น logs:

```
Error in verifyQRCode: ...  <- ถ้ามี error
```

### 6.2 ดู Supabase Logs

1. ไปที่ Supabase Dashboard
2. เลือก Project
3. ไปที่ Logs > API Logs
4. ดู requests ที่เข้ามา

---

## ปัญหาที่อาจพบและวิธีแก้

### ❌ Error: Missing Supabase environment variables

**วิธีแก้:**
```bash
# ตรวจสอบว่ามีไฟล์ .env และกรอกข้อมูลครบถ้วน
cat .env

# ถ้ายังไม่มี ให้ copy จาก .env.example
cp .env.example .env
# แล้วแก้ไข SUPABASE_URL และ SUPABASE_ANON_KEY
```

### ❌ Error: ECONNREFUSED

**สาเหตุ:** ไม่สามารถเชื่อมต่อกับ Supabase

**วิธีแก้:**
1. ตรวจสอบ `SUPABASE_URL` ใน `.env` ว่าถูกต้อง
2. ตรวจสอบว่า Supabase Project ยังทำงานอยู่
3. ตรวจสอบ internet connection

### ❌ Error: 404 Not Found (Supabase)

**สาเหตุ:** ตาราง `items` ไม่มีใน database

**วิธีแก้:**
1. เข้า Supabase Dashboard
2. ไปที่ SQL Editor
3. รัน schema สำหรับสร้างตาราง `items`

### ❌ Error: Port 3000 already in use

**วิธีแก้:**
```bash
# หา process ที่ใช้ port 3000
lsof -i :3000

# Kill process นั้น
kill -9 {PID}

# หรือเปลี่ยน port ใน .env
PORT=3001
```

### ❌ CORS Error จาก Frontend

**วิธีแก้:**
1. ตรวจสอบว่า Frontend URL อยู่ใน CORS whitelist ที่ `src/index.ts:15-24`
2. เพิ่ม URL ของ Frontend ถ้าจำเป็น:
```typescript
origin: [
  'http://localhost:8080',
  'http://localhost:5173',  // เพิ่ม port ของคุณ
  // ...
]
```

---

## Checklist การทดสอบ

ใช้ checklist นี้เพื่อให้แน่ใจว่าทดสอบครบถ้วน:

- [ ] ✅ Health check endpoint ทำงาน
- [ ] ✅ สร้างสินค้าใหม่สำเร็จ (POST /item)
- [ ] ✅ ดึงรายการสินค้าได้ (GET /item)
- [ ] ✅ ตรวจสอบ QR Code ที่ถูกต้อง (valid = true)
- [ ] ✅ ตรวจสอบ QR Code ที่ไม่ถูกต้อง (valid = false)
- [ ] ✅ แก้ไขสินค้าสำเร็จ (PUT /item/:id)
- [ ] ✅ ลบสินค้าสำเร็จ (DELETE /item/:id)
- [ ] ✅ Validation ทำงาน (ส่งข้อมูลไม่ครบแล้วได้ error)
- [ ] ✅ Duplicate check ทำงาน (ไม่สามารถสร้าง item_no ซ้ำ)
- [ ] ✅ Not found error ทำงาน (แก้ไข/ลบ item ที่ไม่มีอยู่)
- [ ] ✅ Frontend เชื่อมต่อกับ API ได้
- [ ] ✅ Frontend สแกน QR Code ได้

---

## คำสั่งที่มีประโยชน์

```bash
# เริ่ม development server
npm run dev

# Build project
npm run build

# รัน production server
npm start

# ดู logs แบบ real-time
npm run dev | grep "Error"

# ทดสอบ API ทั้งหมด (ถ้ามี test script)
npm run test:api

# ตรวจสอบ TypeScript errors
npm run build
```

---

## ข้อมูลเพิ่มเติม

- **API Documentation:** `API_DOCUMENTATION.md`
- **QR Validation Guide:** `../receiving-backoffice/QR_VALIDATION_GUIDE.md`
- **Deployment Instructions:** `DEPLOY_INSTRUCTIONS.md`

---

## สรุป

การทดสอบที่สมบูรณ์ควรมี:

1. ✅ Unit Testing - ทดสอบแต่ละ endpoint
2. ✅ Integration Testing - ทดสอบการเชื่อมต่อกับ database
3. ✅ Edge Case Testing - ทดสอบกรณีผิดปกติ
4. ✅ End-to-End Testing - ทดสอบผ่าน Frontend

หากทุกขั้นตอนผ่าน แสดงว่า API พร้อมใช้งาน! 🎉

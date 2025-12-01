# Quick Start Guide - Receiving API

## เริ่มต้นใช้งานเร็วๆ ใน 3 ขั้นตอน

### ขั้นตอนที่ 1: ตั้งค่า Environment Variables

```bash
cd receiving-api

# คัดลอกไฟล์ .env.example
cp .env.example .env

# แก้ไขไฟล์ .env และใส่ข้อมูล Supabase ของคุณ
nano .env  # หรือใช้ text editor ที่ชอบ
```

ต้องกรอกข้อมูลเหล่านี้:
```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**หา Supabase Keys ได้ที่:**
1. ไปที่ https://supabase.com/dashboard
2. เลือก Project ของคุณ
3. ไปที่ Settings > API
4. คัดลอก URL และ anon/public key

### ขั้นตอนที่ 2: เริ่ม Development Server

```bash
npm run dev
```

คุณควรเห็น:
```
🚀 Server is running on port 3000
📍 Health check: http://localhost:3000/health
📦 Item API: http://localhost:3000/item
```

### ขั้นตอนที่ 3: ทดสอบ API

**วิธีที่ 1 - ใช้ Test Script (แนะนำ):**
```bash
# เปิด terminal ใหม่
npm run test:api
```

**วิธีที่ 2 - ทดสอบด้วย cURL:**
```bash
# ทดสอบ Health Check
curl http://localhost:3000/health

# ทดสอบสร้างสินค้า
curl -X POST http://localhost:3000/item \
  -H "Content-Type: application/json" \
  -d '{
    "item_no": "TEST-001",
    "product_name": "สินค้าทดสอบ"
  }'

# ทดสอบตรวจสอบ QR Code
curl -X POST http://localhost:3000/item/verify-qr \
  -H "Content-Type: application/json" \
  -d '{"qr_code": "TEST-001"}'
```

---

## API Endpoints ทั้งหมด

| Method | Endpoint | คำอธิบาย |
|--------|----------|----------|
| GET | `/health` | ตรวจสอบสถานะ API |
| POST | `/item/verify-qr` | ตรวจสอบ QR Code |
| GET | `/item` | ดึงรายการสินค้าทั้งหมด |
| POST | `/item` | สร้างสินค้าใหม่ |
| PUT | `/item/:id` | แก้ไขสินค้า |
| DELETE | `/item/:id` | ลบสินค้า |

---

## ปัญหาที่พบบ่อยและวิธีแก้

### ❌ Error: Missing Supabase environment variables

**แก้ไข:** ตรวจสอบว่ามีไฟล์ `.env` และกรอก `SUPABASE_URL` และ `SUPABASE_ANON_KEY` ให้ครบ

### ❌ Error: Port 3000 already in use

**แก้ไข:**
```bash
# Kill process ที่ใช้ port 3000
lsof -i :3000
kill -9 {PID}

# หรือเปลี่ยน port ใน .env
PORT=3001
```

### ❌ CORS Error

**แก้ไข:** เพิ่ม URL ของ Frontend ใน `src/index.ts` (บรรทัด 15-24)

---

## เอกสารเพิ่มเติม

- **คู่มือทดสอบฉบับเต็ม:** `TESTING_GUIDE.md`
- **API Documentation:** `API_DOCUMENTATION.md`
- **QR Validation Guide:** `../receiving-backoffice/QR_VALIDATION_GUIDE.md`

---

## คำสั่งที่ใช้บ่อย

```bash
npm run dev        # เริ่ม development server
npm run build      # Build TypeScript
npm start          # รัน production server
npm run test:api   # ทดสอบ API ทั้งหมด
```

---

## ต้องการความช่วยเหลือ?

1. ดูที่ `TESTING_GUIDE.md` สำหรับคู่มือทดสอบละเอียด
2. ดูที่ `API_DOCUMENTATION.md` สำหรับ API reference ครบถ้วน
3. ตรวจสอบ logs ใน terminal ที่รัน `npm run dev`

**พร้อมใช้งานแล้ว! 🎉**

# Deploy Backend API to Render

## ขั้นตอนการ Deploy

### 1. สร้าง Git Repository ใหม่สำหรับ API

```bash
cd receiving-api
git init
git add .
git commit -m "Initial commit: Receiving API"
```

### 2. สร้าง GitHub Repository
- ไปที่ https://github.com/new
- ตั้งชื่อ repository: `receiving-api`
- กด "Create repository"

### 3. Push Code ขึ้น GitHub

```bash
git remote add origin https://github.com/YOUR_USERNAME/receiving-api.git
git branch -M main
git push -u origin main
```

### 4. Deploy บน Render

1. ไปที่ https://dashboard.render.com
2. คลิก "New +" → "Web Service"
3. เชื่อมต่อ GitHub repository: `receiving-api`
4. ตั้งค่าดังนี้:
   - **Name**: `receiving-api`
   - **Region**: `Singapore`
   - **Branch**: `main`
   - **Root Directory**: (ว่างไว้)
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`

5. เพิ่ม Environment Variables:
   ```
   NODE_ENV=production
   PORT=3000
   SUPABASE_URL=<your-supabase-url>
   SUPABASE_ANON_KEY=<your-supabase-anon-key>
   SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-key>
   ```

6. คลิก "Create Web Service"

### 5. รอ Deploy เสร็จ

- Render จะ build และ deploy automatically
- เมื่อเสร็จจะได้ URL เช่น: `https://receiving-api-xxxx.onrender.com`

### 6. ทดสอบ API

เปิด browser ไปที่:
```
https://receiving-api-xxxx.onrender.com/health
```

ควรเห็น response:
```json
{
  "success": true,
  "message": "API is running",
  "timestamp": "2025-11-23T..."
}
```

### 7. อัพเดท Frontend

กลับมาที่ Frontend project และเพิ่ม environment variable:

**บน Render Dashboard (Frontend):**
- ไปที่ Environment variables
- เพิ่ม: `VITE_API_BASE_URL=https://receiving-api-xxxx.onrender.com`
- คลิก "Save Changes"
- Render จะ redeploy อัตโนมัติ

---

## หมายเหตุ

- Render Free tier จะ sleep หาก inactive 15 นาที
- Request แรกอาจช้า (cold start ~30 วินาที)
- สำหรับ production ควรใช้ paid plan เพื่อ uptime 24/7

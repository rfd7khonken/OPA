# NOVA AI Avatar Live

AI Avatar 3D บน GitHub Pages ใช้ Bootstrap, Three.js, VRM และ Google Apps Script

## โครงสร้างโปรเจกต์

```text
├─ index.html
├─ style.css
├─ app.js
├─ app3d.js
└─ avatar/
   └─ character.vrm
```

## ตั้งค่า

1. อัปโหลดไฟล์ VRM ไปที่ `avatar/character.vrm`
2. Deploy Google Apps Script เป็น Web App
3. วาง URL ที่ลงท้ายด้วย `/exec` ในตัวแปร `WEB_APP_URL` ใน `app.js`
4. Push โค้ดขึ้น GitHub
5. เปิด GitHub Pages จาก Settings → Pages

## ความปลอดภัย

- ห้ามใส่ OpenAI API Key ลงใน GitHub
- เก็บ API Key ใน Google Apps Script Script Properties เท่านั้น
- ไม่ควรส่งข้อมูลส่วนตัวหรือข้อมูลลับผ่านหน้าแชต

# Hướng dẫn tích hợp STOMP WebSocket vào ReportCreate

## 📋 Tổng quan

File HTML demo (`test_stomp_raw.html`) cho thấy backend sử dụng **STOMP protocol** qua WebSocket để:
1. Kết nối với user-id
2. Gửi location updates
3. Gửi reports với format JSON cụ thể

## 🔍 Phân tích file HTML demo

### 1. **Kết nối WebSocket**
```javascript
ws = new WebSocket("wss://stormwatchbackend-production.up.railway.app/ws");
```

### 2. **STOMP CONNECT Frame**
```javascript
let frame = 
  "CONNECT\n" +
  "accept-version:1.2\n" +
  `user-id:${myUserID}\n\n` +
  "\x00";
ws.send(frame);
```

**Giải thích:**
- `CONNECT` - Command để kết nối
- `accept-version:1.2` - Phiên bản STOMP protocol
- `user-id:xxx` - ID của user (lấy từ JWT token)
- `\n\n` - Kết thúc headers, bắt đầu body (rỗng)
- `\x00` - NULL byte để kết thúc frame

### 3. **Gửi Report qua STOMP**
```javascript
let report = {
  type: "FLOOD",           // Category (uppercase)
  detail: "Mưa lớn",       // Sub-category
  description: "...",      // Mô tả chi tiết
  image: "base64...",      // Base64 encoded image
  lat: 16.4637,            // Latitude
  lon: 107.5909,           // Longitude
  timestamp: Date.now()    // Timestamp
};

let frame =
  "SEND\n" +
  "type:report\n" +
  "content-type:application/json\n\n" +
  JSON.stringify(report) +
  "\x00";
ws.send(frame);
```

**Giải thích:**
- `SEND` - Command để gửi message
- `type:report` - Loại message (report, location, etc.)
- `content-type:application/json` - Format của body
- Body là JSON string của report object
- `\x00` - NULL byte kết thúc frame

## 🔄 Mapping từ Form sang STOMP Format

### Form Data → STOMP Report

| Form Field | STOMP Field | Mapping Logic |
|------------|-------------|---------------|
| `category` | `type` | Convert category ID → uppercase (e.g., "weather-nature" → "WEATHER_NATURE") |
| `subCategory` | `detail` | Lấy trực tiếp (e.g., "Mưa lớn") |
| `description` | `description` | Lấy trực tiếp |
| `images[0]` | `image` | Convert File → Base64 |
| `location.lat` | `lat` | Lấy trực tiếp |
| `location.lng` | `lon` | Lấy trực tiếp |
| - | `timestamp` | `Date.now()` |

## 📝 Các bước tích hợp

### Bước 1: Tạo STOMP Service
✅ Đã tạo `src/services/stompService.js`

### Bước 2: Kết nối STOMP khi user đăng nhập
- Khi user login thành công, lấy `userId` từ JWT token
- Gọi `connectSTOMP(userId)` để kết nối

### Bước 3: Convert Image sang Base64
```javascript
function convertImageToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      // Remove "data:image/...;base64," prefix
      const base64 = e.target.result.split(",")[1];
      // Normalize Base64 (remove NULL bytes)
      const normalized = btoa(atob(base64));
      resolve(normalized);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
```

### Bước 4: Map Category ID → Type
```javascript
const CATEGORY_TYPE_MAP = {
  'weather-nature': 'WEATHER_NATURE',
  'infrastructure-traffic': 'INFRASTRUCTURE_TRAFFIC',
  'logistics-survival': 'LOGISTICS_SURVIVAL',
  'safety-health': 'SAFETY_HEALTH'
};
```

### Bước 5: Gửi Report qua STOMP
Thay vì gọi `createReport()` (HTTP API), gọi `sendReport()` (STOMP)

## ⚠️ Lưu ý quan trọng

1. **User ID**: Phải lấy từ JWT token (đã decode), không phải từ localStorage
2. **Base64 Image**: Phải normalize để loại bỏ NULL bytes
3. **Connection**: Phải đảm bảo WebSocket đã connected trước khi gửi
4. **Error Handling**: Xử lý lỗi kết nối và retry logic
5. **Format**: Tất cả keys trong JSON phải lowercase (type, detail, description, image, lat, lon, timestamp)

## 🎯 Flow hoàn chỉnh

```
User fills form
    ↓
Click "Tạo báo cáo"
    ↓
Validate form data
    ↓
Convert images to Base64
    ↓
Map category → type
    ↓
Check STOMP connection
    ↓ (if not connected)
Connect STOMP with userId
    ↓
Send report via STOMP
    ↓
Show success message
    ↓
Navigate to report detail
```

## 🔧 Cần cập nhật

1. ✅ `src/services/stompService.js` - Service để quản lý STOMP connection
2. ⏳ `src/pages/ReportCreate.jsx` - Tích hợp STOMP vào form submit
3. ⏳ `src/services/authService.js` - Lấy userId từ JWT token
4. ⏳ Auto-connect STOMP khi user login


# Hướng dẫn cấu hình Google Maps Platform API Key cho Web

## Vấn đề: API key hoạt động trên mobile nhưng không hoạt động trên web

Đây là vấn đề phổ biến khi cấu hình API key cho Google Maps Platform. Nguyên nhân chính là do **Application Restrictions** trong Google Cloud Console.

## Các bước khắc phục:

### 1. Kiểm tra Application Restrictions

1. Vào [Google Cloud Console](https://console.cloud.google.com/)
2. Chọn project của bạn
3. Vào **APIs & Services** > **Credentials**
4. Click vào API key bạn đang sử dụng
5. Tìm phần **Application restrictions**

**Vấn đề:** Nếu bạn đã set Application restrictions là:

- ✅ **Android apps** - Key chỉ hoạt động cho Android
- ✅ **iOS apps** - Key chỉ hoạt động cho iOS
- ❌ **Websites** - Key chỉ hoạt động cho web (chưa được cấu hình)

**Giải pháp:**

#### Cách 1: Thêm Websites vào Application restrictions (Khuyến nghị)

1. Trong phần **Application restrictions**, chọn **HTTP referrers (web sites)**
2. Thêm các website của bạn:
   ```
   http://localhost:*
   http://localhost:5173/*
   https://yourdomain.com/*
   https://*.yourdomain.com/*
   ```
3. Lưu ý: Với Vite dev server, thêm `http://localhost:*` để cho phép mọi port
4. Click **Save**

#### Cách 2: Tạo API key riêng cho Web (Khuyến nghị cho production)

1. Tạo API key mới trong **Credentials**
2. Đặt tên: "Maps Platform API Key - Web"
3. Set **Application restrictions** = **HTTP referrers (web sites)**
4. Thêm domain của bạn
5. Sử dụng key này cho biến môi trường `VITE_WEATHER_API_KEY`

### 2. Kiểm tra API Restrictions

1. Trong trang cấu hình API key, tìm phần **API restrictions**
2. Chọn **Restrict key**
3. Đảm bảo các API sau được enable:
   - ✅ **Maps JavaScript API** (cho bản đồ)
   - ✅ **Places API** (cho tìm kiếm địa điểm)
   - ✅ **Maps Platform Weather API** (cho thời tiết) ⚠️ **QUAN TRỌNG**

### 3. Enable Weather API

1. Vào **APIs & Services** > **Library**
2. Tìm "Maps Platform Weather API"
3. Click **Enable** nếu chưa được enable

### 4. Cấu hình biến môi trường

Tạo file `.env` trong thư mục gốc của project:

```env
VITE_WEATHER_API_KEY=your_api_key_here
VITE_GOOGLE_MAPS_API_KEY=your_api_key_here
```

**Lưu ý:**

- Với Vite, biến môi trường phải bắt đầu bằng `VITE_` để được expose ra client
- Restart dev server sau khi thay đổi `.env`

### 5. Kiểm tra CORS (Nếu vẫn lỗi)

Google Weather API có thể có vấn đề CORS khi gọi trực tiếp từ browser. Nếu gặp lỗi CORS:

**Giải pháp:** Sử dụng backend proxy

1. Tạo endpoint proxy trong backend của bạn:

   ```javascript
   // Backend endpoint
   app.get("/api/weather", async (req, res) => {
     const { lat, lng } = req.query;
     const response = await fetch(
       `https://weather.googleapis.com/v1/currentConditions:lookup?key=${API_KEY}&location.latitude=${lat}&location.longitude=${lng}&unitsSystem=METRIC`
     );
     const data = await response.json();
     res.json(data);
   });
   ```

2. Sửa `weatherService.js` để gọi qua proxy thay vì gọi trực tiếp

## Kiểm tra lỗi

Sau khi cấu hình, mở browser console (F12) và kiểm tra:

1. **Lỗi 401/403:** API key không hợp lệ hoặc chưa được cấu hình đúng
2. **Lỗi CORS:** Cần sử dụng backend proxy
3. **Lỗi "API not enabled":** Cần enable Weather API trong Google Cloud Console

## Checklist

- [ ] Application restrictions đã được set là "HTTP referrers (web sites)"
- [ ] Domain/localhost đã được thêm vào whitelist
- [ ] Maps Platform Weather API đã được enable
- [ ] API restrictions đã cho phép Weather API
- [ ] Biến môi trường `VITE_WEATHER_API_KEY` đã được cấu hình
- [ ] Dev server đã được restart sau khi thay đổi `.env`

## Tham khảo

- [Google Maps Platform Documentation](https://developers.google.com/maps/documentation)
- [Weather API Documentation](https://developers.google.com/maps/documentation/weather)
- [API Key Best Practices](https://developers.google.com/maps/api-security-best-practices)

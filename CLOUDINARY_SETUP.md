# Hướng dẫn cấu hình Cloudinary

## 📋 Các biến môi trường cần thiết

Thêm vào file `.env` ở thư mục gốc:

```env
# Cloudinary Configuration
VITE_CLOUDINARY_CLOUD_NAME=ds6hhxliv
VITE_CLOUDINARY_UPLOAD_PRESET=stormwatch
```

## 🔍 Giải thích các biến

### 1. `VITE_CLOUDINARY_CLOUD_NAME`
- **Giá trị**: `ds6hhxliv` (từ Cloudinary dashboard của bạn)
- **Mục đích**: Cloud name để xác định account Cloudinary của bạn
- **Bắt buộc**: ✅ Có

### 2. `VITE_CLOUDINARY_UPLOAD_PRESET`
- **Giá trị**: `stormwatch` (upload preset bạn đã tạo, mode: Unsigned)
- **Mục đích**: Preset để upload ảnh không cần signature
- **Bắt buộc**: ✅ Có
- **Lưu ý**: Preset phải ở chế độ **Unsigned** để upload từ frontend

## ❌ Không cần (vì dùng unsigned preset)

- `VITE_CLOUDINARY_API_SECRET` - **KHÔNG CẦN** ở frontend
- API Secret chỉ cần nếu dùng **Signed Upload** (nên làm ở backend)

## 📝 File .env hoàn chỉnh

```env
# API Base URL
VITE_API_BASE_URL=https://stormwatchbackend-production.up.railway.app
VITE_USE_MOCK_API=false

# Google Maps API
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Cloudinary Configuration
VITE_CLOUDINARY_CLOUD_NAME=ds6hhxliv
VITE_CLOUDINARY_UPLOAD_PRESET=stormwatch
```

## ✅ Kiểm tra cấu hình

1. Đảm bảo Upload Preset `stormwatch` có chế độ **Unsigned**
2. Cloud name đúng là `ds6hhxliv`
3. Restart dev server sau khi thêm biến env mới

## 🔧 Nếu upload bị lỗi

1. Kiểm tra Cloud name có đúng không
2. Kiểm tra Upload preset name có đúng không
3. Kiểm tra preset có ở chế độ **Unsigned** không
4. Xem console log để biết lỗi chi tiết


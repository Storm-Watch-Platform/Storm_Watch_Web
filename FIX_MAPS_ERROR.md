# Hướng dẫn sửa lỗi Google Maps API

## ⚠️ Watermark "For development purposes only"

Nếu bạn thấy watermark "For development purposes only" trên bản đồ, điều này có nghĩa là:

- ✅ Bản đồ vẫn hoạt động nhưng có watermark
- ❌ Billing chưa được enable hoặc chưa được link với project
- ❌ Payment method chưa được thêm/verify

### Cách xóa watermark:

1. **Enable Billing và link với project:**
   - Vào [Google Cloud Console](https://console.cloud.google.com/)
   - Chọn project của bạn
   - Vào **Billing** (hoặc search "Billing" trong search bar)
   - Click **Link a billing account**
   - Nếu chưa có billing account, click **Create billing account**
   - Thêm payment method (thẻ tín dụng/ghi nợ)
   - **Lưu ý:** Google cung cấp $200 credit miễn phí mỗi tháng cho Maps Platform

2. **Verify billing account:**
   - Đảm bảo billing account có status là "Active"
   - Kiểm tra payment method đã được verify chưa
   - Đợi 5-10 phút sau khi enable billing

3. **Kiểm tra project đã link với billing:**
   - Vào **Billing** → **My projects**
   - Đảm bảo project của bạn có billing account được link

Sau khi enable billing đúng cách, watermark sẽ biến mất sau vài phút.

---

## Lỗi phổ biến: `BillingNotEnabledMapError`

### Nguyên nhân:
Google Maps Platform yêu cầu **Billing phải được enable** để sử dụng API (kể cả trong development).

### Cách khắc phục:

#### 1. Enable Billing trong Google Cloud Console

1. Vào [Google Cloud Console](https://console.cloud.google.com/)
2. Chọn project của bạn
3. Vào **Billing** (hoặc tìm "Billing" trong menu)
4. Click **Link a billing account** hoặc **Enable billing**
5. Thêm payment method (thẻ tín dụng/ghi nợ)
6. **Lưu ý:** Google cung cấp $200 credit miễn phí mỗi tháng cho Maps Platform

#### 2. Kiểm tra Application Restrictions

1. Vào **APIs & Services** → **Credentials**
2. Click vào API key của bạn
3. Trong phần **Application restrictions**:
   - Chọn **HTTP referrers (web sites)**
   - Thêm các domain:
     ```
     http://localhost:*
     http://localhost:5173/*
     https://yourdomain.com/*
     ```
4. Click **Save**

#### 3. Kiểm tra API Restrictions

1. Trong cùng trang cấu hình API key
2. Phần **API restrictions**:
   - Chọn **Restrict key**
   - Đảm bảo các API sau được chọn:
     - ✅ **Maps JavaScript API**
     - ✅ **Places API**
3. Click **Save**

#### 4. Enable các API cần thiết

1. Vào **APIs & Services** → **Library**
2. Tìm và enable các API sau:
   - **Maps JavaScript API**
   - **Places API**
   - **Maps Platform Weather API** (nếu dùng weather)

#### 5. Cấu hình biến môi trường

Tạo file `.env` trong thư mục gốc:

```env
VITE_GOOGLE_MAPS_API_KEY=your_api_key_here
```

**Lưu ý:** Restart dev server sau khi thay đổi `.env`

#### 6. Đợi cấu hình có hiệu lực

Sau khi thay đổi cấu hình, đợi **5-10 phút** để Google cập nhật.

## Kiểm tra lỗi

Mở browser console (F12) và kiểm tra:

- ✅ **Không có lỗi** → Bản đồ sẽ hiển thị
- ❌ **BillingNotEnabledMapError** → Cần enable billing
- ❌ **403 Forbidden** → Kiểm tra Application restrictions
- ❌ **API key không hợp lệ** → Kiểm tra lại API key trong `.env`

## Checklist nhanh

- [ ] Billing đã được enable trong Google Cloud Console
- [ ] Payment method đã được thêm
- [ ] Application restrictions = "HTTP referrers (web sites)"
- [ ] Domain `http://localhost:*` đã được thêm
- [ ] Maps JavaScript API đã được enable
- [ ] Places API đã được enable
- [ ] API key đã được thêm vào `.env` với tên `VITE_GOOGLE_MAPS_API_KEY`
- [ ] Dev server đã được restart
- [ ] Đã đợi 5-10 phút sau khi thay đổi cấu hình

## Tham khảo

- [Google Maps Platform Pricing](https://mapsplatform.google.com/pricing/)
- [Enable Billing](https://cloud.google.com/billing/docs/how-to/modify-project)
- [API Key Best Practices](https://developers.google.com/maps/api-security-best-practices)


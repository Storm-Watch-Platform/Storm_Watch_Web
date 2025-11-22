# SOS API Debug Log Explanation

## Vấn đề phát hiện

Khi gọi API `/nearby/sos`, có lỗi `TypeError: sosList.map is not a function` xảy ra, dẫn đến kết quả là 0 SOS signals được hiển thị mặc dù backend có thể có SOS trong khu vực.

## Phân tích các log

### 1. **API Call Success (200 OK)**

```
📡 [API] SOS Response status: 200
```

- ✅ API call thành công
- Backend đã nhận và xử lý request

### 2. **Raw Response Data**

```
✅ [API] SOS Raw response data: Object
📊 [API] SOS count: 0
```

- Backend trả về một Object, không phải Array
- Count = 0 có thể do:
  - Backend không tìm thấy SOS trong bán kính 5km
  - Backend trả về format khác (ví dụ: `{ alerts: [] }`, `{ data: [] }`, v.v.)
  - Backend trả về structure không mong đợi

### 3. **Error: sosList.map is not a function**

```
❌ [API] Error fetching nearby SOS: TypeError: sosList.map is not a function
```

**Nguyên nhân:**

- Code đang check: `const sosList = data.sos || data || []`
- Nếu `data` là object rỗng `{}` hoặc object có property khác (không phải `sos`), thì `sosList` sẽ là object, không phải array
- Khi gọi `.map()` trên object → Lỗi

**Ví dụ:**

- Backend trả về: `{}` → `sosList = {}` (object, không phải array)
- Backend trả về: `{ alerts: [...] }` → `sosList = { alerts: [...] }` (object)
- Backend trả về: `{ message: "No SOS found" }` → `sosList = { message: "..." }` (object)

### 4. **Fallback to Empty Array**

```
⚠️ [API] Falling back to empty array for SOS
✅ [Home] Nearby SOS fetched: 0 signals
```

- Code catch error và return `[]`
- UI hiển thị "Không có tín hiệu SOS nào trong khu vực"

## Giải pháp đã áp dụng

### 1. **Improved Response Handling**

```javascript
// Kiểm tra nhiều trường hợp response format
let sosList = null;

if (Array.isArray(data)) {
  // Backend returns array directly
  sosList = data;
} else if (data && typeof data === "object") {
  // Backend returns object with property
  sosList = data.sos || data.alerts || data.data || data.signals || [];
} else {
  sosList = [];
}

// Đảm bảo sosList luôn là array
if (!Array.isArray(sosList)) {
  console.warn("⚠️ [API] sosList is not an array:", typeof sosList, sosList);
  sosList = [];
}
```

### 2. **Enhanced Logging**

- Log response type
- Log response structure (keys)
- Log final sosList type và length
- Giúp debug dễ dàng hơn

### 3. **Multiple Property Checks**

- Check `data.sos`
- Check `data.alerts` (có thể backend dùng tên này)
- Check `data.data` (common structure)
- Check `data.signals` (alternative name)
- Fallback to `[]` nếu không tìm thấy

## Các trường hợp response có thể xảy ra

### Case 1: Array trực tiếp

```json
[
  { "id": "...", "location": {...}, ... },
  { "id": "...", "location": {...}, ... }
]
```

→ Code sẽ dùng trực tiếp array

### Case 2: Object với property `sos`

```json
{
  "sos": [
    { "id": "...", "location": {...}, ... }
  ]
}
```

→ Code sẽ extract `data.sos`

### Case 3: Object với property `alerts`

```json
{
  "alerts": [
    { "id": "...", "location": {...}, ... }
  ]
}
```

→ Code sẽ extract `data.alerts`

### Case 4: Empty object

```json
{}
```

→ Code sẽ return `[]`

### Case 5: Object với message

```json
{
  "message": "No SOS found in area",
  "sos": []
}
```

→ Code sẽ extract `data.sos` (mảng rỗng)

## Debug Checklist

Khi gặp vấn đề tương tự, kiểm tra:

1. ✅ Response status có phải 200?
2. ✅ Response body là gì? (Xem log "Raw response data")
3. ✅ Response có phải array không? (Check `Array.isArray(data)`)
4. ✅ Response có property nào? (Check `Object.keys(data)`)
5. ✅ Property nào chứa array SOS? (`sos`, `alerts`, `data`, `signals`?)
6. ✅ `sosList` có phải array trước khi gọi `.map()`?

## Ví dụ Debug Process

```javascript
// Step 1: Check response
console.log("Response:", data);
// Output: { sos: [], message: "No alerts" }

// Step 2: Check type
console.log("Is Array?", Array.isArray(data));
// Output: false

// Step 3: Check properties
console.log("Keys:", Object.keys(data));
// Output: ["sos", "message"]

// Step 4: Extract array
const sosList = data.sos; // []

// Step 5: Verify array
console.log("Is sosList array?", Array.isArray(sosList));
// Output: true

// Step 6: Safe to map
return sosList.map(...); // ✅ Works
```

## Lưu ý

- **Backend có thể trả về format khác nhau** tùy version
- **Luôn kiểm tra** response structure trước khi process
- **Defensive coding**: Always ensure array before `.map()`
- **Logging** giúp debug nhanh hơn

## Next Steps

1. Test với response thực từ backend
2. Xem console log để biết exact structure
3. Update code nếu backend dùng property name khác
4. Add validation cho location data (lat/lng)

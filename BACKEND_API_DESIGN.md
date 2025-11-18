# Backend API Design cho Storm Watch Web

## Tổng quan
Dự án Storm Watch Web hiện tại sử dụng dữ liệu mock. Để triển khai production, backend cần cung cấp các API sau:

## 1. APIs chính

### 1.1 Quản lý Báo cáo (Reports)

#### GET /api/reports
- **Mô tả**: Lấy danh sách tất cả báo cáo
- **Parameters**:
  - `severity` (optional): filter theo mức độ nghiêm trọng (low, medium, high)
  - `region` (optional): filter theo khu vực
  - `limit` (optional): số lượng báo cáo giới hạn
  - `offset` (optional): phân trang
  - `sort` (optional): sắp xếp (timestamp, severity)
- **Response**:
```json
{
  "data": [
    {
      "id": 1,
      "userId": "user_123",
      "userName": "Nguyễn Văn A",
      "location": { "lat": 10.7971, "lng": 106.6818 },
      "address": "Đường Phan Xích Long, Phú Nhuận",
      "severity": "high",
      "description": "Nước ngập sâu 80cm, không thể di chuyển. Cần hỗ trợ khẩn cấp!",
      "images": ["https://example.com/image1.jpg"],
      "timestamp": "2025-11-11T10:25:00Z",
      "visibility": "public",
      "observers": 15,
      "weather": {
        "temperature": 28,
        "humidity": 85,
        "windSpeed": 15,
        "rainfall": 45
      }
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 20,
    "offset": 0,
    "hasNext": true
  }
}
```

#### POST /api/reports
- **Mô tả**: Tạo báo cáo mới
- **Request Body**:
```json
{
  "userId": "user_123",
  "location": { "lat": 10.7971, "lng": 106.6818 },
  "address": "Đường Phan Xích Long, Phú Nhuận",
  "severity": "high",
  "description": "Nước ngập sâu 80cm, không thể di chuyển. Cần hỗ trợ khẩn cấp!",
  "images": ["data:image/jpeg;base64,...", "data:image/jpeg;base64,..."],
  "visibility": "public"
}          
```

#### PUT /api/reports/:id
- **Mô tả**: Cập nhật báo cáo
- **Auth**: Chỉ owner hoặc admin

#### DELETE /api/reports/:id
- **Mô tả**: Xóa báo cáo
- **Auth**: Chỉ owner hoặc admin

#### POST /api/reports/:id/observe
- **Mô tả**: Đánh dấu đã quan sát báo cáo
- **Response**: Cập nhật số observers

### 1.2 Khu vực nguy hiểm (Danger Zones)

#### GET /api/danger-zones
- **Mô tả**: Lấy danh sách khu vực nguy hiểm
- **Response**:
```json
{
  "data": [
    {
      "id": 1,
      "name": "Khu vực Phú Nhuận",
      "coordinates": [
        { "lat": 10.7971, "lng": 106.6768 },
        { "lat": 10.7971, "lng": 106.6868 },
        { "lat": 10.7871, "lng": 106.6868 },
        { "lat": 10.7871, "lng": 106.6768 }
      ],
      "riskLevel": "high",
      "score": 8.5,
      "reportCount": 23,
      "lastUpdated": "2025-11-11T10:30:00Z",
      "status": "active",
      "factors": {
        "elevation": 1.2,
        "drainage": "poor",
        "floodHistory": 5
      }
    }
  ]
}
```

#### POST /api/danger-zones/recalculate
- **Mô tả**: Tính toán lại risk score cho các khu vực
- **Auth**: Admin only
- **Background job**: Tự động chạy mỗi 30 phút

### 1.3 Cảnh báo (Alerts)

#### GET /api/alerts
- **Mô tả**: Lấy danh sách cảnh báo
- **Parameters**:
  - `type`: flood, emergency, weather
  - `active`: chỉ cảnh báo đang hoạt động
- **Response**:
```json
{
  "data": [
    {
      "id": 1,
      "userId": "user_567",
      "userName": "Hoàng Văn E",
      "location": { "lat": 10.7991, "lng": 106.6798 },
      "alertType": "flood",
      "timestamp": "2025-11-11T11:20:00Z",
      "visibility": "public",
      "status": "active",
      "acknowledged": false,
      "severity": "high"
    }
  ]
}
```

#### POST /api/alerts
- **Mô tả**: Tạo cảnh báo mới
- **Auto-generation**: Hệ thống tự động tạo cảnh báo dựa trên reports

### 1.4 Khu vực địa lý (Regions)

#### GET /api/regions
- **Mô tả**: Lấy danh sách khu vực địa lý
- **Response**:
```json
{
  "data": [
    {
      "id": "phu-nhuan",
      "name": "Phú Nhuận",
      "bounds": {
        "north": 10.8100,
        "south": 10.7900,
        "east": 106.6900,
        "west": 106.6700
      },
      "center": { "lat": 10.8000, "lng": 106.6800 },
      "zoom": 14,
      "active": true
    }
  ]
}
```

## 2. APIs hỗ trợ

### 2.1 Thống kê (Statistics)

#### GET /api/statistics/overview
- **Mô tả**: Thống kê tổng quan
- **Response**:
```json
{
  "totalReports": 150,
  "activeAlerts": 3,
  "dangerZones": 12,
  "severityBreakdown": {
    "high": 25,
    "medium": 45,
    "low": 80
  },
  "recentActivity": {
    "lastHour": 5,
    "last24Hours": 23,
    "lastWeek": 89
  }
}
```

#### GET /api/statistics/region/:regionId
- **Mô tả**: Thống kê theo khu vực

### 2.2 Dữ liệu thời tiết (Weather)

#### GET /api/weather/current
- **Mô tả**: Dữ liệu thời tiết hiện tại
- **Parameters**: `lat`, `lng` hoặc `region`
- **Response**:
```json
{
  "temperature": 28,
  "humidity": 85,
  "windSpeed": 15,
  "windDirection": "SE",
  "rainfall": 45,
  "visibility": 8000,
  "pressure": 1013.25,
  "uvIndex": 7,
  "timestamp": "2025-11-11T11:30:00Z"
}
```

#### GET /api/weather/forecast
- **Dự báo thời tiết 7 ngày**

### 2.3 Quản lý người dùng (Users)

#### POST /api/auth/login
#### POST /api/auth/register
#### GET /api/users/profile
#### PUT /api/users/profile

### 2.4 Upload hình ảnh

#### POST /api/upload/image
- **Mô tả**: Upload hình ảnh cho báo cáo
- **Content-Type**: multipart/form-data
- **Response**:
```json
{
  "url": "https://storage.example.com/images/report-123.jpg",
  "thumbnail": "https://storage.example.com/images/report-123-thumb.jpg"
}
```

## 3. WebSocket APIs (Real-time)

### 3.1 Kết nối WebSocket
- **Endpoint**: `/ws`
- **Events**:
  - `new_report`: Báo cáo mới
  - `report_updated`: Báo cáo được cập nhật
  - `new_alert`: Cảnh báo mới
  - `zone_updated`: Khu vực nguy hiểm thay đổi
  - `weather_update`: Cập nhật thời tiết

## 4. Database Schema

### 4.1 Tables chính

#### reports
```sql
CREATE TABLE reports (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  location_lat DECIMAL(10, 8) NOT NULL,
  location_lng DECIMAL(11, 8) NOT NULL,
  address TEXT NOT NULL,
  severity ENUM('low', 'medium', 'high') NOT NULL,
  description TEXT NOT NULL,
  images JSONB,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  visibility ENUM('public', 'private') DEFAULT 'public',
  observers INTEGER DEFAULT 0,
  status ENUM('active', 'resolved', 'archived') DEFAULT 'active',
  region_id VARCHAR(100)
);
```

#### danger_zones
```sql
CREATE TABLE danger_zones (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  coordinates JSONB NOT NULL,
  risk_level ENUM('low', 'medium', 'high') NOT NULL,
  score DECIMAL(3, 1) NOT NULL,
  report_count INTEGER DEFAULT 0,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status ENUM('active', 'inactive') DEFAULT 'active',
  factors JSONB
);
```

#### alerts
```sql
CREATE TABLE alerts (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255),
  user_name VARCHAR(255),
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  alert_type ENUM('flood', 'emergency', 'weather') NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  visibility ENUM('public', 'private') DEFAULT 'public',
  status ENUM('active', 'resolved', 'expired') DEFAULT 'active',
  acknowledged BOOLEAN DEFAULT FALSE,
  severity ENUM('low', 'medium', 'high') DEFAULT 'medium'
);
```

## 5. Performance & Caching

### 5.1 Redis Cache
- Cache reports theo region và severity
- Cache danger zones
- Cache thống kê tổng quan
- Cache dữ liệu thời tiết

### 5.2 Database Indexes
```sql
-- Reports indexes
CREATE INDEX idx_reports_location ON reports USING GIST (ST_Point(location_lng, location_lat));
CREATE INDEX idx_reports_timestamp ON reports(timestamp);
CREATE INDEX idx_reports_severity ON reports(severity);
CREATE INDEX idx_reports_region ON reports(region_id);

-- Danger zones indexes
CREATE INDEX idx_danger_zones_risk ON danger_zones(risk_level);
CREATE INDEX idx_danger_zones_score ON danger_zones(score);
```

## 6. Authentication & Authorization

### 6.1 JWT Token
- Access token: 15 phút
- Refresh token: 7 ngày
- Roles: user, moderator, admin

### 6.2 Rate Limiting
- POST /api/reports: 10 requests/minute/user
- GET requests: 100 requests/minute/IP
- Upload: 5 requests/minute/user

## 7. Error Handling

### 7.1 Standard Error Response
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dữ liệu đầu vào không hợp lệ",
    "details": {
      "severity": "Trường severity là bắt buộc"
    }
  }
}
```

### 7.2 Error Codes
- `VALIDATION_ERROR`: Lỗi validation
- `UNAUTHORIZED`: Chưa đăng nhập
- `FORBIDDEN`: Không có quyền
- `NOT_FOUND`: Không tìm thấy
- `RATE_LIMIT_EXCEEDED`: Vượt quá giới hạn request
- `INTERNAL_ERROR`: Lỗi server

## 8. Monitoring & Analytics

### 8.1 Metrics cần theo dõi
- Số lượng reports theo thời gian
- Tỷ lệ các mức độ nghiêm trọng
- Khu vực có nhiều báo cáo nhất
- Thời gian phản hồi API
- Số lượng người dùng active

### 8.2 Alerts cho admin
- Số lượng reports bất thường
- Hệ thống chậm
- Lỗi server
- Tấn công DDOS

## 9. Deployment Considerations

### 9.1 Infrastructure
- Load Balancer cho API
- CDN cho static files và images
- Redis cluster cho caching
- PostgreSQL với replication
- Docker containers

### 9.2 Environment Variables
```
DATABASE_URL=postgresql://user:pass@localhost:5432/stormwatch
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
GOOGLE_MAPS_API_KEY=your-google-maps-key
WEATHER_API_KEY=your-weather-api-key
UPLOAD_BUCKET=stormwatch-uploads
```

Danh sách API này đảm bảo frontend có thể hoạt động đầy đủ tính năng và mở rộng trong tương lai.
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, MapPin, Loader, AlertCircle, X, Camera } from 'lucide-react';
import { createReport, analyzeImage } from '../services/reportService';
import { getCurrentUser } from '../services/authService';
import Header from '../components/Layout/Header';

const REPORT_CATEGORIES = [
  { id: 'flood', label: 'Lũ lụt', icon: '🌊' },
  { id: 'wind', label: 'Gió bão', icon: '💨' },
  { id: 'landslide', label: 'Sạt lở', icon: '⛰️' },
  { id: 'other', label: 'Khác', icon: '⚠️' },
];

const SEVERITY_LEVELS = [
  { id: 'low', label: 'Thấp', color: 'yellow' },
  { id: 'medium', label: 'Trung bình', color: 'orange' },
  { id: 'high', label: 'Cao', color: 'red' },
];

export default function ReportCreate() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    category: '',
    severity: 'medium',
    description: '',
    location: null,
    address: '',
  });
  const [images, setImages] = useState([]);
  const [imageAnalysis, setImageAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const user = getCurrentUser();

  const handleCategorySelect = (categoryId) => {
    setFormData({ ...formData, category: categoryId });
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const newImages = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      id: Date.now() + Math.random(),
    }));

    setImages([...images, ...newImages]);

    // Analyze first image
    if (files[0] && !imageAnalysis) {
      setAnalyzing(true);
      try {
        const analysis = await analyzeImage(files[0]);
        setImageAnalysis(analysis);
        if (analysis.suggested_category && !formData.category) {
          setFormData({ ...formData, category: analysis.suggested_category });
        }
      } catch (err) {
        console.error('Image analysis error:', err);
      } finally {
        setAnalyzing(false);
      }
    }
  };

  const handleRemoveImage = (imageId) => {
    setImages(images.filter((img) => img.id !== imageId));
    if (images.length === 1) {
      setImageAnalysis(null);
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setError('Trình duyệt không hỗ trợ xác định vị trí.');
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const location = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setFormData({ ...formData, location, address: 'Đang xác định địa chỉ...' });
        setLoading(false);

        // Reverse geocode (simplified - in real app use Google Geocoding API)
        setFormData((prev) => ({
          ...prev,
          address: `Vị trí: ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`,
        }));
      },
      (err) => {
        setError('Không thể lấy vị trí. Vui lòng thử lại.');
        setLoading(false);
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.category) {
      setError('Vui lòng chọn loại báo cáo.');
      return;
    }

    if (!formData.location) {
      setError('Vui lòng lấy vị trí hiện tại.');
      return;
    }

    if (images.length === 0) {
      setError('Vui lòng tải lên ít nhất một hình ảnh.');
      return;
    }

    setLoading(true);
    try {
      // Convert images to base64 or upload to server
      const imageUrls = images.map((img) => img.preview); // In real app, upload to server

      const report = await createReport({
        userId: user?.id || 'user_123',
        userName: user?.name || 'Người dùng',
        category: formData.category,
        severity: formData.severity,
        description: formData.description,
        location: formData.location,
        address: formData.address,
        images: imageUrls,
        visibility: 'public',
      });

      navigate(`/reports/${report.id}`);
    } catch (err) {
      setError('Có lỗi xảy ra khi tạo báo cáo. Vui lòng thử lại.');
      console.error('Create report error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold text-white mb-8">Tạo báo cáo mới</h1>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {imageAnalysis && (
          <div className="mb-6 p-4 bg-blue-500/20 border border-blue-500 rounded-lg">
            <p className="text-blue-200 text-sm">
              <strong>Phân tích ảnh:</strong> Phát hiện {imageAnalysis.detected?.[0]?.label || 'đối tượng'}
              {imageAnalysis.suggested_category && ` - Đề xuất: ${REPORT_CATEGORIES.find(c => c.id === imageAnalysis.suggested_category)?.label || imageAnalysis.suggested_category}`}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Category Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">
              Loại báo cáo <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {REPORT_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategorySelect(cat.id)}
                  className={`p-4 rounded-lg border-2 transition-all ${formData.category === cat.id
                      ? 'border-blue-500 bg-blue-500/20'
                      : 'border-slate-600 bg-slate-800/50 hover:border-slate-500'
                    }`}
                >
                  <div className="text-3xl mb-2">{cat.icon}</div>
                  <div className="text-white font-medium">{cat.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Severity Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">
              Mức độ nghiêm trọng
            </label>
            <div className="flex gap-3">
              {SEVERITY_LEVELS.map((sev) => (
                <button
                  key={sev.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, severity: sev.id })}
                  className={`flex-1 p-3 rounded-lg border-2 transition-all ${formData.severity === sev.id
                      ? `border-${sev.color}-500 bg-${sev.color}-500/20`
                      : 'border-slate-600 bg-slate-800/50 hover:border-slate-500'
                    }`}
                >
                  <div className={`text-${sev.color}-400 font-medium`}>{sev.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">
              Hình ảnh <span className="text-red-400">*</span>
            </label>
            <div className="space-y-4">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-600 rounded-lg cursor-pointer bg-slate-800/50 hover:bg-slate-800/70 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {analyzing ? (
                    <Loader className="w-8 h-8 text-blue-400 animate-spin mb-2" />
                  ) : (
                    <Camera className="w-8 h-8 text-slate-400 mb-2" />
                  )}
                  <p className="mb-2 text-sm text-slate-400">
                    {analyzing ? 'Đang phân tích ảnh...' : 'Nhấn để tải ảnh lên'}
                  </p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  disabled={analyzing}
                />
              </label>

              {images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {images.map((img) => (
                    <div key={img.id} className="relative group">
                      <img
                        src={img.preview}
                        alt="Preview"
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(img.id)}
                        className="absolute top-2 right-2 p-1 bg-black/60 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">
              Vị trí <span className="text-red-400">*</span>
            </label>
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleGetLocation}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                <MapPin className="w-5 h-5" />
                {loading ? 'Đang lấy vị trí...' : 'Lấy vị trí hiện tại'}
              </button>
              {formData.address && (
                <p className="text-slate-300 text-sm">{formData.address}</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-slate-300 mb-3">
              Mô tả
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Mô tả chi tiết tình huống..."
            />
          </div>

          {/* Submit */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Đang tạo...</span>
                </>
              ) : (
                'Tạo báo cáo'
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}


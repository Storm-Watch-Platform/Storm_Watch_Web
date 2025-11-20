import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, Users, Loader, AlertCircle } from 'lucide-react';
import { getReportById } from '../services/reportService';
import { formatRelativeTime } from '../utils/formatTime';
import Header from '../components/Layout/Header';

const severityStyle = {
  high: 'bg-red-500/20 text-red-300 border-red-500/40',
  medium: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
  low: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
};

export default function ReportDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const data = await getReportById(id);
        if (data) {
          setReport(data);
        } else {
          setError('Không tìm thấy báo cáo');
        }
      } catch (err) {
        setError('Có lỗi xảy ra khi tải báo cáo');
        console.error('Fetch report error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchReport();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <Header />
        <main className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
          <Loader className="w-8 h-8 text-blue-400 animate-spin" />
        </main>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-red-200">{error || 'Không tìm thấy báo cáo'}</p>
          </div>
        </main>
      </div>
    );
  }

  const severityClass = severityStyle[report.severity] || severityStyle.low;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <button
          onClick={() => navigate('/')}
          className="mb-6 flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Quay lại</span>
        </button>

        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl overflow-hidden">
          {report.images && report.images.length > 0 && (
            <div className="relative">
              <img
                src={report.images[0]}
                alt="Hình ảnh báo cáo"
                className="w-full h-96 object-cover"
              />
            </div>
          )}

          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Người báo cáo</p>
                <h1 className="text-2xl font-bold text-white">{report.userName}</h1>
              </div>
              <span className={`text-xs px-3 py-1 rounded-full border ${severityClass}`}>
                {report.severity === 'high' ? 'Cần cứu hộ' : report.severity === 'medium' ? 'Cảnh báo' : 'Theo dõi'}
              </span>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-slate-300">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>{formatRelativeTime(report.timestamp)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-400" />
                <span>{report.observers || 0} người đã xem</span>
              </div>
            </div>

            <div className="flex items-start gap-2 text-slate-200">
              <MapPin className="w-5 h-5 text-blue-400 flex-shrink-0 mt-1" />
              <div>
                <p className="font-medium">{report.address}</p>
                {report.location && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${report.location.lat},${report.location.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-blue-400 hover:text-blue-300"
                  >
                    Mở trên Google Maps
                  </a>
                )}
              </div>
            </div>

            <div className="bg-slate-800/70 border border-slate-700 rounded-2xl p-4">
              <h3 className="text-lg font-semibold text-white mb-2">Mô tả</h3>
              <p className="text-slate-200 leading-relaxed">{report.description || 'Không có mô tả'}</p>
            </div>

            {report.images && report.images.length > 1 && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Hình ảnh khác</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {report.images.slice(1).map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`Hình ảnh ${idx + 2}`}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}


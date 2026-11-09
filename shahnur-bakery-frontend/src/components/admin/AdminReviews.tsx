import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { AdminLayout } from './AdminLayout';
import api from '../../services/api';

const COLORS = {
  primary: '#D4883B',
  cream: '#FFFAF5',
  creamBorder: '#FFE1C0',
  dark: '#201A14',
  darkMuted: '#7A6A54',
  yellow: '#F59E0B',
  green: '#10B981',
  red: '#EF4444',
};

export const AdminReviews: React.FC = () => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [replyTo, setReplyTo] = useState<any | null>(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/admin/reviews', { params: { limit: 100 } });
        setReviews(res.data.data || []);
      } catch {
        toast.error('Sharhlarni yuklab bo\'lmadi');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleApprove = async (id: string, approve: boolean) => {
    try {
      await api.patch(`/admin/reviews/${id}/approve`, { isApproved: approve });
      setReviews((p) => p.map((r) => (r._id === id ? { ...r, isApproved: approve } : r)));
      toast.success(approve ? 'Tasdiqlandi' : 'Rad etildi');
    } catch {
      toast.error('Xatolik');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Sharhni o\'chirmoqchimisiz?')) return;
    try {
      await api.delete(`/admin/reviews/${id}`);
      setReviews((p) => p.filter((r) => r._id !== id));
      toast.success('O\'chirildi');
    } catch {
      toast.error('Xatolik');
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyTo) return;
    try {
      await api.post(`/reviews/${replyTo._id}/respond`, { message: replyText });
      setReviews((p) =>
        p.map((r) =>
          r._id === replyTo._id ? { ...r, adminResponse: { message: replyText } } : r
        )
      );
      toast.success('Javob yuborildi!');
      setReplyTo(null);
      setReplyText('');
    } catch {
      toast.error('Xatolik');
    }
  };

  const filtered =
    filter === 'all'
      ? reviews
      : filter === 'pending'
      ? reviews.filter((r) => !r.isApproved)
      : reviews.filter((r) => r.isApproved);

  return (
    <AdminLayout title="Sharhlar" subtitle="Sharhlarni tasdiqlash, rad etish va javob berish">
      {/* Filter */}
      <div className="bg-white rounded-2xl shadow-lg p-4 mb-6 flex flex-wrap gap-2">
        {[
          { value: 'all', label: `Barchasi (${reviews.length})` },
          { value: 'approved', label: `✅ Tasdiqlangan (${reviews.filter((r) => r.isApproved).length})` },
          { value: 'pending', label: `⏳ Kutilayotgan (${reviews.filter((r) => !r.isApproved).length})` },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className="px-4 py-2 rounded-lg text-sm font-semibold"
            style={{
              backgroundColor: filter === f.value ? COLORS.primary : COLORS.cream,
              color: filter === f.value ? 'white' : COLORS.primary,
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <p style={{ color: COLORS.darkMuted }}>Yuklanmoqda...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <div className="text-5xl mb-4">⭐</div>
          <p style={{ color: COLORS.darkMuted }}>Sharhlar topilmadi</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((review) => (
            <div key={review._id} className="bg-white rounded-2xl shadow-lg p-5">
              <div className="flex items-start gap-3 mb-3">
                <img
                  src={review.product?.images?.[0]?.url || 'https://via.placeholder.com/50'}
                  alt=""
                  className="w-14 h-14 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-semibold">
                      {review.user?.firstName} {review.user?.lastName}
                    </span>
                    <span
                      className="px-2 py-0.5 rounded text-xs font-semibold"
                      style={{
                        backgroundColor: review.isApproved ? '#DCFCE7' : '#FEF3C7',
                        color: review.isApproved ? '#166534' : '#92400E',
                      }}
                    >
                      {review.isApproved ? '✅ Tasdiqlangan' : '⏳ Kutilmoqda'}
                    </span>
                  </div>
                  <p className="text-sm font-semibold" style={{ color: COLORS.primary }}>
                    {review.product?.name}
                  </p>
                  <div className="flex items-center gap-1 my-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        style={{ color: star <= review.rating ? COLORS.yellow : '#D1D5DB' }}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <h4 className="font-semibold">{review.title}</h4>
                  <p className="text-sm" style={{ color: COLORS.darkMuted }}>
                    {review.comment}
                  </p>
                </div>
              </div>

              {review.adminResponse && (
                <div className="p-3 rounded-lg mb-3" style={{ backgroundColor: COLORS.cream }}>
                  <p className="text-xs font-semibold mb-1" style={{ color: COLORS.primary }}>
                    👨‍💼 Admin javobi:
                  </p>
                  <p className="text-sm">{review.adminResponse.message}</p>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {!review.isApproved ? (
                  <button
                    onClick={() => handleApprove(review._id, true)}
                    className="px-3 py-1 rounded-lg text-sm font-semibold text-white"
                    style={{ backgroundColor: COLORS.green }}
                  >
                    ✅ Tasdiqlash
                  </button>
                ) : (
                  <button
                    onClick={() => handleApprove(review._id, false)}
                    className="px-3 py-1 rounded-lg text-sm font-semibold"
                    style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}
                  >
                    ⏸️ Rad etish
                  </button>
                )}
                <button
                  onClick={() => setReplyTo(review)}
                  className="px-3 py-1 rounded-lg text-sm font-semibold text-white"
                  style={{ backgroundColor: COLORS.primary }}
                >
                  💬 Javob berish
                </button>
                <button
                  onClick={() => handleDelete(review._id)}
                  className="px-3 py-1 rounded-lg text-sm font-semibold text-white"
                  style={{ backgroundColor: COLORS.red }}
                >
                  🗑️ O'chirish
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reply Modal */}
      {replyTo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => setReplyTo(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-2">💬 Javob berish</h2>
            <p className="text-sm mb-4" style={{ color: COLORS.darkMuted }}>
              {replyTo.user?.firstName}'ning sharhiga javob:
            </p>
            <div className="p-3 rounded-lg mb-4" style={{ backgroundColor: COLORS.cream }}>
              <p className="text-sm italic">"{replyTo.comment}"</p>
            </div>
            <form onSubmit={handleReply} className="space-y-4">
              <textarea
                required
                rows={4}
                placeholder="Javobingizni yozing..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border-2 outline-none"
                style={{ borderColor: COLORS.creamBorder }}
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setReplyTo(null)}
                  className="flex-1 py-2 rounded-lg font-semibold"
                  style={{ backgroundColor: COLORS.cream, color: COLORS.primary }}
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg font-semibold text-white"
                  style={{ backgroundColor: COLORS.primary }}
                >
                  Yuborish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
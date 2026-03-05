'use client';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../../utils/api';
import { useAdminAuthStore } from '../../../store/adminAuth.store';
import dayjs from 'dayjs';

const TYPE_BADGE: Record<string, string> = {
  EARN: 'bg-green-100 text-green-700',
  USE: 'bg-red-100 text-red-700',
  EXPIRE: 'bg-gray-100 text-gray-500',
  CANCEL: 'bg-yellow-100 text-yellow-700',
  ADJUST: 'bg-blue-100 text-blue-700',
};
const TYPE_LABEL: Record<string, string> = {
  EARN: '적립', USE: '사용', EXPIRE: '만료', CANCEL: '취소', ADJUST: '관리자조정',
};
const SOURCE_LABEL: Record<string, string> = {
  SIGNUP_BONUS: '가입보너스', PURCHASE: '구매', REVIEW: '리뷰',
  EVENT: '이벤트', EXTERNAL_API: '외부API', ADMIN_ADJUST: '관리자', REFERRAL: '추천',
};

export default function AdminPointsPage() {
  const { isAuthenticated, _hasHydrated } = useAdminAuthStore();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    type: '', source: '', startDate: '', endDate: '',
  });

  const { data: res, isLoading } = useQuery({
    queryKey: ['admin-points', page, filters],
    queryFn: () => adminApi.getPointHistory({ page, limit: 30, ...filters }),
    enabled: _hasHydrated && isAuthenticated,
  });

  useEffect(() => {
    if (_hasHydrated && !isAuthenticated) {
      document.cookie = 'admin_auth=; path=/; max-age=0';
      window.location.href = '/admin/login';
    }
  }, [_hasHydrated, isAuthenticated]);

  if (!_hasHydrated) return <div className="min-h-screen bg-gray-50" />;
  if (!isAuthenticated) return null;

  const result = (res as any)?.data ?? { items: [], total: 0, totalPages: 1 };

  const setFilter = (key: string, value: string) => {
    setFilters(f => ({ ...f, [key]: value }));
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center gap-4">
        <a href="/admin/dashboard" className="text-gray-400 hover:text-gray-600">← 대시보드</a>
        <h1 className="text-xl font-bold">포인트 이력</h1>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* 필터 */}
        <div className="card flex gap-3 flex-wrap items-end">
          <div>
            <label className="block text-xs text-gray-500 mb-1">유형</label>
            <select className="input-field w-auto" value={filters.type}
              onChange={(e) => setFilter('type', e.target.value)}>
              <option value="">전체</option>
              {Object.entries(TYPE_LABEL).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">출처</label>
            <select className="input-field w-auto" value={filters.source}
              onChange={(e) => setFilter('source', e.target.value)}>
              <option value="">전체</option>
              {Object.entries(SOURCE_LABEL).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">시작일</label>
            <input type="date" className="input-field w-auto" value={filters.startDate}
              onChange={(e) => setFilter('startDate', e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">종료일</label>
            <input type="date" className="input-field w-auto" value={filters.endDate}
              onChange={(e) => setFilter('endDate', e.target.value)} />
          </div>
          <button
            className="btn-secondary w-auto px-4 text-sm"
            onClick={() => { setFilters({ type: '', source: '', startDate: '', endDate: '' }); setPage(1); }}
          >
            초기화
          </button>
        </div>

        {/* 요약 배지 */}
        {!isLoading && (
          <p className="text-sm text-gray-500">
            총 <span className="font-semibold text-gray-800">{(result.total ?? 0).toLocaleString()}</span>건
          </p>
        )}

        {/* 테이블 */}
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['회원', '유형', '출처', '금액', '처리 전 잔액', '처리 후 잔액', '일시'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-gray-600 font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr><td colSpan={7} className="text-center py-10 text-gray-400">로딩중...</td></tr>
                ) : result.items.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-10 text-gray-400">이력이 없습니다.</td></tr>
                ) : result.items.map((tx: any) => (
                  <tr key={tx.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium">{tx.user?.name ?? '-'}</p>
                      <p className="text-xs text-gray-400">{tx.user?.phone ?? ''}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_BADGE[tx.type] ?? 'bg-gray-100 text-gray-500'}`}>
                        {TYPE_LABEL[tx.type] ?? tx.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {SOURCE_LABEL[tx.source] ?? tx.source}
                    </td>
                    <td className={`px-4 py-3 font-semibold whitespace-nowrap ${
                      tx.type === 'EARN' || tx.type === 'ADJUST' ? 'text-green-600' : 'text-red-500'
                    }`}>
                      {tx.type === 'EARN' || tx.type === 'ADJUST' ? '+' : '-'}
                      {(tx.amount ?? 0).toLocaleString()}P
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {(tx.balanceBefore ?? 0).toLocaleString()}P
                    </td>
                    <td className="px-4 py-3 text-gray-800 whitespace-nowrap">
                      {(tx.balanceAfter ?? 0).toLocaleString()}P
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                      {dayjs(tx.createdAt).format('YYYY.MM.DD HH:mm')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 페이지네이션 */}
          <div className="px-4 py-3 border-t flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {page} / {result.totalPages ?? 1} 페이지
            </p>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                className="px-3 py-1 text-sm border rounded disabled:opacity-40 hover:bg-gray-50">이전</button>
              <button disabled={page >= (result.totalPages ?? 1)} onClick={() => setPage(p => p + 1)}
                className="px-3 py-1 text-sm border rounded disabled:opacity-40 hover:bg-gray-50">다음</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

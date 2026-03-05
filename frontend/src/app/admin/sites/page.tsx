'use client';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../../utils/api';
import { useAdminAuthStore } from '../../../store/adminAuth.store';
import dayjs from 'dayjs';

export default function AdminSitesPage() {
  const { isAuthenticated, _hasHydrated } = useAdminAuthStore();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [newKeys, setNewKeys] = useState<{ name: string; site_key: string; apiKey: string; apiSecret: string } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  // React Hooks Rules: useMutation은 조건부 return 전에 선언
  const createMutation = useMutation({
    mutationFn: (data: any) => adminApi.createExternalSite(data),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['admin-sites'] });
      setNewKeys(res.data);
      setShowForm(false);
    },
  });

  const { data: res, isLoading } = useQuery({
    queryKey: ['admin-sites'],
    queryFn: () => adminApi.getExternalSites(),
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

  const sites: any[] = (res as any)?.data ?? [];

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const dailyRaw = fd.get('dailyLimit') as string;
    createMutation.mutate({
      name: fd.get('name'),
      siteKey: fd.get('siteKey'),
      webhookUrl: fd.get('webhookUrl') || undefined,
      dailyLimit: dailyRaw ? parseInt(dailyRaw) : null,
    });
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <a href="/admin/dashboard" className="text-gray-400 hover:text-gray-600">← 대시보드</a>
          <h1 className="text-xl font-bold">연동 사이트</h1>
        </div>
        <button
          onClick={() => { setShowForm(v => !v); setNewKeys(null); }}
          className="btn-primary w-auto px-4 text-sm"
        >
          {showForm ? '취소' : '+ 사이트 등록'}
        </button>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">

        {/* 신규 API 키 1회 표시 */}
        {newKeys && (
          <div className="card border-2 border-amber-400 bg-amber-50">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">⚠️</span>
              <p className="font-bold text-amber-800">API 키 발급 완료 — 이 화면에서만 표시됩니다</p>
            </div>
            <p className="text-sm text-amber-700 mb-4">
              사이트 <strong>{newKeys.name}</strong> ({newKeys.site_key})의 API 키와 시크릿을 지금 안전한 곳에 저장하세요.
              창을 닫으면 시크릿은 다시 확인할 수 없습니다.
            </p>
            <div className="space-y-3">
              {[
                { label: 'API Key', value: newKeys.apiKey },
                { label: 'API Secret', value: newKeys.apiSecret },
              ].map(({ label, value }) => (
                <div key={label} className="bg-white rounded-lg border p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-500">{label}</span>
                    <button
                      onClick={() => copyToClipboard(value, label)}
                      className="text-xs text-primary hover:underline"
                    >
                      {copied === label ? '✓ 복사됨' : '복사'}
                    </button>
                  </div>
                  <code className="text-xs break-all text-gray-800 font-mono">{value}</code>
                </div>
              ))}
            </div>
            <button
              onClick={() => setNewKeys(null)}
              className="mt-4 text-sm text-amber-700 underline"
            >
              저장했습니다. 닫기
            </button>
          </div>
        )}

        {/* 사이트 등록 폼 */}
        {showForm && (
          <div className="card">
            <h2 className="font-semibold text-gray-800 mb-4">새 연동 사이트 등록</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    사이트명 <span className="text-red-500">*</span>
                  </label>
                  <input name="name" className="input-field" placeholder="예: 쇼핑몰 A" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    사이트 키 <span className="text-red-500">*</span>
                    <span className="text-xs text-gray-400 ml-1">(영문 소문자·숫자·하이픈)</span>
                  </label>
                  <input
                    name="siteKey" className="input-field font-mono"
                    placeholder="예: shop-a" pattern="[a-z0-9\-]+" title="영문 소문자, 숫자, 하이픈만 사용 가능"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Webhook URL</label>
                  <input name="webhookUrl" type="url" className="input-field" placeholder="https://..." />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">일일 포인트 한도</label>
                  <input
                    name="dailyLimit" type="number" min="1"
                    className="input-field" placeholder="비워두면 무제한"
                  />
                </div>
              </div>
              {createMutation.isError && (
                <p className="text-sm text-red-500">등록 중 오류가 발생했습니다. 사이트 키가 중복되지 않았는지 확인해주세요.</p>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">
                  취소
                </button>
                <button type="submit" disabled={createMutation.isPending} className="btn-primary flex-1">
                  {createMutation.isPending ? '등록 중...' : 'API 키 발급 및 등록'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 사이트 목록 */}
        <div className="card p-0 overflow-hidden">
          <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between">
            <h2 className="font-medium text-gray-700">등록된 사이트</h2>
            <span className="text-xs text-gray-400">{sites.length}개</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white border-b">
                <tr>
                  {['사이트명', '사이트 키', '일일 한도', '상태', '등록일'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-gray-600 font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr><td colSpan={5} className="text-center py-10 text-gray-400">로딩중...</td></tr>
                ) : sites.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-gray-400">
                      <p className="text-3xl mb-2">🔗</p>
                      <p>등록된 연동 사이트가 없습니다.</p>
                      <p className="text-xs mt-1">우측 상단의 '사이트 등록' 버튼을 눌러 추가하세요.</p>
                    </td>
                  </tr>
                ) : sites.map((site: any) => (
                  <tr key={site.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{site.name}</td>
                    <td className="px-4 py-3">
                      <code className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-700">{site.site_key}</code>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {site.daily_limit ? `${(site.daily_limit).toLocaleString()}P` : '무제한'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        site.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {site.is_active ? '활성' : '비활성'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                      {dayjs(site.created_at).format('YYYY.MM.DD')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 사용 안내 */}
        <div className="card bg-blue-50 border border-blue-100">
          <p className="text-sm text-blue-700 font-medium mb-2">💡 외부 연동 API 사용법</p>
          <ul className="text-xs text-blue-600 space-y-1 list-disc list-inside">
            <li>발급받은 API Key와 Secret을 외부 서버에 안전하게 보관하세요.</li>
            <li>API 호출 시 <code className="bg-blue-100 px-1 rounded">X-API-Key</code> 및 <code className="bg-blue-100 px-1 rounded">X-Site-Key</code> 헤더를 함께 전송하세요.</li>
            <li>일일 한도를 초과하면 해당 일 포인트 적립이 차단됩니다.</li>
            <li>Webhook URL 설정 시 포인트 처리 결과를 실시간으로 수신할 수 있습니다.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

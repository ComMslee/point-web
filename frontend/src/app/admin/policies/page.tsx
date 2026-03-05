'use client';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../../utils/api';
import { useAdminAuthStore } from '../../../store/adminAuth.store';
import dayjs from 'dayjs';

export default function AdminPoliciesPage() {
  const { isAuthenticated, _hasHydrated } = useAdminAuthStore();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  // React Hooks Rules: useMutation은 조건부 return 전에 선언
  const createMutation = useMutation({
    mutationFn: (data: any) => adminApi.createPolicy(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-policies'] });
      setShowForm(false);
    },
  });

  const { data: res, isLoading } = useQuery({
    queryKey: ['admin-policies'],
    queryFn: () => adminApi.getPolicies(),
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

  const policies: any[] = (res as any)?.data ?? [];

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const expiryRaw = fd.get('expiryDays') as string;
    createMutation.mutate({
      name: fd.get('name'),
      description: fd.get('description') || '',
      expiryDays: expiryRaw ? parseInt(expiryRaw) : null,
      isDefault: fd.get('isDefault') === 'on',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <a href="/admin/dashboard" className="text-gray-400 hover:text-gray-600">← 대시보드</a>
          <h1 className="text-xl font-bold">정책 설정</h1>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="btn-primary w-auto px-4 text-sm"
        >
          {showForm ? '취소' : '+ 정책 추가'}
        </button>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-6 space-y-6">

        {/* 정책 추가 폼 */}
        {showForm && (
          <div className="card">
            <h2 className="font-semibold text-gray-800 mb-4">새 정책 등록</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">정책명 <span className="text-red-500">*</span></label>
                  <input name="name" className="input-field" placeholder="예: 구매 적립 정책" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">만료 일수</label>
                  <input
                    name="expiryDays" type="number" min="1"
                    className="input-field" placeholder="비워두면 무제한"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">설명</label>
                <input name="description" className="input-field" placeholder="정책 설명 (선택)" />
              </div>
              <div className="flex items-center gap-2">
                <input name="isDefault" type="checkbox" id="isDefault" className="w-4 h-4 rounded" />
                <label htmlFor="isDefault" className="text-sm text-gray-700">기본 정책으로 설정</label>
              </div>
              {createMutation.isError && (
                <p className="text-sm text-red-500">저장 중 오류가 발생했습니다. 다시 시도해주세요.</p>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">
                  취소
                </button>
                <button type="submit" disabled={createMutation.isPending} className="btn-primary flex-1">
                  {createMutation.isPending ? '저장 중...' : '저장'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 정책 목록 */}
        <div className="space-y-3">
          {isLoading ? (
            [1, 2, 3].map(i => (
              <div key={i} className="card animate-pulse h-20 bg-gray-100 rounded-xl" />
            ))
          ) : policies.length === 0 ? (
            <div className="card text-center py-12 text-gray-400">
              <p className="text-4xl mb-3">📋</p>
              <p>등록된 정책이 없습니다.</p>
            </div>
          ) : policies.map((policy: any) => (
            <div key={policy.id} className="card flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-gray-900">{policy.name}</h3>
                  {policy.is_default && (
                    <span className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full font-medium">
                      기본
                    </span>
                  )}
                  <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                    policy.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {policy.is_active ? '활성' : '비활성'}
                  </span>
                </div>
                {policy.description && (
                  <p className="text-sm text-gray-500 mt-1">{policy.description}</p>
                )}
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                  <span>만료: <strong className="text-gray-600">
                    {policy.expiry_days ? `${policy.expiry_days}일` : '무제한'}
                  </strong></span>
                  <span>·</span>
                  <span>등록: {dayjs(policy.created_at).format('YYYY.MM.DD')}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-xs text-gray-300">#{policy.id}</span>
              </div>
            </div>
          ))}
        </div>

        {/* 안내 */}
        <div className="card bg-blue-50 border border-blue-100">
          <p className="text-sm text-blue-700 font-medium mb-1">💡 정책 안내</p>
          <ul className="text-xs text-blue-600 space-y-1 list-disc list-inside">
            <li>기본 정책은 포인트 적립 시 만료일 계산에 사용됩니다.</li>
            <li>만료 일수를 비워두면 해당 정책 적용 포인트는 만료되지 않습니다.</li>
            <li>정책 수정/삭제는 현재 관리자에게 문의하세요.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

'use client'
import { useState, useEffect } from 'react'
import { useSession } from '@/components/providers/session-provider'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

interface Claim {
  id: string; claim_type_id: string; name: string; description: string | null
  organization_id: string; claim_category: string | null; claim_scope: string | null
  priority: string; version: number; lifecycle_status: string; review_status: string
  workflow_state: string; evidence_count: number; expires_at: string | null
  superseded_by: string | null; created_at: string; updated_at: string
}

export default function ClaimsPage() {
  const { user } = useSession()
  const [claims, setClaims] = useState<Claim[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const headers = (token?: string) => ({
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  })

  const fetchClaims = async (token: string) => {
    try {
      const url = statusFilter
        ? `${API}/api/v1/claims?orgId=${user?.organization_id}&status=${statusFilter}`
        : `${API}/api/v1/claims?orgId=${user?.organization_id}`
      const res = await fetch(url, { headers: headers(token) })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      setClaims(json.data ?? json.claims ?? [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!user?.token) return
    fetchClaims(user.token)
  }, [user, statusFilter])

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700',
    review: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    superseded: 'bg-purple-100 text-purple-700',
    expired: 'bg-orange-100 text-orange-700',
    archived: 'bg-gray-200 text-gray-500',
  }

  if (loading) return <div className="p-8 text-gray-500">Loading claims...</div>
  if (error) return <div className="p-8 text-red-600">Error: {error}</div>

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Claims</h1>
        <p className="text-gray-600">Institutional claims backed by verified evidence.</p>
      </div>

      <div className="mb-6 flex gap-2">
        {['', 'draft', 'review', 'approved', 'rejected', 'expired'].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1 rounded-full text-sm ${statusFilter === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {claims.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-12 text-center text-gray-500">
          No claims found. Claims are generated from reviewed evidence.
        </div>
      ) : (
        <div className="space-y-3">
          {claims.map(claim => (
            <div key={claim.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-sm transition">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900">{claim.name}</h3>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[claim.lifecycle_status] ?? 'bg-gray-100'}`}>
                  {claim.lifecycle_status}
                </span>
              </div>
              {claim.description && <p className="text-sm text-gray-600 mb-2">{claim.description}</p>}
              <div className="flex gap-4 text-xs text-gray-400">
                <span>v{claim.version}</span>
                <span>{claim.claim_category ?? 'uncategorized'}</span>
                <span>{claim.evidence_count} evidence items</span>
                <span>{claim.workflow_state}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
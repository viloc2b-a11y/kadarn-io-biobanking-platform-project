'use client'
import { useState, useEffect } from 'react'
import { useSession } from '@/components/providers/session-provider'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

interface Capability {
  id: string; name: string; description: string | null
  organization_id: string; domain: string | null; status: string
  evidence_sufficiency: string | null; claim_count: number
  review_status: string; confidence_score: number | null
  first_declared_at: string; last_verified_at: string | null
  created_at: string; updated_at: string
}

export default function CapabilitiesPage() {
  const { user } = useSession()
  const [capabilities, setCapabilities] = useState<Capability[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const headers = (token?: string) => ({
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  })

  const fetchCapabilities = async (token: string) => {
    try {
      const url = statusFilter
        ? `${API}/api/v1/capabilities?orgId=${user?.organization_id}&status=${statusFilter}`
        : `${API}/api/v1/capabilities?orgId=${user?.organization_id}`
      const res = await fetch(url, { headers: headers(token) })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      setCapabilities(json.data ?? json.capabilities ?? [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!user?.token) return
    fetchCapabilities(user.token)
  }, [user, statusFilter])

  const sufficiencyColors: Record<string, string> = {
    sufficient: 'bg-green-100 text-green-700',
    insufficient: 'bg-red-100 text-red-700',
    conflicting: 'bg-yellow-100 text-yellow-700',
    expired: 'bg-orange-100 text-orange-700',
    superseded: 'bg-purple-100 text-purple-700',
    manual_review_required: 'bg-blue-100 text-blue-700',
  }

  const statusColors: Record<string, string> = {
    declared: 'bg-gray-100 text-gray-700',
    evidence_submitted: 'bg-blue-100 text-blue-700',
    under_review: 'bg-yellow-100 text-yellow-700',
    verified: 'bg-green-100 text-green-700',
    published: 'bg-indigo-100 text-indigo-700',
    deprecated: 'bg-gray-200 text-gray-500',
  }

  if (loading) return <div className="p-8 text-gray-500">Loading capabilities...</div>
  if (error) return <div className="p-8 text-red-600">Error: {error}</div>

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Capabilities</h1>
        <p className="text-gray-600">Aggregated institutional capabilities derived from verified claims.</p>
      </div>

      <div className="mb-6 flex gap-2 flex-wrap">
        {['', 'declared', 'verified', 'published', 'deprecated'].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1 rounded-full text-sm ${statusFilter === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {capabilities.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-12 text-center text-gray-500">
          No capabilities yet. Capabilities are aggregated from claims.
        </div>
      ) : (
        <div className="space-y-3">
          {capabilities.map(cap => (
            <div key={cap.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-sm transition">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900">{cap.name}</h3>
                <div className="flex gap-2">
                  {cap.evidence_sufficiency && (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sufficiencyColors[cap.evidence_sufficiency] ?? 'bg-gray-100'}`}>
                      {cap.evidence_sufficiency.replace(/_/g, ' ')}
                    </span>
                  )}
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[cap.status] ?? 'bg-gray-100'}`}>
                    {cap.status.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
              {cap.description && <p className="text-sm text-gray-600 mb-2">{cap.description}</p>}
              <div className="flex gap-4 text-xs text-gray-400">
                <span>{cap.claim_count} claims</span>
                <span>{cap.domain ?? 'no domain'}</span>
                {cap.confidence_score != null && <span>confidence: {(cap.confidence_score * 100).toFixed(0)}%</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
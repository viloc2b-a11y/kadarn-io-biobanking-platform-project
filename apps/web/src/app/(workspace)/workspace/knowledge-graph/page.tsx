'use client'
import { useState, useEffect } from 'react'
import { useSession } from '@/components/providers/session-provider'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

interface GraphNode {
  id: string; type: string; name: string
  data: Record<string, unknown>
}

interface GraphEdge {
  source_id: string; target_id: string; relationship: string
  metadata?: Record<string, unknown>
}

interface InstitutionGraph {
  institution: GraphNode | null
  capabilities: GraphNode[]
  claims: GraphNode[]
  evidence: GraphNode[]
  sources: GraphNode[]
  events: GraphNode[]
  edges: GraphEdge[]
}

interface CoverageStats {
  orgId: string; totalCapabilities: number; totalClaims: number
  totalEvidence: number; claimsWithEvidence: number
  claimsWithoutEvidence: number; capabilitiesWithClaims: number
  capabilitiesWithoutClaims: number
  evidenceByClass: Record<string, number>
}

export default function KnowledgeGraphPage() {
  const { user } = useSession()
  const [graph, setGraph] = useState<InstitutionGraph | null>(null)
  const [stats, setStats] = useState<CoverageStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedNode, setSelectedNode] = useState<string | null>(null)

  const headers = (token?: string) => ({
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  })

  const fetchGraph = async (token: string) => {
    try {
      const orgId = user?.organization_id
      const [graphRes, statsRes] = await Promise.all([
        fetch(`${API}/api/v1/knowledge-graph/institution/${orgId}`, { headers: headers(token) }),
        fetch(`${API}/api/v1/knowledge-graph?orgId=${orgId}`, { headers: headers(token) }),
      ])
      if (graphRes.ok) {
        const json = await graphRes.json()
        setGraph(json)
      }
      if (statsRes.ok) {
        const json = await statsRes.json()
        // Extract coverage stats if returned separately
        if (json.coverage) setStats(json.coverage)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!user?.token) return
    fetchGraph(user.token)
  }, [user])

  const allNodes = graph
    ? [
        ...(graph.institution ? [graph.institution] : []),
        ...graph.capabilities,
        ...graph.claims,
        ...graph.evidence,
        ...graph.sources,
        ...graph.events,
      ]
    : []

  const nodeTypeColors: Record<string, string> = {
    institution: 'bg-indigo-100 border-indigo-300 text-indigo-700',
    capability: 'bg-blue-100 border-blue-300 text-blue-700',
    claim: 'bg-teal-100 border-teal-300 text-teal-700',
    evidence: 'bg-green-100 border-green-300 text-green-700',
    source_record: 'bg-yellow-100 border-yellow-300 text-yellow-700',
    institutional_event: 'bg-orange-100 border-orange-300 text-orange-700',
  }

  if (loading) return <div className="p-8 text-gray-500">Loading knowledge graph...</div>
  if (error) return <div className="p-8 text-red-600">Error: {error}</div>

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Knowledge Graph</h1>
        <p className="text-gray-600">
          Institution → Capability → Claim → Evidence → SourceRecord → InstitutionalEvent
        </p>
      </div>

      {/* Coverage stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Capabilities', value: stats.totalCapabilities },
            { label: 'Claims', value: stats.totalClaims },
            { label: 'Evidence', value: stats.totalEvidence },
            { label: 'Coverage', value: `${stats.claimsWithEvidence}/${stats.totalClaims} claims` },
          ].map(s => (
            <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">{s.value}</div>
              <div className="text-xs text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Node grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {allNodes.map(node => (
          <button
            key={node.id}
            onClick={() => setSelectedNode(selectedNode === node.id ? null : node.id)}
            className={`border rounded-xl p-4 text-left transition hover:shadow-sm ${nodeTypeColors[node.type] ?? 'bg-gray-100 border-gray-200'}`}
          >
            <div className="text-xs font-medium uppercase mb-1">{node.type.replace(/_/g, ' ')}</div>
            <div className="font-medium text-sm truncate">{node.name}</div>
            {selectedNode === node.id && (
              <div className="mt-2 pt-2 border-t border-current/10 text-xs space-y-1 max-h-32 overflow-y-auto">
                {Object.entries(node.data ?? {}).filter(([_, v]) => v != null).slice(0, 5).map(([k, v]) => (
                  <div key={k}>{k}: {String(v).slice(0, 60)}</div>
                ))}
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Edge list */}
      {graph && graph.edges && graph.edges.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Relationships ({graph.edges.length})</h2>
          <div className="space-y-1">
            {graph.edges.map((edge, i) => (
              <div key={i} className="text-sm text-gray-600 flex items-center gap-2">
                <span className="text-gray-400">{edge.source_id.slice(0, 8)}</span>
                <span className="text-blue-600 font-medium">→ {edge.relationship} →</span>
                <span className="text-gray-400">{edge.target_id.slice(0, 8)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {allNodes.length === 0 && !loading && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-12 text-center text-gray-500">
          No graph data available. Populate evidence and claims to see the knowledge graph.
        </div>
      )}
    </div>
  )
}
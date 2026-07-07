'use client'
import { kocFetch } from '@/lib/koc-api'
import { useState, useEffect } from 'react'
export default function KpePage() {
  const [report, setReport] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  useEffect(() => {
    kocFetch('/')
      .then(r => { if (!r.ok) throw new Error('Failed'); return r.json() })
      .then(d => { setReport(d.data.report); setLoading(false) })
      .catch(() => { setError(true); setLoading(false) })
  }, [])
  if (loading) return <div style={{padding:40,color:'var(--txd)'}}>Loading KPE...</div>
  if (error) return (
    <div style={{ padding: 24, borderRadius: 14, border: '1px solid rgba(255,80,80,0.2)', background: 'rgba(255,80,80,0.05)', maxWidth: 420 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--red)', marginBottom: 8 }}>Failed to load KPE report</div>
      <div style={{ fontSize: 12, color: 'var(--txdd)' }}>The KPE generate endpoint could not be reached.</div>
    </div>
  )
  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
        <div><h1 style={{fontSize:20,fontWeight:800,margin:0}}>Proof of Execution</h1>
        <p style={{fontSize:13,color:'var(--txdd)',margin:'4px 0 0'}}>{report.programName}</p></div>
        <span style={{fontSize:10,padding:'4px 12px',borderRadius:10,background:'rgba(34,211,122,.15)',color:'var(--green)',fontWeight:700}}>
          {report.compliance.readyForAudit ? 'AUDIT READY' : 'GAPS FOUND'}
        </span>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:20}}>
        <KpiBox label="Organizations" value={report.organizations.length} />
        <KpiBox label="Specimens" value={report.specimens.total} color="blue" />
        <KpiBox label="Shipments" value={report.shipments.total} color="purple" />
        <KpiBox label="Exceptions" value={report.exceptions.total} color={report.exceptions.critical > 0 ? 'red' : 'amber'} />
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:12}}>
        <Section title="Assets Moved">{report.specimens.total} specimens / {report.shipments.total} shipments / {report.transactions.total} transactions</Section>
        <Section title="Evidence">{report.evidence.documents} documents / {report.evidence.qcReports} QC reports / {report.evidence.logs} logs</Section>
        <Section title="Policy">{report.policies.allowed} allowed / {report.policies.denied} denied / {report.policies.conditionals} conditional</Section>
        <Section title="Trust">Avg {(report.trust.avgOrgTrust*100).toFixed(0)}% / Range {(report.trust.minTrust*100).toFixed(0)}-{(report.trust.maxTrust*100).toFixed(0)}%</Section>
      </div>
      {report.exceptions.items.length > 0 && (
        <div style={{marginTop:16,background:'var(--card)',border:'1px solid rgba(255,77,106,.2)',borderRadius:12,padding:14}}>
          <h3 style={{fontSize:11,color:'var(--red)',textTransform:'uppercase',margin:'0 0 8px'}}>Exceptions</h3>
          {report.exceptions.items.map((e: string, i: number) => <div key={i} style={{fontSize:12,padding:'3px 0',color:'var(--txd)'}}> - {e}</div>)}
        </div>
      )}
      <p style={{fontSize:10,color:'var(--txdd)',marginTop:20}}>KPE v1.0 / {new Date().toISOString().split('T')[0]} / KRM-BNO Compliant</p>
    </div>
  )
}
function KpiBox({label,value,color}:{label:string;value:number;color?:string}) {
  const c = color === 'red' ? 'var(--red)' : color === 'amber' ? 'var(--amber)' : color === 'blue' ? 'var(--blue)' : color === 'purple' ? 'var(--purple)' : 'var(--teal)'
  return <div style={{background:'var(--card)',border:'1px solid var(--br)',borderRadius:12,padding:16}}>
    <div style={{fontSize:10,color:'var(--txd)',textTransform:'uppercase'}}>{label}</div>
    <div style={{fontSize:28,fontWeight:800,marginTop:4,color:c}}>{value}</div>
  </div>
}
function Section({title,children}:{title:string;children:React.ReactNode}) {
  return <div style={{background:'var(--card)',border:'1px solid var(--br)',borderRadius:12,padding:14}}>
    <h3 style={{fontSize:10,color:'var(--txd)',textTransform:'uppercase',margin:'0 0 6px'}}>{title}</h3>
    <div style={{fontSize:12,color:'var(--tx)'}}>{children}</div>
  </div>
}

'use client'
import { useState } from 'react'
export default function AiPage() {
  const [insights] = useState([
    { type: 'anomaly', title: 'Unusual temperature pattern detected', desc: 'Shipment corridor BKK-FRA shows 23% more excursions this month', severity: 'warning' },
    { type: 'prediction', title: 'Biobank A trust score projected to drop', desc: 'Based on recent fulfillment dispute trend', severity: 'info' },
    { type: 'recommendation', title: 'Route optimization available', desc: '3 alternative labs within 0.05 trust score of current suppliers', severity: 'info' },
  ])
  return (
    <div>
      <h1 style={{fontSize:20,fontWeight:800,margin:0}}>AI Insights</h1>
      <p style={{fontSize:13,color:'var(--txdd)',margin:'4px 0 24px'}}>Machine-generated insights across the Kadarn network</p>
      {insights.map((ins, i) => (
        <div key={i} style={{background:'var(--card)',border:'1px solid var(--br)',borderRadius:12,padding:14,marginBottom:10}}>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <span style={{fontSize:10,textTransform:'uppercase',color:ins.severity === 'warning' ? 'var(--amber)' : 'var(--teal)',fontWeight:700}}>{ins.type}</span>
          </div>
          <div style={{fontSize:13,fontWeight:600,marginTop:4}}>{ins.title}</div>
          <div style={{fontSize:11,color:'var(--txd)',marginTop:2}}>{ins.desc}</div>
        </div>
      ))}
    </div>
  )
}

// Sprint 28G — Published View Architecture
// Consumers never access Claims directly. All access through Published Views.
export type ViewType = 'canonical' | 'sponsor' | 'institution' | 'public'
export interface PublishedView { viewId: string; claimId: string; viewType: ViewType; content: Record<string, unknown>; filteredFields: string[]; publishedAt: string; policyVersion: string }
export class PublishedViewEngine {
  private views: PublishedView[] = []; private counter = 0
  publish(claimId: string, content: Record<string, unknown>, viewType: ViewType, policyVersion: string, filterPrivate: (c: Record<string, unknown>, v: ViewType) => Record<string, unknown>): PublishedView {
    const filtered = filterPrivate(content, viewType)
    const privateFields = Object.keys(content).filter(k => !(k in filtered))
    const view: PublishedView = { viewId: `view:${++this.counter}`, claimId, viewType, content: filtered, filteredFields: privateFields, publishedAt: new Date().toISOString(), policyVersion }
    this.views.push(view); return view
  }
  getViews(claimId: string): PublishedView[] { return this.views.filter(v => v.claimId === claimId) }
  getCanonicalView(claimId: string): PublishedView | undefined { return this.views.find(v => v.claimId === claimId && v.viewType === 'canonical') }
  static defaultFilter(content: Record<string, unknown>, viewType: ViewType): Record<string, unknown> {
    if (viewType === 'public') { const r: Record<string, unknown> = {}; for (const [k, v] of Object.entries(content)) { if (!k.startsWith('internal_') && !k.startsWith('private_') && k !== 'contact') r[k] = v } return r }
    if (viewType === 'institution') { const r = { ...content }; delete (r as any).internal_notes; return r }
    return content
  }
}
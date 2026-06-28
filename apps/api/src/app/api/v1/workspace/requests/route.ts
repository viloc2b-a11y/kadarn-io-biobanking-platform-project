import { NextResponse } from 'next/server';
export async function GET(req: Request) {
  // Org-scoped: active_org_id from auth context (simplified)
  const orgId = req.headers.get('x-org-id') ?? 'org-default';
  return NextResponse.json({
    success: true,
    data: { orgId, message: 'Org-scoped data for ' + orgId, items: [] }
  });
}

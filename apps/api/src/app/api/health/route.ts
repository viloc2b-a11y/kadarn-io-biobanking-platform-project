import { withErrorHandling } from '@/lib/supabase-server';

export const GET = withErrorHandling(async () => {
  return Response.json({
    status: 'ok',
    version: '0.1.0',
    sprint: '1B',
    timestamp: new Date().toISOString(),
  });
});

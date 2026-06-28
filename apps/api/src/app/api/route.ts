export const dynamic = 'force-dynamic';

export const GET = async () => {
  return Response.json({
    status: 'ok',
    service: 'kadarn-api',
  });
};

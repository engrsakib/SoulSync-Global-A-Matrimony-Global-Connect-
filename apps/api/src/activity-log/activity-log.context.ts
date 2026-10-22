export type ActivityLogRequestContext = {
  ipAddress?: string | null;
  userAgent?: string | null;
};

export function readActivityLogContext(request: {
  ip?: string;
  headers?: Record<string, string | string[] | undefined>;
}): ActivityLogRequestContext {
  const forwarded = request.headers?.['x-forwarded-for'];
  const ipFromForwarded =
    typeof forwarded === 'string' ? forwarded.split(',')[0]?.trim() : undefined;
  const ipAddress = ipFromForwarded || request.ip || null;
  const rawUa = request.headers?.['user-agent'];
  const userAgent = typeof rawUa === 'string' ? rawUa.slice(0, 512) : null;
  return { ipAddress, userAgent };
}

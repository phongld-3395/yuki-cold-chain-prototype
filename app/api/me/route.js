import { requireApi, ok } from '@/lib/auth';
export const dynamic = 'force-dynamic';
export async function GET() { const { user, error } = await requireApi(); if (error) return error; return ok({ user }); }

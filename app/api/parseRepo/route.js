import { NextResponse } from 'next/server';
import { parseRepo } from '../../utils/treeSitterParser';

export async function POST(req) {
  const { repoMap } = await req.json();
  const parsedRepo = parseRepo(repoMap);
  return NextResponse.json(parsedRepo);
}

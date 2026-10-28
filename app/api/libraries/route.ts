import { NextResponse } from 'next/server';
import { getLibraries } from '@/lib/library-api';
export const dynamic = 'force-dynamic';
export async function GET() {
 try {
  const data = await getLibraries();
  return NextResponse.json({ mode: 'live', ...data }, { headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=600' } });
 } catch (error) {
  const message = error instanceof Error ? error.message : 'API_UNKNOWN_ERROR';
  const resultCode = /^API_(K\d{2})/.exec(message)?.[1];
  const status = message === 'API_KEY_MISSING' || resultCode === 'K21' ? 503 : resultCode === 'K22' ? 429 : resultCode === 'K20' || resultCode === 'K30' || resultCode === 'K31' ? 403 : 502;
  const userMessage = message === 'API_KEY_MISSING' ? '서버에 DATA_GO_KR_SERVICE_KEY 환경변수가 없습니다.' : resultCode === 'K20' || resultCode === 'K30' || resultCode === 'K31' ? 'API 인증키와 활용 신청 상태를 확인해 주세요.' : resultCode === 'K22' ? 'API 호출 한도에 도달했습니다. 잠시 후 다시 시도해 주세요.' : '공공데이터포털 응답을 가져오지 못했습니다.';
  console.error('Library API request failed:', message);
  return NextResponse.json({ mode: 'error', message: userMessage }, { status });
 }
}

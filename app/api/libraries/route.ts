import { NextResponse } from 'next/server';
export const revalidate = 300;
export async function GET() {
 // 공공데이터포털의 세부 operation/path 및 response schema 확인 전에는 API 호출을 만들지 않습니다.
 return NextResponse.json({ mode: 'sample', message: 'API 명세 확인이 필요합니다. 현재 화면은 샘플 데이터로 표시 중입니다.', updatedAt: null }, { status: 501 });
}

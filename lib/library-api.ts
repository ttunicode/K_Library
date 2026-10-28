import type { Library, ReadingRoom } from '@/types/library';

const API_ROOT = 'https://apis.data.go.kr/B551982/plr_v2';
const ROWS_PER_PAGE = 1000;
type ApiHeader = { resultCode?: string; resultMsg?: string };
type ApiEnvelope<T> = { header?: ApiHeader; body?: { totalCount?: string | number; pageNo?: string | number; numOfRows?: string | number; item?: T | T[] } };
type BasicItem = Record<string, string | undefined> & { pblibId?: string; pblibNm?: string; ctpvNm?: string; sggNm?: string; pblibRoadNmAddr?: string; lat?: string; lot?: string };
type StatusItem = Record<string, string | undefined> & { pblibId?: string; stdgCd?: string; operSttsNm?: string; tdyVstrCnt?: string; seatUsgrt?: string; totCrtrYmd?: string };
type RoomItem = Record<string, string | undefined> & { pblibId?: string; stdgCd?: string; rdrmId?: string; rdrmNm?: string; rdrmTypeNm?: string; bldgFlrExpln?: string; nowVstrCnt?: string; tseatCnt?: string; useSeatCnt?: string; rsvtSeatCnt?: string; rmndSeatCnt?: string; totDt?: string };

function asItems<T>(item: T | T[] | undefined): T[] { return item === undefined ? [] : Array.isArray(item) ? item : [item]; }
function numberOrNull(value?: string): number | null { if (value === undefined || value.trim() === '') return null; const n = Number(value); return Number.isFinite(n) ? n : null; }
function keyFor(item: { pblibId?: string; stdgCd?: string }): string { return `${item.stdgCd ?? ''}:${item.pblibId ?? ''}`; }
function kstToday(): string { const parts = new Intl.DateTimeFormat('en-US', {timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()); const part = (type: string) => parts.find(value => value.type === type)?.value ?? ''; return `${part('year')}${part('month')}${part('day')}`; }

async function fetchAllPages<T>(operation: string, extra: Record<string, string> = {}): Promise<T[]> {
  const serviceKey = process.env.DATA_GO_KR_SERVICE_KEY;
  if (!serviceKey) throw new Error('API_KEY_MISSING');
  const loadPage = async (pageNo: number): Promise<{ items: T[]; total: number }> => {
    const url = new URL(`${API_ROOT}/${operation}`);
    for (const [name, value] of Object.entries({ serviceKey, pageNo: String(pageNo), numOfRows: String(ROWS_PER_PAGE), type: 'JSON', ...extra })) url.searchParams.set(name, value);
    const response = await fetch(url, { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(15000), next: { revalidate: 300 } });
    if (!response.ok) throw new Error(`API_HTTP_${response.status}`);
    const payload = await response.json() as ApiEnvelope<T>;
    const code = payload.header?.resultCode;
    if (code === 'K03') return { items: [], total: 0 };
    if (code && code !== 'K0') throw new Error(`API_${code}:${payload.header?.resultMsg ?? '요청 실패'}`);
    if (!payload.body) throw new Error('API_INVALID_RESPONSE');
    return { items: asItems(payload.body.item), total: Number(payload.body.totalCount ?? 0) };
  };
  const first = await loadPage(1);
  const pages = Math.ceil(first.total / ROWS_PER_PAGE);
  if (pages <= 1) return first.items;
  const rest = await Promise.all(Array.from({ length: pages - 1 }, (_, i) => loadPage(i + 2)));
  return first.items.concat(...rest.map(page => page.items));
}

function formatTime(start?: string, end?: string): string | undefined {
  if (!start || !end || !/^\d{6}$/.test(start) || !/^\d{6}$/.test(end)) return undefined;
  return `${start.slice(0,2)}:${start.slice(2,4)}–${end.slice(0,2)}:${end.slice(2,4)}`;
}

export async function getLibraries(): Promise<{ libraries: Library[]; updatedAt: string | null; invalidCoordinates: number }> {
  const day = kstToday();
  const [basicRows, statusRows, roomRows] = await Promise.all([
    fetchAllPages<BasicItem>('info_v2'),
    fetchAllPages<StatusItem>('prst_info_v2', { fromCrtrYmd: day, toCrtrYmd: day }),
    fetchAllPages<RoomItem>('rlt_rdrm_info_v2'),
  ]);
  const statuses = new Map<string, StatusItem>();
  for (const status of statusRows) statuses.set(keyFor(status), status);
  const rooms = new Map<string, ReadingRoom[]>();
  for (const item of roomRows) {
    if (!item.pblibId) continue;
    const group = rooms.get(keyFor(item)) ?? [];
    group.push({ id: item.rdrmId ?? `${item.rdrmNo ?? ''}-${group.length}`, name: item.rdrmNm ?? '열람실', floor: item.bldgFlrExpln, type: item.rdrmTypeNm, visitors: numberOrNull(item.nowVstrCnt), seatsTotal: numberOrNull(item.tseatCnt), seatsUsed: numberOrNull(item.useSeatCnt), seatsReserved: numberOrNull(item.rsvtSeatCnt), seatsAvailable: numberOrNull(item.rmndSeatCnt), updatedAt: item.totDt });
    rooms.set(keyFor(item), group);
  }
  const latestStatus = [...statusRows].map(item => item.totCrtrYmd).filter((value): value is string => Boolean(value)).sort().at(-1) ?? null;
  const latestRoom = [...roomRows].map(item => item.totDt).filter((value): value is string => Boolean(value)).sort().at(-1) ?? null;
  let invalidCoordinates = 0;
  const libraries = basicRows.filter(item => item.pblibId && item.pblibNm).map((item): Library => {
    const latitude = numberOrNull(item.lat);
    const longitude = numberOrNull(item.lot);
    const valid = latitude !== null && longitude !== null && latitude >= 33 && latitude <= 39 && longitude >= 124 && longitude <= 132;
    if (!valid) invalidCoordinates++;
    const key = keyFor(item);
    const status = statuses.get(key);
    const start = formatTime(item.wkdyOperBgngTm, item.wkdyOperEndTm);
    const end = formatTime(item.wkndOperBgngTm, item.wkndOperEndTm);
    return {
      id: key,
      name: item.pblibNm!,
      sido: item.ctpvNm ?? item.lclgvNm?.split(' ')[0] ?? '지역 미상',
      sigungu: item.sggNm ?? item.lclgvNm?.split(' ').slice(1).join(' ') ?? '',
      address: item.pblibRoadNmAddr ?? '',
      lat: valid ? latitude : null,
      lng: valid ? longitude : null,
      phone: item.pblibTelno,
      website: item.siteUrlAddr,
      closedDays: item.clsrInfoExpln,
      hours: start ? `평일 ${start}${end ? ` · 주말 ${end}` : ''}` : undefined,
      status: status?.operSttsNm,
      visitors: numberOrNull(status?.tdyVstrCnt),
      seatUsageRate: numberOrNull(status?.seatUsgrt),
      rooms: rooms.get(key) ?? [],
      updatedAt: status?.totCrtrYmd ?? latestStatus ?? undefined,
    };
  });
  return { libraries, updatedAt: latestRoom ?? latestStatus, invalidCoordinates };
}

'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import { BookOpen, Search, MapPin, Clock3, Phone, Navigation, ChevronDown, RotateCcw, Database, LibraryBig, MapPinned, Menu, X } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { sampleLibraries } from '@/lib/sample-data';
import type { Library } from '@/types/library';

const Map = dynamic(() => import('@/components/library-map'), {
  ssr: false,
  loading: () => <div className="map-loading"><span className="spinner" />지도를 불러오는 중…</div>,
});
type ApiPayload = { mode: 'live' | 'error'; libraries?: Library[]; updatedAt?: string | null; invalidCoordinates?: number; message?: string };

export default function Dashboard() {
  const [query, setQuery] = useState('');
  const [region, setRegion] = useState('전체 지역');
  const [selected, setSelected] = useState<Library | null>(sampleLibraries[0]);
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [libraries, setLibraries] = useState<Library[]>(sampleLibraries);
  const [dataMode, setDataMode] = useState<'loading' | 'live' | 'sample'>('loading');
  const [apiMessage, setApiMessage] = useState('');
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [invalidCoordinates, setInvalidCoordinates] = useState(0);

  useEffect(() => {
    let active = true;
    fetch('/api/libraries')
      .then(async response => {
        const payload = await response.json() as ApiPayload;
        if (!response.ok || payload.mode !== 'live') throw new Error(payload.message || '실제 데이터를 불러오지 못했습니다.');
        if (!active) return;
        setLibraries(payload.libraries ?? []);
        setDataMode('live');
        setUpdatedAt(payload.updatedAt ?? null);
        setInvalidCoordinates(payload.invalidCoordinates ?? 0);
        setSelected(null);
      })
      .catch(error => {
        if (!active) return;
        setDataMode('sample');
        setApiMessage(error instanceof Error ? error.message : 'API 연결에 실패했습니다.');
      });
    return () => { active = false; };
  }, []);

  const regions = useMemo(() => ['전체 지역', ...Array.from(new Set(libraries.map(x => x.sido))).sort((a, b) => a.localeCompare(b, 'ko'))], [libraries]);
  const data = useMemo(() => libraries.filter(x => (region === '전체 지역' || x.sido === region) && `${x.name} ${x.address} ${x.sigungu}`.toLowerCase().includes(query.toLowerCase())), [libraries, query, region]);
  const stats = useMemo(() => Object.entries(data.reduce<Record<string, number>>((a, x) => (a[x.sido] = (a[x.sido] || 0) + 1, a), {})).map(([name, count]) => ({ name: name.replace(/특별자치도|특별자치시|특별시|광역시/g, ''), count })), [data]);
  const reset = () => { setQuery(''); setRegion('전체 지역'); setSelected(null); };
  const mappedCount = data.filter(l => l.lat !== null && l.lng !== null).length;
  const updatedLabel = updatedAt ? updatedAt.length >= 14 ? `갱신 ${updatedAt.slice(0, 4)}.${updatedAt.slice(4, 6)}.${updatedAt.slice(6, 8)} ${updatedAt.slice(8, 10)}:${updatedAt.slice(10, 12)}` : `기준일 ${updatedAt}` : dataMode === 'loading' ? '불러오는 중' : '업데이트 대기 중';

  return <main className="app-shell">
    <header className="topbar">
      <div className="brand"><div className="brand-mark"><BookOpen size={21} /></div><div><strong>LIBRARY<span>MAP</span></strong><small>PUBLIC DATA EXPLORER</small></div></div>
      <div className="top-meta"><span className="live-dot" style={{ background: dataMode === 'live' ? '#45bb8a' : dataMode === 'loading' ? '#e5ab4f' : '#8795a8' }} />{dataMode === 'live' ? '공공데이터 API 연결' : dataMode === 'loading' ? '공공데이터 연결 중' : '샘플 데이터 모드'}<span className="meta-divider" />{updatedLabel}</div>
      <button className="mobile-toggle" onClick={() => setMobileOpen(!mobileOpen)} aria-label="목록 열기">{mobileOpen ? <X /> : <Menu />}</button>
    </header>

    <section className="intro"><div><div className="eyebrow">NATIONAL LIBRARY DIRECTORY <span>·</span> 2026</div><h1>우리 동네 도서관을 <em>한눈에</em></h1><p>전국 공공도서관의 위치와 지역 현황을 확인해 보세요.</p></div><div className="source-chip"><Database size={15} /> 데이터 출처 <b>공공데이터포털</b></div></section>

    <section className="kpis">
      <article className="kpi"><div className="kpi-icon blue"><LibraryBig size={19} /></div><div><span>전체 도서관</span><strong>{data.length.toLocaleString()}<small>개</small></strong></div><span className="kpi-foot">현재 표시 중</span></article>
      <article className="kpi"><div className="kpi-icon mint"><MapPinned size={19} /></div><div><span>선택 지역</span><strong className="kpi-text">{region === '전체 지역' ? '전국' : region}</strong></div><span className="kpi-foot">{region === '전체 지역' ? '전체 범위' : `${data.length}개 도서관`}</span></article>
      <article className="kpi"><div className="kpi-icon violet"><MapPin size={19} /></div><div><span>확인된 지역</span><strong>{new Set(data.map(x => x.sido)).size}<small>개 시·도</small></strong></div><span className="kpi-foot">{dataMode === 'live' ? '실데이터' : '샘플 기준'}</span></article>
      {dataMode === 'sample' ? <div className="demo-note"><span className="demo-badge">DEMO</span><div><b>{apiMessage ? 'API 연결 실패' : '화면 미리보기'}</b><small>{apiMessage || '도서관 정보는 샘플 데이터입니다.'}</small></div></div> : <div className="demo-note live-note"><span className="demo-badge live-badge">LIVE</span><div><b>공공데이터 연결됨</b><small>{invalidCoordinates ? `좌표 없는 ${invalidCoordinates}개 도서관은 지도에서 제외` : '지도 좌표를 확인했습니다.'}</small></div></div>}
    </section>

    <section className="workspace">
      <div className="map-frame"><div className="map-top-label"><span className="map-label-icon"><MapPin size={16} /></span><div><b>전국 도서관 지도</b><small>{mappedCount}개 위치 표시</small></div></div><Map libraries={data} selected={selected} onSelect={setSelected} /><div className="map-legend"><i /> 공공도서관 <span>·</span> 지도를 이동해 둘러보세요</div></div>
      <aside className={`side-panel ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="panel-head"><div><h2>도서관 찾기</h2><p>이름이나 지역으로 검색하세요</p></div><button className="close-panel" onClick={() => setMobileOpen(false)} aria-label="닫기"><X size={18} /></button></div>
        <div className="searchbox"><Search size={17} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="도서관명, 주소 검색" /><kbd>⌘ K</kbd></div>
        <div className="filter-row"><label className="select-wrap"><MapPin size={15} /><select value={region} onChange={e => setRegion(e.target.value)}>{regions.map(r => <option key={r}>{r}</option>)}</select><ChevronDown size={15} /></label><button className="reset-btn" onClick={reset}><RotateCcw size={14} /> 초기화</button></div>
        <div className="results-heading"><b>검색 결과</b><span><strong>{data.length}</strong>개 도서관</span>{selected && <button className="detail-toggle" onClick={() => setDetailsOpen(!detailsOpen)}>{detailsOpen ? '상세 접기' : '선택 정보 보기'}<ChevronDown size={13} className={detailsOpen ? 'chevron-up' : ''} /></button>}</div>
        <div className="library-list">{data.map(l => <button key={l.id} className={`library-card ${selected?.id === l.id ? 'active' : ''}`} onClick={() => { setSelected(l); setDetailsOpen(true); setMobileOpen(false); }}><div className="card-title"><h3>{l.name}</h3><span className="status-pill"><i style={{ background: l.status?.includes('운영') ? '#45bb8a' : '#e5ab4f' }} />{l.status ?? '상태 정보 없음'}</span></div><div className="card-address"><MapPin size={14} />{l.address || '주소 정보 없음'}</div>{dataMode === 'live' && l.rooms?.length ? <div className="card-live">{l.rooms[0].name} <b>잔여 {l.rooms[0].seatsAvailable ?? '—'}석</b><span>실시간</span></div> : <div className="card-region">{l.sido} <span>›</span> {l.sigungu}</div>}</button>)}{!data.length && <div className="empty"><Search size={22} /><b>{dataMode === 'loading' ? '도서관 정보를 불러오는 중입니다' : '검색 결과가 없습니다'}</b><span>{dataMode === 'loading' ? '잠시 기다려 주세요.' : '검색어나 지역 필터를 바꿔 보세요.'}</span></div>}</div>
        {selected && detailsOpen && <div className="detail-card">
          <div className="detail-top"><div><span className="detail-overline">LIBRARY DETAIL</span><h3>{selected.name}</h3></div><span className="status-pill"><i style={{ background: selected.status?.includes('운영') ? '#45bb8a' : '#e5ab4f' }} />{selected.status ?? '상태 정보 없음'}</span></div>
          <div className="detail-line"><MapPin size={16} /><span>{selected.address || '주소 정보 없음'}</span></div>{selected.phone && <div className="detail-line"><Phone size={15} /><span>{selected.phone}</span></div>}{selected.hours && <div className="detail-line"><Clock3 size={15} /><span>{selected.hours}</span></div>}{selected.closedDays && <div className="detail-line"><Clock3 size={15} /><span>휴관: {selected.closedDays}</span></div>}
          <section className="rooms-section" aria-label="실시간 열람실 좌석 현황">
            <div className="rooms-heading"><div><span className="rooms-live-dot"/><b>실시간 열람실</b><span className="room-count">{selected.rooms?.length ?? 0}개</span></div><small>{selected.rooms?.find(room => room.updatedAt)?.updatedAt?.replace(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2}).*$/, '$2.$3 $4:$5') ?? '현재 제공 정보'}</small></div>
            {selected.rooms?.length ? <div className="room-list">{selected.rooms.slice(0, 3).map(room => {
              const usedPercent = room.seatsTotal && room.seatsUsed !== null ? Math.min(100, Math.max(0, Math.round(room.seatsUsed / room.seatsTotal * 100))) : 0;
              return <article className="room-card" key={room.id}>
                <div className="room-card-heading"><b>{room.name}</b><span>{[room.floor, room.type].filter(Boolean).join(' · ')}</span></div>
                <div className="room-seats"><div className="room-available"><small>남은 좌석</small><strong>{room.seatsAvailable ?? '—'}<em>석</em></strong></div><div className="room-stat"><small>전체 좌석</small><b>{room.seatsTotal ?? '—'}석</b></div><div className="room-stat"><small>사용 중</small><b>{room.seatsUsed ?? '—'}석</b></div><div className="room-stat"><small>예약</small><b>{room.seatsReserved ?? '—'}석</b></div></div>
                <div className="room-progress" role="img" aria-label={`좌석 사용률 ${usedPercent}%`}><span style={{ width: `${usedPercent}%` }}/></div>
              </article>;
            })}</div> : <div className="rooms-empty">현재 제공되는 열람실 정보가 없습니다.</div>}
          </section>
          {selected.website && <a className="directions" href={selected.website} target="_blank" rel="noreferrer"><Navigation size={15} /> 도서관 홈페이지 <span>↗</span></a>}<a className="directions" href={`https://map.kakao.com/link/search/${encodeURIComponent(selected.name)}`} target="_blank" rel="noreferrer"><MapPin size={15} /> 길찾기 <span>↗</span></a>
        </div>}
      </aside>
    </section>

    <section className="bottom-grid">
      <article className="chart-card"><div className="section-title"><div><span className="section-eyebrow">REGIONAL OVERVIEW</span><h2>시·도별 도서관 분포</h2></div><span className="chart-unit">단위: 개</span></div><div className="chart-area">{stats.length ? <ResponsiveContainer width="100%" height="100%"><BarChart data={stats} margin={{ top: 10, right: 8, left: -22, bottom: 0 }}><CartesianGrid vertical={false} stroke="#edf1f6" /><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#8b97a9' }} /><YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#8b97a9' }} /><Tooltip cursor={{ fill: '#f3f7fd' }} contentStyle={{ border: '1px solid #e8edf4', borderRadius: 12, fontSize: 12 }} /><Bar dataKey="count" fill="#4578e8" radius={[5, 5, 0, 0]} maxBarSize={42} /></BarChart></ResponsiveContainer> : <div className="chart-empty">통계를 표시할 데이터가 없습니다.</div>}</div></article>
      <article className="info-card"><span className="section-eyebrow">ABOUT THIS DATA</span><h2>데이터 안내</h2><div className="info-row"><span>데이터 제공</span><b>행정안전부 · 한국지역정보개발원</b></div><div className="info-row"><span>갱신 주기</span><b>실시간</b></div><div className="info-row"><span>현재 데이터</span><b className={dataMode === 'live' ? 'sample-text live-text' : 'sample-text'}><i />{dataMode === 'live' ? '공공 API' : '샘플 데이터'}</b></div><p className="source-foot">{dataMode === 'live' ? `API 기준일 ${updatedAt ?? '정보 없음'} · ${invalidCoordinates}개 좌표 제외` : apiMessage || '공공데이터포털 데이터를 불러오는 중입니다.'}</p></article>
    </section>
    <footer>© 2026 LIBRARY MAP <span>·</span> 지도 타일 © OpenStreetMap contributors</footer>
  </main>;
}

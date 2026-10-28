# 전국 공공도서관 지도 대시보드

공공데이터포털의 공공도서관 통합·현황·열람실 실시간 데이터를 지도에서 살펴보기 위한 Next.js 프로젝트입니다.

## 현재 구현

- 반응형 대시보드, Leaflet / OpenStreetMap 지도, 마커 클러스터링
- 도서관명·주소 검색, 시·도 필터, 상세 패널, 지역별 차트
- 샘플 데이터임을 UI에서 명시
- 좌표 검증 유틸리티와 서버 API 라우트 경계

## 시작하기

```bash
npm install
copy .env.example .env.local
npm run dev
```

브라우저에서 `http://localhost:3000`을 엽니다. 현재 화면은 `lib/sample-data.ts`의 데모 데이터로 표시됩니다.

## 실제 API 연동

데이터셋: [공공데이터포털 15142580](https://www.data.go.kr/data/15142580/openapi.do)

포털 페이지에 포함된 공식 Swagger 명세에서 세 operation과 응답 필드를 확인했습니다. 호출은 전부 Next.js 서버에서 실행하며 `DATA_GO_KR_SERVICE_KEY`는 브라우저로 반환하지 않습니다.

| Operation | 경로 | 용도 |
| --- | --- | --- |
| `info_v2` | `https://apis.data.go.kr/B551982/plr_v2/info_v2` | 도서관 이름, 지역, 주소, 좌표, 연락처, 운영시간 등 |
| `prst_info_v2` | `https://apis.data.go.kr/B551982/plr_v2/prst_info_v2` | 운영상태, 방문자, 좌석사용률, 이용가능 열람실 수 |
| `rlt_rdrm_info_v2` | `https://apis.data.go.kr/B551982/plr_v2/rlt_rdrm_info_v2` | 열람실별 좌석 현황 |

요청은 `serviceKey`, `pageNo`, `numOfRows`, `type=JSON`을 사용합니다. 운영현황은 기준일 조회를 위해 `fromCrtrYmd`와 `toCrtrYmd`에 한국 기준 오늘 날짜(`YYYYMMDD`)를 함께 전달합니다. 페이지당 1,000건을 요청하고 `totalCount`에 맞춰 나머지 페이지를 수집합니다. 서버 fetch 캐시는 5분이며 브라우저는 `/api/libraries`만 호출합니다.

정규화는 `pblibId`와 `stdgCd`를 함께 식별자로 사용합니다. 좌표는 `lat`과 API의 경도 필드 `lot`을 숫자로 변환하고, 대한민국 범위를 벗어나거나 값이 없는 좌표는 마커에서 제외하며 개수도 응답에 포함합니다. API 오류 시 UI는 샘플 데이터를 표시하고 오류 상태를 안내합니다.

공공데이터포털에 로그인해 해당 API의 **활용 신청**을 한 뒤 인증키를 발급받으세요. `.env.local`에서 `DATA_GO_KR_SERVICE_KEY`에 일반 인증키(Decoding)를 입력합니다. 키는 서버 환경변수로만 사용하고 브라우저 코드에 넣거나 저장소에 커밋하지 않습니다. Vercel 배포 시에도 Project Settings → Environment Variables에 같은 이름으로 추가합니다.

## 디렉터리

```text
app/                 화면, 레이아웃, 서버 API 라우트
components/          대시보드와 동적 Leaflet 지도
lib/                 샘플 데이터, 좌표 유효성 검사
types/               도서관 도메인 타입
```

데이터 출처: 행정안전부 한국지역정보개발원. 공공데이터포털은 이 데이터셋을 무료, 실시간 갱신, 개발계정 일 5,000회로 안내합니다.

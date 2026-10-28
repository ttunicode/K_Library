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

## 실제 API 연결

데이터셋: [공공데이터포털 15142580](https://www.data.go.kr/data/15142580/openapi.do)

공식 상세 페이지에서 데이터 제공 내용은 확인했지만 API 활용명세의 operation, 엔드포인트, 요청 파라미터, 응답 필드 스키마는 확인되지 않았습니다. 필드나 URL을 임의로 만들지 않기 위해 `app/api/libraries/route.ts`는 현재 501과 안내 메시지를 반환합니다. 명세를 확보한 다음 서버에서 호출하고, 응답 타입/페이지네이션/캐시/오류 처리를 완성해야 합니다.

공공데이터포털에 로그인해 해당 API의 **활용 신청**을 한 뒤 인증키를 발급받으세요. `.env.local`에서 `DATA_GO_KR_SERVICE_KEY`에 일반 인증키(Decoding)를 입력합니다. 키는 서버 환경변수로만 사용하고 브라우저 코드에 넣거나 저장소에 커밋하지 않습니다. Vercel 배포 시에도 Project Settings → Environment Variables에 같은 이름으로 추가합니다.

## 디렉터리

```text
app/                 화면, 레이아웃, 서버 API 라우트
components/          대시보드와 동적 Leaflet 지도
lib/                 샘플 데이터, 좌표 유효성 검사
types/               도서관 도메인 타입
```

데이터 출처: 행정안전부 한국지역정보개발원. 공공데이터포털은 이 데이터셋을 무료, 실시간 갱신, 개발계정 일 5,000회로 안내합니다.

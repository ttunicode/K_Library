import type { Library } from '@/types/library';
// 화면 개발용 예시 데이터입니다. 실제 API 데이터가 아닙니다.
export const sampleLibraries: Library[] = [
 {id:'sample-1',name:'서울도서관',sido:'서울특별시',sigungu:'중구',address:'서울특별시 중구 세종대로 110',lat:37.5665,lng:126.978,phone:'02-2133-0300',hours:'화–금 09:00–21:00 · 토–일 09:00–18:00',status:'운영 중'},
 {id:'sample-2',name:'국립중앙도서관',sido:'서울특별시',sigungu:'서초구',address:'서울특별시 서초구 반포대로 201',lat:37.4979,lng:127.004,phone:'02-535-4142',hours:'월–일 09:00–18:00',status:'운영 중'},
 {id:'sample-3',name:'부산시민도서관',sido:'부산광역시',sigungu:'부산진구',address:'부산광역시 부산진구 월드컵대로 462',lat:35.1732,lng:129.059,status:'운영 중'},
 {id:'sample-4',name:'수원시 선경도서관',sido:'경기도',sigungu:'수원시',address:'경기도 수원시 팔달구 신풍로23번길 68',lat:37.2851,lng:127.019,status:'운영 중'},
 {id:'sample-5',name:'대전광역시 한밭도서관',sido:'대전광역시',sigungu:'중구',address:'대전광역시 중구 서문로 10',lat:36.3198,lng:127.408,status:'운영 중'},
 {id:'sample-6',name:'제주도서관',sido:'제주특별자치도',sigungu:'제주시',address:'제주특별자치도 제주시 연삼로 489',lat:33.4996,lng:126.5312,status:'운영 중'}
];

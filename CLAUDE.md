# 겜피셜 (GamPicial) — 프로젝트 개요

이 파일은 Claude Code가 세션 시작 시 자동으로 읽는 프로젝트 컨텍스트 파일입니다.
아래 내용을 바탕으로 프로젝트를 이어서 개발합니다.

## 서비스 개요

전 세계 게임(PC / 모바일 / 콘솔)을 하나의 플랫폼에서 탐색하고, 공식 데이터 기반의 종합 평점과 함께 자체 유저 리뷰를 남길 수 있는 게임 리뷰/탐색 서비스.

기존 메타크리틱·오픈크리틱과 달리, **과금 부담도·확률형 아이템 투명성** 등 유저들이 실제로 겪는 고충을 리뷰 항목으로 구조화하여 차별화한다.

서비스명: **겜피셜 (GamPicial)**

## 정보 구조 (IA)

```
메인
 ├─ PC 게임
 ├─ 모바일 게임
 └─ 콘솔 게임
      └─ 게임 썸네일 카드 목록 (대표 이미지 + 종합 평점)
           └─ 게임 상세 페이지
                ├─ 한 문단 소개
                ├─ 장르 / 출시일 / 플랫폼
                ├─ 종합 평점 상세
                ├─ 구매·설치 링크 버튼
                ├─ 자체 유저 리뷰 목록
                └─ 리뷰 작성 폼
```

## 데이터 소스 (100% 합법 기준)

| 데이터 | 소스 | 비고 |
|---|---|---|
| 게임 카탈로그(이름, 이미지, 장르, 출시일, 소개문) | RAWG API, IGDB API | 공식 API |
| PC 게임 평점 | Steam Web API | 리뷰 수, 긍정 비율 |
| 콘솔/PC 전반 평점 | RAWG API 집계 평점 | |
| 모바일 게임 평점 | 사용 안 함 | 공식 API 부재로 제외 |
| 타 커뮤니티 리뷰 크롤링/요약 | 사용 안 함 | 약관 위반 리스크로 완전 제외 |
| 자체 유저 리뷰 | 자체 DB | 100% 자체 생성 데이터 |

**원칙**: 자동화된 대량 크롤링은 절대 하지 않는다. 공식 API가 없는 데이터는 표시하지 않는다.

## 구매/설치 링크

- PC(Steam): `https://store.steampowered.com/app/{appid}`
- 콘솔: RAWG/IGDB 제공 스토어 링크 필드
- 모바일 Android: `https://play.google.com/store/apps/details?id={패키지명}`
- 모바일 iOS: `https://apps.apple.com/app/id{앱ID}`

## 차별화 포인트: 자체 리뷰 항목

일반 별점 외에 아래 항목을 리뷰 작성 시 구조화하여 입력받는다:
- 재미/완성도 별점
- 과금 부담도 (무과금으로 얼마나 즐길 수 있는지)
- 확률형 아이템 체감 투명성
- 자유 텍스트 리뷰

## 기술 스택

- **DB**: Supabase
- **배포/호스팅**: Vercel
- **개발 환경**: 로컬 PC (Claude Code로 개발), 실제 운영 서버는 Vercel 서버리스 함수가 담당
- **캐싱 전략**: 게임 메타데이터는 DB에 캐싱(하루~일주일 주기 갱신), 평점처럼 자주 바뀌는 값은 몇 시간~하루 주기로 갱신. 유저 요청마다 외부 API를 실시간 호출하지 않는다 (속도·안정성 확보 목적).

## 현재 진행 상태

- [x] 서비스 컨셉 및 기획 확정
- [x] 데이터 소스 및 법적 검토 완료
- [x] 서비스명 확정 (겜피셜)
- [x] 기술 스택 결정 (Supabase + Vercel)
- [x] DB 스키마 설계 — `supabase/schema.sql` (games, reviews, game_review_stats 뷰, RLS)
- [x] 프로젝트 초기 세팅 — Next.js 15 App Router + React 19 + TS + Tailwind v4, `npm run build` 통과
- [x] API 연동 구현 — `src/lib/rawg.ts` (RAWG 목록/상세/검색), `src/lib/games.ts` (Supabase 캐시 → RAWG → 샘플 폴백)
- [x] 자체 리뷰 시스템 구현 — `src/app/api/reviews/route.ts`, `ReviewForm`/`ReviewList`, 재미·과금 부담도·확률형 투명성 3항목
- [ ] 화면 와이어프레임 (구현으로 대체 진행 중, 필요 시 디자인 정리)
- [ ] Supabase 프로젝트 생성 + schema.sql 실행 + `.env.local` 값 입력
- [ ] RAWG_API_KEY 발급 및 실데이터 연동 확인
- [ ] Steam Web API 평점 지표 연동 (현재 스토어 링크에서 appid만 추출, 긍정 비율 미연동)
- [ ] Vercel 배포 (git 저장소 필요 — 현재 로컬에 git 미설치)

## 구현 현황 요약 (2026-09-09)

- 페이지: `/` 메인, `/[platform]` (pc|mobile|console) 목록, `/game/[id]` 상세+리뷰, 404
- 종합 평점: Metacritic(0.5) + RAWG(0.3) + Steam 긍정비율(0.2) 가중 평균, 확보된 소스만으로 재정규화 (`computeOverallScore`)
- 폴백 체계: 키가 하나도 없어도 `npm run dev` 동작 (샘플 게임 + 메모리 리뷰)
- 로컬 검증: prod 빌드 + 전 라우트 200 + 리뷰 POST/GET 확인 완료

## 다음 작업 시 참고

다음 우선순위는 (1) Supabase 프로젝트 연결, (2) RAWG 키로 실데이터 확인, (3) git init 후 Vercel 배포.
Steam 긍정 비율 연동과 검색 UI는 그다음.

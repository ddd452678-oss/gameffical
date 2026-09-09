# 겜피셜 (GamPicial)

공식 데이터 기반 종합 평점 + 자체 유저 리뷰를 제공하는 게임 탐색 서비스.
PC / 모바일 / 콘솔 게임을 한 곳에서 살펴보고, **과금 부담도**와 **확률형 아이템
투명성**까지 담은 구조화된 리뷰를 남길 수 있습니다.

## 기술 스택

| 영역 | 사용 |
|---|---|
| 프레임워크 | Next.js 15 (App Router) + React 19 + TypeScript |
| 스타일 | Tailwind CSS v4 |
| DB | Supabase (PostgreSQL) |
| 외부 데이터 | RAWG API (카탈로그·집계 평점), Steam Web API (선택) |
| 배포 | Vercel |

## 로컬 실행

```bash
npm install
cp .env.local.example .env.local   # 값은 비워둬도 실행됩니다
npm run dev                        # http://localhost:3000
```

- **키가 하나도 없어도** 개발 서버는 뜹니다.
  `src/lib/sample-games.ts` 의 샘플 게임과, 서버 메모리에 저장되는 임시 리뷰로 동작합니다.
- `RAWG_API_KEY` 를 넣으면 실제 게임 카탈로그를 불러옵니다.
- Supabase 키를 넣으면 카탈로그가 DB에 캐싱되고 리뷰가 영구 저장됩니다.

## 환경 변수

`.env.local.example` 참고. 요약:

| 변수 | 필수 | 설명 |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | 권장 | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 권장 | 읽기 / 리뷰 작성용 anon 키 |
| `SUPABASE_SERVICE_ROLE_KEY` | 권장 | 서버에서 게임 캐시를 쓰기 위한 키 (클라이언트 노출 금지) |
| `RAWG_API_KEY` | 권장 | https://rawg.io/apidocs 에서 무료 발급 |
| `STEAM_API_KEY` | 선택 | Steam 리뷰 지표 연동 시 |

## DB 세팅

1. Supabase 프로젝트 생성
2. Dashboard → SQL Editor 에서 [`supabase/schema.sql`](supabase/schema.sql) 실행
3. 생성되는 객체: `games`, `reviews` 테이블 + `game_review_stats` 뷰 + RLS 정책

## 데이터 원칙

- 공식 API 데이터와 자체 유저 리뷰만 사용합니다.
- 비공식 커뮤니티 대량 크롤링은 하지 않습니다.
- 공식 평점 API가 없는 모바일 게임은 종합 평점 대신 겜피셜 유저 리뷰 중심으로 표시합니다.

## 디렉터리 구조

```
src/
├─ app/
│  ├─ page.tsx                메인 (플랫폼별 대표 게임)
│  ├─ [platform]/page.tsx     pc | mobile | console 목록
│  ├─ game/[id]/page.tsx      게임 상세 + 리뷰
│  └─ api/reviews/route.ts    리뷰 조회 / 작성 API
├─ components/                GameCard, ScoreBadge, Stars, ReviewForm, ReviewList
└─ lib/
   ├─ games.ts                캐시(Supabase) → RAWG → 샘플 폴백 조정
   ├─ rawg.ts                 RAWG API 클라이언트 + 정규화
   ├─ reviews.ts              리뷰 CRUD + 통계 (Supabase / 메모리 폴백)
   ├─ supabase.ts             anon / service_role 클라이언트
   ├─ types.ts                도메인 타입 + 종합 평점 계산
   └─ sample-games.ts         키 없이 볼 수 있는 샘플 데이터
```

## 배포 (Vercel)

1. GitHub 저장소 연결
2. Vercel 프로젝트 환경 변수에 위 키 등록
3. 빌드 명령 `npm run build` (기본값) — 별도 설정 불필요

## 참고

`npm audit` 은 Next.js 내부 postcss(빌드 타임 전용) 관련 경고를 표시합니다.
런타임에 노출되지 않으며, Next.js 메이저 업그레이드 시 함께 해소됩니다.

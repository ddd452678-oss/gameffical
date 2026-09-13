/**
 * 카탈로그에 반드시 포함하고 싶은 게임 타이틀.
 * en: RAWG 검색용 (RAWG 는 영문 제목 기준)
 * ko: GRAC 검색용 (게임물관리위원회는 한글 제목 기준)
 * officialUrl: RAWG 에 스토어 링크가 없는 국내 게임(자체 런처 서비스 등)의
 *   공식 홈페이지 — 직접 검색으로 확인된 것만 채운다(추측 금지, 틀린 링크가
 *   더 나쁘다). games.ts 에서 stores 가 비어있을 때만 이 링크로 보강한다.
 * RAWG/GRAC 공식 데이터에 존재하는 항목만 실제로 편입된다.
 */
export interface SeedGame {
  en: string;
  ko?: string;
  officialUrl?: string;
}

export const SEED_GAMES: SeedGame[] = [
  // ── 국내 온라인 (PC) ──
  { en: "League of Legends", ko: "리그 오브 레전드" },
  { en: "Lost Ark", ko: "로스트아크", officialUrl: "https://lostark.game.onstove.com/Main" },
  { en: "MapleStory", ko: "메이플스토리", officialUrl: "https://maplestory.nexon.com/Home/Main" },
  { en: "MapleStory 2", ko: "메이플스토리2" },
  { en: "Dungeon Fighter Online", ko: "던전앤파이터", officialUrl: "https://df.nexon.com/" },
  { en: "Black Desert Online", ko: "검은사막", officialUrl: "https://www.kr.playblackdesert.com/ko-KR/Main/Index" },
  { en: "Lineage", ko: "리니지", officialUrl: "https://lineage.plaync.com/" },
  { en: "Lineage 2", ko: "리니지2", officialUrl: "https://lineage2.plaync.com/" },
  { en: "Lineage 2M", ko: "리니지2M" },
  { en: "Blade and Soul", ko: "블레이드앤소울", officialUrl: "https://bns.plaync.com/" },
  { en: "Mabinogi", ko: "마비노기", officialUrl: "https://mabinogi.nexon.com/" },
  { en: "Vindictus", ko: "빈딕투스", officialUrl: "https://heroes.nexon.com/" },
  // KartRider(원조) 는 2023-03-31, TERA 는 2022-06-30 국내 서비스 종료 —
  // officialUrl 안 붙임(DISCONTINUED_TITLES 로 목록에서 제외됨).
  { en: "TERA", ko: "테라 온라인" },
  { en: "Sudden Attack", ko: "서든어택", officialUrl: "https://sa.nexon.com/" },
  { en: "KartRider", ko: "카트라이더" },
  { en: "KartRider: Drift", ko: "카트라이더 드리프트" },
  { en: "Crazy Arcade", ko: "크레이지 아케이드" },
  { en: "Elsword", ko: "엘소드", officialUrl: "https://www.kog.co.kr/games/elsword" },
  { en: "Closers", ko: "클로저스", officialUrl: "https://www.naddic.co.kr/ko/game/cls/posts/strategy" },
  { en: "Cabal Online", ko: "카발 온라인" },
  { en: "Ragnarok Online", ko: "라그나로크 온라인" },
  { en: "Aion", ko: "아이온", officialUrl: "https://aion.plaync.com/" },
  // ArcheAge 는 2025-03-06 국내 서비스 종료 — DISCONTINUED_TITLES 로 제외됨.
  { en: "ArcheAge", ko: "아키에이지" },
  { en: "The Kingdom of the Winds", ko: "바람의나라" },
  { en: "CrossFire", ko: "크로스파이어", officialUrl: "https://www.smilegate.com/ko/game/crossfire.do" },
  { en: "PUBG: BATTLEGROUNDS", ko: "배틀그라운드" },
  { en: "The First Descendant", ko: "퍼스트 디센던트" },
  { en: "Dave the Diver", ko: "데이브 더 다이버" },
  { en: "Lies of P", ko: "P의 거짓" },
  { en: "The Finals", ko: "더 파이널스" },
  { en: "Throne and Liberty", ko: "쓰론 앤 리버티" },
  { en: "Stellar Blade", ko: "스텔라 블레이드" },
  { en: "NIGHT CROWS", ko: "나이트 크로우" },
  { en: "Eternal Return", ko: "이터널 리턴" },
  { en: "inZOI", ko: "인조이" },
  { en: "Chrono Odyssey", ko: "크로노 오디세이" },

  // ── 국내/아시아 모바일 ──
  { en: "Genshin Impact", ko: "원신" },
  { en: "Honkai Impact 3rd", ko: "붕괴3rd" },
  { en: "Honkai: Star Rail", ko: "붕괴 스타레일" },
  { en: "Zenless Zone Zero", ko: "젠레스 존 제로" },
  { en: "Wuthering Waves", ko: "명조" },
  { en: "Cookie Run: Kingdom", ko: "쿠키런 킹덤" },
  { en: "Cookie Run: OvenBreak", ko: "쿠키런 오븐브레이크" },
  { en: "Seven Knights", ko: "세븐나이츠" },
  { en: "Summoners War: Sky Arena", ko: "서머너즈 워" },
  { en: "Epic Seven", ko: "에픽세븐" },
  { en: "Guardian Tales", ko: "가디언 테일즈" },
  { en: "Ni no Kuni: Cross Worlds", ko: "제2의 나라" },
  { en: "Odin: Valhalla Rising", ko: "오딘 발할라 라이징" },
  { en: "Blade and Soul Revolution", ko: "블레이드앤소울 레볼루션" },
  { en: "Lineage M", ko: "리니지M" },
  { en: "Lineage W", ko: "리니지W" },
  { en: "MIR4", ko: "미르4" },
  { en: "Dragon Raja", ko: "드래곤 라자" },
  { en: "Arknights", ko: "명일방주" },
  { en: "Azur Lane", ko: "벽람항로" },
  { en: "Brown Dust 2", ko: "브라운더스트2" },
  { en: "Goddess of Victory: Nikke", ko: "승리의 여신 니케" },
  { en: "Counter-Side", ko: "카운터사이드" },
  { en: "Punishing: Gray Raven", ko: "퍼니싱 그레이 레이븐" },
  { en: "Marvel Snap", ko: "마블 스냅" },
  { en: "Pokémon UNITE", ko: "포켓몬 유나이트" },
  { en: "League of Legends: Wild Rift", ko: "리그 오브 레전드 와일드 리프트" },
  { en: "Diablo Immortal", ko: "디아블로 이모탈" },
  { en: "Uma Musume: Pretty Derby", ko: "우마무스메 프리티 더비" },
  { en: "Brawl Stars", ko: "브롤스타즈" },
  { en: "Clash Royale", ko: "클래시 로얄" },
  { en: "Clash of Clans", ko: "클래시 오브 클랜" },
  { en: "Blue Archive", ko: "블루 아카이브" },
  { en: "MapleStory M", ko: "메이플스토리M" },
  { en: "Dungeon & Fighter Mobile", ko: "던전앤파이터 모바일" },
  { en: "Ragnarok Origin", ko: "라그나로크 오리진" },

  // ── 콘솔/글로벌 대표작 (탐색 폭 보강) ──
  { en: "Elden Ring", ko: "엘든 링" },
  { en: "The Legend of Zelda: Tears of the Kingdom" },
  { en: "Baldur's Gate 3", ko: "발더스 게이트 3" },
  { en: "Cyberpunk 2077", ko: "사이버펑크 2077" },
  { en: "Hades", ko: "하데스" },
  { en: "Stardew Valley", ko: "스타듀 밸리" },
  { en: "Final Fantasy XIV", ko: "파이널 판타지 14" },
  { en: "Overwatch 2", ko: "오버워치 2" },
  { en: "Valorant", ko: "발로란트" },
  { en: "Counter-Strike 2" },
  { en: "Marvel Rivals", ko: "마블 라이벌즈" },
];

/** RAWG 검색용 영문 타이틀 목록 */
export const SEED_TITLES: string[] = SEED_GAMES.map((s) => s.en);

function normTitle(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** 정규화된 영문명 → 한글명 (GRAC 조회 시 별칭으로 사용) */
export const SEED_KO_BY_EN: Record<string, string> = Object.fromEntries(
  SEED_GAMES.filter((s) => s.ko).map((s) => [normTitle(s.en), s.ko as string]),
);

/** 정규화된 영문명 → 공식 홈페이지 (RAWG 에 스토어 링크가 없을 때 보강용) */
export const SEED_OFFICIAL_URL_BY_EN: Record<string, string> = Object.fromEntries(
  SEED_GAMES.filter((s) => s.officialUrl).map((s) => [normTitle(s.en), s.officialUrl as string]),
);

/**
 * 서비스가 종료된 게임 — 카탈로그 목록에서 제외한다.
 * RAWG 는 서비스 종료 여부를 공식 필드로 제공하지 않는다. 그래서 뉴스/공식
 * 공지로 종료가 "확인된" 게임만 직접 이름(RAWG 상 영문 타이틀)을 추가해
 * 관리한다 — 확신 없는 건 넣지 않는다 (잘못 빼는 것도 사용자 신뢰를 해친다).
 */
export const DISCONTINUED_TITLES: string[] = [
  "KartRider", // 2023-03-31 국내 서비스 종료
  "KartRider: Drift", // 2025-10-16 서비스 종료
  "TERA", // 2022-06-30 국내 서비스 종료
  "ArcheAge", // 2025-03-06 국내 서비스 종료
];

const DISCONTINUED_NORM = new Set(DISCONTINUED_TITLES.map(normTitle));

/** 이 이름의 게임이 서비스 종료 목록에 있는지 (RAWG 영문명 기준 비교) */
export function isDiscontinued(name: string): boolean {
  return DISCONTINUED_NORM.has(normTitle(name));
}

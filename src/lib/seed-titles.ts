/**
 * 카탈로그에 반드시 포함하고 싶은 게임 타이틀.
 * en: RAWG 검색용 (RAWG 는 영문 제목 기준)
 * ko: GRAC 검색용 (게임물관리위원회는 한글 제목 기준)
 * RAWG/GRAC 공식 데이터에 존재하는 항목만 실제로 편입된다.
 */
export interface SeedGame {
  en: string;
  ko?: string;
}

export const SEED_GAMES: SeedGame[] = [
  // ── 국내 온라인 (PC) ──
  { en: "League of Legends", ko: "리그 오브 레전드" },
  { en: "Lost Ark", ko: "로스트아크" },
  { en: "MapleStory", ko: "메이플스토리" },
  { en: "MapleStory 2", ko: "메이플스토리2" },
  { en: "Dungeon Fighter Online", ko: "던전앤파이터" },
  { en: "Black Desert Online", ko: "검은사막" },
  { en: "Lineage", ko: "리니지" },
  { en: "Lineage 2", ko: "리니지2" },
  { en: "Lineage 2M", ko: "리니지2M" },
  { en: "Blade and Soul", ko: "블레이드앤소울" },
  { en: "Mabinogi", ko: "마비노기" },
  { en: "Vindictus", ko: "빈딕투스" },
  { en: "TERA", ko: "테라 온라인" },
  { en: "Sudden Attack", ko: "서든어택" },
  { en: "KartRider", ko: "카트라이더" },
  { en: "KartRider: Drift", ko: "카트라이더 드리프트" },
  { en: "Crazy Arcade", ko: "크레이지레이싱 카트라이더" },
  { en: "Elsword", ko: "엘소드" },
  { en: "Closers", ko: "클로저스" },
  { en: "Cabal Online", ko: "카발 온라인" },
  { en: "Ragnarok Online", ko: "라그나로크 온라인" },
  { en: "Aion", ko: "아이온" },
  { en: "ArcheAge", ko: "아키에이지" },
  { en: "The Kingdom of the Winds", ko: "바람의나라" },
  { en: "CrossFire", ko: "크로스파이어" },
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

/** 정규화된 영문명 → 한글명 (GRAC 조회 시 별칭으로 사용) */
export const SEED_KO_BY_EN: Record<string, string> = Object.fromEntries(
  SEED_GAMES.filter((s) => s.ko).map((s) => [
    s.en.toLowerCase().replace(/[^a-z0-9]/g, ""),
    s.ko as string,
  ]),
);

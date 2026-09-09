import type { Game } from "./types";

/**
 * RAWG_API_KEY / Supabase 가 설정되지 않았을 때 사용하는 샘플 데이터.
 * 개발 서버를 키 없이도 바로 확인할 수 있도록 하기 위한 용도이며,
 * 실제 서비스에서는 RAWG API 응답이 이 자리를 대체한다.
 */
export const SAMPLE_GAMES: Game[] = [
  {
    id: 3498,
    slug: "grand-theft-auto-v",
    name: "Grand Theft Auto V",
    description:
      "로스 산토스를 배경으로 세 명의 주인공이 얽히는 오픈월드 범죄 액션. 방대한 싱글플레이와 지속적으로 갱신되는 온라인 모드를 함께 제공한다.",
    background_image:
      "https://media.rawg.io/media/games/456/456dea5e1c7e3cd07060c14e96612001.jpg",
    genres: ["액션", "어드벤처"],
    platform_kinds: ["pc", "console"],
    raw_platforms: ["PC", "PlayStation 5", "Xbox Series S/X", "PlayStation 4"],
    released: "2013-09-17",
    metacritic: 92,
    rawg_rating: 4.47,
    rawg_ratings_count: 6800,
    stores: [
      { store: "Steam", url: "https://store.steampowered.com/app/271590" },
    ],
    steam_appid: "271590",
    steam_positive_pct: 86,
    steam_review_count: 1600000,
  },
  {
    id: 3328,
    slug: "the-witcher-3-wild-hunt",
    name: "The Witcher 3: Wild Hunt",
    description:
      "괴물 사냥꾼 게롤트가 되어 광활한 대륙을 여행하며 양자택일이 어려운 선택과 결과를 마주하는 서사 중심 오픈월드 RPG.",
    background_image:
      "https://media.rawg.io/media/games/618/618c2031a07bbff6b4f611f10b6bcdbc.jpg",
    genres: ["액션", "RPG"],
    platform_kinds: ["pc", "console"],
    raw_platforms: ["PC", "PlayStation 5", "Nintendo Switch", "Xbox Series S/X"],
    released: "2015-05-18",
    metacritic: 92,
    rawg_rating: 4.65,
    rawg_ratings_count: 7100,
    stores: [
      { store: "Steam", url: "https://store.steampowered.com/app/292030" },
    ],
    steam_appid: "292030",
    steam_positive_pct: 97,
    steam_review_count: 800000,
  },
  {
    id: 58175,
    slug: "god-of-war",
    name: "God of War (2018)",
    description:
      "북유럽 신화를 배경으로 크레토스와 아들 아트레우스의 여정을 그린 액션 어드벤처. 원 컷 연출과 무게감 있는 전투가 특징이다.",
    background_image:
      "https://media.rawg.io/media/games/4be/4be6a6ad6d9dbf329dc62c1c9f2e8a3b.jpg",
    genres: ["액션", "어드벤처"],
    platform_kinds: ["pc", "console"],
    raw_platforms: ["PC", "PlayStation 5", "PlayStation 4"],
    released: "2018-04-20",
    metacritic: 94,
    rawg_rating: 4.57,
    rawg_ratings_count: 4200,
    stores: [
      { store: "Steam", url: "https://store.steampowered.com/app/1593500" },
    ],
    steam_appid: "1593500",
    steam_positive_pct: 95,
    steam_review_count: 78000,
  },
  {
    id: 4200,
    slug: "portal-2",
    name: "Portal 2",
    description:
      "포탈 건으로 공간을 잇는 1인칭 퍼즐. 블랙 유머 가득한 스토리와 협동 모드로 장르의 기준이 된 작품.",
    background_image:
      "https://media.rawg.io/media/games/2ba/2bac0e87cf45e5b508f227d281c9252a.jpg",
    genres: ["퍼즐", "슈터"],
    platform_kinds: ["pc", "console"],
    raw_platforms: ["PC", "PlayStation 3", "Xbox 360"],
    released: "2011-04-18",
    metacritic: 95,
    rawg_rating: 4.61,
    rawg_ratings_count: 5200,
    stores: [
      { store: "Steam", url: "https://store.steampowered.com/app/620" },
    ],
    steam_appid: "620",
    steam_positive_pct: 98,
    steam_review_count: 300000,
  },
  {
    id: 28,
    slug: "red-dead-redemption-2",
    name: "Red Dead Redemption 2",
    description:
      "1899년 미국 서부, 무법자 무리의 몰락을 따라가는 오픈월드 액션 어드벤처. 방대한 디테일과 느린 호흡의 연출이 특징이다.",
    background_image:
      "https://media.rawg.io/media/games/511/5118aff5091cb3efec399c808f8c598f.jpg",
    genres: ["액션", "어드벤처"],
    platform_kinds: ["pc", "console"],
    raw_platforms: ["PC", "PlayStation 4", "Xbox One"],
    released: "2018-10-26",
    metacritic: 96,
    rawg_rating: 4.59,
    rawg_ratings_count: 4600,
    stores: [
      { store: "Steam", url: "https://store.steampowered.com/app/1174180" },
    ],
    steam_appid: "1174180",
    steam_positive_pct: 90,
    steam_review_count: 400000,
  },
  {
    id: 9767,
    slug: "hollow-knight",
    name: "Hollow Knight",
    description:
      "무너진 곤충 왕국 할로우네스트를 탐험하는 2D 메트로배니아. 촘촘한 맵 설계와 높은 난이도, 서정적인 분위기로 사랑받았다.",
    background_image:
      "https://media.rawg.io/media/games/4cf/4cfc6b7f1850590a4634b08bfab308ab.jpg",
    genres: ["액션", "플랫포머", "인디"],
    platform_kinds: ["pc", "console"],
    raw_platforms: ["PC", "Nintendo Switch", "PlayStation 4", "Xbox One"],
    released: "2017-02-24",
    metacritic: 90,
    rawg_rating: 4.4,
    rawg_ratings_count: 3300,
    stores: [
      { store: "Steam", url: "https://store.steampowered.com/app/367520" },
    ],
    steam_appid: "367520",
    steam_positive_pct: 97,
    steam_review_count: 500000,
  },
  {
    id: 500001,
    slug: "genshin-impact",
    name: "Genshin Impact",
    description:
      "티바트 대륙을 무대로 한 오픈월드 액션 RPG. 원소 조합 전투와 탐험이 중심이며, 캐릭터·무기 획득에 확률형 뽑기가 사용된다.",
    background_image:
      "https://media.rawg.io/media/games/8a0/8a02f84a5916ede2f923b88d5f8df603.jpg",
    genres: ["액션", "RPG", "오픈월드"],
    platform_kinds: ["mobile", "pc", "console"],
    raw_platforms: ["Android", "iOS", "PC", "PlayStation 5"],
    released: "2020-09-28",
    metacritic: null,
    rawg_rating: 3.8,
    rawg_ratings_count: 900,
    stores: [
      {
        store: "Google Play",
        url: "https://play.google.com/store/apps/details?id=com.miHoYo.GenshinImpact",
      },
      { store: "App Store", url: "https://apps.apple.com/app/id1517783697" },
    ],
    steam_appid: null,
    steam_positive_pct: null,
    steam_review_count: null,
  },
  {
    id: 500002,
    slug: "clash-royale",
    name: "Clash Royale",
    description:
      "실시간 1:1 카드 배틀. 3분 안에 상대 타워를 부수는 간결한 규칙과, 카드 강화를 위한 상자·과금 구조가 특징이다.",
    background_image:
      "https://media.rawg.io/media/screenshots/0f6/0f6c3cf2c9df1c1cd0f0b46f9c0f4a3f.jpg",
    genres: ["전략", "실시간 전략"],
    platform_kinds: ["mobile"],
    raw_platforms: ["Android", "iOS"],
    released: "2016-03-02",
    metacritic: null,
    rawg_rating: 3.5,
    rawg_ratings_count: 420,
    stores: [
      {
        store: "Google Play",
        url: "https://play.google.com/store/apps/details?id=com.supercell.clashroyale",
      },
      { store: "App Store", url: "https://apps.apple.com/app/id1053012308" },
    ],
    steam_appid: null,
    steam_positive_pct: null,
    steam_review_count: null,
  },
  {
    id: 500003,
    slug: "vampire-survivors",
    name: "Vampire Survivors",
    description:
      "쏟아지는 적을 자동 공격으로 정리하며 빌드를 쌓는 로그라이트. 저렴한 가격에 방대한 콘텐츠로 입소문을 탔다.",
    background_image:
      "https://media.rawg.io/media/games/e0f/e0f7b3e4a4c2c1f7b9a2b2e0a9d3f5a1.jpg",
    genres: ["액션", "로그라이크", "인디"],
    platform_kinds: ["pc", "mobile", "console"],
    raw_platforms: ["PC", "Android", "iOS", "Nintendo Switch", "Xbox One"],
    released: "2022-10-20",
    metacritic: 87,
    rawg_rating: 4.2,
    rawg_ratings_count: 1100,
    stores: [
      { store: "Steam", url: "https://store.steampowered.com/app/1794680" },
      {
        store: "Google Play",
        url: "https://play.google.com/store/apps/details?id=com.poncle.vampiresurvivors",
      },
    ],
    steam_appid: "1794680",
    steam_positive_pct: 97,
    steam_review_count: 250000,
  },
];

export function getSampleGamesByPlatform(kind: string): Game[] {
  return SAMPLE_GAMES.filter((g) => g.platform_kinds.includes(kind as never));
}

export function getSampleGame(idOrSlug: string): Game | undefined {
  return SAMPLE_GAMES.find(
    (g) => String(g.id) === idOrSlug || g.slug === idOrSlug,
  );
}

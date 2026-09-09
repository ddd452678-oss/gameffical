import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-24 text-center">
      <h1 className="text-2xl font-extrabold">페이지를 찾을 수 없습니다</h1>
      <p className="mt-2 text-sm text-text-dim">
        요청하신 게임이나 페이지가 존재하지 않습니다.
      </p>
      <Link
        href="/"
        className="mt-7 inline-block rounded-2xl bg-brand px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-dim"
      >
        메인으로 돌아가기
      </Link>
    </div>
  );
}

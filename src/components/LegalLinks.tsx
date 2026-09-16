"use client";

import { useState } from "react";
import { Modal } from "./Modal";

function TermsContent() {
  return (
    <div className="space-y-4">
      <p>시행일: 2026년 9월 16일</p>

      <section>
        <h3 className="mb-1 font-bold text-text">제1조 (목적)</h3>
        <p>
          이 약관은 겜피셜(이하 &ldquo;서비스&rdquo;)이 제공하는 게임 정보
          탐색, 유저 리뷰, 자유게시판 이용과 관련해 서비스와 이용자의 권리,
          의무 및 책임사항을 정하는 것을 목적으로 합니다.
        </p>
      </section>

      <section>
        <h3 className="mb-1 font-bold text-text">제2조 (서비스의 내용)</h3>
        <p>
          서비스는 RAWG, Steam, 게임물관리위원회(GRAC) 등 공식 API를 통해
          수집한 게임 카탈로그·평점 정보를 제공하며, 이용자가 직접 작성하는
          유저 리뷰(재미도, 과금 부담도, 확률형 아이템 투명성 평가 포함)와
          자유게시판 게시물을 게재합니다.
        </p>
      </section>

      <section>
        <h3 className="mb-1 font-bold text-text">제3조 (회원가입 및 계정)</h3>
        <p>
          리뷰 작성 및 게시판 이용은 카카오, 구글, 또는 이메일(아이디) 계정으로
          로그인한 이용자만 가능합니다. 게임 정보 열람과 검색은 로그인 없이도
          이용할 수 있습니다. 계정은 본인만 사용해야 하며, 계정 정보 관리
          소홀로 발생하는 불이익에 대한 책임은 이용자 본인에게 있습니다.
        </p>
      </section>

      <section>
        <h3 className="mb-1 font-bold text-text">제4조 (이용자의 의무)</h3>
        <p>이용자는 다음 행위를 해서는 안 됩니다.</p>
        <ul className="mt-1 list-disc space-y-0.5 pl-5">
          <li>허위 정보 또는 타인의 명예를 훼손하는 내용의 게시</li>
          <li>타인의 계정을 도용하거나 여러 계정을 만들어 반복적으로 리뷰·댓글을 남기는 행위</li>
          <li>서비스의 정상적인 운영을 방해하는 행위(자동화된 접근, 대량 요청 등)</li>
          <li>관련 법령 및 공서양속에 반하는 내용의 게시</li>
        </ul>
      </section>

      <section>
        <h3 className="mb-1 font-bold text-text">제5조 (게시물의 관리)</h3>
        <p>
          이용자가 작성한 리뷰·게시글·댓글의 저작권은 작성자 본인에게
          있습니다. 다만 제4조를 위반하거나 관련 법령에 저촉되는 게시물은
          운영자가 사전 통지 없이 삭제할 수 있습니다.
        </p>
      </section>

      <section>
        <h3 className="mb-1 font-bold text-text">제6조 (서비스의 변경 및 중단)</h3>
        <p>
          운영자는 서비스의 전부 또는 일부를 운영상, 기술상의 필요에 따라
          변경하거나 중단할 수 있으며, 이 경우 사전에 공지합니다. 다만
          긴급한 경우 사후에 공지할 수 있습니다.
        </p>
      </section>

      <section>
        <h3 className="mb-1 font-bold text-text">제7조 (면책조항)</h3>
        <p>
          서비스가 제공하는 종합 평점 및 게임 정보는 RAWG, Steam, GRAC 등
          외부 공식 데이터에 기반하며, 정확성을 완전히 보장하지 않습니다.
          유저 리뷰는 작성자 개인의 의견으로, 서비스의 공식 입장이 아닙니다.
        </p>
      </section>

      <section>
        <h3 className="mb-1 font-bold text-text">제8조 (약관의 변경)</h3>
        <p>
          이 약관은 필요한 경우 개정될 수 있으며, 개정 시 서비스 내 공지를
          통해 안내합니다.
        </p>
      </section>
    </div>
  );
}

function PrivacyContent() {
  return (
    <div className="space-y-4">
      <p>시행일: 2026년 9월 16일</p>

      <section>
        <h3 className="mb-1 font-bold text-text">1. 수집하는 개인정보 항목</h3>
        <ul className="list-disc space-y-0.5 pl-5">
          <li>이메일 로그인: 아이디, 이메일 주소, 비밀번호(암호화 저장)</li>
          <li>카카오·구글 로그인: 프로필 닉네임, 이메일 주소(제공에 동의한 경우)</li>
          <li>서비스 이용 중 자발적으로 작성한 내용: 리뷰, 게시글, 댓글, 선호 장르</li>
          <li>로그인 유지를 위한 세션 쿠키</li>
        </ul>
      </section>

      <section>
        <h3 className="mb-1 font-bold text-text">2. 수집 목적</h3>
        <p>
          회원 식별 및 로그인 유지, 리뷰·게시판 작성자 표시, 중복 리뷰 방지
          (게임당 1인 1리뷰), 아이디·비밀번호 찾기 처리, 향후 선호 장르 기반
          게임 추천 기능 제공을 위해 사용합니다.
        </p>
      </section>

      <section>
        <h3 className="mb-1 font-bold text-text">3. 보유 및 이용 기간</h3>
        <p>
          회원 탈퇴 시 계정 정보와 작성한 리뷰·게시글·댓글·좋아요 기록은
          지체 없이 파기됩니다. 관련 법령에 따라 보관이 필요한 정보가 있는
          경우 해당 기간 동안만 별도 보관합니다.
        </p>
      </section>

      <section>
        <h3 className="mb-1 font-bold text-text">4. 제3자 제공 및 처리 위탁</h3>
        <p>
          수집한 개인정보를 외부에 판매하거나 제공하지 않습니다. 다만 서비스
          운영을 위해 아래 업체에 처리를 위탁하고 있습니다.
        </p>
        <ul className="mt-1 list-disc space-y-0.5 pl-5">
          <li>Supabase(데이터베이스 및 로그인 인증 처리)</li>
          <li>Vercel(웹사이트 호스팅)</li>
        </ul>
      </section>

      <section>
        <h3 className="mb-1 font-bold text-text">5. 이용자의 권리</h3>
        <p>
          이용자는 마이페이지에서 언제든 본인의 선호 장르 정보를 수정하고,
          비밀번호를 변경하며, 회원탈퇴를 통해 본인의 개인정보 삭제를 요청할
          수 있습니다.
        </p>
      </section>

      <section>
        <h3 className="mb-1 font-bold text-text">6. 문의처</h3>
        <p>개인정보 관련 문의는 서비스 내 게시판을 통해 남겨주세요.</p>
      </section>
    </div>
  );
}

export function LegalLinks() {
  const [open, setOpen] = useState<"terms" | "privacy" | null>(null);

  return (
    <>
      <div className="mt-3 flex gap-3">
        <button
          type="button"
          onClick={() => setOpen("terms")}
          className="font-semibold text-text-dim hover:text-text hover:underline"
        >
          이용약관
        </button>
        <button
          type="button"
          onClick={() => setOpen("privacy")}
          className="font-semibold text-text-dim hover:text-text hover:underline"
        >
          개인정보처리방침
        </button>
      </div>

      {open === "terms" && (
        <Modal title="이용약관" onClose={() => setOpen(null)}>
          <TermsContent />
        </Modal>
      )}
      {open === "privacy" && (
        <Modal title="개인정보처리방침" onClose={() => setOpen(null)}>
          <PrivacyContent />
        </Modal>
      )}
    </>
  );
}

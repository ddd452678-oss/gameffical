import type { Metadata } from "next";

export const metadata: Metadata = { title: "비밀번호 재설정 — 겜피셜" };

export default function ResetPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

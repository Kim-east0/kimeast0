import type { Metadata } from "next";
import "./globals.css";
import { DashboardProvider } from "@/state/dashboard";
import { Shell } from "@/components/Shell";

export const metadata: Metadata = {
  title: "현장별 공정·기성 대시보드",
  description: "교육용 가상 자료로 만든 현장별 공정·기성 대시보드",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <DashboardProvider>
          <Shell>{children}</Shell>
        </DashboardProvider>
      </body>
    </html>
  );
}

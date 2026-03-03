import { CommunityDashboard } from "@/components/CommunityDashboard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function PublicDashboardPage() {
  return (
    <main className="public-theme">
      <div className="container public-shell">
        <CommunityDashboard />
      </div>
    </main>
  );
}

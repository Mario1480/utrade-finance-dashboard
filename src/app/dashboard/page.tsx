import { cookies } from "next/headers";
import { CommunityDashboard } from "@/components/CommunityDashboard";
import { PublicDashboardHeader } from "@/components/PublicDashboardHeader";
import { PUBLIC_LANG_COOKIE, resolvePublicLanguage } from "@/lib/public-i18n";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PublicDashboardPageProps = {
  searchParams?: Promise<{
    lang?: string | string[];
  }>;
};

export default async function PublicDashboardPage({ searchParams }: PublicDashboardPageProps) {
  const params = (await searchParams) ?? {};
  const cookieStore = await cookies();

  const lang = resolvePublicLanguage(
    params.lang,
    cookieStore.get(PUBLIC_LANG_COOKIE)?.value,
  );

  return (
    <main className="public-theme">
      <div className="container public-shell">
        <PublicDashboardHeader lang={lang} />
        <CommunityDashboard lang={lang} />
      </div>
    </main>
  );
}

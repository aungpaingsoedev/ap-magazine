import Link from 'next/link';
import { getSiteSettings } from '@/lib/queries/taxonomy';

const DEVELOPER_NAME = 'Aung Paing Soe';

export async function SiteFooter() {
  const settings = await getSiteSettings();
  const siteName = settings?.siteName ?? 'AP Magazine';
  const year = new Date().getFullYear();
  const customNote = settings?.footerText?.trim();

  return (
    <footer className="mt-auto border-t-2 border-dashed border-ink/30">
      <div className="site-pad flex flex-col gap-2 py-8 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
        <p className="text-sm text-muted">
          © {year} {siteName}
          {customNote && customNote !== siteName ? (
            <span className="text-muted/80"> · {customNote}</span>
          ) : null}
        </p>
        <p className="text-sm text-muted">
          <Link
            href="/profile"
            className="font-medium text-ink underline decoration-dashed underline-offset-4 transition-opacity hover:opacity-65"
          >
            Developed by {DEVELOPER_NAME}
          </Link>
        </p>
      </div>
    </footer>
  );
}

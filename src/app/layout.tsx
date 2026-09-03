import type { Metadata } from 'next';
import { Kalam } from 'next/font/google';
import './globals.css';
import { getSiteSettings } from '@/lib/queries/taxonomy';

const kalam = Kalam({
  variable: '--font-kalam',
  subsets: ['latin'],
  weight: ['300', '400', '700'],
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const siteName = settings?.siteName ?? 'AP Magazine';

  return {
    title: {
      default: settings?.defaultSeoTitle || siteName,
      template: `%s · ${siteName}`,
    },
    description:
      settings?.defaultSeoDescription ||
      settings?.description ||
      'Stories, essays, and culture from the community',
    icons: settings?.favicon ? { icon: settings.favicon } : undefined,
  };
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      className={`${kalam.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col text-ink">
        {children}
      </body>
    </html>
  );
}

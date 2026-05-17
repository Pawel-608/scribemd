import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'scribemd',
  description: 'Collaborative markdown workspace for writing alongside Claude',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans">{children}</body>
    </html>
  );
}

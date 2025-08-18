import './globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'Really Chat'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="sv">
      <body className="bg-white text-black">
        {children}
      </body>
    </html>
  );
}

import { ReactNode } from 'react';
import { Providers } from '@/components/Providers';

export const metadata = {
  title: 'FlowDash',
  description: 'Inventory management for factories',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
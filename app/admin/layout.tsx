import React from 'react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full min-w-0 px-5 sm:px-8 lg:px-10 xl:px-12 py-6 sm:py-8">
      <div className="w-full max-w-7xl">
        {children}
      </div>
    </div>
  );
}

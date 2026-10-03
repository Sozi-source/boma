import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Boma — Contributions & Chamas',
    short_name: 'Boma',
    description: 'Collect and track contributions for family, events and needs. Every member sees every shilling.',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#f7f7f7',
    theme_color: '#0f8579',
    icons: [
      {
        src: '/assets/icons/icon-48x48.png',
        sizes: '48x48',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/assets/icons/icon-72x72.png',
        sizes: '72x72',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/assets/icons/icon-96x96.png',
        sizes: '96x96',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/assets/icons/icon-128x128.png',
        sizes: '128x128',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/assets/icons/icon-144x144.png',
        sizes: '144x144',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/assets/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/assets/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/assets/icons/icon-384x384.png',
        sizes: '384x384',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/assets/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/assets/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}

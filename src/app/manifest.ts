import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Minions Post Studio — LinkedIn posts in your voice',
    short_name: 'Post Studio',
    description: 'Weekly LinkedIn posts from your own experience, in your own voice.',
    start_url: '/',
    id: '/',
    display: 'standalone',
    background_color: '#070B0F',
    theme_color: '#070B0F',
    orientation: 'portrait-primary',
    scope: '/',
    categories: ['productivity', 'business', 'utilities'],
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
    shortcuts: [
      {
        name: 'Idea Stream',
        short_name: 'Ideas',
        description: 'Harvested topic signals and editorial queues',
        url: '/ideas',
        icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }],
      },
      {
        name: 'Editorial Studio',
        short_name: 'Editorial',
        description: 'Claims verification gate and 1-click publishing',
        url: '/editorial',
        icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }],
      },
      {
        name: 'Published Posts',
        short_name: 'Published',
        description: 'Live omnichannel broadcasts and performance metrics',
        url: '/published',
        icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }],
      },
    ],
  };
}

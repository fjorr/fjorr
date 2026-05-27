export default function manifest() {
  return {
    name: 'Fjorr Myth Engine',
    short_name: 'Fjorr',
    description: 'Short, premium cinematic stories built to form the imagination.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0B0B0C',
    theme_color: '#0B0B0C',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  };
}
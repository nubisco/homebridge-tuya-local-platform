import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Homebridge Tuya Local Platform',
  description: 'Control Tuya devices locally over LAN through Apple HomeKit.',

  base: '/homebridge-tuya-local-platform/',

  head: [
    ['link', { rel: 'icon', href: '/homebridge-tuya-local-platform/favicon.ico' }],
    ['meta', { name: 'theme-color', content: '#2f855a' }],
    ['meta', { name: 'keywords', content: 'homebridge, tuya, local, homekit, plugin' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: 'Homebridge Tuya Local Platform' }],
    ['meta', { property: 'og:description', content: 'Control Tuya devices locally over LAN through Apple HomeKit.' }],
    [
      'script',
      {
        defer: '',
        src: 'https://nubisco-analytics.nubisco-6bc.workers.dev/script.js',
      },
    ],
  ],
  sitemap: {
    hostname: 'https://docs.nubisco.io/homebridge-tuya-local-platform/',
  },

  lastUpdated: true,

  themeConfig: {
    siteTitle: 'Local Platform',
    logo: { src: '/logo-mini.svg', width: 80, height: 24 },
    nav: [
      { text: 'Guide', link: '/introduction' },
      { text: 'Configuration', link: '/configuration' },
      {
        text: 'Links',
        items: [
          { text: 'npm', link: 'https://www.npmjs.com/package/@nubisco/homebridge-tuya-local-platform' },
          { text: 'GitHub', link: 'https://github.com/nubisco/homebridge-tuya-local-platform' },
        ],
      },
    ],

    sidebar: [
      {
        text: 'Getting Started',
        items: [
          { text: 'Introduction', link: '/introduction' },
          { text: 'Installation', link: '/installation' },
          { text: 'Getting Local Keys', link: '/get-local-keys' },
        ],
      },
      {
        text: 'Configuration',
        items: [
          { text: 'Configuration', link: '/configuration' },
          { text: 'Supported Device Types', link: '/device-types' },
          { text: 'Examples', link: '/config-example' },
        ],
      },
      {
        text: 'Help',
        items: [
          { text: 'Troubleshooting', link: '/troubleshooting' },
          { text: 'Known Issues', link: '/known-issues' },
        ],
      },
      {
        text: 'Community',
        items: [
          { text: 'Contributing', link: '/contributing' },
          { text: 'Credits', link: '/credits' },
        ],
      },
    ],

    socialLinks: [{ icon: 'github', link: 'https://github.com/nubisco/homebridge-tuya-local-platform' }],

    editLink: {
      pattern: 'https://github.com/nubisco/homebridge-tuya-local-platform/edit/master/docs/:path',
      text: 'Edit this page on GitHub',
    },

    search: {
      provider: 'local',
    },

    lastUpdated: {
      text: 'Last updated',
    },

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2026 Nubisco',
    },
  },
})

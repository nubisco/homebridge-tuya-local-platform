import { defineConfig } from 'vitepress'

/** Getting a device working: what almost every reader came for. */
const usingIt = [
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
    text: 'Working on the plugin',
    items: [{ text: 'Contributing', link: '/contributing' }],
  },
]

/** Working on the plugin rather than with it. */
const contributing = [
  {
    text: 'Contributing',
    items: [
      { text: 'How to contribute', link: '/contributing' },
      { text: 'Known Issues', link: '/known-issues' },
      { text: 'Credits', link: '/credits' },
    ],
  },
  {
    text: 'Back to the guide',
    items: [{ text: 'Using the plugin', link: '/introduction' }],
  },
]

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
        src: 'https://analytics.nubisco.io/script.js',
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
    // TWO DOORS, SPLIT BY ACTIVITY, NOT PERSONA. Everyone reading this is the
    // same self-hosting person: install, local keys, JSON config,
    // troubleshooting. A users versus developers split would put a door here
    // with nobody behind it. What differs is what you came to do. See
    // "Documentation sites" in the workspace AGENTS.md for the plugin tier.
    nav: [
      { text: 'Using it', link: '/introduction' },
      { text: 'Contributing', link: '/contributing' },
      {
        text: 'Project',
        items: [
          { text: 'Repository', link: 'https://github.com/nubisco/homebridge-tuya-local-platform' },
          { text: 'npm', link: 'https://www.npmjs.com/package/@nubisco/homebridge-tuya-local-platform' },
          {
            text: 'Contributing',
            link: 'https://github.com/nubisco/homebridge-tuya-local-platform/blob/master/CONTRIBUTING.md',
          },
          { text: 'Sponsor', link: 'https://github.com/sponsors/joseporto' },
        ],
      },
      {
        text: 'Nubisco',
        items: [
          { text: 'nubisco.io', link: 'https://nubisco.io' },
          { text: 'OpenBridge', link: 'https://github.com/nubisco/openbridge' },
          { text: 'Nubisco UI', link: 'https://docs.nubisco.io/ui/' },
          { text: 'Acta', link: 'https://docs.nubisco.io/acta/' },
        ],
      },
    ],

    // Every page sits at the root, so the two halves are keyed page by page
    // rather than by directory. Nothing moves, so no published URL changes.
    sidebar: {
      '/contributing': contributing,
      '/credits': contributing,
      '/': usingIt,
    },

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
      message:
        'Released under the <a href="https://github.com/nubisco/homebridge-tuya-local-platform/blob/master/LICENSE">MIT License</a>. · <a href="https://github.com/sponsors/joseporto">♥ Sponsor this project</a>',
      copyright: 'Copyright © 2026 <a href="https://nubisco.io">Nubisco</a>',
    },
  },
})

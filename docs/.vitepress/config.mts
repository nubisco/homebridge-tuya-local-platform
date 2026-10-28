import { defineNubiscoDocs } from '@nubisco/docs-sdk'

export default defineNubiscoDocs({
  title: 'Homebridge Tuya Local Platform',
  description: 'Control Tuya devices locally over LAN through Apple HomeKit.',
  base: '/homebridge-tuya-local-platform/',
  hostname: 'https://docs.nubisco.io/homebridge-tuya-local-platform/',
  repo: 'nubisco/homebridge-tuya-local-platform',
  nav: [
    { text: 'Using it', link: '/introduction' },
    { text: 'Contributing', link: '/contributing' },
    {
      text: 'Project',
      items: [
        { text: 'Repository', link: 'https://github.com/nubisco/homebridge-tuya-local-platform' },
        {
          text: 'npm',
          link: 'https://www.npmjs.com/package/@nubisco/homebridge-tuya-local-platform',
        },
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
  sidebar: {
    '/contributing': [
      {
        text: 'Contributing',
        items: [
          { text: 'How to contribute', link: '/contributing' },
          { text: 'Known Issues', link: '/known-issues' },
          { text: 'Credits', link: '/credits' },
        ],
      },
      { text: 'Back to the guide', items: [{ text: 'Using the plugin', link: '/introduction' }] },
    ],
    '/credits': [
      {
        text: 'Contributing',
        items: [
          { text: 'How to contribute', link: '/contributing' },
          { text: 'Known Issues', link: '/known-issues' },
          { text: 'Credits', link: '/credits' },
        ],
      },
      { text: 'Back to the guide', items: [{ text: 'Using the plugin', link: '/introduction' }] },
    ],
    '/': [
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
          { text: 'Matter', link: '/matter' },
        ],
      },
      {
        text: 'Help',
        items: [
          { text: 'Troubleshooting', link: '/troubleshooting' },
          { text: 'Known Issues', link: '/known-issues' },
        ],
      },
      { text: 'Working on the plugin', items: [{ text: 'Contributing', link: '/contributing' }] },
    ],
  },
  footer: {
    message:
      'Released under the <a href="https://github.com/nubisco/homebridge-tuya-local-platform/blob/master/LICENSE">MIT License</a>. · <a href="https://github.com/sponsors/joseporto">♥ Sponsor this project</a>',
    copyright: 'Copyright © 2026 <a href="https://nubisco.io">Nubisco</a>',
  },
  vitepress: {
    head: [
      ['meta', { name: 'keywords', content: 'homebridge, tuya, local, homekit, plugin' }],
      ['meta', { property: 'og:type', content: 'website' }],
      ['meta', { property: 'og:title', content: 'Homebridge Tuya Local Platform' }],
      [
        'meta',
        {
          property: 'og:description',
          content: 'Control Tuya devices locally over LAN through Apple HomeKit.',
        },
      ],
    ],
  },
})

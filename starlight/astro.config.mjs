import { defineConfig } from 'astro/config'
import starlight from '@astrojs/starlight'
import react from '@astrojs/react'

// https://astro.build/config
export default defineConfig({
    outDir: '../docs',
    base: '/regit',
    integrations: [
        react(),
        starlight({
            title: '',
            logo: {
                src: './src/assets/ReGit_icon.svg',
                alt: 'ReGit Logo',
                replacesTitle: true,
            },
            customCss: ['./src/styles.css'],
            social: {
                github: 'https://github.com/alwex/regit',
            },
            sidebar: [
                {
                    label: 'Start Here',
                    autogenerate: {
                        directory: 'guides',
                    },
                    // items: [
                    //     // Each item here is one entry in the navigation menu.
                    //     {
                    //         label: 'Getting Started',
                    //         link: '/guides/getting-started/',
                    //     },
                    // ],
                },
                {
                    label: 'Reference',
                    autogenerate: {
                        directory: 'reference',
                    },
                },
            ],
        }),
    ],
})

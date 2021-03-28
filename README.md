# personal-site

[![Netlify Status](https://api.netlify.com/api/v1/badges/c1a88cbf-5c05-4921-bacb-6cd1c0d2bea2/deploy-status)](https://app.netlify.com/sites/hardcore-williams-e4ea5c/deploys)

Repository that runs [vinaybhinde.in](https://vinaybhinde.in), my personal site. This repo is forked from https://github.com/jeremenichelli/personal-site and all credit for the initial design and UI goes to [jeremenichelli.io](https://jeremenichelli.io).

This project is built using [Eleventy](//11ty.com) by [Zach Leatherman](//github.com/zachleat) and hosted by [Netlify](//netlify.com). Liquid is used for templates and Markdown for content.

## Scripts

In order to run the site locally you will need the latest LTS version of [Node.js](https://nodejs.org) and [yarn](//yarnpkg.com). To serve the site locally first generate all assets. All initial assets are in `src` and get exported to `assets` and `_includes` folders.

### Serve

Start the Eleventy local server by running `yarn serve`.

### Assets

Doing `yarn assets` in the terminal generates styles, scripts, favicons and images before the build.

### Styles

The project uses [LESS](//lesscss.org) to generate inlined styles templates that go to `_includes/styles`.

You can process all styles by running `yarn less`.

### Scripts

Running `yarn bundle` creates a short amount of JavaScript in `_includes/scripts` that gets inlined and a `font.js` file inside `assets/js` which gets async loaded and handles web font loading strategy.

### Favicons

Running `yarn favicons` generates a template partial in `_includes` folder and exporting all favicon images in `assets/favicon` at the same time.

### Images

The rest of images needed are processed by running `yarn images`.

### Release

On each deployment, `yarn release` runs `yarn assets` and `yarn build` to trigger an Eleventy build.

## License

This site design and content is licensed under [Apache License 2.0](https://choosealicense.com/licenses/apache-2.0/).

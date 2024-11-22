# neptune plugin template
This is a repository template for a neptune plugin monorepo.

Each plugin in the `plugins/` directory will be automatically built by running `pnpm run build` to their respective `dist/` folder.

## credits
- a lot of the inspiration, plus everything in plugins/_lib/ is from [Inrixia's](https://github.com/Inrixia) [neptune-plugins repo](https://github.com/Inrixia/neptune-plugins).

## a small list of plugins and themes

- EddyAPI: Adds a read-only now playing API. `https://espeon.github.io/neptune-plugins/EddyAPI`
  - Serves a JSON object with various info about the current track at /now-playing.
  - The "position" field is updated both on tidal-reported time and the difference between marked last update time and now.

- TidalTweaks: Adds a few styling tweaks to Tidal, including blurred album backdrops. `https://espeon.github.io/neptune-plugins/themes/tweaks.css`

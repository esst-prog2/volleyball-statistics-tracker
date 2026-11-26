# Marina Markova promo video

This HyperFrames composition produces the silent 30-second video embedded on the promo page. The three PNGs are captures of the [CEV match report](../../samples/cev-82229.html) and the tracker's score and player views for [match 82229](../../samples/cev-82229-full-match.csv).

The attack breakdown uses Markova’s CSV row. She scored on 30 of 54 attempts (55.6%, rounded to one decimal). Eight were blocked, three were errors, and the remaining 13 stayed in play.

## Render

From the repository root, with Node.js 24, Chrome, FFmpeg and ffprobe available:

```sh
render_dir=$(mktemp -d)
mkdir "$render_dir/markova"
cp video/markova/index.html video/markova/*.png "$render_dir/markova/"
npm install --prefix "$render_dir" hyperframes@0.9.77 gsap@3.15.0
cp "$render_dir/node_modules/gsap/dist/gsap.min.js" "$render_dir/markova/"
"$render_dir/node_modules/.bin/hyperframes" render "$render_dir/markova" \
  --output "$PWD/docs/media/markova-match-report.mp4" \
  --fps 24 --workers 2 --quality looks --strict --no-browser-gpu
```

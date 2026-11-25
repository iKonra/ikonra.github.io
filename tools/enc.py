# EXR lineal -> PNG codificado (x/1.15)^(1/2.6)
import bpy, sys, numpy as np, os
OUT = sys.argv[-1]
for g in ('shell', 'desk', 'art'):
    im = bpy.data.images.load(os.path.join(OUT, f'bake_{g}.exr')); im.colorspace_settings.name = 'Non-Color'
    w, h = im.size; a = np.empty(w * h * 4, np.float32); im.pixels.foreach_get(a); a = a.reshape(h, w, 4)
    rgb = np.clip(a[..., :3], 0, 1.15)
    print(g, 'media', rgb[a[..., 3] > 0].mean(0), 'p99', np.percentile(rgb[a[..., 3] > 0], 99), 'cubierto', (a[..., 3] > 0).mean())
    # quita puntos sueltos: mediana 3x3 donde un texel se aparta mucho
    st = np.stack([np.roll(np.roll(rgb, i, 0), j, 1) for i in (-1, 0, 1) for j in (-1, 0, 1)]); med = np.median(st, 0)
    bad = (rgb.sum(-1) > med.sum(-1) * 1.6 + .02); rgb[bad] = med[bad]
    e = (rgb / 1.15) ** (1 / 2.6)
    o = bpy.data.images.new('e', w, h); o.colorspace_settings.name = 'Non-Color'
    b = np.ones((h, w, 4), np.float32); b[..., :3] = e; o.pixels.foreach_set(b.ravel()); o.filepath_raw = os.path.join(OUT, f'room-{g}.png'); o.file_format = 'PNG'; o.save()

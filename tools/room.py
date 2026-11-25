# Habitación: se modela en metros, con la pantalla del monitor centrada en el origen mirando a -Y (en glTF, +Z).
import bpy, math, random, sys, os
from mathutils import Vector
ARGS = sys.argv[sys.argv.index('--') + 1:]
OUT, MODE = ARGS[0], ARGS[1]  # preview | bake
random.seed(7)
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
G = {'shell': [], 'desk': []}
mats = {}

def lin(h):
    h = h.lstrip('#'); h = h if len(h) == 6 else ''.join(c * 2 for c in h); c = [int(h[i:i+2], 16) / 255 for i in (0, 2, 4)]
    return [x / 12.92 if x <= .04045 else ((x + .055) / 1.055) ** 2.4 for x in c] + [1]
def mat(name, color, rough=.7, metal=0, emit=None, k=0):
    if name in mats: return mats[name]
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = lin(color); b.inputs['Roughness'].default_value = rough; b.inputs['Metallic'].default_value = metal
    if emit: b.inputs['Emission Color'].default_value = lin(emit); b.inputs['Emission Strength'].default_value = k
    mats[name] = m
    return m
def tex_mat(name, build, rough=.7):
    new = name not in mats
    m = mat(name, '#808080', rough)
    if new: build(m.node_tree, m.node_tree.nodes['Principled BSDF'])
    return m
def link(nt, a, b): nt.links.new(a, b)

def wood(dark, light, scale, along='X'):
    def f(nt, b):
        tc = nt.nodes.new('ShaderNodeTexCoord'); mp = nt.nodes.new('ShaderNodeMapping'); n = nt.nodes.new('ShaderNodeTexNoise'); r = nt.nodes.new('ShaderNodeValToRGB')
        s = [scale * 8] * 3; s['XYZ'.index(along)] = scale * .5
        mp.inputs['Scale'].default_value = s
        n.inputs['Scale'].default_value = 3; n.inputs['Detail'].default_value = 8; n.inputs['Roughness'].default_value = .65; n.inputs['Distortion'].default_value = .6
        r.color_ramp.elements[0].color = lin(dark); r.color_ramp.elements[1].color = lin(light); r.color_ramp.elements[0].position = .32; r.color_ramp.elements[1].position = .68
        link(nt, tc.outputs['Object'], mp.inputs['Vector']); link(nt, mp.outputs[0], n.inputs['Vector']); link(nt, n.outputs[0], r.inputs[0]); link(nt, r.outputs[0], b.inputs['Base Color'])
    return f
def planks(nt, b):
    tc = nt.nodes.new('ShaderNodeTexCoord'); mp = nt.nodes.new('ShaderNodeMapping'); br = nt.nodes.new('ShaderNodeTexBrick'); n = nt.nodes.new('ShaderNodeTexNoise'); mx = nt.nodes.new('ShaderNodeMix'); mx.data_type = 'RGBA'; mx.blend_type = 'MULTIPLY'; mx.inputs[0].default_value = .75
    mp.inputs['Rotation'].default_value[2] = math.pi / 2
    br.inputs['Color1'].default_value = lin('#6d4a30'); br.inputs['Color2'].default_value = lin('#83603f'); br.inputs['Mortar'].default_value = lin('#2a1c13')
    br.inputs['Scale'].default_value = 1; br.inputs['Mortar Size'].default_value = .004; br.inputs['Brick Width'].default_value = 1.4; br.inputs['Row Height'].default_value = .14
    m2 = nt.nodes.new('ShaderNodeMapping'); m2.inputs['Scale'].default_value = (34, 1.6, 1)
    n.inputs['Scale'].default_value = 2; n.inputs['Detail'].default_value = 8
    r = nt.nodes.new('ShaderNodeValToRGB'); r.color_ramp.elements[0].color = (.35, .35, .35, 1); r.color_ramp.elements[0].position = .3; r.color_ramp.elements[1].position = .7
    link(nt, tc.outputs['Object'], mp.inputs['Vector']); link(nt, mp.outputs[0], br.inputs['Vector']); link(nt, tc.outputs['Object'], m2.inputs['Vector']); link(nt, m2.outputs[0], n.inputs['Vector']); link(nt, n.outputs[0], r.inputs[0])
    link(nt, br.outputs[0], mx.inputs[6]); link(nt, r.outputs[0], mx.inputs[7]); link(nt, mx.outputs[2], b.inputs['Base Color'])
def noisy(c1, c2, scale):
    def f(nt, b):
        tc = nt.nodes.new('ShaderNodeTexCoord'); n = nt.nodes.new('ShaderNodeTexNoise'); n.inputs['Scale'].default_value = scale; n.inputs['Detail'].default_value = 6
        r = nt.nodes.new('ShaderNodeValToRGB'); r.color_ramp.elements[0].color = lin(c1); r.color_ramp.elements[1].color = lin(c2); r.color_ramp.elements[0].position = .35; r.color_ramp.elements[1].position = .65
        link(nt, tc.outputs['Object'], n.inputs['Vector']); link(nt, n.outputs[0], r.inputs[0]); link(nt, r.outputs[0], b.inputs['Base Color'])
    return f
def img(path):
    def f(nt, b):
        t = nt.nodes.new('ShaderNodeTexImage'); t.image = bpy.data.images.load(path); uv = nt.nodes.new('ShaderNodeUVMap'); uv.uv_map = 'UVMap'
        link(nt, uv.outputs[0], t.inputs[0]); link(nt, t.outputs[0], b.inputs['Base Color'])
    return f

def reg(o, m, grp, bevel=0, smooth=False):
    o.data.materials.clear(); o.data.materials.append(m)
    if bevel:
        bv = o.modifiers.new('b', 'BEVEL'); bv.width = bevel; bv.segments = 2; bv.limit_method = 'ANGLE'
    if smooth:
        for p in o.data.polygons: p.use_smooth = True
    G[grp].append(o)
    return o
def box(c, s, m, grp='desk', bevel=.004, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(size=1, location=c, rotation=rot); o = bpy.context.object; o.scale = s
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return reg(o, m, grp, bevel)
def cyl(c, r, h, m, grp='desk', r2=None, v=24, rot=(0, 0, 0), bevel=0):
    bpy.ops.mesh.primitive_cone_add(radius1=r, radius2=r if r2 is None else r2, depth=h, vertices=v, location=c, rotation=rot); o = bpy.context.object
    reg(o, m, grp, bevel)
    for p in o.data.polygons: p.use_smooth = len(p.vertices) == 4
    return o
def ball(c, r, m, grp='desk', scale=(1, 1, 1), seg=24):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, location=c, segments=seg, ring_count=seg // 2); o = bpy.context.object; o.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return reg(o, m, grp, 0, True)
def torus(c, R, r, m, grp='desk', rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_torus_add(major_radius=R, minor_radius=r, location=c, rotation=rot, major_segments=36, minor_segments=8)
    return reg(bpy.context.object, m, grp, 0, True)
def tube(pts, r, m, grp='desk', res=3):
    cu = bpy.data.curves.new('t', 'CURVE'); cu.dimensions = '3D'; cu.bevel_depth = r; cu.bevel_resolution = res; cu.use_fill_caps = True
    sp = cu.splines.new('NURBS'); sp.points.add(len(pts) - 1); sp.use_endpoint_u = True; sp.order_u = 3; sp.resolution_u = 6
    for p, q in zip(sp.points, pts): p.co = (*q, 1)
    o = bpy.data.objects.new('t', cu); sc.collection.objects.link(o)
    bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); bpy.context.view_layer.objects.active = o; bpy.ops.object.convert(target='MESH')
    return reg(bpy.context.object, m, grp, 0, True)
def plane(c, w, h, m, grp, rot):
    bpy.ops.mesh.primitive_plane_add(size=1, location=c, rotation=rot); o = bpy.context.object; o.scale = (w, h, 1)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return reg(o, m, grp)
def mesh(verts, faces, m, grp, smooth=True):
    me = bpy.data.meshes.new('m'); me.from_pydata(verts, [], faces); o = bpy.data.objects.new('m', me); sc.collection.objects.link(o)
    me.uv_layers.new(name='UVMap')
    return reg(o, m, grp, 0, smooth)

# ---------------------------------------------------------------- materiales
wall = tex_mat('wall', noisy('#39455c', '#3e4a62', 3), .9)
wall2 = tex_mat('wallback', noisy('#27324a', '#2c3851', 3), .9)
ceil = mat('ceil', '#b9b6b0', .9)
floor = tex_mat('floor', planks, .5)
trim = mat('trim', '#d8d4cc', .6)
alu = mat('alu', '#23262d', .4, .6)
deskw = tex_mat('deskw', wood('#5a3620', '#9a683f', 1.1), .45)
shelfw = tex_mat('shelfw', wood('#4a2e1c', '#80563a', 1.3), .5)
black = mat('black', '#101216', .5); dark = mat('dark', '#1b1e25', .6); grey = mat('grey', '#454b57', .5); steel = mat('steel', '#a9adb5', .3, .9)
white = mat('white', '#e6e2da', .6); cream = mat('cream', '#d9c8a8', .8); accent = mat('accent', '#ff5a1f', .5); blue = mat('blue', '#3466c9', .6); teal = mat('teal', '#2f8f8a', .6); wine = mat('wine', '#7a2333', .7); mustard = mat('mustard', '#c9962e', .7)
leafm = tex_mat('leaf', noisy('#1f5a2c', '#3f8a43', 18), .55); soil = mat('soil', '#2a1c12', .9); terra = tex_mat('terra', noisy('#a3532f', '#b8643b', 12), .8)
gourd = tex_mat('gourd', noisy('#3b1d0e', '#6e3a1c', 14), .5); yerba = tex_mat('yerba', noisy('#4d5a1e', '#77822f', 90), 1)
fabric = tex_mat('fabric', noisy('#222a3a', '#2c3649', 60), 1); blanket = tex_mat('blanket', noisy('#8a3a1e', '#a34a28', 40), 1); pillow = mat('pillow', '#cfcac0', .9); rug = tex_mat('rug', noisy('#54382f', '#6a483a', 70), 1)
paper = mat('shade', '#fff0d8', .8, 0, '#ffb469', 24)
ledm = mat('led', '#ff7a3c', .5, 0, '#ff5a1f', 12); bulb = mat('bulb', '#ffffff', .5, 0, '#ffc98a', 22); pc_led = mat('pcled', '#ffffff', .5, 0, '#4aa3ff', 5)
poster = tex_mat('poster', img(os.path.join(OUT, 'galaxy.png')), .7)

FL, CE, BK, WN, XL, XR = -1.12, 1.48, .46, -3.3, -2.0, 2.15
# ---------------------------------------------------------------- cáscara
def wallplane(c, w, h, m, rot): return plane(c, w, h, m, 'shell', rot)
cx, cy, cz = (XL + XR) / 2, (BK + WN) / 2, (FL + CE) / 2
wallplane((cx, cy, FL), XR - XL, BK - WN, floor, (0, 0, 0))
wallplane((cx, cy, CE), XR - XL, BK - WN, ceil, (math.pi, 0, 0))
wallplane((cx, BK, cz), XR - XL, CE - FL, wall2, (math.pi / 2, 0, 0))
wallplane((XL, cy, cz), CE - FL, BK - WN, wall, (0, math.pi / 2, 0))
wallplane((XR, cy, cz), CE - FL, BK - WN, wall, (0, -math.pi / 2, 0))
# pared de la ventana: hueco con espesor
WX0, WX1, WZ0, WZ1, TH = -.95, .95, -.28, 1.16, .22
for (x0, x1, z0, z1) in [(XL, WX0, FL, CE), (WX1, XR, FL, CE), (WX0, WX1, FL, WZ0), (WX0, WX1, WZ1, CE)]:
    box(((x0 + x1) / 2, WN - TH / 2, (z0 + z1) / 2), (x1 - x0, TH, z1 - z0), wall, 'shell', 0)
box((0, WN - TH / 2, WZ0 + .012), (WX1 - WX0 + .1, TH + .08, .03), white, 'shell')
for x in (WX0 + .02, WX1 - .02): box((x, WN - .12, (WZ0 + WZ1) / 2), (.045, .07, WZ1 - WZ0), alu, 'shell')
for z in (WZ0 + .045, WZ1 - .02): box((0, WN - .12, z), (WX1 - WX0, .07, .045), alu, 'shell')
for s in (-1, 1):
    for x in (s * .9, s * .58): box((x, WN - .12, (WZ0 + WZ1) / 2), (.04, .035, WZ1 - WZ0 - .08), alu, 'shell')
for s in (-1, 1):
    n, vs, fs = 34, [], []
    for i in range(n + 1):
        u = i / n; x = s * (.78 + u * .42); y = WN + .07 + .035 * math.sin(u * 30) + .01 * math.sin(u * 71)
        for k, z in enumerate((CE - .12, .2, FL + .05)):
            vs.append((x + s * (.02 * k) * (u - .5), y + .012 * k * math.sin(u * 23), z))
    for i in range(n):
        for k in range(2):
            a = i * 3 + k; fs.append((a, a + 1, a + 4, a + 3))
    o = mesh(vs, fs, mat('curtain', '#8d8778', .9), 'shell'); sd = o.modifiers.new('s', 'SOLIDIFY'); sd.thickness = .006
tube([(-1.35, WN + .07, CE - .1), (0, WN + .07, CE - .1), (1.35, WN + .07, CE - .1)], .012, alu, 'shell')
for c, s in [((cx, BK - .008, FL + .045), (XR - XL, .016, .09)), ((XL + .008, cy, FL + .045), (.016, BK - WN, .09)), ((XR - .008, cy, FL + .045), (.016, BK - WN, .09))]: box(c, s, trim, 'shell', .003)
box((.1, -1.45, FL + .008), (1.9, 1.35, .014), rug, 'shell', .004)
for i in range(3): box((.1, -1.45 - .5 + i * .5, FL + .0165), (1.9, .05, .003), cream, 'shell', 0)
# cama a la izquierda
box((-1.5, -2.1, FL + .16), (.96, 2.0, .24), shelfw, 'shell', .01)
box((-1.5, -2.1, FL + .37), (.94, 1.98, .22), white, 'shell', .05)
box((-1.5, -2.35, FL + .44), (.99, 1.46, .14), blanket, 'shell', .05)
box((-1.5, -1.34, FL + .54), (.62, .38, .14), pillow, 'shell', .055, (.12, 0, .06))
# biblioteca a la derecha
bx, by = XR - .17, -1.55
for z in (.02, .42, .82, 1.22, 1.62): box((bx, by, FL + z), (.3, 1.1, .024), shelfw, 'shell', .003)
for y in (by - .55, by + .55): box((bx, y, FL + .82), (.3, .024, 1.64), shelfw, 'shell', .003)
cols = [wine, blue, teal, cream, mustard, dark, grey, accent, white, terra]
for z in (FL + .035, FL + .435, FL + .835, FL + 1.235):
    y = by - .52
    while y < by + .45:
        if random.random() < .12: y += random.uniform(.04, .14); continue
        w, h, d = random.uniform(.018, .045), random.uniform(.2, .31), random.uniform(.15, .22)
        box((bx - .03 + (.22 - d) / 2, y + w / 2, z + h / 2), (d, w * .94, h), random.choice(cols), 'shell', .002, (random.choice([0, 0, 0, .07]), 0, 0)); y += w + .001
torus((bx - .06, by + .3, FL + 1.74), .085, .006, steel, 'shell', (0, math.pi / 2 - .2, 0)); ball((bx - .06, by + .3, FL + 1.74), .07, blue, 'shell'); cyl((bx - .06, by + .3, FL + 1.645), .045, .02, black, 'shell')
box((-.95, -.35, FL + .2), (.32, .2, .4), fabric, 'shell', .06, (.1, 0, .3)); box((-.98, -.46, FL + .14), (.24, .08, .2), dark, 'shell', .03, (.1, 0, .3))
# lámpara de pie de papel
cyl((-1.62, .12, FL + .02), .13, .025, black, 'shell'); cyl((-1.62, .12, FL + .6), .011, 1.16, black, 'shell'); ball((-1.62, .12, FL + 1.36), .21, paper, 'shell', (1, 1, 1.12), 32)
# cuadros
def frame(x, z, w, h, m):
    box((x, BK - .012, z), (w + .04, .022, h + .04), black, 'shell', .003); plane((x, BK - .0245, z), w, h, m, 'shell', (math.pi / 2, 0, 0))
navy = mat('pst', '#10162a', .8)
frame(-1.0, .62, .5, .5, poster)
frame(1.28, .7, .34, .46, navy)
for i, (r, c) in enumerate([(.125, accent), (.095, navy), (.07, mustard)]): cyl((1.28, BK - .0255 - i * .0012, .74), r, .001, c, 'shell', v=48, rot=(math.pi / 2, 0, 0))
frame(1.72, .62, .26, .26, mat('pst2', '#1a1030', .8))
SK = ['..XXXXX..', '.XXXXXXX.', 'XXXXXXXXX', 'XXOOXOOXX', 'XXOOXOOXX', 'XXXXXXXXX', '.XXX.XXX.', '..XXXXX..', '..X.X.X..']
for j, row in enumerate(SK):
    for i, ch in enumerate(row):
        if ch != '.': plane((1.72 + (i - 4) * .019, BK - .0262, .62 - (j - 4) * .019), .019, .019, white if ch == 'X' else accent, 'shell', (math.pi / 2, 0, 0))
# estante sobre el escritorio
box((.0, BK - .11, .62), (1.5, .22, .026), shelfw, 'desk', .004)
for x in (-.6, .6): box((x, BK - .1, .585), (.02, .18, .05), black, 'desk', .003)
x = -.72
for i in range(13):
    w, h = random.uniform(.02, .045), random.uniform(.17, .25)
    box((x + w / 2, BK - .1, .633 + h / 2), (w * .95, .16, h), random.choice(cols), 'desk', .002); x += w + .001
def saturn(c, r):
    ball(c, r, mat('sat', '#d9b98a', .6), 'desk', seg=32)
    vs, fs = [], []
    for i in range(48):
        a = i / 48 * math.tau
        for q in (1.3, 2.05): vs.append((math.cos(a) * r * q, math.sin(a) * r * q, 0))
    for i in range(48):
        a = i * 2; b = (i * 2 + 2) % 96; fs.append((a, a + 1, b + 1, b))
    o = mesh(vs, fs, mat('ring', '#b8a37c', .6), 'desk'); o.location = c; o.rotation_euler = (.35, .3, 0); s = o.modifiers.new('s', 'SOLIDIFY'); s.thickness = .003
    cyl((c[0], c[1], c[2] - r - .03), .004, .07, steel); cyl((c[0], c[1], c[2] - r - .062), .04, .012, black)
saturn((.12, BK - .11, .755), .048)
for j, row in enumerate(SK):
    for i, ch in enumerate(row):
        if ch != '.': box((.47 + (i - 4) * .017, BK - .11 + (.012 if ch == 'O' else 0), .633 + (8 - j + .5) * .017), (.0172, .09 - (.024 if ch == 'O' else 0), .0172), white if ch == 'X' else black, 'desk', 0)
cyl((.66, BK - .11, .69), .06, .11, terra, r2=.075); cyl((.66, BK - .11, .74), .068, .01, soil)
def leaf(base, yaw, pitch, L, W, droop=.6, grp='desk'):
    vs, fs, n = [], [], 7
    for i in range(n + 1):
        u = i / n; w = W * math.sin(math.pi * min(u * .94 + .06, 1)) ** .8
        d = L * u; x = d * math.cos(pitch - droop * u); z = d * math.sin(pitch - droop * u)
        for s in (-1, 0, 1):
            ly = s * w
            vs.append((base[0] + x * math.cos(yaw) - ly * math.sin(yaw), base[1] + x * math.sin(yaw) + ly * math.cos(yaw), base[2] + z + abs(s) * w * .3))
    for i in range(n):
        for k in range(2):
            a = i * 3 + k; fs.append((a, a + 1, a + 4, a + 3))
    return mesh(vs, fs, leafm, grp)
for i in range(20): leaf((.66, BK - .11, .74), math.pi + random.uniform(-.2, math.pi + .2), random.uniform(.2, 1.4), random.uniform(.14, .26), .022, random.uniform(.9, 1.7))
px, py = 1.42, .08
cyl((px, py, FL + .17), .14, .34, cream, 'shell', r2=.18, v=32); cyl((px, py, FL + .33), .165, .01, soil, 'shell')
for i in range(15): leaf((px, py, FL + .33 + i * .028), i * 2.4, random.uniform(.7, 1.3), random.uniform(.42, .72), .075, random.uniform(.5, 1.0), 'shell')

# ---------------------------------------------------------------- escritorio
DT = -.335
box((0, .08, DT - .018), (1.75, .74, .036), deskw, 'desk', .006)
for x in (-.8, .8):
    box((x, .08, (DT + FL) / 2 - .02), (.05, .6, .03), black, 'desk')
    for y in (-.22, .38): box((x, y, (DT + FL) / 2 - .018), (.05, .05, DT - FL - .036), black, 'desk')
SW, SH = .598, .336
box((0, .016, 0), (SW + .016, .022, SH + .016), black, 'desk', .003)
box((0, .035, 0), (SW * .7, .03, SH * .7), dark, 'desk', .01)
cyl((0, .07, -.15), .018, .33, dark); box((0, .07, DT + .008), (.24, .19, .012), dark, 'desk', .004); box((0, .052, -.02), (.06, .04, .06), dark, 'desk')
box((0, .054, .12), (SW * .66, .004, .008), ledm, 'desk', 0); box((0, .054, -.12), (SW * .66, .004, .008), ledm, 'desk', 0)
box((.03, -.14, DT + .0025), (.86, .3, .004), tex_mat('mat', noisy('#14161d', '#191c25', 120), 1), 'desk', .002)
kx, ky, kz = -.06, -.15, DT + .016
box((kx, ky, kz), (.37, .135, .022), dark, 'desk', .005)
keyc = [mat('key', '#2c303a', .6), mat('key2', '#3a404d', .6)]
rows = [[1] * 15, [1.5] + [1] * 12 + [1.5], [1.75] + [1] * 11 + [2.25], [2.25] + [1] * 10 + [2.75], [1.25, 1.25, 1.25, 6.25, 1.25, 1.25, 1.25, 1.25]]
for r, row in enumerate(rows):
    u = .0236; x = kx - sum(row) * u / 2
    for i, w in enumerate(row):
        m = accent if (r == 0 and i == 0) or (r == 2 and i == 12) else keyc[1] if i in (0, len(row) - 1) else keyc[0]
        box((x + w * u / 2, ky + .05 - r * .0245, kz + .0135), (w * u - .003, .0208, .011), m, 'desk', .002); x += w * u
ball((.28, -.15, DT + .016), .03, black, 'desk', (.95, 1.75, .55)); cyl((.28, -.175, DT + .03), .004, .008, accent, rot=(0, math.pi / 2, 0), v=12)
for s in (-1, 1):
    box((s * .47, .18, DT + .115), (.13, .15, .23), dark, 'desk', .008, (0, 0, -s * .25))
    for z, r in ((.075, .046), (.17, .024)): cyl((s * .47 - s * .019, .18 - .0755, DT + z), r, .006, grey, rot=(math.pi / 2, 0, -s * .25))
lx, ly = -.72, .26
cyl((lx, ly, DT + .01), .075, .02, black); tube([(lx, ly, DT + .02), (lx - .02, ly, DT + .18), (lx - .06, ly, DT + .3)], .008, black); tube([(lx - .06, ly, DT + .3), (lx + .06, ly - .08, DT + .42), (lx + .16, ly - .14, DT + .46)], .008, black)
cyl((lx + .19, ly - .16, DT + .42), .085, .1, accent, r2=.03, rot=(-.25, -.45, 0)); ball((lx + .175, ly - .155, DT + .375), .026, bulb)
mx_, my_ = .6, -.08
ball((mx_, my_, DT + .045), .043, gourd, 'desk', (1, 1, 1.05)); cyl((mx_, my_, DT + .088), .034, .022, steel, r2=.037); cyl((mx_, my_, DT + .095), .033, .01, yerba)
tube([(mx_ + .005, my_, DT + .06), (mx_ + .03, my_ - .004, DT + .16), (mx_ + .052, my_ - .01, DT + .18)], .0035, steel)
cyl((.73, .04, DT + .115), .045, .23, mat('thermo', '#2d5f57', .35, .5), v=32, bevel=.01); cyl((.73, .04, DT + .25), .03, .05, steel, v=24, bevel=.005); tube([(.772, .04, DT + .19), (.81, .04, DT + .18), (.81, .04, DT + .08), (.772, .04, DT + .07)], .007, black)
box((-.5, -.13, DT + .008), (.16, .22, .014), wine, 'desk', .002, (0, 0, .22)); box((-.5, -.13, DT + .0165), (.15, .21, .003), white, 'desk', 0, (0, 0, .22)); cyl((-.46, -.12, DT + .022), .004, .14, black, v=10, rot=(math.pi / 2, 0, .75))
for i in range(8): box((-.505 + .01 * math.sin(i), -.075 - i * .016, DT + .0183), (.1 - .03 * (i % 3), .002, .0004), blue, 'desk', 0, (0, 0, .22))
hx, hy = -.36, .24
cyl((hx, hy, DT + .006), .05, .012, black); cyl((hx, hy, DT + .13), .007, .25, steel)
tube([(hx - .085, hy, DT + .14), (hx - .085, hy, DT + .24), (hx, hy, DT + .285), (hx + .085, hy, DT + .24), (hx + .085, hy, DT + .14)], .01, dark)
for s in (-1, 1): cyl((hx + s * .078, hy, DT + .14), .04, .035, dark, rot=(0, math.pi / 2, 0), bevel=.006); cyl((hx + s * .058, hy, DT + .14), .036, .012, accent, rot=(0, math.pi / 2, 0))
for x, z, c in ((-.5, .38, mustard), (-.42, .36, cream), (-.46, .29, accent)): box((x, BK - .002, z), (.07, .003, .07), c, 'desk', 0, (0, random.uniform(-.12, .12), 0))
# la nave, en miniatura
before = set(bpy.data.objects)
bpy.ops.import_scene.gltf(filepath=os.path.join(OUT, 'ship.glb'))
new = [o for o in bpy.data.objects if o not in before]
root = bpy.data.objects.new('shiproot', None); sc.collection.objects.link(root)
for o in new:
    if o.parent is None: o.parent = root
root.scale = (.032,) * 3; root.rotation_euler = (0, math.radians(-12), math.radians(152)); root.location = (.44, .0, DT + .115)
for o in new: o.animation_data_clear()
bpy.context.view_layer.update()
for o in new:
    if o.type == 'MESH':
        mw = o.matrix_world.copy(); o.parent = None; o.modifiers.clear(); o.matrix_world = mw; G['desk'].append(o)
cyl((.44, .0, DT + .05), .003, .1, steel, v=10); cyl((.44, .0, DT + .006), .045, .012, black)
box((.6, .12, FL + .24), (.2, .42, .44), black, 'desk', .008); box((.498, .12, FL + .24), (.004, .36, .38), dark, 'desk', .001); box((.5, -.085, FL + .24), (.05, .006, .34), pc_led, 'desk', 0)
# silla, girada y corrida a la derecha
chx, chy, a = .62, -.95, .75
def cbox(x, y, z, s, m, b=.02, r=0):
    X = chx + x * math.cos(a) - y * math.sin(a); Y = chy + x * math.sin(a) + y * math.cos(a); box((X, Y, FL + z), s, m, 'desk', b, (r, 0, a))
cbox(0, 0, .47, (.5, .5, .08), fabric, .035); cbox(0, -.25, .86, (.46, .07, .62), fabric, .03, .13); cbox(0, -.285, .86, (.1, .03, .7), black, .01, .13)
for s in (-1, 1): cbox(s * .29, .02, .66, (.07, .26, .03), black, .012); cbox(s * .29, 0, .56, (.03, .05, .2), black, .006)
cyl((chx, chy, FL + .27), .03, .34, steel)
for i in range(5):
    t = i / 5 * math.tau; ex, ey = chx + math.cos(t) * .28, chy + math.sin(t) * .28
    tube([(chx, chy, FL + .11), ((chx + ex) / 2, (chy + ey) / 2, FL + .095), (ex, ey, FL + .07)], .02, black); cyl((ex, ey, FL + .03), .03, .03, dark, rot=(math.pi / 2, 0, t), v=16)

# ---------------------------------------------------------------- luces
def light(kind, loc, energy, color, rot=(0, 0, 0), **kw):
    l = bpy.data.lights.new('l', kind); l.energy = energy; l.color = lin(color)[:3]
    for k, v in kw.items(): setattr(l, k, v)
    o = bpy.data.objects.new('l', l); o.location = loc; o.rotation_euler = rot; sc.collection.objects.link(o); return o
light('AREA', (0, -.012, 0), 13, '#9fc4ff', (-math.pi / 2, 0, 0), shape='RECTANGLE', size=SW, size_y=SH)
light('AREA', (0, .06, .1), 2.4, '#ff6a2c', (math.pi / 2, 0, 0), shape='RECTANGLE', size=SW * .8, size_y=.22)
light('POINT', (1.2, -.2, FL + 2.2), 5, '#ffa860', shadow_soft_size=.25)
light('SPOT', (lx + .175, ly - .155, DT + .34), 9, '#ffc58a', (-.25, -.35, 0), spot_size=1.9, spot_blend=.6, shadow_soft_size=.03)
light('SUN', (0, 0, 0), .22, '#7fa6ff', (math.radians(62), 0, math.radians(-14)), angle=.02)
w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True; w.node_tree.nodes['Background'].inputs[0].default_value = (.02, .035, .08, 1); w.node_tree.nodes['Background'].inputs[1].default_value = .35

sc.render.engine = 'CYCLES'
pr = bpy.context.preferences.addons['cycles'].preferences
for t in ('OPTIX', 'CUDA', 'HIP'):
    try:
        pr.compute_device_type = t; pr.get_devices()
        if any(d.type == t for d in pr.devices):
            for d in pr.devices: d.use = True
            sc.cycles.device = 'GPU'; print('GPU', t); break
    except Exception as ex: print(ex)

if MODE == 'preview':
    sc.cycles.samples = 64; sc.cycles.use_denoising = True
    plane((0, 0, 0), SW, SH, mat('scr', '#000000', .5, 0, '#5a7fd0', 1.2), 'desk', (math.pi / 2, 0, 0))
    cam = bpy.data.cameras.new('c'); co = bpy.data.objects.new('c', cam); sc.collection.objects.link(co); sc.camera = co
    sc.render.resolution_x, sc.render.resolution_y = 1280, 720; sc.view_settings.view_transform = 'AgX'; sc.view_settings.exposure = 1.0
    for n, (p, t, f) in enumerate([((0, -5.6, .55), (0, 0, .05), 45), ((-.1, -2.9, .42), (0, 0, 0), 55), ((.0, -1.25, .16), (0, .1, -.04), 50), ((0, .3, 1.0), (0, -3, -.3), 75)]):
        co.location = p; co.rotation_euler = (Vector(t) - Vector(p)).to_track_quat('-Z', 'Y').to_euler(); cam.angle = math.radians(f); cam.clip_start = .02
        sc.render.filepath = os.path.join(OUT, f'prev{n}.png'); bpy.ops.render.render(write_still=True)
    sys.exit()

# ---------------------------------------------------------------- unir, desplegar, hornear
SIZE, SPP = int(ARGS[2]), int(ARGS[3])
joined = {}
for g, objs in G.items():
    for o in objs:
        bpy.ops.object.select_all(action='DESELECT'); o.hide_set(False); o.select_set(True); bpy.context.view_layer.objects.active = o
        if o.data.users > 1: o.data = o.data.copy()
        for md in list(o.modifiers): bpy.ops.object.modifier_apply(modifier=md.name)
        bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
        if not o.data.uv_layers: o.data.uv_layers.new(name='UVMap')
        o.data.uv_layers[0].name = 'UVMap'
        while len(o.data.uv_layers) > 1: o.data.uv_layers.remove(o.data.uv_layers[-1])
        for a_ in list(o.data.color_attributes): o.data.color_attributes.remove(a_)
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs: o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]; bpy.ops.object.join(); o = bpy.context.object; o.name = g; joined[g] = o
    lm = o.data.uv_layers.new(name='LM'); o.data.uv_layers.active = lm; o.data.uv_layers['UVMap'].active_render = True
    bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=math.radians(60), island_margin=1.6 / SIZE, area_weight=0, margin_method='FRACTION', rotate_method='AXIS_ALIGNED')
    bpy.ops.object.mode_set(mode='OBJECT')
    print(g, 'tris', sum(len(p.vertices) - 2 for p in o.data.polygons))
sc.cycles.samples = SPP
sc.render.bake.use_pass_glossy = False; sc.render.bake.use_pass_transmission = False; sc.render.bake.margin = 6
for g, o in joined.items():
    im = bpy.data.images.new('bake_' + g, SIZE, SIZE, float_buffer=True)
    for s in o.material_slots:
        nt = s.material.node_tree
        if 'BAKE' in nt.nodes: continue
        n = nt.nodes.new('ShaderNodeTexImage'); n.image = im; n.name = 'BAKE'; nt.nodes.active = n
        b = nt.nodes.get('Principled BSDF')
        # los metales no tienen difusa: se hornean casi como pintura clara
        if b and not b.inputs['Metallic'].is_linked: b.inputs['Metallic'].default_value *= .25
    bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); bpy.context.view_layer.objects.active = o
    bpy.ops.object.bake(type='COMBINED')
    im.filepath_raw = os.path.join(OUT, f'bake_{g}.exr'); im.file_format = 'OPEN_EXR'; im.save()
    for s in o.material_slots:
        nt = s.material.node_tree
        if 'BAKE' in nt.nodes: nt.nodes.remove(nt.nodes['BAKE'])
    print('horneado', g)
for g, o in joined.items():
    o.data.materials.clear(); o.data.uv_layers.remove(o.data.uv_layers['UVMap'])
bpy.ops.object.select_all(action='DESELECT')
for o in joined.values(): o.select_set(True)
bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, 'room-raw.glb'), export_format='GLB', use_selection=True, export_materials='NONE', export_normals=False, export_yup=True, export_animations=False)

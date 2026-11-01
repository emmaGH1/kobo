"""Export the Kobo logo (round 2, concept C "notched page") from Geist Serif outlines.
Usage: python build-logo.py <GeistSerif-Regular.woff2> <out_dir>   (needs fontTools + brotli)"""
import sys
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.boundsPen import BoundsPen

f = TTFont(sys.argv[1]); out = sys.argv[2]
gs = f.getGlyphSet(); cmap = f.getBestCmap()
def glyph(ch):
    g = gs[cmap[ord(ch)]]; p = SVGPathPen(gs); g.draw(p); b = BoundsPen(gs); g.draw(b)
    return p.getCommands(), g.width, b.bounds
K, kadv, kb = glyph("k"); O, oadv, _ = glyph("o"); B, badv, _ = glyph("b")

W = H = 1000; n = 330; R = 170; r = 70; gap = 46; s = 1.08; TRACK = -20
TILE = (f"M{R},0 H{W-n-r} Q{W-n},0 {W-n},{r} V{n-r} Q{W-n},{n} {W-n+r},{n} H{W-r} Q{W},{n} {W},{n+r} "
        f"V{H-R} Q{W},{H} {W-R},{H} H{R} Q0,{H} 0,{H-R} V{R} Q0,0 {R},0 Z")
STUB = f'x="{W-n+gap}" y="0" width="{n-gap}" height="{n-gap}" rx="{r}"'
KT = f'translate({190-kb[0]*s:.1f} 916) scale({s} {-s})'
# The tile's k IS the word's first letter: "obo" follows at the k's scale and baseline.
GAP = 70                                   # tile edge to the first o, in tile units
ox = [W + GAP - 50 * s, 0, 0]              # 50 = o's left side bearing (keeps optical gap)
ox[1] = ox[0] + (oadv + TRACK) * s
ox[2] = ox[1] + (badv + TRACK) * s
WORD_END = ox[2] + oadv * s
WM = (f'<g id="wordmark" fill="{{ink}}">'
      f'<path transform="translate({ox[0]:.1f} 916) scale({s} {-s})" d="{O}"/>'
      f'<path transform="translate({ox[1]:.1f} 916) scale({s} {-s})" d="{B}"/>'
      f'<path transform="translate({ox[2]:.1f} 916) scale({s} {-s})" d="{O}"/></g>')

def mark(tile, k, stub):
    return (f'<path id="tile" d="{TILE}" fill="{tile}"/><rect id="stub" {STUB} fill="{stub}"/>'
            f'<path id="k" transform="{KT}" d="{K}" fill="{k}"/>')
def mono_mark(c):
    # one colour: tile and stub in c, the k knocked out (transparent)
    return (f'<defs><mask id="ko"><rect width="1000" height="1000" fill="#fff"/>'
            f'<path transform="{KT}" d="{K}" fill="#000"/></mask></defs>'
            f'<path d="{TILE}" fill="{c}" mask="url(#ko)"/><rect {STUB} fill="{c}"/>')
def svg(vb, body):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}">{body}</svg>\n'

INK, LAV, PAPER = "#2D2C2A", "#92A9E1", "#EBE1CF"
full = f"0 0 {WORD_END + 30:.0f} 1000"
files = {
    "logo.svg": svg(full, mark(LAV, INK, INK) + WM.format(ink=INK)),
    "logo-dark.svg": svg(full, mark(LAV, INK, PAPER) + WM.format(ink=PAPER)),
    "logo-black.svg": svg(full, mono_mark("#000") + WM.format(ink="#000")),
    "logo-white.svg": svg(full, mono_mark("#fff") + WM.format(ink="#fff")),
    "logo-mark.svg": svg("0 0 1000 1000", mark(LAV, INK, INK)),
    "logo-mark-dark.svg": svg("0 0 1000 1000", mark(LAV, INK, PAPER)),
    "logo-mark-black.svg": svg("0 0 1000 1000", mono_mark("#000")),
    "logo-mark-white.svg": svg("0 0 1000 1000", mono_mark("#fff")),
}
for name, body in files.items():
    open(f"{out}/{name}", "w").write(body)
print("wrote", len(files), "files")

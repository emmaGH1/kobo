import sys
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.boundsPen import BoundsPen
src,out=sys.argv[1],sys.argv[2]
f=instantiateVariableFont(TTFont(src),{"wght":700})
gs=f.getGlyphSet(); cmap=f.getBestCmap(); upm=f['head'].unitsPerEm
def g(ch): return cmap[ord(ch)]
def path(ch):
    p=SVGPathPen(gs); gs[g(ch)].draw(p); return p.getCommands()
def bounds(ch):
    b=BoundsPen(gs); gs[g(ch)].draw(b); return b.bounds
track=-0.045*upm
# metrics of 'o' to size the coin
ob=bounds('o'); ow=ob[2]-ob[0]; oh=ob[3]-ob[1]
print('upm',upm,'o bounds',ob)
x=0; parts=[]
for i,ch in enumerate('kobo'):
    adv=gs[g(ch)].width
    if i==1:
        # coin: circle inscribed in the o's outer bounds, slight optical reduction
        r=min(ow,oh)/2*0.97; cx=x+(ob[0]+ob[2])/2; cy=(ob[1]+ob[3])/2
        parts.append(('coin',f'<circle id="coin" cx="{cx:.1f}" cy="{cy:.1f}" r="{r:.1f}" fill="ACCENT"/>'))
    else:
        parts.append((ch,f'<path id="{ch}{i}" transform="translate({x:.1f} 0)" d="{path(ch)}" fill="INK"/>'))
    x+=adv+track
asc=f['hhea'].ascent
kb=bounds('k'); bb=bounds('b')
top=max(kb[3],bb[3]); bottom=min(0,ob[1])
pad=0.06*upm
W=x-track; minx=-pad; miny=bottom-pad; H=top-bottom+2*pad
def svg(ids, ink, accent, vb):
    body="\n  ".join(s for n,s in parts if n in ids).replace('INK',ink).replace('ACCENT',accent)
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}">\n <g transform="scale(1 -1)">\n  {body}\n </g>\n</svg>\n'
vb_word=f"{minx:.0f} {-(top+pad):.0f} {W+2*pad:.0f} {H:.0f}"
# mark: k + coin
kadv=gs[g('k')].width+track
r=min(ow,oh)/2*0.97; ccx=kadv+(ob[0]+ob[2])/2; ccy=(ob[1]+ob[3])/2
L=kb[0]; R=ccx+r; T=max(kb[3],ccy+r); B=min(kb[1],ccy-r)
side=max(R-L,T-B)+2*pad; cxm=(L+R)/2; cym=(T+B)/2
mx=cxm-side/2; my=-cym-side/2
vb_mark=f"{mx:.0f} {my:.0f} {side:.0f} {side:.0f}"
variants={'logo':('#1B1A17','#2A3A9E'),'logo-dark':('#F4F0E6','#9AA6F2'),'logo-black':('#000','#000'),'logo-white':('#fff','#fff')}
for name,(ink,acc) in variants.items():
    open(f'{out}/{name}.svg','w').write(svg({'k','coin','b','o'},ink,acc,vb_word))
    open(f'{out}/{name.replace("logo","logo-mark")}.svg','w').write(svg({'k','coin'},ink,acc,vb_mark))
print('ok',vb_word,vb_mark)

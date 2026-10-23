#!/usr/bin/env python3
"""Build scroll-scrub frame films from Red Dot's own photos.
Every frame = a crop window of the source resized DOWN (Lanczos) to the frame size.
Invariant asserted: window >= frame in both axes, so no output pixel is upscaled.
Writes films/<id>/<tier>/NNN.webp, films/<id>/<tier>/poster.webp and films/manifest.json.
To swap in real filmed clips later: set a film's "type" to "video" and give each tier a
"src" (mp4/webm, frame size <= source, no upscale); main.js seeks video by scroll progress."""
import json, os
from PIL import Image
S='src/'
P={'6b':S+'6b_d7ba0c532947debe063317f74c6696-orig.jpg','79':S+'79_3e16ef4cef4fe582ae876ba454ba24-orig.jpg',
   '89':S+'89_1ee1ec118845b8a0027ba13ed680d9-orig.jpg','63':S+'63_5f9b86b31749b09b43e5ff3283a00b-orig.jpg'}
def ease(t): return t*t*(3-2*t)
# (film, photo, frames, tiers{tier:(fw,fh, start(cx,cy,ww), end(cx,cy,ww))}) ; cx,cy = window centre px, ww = window width
FILMS=[
 ('frites','6b',60,{'d':(1440,900,(1000,665,2000),(780,640,1440)),'m':(1170,900,(1000,665,1730),(760,640,1170))}),
 ('benedict','79',60,{'d':(1440,900,(1000,665,2000),(1000,560,1440)),'m':(1170,900,(1000,665,1730),(980,560,1170))}),
 ('latke','89',60,{'d':(1440,900,(750,468,1500),(750,1500,1440)),'m':(1170,1560,(750,1000,1500),(750,1150,1170))}),
 ('bar','63',40,{'d':(1440,694,(720,347,1440),(802,347,1440)),'m':(1170,560,(585,347,1170),(937,347,1170))}),
]
man={}
for fid,ph,n,tiers in FILMS:
  im=Image.open(P[ph])
  if im.mode=='RGBA':
    bg=Image.new('RGB',im.size,(21,17,18)); bg.paste(im,mask=im.split()[3]); im=bg
  im=im.convert('RGB'); W,H=im.size
  man[fid]={'type':'frames','photo':os.path.basename(P[ph]),'source':f'{W}x{H}','tiers':{}}
  for t,(fw,fh,a,b) in tiers.items():
    d=f'films/{fid}/{t}'; os.makedirs(d,exist_ok=True); maxs=0
    for i in range(n):
      k=ease(i/(n-1)); cx=a[0]+(b[0]-a[0])*k; cy=a[1]+(b[1]-a[1])*k; ww=a[2]+(b[2]-a[2])*k; wh=ww*fh/fw
      assert ww>=fw-0.01 and wh>=fh-0.01, (fid,t,i,ww,wh)
      x0=min(max(cx-ww/2,0),W-ww); y0=min(max(cy-wh/2,0),H-wh)
      assert x0>=-0.01 and y0>=-0.01 and ww<=W+.01 and wh<=H+.01,(fid,t,i,x0,y0,ww,wh)
      fr=im.resize((fw,fh),Image.LANCZOS,box=(x0,y0,x0+ww,y0+wh))
      fr.save(f'{d}/{i:03d}.webp','WEBP',quality=74,method=5)
      maxs=max(maxs,fw/ww)
      if i==0: fr.save(f'{d}/poster.webp','WEBP',quality=80,method=5); fr.save(f'{d}/poster.jpg','JPEG',quality=82,optimize=True,progressive=True)
    man[fid]['tiers'][t]={'w':fw,'h':fh,'count':n,'path':f'films/{fid}/{t}/','maxSourceScale':round(maxs,4)}
    print(fid,t,fw,fh,n,'max src->frame scale',round(maxs,3))
json.dump(man,open('films/manifest.json','w'),indent=1)

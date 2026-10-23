#!/usr/bin/env python3
# Stills: centre crops of Red Dot's photos, resized DOWN only; 1x/2x/3x for srcset x-descriptors.
from PIL import Image
S='src/'
J=[('shishito','74_7b09708c0545c787e0f005f08566e7-orig.jpg',460,613),
   ('salmon','68_d714926ba5453cb10c42284d2e1139-orig.jpg',360,360),
   ('frenchtoast','7b_c416e565a846d984342cb7c08449b2-orig.jpg',360,360),
   ('benedict-grey','7f_f7608e0ed948bc98647c2a9f19d1d0-orig.jpg',360,360),
   ('turkey','34_1104330dee4d289bbec3f869ba2ef0-orig.jpg',360,360)]
for n,f,w,h in J:
  im=Image.open(S+f).convert('RGB');W,H=im.size
  for k in (1,2,3):
    fw,fh=w*k,h*k; r=min(W/fw,H/fh); assert r>=1,(n,k)
    cw,ch=fw*r,fh*r; x=(W-cw)/2;y=(H-ch)/2
    im.resize((fw,fh),Image.LANCZOS,box=(x,y,x+cw,y+ch)).save(f'img/{n}-{k}x.webp','WEBP',quality=78,method=5)
  print(n,w,h)

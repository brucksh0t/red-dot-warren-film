#!/usr/bin/env python3
"""Scroll-scrub clips: AI image-to-video (GenerateVideo, 720p) from Red Dot's real photos.
Masters + upscale manifest live in /workspace/red-dot-warren-clips/. Web encode = all-keyframe H.264
(-g 1, 10 fps, CRF 33) so every scroll position is a direct seek. Posters = the real photo crop each clip
starts from (sharper than the 720p clip), resized down only.
When Topaz upscales land: drop <id>-<o>-upscaled.mp4 into the clips folder, set "master" in the manifest
and rerun; nothing in main.js changes."""
import json,subprocess,os
from PIL import Image
C='/workspace/red-dot-warren-clips/'
U=json.load(open(C+'manifest.json'))
man={}
for fid,slot in U['films'].items():
  man[fid]={'type':'video','ai':True,'tiers':{}}
  for o,s in slot['tiers'].items():
    src=C+s.get('upscaled') if s.get('upscaled') else C+s['master']
    out=f'films/{fid}/{o}.mp4';os.makedirs(f'films/{fid}',exist_ok=True)
    subprocess.run(['ffmpeg','-v','error','-y','-i',src,'-an','-vf','fps=10','-c:v','libx264','-preset','veryslow','-tune','film','-crf','33','-g','1','-keyint_min','1','-sc_threshold','0','-pix_fmt','yuv420p','-movflags','+faststart',out],check=True)
    w,h=map(int,subprocess.check_output(['ffprobe','-v','error','-select_streams','v','-show_entries','stream=width,height','-of','csv=p=0',out]).decode().split(','))
    im=Image.open(C+'inputs/'+s['input'])
    if im.width<w:
      subprocess.run(['ffmpeg','-v','error','-y','-i',src,'-frames:v','1','/tmp/f0.png'],check=True);im=Image.open('/tmp/f0.png')
    pw=min(im.width, 1920 if o=='l' else 1080);ph=round(pw*im.height/im.width)
    im.resize((pw,ph),Image.LANCZOS).save(f'films/{fid}/{o}-poster.webp','WEBP',quality=72,method=6)
    man[fid]['tiers'][o]={'src':out,'w':w,'h':h,'poster':f'films/{fid}/{o}-poster.webp','pw':pw,'ph':ph,'bytes':os.path.getsize(out),'status':s['status']}
    print(fid,o,w,h,os.path.getsize(out),'poster',pw,ph)
json.dump(man,open('films/manifest.json','w'),indent=1)

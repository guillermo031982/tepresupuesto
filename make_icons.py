# Uso: python3 make_icons.py logo-src.png  -> genera logo.png, icon-192/512, apple-touch-icon
import sys;from PIL import Image
s=Image.open(sys.argv[1]).convert('RGBA');bb=s.getbbox();s=s.crop(bb)
w,h=s.size;m=max(w,h);sq=Image.new('RGBA',(m,m),(0,0,0,0));sq.paste(s,((m-w)//2,(m-h)//2));
sq.resize((400,400),Image.LANCZOS).save('logo.png',optimize=True)
for n,z,bg in[('icon-192.png',192,1),('icon-512.png',512,1),('apple-touch-icon.png',180,1)]:
  c=Image.new('RGBA',(z,z),(255,255,255,255));p=int(z*.06);r=sq.resize((z-2*p,z-2*p),Image.LANCZOS);c.paste(r,(p,p),r);c.convert('RGB').save(n,optimize=True)

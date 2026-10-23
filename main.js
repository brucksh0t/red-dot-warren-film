/* Red Dot · The red table on Warren. One scroll owner (native scroll + GSAP ScrollTrigger).
   Films are driven by films/manifest.json. type "frames" = numbered webp frames; type "video" = a clip
   per tier ({src,w,h}) seeked by scroll. Swap clips by editing the manifest only. Frames/clips are drawn
   into a canvas the size of the frame and shown at <= frame/devicePixelRatio CSS px (never upscaled). */
(function(){
'use strict';
var H=document.documentElement, MOTION=H.classList.contains('motion');
var $=function(s,r){return (r||document).querySelector(s)}, $$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
function clamp(v,a,b){return v<a?a:v>b?b:v}

/* ---------- taps (work with or without motion) ---------- */
document.addEventListener('pointerdown',function(e){var b=e.target.closest('.btn,.logo,.plates figure');if(!b)return;b.classList.add('tap');setTimeout(function(){b.classList.remove('tap')},160)},{passive:true});
$$('.tl button').forEach(function(b){b.addEventListener('click',function(){var o=b.getAttribute('aria-expanded')==='true';b.setAttribute('aria-expanded',String(!o));document.getElementById(b.getAttribute('aria-controls')).hidden=o;if(window.ScrollTrigger)ScrollTrigger.refresh()})});
$$('.room').forEach(function(b){b.addEventListener('click',function(){var on=b.getAttribute('aria-pressed')!=='true';$$('.room').forEach(function(x){x.setAttribute('aria-pressed','false')});b.setAttribute('aria-pressed',String(on))})});
var tabs=$$('[role=tab]');
function sel(t){tabs.forEach(function(x){var s=x===t;x.setAttribute('aria-selected',String(s));x.tabIndex=s?0:-1;document.getElementById(x.getAttribute('aria-controls')).hidden=!s});if(window.ScrollTrigger)ScrollTrigger.refresh()}
tabs.forEach(function(t,i){t.addEventListener('click',function(){sel(t)});t.addEventListener('keydown',function(e){var d=e.key==='ArrowRight'?1:e.key==='ArrowLeft'?-1:0;if(!d)return;var n=tabs[(i+d+tabs.length)%tabs.length];sel(n);n.focus();e.preventDefault()})});
try{var wd=new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',weekday:'short'}).format(new Date());var di={Sun:0,Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6}[wd];var tr=$('.hours tr[data-d="'+di+'"]');if(tr){tr.classList.add('today');tr.querySelector('th').insertAdjacentHTML('beforeend',' <span class="kick" style="color:inherit">· today</span>')}}catch(e){}

if(!MOTION||!window.gsap||!window.ScrollTrigger){H.classList.remove('motion');return}
gsap.registerPlugin(ScrollTrigger);

var films={}, started=false, nav=function(){return parseFloat(getComputedStyle(H).getPropertyValue('--nav'))||64};
function portrait(){return innerHeight>innerWidth}

function Film(el,spec){
  this.el=el;this.spec=spec;this.pin=$('.pin',el);this.media=$('.media',el);this.info=$('[data-info]',el);
  this.cv=document.createElement('canvas');this.cv.className='f';this.cv.setAttribute('aria-hidden','true');
  this.ctx=this.cv.getContext('2d');this.media.appendChild(this.cv);this.p=0;this.idx=-1;this.showInfo=false;
  this.label=this.info?this.info.textContent:'';
  var me=this;this.cv.addEventListener('click',function(){me.showInfo=!me.showInfo;me.caption()});
  this.setTier();
}
Film.prototype.setTier=function(){
  var t=this.pick(); if(t===this.tier)return; this.tier=t; var s=this.spec.tiers[t];
  this.w=s.w;this.h=s.h;this.cv.width=s.w;this.cv.height=s.h;this.frames=[];this.loaded=[];this.loading=false;this.idx=-1;
  if(this.spec.type==='video'){var v=this.v=document.createElement('video');v.muted=true;v.playsInline=true;v.preload='auto';v.src=s.src;var me=this;v.addEventListener('seeked',function(){me.ctx.drawImage(v,0,0,me.w,me.h);me.el.classList.add('ready')});}
  else{this.load(0,1);} // first frame immediately (same image as the poster)
  this.layout();
};
Film.prototype.fit=function(t){var s=this.spec.tiers[t],dpr=window.devicePixelRatio||1,vw=this.pin.clientWidth||innerWidth,vh=this.pin.clientHeight||innerHeight;
  var k=portrait()?Math.min(vw/s.w,1/dpr,(vh*.62)/s.h):Math.min(Math.max(vw/s.w,vh/s.h),1/dpr);return {k:k,area:Math.min(s.w*k,vw)*Math.min(s.h*k,vh)}};
Film.prototype.pick=function(){if(!portrait())return 'd';return this.fit('m').area>=this.fit('d').area?'m':'d'};
Film.prototype.url=function(i){var s=this.spec.tiers[this.tier];return s.path+('00'+i).slice(-3)+'.webp'};
Film.prototype.load=function(from,only){
  var me=this,s=this.spec.tiers[this.tier],n=only?from+1:s.count,q=[],act=0,tier=this.tier;
  for(var i=from;i<n;i++)if(!this.frames[i])q.push(i);
  // load in a spread order so a fast scroll always finds a near frame
  if(!only){q.sort(function(a,b){return (a%8)-(b%8)||a-b})}
  function next(){if(tier!==me.tier)return;while(act<6&&q.length){(function(i){act++;var im=new Image();im.decoding='async';me.frames[i]=im;
    im.onload=function(){act--;me.loaded[i]=true;if(i===0||Math.abs(i-me.want())<=1)me.draw(true);next()};
    im.onerror=function(){act--;next()};im.src=me.url(i)})(q.shift())}}
  next();
};
Film.prototype.want=function(){var n=this.spec.tiers[this.tier].count;return Math.round(clamp(this.p,0,1)*(n-1))};
Film.prototype.draw=function(force){
  if(this.spec.type==='video'){var v=this.v;if(v.duration)v.currentTime=clamp(this.p,0,1)*(v.duration-0.04);return}
  var w=this.want(),n=this.frames.length,best=-1;
  for(var d=0;d<n+1;d++){if(this.loaded[w-d]){best=w-d;break}if(this.loaded[w+d]){best=w+d;break}}
  if(best<0||(best===this.idx&&!force))return;this.idx=best;this.ctx.drawImage(this.frames[best],0,0,this.w,this.h);this.el.classList.add('ready');this.caption();
};
Film.prototype.layout=function(){
  var dpr=window.devicePixelRatio||1,s=this.fit(this.tier).k;
  this.media.style.height=portrait()?Math.round(this.h*s)+'px':'';
  this.scale=s*dpr;var cw=this.w*s,ch=this.h*s;this.cv.style.width=cw+'px';this.cv.style.height=ch+'px';
  this.caption();
};
Film.prototype.caption=function(){if(!this.info)return;var n=this.spec.tiers[this.tier].count;
  this.info.textContent=this.showInfo?('frame '+(this.idx+1)+'/'+n+' · '+this.w+'×'+this.h+' · '+this.scale.toFixed(2)+'x'):this.label};

function proxyTL(film,trig,len,build){
  var o={p:0},tl=gsap.timeline({defaults:{ease:'none'},scrollTrigger:{trigger:trig,pin:film.pin,start:'top top',end:'+='+len+'%',scrub:.5,anticipatePin:1,
    onEnter:function(){film.load(0)},onEnterBack:function(){film.load(0)}}});
  tl.to(o,{p:1,duration:1,onUpdate:function(){film.p=build.map?build.map(o.p):o.p;film.draw()}},0);
  if(build.extra)build.extra(tl);
  return tl;
}

fetch('films/manifest.json').then(function(r){return r.json()}).then(function(man){
  $$('.film').forEach(function(el){var id=el.getAttribute('data-film');films[id]=new Film(el,man[id])});
  var F=films;
  // prefetch neighbours: start loading a film's frames when it is within 1.5 screens
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting&&started)F[e.target.getAttribute('data-film')].load(0)})},{rootMargin:'150% 0px'});
  $$('.film').forEach(function(el){io.observe(el)});
  function start(){if(started)return;started=true;F.frites.load(0);F.benedict.load(0);removeEventListener('scroll',start);removeEventListener('touchstart',start);removeEventListener('wheel',start)}
  addEventListener('scroll',start,{passive:true});addEventListener('touchstart',start,{passive:true});addEventListener('wheel',start,{passive:true});
  addEventListener('load',function(){setTimeout(start,4000)});

  // HERO: frites push-in, holds the poster for the first 6%
  proxyTL(F.frites,F.frites.el,200,{map:function(p){return clamp((p-.06)/.9,0,1)}});

  // DOT: word cut from solid red; scales about the O’s left stroke, so the camera passes into the O and lands on the plate, then the Benedict film plays on
  var svg=$('#dot svg'),g=$('#dot .dg'),word=$('#dot .dw'),geo={cx:0,cy:0,S:1};
  function fitDot(){var vw=svg.clientWidth,vh=svg.clientHeight,mb=$('#dot .media').getBoundingClientRect(),pb=$('#dot .pin').getBoundingClientRect(),my=mb.top-pb.top+mb.height/2,mh=Math.min(mb.height,vh);svg.setAttribute('viewBox','0 0 '+vw+' '+vh);
    $$('#dot .mr').forEach(function(r){r.setAttribute('width',vw);r.setAttribute('height',vh)});
    word.setAttribute('x',vw/2);word.setAttribute('y',my);word.setAttribute('font-size',mh*.9);g.removeAttribute('transform');
    var bb=word.getBBox(),k=Math.min(1,(vw*.92)/bb.width);word.setAttribute('font-size',mh*.9*k);
    var o=word.getExtentOfChar(1);geo.cx=o.x+o.width*.135;geo.cy=o.y+o.height/2;geo.S=1.2*Math.hypot(vw,vh)/(.11*o.width);setDot(geo.k||0)}
  function setDot(k){geo.k=k;var s=1+(geo.S-1)*k*k*k;g.setAttribute('transform','translate('+geo.cx+' '+geo.cy+') scale('+s+') translate('+(-geo.cx)+' '+(-geo.cy)+')');svg.style.visibility=k>=.999?'hidden':'visible'}
  var band=$('#dot .band');gsap.set(band,{clipPath:'inset(0 100% 0 0)'});
  var dk={k:0};
  proxyTL(F.benedict,F.benedict.el,260,{extra:function(tl){
    tl.to(dk,{k:1,duration:.44,onUpdate:function(){setDot(dk.k)}},.06);
    tl.to(band,{clipPath:'inset(0 0% 0 0)',duration:.12},.6)}});

  // three impact films: brunch descent, bar truck (Benedict above is the first)
  [['latke',220],['bar',180]].forEach(function(a){var f=F[a[0]],b=$('.band',f.el);gsap.set(b,{clipPath:'inset(0 100% 0 0)'});
    proxyTL(f,f.el,a[1],{extra:function(tl){tl.to(b,{clipPath:'inset(0 0% 0 0)',duration:.12},.1)}})});

  // hard wipes into the quiet sections
  $$('.quiet .wiper').forEach(function(w){gsap.fromTo(w,{scaleX:1},{scaleX:0,ease:'none',scrollTrigger:{trigger:w.parentNode,start:'top 90%',end:'top 30%',scrub:true}})});

  ScrollTrigger.addEventListener('refreshInit',function(){Object.keys(F).forEach(function(k){F[k].setTier();F[k].layout()})});
  document.fonts&&document.fonts.ready.then(function(){fitDot();ScrollTrigger.refresh()});
  ScrollTrigger.addEventListener('refresh',fitDot);
  fitDot();
  window.__rd={films:F,dot:geo};
}).catch(function(e){H.classList.remove('motion');console.warn('films unavailable',e)});
})();

/* Red Dot · The red table on Warren. One scroll owner (native scroll + GSAP ScrollTrigger, scrub:true).
   Films come from films/manifest.json: one all-keyframe AI clip per film per orientation (l/p), seeked by
   scroll progress and shown full-bleed (object-fit:cover). Clips are 720p AI masters upscaled with Topaz Proteus (3840x2160 / 1440x2560); swapping
   the upscaled files in needs only build-clips.py. Nothing film-related loads before the first interaction. */
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
try{var HRS={0:'Brunch 11–3 · Dinner 5–9:30 PM',1:'Dinner 5–9:30 PM',2:'Dinner 5–9:30 PM',3:'Hours not posted · call (518) 828-3657',4:'Hours not posted · call (518) 828-3657',5:'Dinner 5–9:30 PM',6:'Brunch 11–3 · Dinner 5–9:30 PM'};var wd=new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',weekday:'short'}).format(new Date());var di={Sun:0,Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6}[wd];var tr=$('.hours tr[data-d="'+di+'"]');var tn=$('[data-tonight]');if(tn&&di!=null)tn.textContent='Today: '+HRS[di];if(tr){tr.classList.add('today');tr.querySelector('th').insertAdjacentHTML('beforeend',' <span class="kick" style="color:inherit">· today</span>')}}catch(e){}

if(!MOTION||!window.gsap||!window.ScrollTrigger){H.classList.remove('motion');return}
gsap.registerPlugin(ScrollTrigger);

var films={}, started=false, nav=function(){return parseFloat(getComputedStyle(H).getPropertyValue('--nav'))||64};
function portrait(){return innerHeight>innerWidth}

function Film(el,spec){
  this.el=el;this.spec=spec;this.pin=$('.pin',el);this.media=$('.media',el);this.info=$('[data-info]',el);
  this.label=this.info?this.info.textContent:'';this.p=0;this.showInfo=false;this.v=null;this.want=null;this.tier=null;
}
Film.prototype.pick=function(){return portrait()?'p':'l'};
Film.prototype.load=function(){ // only ever called after the first user interaction
  var t=this.pick();if(this.v&&t===this.tier)return;this.tier=t;var s=this.spec.tiers[t],me=this;
  if(this.v){this.v.remove();this.el.classList.remove('ready')}
  var v=this.v=document.createElement('video');v.muted=true;v.defaultMuted=true;v.playsInline=true;v.setAttribute('playsinline','');v.preload='auto';v.disablePictureInPicture=true;
  v.setAttribute('aria-hidden','true');v.tabIndex=-1;v.src=s.src;this.w=s.w;this.h=s.h;
  v.addEventListener('loadedmetadata',function(){me.draw()});v.addEventListener('loadeddata',function(){me.busy=false;me.draw()});
  v.addEventListener('seeked',function(){me.el.classList.add('ready');me.busy=false;me.caption();if(me.want!=null&&Math.abs(me.want-v.currentTime)>.001)me.seek()});
  v.addEventListener('click',function(){me.showInfo=!me.showInfo;me.caption()});
  this.media.appendChild(v);
};
Film.prototype.draw=function(){var v=this.v;if(!v||!v.duration||v.readyState<1)return;var fps=10,n=Math.round(v.duration*fps);
  this.idx=Math.round(clamp(this.p,0,1)*(n-1));this.want=this.idx/fps+.5/fps;if(!this.busy)this.seek()};
Film.prototype.seek=function(){var v=this.v;if(!v||v.readyState<1)return;var t=this.want==null?.05:this.want;
  if(Math.abs(v.currentTime-t)<.001&&v.readyState>=2){this.busy=false;this.el.classList.add('ready');return}this.busy=true;v.currentTime=t};
Film.prototype.layout=function(){if(this.started&&this.pick()!==this.tier)this.load();this.caption()};
Film.prototype.caption=function(){if(!this.info)return;var v=this.v,r=this.media.getBoundingClientRect();
  if(!this.showInfo||!v){this.info.textContent=this.label;return}
  var k=Math.max(r.width/this.w,r.height/this.h);this.info.textContent='frame '+((this.idx||0)+1)+' · '+this.w+'×'+this.h+' · '+k.toFixed(2)+'x css · Topaz upscale'};

function proxyTL(film,trig,len,build){
  var o={p:0},tl=gsap.timeline({defaults:{ease:'none'},scrollTrigger:{trigger:trig,pin:film.pin,start:'top top',end:'+='+len+'%',scrub:true,anticipatePin:1}});
  tl.to(o,{p:1,duration:1,onUpdate:function(){film.p=build.map?build.map(o.p):o.p;film.draw()}},0);
  if(build.extra)build.extra(tl);
  return tl;
}

fetch('films/manifest.json').then(function(r){return r.json()}).then(function(man){
  $$('.film').forEach(function(el){var id=el.getAttribute('data-film');films[id]=new Film(el,man[id])});
  var F=films;
  // nothing film-related is fetched before the first interaction; then a film's clip loads when it is within one screen
  var near={};function go(id){var f=F[id];if(!started||f.started)return;f.started=true;f.load();f.draw()}
  var io=new IntersectionObserver(function(es){es.forEach(function(e){var id=e.target.getAttribute('data-film');near[id]=e.isIntersecting;if(e.isIntersecting)go(id)})},{rootMargin:'100% 0px'});
  $$('.film').forEach(function(el){io.observe(el)});
  var EV=['scroll','wheel','touchstart','keydown','pointerdown'];
  function start(){if(started)return;started=true;EV.forEach(function(e){removeEventListener(e,start)});Object.keys(near).forEach(function(id){if(near[id])go(id)})}
  EV.forEach(function(e){addEventListener(e,start,{passive:true})});

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

  ScrollTrigger.addEventListener('refreshInit',function(){Object.keys(F).forEach(function(k){F[k].layout()})});
  document.fonts&&document.fonts.ready.then(function(){fitDot();ScrollTrigger.refresh()});
  ScrollTrigger.addEventListener('refresh',fitDot);
  fitDot();
  window.__rd={films:F,dot:geo};
}).catch(function(e){H.classList.remove('motion');console.warn('films unavailable',e)});
})();

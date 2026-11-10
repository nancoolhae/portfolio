/* 各 모션은 동일한 0~1 진행률을 공유한다. rAF로 스크롤을 묶고, 역방향도 같은 계산으로 복원한다. */
(()=>{'use strict';
const section=document.querySelector('#about.about-scroll');if(!section)return;
const frame=section.querySelector('.about-roll-frame'),stage=section.querySelector('.about-roll-stage');
const fruit=name=>section.querySelector('.about-fruit.'+name),copies=[...section.querySelectorAll('.about-roll-copy')];
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const clamp=x=>Math.max(0,Math.min(1,x)),smooth=x=>{x=clamp(x);return x*x*(3-2*x)},phase=(p,a,b)=>smooth((p-a)/(b-a));
let metrics,queued=false;
function measure(){const preferredWidth=innerWidth<=740?Math.min(340,Math.max(240,innerWidth*.62)):360;const size=Math.min(preferredWidth*.86,innerHeight*.36);section.style.setProperty('--rolling-fruit-size',size+'px');metrics={size,start:section.getBoundingClientRect().top+scrollY-(parseFloat(getComputedStyle(frame).top)||0),length:Math.max(1,section.offsetHeight-frame.offsetHeight)};render()}
function image(name,opacity,x=0,y=0,angle=0,sx=1,sy=sx){const el=fruit(name);el.style.opacity=opacity.toFixed(4);el.style.transform=`translate3d(${x}px,${y}px,0) rotate(${angle}deg) scale(${sx},${sy})`}
function render(){queued=false;if(!metrics||reduced.matches)return;const {size,start,length}=metrics,p=clamp((scrollY-start)/length),roll=phase(p,.005,.16),join=phase(p,.835,.95),fit=Math.min(1,(stage.clientWidth-24)/(size*3.95));const scale=1+(fit-1)*join;section.style.setProperty('--group-scale',scale);
// 섹션에 들어오면 귤이 바로 굴러오기 시작한다.
const travel=innerWidth*.55+size,x=travel*(1-roll),angle=x/(size*.43)*180/Math.PI,visible=phase(p,0,.02);
const peel=phase(p,.455,.495)*(1-phase(p,.815,.855));
// 두 번 작아졌다가 원래 크기로 돌아오는 주무르기. 스크롤을 멈추면 그 상태를 유지한다.
const squeeze=Math.sin(2*Math.PI*clamp((p-.335)/.105))**2,sx=1-.10*squeeze,sy=1-.045*squeeze;
const detach=phase(p,.605,.665)*(1-phase(p,.765,.815));
image('whole',visible*(1-peel),x,0,angle,sx,sy);image('peeled',visible*peel*(1-detach));image('peeled-gap',visible*peel*detach);
image('segment',peel*phase(detach,0,.15),size*(.13+.56*detach),size*(.08+.12*detach),-70+45*detach,.58);
// 각자의 크기와 출발 시점을 달리해 세 사람이 합류하는 느낌을 만든다.
[['orange',-.83,.86,.84,.935],['green',-1.44,.63,.855,.955],['hallabong',.90,1.08,.845,.95]].forEach(([name,target,s,a,b])=>{const q=phase(p,a,b),distance=(innerWidth*.65+size)/scale,offset=(target<0?-1:1)*distance*(1-q);image(name,phase(p,a,a+.012),target*size+offset,size*(1-s)*.32,offset/(size*s*.43)*180/Math.PI,s)});
const windows=[[.16,.20,.30,.34],[.34,.38,.455,.495],[.495,.535,.605,.645],[.645,.685,.765,.805],[.925,.965,2,3]];
copies.forEach((el,i)=>{const [a,b,c,d]=windows[i],v=phase(p,a,b)*(1-phase(p,c,d));el.style.opacity=v.toFixed(4);el.style.transform=`translateY(${22*(1-v)}px)`});section.dataset.rollProgress=p.toFixed(4)}
function schedule(){if(!queued){queued=true;requestAnimationFrame(render)}}
function setup(){section.classList.toggle('about-scroll-active',!reduced.matches);if(reduced.matches){section.querySelectorAll('.about-fruit,.about-roll-copy').forEach(e=>{e.style.opacity='';e.style.transform=''})}measure()}
setup();addEventListener('scroll',schedule,{passive:true});addEventListener('resize',measure,{passive:true});addEventListener('load',measure,{once:true});reduced.addEventListener('change',setup);
})();

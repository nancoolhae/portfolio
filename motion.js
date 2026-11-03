/* 섹션은 처음 보일 때 부드럽게 등장하고, 당도 게이지는 현재 값까지 늘어난다.
 * Observer 미지원 또는 움직임 줄이기 설정에서도 본문과 값은 항상 표시한다. */
(() => {
  'use strict';
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const targets=[
    '.introduction-copy','.introduction-fruit','.section-head',
    '.career-sidebar','.career-records','.sweetness>.eyebrow','.sweetness>h2',
    '.sweetness-tool','.sweetness-legend','.about-inner>.eyebrow','.about-inner>h2',
    '.about-strength','.about-stories article','.contact-heading','#contact-form',
    '.contact-info>div','.footer-main','.footer-bottom','.all-projects>.text-link',
    '.all-projects>.filters','.project-card'
  ].join(',');
  let observer=null;
  const reveal=element=>{
    element.dataset.scrollReveal='shown';
    observer?.unobserve(element);
  };
  function watch(root=document){
    root.querySelectorAll(targets).forEach(element=>{
      if(element.hasAttribute('data-scroll-reveal'))return;
      // 동작을 줄이는 환경/미지원 브라우저는 숨기지 않고 최종 값 표시.
      if(!observer||reduced.matches){reveal(element);return;}
      element.dataset.scrollReveal='waiting';
      if(element.matches('.project-card,.sweetness-tool,.about-stories article')){
        const siblings=[...element.parentElement.children];
        element.style.setProperty('--reveal-delay',`${(siblings.indexOf(element)%3)*75}ms`);
      }
      observer.observe(element);
    });
  }
  function start(){
    observer?.disconnect();observer=null;
    if('IntersectionObserver' in window&&!reduced.matches){
      observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting)reveal(entry.target);}),{threshold:.12,rootMargin:'0px 0px -28px 0px'});
      document.documentElement.dataset.scrollMotion='ready';
    }else document.documentElement.removeAttribute('data-scroll-motion');
    document.querySelectorAll('[data-scroll-reveal]').forEach(el=>{
      if(reduced.matches)reveal(el);
      else if(el.dataset.scrollReveal==='waiting')observer?.observe(el);
    });
    watch();
  }
  start();
  reduced.addEventListener('change',start);
  // 필터/이력 선택으로 새로 만들어진 카드도 같은 등장 규칙을 따른다.
  const dynamic=new MutationObserver(()=>watch());
  for(const id of ['project-grid','career-list']){
    const root=document.getElementById(id);
    if(root)dynamic.observe(root,{childList:true});
  }
  document.addEventListener('focusin',event=>{
    const target=event.target.closest('[data-scroll-reveal="waiting"]');
    if(target)reveal(target);
  });
})();


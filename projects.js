/* 문서별 카드 / 귤 카테고리 / 상세 팝업. 메인과 전체 페이지 공용, file:// 지원. */
(() => {
  'use strict';
  const data=window.PORTFOLIO, $=s=>document.querySelector(s);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const allPage=document.body.dataset.page==='all-projects',grid=$('#project-grid'),filters=$('#project-filters'),dialog=$('#project-dialog'),body=$('#project-detail'),initialTitle=document.title;
  const aliases={'전체':'all','대표':'featured','대표 프로젝트':'featured','스토리보드':'screen','화면설계서':'screen'};
  const requested=new URLSearchParams(location.search).get('filter')||'all';
  let selected=allPage?(aliases[requested]||requested):'featured';
  if(!data.categories.some(c=>c.id===selected))selected='all';
  // 외부 스킴과 상위 경로를 배제하고 등록된 실제 파일만 연결한다.
  const localFile=v=>typeof v==='string'&&/^(?:assets|files)\/[\w가-힣./ -]+$/.test(v)&&!v.includes('..')?v:null;
  function renderCards(){
    const category=data.categories.find(c=>c.id===selected),list=category.projects.map(id=>data.projects.find(p=>p.id===id)).filter(Boolean);
    grid.innerHTML=list.map(p=>`<article class="project-card" data-project="${p.id}"><a class="card-visual ${esc(p.color)}" href="#project/${p.id}" aria-label="${esc(p.title)} 상세 보기">${p.image?`<img src="${esc(p.image)}" alt="${esc(p.imageAlt || p.name+' 기존 문서 발췌 이미지')}" loading="lazy" width="846" height="426">`:`<span class="card-type-art">${esc(p.name)}<small>${esc(p.type)}</small></span>`}<span class="card-arrow" aria-hidden="true">↗</span></a><div class="card-meta"><div class="tag-row" aria-label="활용 역량">${p.tags.map(t=>`<span>${esc(t)}</span>`).join('')}</div><h3><a href="#project/${p.id}">${esc(p.title)}</a></h3><p class="card-summary">${esc(p.summary)}</p><div class="card-date"><span class="card-document-type">${esc(p.type)}</span><span>${esc(p.period)}</span></div></div></article>`).join('');
    $('#project-count').textContent=`${category.label}, ${list.length}개 문서`;
    filters.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.filter===selected)));
  }
  if(allPage){
    filters.innerHTML=data.categories.map(c=>`<button type="button" data-filter="${c.id}" aria-pressed="${c.id===selected}">${esc(c.label)}</button>`).join('');
    filters.addEventListener('click',e=>{const b=e.target.closest('[data-filter]');if(!b)return;selected=b.dataset.filter;const url=new URL(location.href);if(selected==='all')url.searchParams.delete('filter');else url.searchParams.set('filter',selected);history.replaceState(null,'',url);renderCards();});
  }
  renderCards();
  grid.addEventListener('click',e=>{if(e.target.closest('a,button')||e.button!==0||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey||getSelection().toString())return;const card=e.target.closest('[data-project]');if(card)card.querySelector('h3 a').click();});

  /* 제목/닫기는 고정, 본문만 스크롤. Escape/닫기/뒤로가기에 위치와 포커스 복원. */
  let previousFocus=null,returnHash=location.hash.startsWith('#project/')?'#projects':location.hash,savedY=0;
  function downloadButton(item){const file=localFile(item.file);return file?`<a class="button primary" href="${esc(file)}" download>${esc(item.label)} ↓</a>`:`<button class="button pending-download" type="button" aria-disabled="true" data-missing-download="${esc(item.label)}">${esc(item.label)} <span class="download-state">등록 예정</span></button>`;}
  function detailMarkup(p){
    const meta=[['구분',p.type],['기간',p.period],['진행 인원',p.team],['담당 역할',p.role],['기여도',p.contribution],['활용 역량',p.skills]];
    // 상단에는 두 문서 유형을 표시하고, 하단은 프로젝트별 기존 목록을 사용한다.
    const topDownloads = ['전체 문서 내려받기', '화면설계서 내려받기'].map(label =>
      p.downloads.find(item => item.label === label) ?? {label, file: null}
    );
    const topDownloadMarkup = `<div class="project-downloads-top">
      <div class="project-downloads" role="group" aria-label="프로젝트 소개 아래 문서 내려받기">${topDownloads.map(downloadButton).join('')}</div>
      <p class="download-status" role="status"></p>
    </div>`;
    const previews=p.previews.filter(item=>localFile(typeof item==='string'?item:item.src));
    return `<dl class="project-facts">${meta.map(([k,v])=>`<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>${topDownloadMarkup}<div class="project-stories">${p.story.map((s,i)=>`<section class="project-story ${i===0?'story-growth':''}"><p class="story-label">${esc(s.label)}</p><h3>${esc(s.title)}</h3><p>${esc(s.body)}</p></section>`).join('')}</div><section class="project-previews" aria-label="문서 미리보기"><h3 class="preview-title">귤 맛보기 <img class="preview-emoji" src="assets/tangerine-ios.png" alt="" aria-hidden="true" width="24" height="24"></h3>${previews.length?previews.map((item,i)=>{const src=typeof item==='string'?item:item.src;return `<figure><img src="${esc(src)}" alt="${esc(typeof item==='string'?p.title+' 주요 장표 '+(i+1):item.alt)}"${typeof item!=='string' && item.width && item.height ? ` width="${Number(item.width)}" height="${Number(item.height)}"` : ''} loading="lazy"></figure>`;}).join(''):`<div class="preview-pending"><h3>문서 미리보기</h3><p>주요 장표를 준비하고 있어요.</p><p class="preview-note">현재는 프로젝트의 기획 과정과 역할을 위에서 확인하실 수 있습니다.</p></div>`}</section><div class="project-downloads">${p.downloads.map(downloadButton).join('')}</div><p id="download-status" class="download-status" role="status"></p>`;
  }
  function route(event){
    const id=location.hash.startsWith('#project/')?location.hash.slice(9):null,p=data.projects.find(p=>p.id===id);
    if(p){
      if(!dialog.open){previousFocus=document.activeElement;savedY=scrollY;if(event?.oldURL){const oldHash=new URL(event.oldURL).hash;if(!oldHash.startsWith('#project/'))returnHash=oldHash;}}
      $('#detail-title').textContent=p.title;$('#detail-summary').textContent=p.summary;body.innerHTML=detailMarkup(p);
      if(!dialog.open)dialog.showModal();document.body.classList.add('modal-open');body.scrollTop=0;$('#detail-title').focus({preventScroll:true});document.title=`${p.title} · 잘 익은 귤 김아현`;
    }else{
      if(dialog.open){dialog.close();document.body.classList.remove('modal-open');document.title=initialTitle;scrollTo({top:savedY,behavior:'instant'});if(previousFocus?.isConnected&&previousFocus!==document.body)previousFocus.focus({preventScroll:true});}
      returnHash=location.hash;
    }
  }
  function closeDetail(){history.replaceState(null,'',location.pathname+location.search+(returnHash||''));route();}
  $('#detail-close').addEventListener('click',closeDetail);
  function isBackdrop(event){
    if(event.target!==dialog)return false;
    const {left,right,top,bottom}=dialog.getBoundingClientRect();
    return event.clientX<left || event.clientX>=right ||
      event.clientY<top || event.clientY>=bottom;
  }
  let startedOnBackdrop=false;
  dialog.addEventListener('pointerdown',event=>{
    startedOnBackdrop=event.button===0 && isBackdrop(event);
  });
  dialog.addEventListener('click',event=>{
    if(startedOnBackdrop && isBackdrop(event))closeDetail();
    startedOnBackdrop=false;
  });
  dialog.addEventListener('cancel',e=>{e.preventDefault();closeDetail();});
  body.addEventListener('click',e=>{const b=e.target.closest('[data-missing-download]');if(b)b.closest('.project-downloads').nextElementSibling.textContent=`${b.dataset.missingDownload}: 원본 파일을 준비하고 있습니다.`;});
  addEventListener('hashchange',route);route();
  if(allPage){
    const toggle=$('#menu-toggle'),closeMenu=()=>{$('#gnb').classList.remove('open');toggle.setAttribute('aria-expanded','false');};
    toggle.addEventListener('click',()=>{const open=toggle.getAttribute('aria-expanded')!=='true';toggle.setAttribute('aria-expanded',String(open));$('#gnb').classList.toggle('open',open);});
    $('#gnb').addEventListener('click',e=>{if(e.target.closest('a'))closeMenu();});
    addEventListener('keydown',e=>{if(e.key==='Escape'&&toggle.getAttribute('aria-expanded')==='true'){closeMenu();toggle.focus();}});
    matchMedia('(min-width:741px)').addEventListener('change',e=>{if(e.matches)closeMenu();});
  }
})();

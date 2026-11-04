/* UI 모듈: 의존성 없이 DOMContentLoaded 이후(defer) 실행.
 * 원자료 기반 텍스트도 HTML로 해석하지 않도록 escape하고 파일 경로를 검증한다. */
(() => {
  'use strict';
  const data = window.PORTFOLIO;
  const $ = (selector) => document.querySelector(selector);
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  // 로컬 다운로드 파일만 허용. 스킴, 역슬래시, 상위 디렉토리 접근은 받지 않는다.
  const filePath = value => typeof value === 'string' && /^(?:files|assets)\/[\w가-힣./ -]+$/.test(value) && !value.includes('..') ? value : null;
  const download = (file, label) => filePath(file) ? `<a class="text-link" href="${esc(file)}" download>${esc(label)} ↓</a>` : `<span class="unavailable">${esc(label)} · 등록 예정</span>`;
  const dialog = $('#project-dialog');
  /* 2. 이력 칩: 원문에 없는 연도/학력/경력은 명시적 준비 상태를 보인다. */
  let careerKind = '학력';
  function renderCareer() {
    $('#career-filters').innerHTML = Object.keys(data.career).map(kind => `<button type="button" data-career="${kind}" aria-pressed="${kind === careerKind}">${kind}</button>`).join('');
    $('#career-list').innerHTML = data.career[careerKind].map(row => `<div class="career-row"><div><h3>${esc(row.title)}</h3>${row.text ? `<p${row.resultDescription ? ' class="career-result"' : ''}>${esc(row.text)}</p>` : ''}</div><span class="career-date">${esc(row.year)}</span></div>`).join('');
  }
  $('#career-filters').addEventListener('click', event => {
    const button = event.target.closest('[data-career]'); if (!button) return;
    careerKind = button.dataset.career; renderCareer();
    [...$('#career-filters').querySelectorAll('button')].find(b => b.dataset.career === careerKind).focus();
  });
  renderCareer();
  // 사용자가 제공한 A4-8의 15 Brix 척도를 사용한다. 실제 과일 측정값이 아닌 역량 메타포.
  $('#tools').innerHTML = data.tools.map(tool => `<div class="sweetness-tool"><span class="tool-symbol" aria-hidden="true">${esc(tool.icon)}</span><div><div class="sweetness-tool-heading"><h3>${esc(tool.name)}</h3></div><p>${esc(tool.description)}</p><div class="tool-meter-row"><span class="gauge-shell"><meter class="native-meter" min="0" max="15" value="${tool.brix}" aria-label="${esc(tool.name)} 역량 당도, 15 Brix 중 ${tool.brix} Brix">${tool.brix} / 15 Brix</meter><span class="gauge-track" aria-hidden="true"><span class="gauge-fill" style="--level:${tool.brix/15}"></span></span></span><span>${tool.brix} Brix</span></div></div></div>`).join('');
  // 소개 화면은 다운로드 대신 문서 보기. 원본 미등록 시 버튼 선택 후 상태를 안내한다.
  function documentButton(file,label) {
    return filePath(file) ? `<a class="button primary" href="${esc(file)}" download>${label} 보기</a>` : `<button class="button primary" type="button" aria-disabled="true" data-document-missing="${label}" title="${label} 파일 등록 예정">${label} 보기</button>`;
  }
  $('#personal-downloads').innerHTML = documentButton(data.documents.resume,'이력서') + documentButton(data.documents.letter,'자기소개서');
  $('#personal-downloads').addEventListener('click',event=> {
    const button = event.target.closest('[data-document-missing]');
    if(button)$('#document-status').textContent = `${button.dataset.documentMissing} 파일은 등록 예정입니다.`;
  });

  /* 4. 세 단계 인트로 상태 머신.
   * 1·2번째 입력: scale(1) → scale(.91,.88) → scale(1).
   * 3번째 입력: 통귤과 껍질이 벗겨진 실사 사진을 교차 페이드.
   * 인트로에서만 wheel/touch 기본 스크롤을 잠깐 보류하고 이후 자연 스크롤로 복귀.
   * 페이지 내 링크·건너뛰기·깊은 링크는 즉시 통과시켜 내비게이션을 막지 않는다.
   * 애니메이션 중 입력은 누적하지 않고, 완료 후 다음 휠 입력부터 다시 인식한다. */
  const fruit = $('#peel');
  const home = $('#home');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let introStep = 0, introBusy = false;
  let introLocked = !reduceMotion.matches && (!location.hash || location.hash === '#home');
  // 홈을 새로 불러오면 이전 방문의 스크롤 복원으로 인트로를 건너뛰지 않게 한다.
  // #career 등 직접 링크와 브라우저 뒤로가기는 기존의 자연스러운 위치 복원을 유지한다.
  if (introLocked) {history.scrollRestoration = 'manual';window.scrollTo({top:0,behavior:'instant'});}
  const introDurations = {squeeze:760,peel:1200};
  function updateIntro(message) {
    home.dataset.introStep = String(introStep);
    home.dataset.introLocked = String(introLocked);
    // 화면에는 단계 UI를 두지 않고 상태는 보조기기에만 전달한다.
    document.querySelectorAll('[data-intro-step]').forEach(el => el.classList.toggle('complete',Number(el.dataset.introStep) <= introStep));
    $('#peel-status').textContent = message;
    // 짧은 안내는 첫 두 단계에서 유지하고, 껍질 전환이 끝난 뒤 스크롤 안내로 바꾼다.
    $('#peel-hint').textContent = introStep === 3 && !introLocked
      ? '아래로 스크롤해주세요.' : '귤은 주무를수록 더 달아져요!';
  }
  function bypassIntro() {
    introLocked = false;
    history.scrollRestoration = 'auto';
    home.dataset.introLocked = 'false';
  }
  function atIntro() {
    return (introLocked || introStep < 3) && !dialog.open && window.scrollY <= home.offsetTop + 50 && !$('#gnb').classList.contains('open');
  }
  function advanceIntro() {
    if (introBusy || introStep >= 3) return;
    // 다른 섹션에서 홈으로 돌아온 뒤에도 클릭·휠 진행을 다시 잠근다.
    introLocked = true;
    introStep += 1; introBusy = true;
    if (introStep < 3) {
      fruit.classList.remove('squeezing');
      // 강제로 레이아웃을 한 번 읽어 두 번째 CSS 애니메이션도 처음부터 시작한다.
      void fruit.offsetWidth;
      fruit.classList.add('squeezing');
      updateIntro(introStep === 1 ? '첫 번째 경험을 더했어요. 한 번 더 스크롤해 주세요.' : '생각이 익어가요. 다음 스크롤에서 귤의 껍질을 벗겨보세요.');
      setTimeout(() => {fruit.classList.remove('squeezing');introBusy = false;},introDurations.squeeze);
    } else {
      fruit.classList.add('peeling');
      fruit.setAttribute('aria-label','껍질이 벗겨진 귤');
      updateIntro('문제의 속까지. 귤의 껍질이 벗겨집니다.');
      setTimeout(() => {
        // 벗기기 도중 메뉴로 이동한 경우에는 사용자가 선택한 위치를 유지한다.
        const moveToIntroduction = !dialog.open && window.scrollY <= home.offsetTop + 50 && !$('#gnb').classList.contains('open');
        introBusy = false; bypassIntro();
        updateIntro('귤의 껍질이 벗겨졌어요. 김아현의 소개로 이동합니다.');
        if (moveToIntroduction) {
          const title = $('#intro-title');
          title.setAttribute('tabindex','-1');
          title.focus({preventScroll:true});
          $('#introduction').scrollIntoView({behavior:reduceMotion.matches ? 'instant' : 'smooth',block:'start'});
        }
      },reduceMotion.matches ? 0 : introDurations.peel);
    }
  }
  fruit.addEventListener('click',advanceIntro);
  let lastWheel = 0, wheelDistance = 0;
  window.addEventListener('wheel',event => {
    // Ctrl+wheel 줌, 가로 제스처, 상단으로의 이동은 가로채지 않는다.
    if (event.ctrlKey || event.deltaY <= 0 || Math.abs(event.deltaX) > Math.abs(event.deltaY) || !atIntro()) return;
    event.preventDefault();
    const now = performance.now();
    if (now - lastWheel > 180) wheelDistance = 0;
    lastWheel = now;
    if (introBusy) {wheelDistance = 0;return;}
    wheelDistance += event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1);
    if (wheelDistance >= 55) {wheelDistance = 0;advanceIntro();}
  },{passive:false});
  let touchStartY = null, touchStartX = null, touchConsumed = false;
  window.addEventListener('touchstart',event => {
    if(event.touches.length !== 1) {touchStartY = null;return;}
    touchStartY = event.touches[0].clientY; touchStartX = event.touches[0].clientX; touchConsumed = false;
  },{passive:true});
  window.addEventListener('touchmove',event => {
    if(touchStartY === null || event.touches.length !== 1 || !atIntro()) return;
    const dy = touchStartY - event.touches[0].clientY, dx = touchStartX - event.touches[0].clientX;
    if(dy <= 0 || Math.abs(dx) > Math.abs(dy)) return;
    event.preventDefault();
    if(dy > 45 && !touchConsumed) {touchConsumed = true;advanceIntro();}
  },{passive:false});
  window.addEventListener('touchend',()=>{touchStartY = null;},{passive:true});
  window.addEventListener('keydown',event => {
    if (!atIntro() || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey || event.target.closest('input,textarea,select,button,a')) return;
    if(['ArrowDown','PageDown',' '].includes(event.key)) {event.preventDefault();if(!event.repeat)advanceIntro();}
    if(event.key === 'End')bypassIntro();
  });
  // 링크 선택은 항상 우선. Main 바로가기와 GNB는 인터랙션을 건너뛴다.
  document.addEventListener('click',event => {if(event.target.closest('a[href^="#"]'))bypassIntro();});
  window.addEventListener('hashchange',()=> {if(location.hash && location.hash !== '#home')bypassIntro();});
  window.addEventListener('scroll',()=> {if(window.scrollY > home.offsetTop + 60)bypassIntro();},{passive:true});
  function reducedIntro() {
    if(!reduceMotion.matches)return;
    introStep = 3; fruit.classList.add('peeling'); bypassIntro();
    fruit.setAttribute('aria-label','껍질이 벗겨진 귤');
    updateIntro('아래로 스크롤해 프로젝트를 만나보세요.');
  }
  reduceMotion.addEventListener('change',reducedIntro);
  fruit.querySelectorAll('img').forEach(img=>img.addEventListener('error',bypassIntro));
  updateIntro('스크롤을 세 번 내려, 귤의 속을 만나보세요.');
  reducedIntro();
  const toggle = $('#menu-toggle');
  function closeMenu() { $('#gnb').classList.remove('open'); toggle.setAttribute('aria-expanded','false'); }
  toggle.addEventListener('click',()=> { const open = toggle.getAttribute('aria-expanded') !== 'true'; toggle.setAttribute('aria-expanded',String(open)); $('#gnb').classList.toggle('open',open); });
  $('#gnb').addEventListener('click',event=> { if(event.target.closest('a')) closeMenu(); });
  addEventListener('keydown',event=> { if(event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {closeMenu(); toggle.focus();} });
  matchMedia('(min-width:741px)').addEventListener('change',event=> {if(event.matches) closeMenu();});

  /* 5. 스크롤 reveal / 현재 섹션 표시. observer 미지원 시 콘텐츠는 그대로 노출된다. */
  if ('IntersectionObserver' in window) {
    const active = new IntersectionObserver(entries=>entries.forEach(entry=>{if(!entry.isIntersecting)return; document.querySelectorAll('#gnb a').forEach(a=>{if(a.hash === '#'+entry.target.id)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});}),{rootMargin:'-20% 0px -55% 0px',threshold:0});
    document.querySelectorAll('main>section').forEach(el=>active.observe(el));
  }

  /* 6. mailto: 실제 전송은 사용자가 메일 앱에서 수행. 수신자 미등록이면 발송 불가.
   * 이름/회신 주소/메시지는 URL encoding하며 전송 완료라고 표시하지 않는다. */
  const email = typeof data.contact.email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.contact.email) ? data.contact.email : null;
  $('#contact-info').innerHTML = [['EMAIL',email,'✉'],['PHONE',data.contact.phone,'☎'],['LOCATION',data.contact.address,'<img src="assets/location-pin.svg" alt="" width="20" height="20">']].map(([label,value,icon])=>`<div><span class="contact-icon" aria-hidden="true">${icon}</span><div><dt>${label}</dt><dd>${value ? esc(value) : '정보 등록 예정'}</dd></div></div>`).join('');
  if (!email) $('#form-status').textContent = '수신 이메일 등록 예정입니다. 현재는 메일 초안을 열 수 없습니다.';
  $('#contact-form').addEventListener('submit',event=>{
    event.preventDefault();
    if (!email) {$('#form-status').textContent = '수신 이메일이 아직 등록되지 않았습니다. 연락처 등록 후 이용해주세요.';return;}
    const values = new FormData(event.currentTarget);
    const subject = `[포트폴리오 문의] ${values.get('sender')}`;
    const body = `보내시는 분: ${values.get('sender')}\n회신 이메일: ${values.get('reply')}\n\n${values.get('message')}`;
    location.href = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    $('#form-status').textContent = '메일 앱에 초안을 요청했습니다. 내용을 확인하고 메일 앱에서 전송해주세요.';
  });
})();

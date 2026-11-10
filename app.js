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
  $('#tools').innerHTML = data.tools.map(tool => `<div class="sweetness-tool" data-brix="${tool.brix}"><span class="tool-symbol" aria-hidden="true">${esc(tool.icon)}</span><div><div class="sweetness-tool-heading"><h3>${esc(tool.name)}</h3></div><p>${esc(tool.description)}</p><div class="tool-meter-row"><span class="gauge-shell"><meter class="native-meter" min="0" max="15" value="${tool.brix}" aria-label="${esc(tool.name)} 역량 당도, 15 Brix 중 ${tool.brix} Brix">${tool.brix} / 15 Brix</meter><span class="gauge-track" aria-hidden="true"><span class="gauge-fill" style="--level:${tool.brix/15}"></span></span></span><span>${tool.brix} Brix</span></div></div></div>`).join('');
  // 소개 화면은 다운로드 대신 문서 보기. 원본 미등록 시 버튼 선택 후 상태를 안내한다.
  function documentButton(file,label) {
    return filePath(file) ? `<a class="button primary" href="${esc(file)}" download>${label} 보기</a>` : `<button class="button primary" type="button" aria-disabled="true" data-document-missing="${label}" title="${label} 파일 등록 예정">${label} 보기</button>`;
  }
  $('#personal-downloads').innerHTML = documentButton(data.documents.resume,'알알이 채운 이력서') + documentButton(data.documents.letter,'속까지 깐 자기소개서');
  $('#personal-downloads').addEventListener('click',event=> {
    const button = event.target.closest('[data-document-missing]');
    if(button)$('#document-status').textContent = `${button.dataset.documentMissing} 파일은 등록 예정입니다.`;
  });

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

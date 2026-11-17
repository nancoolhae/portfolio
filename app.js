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
  const { phone, email } = data.contact;
  const contacts = [
    { label: '전화', profileLabel: '휴대전화', value: phone, icon: '☎', confirmation: '전화번호를 복사했어요.' },
    { label: '이메일', profileLabel: '이메일', value: email, icon: '✉', confirmation: '이메일을 복사했어요.' },
  ];
  $('#career-profile-title').textContent = data.profile.name;
  $('#career-profile-details').innerHTML = `
    <div><dt>생년월일</dt><dd>${esc(data.profile.birthDate)}</dd></div>
    <div><dt>주소</dt><dd>${esc(data.contact.address)}</dd></div>
    ${contacts.map(({ label, profileLabel, value }, index) => `
      <div><dt>${profileLabel}</dt><dd><button type="button" class="career-copy"
        data-contact-index="${index}" aria-label="${label} 복사: ${esc(value)}">${esc(value)}</button></dd></div>
    `).join('')}
  `;

  $('#career-list').innerHTML = Object.entries(data.career).map(([kind, rows]) => `
    <section class="career-records">
      <h3>${esc(kind)}</h3>
      <ul class="career-entries">
        ${rows.map(row => `
          <li class="career-row">
            <h4>${esc(row.title)}</h4>
            <span class="career-date">${esc(row.year)}</span>
            ${row.text ? `<p${row.resultDescription ? ' class="career-result"' : ''}>${esc(row.text)}</p>` : ''}
          </li>
        `).join('')}
      </ul>
    </section>
  `).join('');
  // 사용자가 제공한 A4-8의 15 Brix 척도를 사용한다. 실제 과일 측정값이 아닌 역량 메타포.
  $('#tools').innerHTML = data.tools.map(tool => `<div class="sweetness-tool" data-brix="${tool.brix}"><span class="tool-symbol" aria-hidden="true"><img src="${esc(tool.icon)}" alt="" width="36" height="36"></span><div><div class="sweetness-tool-heading"><h3>${esc(tool.name)}</h3></div><p>${esc(tool.description)}</p><div class="tool-meter-row"><span class="gauge-shell"><meter class="native-meter" min="0" max="15" value="${tool.brix}" aria-label="${esc(tool.name)} 역량 당도, 15 Brix 중 ${tool.brix} Brix">${tool.brix} / 15 Brix</meter><span class="gauge-track" aria-hidden="true"><span class="gauge-fill" style="--level:${tool.brix/15}"></span></span></span><span>${tool.brix} Brix</span></div></div></div>`).join('');
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

  const contactLinks = $('#contact-links');
  contactLinks.innerHTML = contacts.map(({ label, value, icon }, index) => `
    <button type="button" class="contact-card" data-contact-index="${index}">
      <span class="contact-card-label"><span class="contact-card-icon" aria-hidden="true">${icon}</span><span class="contact-card-caption">${label} <small>눌러서 복사하기</small></span></span>
      <span class="contact-card-value">${esc(value)}</span>
    </button>
  `).join('');

  const contactToast = $('#contact-toast');
  let toastTimer;
  $('main').addEventListener('click', async event => {
    const button = event.target.closest('[data-contact-index]');
    if (!button) return;

    const { value, confirmation } = contacts[button.dataset.contactIndex];
    let message = confirmation;
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      message = '복사하지 못했어요. 연락처를 직접 복사해주세요.';
    }

    clearTimeout(toastTimer);
    contactToast.textContent = message;
    toastTimer = setTimeout(() => { contactToast.textContent = ''; }, 2600);
  });
})();

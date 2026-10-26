import { destinations, buildRoutes } from './planner.js';
import { initSignup, setSignupContext } from './signup.js';

const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const escape = (s = '') => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = n => `${n.toLocaleString('ko-KR')}원`;
const icons = {
  'arrow-right': '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  'arrow-up-right': '<path d="M6 18 18 6M6 6h12v12"/>',
  'chevron-down': '<path d="m6 9 6 6 6-6"/>',
  bookmark: '<path d="M6 4h12v17l-6-4-6 4z"/>',
  users: '<path d="M15 21v-3a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v3m18 0v-3a4 4 0 0 0-3-3.9"/><circle cx="9" cy="6" r="4"/><path d="M16 2.2a4 4 0 0 1 0 7.6"/>',
  route: '<circle cx="5" cy="5" r="2"/><circle cx="19" cy="19" r="2"/><path d="M7 5h9a4 4 0 0 1 0 8H8a3 3 0 0 0 0 6h9"/>',
  'map-pin': '<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  x: '<path d="m6 6 12 12M18 6 6 18"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v.01"/>',
  spark: '<path d="m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5z"/>',
  food: '<path d="M4 3v6a3 3 0 0 0 6 0V3M7 3v18m13 0V3c-5 2-5 10 0 10"/>',
  bag: '<path d="M5 7h14l2 14H3zM9 7V5a3 3 0 0 1 6 0v2"/>',
  camera: '<path d="M4 6h4l2-3h4l2 3h4v14H4z"/><circle cx="12" cy="13" r="4"/>',
  exchange: '<path d="M3 7h17m-4-4 4 4-4 4M21 17H4m4-4-4 4 4 4"/>',
  train: '<rect x="5" y="3" width="14" height="15" rx="3"/><path d="M5 10h14M9 18l-3 4m9-4 3 4M8 15h1m6 0h1M12 3v7"/>',
  taxi: '<path d="m3 12 3-7h12l3 7v7H3zM3 12h18M8 5V3h8v2M6 15h2m8 0h2M6 19v2m12-2v2"/>',
  bus: '<rect x="4" y="3" width="16" height="17" rx="3"/><path d="M4 11h16M12 3v8M7 16h1m8 0h1M7 20v2m10-2v2"/>',
  shield: '<path d="m12 2 8 4v6c0 6-8 10-8 10S4 18 4 12V6z"/><path d="m8 12 3 3 5-5"/>',
};
const icon = name => `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${icons[name] || icons.spark}</svg>`;
function hydrateIcons(root = document) { $$('[data-icon]', root).forEach(el => { el.outerHTML = icon(el.dataset.icon); }); }

const events = [
  { id: 'seventeen', title: 'SEVENTEEN IN INCHEON', display: 'SEVENTEEN<br>IN INCHEON', short: 'SEVENTEEN', venue: '인천아시아드주경기장', dates: ['2026-11-07', '2026-11-08'], day: '07', month: 'NOVEMBER 2026', weekday: '토요일 · 19:00', swatch: 'S' },
  { id: 'day6', title: 'DAY6 FOREVER YOUNG', display: 'DAY6<br>FOREVER YOUNG', short: 'DAY6', venue: '고척스카이돔', dates: ['2026-11-14', '2026-11-15'], day: '14', month: 'NOVEMBER 2026', weekday: '토요일 · 19:00', swatch: 'D' },
  { id: 'festival', title: 'AUTUMN SOUND FESTIVAL', display: 'AUTUMN SOUND<br>FESTIVAL', short: 'AUTUMN SOUND', venue: '올림픽공원', dates: ['2026-11-21', '2026-11-22'], day: '21', month: 'NOVEMBER 2026', weekday: '토요일 · 17:00', swatch: 'A' },
];
const purposes = [
  { id: 'all', label: '전체', icon: 'spark' }, { id: 'food', label: '밥 한 끼', icon: 'food' },
  { id: 'md', label: 'MD 대기', icon: 'bag' }, { id: 'photo', label: '사진', icon: 'camera' },
  { id: 'exchange', label: '나눔·교환', icon: 'exchange' }, { id: 'ride', label: '함께 귀가', icon: 'route' },
];
const transports = [{ id: 'all', label: '모든 귀가 방식' }, { id: 'carpool', label: '카풀' }, { id: 'taxi', label: '택시팟' }, { id: 'transit', label: '대중교통·도보 동행' }];
const transportLabel = id => transports.find(t => t.id === id)?.label || '';
function normalizeMate(m) {
  return ['home', 'taxi', 'carpool', 'ride'].includes(m.purpose)
    ? { ...m, purpose: 'ride', transport: m.transport || (m.purpose === 'taxi' ? 'taxi' : m.purpose === 'carpool' ? 'carpool' : 'transit') }
    : m;
}
const templates = [
  { id: 'm10', purpose: 'carpool', transport: 'carpool', transportRole: 'driver', title: '인천 방향 카풀, 공연 여운 나누며 가요', name: '다온', initial: '다', color: 'sage', age: '30', gender: '성별 무관', time: 'after', at: '22:50', place: '공연장 밖 공개된 만남 장소', destination: 'incheon', count: 1, total: 3, day: 0, description: '공연이 끝나고 인천시청역 방향으로 돌아가요.\n같은 방향 두 분과 카풀하고 싶어요. 차량과 탑승 위치, 이동 동선은 출발 전에 함께 확인해요.\n차량 제공 모집을 보여주는 체험용 예시입니다.' },
  { id: 'm1', purpose: 'food', title: '공연 전에 든든하게 밥 먹고 가요', name: '윤슬', initial: '윤', color: 'sage', age: '20', gender: '여성', time: 'before', at: '15:30', place: '공연장 근처 식당', destination: '', count: 1, total: 2, day: 0, description: '혼자 가는 공연이라 밥 친구 구해요.\n근처에서 든든하게 먹고 각자 자리로 가면 좋겠어요. 낯을 조금 가리지만 좋아하는 노래 얘기하다 보면 금방 친해질 것 같아요.\n\n식사만 함께해도 괜찮아요 :)' },
  { id: 'm2', purpose: 'taxi', title: '끝나고 강남까지, 택시 같이 타요', name: '소금빵', initial: '소', color: 'rose', age: '20', gender: '여성', time: 'after', at: '22:50', place: '공연장 밖 편의점 앞', destination: 'gangnam', count: 2, total: 3, day: 0, description: '앵콜까지 다 보고 천천히 나올 예정이에요.\n강남역 쪽으로 가는 분과 택시비 나눠 타고 싶어요. 비용은 탑승 전에 같이 확인하고 정확히 나눠요.\n\n만나는 곳은 공연장 밖 밝은 편의점 앞으로 정해요.' },
  { id: 'm3', purpose: 'photo', title: '오늘의 착장, 서로 한 장씩 남겨요', name: '모찌', initial: '모', color: 'blue', age: '20', gender: '여성', time: 'before', at: '16:00', place: '공연장 포토존', destination: '', count: 1, total: 2, day: 0, description: '포토존에서 사진 서로 찍어주실 분!\n폰카로 15분 정도만 서로 찍고 자유롭게 헤어져요. 완전 금손은 아니지만 열심히 찍어드릴게요.\n\n공연 직전에는 복잡하니 여유 있게 만나고 싶어요.' },
  { id: 'm4', purpose: 'home', title: '강남 방향 지하철, 역까지 함께 걸어요', name: '수풀', initial: '수', color: 'sage', age: '30', gender: '여성', time: 'after', at: '22:45', place: '공연장 1번 출구 밖', destination: 'gangnam', count: 1, total: 3, day: 0, description: '처음 오는 공연장이라 끝나고 역까지 같이 걸어갈 분 구해요.\n강남 방향으로 갈 예정이고, 지하철 막차는 당일 같이 확인하려고 해요. 같이 가능한 구간까지만 동행해도 좋아요.' },
  { id: 'm5', purpose: 'md', title: 'MD 줄 설 때 심심하지 않게 같이 있어요', name: '밤밤', initial: '밤', color: 'lilac', age: '20', gender: '성별 무관', time: 'before', at: '12:00', place: '공식 MD 부스 근처', destination: '', count: 1, total: 2, day: 0, description: '점심쯤 MD 구경할 예정이에요.\n대신 줄 서기나 구매 대행이 아니라 같이 대기하며 이야기 나눌 분을 찾습니다. 각자 살 것 사고 편하게 헤어져요.' },
  { id: 'm6', purpose: 'exchange', title: '포카 교환하고 좋아하는 무대 얘기해요', name: '도토리', initial: '도', color: 'rose', age: '30', gender: '성별 무관', time: 'before', at: '16:30', place: '공연장 안내 부스 옆', destination: '', count: 1, total: 2, day: 1, description: '공연 전에 잠깐 만나 포토카드 교환하고 싶어요.\n금전 거래 없이 서로 맞는 카드가 있으면 교환하고, 없어도 무대 얘기하면서 반갑게 인사해요.' },
  { id: 'm7', purpose: 'taxi', title: '수원역 가는 길, 택시팟 한 분 더!', name: '연두', initial: '연', color: 'sage', age: '20', gender: '여성', time: 'after', at: '22:55', place: '공연장 밖 약속 장소', destination: 'suwon', count: 2, total: 3, day: 0, description: '수원역 방향으로 같이 가실 분 찾고 있어요.\n지금 두 명이고 세 명이서 나눠 타면 좋겠어요. 출발 전 요금과 중간 하차 여부를 함께 정해요.' },
  { id: 'm8', purpose: 'home', title: '홍대 방향, 앵콜 여운 나누며 돌아가요', name: '파도', initial: '파', color: 'blue', age: '20', gender: '성별 무관', time: 'after', at: '22:45', place: '공연장 안내 부스 밖', destination: 'hongdae', count: 1, total: 2, day: 0, description: '집 가는 길에도 공연 얘기하고 싶을 것 같아서요.\n홍대입구역 방향으로 대중교통 이용할 예정이에요. 막차 확인하고 무리하지 않는 동선으로 가요.' },
  { id: 'm9', purpose: 'taxi', title: '막콘 끝나고 강남까지 같이 돌아가요', name: '오후', initial: '오', color: 'lilac', age: '20', gender: '성별 무관', time: 'after', at: '22:55', place: '공연장 밖 약속 장소', destination: 'gangnam', count: 1, total: 3, day: 1, description: '막콘 끝나고 강남역으로 가려고 해요.\n한두 분과 함께 택시 타면 좋겠습니다. 약속 장소는 공연장 밖 편의점처럼 찾기 쉬운 곳으로 정해요.' },
];
const defaultState = { eventId: 'seventeen', destination: 'gangnam', saved: [], requests: [], routes: [], blocked: [], posts: [], reports: [] };
let state;
try { const parsed = JSON.parse(localStorage.getItem('momo-prototype-v1') || localStorage.getItem('after-prototype-v1') || '{}'); state = { ...defaultState, ...parsed }; for (const k of ['saved', 'requests', 'routes', 'blocked', 'posts', 'reports']) if (!Array.isArray(state[k])) state[k] = []; } catch { state = { ...defaultState }; }
if (!events.some(e => e.id === state.eventId)) state.eventId = 'seventeen';
if (!destinations.some(d => d.id === state.destination)) state.destination = 'gangnam';
let filters = { purpose: 'all', transport: 'all', transport: 'all', date: 'all', time: 'all', destination: 'all', age: 'all', sort: 'recommended' };
let homePurpose = 'all', homeTransport = 'all', savedTab = 'mates', toastTimer;
const currentEvent = () => events.find(e => e.id === state.eventId);
const currentDestination = () => destinations.find(d => d.id === state.destination);
const purposeInfo = id => purposes.find(p => p.id === id) || purposes[0];
const dateLabel = date => { const d = new Date(`${date}T12:00:00+09:00`); return `${d.getMonth() + 1}.${d.getDate()} (${['일', '월', '화', '수', '목', '금', '토'][d.getDay()]})`; };
function allMates() {
  return [...events.flatMap(event => templates.map(t => ({ ...t, id: `${event.id}-${t.id}`, eventId: event.id, date: event.dates[t.day] }))), ...state.posts].map(normalizeMate);
}
const getMate = id => allMates().find(m => m.id === id);
const visibleMates = () => allMates().filter(m => m.eventId === state.eventId && !state.blocked.includes(m.id));
function persist() { try { localStorage.setItem('momo-prototype-v1', JSON.stringify(state)); } catch { toast('브라우저 저장이 제한되어 이번 화면에서만 유지돼요.'); } updateCount(); }
function toast(message) { clearTimeout(toastTimer); const el = $('#toast'); $('span', el).textContent = message; el.hidden = false; toastTimer = setTimeout(() => { el.hidden = true; }, 3500); }
function updateCount() { const n = state.saved.length + state.routes.length; $('#saved-count').textContent = n; $('#saved-count').hidden = n === 0; }
function destinationOptions(includeAll = false) { return `${includeAll ? '<option value="all">모든 방향</option>' : ''}${destinations.map(d => `<option value="${d.id}">${d.label} · ${d.station}</option>`).join('')}`; }
function renderPurposeTabs(selector, value) { $(selector).innerHTML = purposes.map(p => `<button class="purpose-tab ${p.id === value ? 'active' : ''}" data-action="purpose" data-scope="${selector === '#home-purposes' ? 'home' : 'mates'}" data-id="${p.id}" aria-pressed="${p.id === value}">${icon(p.icon)}${p.label}</button>`).join(''); }
function renderRideFilters(selector, scope, purpose, value) {
  const el = $(selector); el.hidden = purpose !== 'ride';
  el.innerHTML = `<span>함께 돌아가는 방법</span>${transports.map(t => `<button class="ride-filter ${value === t.id ? 'active' : ''}" data-action="transport" data-scope="${scope}" data-id="${t.id}" aria-pressed="${value === t.id}">${t.label}</button>`).join('')}`;
}
function mateCard(m) {
  const p = purposeInfo(m.purpose), saved = state.saved.includes(m.id), direction = destinations.find(d => d.id === m.destination);
  return `<article class="mate-card" data-mate-id="${escape(m.id)}"><div class="card-top"><span class="purpose-badge ${['ride', 'md'].includes(m.purpose) ? 'green' : m.purpose === 'photo' ? 'blue' : ''}">${icon(p.icon)} ${p.label}</span><button class="icon-button ${saved ? 'saved' : ''}" data-action="save-mate" data-id="${escape(m.id)}" aria-label="${escape(m.title)} ${saved ? '저장 취소' : '저장'}" aria-pressed="${saved}">${icon('bookmark')}</button></div><button class="card-title" data-action="detail" data-id="${escape(m.id)}">${escape(m.title)}</button><div class="card-meta"><span>${icon('clock')}${dateLabel(m.date)} · ${m.at}</span><span>${icon('map-pin')}${direction ? direction.label + ' 방향' : '공연장 근처'}</span></div><div class="card-tags">${m.transport ? `<span class="transport-tag">${transportLabel(m.transport)}${m.transportRole === 'driver' ? ' · 차량 제공' : m.transportRole === 'passenger' ? ' · 동승 희망' : ''}</span>` : ''}<span>${m.age}대</span><span>${escape(m.gender)}</span><span>${m.time === 'before' ? '공연 전' : '공연 후'}</span></div><div class="card-footer"><span class="avatar ${m.color}">${escape(m.initial)}</span><div><div class="card-person">${escape(m.name)} ${m.own ? '' : icon('shield')}</div><div class="card-person-sub">${m.own ? '내가 올린 모집글' : '체험용 프로필'}</div></div><div class="card-spots">모집 인원<strong>${m.count} / ${m.total}명</strong></div></div></article>`;
}
function emptyState(title, description, button, emptyAction = 'reset') { return `<div class="empty-state">${icon('spark')}<h3>${title}</h3><p>${description}</p>${button ? `<button class="button outline small" data-action="${emptyAction}">${button}</button>` : ''}</div>`; }
function renderHome() {
  const event = currentEvent(); $('#hero-event-title').innerHTML = event.display; $('#hero-event-venue').textContent = event.venue; $('#hero-event-day').textContent = event.day; $('#hero-event-date').innerHTML = `${event.month}<b>${event.weekday}</b>`;
  $('#hero-mate-count').textContent = `${visibleMates().length}개의 메이트 모집 예시`;
  renderPurposeTabs('#home-purposes', homePurpose);
  renderRideFilters('#home-ride-filters', 'home', homePurpose, homeTransport);
  const list = visibleMates().filter(m => (homePurpose === 'all' || m.purpose === homePurpose) && (homeTransport === 'all' || m.transport === homeTransport)).slice(0, 3);
  $('#home-mates').innerHTML = list.length ? list.map(mateCard).join('') : emptyState('아직 이 순간의 메이트가 없어요', '첫 번째 모집글을 남겨보세요.', '메이트 모집하기', 'create');
  $('#home-destination').value = state.destination;
}
function filteredMates() {
  const result = visibleMates().filter(m => (filters.purpose === 'all' || m.purpose === filters.purpose) && (!filters.transport || filters.transport === 'all' || m.transport === filters.transport) && (filters.date === 'all' || m.date === filters.date) && (filters.time === 'all' || m.time === filters.time) && (filters.destination === 'all' || m.destination === filters.destination) && (filters.age === 'all' || m.age === filters.age));
  return filters.sort === 'latest' ? result.reverse() : result;
}
function renderMates() {
  const event = currentEvent(); $('#mates-event-label').textContent = `${event.title} · ${event.venue}`;
  $('#filter-date').innerHTML = '<option value="all">모든 공연 날짜</option>' + event.dates.map((d, i) => `<option value="${d}">${dateLabel(d)} · ${i === event.dates.length - 1 ? '막콘' : '첫콘'}</option>`).join('');
  ['date', 'time', 'destination', 'age'].forEach(k => { $(`#filter-${k}`).value = filters[k]; }); $('#sort-mates').value = filters.sort;
  renderPurposeTabs('#mate-purposes', filters.purpose);
  renderRideFilters('#mate-ride-filters', 'mates', filters.purpose, filters.transport || 'all');
  const list = filteredMates(); $('#result-count').innerHTML = `조건에 맞는 메이트 <b>${list.length}</b>팀`;
  $('#all-mates').innerHTML = list.length ? list.map(mateCard).join('') : emptyState('조건이 꼭 맞는 메이트를 아직 못 찾았어요', '조건을 조금 넓혀보거나 직접 모집해 보세요.', '조건 초기화');
}
function routeCard(route, { savedView = false, eventId = state.eventId, destination = state.destination } = {}) {
  const saved = state.routes.some(r => r.id === route.id), key = `${savedView ? 'saved-' : ''}${route.id}`;
  const overnight = route.available && route.arrival < route.departure;
  return `<article class="route-card" data-type="${route.type}"><div class="route-summary"><span class="route-icon">${icon(route.type === 'shuttle' ? 'bus' : route.type === 'taxi' ? 'taxi' : 'train')}</span><div class="route-description"><h3>${route.label}<span class="route-tag">${route.type === 'taxi' ? '3인 분담 예시' : route.type === 'transit' ? '막차 확인 필요' : '운행 가정'}</span></h3><p>${route.available ? `${route.departure} 출발 → ${overnight ? '다음 날 ' : ''}${route.arrival} 도착 · 약 ${route.duration}분` : '이 방향의 셔틀 예시는 없어요'}</p></div><div class="route-price">${route.available ? money(route.type === 'taxi' ? route.perPerson : route.price) : '—'}<span>${route.type === 'taxi' && route.available ? `1인 · 총 ${money(route.price)}` : route.available ? '1인 예상 금액' : '실제 운행 여부 별도 확인'}</span></div></div><p class="route-warning">${icon('info')}<span>${escape(route.warning)}</span></p>${route.available ? `<div class="route-bottom"><span>${icon('map-pin')}${escape(destinations.find(d => d.id === destination).station)} 방향</span><button data-action="route-detail" data-target="${key}" aria-expanded="false">이동 과정 보기 ${icon('chevron-down')}</button></div><div class="route-details" id="${key}" hidden>${route.steps.map(s => `<div class="route-step"><time>${escape(s.time)}</time><span></span><div><b>${escape(s.title)}</b><p>${escape(s.detail)}</p></div></div>`).join('')}<p class="route-disclaimer">${escape(route.note)}</p><button class="button outline small" data-action="save-route" data-type="${route.type}" data-event="${eventId}" data-destination="${destination}">${icon(saved ? 'check' : 'bookmark')}${saved ? '보관함에서 삭제' : '이 귀가 플랜 저장'}</button></div>` : ''}</article>`;
}
function renderJourney() {
  const event = currentEvent(), destination = currentDestination();
  $('#journey-event-label').textContent = event.title; $('#journey-venue').textContent = `${event.venue} · ${dateLabel(event.dates[0])} 기준`;
  $('#journey-destination').value = state.destination; $('#route-heading').textContent = `${destination.station}까지 가는 방법`;
  $('#route-cards').innerHTML = buildRoutes(event, destination).map(r => routeCard(r)).join('');
  const matching = visibleMates().filter(m => m.destination === state.destination && m.date === event.dates[0] && m.purpose === 'ride');
  $('#direction-description').innerHTML = `<b>${destination.label}</b> 방향으로 가는<br>메이트 모집 예시가 <b>${matching.length}개</b> 있어요.`;
  $('#direction-mates').innerHTML = matching.length ? matching.slice(0, 3).map(m => `<button class="mini-mate" data-action="detail" data-id="${m.id}"><span class="avatar ${m.color}">${escape(m.initial)}</span><div><b>${escape(m.name)} · ${m.transport ? transportLabel(m.transport) : purposeInfo(m.purpose).label}</b><small>${dateLabel(m.date)} · ${m.at} · ${m.age}대</small></div>${icon('arrow-up-right')}</button>`).join('') : '<p class="muted small">아직 같은 방향의 모집글이 없어요.<br>직접 첫 동행을 모집해 보세요.</p>';
}
function renderSaved() {
  $$('#saved-tabs button').forEach(b => { b.classList.toggle('active', b.dataset.savedTab === savedTab); b.setAttribute('aria-pressed', b.dataset.savedTab === savedTab); });
  let html = '';
  if (savedTab === 'mates') { const list = state.saved.map(getMate).filter(m => m && !state.blocked.includes(m.id)); html = list.length ? `<div class="mate-grid">${list.map(mateCard).join('')}</div>` : emptyState('마음에 드는 메이트를 저장해 보세요', '카드 오른쪽의 책갈피를 누르면 여기에 모여요.', '메이트 둘러보기', 'browse'); }
  if (savedTab === 'requests') { html = state.requests.length ? state.requests.map(r => { const m = getMate(r.mateId); if (!m) return ''; return `<article class="request-card"><span class="avatar ${m.color}">${escape(m.initial)}</span><div><span class="status-label">체험 요청 저장됨</span><h3>${escape(m.title)}</h3><p>${escape(r.message)}</p><p>${events.find(e => e.id === m.eventId).short} · ${dateLabel(m.date)} · ${escape(m.name)}에게</p></div><button class="button outline small" data-action="cancel-request" data-id="${m.id}">요청 취소</button></article>`; }).join('') : emptyState('참여 신청은 MOMO 신청 폼에서 받아요', '이곳에는 이전 버전에서 남긴 체험용 요청만 표시됩니다.<br>새 검증 참여는 이메일·나이대·성별로 신청해 주세요.', 'MOMO 검증에 참여하기', 'signup'); }
  if (savedTab === 'routes') { html = state.routes.length ? state.routes.map(r => { const event = events.find(e => e.id === r.eventId), destination = destinations.find(d => d.id === r.destination); if (!event || !destination) return ''; const route = buildRoutes(event, destination).find(x => x.id === r.id); return route ? `<section class="saved-route-group"><p class="saved-route-event">${event.title} → ${destination.station}</p>${routeCard(route, { savedView: true, eventId: event.id, destination: destination.id })}</section>` : ''; }).join('') : emptyState('돌아갈 길도 미리 담아두세요', '귀가 플랜에서 이동 과정을 열고 저장할 수 있어요.', '귀가 플랜 보기', 'journey'); }
  if (savedTab === 'posts') { html = state.posts.length ? `<div class="mate-grid">${state.posts.map(normalizeMate).map(m => `<div>${mateCard(m)}<div class="post-actions"><button class="button outline small" data-action="delete-post" data-id="${escape(m.id)}">모집글 삭제</button></div></div>`).join('')}</div>` : emptyState('원하는 동행을 직접 만나보세요', '어떤 순간을 함께하고 싶은지 가볍게 적어주세요.', '메이트 모집하기', 'create'); }
  $('#saved-content').innerHTML = html + `<p class="local-note">${icon('info')}저장한 내용은 현재 브라우저에만 보관되며 실제 사용자에게 전송되지 않습니다.</p>`;
}
function renderAll() { renderHome(); renderMates(); renderJourney(); renderSaved(); updateCount(); }
function navigate() {
  const page = location.hash.slice(1), selected = ['home', 'mates', 'journey', 'saved'].includes(page) ? page : 'home';
  $$('.page').forEach(el => { el.hidden = el.id !== `page-${selected}`; });
  $$('[data-page]').forEach(a => { a.classList.toggle('active', a.dataset.page === selected); if (a.dataset.page === selected) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  document.title = `MOMO — ${{ home: '순간과 순간을 모아', mates: '메이트 찾기', journey: '귀가 플랜', saved: '나의 보관함' }[selected]}`;
  if (page === 'join') scrollToSignup();
  else window.scrollTo({ top: 0, behavior: 'instant' });
}
function scrollToSignup() {
  $('#join').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
  $('#signup-email').focus({ preventScroll: true });
}
function goSignup(entry = 'landing', mate) {
  if (dialog.open) closeDialog();
  const selectedPurpose = mate?.purpose || (location.hash === '#mates' ? filters.purpose : homePurpose);
  setSignupContext({ entry, purpose: selectedPurpose === 'all' ? '' : selectedPurpose, transport: mate?.transport || '', eventId: mate?.eventId || state.eventId, mateId: mate?.id || '', label: mate ? `${purposeInfo(mate.purpose).label}${mate.transport ? ' · ' + transportLabel(mate.transport) : ''} — ${mate.title}` : 'Moment와 moment를 모으고 모아, MOMO.' });
  if (location.hash === '#join') scrollToSignup();
  else location.hash = 'join';
}
const dialog = $('#dialog');
function openDialog(html) { $('#dialog-content').innerHTML = html; if (!dialog.open) dialog.showModal(); }
function closeDialog() { dialog.close(); }
function openEvents() { openDialog(`<p class="section-kicker">CHOOSE YOUR LIVE</p><h2 id="dialog-title">어느 공연에 가세요?</h2><p class="dialog-sub">같은 공연에 가는 메이트와 귀가 방법을 찾아드려요.</p><div class="event-options">${events.map(e => `<button class="event-option ${e.id === state.eventId ? 'active' : ''}" data-action="select-event" data-id="${e.id}"><span class="event-swatch">${e.swatch}</span><div><b>${e.title}</b><small>${e.venue}<br>${dateLabel(e.dates[0])} – ${dateLabel(e.dates[1])}</small></div>${icon(e.id === state.eventId ? 'check' : 'arrow-up-right')}</button>`).join('')}</div><p class="form-note">공연명은 탐색 흐름을 보여주기 위한 예시이며, 일정과 장소 조합은 가상으로 구성했습니다.</p>`); }
function openDetail(id) {
  const m = getMate(id); if (!m) return; const p = purposeInfo(m.purpose), event = events.find(e => e.id === m.eventId), requested = state.requests.some(r => r.mateId === id);
  openDialog(`<span class="purpose-badge">${icon(p.icon)} ${p.label}</span><h2 id="dialog-title" style="margin-top:15px">${escape(m.title)}</h2><p class="dialog-sub">${event.title} · ${dateLabel(m.date)}${m.transport ? ' · ' + transportLabel(m.transport) : ''}</p><div class="detail-top"><span class="avatar ${m.color}">${escape(m.initial)}</span><div class="detail-person"><b>${escape(m.name)}</b><small>${m.age}대 · ${escape(m.gender)} · 체험용 프로필</small></div>${m.own ? '' : `<span class="detail-trust">${icon('shield')}인증 배지 예시</span>`}</div><p class="detail-description">${escape(m.description)}</p><dl class="detail-facts"><div><dt>함께하는 시간</dt><dd>${m.time === 'before' ? '공연 전' : '공연 후'} ${m.at}</dd></div><div><dt>만나는 곳</dt><dd>${escape(m.place)}</dd></div><div><dt>모집 인원</dt><dd>${m.count}명 참여 · 총 ${m.total}명</dd></div><div><dt>이동 방향</dt><dd>${destinations.find(d => d.id === m.destination)?.label || '공연장 근처'}</dd></div></dl><p class="safety-note">첫 만남은 밝고 공개된 장소에서, 비용과 동선은 미리 확인해요. 인증 배지는 프로토타입 표현이며 실제 신원 확인을 뜻하지 않습니다.</p><div class="dialog-actions"><button class="button outline" data-action="save-mate" data-id="${escape(id)}" aria-label="${state.saved.includes(id) ? '저장 취소' : '메이트 저장'}">${icon(state.saved.includes(id) ? 'check' : 'bookmark')}</button>${m.own ? '<button class="button primary" data-action="my-posts">내 모집글 보기</button>' : `<button class="button primary" data-action="request" data-id="${id}" >연결 요청 남기기${icon('arrow-right')}</button>`}</div>${m.own ? '' : `<div class="detail-secondary"><button data-action="report" data-id="${id}">신고하기</button><button data-action="block-confirm" data-id="${id}">이 프로필 숨기기</button></div>`}`);
}
function requestForm(id) {
  const m = getMate(id); if (!m) return;
  goSignup('mate-request', m);
}
const rideFieldsMarkup = `<div class="ride-extra" id="post-ride-fields" hidden><div class="form-field"><label for="post-transport">함께 귀가할 방법</label><select name="transport" id="post-transport"><option value="carpool">카풀</option><option value="taxi">택시팟</option><option value="transit">대중교통·도보 동행</option></select></div><div class="form-field" id="post-role-field" hidden><label for="post-transport-role">카풀에서 나는</label><select name="transportRole" id="post-transport-role"><option value="">선택해주세요</option><option value="driver">차량을 제공할게요</option><option value="passenger">동승하고 싶어요</option></select></div><p>동선·만남 장소·비용 분담은 출발 전에 함께 확인해요. 실제 탑승 예약은 이루어지지 않는 예시 모집입니다.</p></div>`;
function createForm() {
  const event = currentEvent();
  openDialog(`<p class="section-kicker">MAKE A LITTLE COMPANY</p><h2 id="dialog-title">어떤 순간을 함께할까요?</h2><p class="dialog-sub">${event.title}<br>필요한 순간과 만나고 싶은 조건을 알려주세요.</p><form id="create-form"><div class="form-field"><label for="post-title">모집 제목</label><input id="post-title" name="title" required maxlength="50" placeholder="예: 끝나고 강남까지 같이 돌아가요"></div><div class="form-row"><div class="form-field"><label for="post-purpose">함께할 목적</label><select name="purpose" id="post-purpose">${purposes.filter(p => p.id !== 'all').map(p => `<option value="${p.id}">${p.label}</option>`).join('')}</select></div><div class="form-field"><label for="post-date">공연 날짜</label><select name="date" id="post-date">${event.dates.map(d => `<option value="${d}">${dateLabel(d)}</option>`).join('')}</select></div></div><div class="form-row"><div class="form-field"><label for="post-time">만날 시간</label><input id="post-time" name="at" type="time" required value="16:00"></div><div class="form-field"><label for="post-total">총 인원 (나 포함)</label><select id="post-total" name="total"><option value="2">2명</option><option value="3">3명</option><option value="4">4명</option></select></div></div><div class="form-row"><div class="form-field"><label for="post-destination">이동 방향</label><select name="destination" id="post-destination"><option value="">공연장 근처</option>${destinationOptions()}</select></div><div class="form-field"><label for="post-age">내 연령대</label><select name="age" id="post-age"><option value="20">20대</option><option value="30">30대</option></select></div></div>${rideFieldsMarkup}<div class="form-field"><label for="post-place">만나는 곳</label><input id="post-place" name="place" required maxlength="50" placeholder="예: 공연장 밖 편의점 앞"></div><div class="form-field"><label for="post-description">이런 동행이면 좋겠어요</label><textarea id="post-description" name="description" required maxlength="600" placeholder="함께할 시간, 이동 계획, 서로 지켜주면 좋은 것들을 적어주세요."></textarea></div><p class="form-note error" id="post-error" hidden></p><label class="checkbox-label"><input type="checkbox" required>개인 연락처나 계좌번호 없이, 공개된 만남 장소를 적었어요.</label><button type="submit" class="button primary full">모집글 올리기 ${icon('plus')}</button><p class="form-note">이 브라우저에만 저장되는 체험용 모집글입니다.</p></form>`);
}
function profile() { openDialog(`<p class="section-kicker">MY MOMO</p><h2 id="dialog-title">반가워요, 오늘의 나.</h2><div class="profile-head"><span class="avatar sage">나</span><div><b>오늘의 나</b><p>조금의 동행이면 충분한 사람</p></div></div><div class="profile-stat"><div><b>${state.posts.length}</b><span>나의 모집</span></div><div><b>${state.requests.length}</b><span>연결 요청</span></div><div><b>${state.saved.length}</b><span>저장한 메이트</span></div></div><div class="profile-list">${icon('shield')}휴대폰 인증<span>체험용 · 미인증</span></div><button class="profile-list" data-action="blocked-list" style="width:100%;text-align:left">${icon('users')}숨긴 프로필 관리<span>${state.blocked.length}개 ${icon('arrow-right')}</span></button><p class="form-note">회원가입 없이 둘러보는 체험 계정입니다. 프로필과 요청은 실제 사용자와 연결되지 않아요.</p>`); }
function reportForm(id) { openDialog(`<p class="section-kicker">KEEP A GOOD COMPANY</p><h2 id="dialog-title">어떤 점이 불편했나요?</h2><p class="dialog-sub">프로토타입에서는 신고 내역을 이 브라우저에만 저장해요. 운영자에게 전달되지는 않습니다.</p><form id="report-form" data-id="${id}"><div class="report-reasons">${['부적절한 내용', '금전 거래·광고', '개인정보 노출', '기타'].map((r, i) => `<label><input type="radio" name="reason" value="${r}" required ${i === 0 ? 'checked' : ''}>${r}</label>`).join('')}</div><button class="button dark full" type="submit">신고 내용 저장</button></form>`); }
function renderBlocked() { openDialog(`<h2 id="dialog-title">숨긴 프로필</h2><p class="dialog-sub">숨긴 모집글은 메이트 목록에 보이지 않아요.</p><div class="blocked-list">${state.blocked.length ? state.blocked.map(id => { const m = getMate(id); return `<div class="blocked-row"><span class="avatar ${m?.color || ''}">${escape(m?.initial || '?')}</span><b>${escape(m?.name || '알 수 없는 프로필')}</b><button data-action="unblock" data-id="${escape(id)}">숨김 해제</button></div>`; }).join('') : '<p class="form-note">숨긴 프로필이 없어요.</p>'}</div>`); }

document.addEventListener('click', e => {
  const button = e.target.closest('[data-action]'); if (!button) return;
  const { action, id } = button.dataset;
  if (action === 'purpose') { if (button.dataset.scope === 'home') { homePurpose = id; homeTransport = 'all'; renderHome(); } else { filters.purpose = id; filters.transport = 'all'; renderMates(); } }
  if (action === 'transport') { if (button.dataset.scope === 'home') { homeTransport = id; renderHome(); } else { filters.transport = id; renderMates(); } }
  if (action === 'signup') { e.preventDefault(); goSignup(button.dataset.entry || 'landing'); }
  if (action === 'save-mate') { state.saved = state.saved.includes(id) ? state.saved.filter(x => x !== id) : [...state.saved, id]; persist(); renderAll(); if (dialog.open) openDetail(id); toast(state.saved.includes(id) ? '보관함에 담았어요.' : '보관함에서 꺼냈어요.'); }
  if (action === 'detail') openDetail(id);
  if (action === 'select-event') { state.eventId = id; filters = { ...filters, date: 'all' }; persist(); renderAll(); closeDialog(); toast(`${currentEvent().short} 공연으로 바꿨어요.`); }
  if (action === 'request') requestForm(id);
  if (action === 'reset') { filters = { purpose: 'all', transport: 'all', date: 'all', time: 'all', destination: 'all', age: 'all', sort: 'recommended' }; renderMates(); }
  if (action === 'create') createForm();
  if (action === 'browse') location.hash = 'mates';
  if (action === 'journey') location.hash = 'journey';
  if (action === 'my-posts') { savedTab = 'posts'; renderSaved(); closeDialog(); location.hash = 'saved'; }
  if (action === 'route-detail') { const details = document.getElementById(button.dataset.target); details.hidden = !details.hidden; button.setAttribute('aria-expanded', !details.hidden); button.innerHTML = `${details.hidden ? '이동 과정 보기' : '이동 과정 접기'} ${icon('chevron-down')}`; }
  if (action === 'save-route') { const { type, event: eventId, destination } = button.dataset; const route = buildRoutes(eventId, destination).find(r => r.type === type); const exists = state.routes.some(r => r.id === route.id); state.routes = exists ? state.routes.filter(r => r.id !== route.id) : [...state.routes, { id: route.id, eventId, destination }]; persist(); renderSaved(); const detailId = `${eventId}-${destination}-${type}`; renderJourney(); if (location.hash === '#journey') { const details = document.getElementById(detailId); if (details) { details.hidden = false; const toggle = $(`[data-target="${detailId}"]`); toggle.setAttribute('aria-expanded', 'true'); toggle.innerHTML = `이동 과정 접기 ${icon('chevron-down')}`; } } toast(exists ? '귀가 플랜을 보관함에서 꺼냈어요.' : '귀가 플랜을 보관함에 담았어요.'); }
  if (action === 'cancel-request') { state.requests = state.requests.filter(r => r.mateId !== id); persist(); renderSaved(); toast('체험 요청을 취소했어요.'); }
  if (action === 'report') reportForm(id);
  if (action === 'block-confirm') openDialog(`<h2 id="dialog-title">이 프로필을 숨길까요?</h2><p class="dialog-sub">이 모집글은 목록에서 보이지 않게 됩니다.<br>내 프로필에서 다시 표시할 수 있어요.</p><div class="dialog-actions" style="margin-top:25px"><button class="button outline" data-action="detail" data-id="${id}">돌아가기</button><button class="button primary" data-action="block" data-id="${id}">숨기기</button></div>`);
  if (action === 'block') { if (!state.blocked.includes(id)) state.blocked.push(id); persist(); closeDialog(); renderAll(); toast('이 프로필을 목록에서 숨겼어요.'); }
  if (action === 'blocked-list') renderBlocked();
  if (action === 'unblock') { state.blocked = state.blocked.filter(x => x !== id); persist(); renderAll(); renderBlocked(); toast('프로필을 다시 표시했어요.'); }
  if (action === 'delete-post') openDialog(`<h2 id="dialog-title">모집글을 삭제할까요?</h2><p class="dialog-sub">이 브라우저에 저장한 모집글이 삭제됩니다.</p><div class="dialog-actions" style="margin-top:25px"><button class="button outline" data-action="close">유지하기</button><button class="button primary" data-action="confirm-delete" data-id="${escape(id)}">삭제하기</button></div>`);
  if (action === 'confirm-delete') { state.posts = state.posts.filter(m => m.id !== id); state.saved = state.saved.filter(x => x !== id); persist(); renderAll(); closeDialog(); toast('모집글을 삭제했어요.'); }
  if (action === 'close') closeDialog();
  if (action === 'view-requests') { savedTab = 'requests'; renderSaved(); closeDialog(); location.hash = 'saved'; }
});

document.addEventListener('submit', e => {
  if (!['create-form', 'report-form'].includes(e.target.id)) return; e.preventDefault(); const form = e.target, data = new FormData(form);
  if (form.id === 'create-form') {
    const values = Object.fromEntries(data); const error = $('#post-error');
    if (!values.title.trim() || !values.description.trim() || !values.place.trim()) { error.textContent = '제목, 만나는 곳, 소개를 한 글자 이상 입력해 주세요.'; error.hidden = false; return; }
    if (values.purpose === 'ride' && !values.destination) { error.textContent = '함께 귀가할 이동 방향을 선택해 주세요.'; error.hidden = false; $('#post-destination').focus(); return; }
    state.posts.push({ id: `mine-${Date.now()}`, eventId: state.eventId, purpose: values.purpose, transport: values.purpose === 'ride' ? values.transport : '', transportRole: values.purpose === 'ride' && values.transport === 'carpool' ? values.transportRole : '', title: values.title.trim(), name: '오늘의 나', initial: '나', color: 'sage', age: values.age, gender: '성별 무관', time: values.purpose === 'ride' || values.at >= '19:00' ? 'after' : 'before', at: values.at, date: values.date, destination: values.destination, place: values.place.trim(), description: values.description.trim(), count: 1, total: Number(values.total), own: true }); persist(); renderAll(); closeDialog(); savedTab = 'posts'; renderSaved(); location.hash = 'saved'; toast('나의 모집글을 저장했어요.');
  }
  if (form.id === 'report-form') { state.reports.push({ mateId: form.dataset.id, reason: data.get('reason'), at: Date.now() }); persist(); closeDialog(); toast('신고 내용을 이 브라우저에 저장했어요. 실제 전송은 되지 않아요.'); }
});

document.addEventListener('change', event => {
  if (!['post-purpose', 'post-transport'].includes(event.target.id)) return;
  const ride = $('#post-purpose').value === 'ride';
  const carpool = ride && $('#post-transport').value === 'carpool';
  $('#post-ride-fields').hidden = !ride;
  $('#post-transport').required = ride;
  $('#post-role-field').hidden = !carpool;
  $('#post-transport-role').required = carpool;
  if (event.target.id === 'post-purpose' && ride) $('#post-time').value = '22:45';
});

$('#change-event').onclick = openEvents; $('#mates-event').onclick = openEvents; $('#journey-event').onclick = openEvents;
$('#home-plan').onclick = () => { state.destination = $('#home-destination').value; persist(); renderJourney(); location.hash = 'journey'; };
$$('[data-home-destination]').forEach(b => { b.onclick = () => { $('#home-destination').value = b.dataset.homeDestination; $('#home-plan').click(); }; });
$('#search-journey').onclick = () => { state.destination = $('#journey-destination').value; persist(); renderJourney(); renderHome(); toast(`${currentDestination().station} 방향으로 비교했어요.`); };
$('#direction-find').onclick = () => { filters = { purpose: 'ride', transport: 'all', date: currentEvent().dates[0], time: 'after', destination: state.destination, age: 'all', sort: 'recommended' }; renderMates(); location.hash = 'mates'; };
['date', 'time', 'destination', 'age'].forEach(k => { $(`#filter-${k}`).onchange = e => { filters[k] = e.target.value; renderMates(); }; });
$('#sort-mates').onchange = e => { filters.sort = e.target.value; renderMates(); };
$('#reset-filters').onclick = () => { filters = { purpose: 'all', transport: 'all', date: 'all', time: 'all', destination: 'all', age: 'all', sort: 'recommended' }; renderMates(); };
$('#open-create').onclick = createForm; $('#profile-button').onclick = profile;
$$('#saved-tabs button').forEach(b => { b.onclick = () => { savedTab = b.dataset.savedTab; renderSaved(); }; });
$('#close-dialog').onclick = closeDialog;
dialog.addEventListener('click', e => { if (e.target === dialog) { const r = dialog.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) closeDialog(); } });
$('#about-button').onclick = () => openDialog(`<p class="section-kicker">ABOUT THIS PROTOTYPE</p><h2 id="dialog-title">필요한 순간만, 함께.</h2><p class="dialog-sub">MOMO는 혼자 공연에 가는 사람에게 필요한 순간의 동행과 귀가 방법을 함께 제안하는 서비스 프로토타입입니다.</p><ul class="about-list"><li>공연 변경과 목적·날짜·방향별 메이트 탐색</li><li>프로필 확인, 모집글 등록, MOMO 검증 참여 신청</li><li>귀가 옵션 비교와 같은 방향의 메이트 찾기</li><li>메이트·경로 저장, 요청 취소, 신고·숨기기</li></ul><p class="form-note">공연 일정·프로필·인증·교통 시간·요금은 모두 가상 예시입니다. 실제 메이트 연결·예약은 하지 않습니다. 참여 신청에서 제출한 이메일·나이대·성별과 관심 항목만 검증 참여 접수를 위해 전송합니다. 메이트 모집 예시와 보관함은 현재 브라우저에만 저장됩니다.</p>`);
$('#filter-destination').innerHTML = destinationOptions(true); $('#home-destination').innerHTML = destinationOptions(); $('#journey-destination').innerHTML = destinationOptions();
hydrateIcons(); renderAll(); initSignup(); navigate(); window.addEventListener('hashchange', navigate);

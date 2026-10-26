/**
 * Transport examples for the interactive prototype.
 * These are deliberately static, illustrative values, not live travel advice,
 * published timetables, shuttle availability, or booking information.
 */
export const destinations = [
  { id: 'gangnam', label: '강남·서초', area: '서울', station: '강남역' },
  { id: 'hongdae', label: '홍대·마포', area: '서울', station: '홍대입구역' },
  { id: 'suwon', label: '수원', area: '경기', station: '수원역' },
  { id: 'bundang', label: '분당·판교', area: '경기', station: '판교역' },
  { id: 'incheon', label: '인천', area: '인천', station: '인천시청역' },
];

const venues = {
  seventeen: {
    name: '인천아시아드주경기장',
    station: '아시아드경기장역',
    meeting: '경기장 밖, 사전에 정한 만남 장소',
    routes: {
      gangnam: { transit: [95, 2650, 2], taxi: [75, 78000], shuttle: [85, 19000] },
      hongdae: { transit: [75, 2350, 1], taxi: [55, 59000], shuttle: null },
      suwon: { transit: [120, 3250, 2], taxi: [85, 92000], shuttle: [100, 22000] },
      bundang: { transit: [120, 4450, 3], taxi: [95, 105000], shuttle: null },
      incheon: { transit: [45, 1750, 1], taxi: [30, 26000], shuttle: [40, 12000] },
    },
  },
  day6: {
    name: '고척스카이돔',
    station: '구일역',
    meeting: '공연장 밖, 사전에 정한 만남 장소',
    routes: {
      gangnam: { transit: [55, 1850, 1], taxi: [40, 35000], shuttle: [50, 14000] },
      hongdae: { transit: [40, 1750, 1], taxi: [25, 24000], shuttle: null },
      suwon: { transit: [70, 2250, 0], taxi: [55, 52000], shuttle: [65, 17000] },
      bundang: { transit: [80, 3650, 2], taxi: [55, 57000], shuttle: null },
      incheon: { transit: [75, 2250, 1], taxi: [55, 54000], shuttle: [65, 18000] },
    },
  },
  festival: {
    name: '올림픽공원',
    station: '올림픽공원역',
    meeting: '공원 밖, 사전에 정한 만남 장소',
    routes: {
      gangnam: { transit: [45, 1750, 1], taxi: [30, 28000], shuttle: [40, 13000] },
      hongdae: { transit: [75, 2050, 1], taxi: [55, 52000], shuttle: null },
      suwon: { transit: [95, 2850, 2], taxi: [70, 68000], shuttle: [85, 19000] },
      bundang: { transit: [65, 3450, 2], taxi: [45, 43000], shuttle: null },
      incheon: { transit: [110, 2850, 2], taxi: [85, 85000], shuttle: [100, 23000] },
    },
  },
};

const EXAMPLE_NOTE = '화면 검증용 예시예요. 실제 운행 시간·요금·운영 여부와 달라요.';

function clockAfter(time, minutes) {
  const [hours, mins] = time.split(':').map(Number);
  const total = (hours * 60 + mins + minutes) % (24 * 60);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

/**
 * @param {{ id: string } | string} event A selected concert, or its id.
 * @param {{ id: string } | string} destination A selected destination, or its id.
 * @returns {Array<{
 *   id: string, type: string, label: string, title: string,
 *   departure: string, arrival: string, duration: number,
 *   price: number, perPerson: number,
 *   steps: Array<{ time: string, title: string, detail: string }>,
 *   note: string, warning: string, available: boolean
 * }>}
 * Times assume a hypothetical 22:10 finish and a 35-minute exit buffer.
 * Duration is in minutes. Prices are numeric KRW. Taxi perPerson assumes 3 riders.
 */
export function buildRoutes(event, destination) {
  const eventId = typeof event === 'string' ? event : event?.id;
  const destinationId = typeof destination === 'string' ? destination : destination?.id;
  const venue = venues[eventId] || venues.seventeen;
  const selectedEventId = venues[eventId] ? eventId : 'seventeen';
  const place = destinations.find((item) => item.id === destinationId) || destinations[0];
  const options = venue.routes[place.id];
  const routePrefix = `${selectedEventId}-${place.id}`;
  const transitDeparture = '22:45';
  const shuttleDeparture = '23:00';
  const taxiDeparture = '22:55';
  const [transitMinutes, transitFare, transfers] = options.transit;
  const [taxiMinutes, taxiFare] = options.taxi;
  const shuttleAvailable = Boolean(options.shuttle);
  const [shuttleMinutes, shuttleFare] = options.shuttle || [0, 0];
  const transferLabel = transfers === 0 ? '환승 없이 이동하는 예시' : `환승 ${transfers}회 기준의 예시`;

  return [
    {
      id: `${routePrefix}-shuttle`,
      type: 'shuttle',
      label: '셔틀',
      title: `${place.station} 방향 셔틀`,
      departure: shuttleAvailable ? shuttleDeparture : '—',
      arrival: shuttleAvailable ? clockAfter(shuttleDeparture, shuttleMinutes) : '—',
      duration: shuttleMinutes,
      price: shuttleFare,
      perPerson: shuttleFare,
      available: shuttleAvailable,
      steps: shuttleAvailable ? [
        { time: '22:45', title: '공연장 밖으로 이동', detail: '종료를 22:10으로 가정하고, 퇴장에 35분을 잡았어요.' },
        { time: shuttleDeparture, title: '셔틀 출발 예시', detail: `${venue.meeting}에서 출발하는 가상의 노선이에요.` },
        { time: clockAfter(shuttleDeparture, shuttleMinutes), title: `${place.station} 도착 예시`, detail: '도착 후 집까지 이동하는 시간은 포함하지 않았어요.' },
      ] : [],
      note: shuttleAvailable
        ? EXAMPLE_NOTE
        : '이 목적지의 셔틀은 예시에 포함하지 않았어요. 실제 운행 여부는 별도로 확인해 주세요.',
      warning: shuttleAvailable
        ? '예약할 수 있는 실제 셔틀이 아니에요. 예매 전 운영사 안내를 확인해 주세요.'
        : '다른 귀가 방법을 비교해 보세요.',
    },
    {
      id: `${routePrefix}-transit`,
      type: 'transit',
      label: '대중교통',
      title: `${place.station}까지 대중교통`,
      departure: transitDeparture,
      arrival: clockAfter(transitDeparture, transitMinutes),
      duration: transitMinutes,
      price: transitFare,
      perPerson: transitFare,
      available: true,
      steps: [
        { time: '22:10', title: '공연 종료 예상', detail: '시작 시간이 아닌 예시 종료 시각이에요. 실제 종료 시각은 달라질 수 있어요.' },
        { time: transitDeparture, title: `${venue.station} 방향으로 이동`, detail: '공연장 퇴장과 역까지 이동에 35분을 가정했어요.' },
        { time: '이동 중', title: '대중교통 이용', detail: `${transferLabel}예요. 도보와 환승 대기를 포함한 예상 시간이에요.` },
        { time: clockAfter(transitDeparture, transitMinutes), title: `${place.station} 도착 예시`, detail: '최종 목적지까지의 추가 이동은 별도로 확인해 주세요.' },
      ],
      note: EXAMPLE_NOTE,
      warning: '막차 확인 필요 · 22:10 종료와 퇴장 35분을 가정했어요. 실제 열차·환승 막차는 확인하지 않았어요.',
    },
    {
      id: `${routePrefix}-taxi`,
      type: 'taxi',
      label: '택시팟',
      title: `${place.station}까지 택시 나눠 타기`,
      departure: taxiDeparture,
      arrival: clockAfter(taxiDeparture, taxiMinutes),
      duration: taxiMinutes,
      price: taxiFare,
      perPerson: Math.ceil(taxiFare / 3 / 100) * 100,
      available: true,
      steps: [
        { time: '22:45', title: '동행과 만나기', detail: `${venue.meeting}에서 서로 확인하고 만나는 예시예요.` },
        { time: taxiDeparture, title: '택시 탑승 예시', detail: '3명이 함께 탑승한다고 가정했어요. 실제 배차·탑승을 보장하지 않아요.' },
        { time: clockAfter(taxiDeparture, taxiMinutes), title: `${place.station} 도착 예시`, detail: '1인 예상 금액은 총액을 3명으로 나눠 100원 단위로 올림했어요.' },
      ],
      note: `${EXAMPLE_NOTE} 택시 요금은 할증·통행료·정체에 따라 달라져요.`,
      warning: '출발 전 목적지와 비용 분담을 함께 확인해 주세요.',
    },
  ];
}

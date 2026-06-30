// ───────────────────────────────────────────────────────────────
// 부산 해운대권 디지털트윈 공통 bbox (SINGLE SOURCE OF TRUTH)
// 모든 베이크 스크립트(aerial·DEM·buildings)와 manifest가 이 값을 공유한다.
// → 위성영상·지형/수심·건물이 항상 동일 bbox에 픽셀단위로 정렬된다.
//
// [W, S, E, N] WGS84(경도/위도, deg).
//   - 남(S)쪽으로 외해까지 확장(쓰나미가 밀려드는 바다 전경 확보)
//   - 육지는 동백섬(Dongbaek I.)·마린시티·해운대해수욕장 이상까지 포함
// 좌표는 research 워크플로(twin-upgrade-research)의 검증 결과로 확정.
// ───────────────────────────────────────────────────────────────
export const BBOX = { W: 129.101, S: 35.094, E: 129.193, N: 35.185 };
// 검증 랜드마크(WGS84): Marine City 129.145,35.1567 · 동백섬/누리마루 129.1546,35.1533
//   해운대해수욕장 129.1605,35.1586 · LCT 129.169,35.1603 · 광안대교동단 129.128,35.1565
//   수영강하구 129.118,35.153 · 달맞이언덕 129.1774,35.1555 · 청사포 129.1914,35.1613
// 해안선 ≈ lat 35.152~35.161(상단 1/3), 외해는 남/남동(+Z). 쓰나미는 남→북 진입.

export const M_PER_DEG_LAT = 111132;

// bbox에서 파생되는 중심/미터환산/씬 크기
export function derive(b = BBOX) {
  const lonC = (b.W + b.E) / 2;
  const latC = (b.S + b.N) / 2;
  const mPerLon = 111320 * Math.cos((latC * Math.PI) / 180);
  const mPerLat = M_PER_DEG_LAT;
  const sizeW = Math.round((b.E - b.W) * mPerLon); // 동서 m
  const sizeD = Math.round((b.N - b.S) * mPerLat); // 남북 m
  return { lonC, latC, mPerLon, mPerLat, sizeW, sizeD };
}

// 슬리피맵(Web Mercator) 전역 픽셀 변환 — 타일 스티칭/샘플 공용
export function mercator(Z, TILE = 256) {
  const nTiles = 2 ** Z;
  const lon2px = (lon) => ((lon + 180) / 360) * nTiles * TILE;
  const lat2px = (lat) => {
    const r = (lat * Math.PI) / 180;
    return ((1 - Math.asinh(Math.tan(r)) / Math.PI) / 2) * nTiles * TILE;
  };
  return { nTiles, TILE, lon2px, lat2px };
}

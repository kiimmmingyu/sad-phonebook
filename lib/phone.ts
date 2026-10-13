/** 숫자만 남깁니다. */
export function digitsOnly(value: string): string {
  return (value || "").replace(/\D/g, "");
}

/**
 * 국내 전화번호를 하이픈 형식으로 정리합니다.
 *  - 휴대폰 010-1234-5678, 인터넷전화 070-1234-5678
 *  - 서울 02-123-4567 / 02-1234-5678
 *  - 지역번호 031-123-4567 / 031-1234-5678
 *  - 대표번호 1588-1234
 * 규칙에 맞지 않으면 입력한 그대로 돌려줍니다.
 */
export function formatPhone(value: string): string {
  const d = digitsOnly(value);
  if (!d) return value || "";

  if (d.startsWith("02")) {
    if (d.length === 9) return d.replace(/(\d{2})(\d{3})(\d{4})/, "$1-$2-$3");
    if (d.length === 10) return d.replace(/(\d{2})(\d{4})(\d{4})/, "$1-$2-$3");
  }
  if (d.length === 8) return d.replace(/(\d{4})(\d{4})/, "$1-$2");
  if (d.length === 10) return d.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3");
  if (d.length === 11) return d.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3");
  return value;
}

/** 입력 중에 실시간으로 하이픈을 넣습니다. 미완성 번호도 보기 좋게 끊어 줍니다. */
export function formatPhoneLive(value: string): string {
  const d = digitsOnly(value).slice(0, 11);
  if (!d) return "";
  if (d.startsWith("02")) {
    if (d.length <= 2) return d;
    if (d.length <= 5) return `${d.slice(0, 2)}-${d.slice(2)}`;
    if (d.length <= 9) return `${d.slice(0, 2)}-${d.slice(2, 5)}-${d.slice(5)}`;
    return `${d.slice(0, 2)}-${d.slice(2, 6)}-${d.slice(6, 10)}`;
  }
  if (/^1[5-9]\d{2}/.test(d) && d.length <= 8) {
    if (d.length <= 4) return d;
    return `${d.slice(0, 4)}-${d.slice(4)}`;
  }
  if (d.length <= 3) return d;
  if (d.length <= 7) return `${d.slice(0, 3)}-${d.slice(3)}`;
  if (d.length <= 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
}

const CHO = [
  "ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ",
  "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ",
];
const FOLD: Record<string, string> = { ㄲ: "ㄱ", ㄸ: "ㄷ", ㅃ: "ㅂ", ㅆ: "ㅅ", ㅉ: "ㅈ" };

/** 색인 순서: 한글 자음 → 영문 → 기타(#) */
export const INDEX_ORDER = [
  "ㄱ", "ㄴ", "ㄷ", "ㄹ", "ㅁ", "ㅂ", "ㅅ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ",
  ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""),
  "#",
];

/** 한 글자의 초성(또는 영문 대문자, 그 외 #)을 돌려줍니다. */
export function initialOf(ch: string): string {
  if (!ch) return "#";
  const code = ch.charCodeAt(0);
  if (code >= 0xac00 && code <= 0xd7a3) {
    const cho = CHO[Math.floor((code - 0xac00) / 588)];
    return FOLD[cho] ?? cho;
  }
  if (/[ㄱ-ㅎ]/.test(ch)) return FOLD[ch] ?? ch;
  if (/[a-zA-Z]/.test(ch)) return ch.toUpperCase();
  return "#";
}

/** 이름의 색인 글자. 예) "홍길동" → "ㅎ", "Alice" → "A", "123" → "#" */
export function indexLetter(name: string): string {
  const first = (name || "").trim()[0];
  return initialOf(first ?? "");
}

/** 이름 전체의 초성 문자열. 예) "홍길동" → "ㅎㄱㄷ" (초성 검색용) */
export function choseongOf(name: string): string {
  return Array.from(name || "")
    .map((ch) => {
      const code = ch.charCodeAt(0);
      if (code >= 0xac00 && code <= 0xd7a3) {
        const cho = CHO[Math.floor((code - 0xac00) / 588)];
        return FOLD[cho] ?? cho;
      }
      return ch;
    })
    .join("");
}

/** 검색어가 초성만으로 되어 있는지 */
export function isChoseongQuery(q: string): boolean {
  return q.length > 0 && /^[ㄱ-ㅎ]+$/.test(q);
}

const HIJRI_MONTHS_EN = [
  'Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi al-Thani',
  'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', "Sha'ban",
  'Ramadan', 'Shawwal', 'Dhu al-Qidah', 'Dhu al-Hijjah'
];

const HIJRI_MONTHS_AR = [
  'محرّم', 'صفر', 'ربيع الأول', 'ربيع الثاني',
  'جمادى الأولى', 'جمادى الثانية', 'رجب', 'شعبان',
  'رمضان', 'شوّال', 'ذو القعدة', 'ذو الحجة'
];

export interface HijriDate {
  day: number;
  month: number;
  monthEn: string;
  monthAr: string;
  year: number;
  format: string;
}

export function getHijriDate(date: Date = new Date()): HijriDate {
  const jd = julianDate(date);
  const h = hijriFromJd(jd);
  
  return {
    day: h[2],
    month: h[1],
    monthEn: HIJRI_MONTHS_EN[h[1] - 1],
    monthAr: HIJRI_MONTHS_AR[h[1] - 1],
    year: h[0],
    format: `${h[2]} ${HIJRI_MONTHS_EN[h[1] - 1]}, ${h[0]} AH`,
  };
}

function julianDate(date: Date): number {
  let y = date.getFullYear();
  let m = date.getMonth() + 1;
  const d = date.getDate();
  
  if (m <= 2) {
    y = y - 1;
    m = m + 12;
  }
  
  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5;
}

function hijriFromJd(jd: number): [number, number, number] {
  const i = Math.floor((jd - 1948440.5) / 29.530588853);
  const j = Math.floor((jd - 1948440.5 - i * 29.530588853) / 29.530588853);
  const k = Math.floor((jd - 1948440.5 - i * 29.530588853 - j * 29.530588853) / 29.530588853);
  
  let y = i + 1;
  let m = j + 1;
  const d = Math.floor(jd - 1948440.5 - i * 29.530588853 - j * 29.530588853 - k * 29.530588853) + 1;
  
  if (m > 12) {
    y = y + 1;
    m = m - 12;
  }
  
  return [y, m, d];
}

export function getIslamicOccasion(date: Date = new Date()): string | null {
  const hijri = getHijriDate(date);
  const { month, day } = hijri;
  
  if (month === 1 && day === 1) return 'Islamic New Year';
  if (month === 1 && day === 10) return 'Day of Ashura';
  if (month === 3 && day === 12) return 'Birthday of Prophet (Mawlid)';
  if (month === 7 && day === 27) return 'Laylat al-Mi\'raj';
  if (month === 8 && day === 15) return 'Mid-Sha\'ban';
  if (month === 9 && day === 1) return 'Start of Ramadan';
  if (month === 9 && day === 27) return 'Laylat al-Qadr';
  if (month === 10 && day === 1) return 'Eid al-Fitr';
  if (month === 12 && day === 9) return 'Start of Hajj';
  if (month === 12 && day === 10) return 'Eid al-Adha';
  if (month === 12 && day === 12) return 'Day of Tarwiyah';
  
  return null;
}

export default { getHijriDate, getIslamicOccasion };

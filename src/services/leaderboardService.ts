import type { FacultyStanding } from '../types';

interface FacultyBase {
  id: string;
  name: string;
  baseStars: number;
  baseRecycled: number;
}

const FACULTY_LIST: FacultyBase[] = [
  {
    id: 'eng',
    name: 'Mühendislik Fakültesi',
    baseStars: 642,
    baseRecycled: 321
  },
  {
    id: 'sbf',
    name: 'Siyasal Bilgiler Fakültesi',
    baseStars: 598,
    baseRecycled: 299
  },
  {
    id: 'ceng',
    name: 'Bilgisayar ve Bilişim Bilimleri',
    baseStars: 544,
    baseRecycled: 272
  },
  {
    id: 'bus',
    name: 'İşletme Fakültesi',
    baseStars: 476,
    baseRecycled: 238
  },
  {
    id: 'fed',
    name: 'Fen Edebiyat Fakültesi',
    baseStars: 412,
    baseRecycled: 206
  },
  {
    id: 'health',
    name: 'Sağlık Bilimleri Fakültesi',
    baseStars: 368,
    baseRecycled: 184
  }
];

export function resolveFacultyId(department: string): string {
  const norm = (department || '').toLocaleLowerCase('tr-TR');
  if (norm.includes('bilgisayar') || norm.includes('yazılım') || norm.includes('bilişim')) {
    return 'ceng';
  }
  if (norm.includes('mühendis') || norm.includes('makine') || norm.includes('elektrik') || norm.includes('endüstri')) {
    return 'eng';
  }
  if (norm.includes('işletme') || norm.includes('yönetim') || norm.includes('pazarlama')) {
    return 'bus';
  }
  if (norm.includes('sağlık') || norm.includes('hemşire') || norm.includes('tıp')) {
    return 'health';
  }
  if (norm.includes('edebiyat') || norm.includes('fizik') || norm.includes('kimya') || norm.includes('tarih')) {
    return 'fed';
  }
  return 'sbf';
}

export function getFacultyStandings(
  userDepartment: string,
  userLifetimeStars: number
): FacultyStanding[] {
  const userFacultyId = resolveFacultyId(userDepartment);

  const standings = FACULTY_LIST.map((f) => {
    const isUserFaculty = f.id === userFacultyId;
    const additionalStars = isUserFaculty ? Math.max(0, userLifetimeStars) : 0;
    const totalStars = f.baseStars + additionalStars;
    const totalRecycled = f.baseRecycled + additionalStars;

    return {
      id: f.id,
      name: f.name,
      stars: totalStars,
      recycledCount: totalRecycled,
      rank: 1,
      isUserFaculty
    };
  });

  standings.sort((a, b) => b.stars - a.stars);

  return standings.map((item, index) => ({
    ...item,
    rank: index + 1
  }));
}

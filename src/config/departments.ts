export interface DepartmentUser {
  name: string;
  email: string;
}

export interface Department {
  id: string;
  name: string;
  users: DepartmentUser[];
}

function toEmail(name: string): string {
  const parts = name.toLowerCase().split(" ");
  const clean = (s: string) =>
    s.replace(/ç/g, "c").replace(/ğ/g, "g").replace(/ı/g, "i").replace(/ö/g, "o").replace(/ş/g, "s").replace(/ü/g, "u");
  if (parts.length >= 2) return `${clean(parts[0])}.${clean(parts[parts.length - 1])}@tiryaki.com.tr`;
  return `${clean(parts[0])}@tiryaki.com.tr`;
}

function u(name: string): DepartmentUser {
  return { name, email: toEmail(name) };
}

export const departments: Department[] = [
  {
    id: "turkiye-operasyonlari",
    name: "Türkiye Operasyonları",
    users: [
      u("Ozan Yeşilyer"),
      u("Recep Mergen"),
      u("Taylan Eğilmez"),
      u("Murat Solak"),
    ],
  },
  {
    id: "uluslararasi",
    name: "Uluslararası Operasyonlar",
    users: [
      u("Kemal Yıldız"),
      u("Nevzat Çakmak"),
      u("Fatih Tiryakioğlu"),
      u("Yiğit Karacı"),
    ],
  },
  {
    id: "kurumsal",
    name: "Kurumsal",
    users: [
      u("İdris İlhan Telci"),
      u("Güven Emrah Erenler"),
      u("Suat Söbüçovalı"),
      u("Nazlı Deniz Çetin"),
      u("Kerime İkizler"),
    ],
  },
  {
    id: "finans",
    name: "Finans",
    users: [
      u("Burcu Gözen"),
      u("Kübra Dömbek"),
    ],
  },
  {
    id: "ik",
    name: "İnsan Kaynakları",
    users: [
      u("Arzu Örsel"),
      u("Devrim Aşkın"),
    ],
  },
  {
    id: "it",
    name: "IT",
    users: [
      u("Cenk Şayli"),
      u("Ahmet Kalkan / Halil İbrahim Öztürk"),
      u("Emre Padar"),
    ],
  },
];

/** All department names as a flat array */
export const departmentNames = departments.map((d) => d.name);

/** Get department by user name */
export function getDepartmentByUser(userName: string): Department | undefined {
  return departments.find((d) => d.users.some((u) => u.name === userName));
}

/** Get users by department name */
export function getUsersByDepartment(deptName: string): DepartmentUser[] {
  return departments.find((d) => d.name === deptName)?.users ?? [];
}

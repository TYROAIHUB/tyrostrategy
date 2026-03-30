-- Migration 003: Add title column, update role constraint, and upsert all real users from Excel

ALTER TABLE users ADD COLUMN IF NOT EXISTS title TEXT;

-- Update role constraint to include Management
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('Admin', 'Proje Lideri', 'Kullanıcı', 'Management'));

-- Upsert all 43 real users (ON CONFLICT by email)
INSERT INTO users (email, display_name, department, role, title, locale)
VALUES
  ('nevzat.cakmak@tiryaki.com.tr',    'Nevzat Çakmak',          'COO Ofis',            'Admin',            'Stratejik Planlama ve Geliştirme Müdürü',             'tr'),
  ('busra.kaplan@tiryaki.com.tr',     'Büşra Kaplan',           'COO Ofis',            'Admin',            'Stratejik Planlama Uzman Yardımcısı',                 'tr'),
  ('cenk.sayli@tiryaki.com.tr',       'Cenk Şayli',             'BT',                  'Admin',            'Kurumsal Sistemler Yöneticisi',                       'tr'),
  ('elif.balci@tiryaki.com.tr',       'Elif Balcı',             'Ar-Ge',               'Proje Lideri',     'Ar-Ge Yöneticisi',                                    'tr'),
  ('enver.tanriverdioglu@tiryaki.com.tr', 'Enver Tanrıverdioğlu','Türkiye',            'Proje Lideri',     'Hammadde Satınalma ve Üretim Direktörü',              'tr'),
  ('baris.senturk@tiryaki.com.tr',    'Barış Şentürk',          'Türkiye',             'Proje Lideri',     'Endüstriyel Ürünler Satış Müdürü',                    'tr'),
  ('skabatas@sunrisefoods.ca',        'Şahin Kabataş',          'Sunrise',             'Proje Lideri',     'IT Director (Sunrise)',                                'tr'),
  ('murat.solak@tiryaki.com.tr',      'Murat Solak',            'Organik',             'Proje Lideri',     'Karadeniz Bölge Müdürü',                              'tr'),
  ('dboztunc@sunrisefoods.com',       'Derya Boztunç',          'Organik',             'Proje Lideri',     'Tesis Kalite Müdürü',                                 'tr'),
  ('kerime.ikizler@tiryaki.com.tr',   'Kerime İkizler',         'BT',                  'Proje Lideri',     'BT Yönetişim Müdürü',                                 'tr'),
  ('recep.mergen@tiryaki.com.tr',     'Recep Mergen',           'Türkiye',             'Proje Lideri',     'Yıldız Bölge Müdürü',                                 'tr'),
  ('emre.padar@tiryaki.com.tr',       'Emre Padar',             'Organik',             'Proje Lideri',     'Karadeniz Bölge İşletme Müdürü',                      'tr'),
  ('raif.karaci@tiryaki.com.tr',      'Raif Karacı',            'Organik',             'Proje Lideri',     'Üretim ve Tedarik Zinciri Direktörü',                 'tr'),
  ('ozan.yesilyer@tiryaki.com.tr',    'Ozan Yeşilyer',          'Türkiye',             'Proje Lideri',     'Kuruyemiş Ticaret Direktörü',                         'tr'),
  ('tamer.latifoglu@tiryaki.com.tr',  'Tamer Latifoğlu',        'Türkiye',             'Proje Lideri',     'Operasyon Direktörü',                                 'tr'),
  ('gulnur.kalyoncu@tiryaki.com.tr',  'Gulnur Kalyoncu',        'SAF',                 'Proje Lideri',     'Geri Dönüşüm Müdürü',                                 'tr'),
  ('serkan.can@tiryaki.com.tr',       'Serkan Can',             'Uluslararası',        'Proje Lideri',     'Kaynaklama Sertifikasyon Müdürü (Afrika)',             'tr'),
  ('tarkan.yilmaz@tiryaki.com.tr',    'Tarkan Yılmaz',          'İnsan Kaynakları',    'Proje Lideri',     'Ücretlendirme ve Yan Haklar Direktörü',                'tr'),
  ('taylan.egilmez@tiryaki.com.tr',   'Taylan Eğilmez',         'Türkiye',             'Proje Lideri',     'Yem Katkı Maddeleri Direktörü',                       'tr'),
  ('skancagi@sunrisefoods.com',       'Serkan Kançağı',         'Ar-Ge',               'Proje Lideri',     'Ürün ve Proses Geliştirme Müdürü',                    'tr'),
  ('ilhan.telci@tiryaki.com.tr',      'İlhan Telci',            'Denizcilik',          'Proje Lideri',     'Deniz Operasyon Direktörü',                           'tr'),
  ('ugurcan.patlar@tiryaki.com.tr',   'Uğurcan Patlar',         'Hukuk',               'Proje Lideri',     'Hukuk Destek Uzmanı',                                 'tr'),
  ('yigit.karaci@tiryaki.com.tr',     'Yiğit Karacı',           'Yatırım',             'Proje Lideri',     'Yatırım Projeleri Yöneticisi',                        'tr'),
  ('emin.oktay@danemgida.com.tr',     'Emin Oktay',             'Türkiye',             'Proje Lideri',     'Satış Direktörü',                                     'tr'),
  ('utosun@sunrisefoods.com',         'Ufuk Tosun',             'Organik',             'Proje Lideri',     'Oil Ingredients Manager',                             'tr'),
  ('kazim.dolasik@tiryaki.com.tr',    'Kazım Dolaşık',          'Türkiye',             'Proje Lideri',     'Tahıl, Yem ve Yağlı Tohumlar Ticaret Direktörü',     'tr'),
  ('nazli.cetin@tiryaki.com.tr',      'Nazlı Çetin',            'Sigorta',             'Proje Lideri',     'Sigorta Direktörü',                                   'tr'),
  ('mete.sayin@tiryaki.com.tr',       'Mete Sayın',             'Hukuk',               'Proje Lideri',     'Hukuk Müşaviri',                                      'tr'),
  ('ahmet.kalkan@tiryaki.com.tr',     'Ahmet Kalkan',           'İnsan Kaynakları',    'Proje Lideri',     'İdari İşler Müdürü',                                  'tr'),
  ('emrah.erenler@tiryaki.com.tr',    'Emrah Erenler',          'İnsan Kaynakları',    'Proje Lideri',     'İşe Alım ve Organizasyonel Gelişim Direktörü',        'tr'),
  ('burcu.gozen@tiryaki.com.tr',      'Burcu Gözen',            'COO Ofis',            'Proje Lideri',     'İş Analiz ve Performans Geliştirme Müdürü',           'tr'),
  ('arzu.orsel@tiryaki.com.tr',       'Arzu Örsel',             'Kurumsal İletişim',   'Proje Lideri',     'Kurumsal İletişim ve Sürdürülebilirlik Direktörü',    'tr'),
  ('devrim.askin@tiryaki.com.tr',     'Devrim Aşkın',           'Vergi',               'Proje Lideri',     'Vergi & Muhasebe Direktörü',                          'tr'),
  ('timur.karaman@tiryaki.com.tr',    'Timur Karaman',          'BT',                  'Proje Lideri',     'Bilgi Teknolojileri Direktörü',                       'tr'),
  ('kdombek@sunrisefoods.com',        'Kübra Dömbek',           'Organik',             'Proje Lideri',     'Quality Assurance Executive',                         'tr'),
  ('eekinci@sunrisefoods.com',        'Ecem Ekinci',            'Organik',             'Proje Lideri',     'Tedarik Zinciri Uzmanı',                              'tr'),
  ('halil.ozturk@tiryaki.com.tr',     'Halil Özturk',           'İnsan Kaynakları',    'Proje Lideri',     'İş Sağlığı ve Güvenliği Müdürü',                      'tr'),
  ('fatih.tiryakioglu@tiryaki.com.tr','Fatih Tiryakioğlu',      'Yönetim',             'Management',   'Başkan Yardımcısı / Uluslararası',                    'tr'),
  ('bahadir.acik@tiryaki.com.tr',     'Bahadır Açık',           'Yönetim',             'Management',   'Başkan Yardımcısı / Operasyon',                       'tr'),
  ('tekin.menguc@tiryaki.com.tr',     'Tekin Mengüç',           'Yönetim',             'Management',   'Başkan Yardımcısı / Tiryaki Türkiye',                 'tr'),
  ('murat.bogahan@tiryaki.com.tr',    'Murat Boğahan',          'Yönetim',             'Management',   'Başkan Yardımcısı / İnsan Kaynakları',                'tr'),
  ('suleyman.t@tiryaki.com.tr',       'Süleyman Tiryakioğlu',   'Yönetim',             'Management',   'CEO',                                                 'tr'),
  ('turkay.tatar@tiryaki.com.tr',     'Türkay Tatar',           'Yönetim',             'Management',   'Başkan Yardımcısı / Finans ve Mali İşler',            'tr')
ON CONFLICT (email) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  department   = EXCLUDED.department,
  role         = EXCLUDED.role,
  title        = EXCLUDED.title;

-- Remove any old mock/test users not in the Excel list
DELETE FROM users WHERE email NOT IN (
  'nevzat.cakmak@tiryaki.com.tr','busra.kaplan@tiryaki.com.tr','cenk.sayli@tiryaki.com.tr',
  'elif.balci@tiryaki.com.tr','enver.tanriverdioglu@tiryaki.com.tr','baris.senturk@tiryaki.com.tr',
  'skabatas@sunrisefoods.ca','murat.solak@tiryaki.com.tr','dboztunc@sunrisefoods.com',
  'kerime.ikizler@tiryaki.com.tr','recep.mergen@tiryaki.com.tr','emre.padar@tiryaki.com.tr',
  'raif.karaci@tiryaki.com.tr','ozan.yesilyer@tiryaki.com.tr','tamer.latifoglu@tiryaki.com.tr',
  'gulnur.kalyoncu@tiryaki.com.tr','serkan.can@tiryaki.com.tr','tarkan.yilmaz@tiryaki.com.tr',
  'taylan.egilmez@tiryaki.com.tr','skancagi@sunrisefoods.com','ilhan.telci@tiryaki.com.tr',
  'ugurcan.patlar@tiryaki.com.tr','yigit.karaci@tiryaki.com.tr','emin.oktay@danemgida.com.tr',
  'utosun@sunrisefoods.com','kazim.dolasik@tiryaki.com.tr','nazli.cetin@tiryaki.com.tr',
  'mete.sayin@tiryaki.com.tr','ahmet.kalkan@tiryaki.com.tr','emrah.erenler@tiryaki.com.tr',
  'burcu.gozen@tiryaki.com.tr','arzu.orsel@tiryaki.com.tr','devrim.askin@tiryaki.com.tr',
  'timur.karaman@tiryaki.com.tr','kdombek@sunrisefoods.com','eekinci@sunrisefoods.com',
  'halil.ozturk@tiryaki.com.tr','fatih.tiryakioglu@tiryaki.com.tr','bahadir.acik@tiryaki.com.tr',
  'tekin.menguc@tiryaki.com.tr','murat.bogahan@tiryaki.com.tr','suleyman.t@tiryaki.com.tr',
  'turkay.tatar@tiryaki.com.tr'
);

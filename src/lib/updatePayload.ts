/**
 * Güncelleme yükünde "temizle" ile "dokunma" ayrımı.
 *
 * Adapter sözleşmesi: `undefined` = alanı PATCH gövdesine koyma ("dokunma"),
 * `null` = SQL NULL yaz ("temizle"). Formlar bu ayrımı kendi başına yapamaz,
 * çünkü form varsayılanları BELLEKTEKİ kayıttan okunuyor ve uygulamada veri
 * tazeleme yok (yalnızca açılışta ve girişte çekiliyor). Dolayısıyla "alan boş"
 * iki farklı şey olabilir:
 *
 *   • kullanıcı dolu bir alanı boşalttı            → temizle  (`null`)
 *   • yüklenen kayıtta da boştu / önbellek bayattı → dokunma  (`undefined`)
 *
 * İkisini ayırt etmezsek iki ayrı hatadan birine düşüyoruz: hep `undefined`
 * göndermek temizlemeyi veritabanına hiç ulaştırmıyor; hep `null` göndermek ise
 * sabahtan açık bir sekmeden yapılan masum bir kaydetmenin, o arada başkasının
 * girdiği değeri silmesine yol açıyor.
 */

/**
 * @param loaded Formu açarken yüklenen kayıttaki değer.
 * @param next   Kullanıcının bıraktığı değer (`undefined` = alan boş).
 * @returns `next` doluysa kendisi; boş ve yüklenen de boşsa `undefined`
 *          (dokunma); boş ama yüklenen doluysa `null` (temizle).
 *
 * `loaded == null` kontrolü bilinçli: `0` ve `""` gibi falsy ama GEÇERLİ
 * değerler "yok" sayılmamalı — CAPEX 0 gerçek bir tutar.
 */
export function clearIfEmptied<T>(
  loaded: T | null | undefined,
  next: T | undefined
): T | null | undefined {
  if (next !== undefined) return next;
  return loaded == null ? undefined : null;
}

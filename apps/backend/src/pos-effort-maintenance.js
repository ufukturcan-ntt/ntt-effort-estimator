const row = (type, id, name, basis, values = {}) => ({ type, id, name, basis, values });

export const posGreenfieldEffortMaintenance = [
  row("scope", "scope-88", "Mağaza teslim alım süreci kullanılacak mı? (C&C)", "Sabit", { Analiz: 0.5, Uyarlama: 1 }),
  row("scope", "scope-20", "Süreç Dokümantasyonu yapılacak mı?", "Sabit", { Dokümantasyon: 4 }),
  row("development", "dev-26", "Müşteri teslim et süreci kullanılacak mı? (C&C)", "Sabit", { Analiz: 0.5, Uyarlama: 1 }),
  row("development", "dev-30", "Vergi istisnai satış", "Sabit", { Analiz: 0.5, Dokümantasyon: 0.5, Uyarlama: 0.5, "Birim Test": 1, "Internal Entegrasyon Testi": 0.5, "Entegrasyon Testi": 0.5 }),
  row("development", "dev-29", "Tax free satış", "Sabit", { Analiz: 0.5, Uyarlama: 0.5, "Birim Test": 1, "Internal Entegrasyon Testi": 0.5, "Entegrasyon Testi": 0.5 }),
  row("development", "dev-31", "Merkez kasa/yönetim kasası yönetimi", "Sabit", { Analiz: 1, Dokümantasyon: 0.5, Uyarlama: 1, "Birim Test": 1 }),
  row("scope", "scope-97", "Garanti süreci", "Sabit", { Analiz: 1, Dokümantasyon: 0.5, Uyarlama: 0.5, "Birim Test": 1, "Internal Entegrasyon Testi": 1, "Entegrasyon Testi": 1 }),
  row("development", "dev-35", "Kampanya hesaplaması kasa üzerinde mi yapılacak?", "Sabit", { Analiz: 0.5, Uyarlama: 2, "Birim Test": 2 }),
  row("development", "dev-34", "Gift Card kullanımı var mı?", "Sabit", { Analiz: 1, Dokümantasyon: 0.5, Uyarlama: 1, "Birim Test": 2 }),
  row("development", "dev-11", "CRM entegrasyonları", "Sabit", { Uyarlama: 10 }),
  row("development", "dev-25", "Click and Collect süreci", "Sabit", { Uyarlama: 5 }),
  row("scope", "scope-98", "Kasa kapanışı günlük yapılıyor mu?", "Sabit", { Analiz: 1, Dokümantasyon: 0.5, Uyarlama: 1, "Birim Test": 1 }),
  row("scope", "scope-96", "Satış sonrası hizmet süreci", "Sabit", { Analiz: 1, Dokümantasyon: 0.5, Uyarlama: 0.5, "Birim Test": 1, "Internal Entegrasyon Testi": 0.5, "Entegrasyon Testi": 0.5 }),
  row("development", "dev-37", "Kampanya tipleri ve sayısı", "Sabit", { Analiz: 1, Dokümantasyon: 0.5, Uyarlama: 1, "Birim Test": 3, "Internal Entegrasyon Testi": 1, "Entegrasyon Testi": 2 }),
  row("development", "dev-33", "Kupon kullanımı", "Sabit", { Analiz: 1, Dokümantasyon: 0.5, "Birim Test": 2 }),
  row("scope", "scope-95", "Değişim süreci", "Sabit", { Analiz: 2, Dokümantasyon: 2, Uyarlama: 2, "Birim Test": 2, "Internal Entegrasyon Testi": 1, "Entegrasyon Testi": 1 }),
  row("scope", "scope-107", "Dış sistem entegrasyonları", "Sabit", { Analiz: 10, Dokümantasyon: 1, "Internal Entegrasyon Testi": 1, "Entegrasyon Testi": 3 }),
  row("development", "dev-27", "E-çözümler süreci ile POS entegrasyonu var mı?", "Sabit", { Analiz: 0.5, Dokümantasyon: 0.5, "Birim Test": 1, "Internal Entegrasyon Testi": 0.5, "Entegrasyon Testi": 0.5 }),
  row("scope", "scope-86", "EFT POS kullanılıyor mu?", "Sabit", { "Entegrasyon Testi": 5 }),
  row("scope", "scope-85", "OKC kullanımı", "Katsayı", { "Entegrasyon Testi": 5 }),
  row("development", "dev-32", "Loyalty", "Sabit", { Uyarlama: 20 }),
  row("scope", "scope-90", "Kaç dil için ekran kullanımı olacaktır?", "Katsayı"),
  row("scope", "scope-22", "Entegrasyon Testi Tekrar Sayısı", "Katsayı", { Uyarlama: 10 }),
  row("development", "dev-36", "Marketing kampanyaları ya da tarihli kampanyalar kasada tutulacak mı?", "Sabit", { Uyarlama: 2 }),
  row("scope", "scope-24", "Anahtar Kullanıcı Eğitimi olacak mı?", "Sabit", { Dokümantasyon: 2 }),
  row("scope", "scope-25", "Son Kullanıcı Eğitimi olacak mı? Olacak ise kaç farklı lokasyonda olacak? (Modül bazında)", "Katsayı", { Uyarlama: 1, "QA Sistem Ayağa Kaldırma": 2 }),
  row("development", "dev-28", "Lokalizasyon", "Sabit", { Analiz: 5, Dokümantasyon: 5, Uyarlama: 2, "Birim Test": 5, "Internal Entegrasyon Testi": 5, "Entegrasyon Testi": 5 }),
  row("scope", "scope-110", "Kasa Sayısı", "Katsayı", { Analiz: 2, Dokümantasyon: 1, Uyarlama: 1, "Birim Test": 0.5, "Internal Entegrasyon Testi": 0.5, "Entegrasyon Testi": 1, Yetkilendirme: 0.125 }),
  row("scope", "scope-111", "Mağaza içi depo sayısı", "Sabit", { Analiz: 1, Uyarlama: 0.5, "Birim Test": 0.5, "Internal Entegrasyon Testi": 1, "Entegrasyon Testi": 1 }),
  row("scope", "scope-28", "Saha Testi", "Katsayı", { "Entegrasyon Testi": 5 }),
  row("scope", "scope-26", "Performans Testi", "Sabit", { "Canlı Sistem Ayağa Kaldırma": 5 }),
  row("scope", "scope-27", "Stres Testi", "Sabit", { Dokümantasyon: 2 })
];

export function applyPosGreenfieldEffortMaintenance(matrix) {
  const headerIndex = matrix.findIndex(source => Array.isArray(source) && source.includes("Kaynak Tipi"));
  if (headerIndex < 0) throw new Error("Variable + Module + Phase headers are missing");
  const requiredHeaders = [
    "Implementation Type", "Kaynak Tipi", "Kapsam Soru ID", "Kapsam Sorusu",
    "Geliştirme Soru ID", "Geliştirme Sorusu", "Modül", "Hedef Modül", "Efor Bazı"
  ];
  const oldHeaders = matrix[headerIndex];
  const headers = [...oldHeaders];
  for (const header of requiredHeaders) if (!headers.includes(header)) headers.push(header);
  for (const maintenance of posGreenfieldEffortMaintenance) {
    for (const phase of Object.keys(maintenance.values)) if (!headers.includes(phase)) headers.push(phase);
  }
  const rows = matrix.slice(headerIndex + 1).filter(Array.isArray).map(source =>
    headers.map(header => source[oldHeaders.indexOf(header)] ?? "")
  );
  const at = header => headers.indexOf(header);
  for (const maintenance of posGreenfieldEffortMaintenance) {
    const idHeader = maintenance.type === "scope" ? "Kapsam Soru ID" : "Geliştirme Soru ID";
    const nameHeader = maintenance.type === "scope" ? "Kapsam Sorusu" : "Geliştirme Sorusu";
    let target = rows.find(source =>
      source[at(idHeader)] === maintenance.id
      && source[at("Hedef Modül")] === "NTT Data POS"
      && source[at("Implementation Type")] === "Greenfield"
    );
    if (!target) {
      target = Array(headers.length).fill("");
      rows.push(target);
    }
    target.fill("");
    target[at("Implementation Type")] = "Greenfield";
    target[at("Kaynak Tipi")] = "Değişken";
    target[at(idHeader)] = maintenance.id;
    target[at(nameHeader)] = maintenance.name;
    target[at("Hedef Modül")] = "NTT Data POS";
    target[at("Efor Bazı")] = maintenance.basis;
    for (const [phase, effort] of Object.entries(maintenance.values)) target[at(phase)] = effort;
  }
  return [...matrix.slice(0, headerIndex), headers, ...rows];
}

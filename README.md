# 🌍 Sismik Verilerin Web Tabanlı Görselleştirilmesi ve Risk Analiz Simülasyonu

[![Durum](https://img.shields.io/badge/Durum-Canlı-success)](https://nazifkullaniciadi.github.io/deprem-risk-analizi/)
[![Proje Türü](https://img.shields.io/badge/TÜBİTAK-2204--A-blue)](https://www.tubitak.gov.tr/)
[![Lisans](https://img.shields.io/badge/Lisans-MIT-yellow)]()

> **TÜBİTAK 2204-A Lise Öğrencileri Araştırma Projeleri Yarışması kapsamında geliştirilmiştir.**

## 🚀 Canlı Demo
Projenin çalışan son halini tarayıcınızda veya telefonunuzda görüntülemek için aşağıdaki butona tıklayın:

[**🟢 UYGULAMAYI BAŞLAT (TIKLA)**](https://nazifturk6412-spec.github.io/Nazif-Turk-tubitak/)

---

## 📖 Proje Özeti
Marmara depremi gerçeğiyle yaşarken, teknik haritaları ve karmaşık verileri anlamak vatandaşlar için zor olabilmektedir. Bu proje, **"Olası bir depremde bulunduğum yer ne kadar riskli?"** sorusuna herkesin kolayca cevap bulabilmesi için geliştirilmiştir.

Uygulama, kullanıcının **GPS konumunu** algılayarak arka planda **AFAD (Yer İvmesi)** ve **MTA (Zemin)** verileriyle işler. Kullanıcılar, statik bir haritaya bakmak yerine; *"Deprem 7.5 büyüklüğünde olursa riskim ne kadar artar?"* gibi senaryoları simülasyon çubuğuyla deneyimleyebilir.

## ✨ Temel Özellikler
* 📍 **Otomatik Konum Algılama:** HTML5 Geolocation API ile anlık koordinat tespiti.
* 🎛️ **Dinamik Simülasyon:** Deprem büyüklüğü (Mw) ve uzaklık parametrelerini değiştirerek anlık risk hesabı.
* 🗺️ **Uydu Destekli Görselleştirme:** Google Maps Embed API ile riskli bölgenin uydu görüntüsü.
* 📊 **Bilimsel Temel:** 2018 Türkiye Bina Deprem Yönetmeliği'ne uygun "PGA (Yer İvmesi)" bazlı hesaplama.
* 📱 **Mobil Uyumlu Tasarım:** Telefondan ve tabletten tam erişim.

## 🛠️ Kullanılan Teknolojiler
Bu projede herhangi bir hazır paket (WordPress, Wix vb.) kullanılmamış, tamamen özgün kodlama yapılmıştır.

* **HTML5 & CSS3:** Modern ve responsive arayüz tasarımı.
* **JavaScript (ES6+):** Risk hesaplama algoritması ve DOM manipülasyonu.
* **Google Maps Embed API:** Harita görselleştirmesi.
* **Chart.js:** Veri grafikleri.

## 🧮 Hesaplama Mantığı (Algoritma)
Yazılımın arka planında çalışan risk puanı hesaplaması şu formüle dayanmaktadır:

$$Risk = (PGA \times Zemin Çarpanı) \times Mesafe Faktörü$$

* **PGA (Peak Ground Acceleration):** AFAD veritabanından alınan yer ivmesi.
* **Zemin Çarpanı:** MTA verilerine göre; Alüvyon zeminler için büyütme (1.3-1.6), Kaya zeminler için sönümleme (0.8) katsayısı.

## 📸 Ekran Görüntüleri
*(Buraya projenin ekran görüntülerini ekleyebilirsin)*

| Yüksek Risk Örneği (Avcılar) | Düşük Risk Örneği (Kırklareli) |
|:---:|:---:|
| ![Yüksek Risk](https://via.placeholder.com/300x500?text=Riskli+Bolge+Resmi) | ![Düşük Risk](https://via.placeholder.com/300x500?text=Guvenli+Bolge+Resmi) |

## 📦 Bilgisayara İndirip Çalıştırma (Çevrimdışı İnceleme)
Projenin kodlarını incelemek için:

1.  Yukarıdaki yeşil **`<> Code`** butonuna basıp **`Download ZIP`** deyin.
2.  Dosyayı çıkartıp **`index.html`** dosyasına çift tıklayın.
3.  ⚠️ **Önemli Not:** Dosyayı direkt çift tıklayarak açtığınızda tarayıcı güvenlik kuralları gereği **GPS (Konum)** özelliği çalışmayabilir.
    * *Tam fonksiyonlu deneyim için en üstteki **"Canlı Demo"** butonunu kullanınız.*
    * *Veya dosyayı VS Code "Live Server" eklentisi ile çalıştırınız.*
  
## 📚 Kaynakça
1.  **AFAD.** (2018). Türkiye Deprem Tehlike Haritası.
2.  **MTA.** (2024). Yerbilimleri Harita Görüntüleyicisi.
3.  **T.C. Çevre ve Şehircilik Bakanlığı.** (2018). Türkiye Bina Deprem Yönetmeliği.

---
**Geliştirici:** Nazif Türk

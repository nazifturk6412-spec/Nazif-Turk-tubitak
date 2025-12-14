/* ISTANBUL RISK ANALIZI - CROSS-BROWSER UYUMLU */

// Feature Detection Helper - DÜZELTİLMİŞ
var BrowserSupport = {
    geolocation: (typeof navigator !== 'undefined' && navigator.geolocation) ? true : false,
    localStorage: (function() {
        try {
            var test = '__localStorage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch(e) {
            return false;
        }
    })(),
    fetch: typeof fetch !== 'undefined',
    chart: typeof Chart !== 'undefined'
};

// Safe localStorage wrapper
var SafeStorage = {
    getItem: function(key) {
        if (!BrowserSupport.localStorage) return null;
        try {
            return localStorage.getItem(key);
        } catch(e) {
            return null;
        }
    },
    setItem: function(key, value) {
        if (!BrowserSupport.localStorage) return;
        try {
            localStorage.setItem(key, value);
        } catch(e) {
            // Ignore
        }
    }
};

// Safe fetch wrapper
function safeFetch(url, options) {
    if (BrowserSupport.fetch) {
        return fetch(url, options).catch(function(error) {
            console.error('Fetch hatası:', error);
            return Promise.reject(error);
        });
    } else {
        // XMLHttpRequest fallback
        return new Promise(function(resolve, reject) {
            var xhr = new XMLHttpRequest();
            xhr.open(options && options.method || 'GET', url);
            if (options && options.headers) {
                for (var key in options.headers) {
                    xhr.setRequestHeader(key, options.headers[key]);
                }
            }
            xhr.onload = function() {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        resolve({ json: function() { return Promise.resolve(JSON.parse(xhr.responseText)); } });
                    } catch(e) {
                        reject(e);
                    }
                } else {
                    reject(new Error('HTTP ' + xhr.status));
                }
            };
            xhr.onerror = reject;
            if (options && options.body) {
                xhr.send(options.body);
            } else {
                xhr.send();
            }
        });
    }
}

// --- 1. VERİ HAVUZU (AFAD TDTH İVME DEĞERLERİ İLE) ---
const veriler = {
    "sariyer": { 
        ad: "Sarıyer", 
        zemin: "Çok Sağlam (Kaya)", 
        bina: "Karma", 
        nufus: "Düşük", 
        risk: "dusuk", 
        puan: "1/10",
        afadPGA: "0.15-0.20g", // AFAD TDTH Yer İvmesi (PGA)
        fayHatti: "Uzak",
        aciklama: "Kuzey ormanları bölgesi, zemini en sağlam yerdir.",
        degerlendirme: "✅ **Bölge Analizi:** MTA Yerbilimleri Harita Görüntüleyicisi'ne göre Sarıyer, İstanbul'un en eski ve en sağlam kayaç zeminlerinden biri (Paleozoyik yaşlı) üzerinde yer almaktadır. AFAD Türkiye Deprem Tehlike Haritası (TDTH) verilerine göre yer ivmesi (PGA) değeri 0.15-0.20g aralığındadır. Zemin büyütme etkisi (amplifikasyon) minimal seviyede olup, sıvılaşma riski bilimsel olarak öngörülmemektedir.",
        kaynaklar: ["AFAD TDTH", "MTA"], 
        koordinat: { lat: 41.1086, lon: 29.0500 }, 
        toplamBina: 45000
    },
    "basaksehir": { 
        ad: "Başakşehir", 
        zemin: "Sağlam", 
        bina: "Yeni (Tünel Kalıp)", 
        nufus: "Orta", 
        risk: "dusuk", 
        puan: "2/10",
        afadPGA: "0.20-0.25g",
        fayHatti: "Orta Mesafe",
        aciklama: "Kayalık zemin üzerine kurulu yeni ve planlı yapılaşma.",
        degerlendirme: "✅ **Yapı Güvenliği:** Başakşehir, zemin yapısının sağlamlığının yanı sıra, yapı stokunun %80'inden fazlasının 2000 sonrası yönetmeliğe uygun ve 'Tünel Kalıp' sistemiyle inşa edilmiş olmasıyla öne çıkar. AFAD TDTH verilerine göre yer ivmesi (PGA) değeri 0.20-0.25g aralığındadır.",
        kaynaklar: ["AFAD TDTH", "MTA"], 
        koordinat: { lat: 41.0833, lon: 28.8000 }, 
        toplamBina: 68000
    },
    "besiktas": { 
        ad: "Beşiktaş", 
        zemin: "Sağlam (Kaya)", 
        bina: "Eski", 
        nufus: "Yüksek", 
        risk: "orta", 
        puan: "5/10",
        afadPGA: "0.25-0.30g",
        fayHatti: "Orta Mesafe",
        aciklama: "Zemin sağlam olsa da bina yaş ortalaması yüksektir.",
        degerlendirme: "⚠️ **Yapısal Risk:** Beşiktaş'ın sahil kesimleri hariç genel zemin yapısı kayalıktır. AFAD TDTH verilerine göre yer ivmesi (PGA) değeri 0.25-0.30g aralığındadır. Ancak ilçenin en büyük handikapı, yapı stokunun yaşlı olmasıdır. Zemin sağlam olsa bile, yorgun binaların olası bir yüksek ivmeli depremde hasar alma riski bulunmaktadır.",
        kaynaklar: ["AFAD TDTH", "MTA"], 
        koordinat: { lat: 41.0422, lon: 29.0089 }, 
        toplamBina: 52000
    },
    "sisli": { 
        ad: "Şişli", 
        zemin: "Sağlam", 
        bina: "Karma", 
        nufus: "Çok Yüksek", 
        risk: "orta", 
        puan: "5/10",
        afadPGA: "0.25-0.30g",
        fayHatti: "Orta Mesafe",
        aciklama: "Ticaret merkezi, yapı yoğunluğu riskli.",
        degerlendirme: "⚠️ **Yoğunluk Riski:** Şişli, zemin açısından güvenli bir platoda yer alsa da, İstanbul'un en yoğun nüfuslu bölgesidir. AFAD TDTH verilerine göre yer ivmesi (PGA) değeri 0.25-0.30g aralığındadır. Olası bir afette 'Domino Etkisi' riski ve dar sokakların kapanma ihtimali, arama-kurtarma faaliyetlerini zorlaştırabilir.",
        kaynaklar: ["AFAD TDTH"], 
        koordinat: { lat: 41.0603, lon: 28.9872 }, 
        toplamBina: 75000
    },
    "beylikduzu": { 
        ad: "Beylikdüzü", 
        zemin: "Zayıf", 
        bina: "Yeni", 
        nufus: "Yüksek", 
        risk: "orta", 
        puan: "6/10",
        afadPGA: "0.30-0.35g",
        fayHatti: "Yakın",
        aciklama: "Zemin zayıf ancak binalar yeni.",
        degerlendirme: "⚠️ **Karma Analiz:** Beylikdüzü'nde zemin yapısı yer yer killi ve zayıf olsa da, bölgedeki yapı stokunun büyük kısmı modern mühendislik hizmeti almış yeni binalardan oluşmaktadır. AFAD TDTH verilerine göre yer ivmesi (PGA) değeri 0.30-0.35g aralığındadır. Bu durum, zemin dezavantajını yapı güvenliği ile dengelemektedir.",
        kaynaklar: ["AFAD TDTH", "MTA"], 
        koordinat: { lat: 41.0000, lon: 28.6333 }, 
        toplamBina: 95000
    },
    "buyukcekmece": { 
        ad: "Büyükçekmece", 
        zemin: "Orta/Zayıf", 
        bina: "Orta", 
        nufus: "Orta", 
        risk: "orta", 
        puan: "6/10",
        afadPGA: "0.30-0.35g",
        fayHatti: "Yakın",
        aciklama: "Göl havzası ve heyelan riski.",
        degerlendirme: "⚠️ **Zemin Riski:** Büyükçekmece, göl havzası çevresinde bulunması nedeniyle zemin sıvılaşma riskinin bulunduğu bölgeleri barındırır. MTA Yerbilimleri Harita Görüntüleyicisi'nde heyelan potansiyelli alanlar mevcuttur. AFAD TDTH verilerine göre yer ivmesi (PGA) değeri 0.30-0.35g aralığındadır.",
        kaynaklar: ["AFAD TDTH", "MTA"], 
        koordinat: { lat: 41.0167, lon: 28.5833 }, 
        toplamBina: 42000
    },
    "kagithane": { 
        ad: "Kağıthane", 
        zemin: "Zayıf (Dere Yatağı)", 
        bina: "Yeni", 
        nufus: "Yüksek", 
        risk: "orta", 
        puan: "6/10",
        afadPGA: "0.30-0.35g",
        fayHatti: "Orta Mesafe",
        aciklama: "Dere yatağı çevresi zemin riski.",
        degerlendirme: "⚠️ **Alüvyon Zemin:** İlçe merkezi, Cendere Vadisi'nin dere yatağı (alüvyon zemin) üzerinde kuruludur. MTA Yerbilimleri Harita Görüntüleyicisi'ne göre bu tür zeminler deprem dalgalarını büyütme (amplifikasyon) eğilimindedir. AFAD TDTH verilerine göre yer ivmesi (PGA) değeri 0.30-0.35g aralığındadır.",
        kaynaklar: ["AFAD TDTH", "MTA"], 
        koordinat: { lat: 41.0667, lon: 28.9667 }, 
        toplamBina: 58000
    },
    "fatih": { 
        ad: "Fatih", 
        zemin: "Orta", 
        bina: "Çok Eski", 
        nufus: "Çok Yüksek", 
        risk: "yuksek", 
        puan: "8/10",
        afadPGA: "0.35-0.40g",
        fayHatti: "Yakın",
        aciklama: "Tarihi yarımada, çok eski bina stoğu.",
        degerlendirme: "❌ **Kritik Yapı Stoku:** Tarihi Yarımada üzerinde bulunan Fatih, 'Yapı Stoku Yaşı' ve 'Korozyon' nedeniyle en yüksek riskli ilçelerden biridir. AFAD TDTH verilerine göre yer ivmesi (PGA) değeri 0.35-0.40g aralığındadır. Binaların büyük çoğunluğu mühendislik hizmeti almamış yığma veya eski betonarme yapılardır.",
        kaynaklar: ["AFAD TDTH", "MTA"], 
        koordinat: { lat: 41.0125, lon: 28.9494 }, 
        toplamBina: 48000
    },
    "bakirkoy": { 
        ad: "Bakırköy", 
        zemin: "Zayıf", 
        bina: "Eski", 
        nufus: "Yüksek", 
        risk: "yuksek", 
        puan: "9/10",
        afadPGA: "0.40-0.45g",
        fayHatti: "Yakın",
        aciklama: "Sahil şeridi, zemin sıvılaşma riski.",
        degerlendirme: "❌ **Sıvılaşma Riski:** Bakırköy, Marmara Denizi'ne kıyısı olan ve zemin yapısı zayıf dolgu alanlarını barındıran bir ilçedir. MTA Yerbilimleri Harita Görüntüleyicisi raporlarına göre olası bir depremde 'Zemin Sıvılaşması' riski bulunmaktadır. AFAD TDTH verilerine göre yer ivmesi (PGA) değeri 0.40-0.45g aralığındadır.",
        kaynaklar: ["AFAD TDTH", "MTA"], 
        koordinat: { lat: 40.9833, lon: 28.8667 }, 
        toplamBina: 62000
    },
    "zeytinburnu": { 
        ad: "Zeytinburnu", 
        zemin: "Zayıf", 
        bina: "Dönüşümde", 
        nufus: "Çok Yüksek", 
        risk: "yuksek", 
        puan: "9/10",
        afadPGA: "0.40-0.45g",
        fayHatti: "Yakın",
        aciklama: "Sanayi geçmişi ve eski konutlar.",
        degerlendirme: "❌ **Sanayi ve Yapı Riski:** Geçmişte sanayi bölgesi olması ve plansız yapılaşma nedeniyle Zeytinburnu, İstanbul'un risk haritasında kırmızı bölgededir. AFAD TDTH verilerine göre yer ivmesi (PGA) değeri 0.40-0.45g aralığındadır. Kentsel dönüşüm hızlanmış olsa da zayıf zemin parametreleri riski canlı tutmaktadır.",
        kaynaklar: ["AFAD TDTH", "MTA"], 
        koordinat: { lat: 41.0000, lon: 28.9000 }, 
        toplamBina: 55000
    },
    "avcilar": { 
        ad: "Avcılar", 
        zemin: "Çok Zayıf", 
        bina: "Eski", 
        nufus: "Yüksek", 
        risk: "yuksek", 
        puan: "10/10",
        afadPGA: "0.45-0.50g",
        fayHatti: "Çok Yakın",
        aciklama: "Zemin depremi büyütme etkisine sahip.",
        degerlendirme: "❌ **Zemin Büyütmesi (Amplifikasyon):** Avcılar, jeolojik olarak killi ve gevşek bir zemin yapısına sahiptir. Bu zemin türü, deprem dalgalarını sönümlemek yerine şiddetini artıran bir yapıdadır. AFAD TDTH verilerine göre yer ivmesi (PGA) değeri 0.45-0.50g aralığındadır ve İstanbul'un en yüksek değerlerinden biridir. MTA Yerbilimleri Harita Görüntüleyicisi'nde aktif fay hatlarına yakınlık görülmektedir.",
        kaynaklar: ["AFAD TDTH", "MTA"], 
        koordinat: { lat: 41.0236, lon: 28.7144 }, 
        toplamBina: 72000
    },
    "esenyurt": { 
        ad: "Esenyurt", 
        zemin: "Orta", 
        bina: "Kontrolsüz", 
        nufus: "Aşırı Yüksek", 
        risk: "orta", 
        puan: "7/10",
        afadPGA: "0.30-0.35g",
        fayHatti: "Orta Mesafe",
        aciklama: "Aşırı nüfus yoğunluğu tahliyeyi zorlaştırır.",
        degerlendirme: "⚠️ **Nüfus ve Lojistik Riski:** Esenyurt, Türkiye'nin en kalabalık ilçesi olması sebebiyle, deprem anında yaşanacak panik ve tahliye süreçleri açısından büyük risk taşımaktadır. AFAD TDTH verilerine göre yer ivmesi (PGA) değeri 0.30-0.35g aralığındadır. Kontrolsüz yapılaşma altyapıyı zorlamaktadır.",
        kaynaklar: ["AFAD TDTH"], 
        koordinat: { lat: 41.0333, lon: 28.6833 }, 
        toplamBina: 180000
    },
    "edirne_merkez": { 
        ad: "Edirne Merkez", 
        zemin: "Sağlam", 
        bina: "Karma", 
        nufus: "Orta", 
        risk: "dusuk", 
        puan: "3/10",
        afadPGA: "0.15-0.20g",
        fayHatti: "Uzak",
        aciklama: "Tarihi şehir merkezi.", 
        degerlendirme: "✅ **Bölgesel Analiz:** Edirne, Kuzey Anadolu Fay Hattı'na belirli bir mesafede yer aldığı için orta-düşük risk bölgesindedir. AFAD TDTH verilerine göre yer ivmesi (PGA) değeri 0.15-0.20g aralığındadır. Zemin yapısı genel olarak stabildir.", 
        kaynaklar: ["AFAD TDTH", "MTA"], 
        koordinat: { lat: 41.6772, lon: 26.5556 }, 
        toplamBina: 35000 
    },
    "tekirdag_merkez": { 
        ad: "Tekirdağ Merkez", 
        zemin: "Zayıf", 
        bina: "Karma", 
        nufus: "Yüksek", 
        risk: "orta", 
        puan: "6/10",
        afadPGA: "0.35-0.40g",
        fayHatti: "Çok Yakın",
        aciklama: "Sahil şeridi zemin riski.", 
        degerlendirme: "⚠️ **Fay Hattı Yakınlığı:** Tekirdağ, Marmara Denizi içinden geçen faya en yakın illerden biridir. MTA Yerbilimleri Harita Görüntüleyicisi'nde aktif fay hatları görülmektedir. Merkez ilçenin sahil dolgu alanlarında sıvılaşma riski bulunmaktadır. AFAD TDTH verilerine göre yer ivmesi (PGA) değeri 0.35-0.40g aralığındadır.", 
        kaynaklar: ["AFAD TDTH", "MTA"], 
        koordinat: { lat: 40.9833, lon: 27.5167 }, 
        toplamBina: 45000 
    },
    "kirklareli_merkez": { 
        ad: "Kırklareli Merkez", 
        zemin: "Sağlam", 
        bina: "Karma", 
        nufus: "Orta", 
        risk: "dusuk", 
        puan: "2/10",
        afadPGA: "0.10-0.15g",
        fayHatti: "Uzak",
        aciklama: "Kaya zemin yapısı.", 
        degerlendirme: "✅ **Sismik Güvenlik:** Kırklareli, Istranca Masifi'nin sağlam kayaç yapısı üzerinde yer alması nedeniyle Trakya'nın deprem açısından en güvenli bölgesidir. AFAD TDTH verilerine göre yer ivmesi (PGA) değeri 0.10-0.15g aralığındadır ve Türkiye'nin en düşük değerlerinden biridir.", 
        kaynaklar: ["AFAD TDTH", "MTA"], 
        koordinat: { lat: 41.7333, lon: 27.2167 }, 
        toplamBina: 32000 
    }
};

// --- EKSİK FONKSİYONLAR EKLENİYOR ---

// Güvenli parse fonksiyonları
function safeParseFloat(value) {
    if (value === null || value === undefined || value === '') {
        return 0;
    }
    var parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
}

function safeParseInt(value) {
    if (value === null || value === undefined || value === '') {
        return 0;
    }
    var parsed = parseInt(value, 10);
    return isNaN(parsed) ? 0 : parsed;
}

// Sayı formatlama fonksiyonu (cross-browser)
function formatNumber(num) {
    if (num === null || num === undefined || isNaN(num)) {
        return '0';
    }
    // Basit formatlama - binlik ayırıcı
    var numStr = Math.round(num).toString();
    var result = '';
    var count = 0;
    for (var i = numStr.length - 1; i >= 0; i--) {
        if (count > 0 && count % 3 === 0) {
            result = '.' + result;
        }
        result = numStr[i] + result;
        count++;
    }
    return result;
}

// --- 2. HESAPLAMA MOTORU (ALGORİTMA) ---

function puanYuzdeligeCevir(puanStr) {
    const [riskPuan, maxPuan] = puanStr.split('/').map(Number);
    return Math.round((10 - riskPuan) / 10 * 90 + 5) + "%";
}

function hasarYuzdesiHesapla(riskPuan, depremSiddeti, zeminTipi, uzaklik) {
    const [risk] = riskPuan.split('/').map(Number);
    let temelHasar = risk * 5; 
    let siddetCarpani = depremSiddeti >= 7.5 ? 2.5 : depremSiddeti >= 7.0 ? 2.0 : depremSiddeti >= 6.5 ? 1.5 : 1.0;
    
    let uzaklikCarpani = 1.0;
    if (uzaklik > 70) uzaklikCarpani = 0.3;
    else if (uzaklik > 50) uzaklikCarpani = 0.5;
    else if (uzaklik > 20) uzaklikCarpani = 0.8;
    else if (uzaklik <= 10) uzaklikCarpani = 1.1; 
    
    let zeminCarpani = 1.0;
    if (zeminTipi.includes("Çok Zayıf")) zeminCarpani = 1.6;
    else if (zeminTipi.includes("Zayıf")) zeminCarpani = 1.3;
    else if (zeminTipi.includes("Sağlam")) zeminCarpani = 0.8;
    
    let hasar = temelHasar * siddetCarpani * uzaklikCarpani * zeminCarpani;
    return Math.min(95, Math.max(1, hasar));
}

// Mesafe Hesaplama (Haversine Formülü) - DÜZELTİLMİŞ
function mesafeHesapla(lat1, lon1, lat2, lon2) {
    // Koordinat kontrolü
    if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) {
        console.error("❌ Geçersiz koordinat:", lat1, lon1, lat2, lon2);
        return Infinity;
    }
    
    // Koordinat aralığı kontrolü
    if (lat1 < -90 || lat1 > 90 || lat2 < -90 || lat2 > 90) {
        console.error("❌ Geçersiz enlem:", lat1, lat2);
        return Infinity;
    }
    if (lon1 < -180 || lon1 > 180 || lon2 < -180 || lon2 > 180) {
        console.error("❌ Geçersiz boylam:", lon1, lon2);
        return Infinity;
    }
    
    const R = 6371; // Dünya yarıçapı (km)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// En Yakın İlçeyi Bulma - DÜZELTİLMİŞ (Debug logları eklendi)
function enYakinIlceyiBul(userLat, userLon) {
    if (!userLat || !userLon || isNaN(userLat) || isNaN(userLon)) {
        console.error("❌ Geçersiz koordinat:", userLat, userLon);
        return null;
    }
    
    let enYakinIlce = null;
    let enKisaMesafe = Infinity;
    let tumMesafeler = []; // Debug için
    
    console.log("📍 Kullanıcı konumu:", userLat, userLon);
    
    for (let key in veriler) {
        const ilce = veriler[key];
        if (!ilce.koordinat || !ilce.koordinat.lat || !ilce.koordinat.lon) {
            console.warn("⚠️ Koordinat eksik:", key);
            continue;
        }
        
        const mesafe = mesafeHesapla(userLat, userLon, ilce.koordinat.lat, ilce.koordinat.lon);
        tumMesafeler.push({ ilce: ilce.ad, mesafe: mesafe.toFixed(2) });
        
        if (mesafe < enKisaMesafe) {
            enKisaMesafe = mesafe;
            enYakinIlce = key;
        }
    }
    
    // Debug: En yakın 5 ilçeyi göster
    tumMesafeler.sort(function(a, b) { return parseFloat(a.mesafe) - parseFloat(b.mesafe); });
    console.log("📊 En yakın 5 ilçe:", tumMesafeler.slice(0, 5));
    console.log("✅ Seçilen ilçe:", veriler[enYakinIlce] ? veriler[enYakinIlce].ad : "BULUNAMADI", "- Mesafe:", enKisaMesafe.toFixed(2), "km");
    
    if (!enYakinIlce) {
        console.error("❌ Hiçbir ilçe bulunamadı!");
        return null;
    }
    
    return { kod: enYakinIlce, mesafe: enKisaMesafe };
}

// --- 3. ARAYÜZ YÖNETİMİ (UI) ---

// Window onload - BASİT VE GARANTİLİ
window.onload = function() {
    listeleriDoldur();
    tumIlcelerHasarTablosuGuncelle();
    
    // Dark mode
    var darkMode = SafeStorage.getItem('darkMode') === 'true';
    if (darkMode) {
        document.body.classList.add('dark-mode');
        var toggleBtn = document.getElementById('darkModeToggle');
        if (toggleBtn) toggleBtn.innerText = '☀️';
    }
    
    // Konum iste - EN BASİT YOL
    if (navigator && navigator.geolocation) {
        setTimeout(function() {
            konumIsteVeYonlendir();
        }, 500);
    }
};

// DOMContentLoaded için de ekle
if (document.addEventListener) {
    document.addEventListener('DOMContentLoaded', function() {
        // Sadece gerekli şeyleri yap
        if (navigator && navigator.geolocation) {
            setTimeout(function() {
                konumIsteVeYonlendir();
            }, 1000);
        }
    });
}

function listeleriDoldur() {
    let safeHTML = "";
    let riskHTML = "";
    
    for (let key in veriler) {
        let veri = veriler[key];
        const yuzdelikPuan = puanYuzdeligeCevir(veri.puan);
        const itemHTML = `<div class="list-item" onclick="ilceSec('${key}')"><span>${veri.ad}</span> <span>${yuzdelikPuan}</span></div>`;
        
        if (veri.risk === "dusuk") {
            safeHTML += itemHTML.replace('list-item', 'list-item safe-item');
        } else {
            let stil = veri.risk === "orta" ? 'style="border-left-color: #f59e0b;"' : 'style="border-left-color: #ef4444;"';
            riskHTML += `<div class="list-item risk-item" ${stil} onclick="ilceSec('${key}')"><span>${veri.ad}</span> <span>${yuzdelikPuan}</span></div>`;
        }
    }
    
    const gList = document.getElementById("guvenliListe");
    const rList = document.getElementById("riskliListe");
    if(gList) gList.innerHTML = safeHTML;
    if(rList) rList.innerHTML = riskHTML;
}

// Konum fonksiyonu - DÜZELTİLMİŞ (Daha detaylı debug)
function konumIsteVeYonlendir() {
    if (!navigator || !navigator.geolocation) {
        var durumElem = document.getElementById("konumDurumu");
        if(durumElem) { 
            durumElem.innerText = "Desteklenmiyor"; 
            durumElem.style.color = "#ef4444"; 
        }
        var dotElem = document.getElementById("statusDot");
        if(dotElem) dotElem.style.background = "#ef4444";
        return;
    }

    var durumElem = document.getElementById("konumDurumu");
    var dotElem = document.getElementById("statusDot");
    
    if(durumElem) { 
        durumElem.innerText = "Konum Aranıyor..."; 
        durumElem.style.color = "#f59e0b"; 
    }

    var options = { 
        enableHighAccuracy: false,
        timeout: 30000,
        maximumAge: 60000
    };

    navigator.geolocation.getCurrentPosition(
        function(pos) {
            var lat = pos.coords.latitude;
            var lon = pos.coords.longitude;
            var accuracy = pos.coords.accuracy; // Doğruluk (metre)
            
            console.log("✅ Konum alındı:");
            console.log("   - Enlem:", lat);
            console.log("   - Boylam:", lon);
            console.log("   - Doğruluk:", accuracy, "metre");
            console.log("   - Tarayıcı:", navigator.userAgent);
            
            if(durumElem) { 
                durumElem.innerText = "Aktif (" + Math.round(accuracy) + "m)"; 
                durumElem.style.color = "#10b981"; 
            }
            if(dotElem) dotElem.style.background = "#10b981";

            var sonuc = enYakinIlceyiBul(lat, lon);
            console.log("🔍 Sonuç:", sonuc);
            
            if (sonuc && sonuc.kod) {
                var selectBox = document.getElementById("ilceListesi");
                if(selectBox) {
                    selectBox.value = sonuc.kod;
                    var secilenIlce = veriler[sonuc.kod];
                    console.log("✅ İlçe seçildi:", secilenIlce.ad, "- Mesafe:", sonuc.mesafe.toFixed(2), "km");
                    
                    // Kullanıcıya bilgi göster
                    if(durumElem) {
                        durumElem.innerText = "Aktif - " + secilenIlce.ad + " (" + sonuc.mesafe.toFixed(1) + " km)";
                    }
                    
                    setTimeout(function() {
                        analizGetir();
                    }, 300);
                }
            } else {
                console.error("❌ İlçe bulunamadı!");
                if(durumElem) { 
                    durumElem.innerText = "İlçe bulunamadı"; 
                    durumElem.style.color = "#ef4444"; 
                }
            }
        },
        function(err) {
            console.error("❌ Konum hatası:", err.code, err.message);
            var mesaj = "Konum alınamadı";
            if (err.code === 1) {
                mesaj = "İzin reddedildi";
            } else if (err.code === 2) {
                mesaj = "Konum bulunamadı";
            } else if (err.code === 3) {
                mesaj = "Zaman aşımı - Tekrar deneyin";
            }
            
            if(durumElem) { 
                durumElem.innerText = mesaj; 
                durumElem.style.color = "#ef4444"; 
            }
            if(dotElem) dotElem.style.background = "#ef4444";
        },
        options
    );
}

function konumIste() { 
    konumIsteVeYonlendir(); 
}

// --- DİĞER FONKSİYONLAR (DÜZELTİLMİŞ) ---

function depremSiddetiDegisti() {
    var val = safeParseFloat(document.getElementById("depremSiddeti").value);
    const siddetDegeri = document.getElementById("siddetDegeri");
    if(siddetDegeri) siddetDegeri.textContent = val;
    
    // Sadece seçili ilçe varsa güncelle, yoksa sadece tabloyu güncelle
    const seciliIlce = document.getElementById("ilceListesi").value;
    if (seciliIlce) {
        // Hasarlı bina bilgisini güncelle
        hasarBilgisiniGuncelle(seciliIlce);
    }
    
    tumIlcelerHasarTablosuGuncelle();
}

function depremUzaklikDegisti() {
    var val = document.getElementById("depremUzaklik").value;
    const uzaklikDegeri = document.getElementById("uzaklikDegeri");
    if(uzaklikDegeri) uzaklikDegeri.textContent = val;
    
    // Sadece seçili ilçe varsa güncelle, yoksa sadece tabloyu güncelle
    const seciliIlce = document.getElementById("ilceListesi").value;
    if (seciliIlce) {
        // Hasarlı bina bilgisini güncelle
        hasarBilgisiniGuncelle(seciliIlce);
    }
    
    tumIlcelerHasarTablosuGuncelle();
}

// HASAR BİLGİSİNİ GÜNCELLE FONKSİYONU
function hasarBilgisiniGuncelle(ilceKodu) {
    if (!ilceKodu) return;
    
    const veri = veriler[ilceKodu];
    if (!veri) return;
    
    const depremSiddeti = safeParseFloat(document.getElementById("depremSiddeti").value);
    const uzaklik = safeParseFloat(document.getElementById("depremUzaklik").value);
    
    const hasarYuzdesi = hasarYuzdesiHesapla(veri.puan, depremSiddeti, veri.zemin, uzaklik);
    const hasarliBinaSayisi = Math.round(veri.toplamBina * hasarYuzdesi / 100);
    
    // Hasar bilgilerini güncelle
    const toplamBinaEl = document.getElementById("toplamBina");
    const hasarliBinaEl = document.getElementById("hasarliBina");
    const hasarOraniEl = document.getElementById("hasarOrani");
    const hasarBar = document.getElementById("hasarBar");
    
    if (toplamBinaEl) toplamBinaEl.innerText = formatNumber(veri.toplamBina);
    if (hasarliBinaEl) hasarliBinaEl.innerText = formatNumber(hasarliBinaSayisi);
    if (hasarOraniEl) hasarOraniEl.innerText = hasarYuzdesi.toFixed(1) + "%";
    
    if (hasarBar) {
        hasarBar.style.width = hasarYuzdesi + "%";
        if (hasarYuzdesi >= 60) {
            hasarBar.style.background = "#ef4444";
        } else if (hasarYuzdesi >= 40) {
            hasarBar.style.background = "#f59e0b";
        } else if (hasarYuzdesi >= 20) {
            hasarBar.style.background = "#fbbf24";
        } else {
            hasarBar.style.background = "#10b981";
        }
    }
}

function hizliSenaryo(siddet, uzaklik) {
    document.getElementById('depremSiddeti').value = siddet;
    document.getElementById('depremUzaklik').value = uzaklik;
    document.getElementById('siddetDegeri').textContent = siddet.toFixed(1);
    document.getElementById('uzaklikDegeri').textContent = uzaklik;
    analizGetir();
    tumIlcelerHasarTablosuGuncelle();
}

function analizGetir() {
    let kod = document.getElementById("ilceListesi").value;
    if (!kod) return;
    
    const veri = veriler[kod];
    if (!veri) return;
    
    // Veri kutusunu göster
    const veriKutusu = document.getElementById("veriKutusu");
    const hasarKutusu = document.getElementById("hasarKutusu");
    const degerlendirmeKutusu = document.getElementById("degerlendirmeKutusu");
    
    if(veriKutusu) veriKutusu.style.display = "block";
    if(hasarKutusu) hasarKutusu.style.display = "block";
    if(degerlendirmeKutusu) degerlendirmeKutusu.style.display = "block";
    
    // Verileri yaz
    const zeminEl = document.getElementById("zemin");
    const binaEl = document.getElementById("bina");
    const nufusEl = document.getElementById("nufus");
    const puanEl = document.getElementById("puan");
    const buyukBaslik = document.getElementById("buyukBaslik");
    const aciklamaMetni = document.getElementById("aciklamaMetni");
    const degerlendirmeMetni = document.getElementById("degerlendirmeMetni");
    
    if(zeminEl) zeminEl.innerText = veri.zemin;
    if(binaEl) binaEl.innerText = veri.bina;
    if(nufusEl) nufusEl.innerText = veri.nufus;
    if(puanEl) puanEl.innerText = puanYuzdeligeCevir(veri.puan);
    if(buyukBaslik) buyukBaslik.innerText = veri.ad;
    if(aciklamaMetni) aciklamaMetni.innerText = veri.aciklama;
    if(degerlendirmeMetni) degerlendirmeMetni.innerHTML = veri.degerlendirme;

    // AFAD PGA değerini göster (eğer varsa)
    if (veri.afadPGA) {
        // Veri kutusuna PGA bilgisi ekle
        const pgaInfo = document.createElement('div');
        pgaInfo.className = 'data-row';
        pgaInfo.innerHTML = `
            <span class="data-label">Yer İvmesi (PGA)</span>
            <span class="data-val" style="color: #667eea; font-weight: 700;">${veri.afadPGA}</span>
        `;
        // Veri kutusuna ekle (puan satırından önce)
        const veriKutusu = document.getElementById("veriKutusu");
        if (veriKutusu && !document.getElementById("pgaInfo")) {
            pgaInfo.id = "pgaInfo";
            const puanRow = veriKutusu.querySelector('.data-row.highlight');
            if (puanRow) {
                veriKutusu.insertBefore(pgaInfo, puanRow);
            }
        }
    }

    // Hasar bilgilerini güncelle
    hasarBilgisiniGuncelle(kod);

    // Haritayı güncelle
    let sehir = kod.includes("edirne") ? "Edirne" : 
                kod.includes("tekirdag") ? "Tekirdag" : 
                kod.includes("kirklareli") ? "Kirklareli" : "Istanbul";
    
    const uyduHarita = document.getElementById("uyduHarita");
    if(uyduHarita) {
        uyduHarita.src = `https://maps.google.com/maps?q=${veri.ad},${sehir}&t=k&z=14&ie=UTF8&iwloc=&output=embed`;
    }

    // Risk badge'i güncelle
    const badge = document.getElementById("riskBadge");
    if(badge) {
        if (veri.risk === "yuksek") {
            badge.style.background = "#e74c3c";
            badge.innerText = "YÜKSEK RİSK";
        } else if (veri.risk === "orta") {
            badge.style.background = "#f39c12";
            badge.innerText = "ORTA RİSK";
        } else {
            badge.style.background = "#27ae60";
            badge.innerText = "GÜVENLİ";
        }
    }

    // Kaynak bilgilerini göster - DASK referanslarını kaldır
    if (veri.kaynaklar && veri.kaynaklar.length > 0) {
        const kaynakListesi = document.getElementById("kaynakListesi");
        if (kaynakListesi) {
            let kaynakHTML = "";
            veri.kaynaklar.forEach(k => { 
                // DASK'ı gösterme, sadece AFAD TDTH ve MTA
                if (k !== "DASK") {
                    kaynakHTML += `<span class="source-badge">${k}</span>`;
                }
            });
            kaynakListesi.innerHTML = kaynakHTML;
        }
        const kaynakBilgisi = document.getElementById("kaynakBilgisi");
        if(kaynakBilgisi) kaynakBilgisi.style.display = "block";
    }

    // Grafik güncelle (eğer Chart.js yüklüyse)
    if (typeof Chart !== 'undefined') {
        setTimeout(() => {
            try {
                grafikGuncelle();
            } catch(e) {
                console.log("Grafik güncellenemedi:", e);
            }
        }, 500);
    }
}

function tumIlcelerHasarTablosuGuncelle() {
    const container = document.getElementById("tumIlcelerHasar");
    if (!container) return;

    const siddet = safeParseFloat(document.getElementById("depremSiddeti").value);
    const uzaklik = safeParseFloat(document.getElementById("depremUzaklik").value);
    
    let html = '<div class="damage-table">';
    let liste = [];

    for (let key in veriler) {
        const veri = veriler[key];
        const hasar = hasarYuzdesiHesapla(veri.puan, siddet, veri.zemin, uzaklik);
        // Spread operator yerine Object.assign kullan (cross-browser uyumluluk)
        var item = {};
        for (var prop in veri) {
            if (veri.hasOwnProperty(prop)) {
                item[prop] = veri[prop];
            }
        }
        item.hasar = hasar;
        liste.push(item);
    }

    liste.sort(function(a, b) { return b.hasar - a.hasar; });

    liste.forEach(function(item) {
        let renk = item.hasar > 50 ? "damage-critical" : item.hasar > 25 ? "damage-high" : "damage-low";
        html += 
            '<div class="damage-table-row ' + renk + '">' +
                '<div class="damage-table-cell name-cell">' + item.ad + '</div>' +
                '<div class="damage-table-cell damage-percentage">' + item.hasar.toFixed(1) + '%</div>' +
                '<div class="damage-table-cell damage-count">' + formatNumber(Math.round(item.toplamBina * item.hasar / 100)) + '</div>' +
            '</div>';
    });
    
    html += '</div>';
    container.innerHTML = html;
}

let chartInstance = null;
function grafikGuncelle() {
    const ctx = document.getElementById('hasarGrafik');
    if (!ctx) return;
    
    const siddet = safeParseFloat(document.getElementById("depremSiddeti").value);
    const uzaklik = safeParseFloat(document.getElementById("depremUzaklik").value);
    
    let veriListesi = [];
    for(let key in veriler) {
        let h = hasarYuzdesiHesapla(veriler[key].puan, siddet, veriler[key].zemin, uzaklik);
        veriListesi.push({ad: veriler[key].ad, hasar: h});
    }
    veriListesi.sort((a,b) => b.hasar - a.hasar);
    const top8 = veriListesi.slice(0, 8);

    if (chartInstance) chartInstance.destroy();

    chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: top8.map(i => i.ad),
            datasets: [{
                label: 'Simüle Edilen Hasar (%)',
                data: top8.map(i => i.hasar),
                backgroundColor: top8.map(i => i.hasar > 50 ? '#ef4444' : '#f59e0b')
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true, max: 100 } }
        }
    });
    document.getElementById('grafikPanel').style.display = 'block';
}

function ilceSec(key) {
    document.getElementById('ilceListesi').value = key;
    analizGetir();
}

function paylas() {
    const seciliIlce = document.getElementById('ilceListesi').value;
    if (!seciliIlce) { alert('Önce bir ilçe seçin!'); return; }
    const veri = veriler[seciliIlce];
    const metin = `${veri.ad} Deprem Analizi - Risk: ${veri.risk.toUpperCase()}`;
    if (navigator.share) { navigator.share({ title: 'İst-Risk', text: metin, url: window.location.href }); }
    else { alert('Tarayıcı desteklemiyor.'); }
}

function pdfIndir() {
    alert("Rapor oluşturuluyor... (Demo Modu)");
}

function toggleKarsilastirma() {
    const btn = document.getElementById('karsilastirmaBtn');
    const select = document.getElementById('karsilastirmaIlce');
    if (select.style.display === 'none') {
        select.style.display = 'block';
        btn.innerText = 'Açık';
        btn.style.background = '#10b981';
        let html = '<option value="">Karşılaştırılacak ilçe seçin</option>';
        for(let key in veriler) html += `<option value="${key}">${veriler[key].ad}</option>`;
        select.innerHTML = html;
    } else {
        select.style.display = 'none';
        btn.innerText = 'Kapalı';
        btn.style.background = '#6b7280';
    }
}

function karsilastirmaYap() {
    const i1 = document.getElementById('ilceListesi').value;
    const i2 = document.getElementById('karsilastirmaIlce').value;
    if(!i1 || !i2) return;
    
    const v1 = veriler[i1];
    const v2 = veriler[i2];
    const s = safeParseFloat(document.getElementById("depremSiddeti").value);
    const u = safeParseFloat(document.getElementById("depremUzaklik").value);
    
    const h1 = hasarYuzdesiHesapla(v1.puan, s, v1.zemin, u);
    const h2 = hasarYuzdesiHesapla(v2.puan, s, v2.zemin, u);
    
    alert(`KARŞILAŞTIRMA:\n\n${v1.ad}: %${h1.toFixed(1)} Hasar\n${v2.ad}: %${h2.toFixed(1)} Hasar`);
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    SafeStorage.setItem('darkMode', isDark);
    document.getElementById('darkModeToggle').innerText = isDark ? '☀️' : '🌙';
}
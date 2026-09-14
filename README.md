# Rayda Son Saniye

Demiryolu güvenliği üzerine bir farkındalık oyunu. 12 kaza kaydı izliyorsun; her kayıtta biri demiryolunda bir hata yapıyor ve bedelini ödüyor. Geçmiş değişmez. Senin işin tehlikenin başladığı anı yakalamak ve kazanın nasıl önlenebileceğini bilmek.

Oyun fikri: **Uras** (10 yaşında). Kod [Claude Code](https://claude.com/claude-code) ile yazıldı.

**Hemen oyna:** https://urasucar.github.io/TCDD/

## Nasıl oynanır

1. Yukarıdaki bağlantıyı aç ya da `rayda-son-saniye/index.html` dosyasını tarayıcıda aç. Kurulum gerekmez.
2. **Arşivi aç** düğmesine bas.
3. Birinin kendini tehlikeye attığı ilk anda **TEHLİKE** düğmesine bas ya da boşluk tuşuna dokun. Ne kadar erken yakalarsan o kadar çok puan alırsın; tehlike yokken basarsan −20.
4. Kayıt bitince olay tutanağındaki soruyu cevapla (fareyle ya da 1–4 tuşlarıyla).
5. 12 kaydın sonunda puanını, rütbeni ve öğrendiğin kuralları görürsün.

## Kayıtlar

| No | Kayıt | Kamera | Sonuç |
|----|-------|--------|-------|
| K-01 | Bariyerin etrafından dolanan otomobil | Güvenlik kamerası | Ölüm |
| K-02 | Katener altında vagonun üstüne çıkan genç | Güvenlik kamerası | Ağır yaralı |
| K-03 | Kulaklıkla hat üzerinde yürümek | Güvenlik kamerası | Ölüm |
| K-04 | Peronda sarı çizginin önünde beklemek | Güvenlik kamerası | Ağır yaralı |
| K-05 | Çift hatta ikinci tren | Güvenlik kamerası | Ölüm |
| K-06 | Kalkan trene yetişmeye çalışmak | Güvenlik kamerası | Ağır yaralı |
| K-07 | Duran yük treninin altından geçmek | Güvenlik kamerası | Ölüm |
| K-08 | Demiryolu köprüsünde yürümek | Güvenlik kamerası | Ağır yaralı |
| K-09 | Gözcüsüz çalışan hat bakım işçisi | Güvenlik kamerası | Ölüm |
| K-10 | Bariyersiz geçitte traktör ve römork | Lokomotif ön kamerası | Ağır yaralı |
| K-11 | Rayda poz vermek | Cep telefonu | Ağır yaralı |
| K-12 | Raya düşen telefonu almak için inmek | Güvenlik kamerası | Ölüm |

## Dosyalar

| Dosya | Ne işe yarar |
|-------|--------------|
| `index.html` | Sayfa, arayüz ve stiller |
| `engine.js` | Canvas 2D üzerinde çalışan küçük bir 3B çizim motoru |
| `models.js` | İnsan, tren, araç ve altyapı modelleri |
| `audio.js` | Web Audio ile üretilen sesler: korna, fren, çarpma, ark, geçit zili |
| `scenes-1.js`, `scenes-2.js`, `scenes-3.js` | 12 kaydın senaryoları, soruları ve kuralları |
| `game.js` | Oyun akışı, puanlama ve kamera görüntü efektleri |

## Not

Kayıtlar kurgusal canlandırmalardır; gerçek kişi, kurum veya olaylarla ilgisi yoktur. Kan ya da vahşet gösterilmez. Videolar dosya değildir, tarayıcıda canlı çizilir; yazı tipleri için internet bağlantısı gerekir, yoksa yedek yazı tipleri kullanılır.

Hatta tehlike görürsen: **112**

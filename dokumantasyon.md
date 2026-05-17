# 🧠 SynapseOS - Proje Dökümantasyonu

Bu döküman, **SynapseOS** projesinin baştan sona mimarisini, kullanılan teknolojileri, klasör yapısını ve her bir dosyanın ne amaçla kullanıldığını detaylı bir şekilde açıklamaktadır.

## 1. Proje Özeti ve Amacı

**SynapseOS**, özellikle nöroçeşitliliğe sahip (Disleksi, DEHB, Otizm) öğrenciler için "Otonom Adaptasyon Eksikliği" problemini çözmeyi hedefleyen yeni nesil bir EdTech (Eğitim Teknolojisi) platformudur.

Sistem, öğrencinin okuma esnasındaki davranışlarını analiz eder:
- **Yüz Takibi (Edge AI):** Kameradan yüz hareketleri ve ekrandan uzaklaşma/yakınlaşma durumları analiz edilir.
- **Davranışsal Telemetri (Diginova):** Farenin titremesi, imleç duraksaması ve kaydırma (scroll) hızı gibi veriler toplanır.

Bu veriler birleştirilerek öğrencinin **Bilişsel Yükü (Cognitive Load)** hesaplanır. Eğer bu yük kritik seviyenin (%75) üzerine çıkarsa, sistem **Puq.ai** entegrasyonu üzerinden otonom bir müdahale gerçekleştirerek öğrencinin okuduğu metni daha anlaşılır ve disleksi dostu bir formata dönüştürür. Ayrıca **Eğitmen Komuta Merkezi (Teacher Dashboard)** sayesinde öğretmenler, tüm öğrencilerin o anki bilişsel durumlarını canlı olarak izleyebilir ve risk altındaki öğrencilere anında müdahale edebilirler.

---

## 2. Kullanılan Teknolojiler (Tech Stack)

- **Frontend (Kullanıcı Arayüzü):** React 19, TypeScript, Vite
- **Stil Yönetimi:** Vanilla CSS (CSS Variables, Glassmorphism, Responsive Tasarım)
- **Veritabanı & Gerçek Zamanlı Senkronizasyon:** Firebase Cloud Firestore (NoSQL, Real-time)
- **Yapay Zeka (Edge AI):** `face-api.js` (Tarayıcı üzerinde çalışan, gecikmesiz yüz tanıma ve takip modeli)
- **Davranışsal Telemetri:** Diginova Entegrasyon Protokolü (Özel geliştirilmiş telemetri motoru)
- **LLM Entegrasyonu:** Puq.ai API (Metinlerin otonom olarak sadeleştirilmesi için)

---

## 3. Klasör ve Dosya Yapısı

Proje dosyaları ve klasörlerinin işlevleri aşağıda listelenmiştir:

### Ana Dizin Dosyaları
- **`package.json`**: Projenin npm bağımlılıklarını (React, Firebase, face-api.js, lucide-react vb.) ve çalıştırılabilir script'lerini (`npm run dev`, `build`, `lint`) tanımlar.
- **`vite.config.ts`**: Vite derleyicisinin konfigürasyon dosyasıdır. React eklentilerini ve geliştirme sunucusu ayarlarını barındırır.
- **`tsconfig.json` & `tsconfig.app.json`**: TypeScript derleyici kurallarını belirler.
- **`index.html`**: React uygulamasının bağlandığı ana HTML iskeletidir. Uygulama `<div id="root"></div>` içerisine render edilir.
- **`server.cjs`**: (Opsiyonel/Legacy) Express.js ve WebSocket kullanılarak yazılmış, gerçek zamanlı haberleşmeyi sağlayan Node.js tabanlı sunucu dosyasıdır. Şu anki güncel yapıda gerçek zamanlı iletişim ağırlıklı olarak Firebase Firestore üzerinden sağlanmaktadır, ancak yerel ağ içi senkronizasyon alternatifleri için hazır beklemektedir.
- **`.env`**: Firebase, Puq.ai ve Diginova API gibi dış servislere erişim için gerekli gizli API anahtarlarını barındırır. (Güvenlik sebebiyle git'e gönderilmez, `.env.example` gibi bir dosya oluşturulmalıdır).
- **`README.md`**: Projenin İngilizce özetini, kurulum talimatlarını ve Hackathon bağlamını açıklayan ana benioku dosyasıdır.

### `/src` Klasörü (Kaynak Kodlar)
Projenin frontend kodlarının tümü bu klasör içindedir.

- **`main.tsx`**: Uygulamanın giriş noktasıdır. React uygulamasını başlatır ve `App` bileşenini DOM'a bağlar. React Router'ın `BrowserRouter` kapsayıcısı burada tanımlıdır.
- **`App.tsx`**: Uygulamanın ana yönlendirme (routing) mekanizmasını içerir. İki ana sayfayı barındırır:
  - `/` (Kök Dizin): Öğrenci Arayüzü (`StudentView`)
  - `/teacher`: Eğitmen Komuta Merkezi (`TeacherDashboard`)
- **`App.css` & `index.css`**: Uygulamanın tüm global tasarım ayarlarını (Dark Mode, renk paletleri, Glassmorphism efektleri, Disleksi temasının tipografik ayarları) barındırır.
- **`firebase.ts`**: Firebase SDK'sının başlatıldığı (initialize) ve Firestore veritabanı bağlantısının (`db`) dışa aktarıldığı ayar dosyasıdır.

### `/src/pages` Klasörü (Sayfalar)
- **`StudentView.tsx` (Öğrenci Arayüzü)**
  - Sistemin kalbidir. Öğrencinin yüz tanıma (Face Login) ile sisteme girdiği, eğitim materyallerini okuduğu ekrandır.
  - Arka planda kamerayı sürekli takip eder (`face-api.js` ile). Göz kayması, yüzün ekrandan uzaklaşması, mikro hareketler (kafa sallama vs.) gibi verileri hesaplayarak "Bilişsel Yük" yüzdesini belirler.
  - Yük %75'i geçtiğinde, Puq.ai API'sine istek atar, gelen basitleştirilmiş cevabı ekrana yansıtır ve temayı Disleksi moduna (`theme-dyslexia`) alır.
  - Aynı zamanda Diginova servisi (`DiginovaIntegration.ts`) ile farenin titremesini dinler ve tüm teşhis verilerini gerçek zamanlı olarak Firebase'e gönderir.

- **`TeacherDashboard.tsx` (Eğitmen Komuta Merkezi)**
  - Öğretmenin kullandığı kontrol panelidir.
  - Sisteme yeni öğrenci kaydetmeyi sağlar (Yüz taraması ile `descriptor` verilerini Firebase'e kaydeder).
  - Online olan öğrencilerin Bilişsel Yük durumlarını (`load`), Diginova Jitter (fare titremesi) verilerini ve otonom teşhis raporlarını ("Kritik Dikkat Kaybı", "Stabil Okuma" vb.) canlı bir dashboard üzerinden listeler.
  - İhtiyaç duyulduğunda öğretmenin riskli bir öğrenciye anında "Puq.ai Otonom Müdahalesi" tetiklemesine (Manuel müdahale) olanak tanır.

### `/src/services` Klasörü (Servisler)
- **`DiginovaIntegration.ts` (Diginova Telemetri Servisi)**
  - Kullanıcının "davranışsal biyometrisini" ölçer.
  - Farenin ani titremeleri (`scrollJitterVelocity`), imlecin kararsız hareketleri (`cursorHesitationIndex`) ve sayfadaki gezinme davranışını tarayıcı olayları (`mousemove`, `scroll`) ile dinler.
  - Elde edilen verileri hesaplayıp `studentId`, bilişsel yük gibi değerlerle birlikte paketleyerek Diginova Cloud Endpoint'ine bir HTTP POST isteği olarak yollar.
  - Uygulama tarafında donmaları engellemek için `setInterval` kullanarak verileri belirli periyotlarla asenkron olarak iletir.

---

## 4. Uygulama İş Akışı (Senaryo)

1. **Öğretmenin Öğrenci Eklemesi:**
   Öğretmen `/teacher` ekranına girer, "Öğrenci Ekle" butonuna tıklar. Kameradan yüz taraması yapılarak öğrencinin yüz haritası (128 boyutlu `descriptor` vektörü) ve adı Firestore `students` koleksiyonuna kaydedilir.

2. **Öğrenci Girişi:**
   Öğrenci ana sayfaya (`/`) girdiğinde bir kamera ekranı ile karşılaşır. Sistemi yüzüyle kandırmasını önlemek için `FaceMatcher` algoritması çalışır. Eğer kameraya bakan yüz veritabanındaki kayıtlı bir öğrencinin yüzüyle uyuşursa (%60 eşik değeriyle), sistem öğrenciyi tanır ve giriş işlemini onaylar.

3. **Öğrenme ve Telemetri Aşaması:**
   Öğrenci bir metni (örneğin "Güneş Sistemi'nin Doğuşu") okumaya başlar.
   - `StudentView.tsx` arkada sürekli yüzün pozisyonunu izler. Eğer öğrenci ekran dışında bir yere bakıyorsa veya çok fazla sallanıyorsa "Bilişsel Yük" artar.
   - `DiginovaIntegration.ts` imleç ve kaydırma kararsızlığını ölçerek destekleyici veriler sunar.
   - Firebase üzerinde yer alan `sessions` dokümanı saniyede bir güncellenir. Öğretmen kendi panelinden öğrencinin zorlandığını canlı izler.

4. **Otonom Müdahale:**
   Öğrencinin zorlandığı tespit edildiğinde (Bilişsel Yük > 75), uygulama anlık olarak Puq.ai API'sine gider ve o sayfadaki metni sadeleştirerek geri getirir. Arka plan rengi göz yormayan, okuma odaklı "Disleksi Teması"na (`theme-dyslexia`) dönüşür.

5. **Oturumun Sonlanması:**
   Öğrenci "Okumayı ve Analizi Bitir" butonuna bastığında, seans boyunca toplanan davranışların istatistiksel yüzdesi (Örn: %40 Stabil Okuma, %30 Hızlı Satır Atlama) çıkarılır ve öğretmene detaylı bir "Otonom Teşhis Raporu" gönderilir. Öğretmen bu veriye dayanarak öğrencinin DEHB veya disleksi eğilimleri hakkında fikir sahibi olur.

---

## 5. Çözüm Bekleyen Sorunlar / Notlar
- Uygulamada yapay zeka modelleri çalıştığı için (face-api.js ağırlıkları), `public/models` klasörü içerisinde model dosyalarının (`tiny_face_detector`, `face_landmark_68`, `face_recognition`) eksiksiz bulunması zorunludur.
- `server.cjs` dosyası, ilerleyen süreçlerde WebSocket ile Firebase dışı daha düşük gecikmeli haberleşme hedeflenirse kullanılabilir. Şu an lokal geliştirme dışında doğrudan production'a etkisi Firestore gerisinde kalmaktadır.

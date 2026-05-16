import { useState, useEffect, useRef } from 'react';
import { Brain, ScanFace } from 'lucide-react';
import * as faceapi from 'face-api.js';
import { collection, doc, setDoc, updateDoc, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { diginovaService, type DiginovaTelemetryPayload } from '../services/DiginovaIntegration';

const courseModules = [
  {
    id: 1,
    title: "1. Bölüm: Güneş Sistemi'nin Doğuşu",
    text: `Güneş Sistemi, bir yıldız olan Güneş ve onun çekim etkisi altında kalan sekiz gezegen ile onların bilinen 166 uydusu, beş cüce gezegen ve milyarlarca küçük gökcisminden oluşur. Bu devasa sistem, yaklaşık 4.6 milyar yıl önce dev bir yıldızlararası moleküler bulutun kütleçekimsel olarak çökmesi sonucu oluşmuştur.

Bulutun merkezinde toplanan kütlenin büyük bir kısmı Güneş'i oluştururken, geri kalan madde gezegenleri, uyduları, asteroitleri ve diğer küçük gökcisimlerini oluşturacak olan bir ön gezegen diski halinde yassılaştı. İç Güneş Sistemi'nde, yüksek sıcaklıklara dayanabilen kaya ve metal gibi maddelerden oluşan dört karasal gezegen (Merkür, Venüs, Dünya ve Mars) yer alır.

Dış Güneş Sistemi ise çok daha soğuktur ve bu bölgede gaz devleri olarak adlandırılan dört dev gezegen (Jüpiter, Satürn, Uranüs ve Neptün) bulunur. Jüpiter ve Satürn ağırlıklı olarak hidrojen ve helyumdan oluşurken, Uranüs ve Neptün su, amonyak ve metan gibi buzlu maddelerden oluşur. Bu devasa gezegenlerin kütleçekimi, Güneş Sistemi'nin dinamiklerini ve yapısını şekillendirmede kritik bir rol oynamıştır.

Sistemin sınırları, Güneş rüzgarının yıldızlararası ortamla etkileşime girdiği heliosfer ve uzun dönemli kuyrukluyıldızların kaynağı olduğuna inanılan Oort Bulutu'na kadar uzanır. Bu muazzam yapı, evrenin işleyişini anlamak için eşsiz bir laboratuvar sunar.`
  },
  {
    id: 2,
    title: "2. Bölüm: Jüpiter'in Fırtınaları",
    text: `Jüpiter, Güneş Sistemi'nin en büyük gezegenidir ve kütlesi, sistemdeki diğer tüm gezegenlerin toplam kütlesinin iki buçuk katından fazladır. Ağırlıklı olarak hidrojen ve helyumdan oluşan bu devasa gaz topu, katı bir yüzeye sahip olmamasıyla bilinir.

Gezegenin en çarpıcı özelliklerinden biri, atmosferinde yüzyıllardır devam eden ve Dünya'dan bile daha büyük olan devasa bir fırtına olan Büyük Kırmızı Leke'dir. Bu muazzam fırtına, Jüpiter'in dinamik ve çalkantılı atmosferinin sadece bir örneğidir.

Jüpiter'in güçlü manyetik alanı, Güneş Sistemi'ndeki en büyük planetaryum manyetik alandır ve gezegenin etrafında yoğun bir radyasyon kuşağı oluşturur. Ayrıca, Jüpiter'in bilinen 79 uydusu vardır; bunlardan en büyük dördü olan Galilei uyduları (İo, Europa, Ganymede ve Callisto) kendilerine özgü büyüleyici özelliklere sahiptir.`
  },
  {
    id: 3,
    title: "3. Bölüm: Derin Uzay Görevleri",
    text: `İnsanlık, Güneş Sistemi'nin sınırlarını anlamak ve evrenin gizemlerini çözmek için Voyager 1 ve Voyager 2 gibi ikonik uzay araçları fırlatmıştır. 1977'de fırlatılan bu araçlar, dış gezegenlerin çarpıcı görüntülerini ve verilerini Dünya'ya göndererek ufkumuzu genişletti.

Voyager 1, 2012 yılında Güneş Sistemi'nin sınırlarını aşarak yıldızlararası uzaya giren ilk insan yapımı nesne oldu. Üzerinde taşıdığı Altın Plak, Dünya'daki yaşamın çeşitliliğini ve kültürlerini anlatan sesler ve görüntüler içeriyor; bu plak, evrendeki olası zeki yaşam formlarına gönderilen bir mesaj niteliği taşıyor.

Derin uzay keşfi, sadece Güneş Sistemi'ni değil, aynı zamanda dış ötegezegenleri ve uzak galaksileri inceleyen James Webb Uzay Teleskobu gibi yeni nesil gözlemevleri ile devam ediyor. Bu görevler, evrenin kökeni, gezegenlerin evrimi ve yaşamın potansiyeli hakkındaki en temel sorularımıza cevap arıyor.`
  }
];

export default function StudentView() {
  const [theme, setTheme] = useState<'theme-standard' | 'theme-dyslexia' | 'theme-focus'>('theme-standard');
  const [currentPage] = useState(0);
  const [content, setContent] = useState(courseModules[0].text);
  const [cognitiveLoad, setCognitiveLoad] = useState(35);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [diginovaData, setDiginovaData] = useState<DiginovaTelemetryPayload | null>(null);

  // Otonom Çoklu Cihaz Sistemi (Multiplayer)
  const [studentName, setStudentName] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [sessionFinished, setSessionFinished] = useState(false);
  const diagnosisCounts = useRef<Record<string, number>>({});


  const videoRef = useRef<HTMLVideoElement>(null);
  const loginVideoRef = useRef<HTMLVideoElement>(null);
  const lastFacePosition = useRef<{ x: number, y: number } | null>(null);

  // --- MODEL YÜKLEME ---
  useEffect(() => {
    const loadModels = async () => {
      console.log("FaceAPI Modelleri Yükleniyor...");
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
        await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
        await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
        setModelsLoaded(true);
      } catch (e: any) {
        console.error("FaceAPI Modelleri Yüklenirken Hata Oluştu:", e);
        alert("FaceAPI modelleri yüklenemedi! Lütfen '/models' klasörünün Netlify sitenizde doğru şekilde yayınlandığından emin olun. Hata: " + e.message);
      }
    };
    loadModels();
  }, []);

  const lastHandledIntervention = useRef(0);
  const sessionSeconds = useRef(0);

  // --- OTONOM MÜDAHALE & ONLİNE DURUMU ---
  useEffect(() => {
    if (studentName) {
      const sessionRef = doc(db, "sessions", studentName);

      const unsub = onSnapshot(sessionRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.lastIntervention && data.lastIntervention > lastHandledIntervention.current) {
            lastHandledIntervention.current = data.lastIntervention;
            alert('Puq.ai Otonom Müdahalesi: Dikkat dağınıklığı tespit edildi. Arayüz ve içerik sizin için sadeleştirildi.');
            setTheme('theme-dyslexia');
            setContent('Güneş Sistemi, bir yıldız olan Güneş ve onun etrafında dönen sekiz gezegenden oluşur.\n\nBu dev sistem, milyarlarca yıl önce dev bir moleküler gaz bulutunun çökmesiyle meydana geldi.\n\nİç kısımdaki dört gezegen kayalık ve sıcak (Merkür, Venüs, Dünya, Mars) iken, dış kısımdakiler ise soğuk dev gaz toplarıdır (Jüpiter, Satürn, Uranüs, Neptün).\n\n(Bu özet, Puq.ai tarafından otonom olarak sadeleştirilmiştir.)');
            setCognitiveLoad(35);
          }
        }
      });

      const handleBeforeUnload = () => {
        updateDoc(sessionRef, { online: false }).catch(() => { });
        diginovaService.disconnect();
      };
      window.addEventListener('beforeunload', handleBeforeUnload);

      // Start Diginova integration
      diginovaService.connect();
      diginovaService.onCognitiveLoadUpdate((payload) => {
        // We inject the real cognitive load from NovaVision to send to the Diginova Cloud
        setDiginovaData({
           ...payload,
           calculatedCognitiveLoad: cognitiveLoad
        });
      });

      return () => {
        unsub();
        window.removeEventListener('beforeunload', handleBeforeUnload);
        updateDoc(sessionRef, { online: false }).catch(() => { });
        diginovaService.disconnect();
        if ((diginovaService as any)._cleanupEvents) {
            (diginovaService as any)._cleanupEvents();
        }
      };
    }
  }, [studentName, cognitiveLoad]);

  // --- TELEMETRİ GÖNDERİMİ ---
  const [diagnosis, setDiagnosis] = useState('Analiz ediliyor...');

  useEffect(() => {
    if (studentName) {
      const sessionRef = doc(db, "sessions", studentName);
      updateDoc(sessionRef, {
        load: cognitiveLoad,
        diagnosis: diagnosis,
        online: true,
        diginovaJitter: Number(diginovaData?.scrollJitterVelocity || 0).toFixed(1),
        diginovaHesitation: Number(diginovaData?.cursorHesitationIndex || 0).toFixed(1)
      }).catch(() => {
        setDoc(sessionRef, {
          name: studentName,
          load: cognitiveLoad,
          diagnosis: diagnosis,
          online: true,
          lastIntervention: 0,
          diginovaJitter: 0,
          diginovaHesitation: 0
        });
      });
    }
  }, [cognitiveLoad, diagnosis, studentName, diginovaData]);

  // --- YÜZ İLE GİRİŞ (LOGIN) ---
  const handleFaceLogin = async () => {
    setIsLoggingIn(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (loginVideoRef.current) loginVideoRef.current.srcObject = stream;

      // Öğrenci veritabanını çek
      const querySnapshot = await getDocs(collection(db, "students"));
      const registeredStudents = querySnapshot.docs.map(doc => doc.data());

      if (registeredStudents.length === 0) {
        alert("Sistemde hiç öğrenci yok! Lütfen önce Eğitmen panelinden öğrenci ekleyin.");
        setIsLoggingIn(false);
        return;
      }

      // Kameranın açılması için biraz bekle
      await new Promise(r => setTimeout(r, 2000));

      if (loginVideoRef.current) {
        const detection = await faceapi.detectSingleFace(loginVideoRef.current, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (!detection) {
          alert("Yüzünüz algılanamadı, lütfen ışıklı bir ortamda kameraya bakın.");
          setIsLoggingIn(false);
          return;
        }

        // Yüz Eşleştirme (FaceMatcher)
        const labeledDescriptors = registeredStudents.map((s: any) =>
          new faceapi.LabeledFaceDescriptors(s.name, [new Float32Array(s.descriptor)])
        );

        const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.6);
        const match = faceMatcher.findBestMatch(detection.descriptor);

        if (match.label !== 'unknown') {
          setStudentName(match.label); // Giriş Başarılı!
          // Login kamerasını kapat, normal kameraya geç
          const tracks = stream.getTracks();
          tracks.forEach(t => t.stop());
          startTrackingCamera();
        } else {
          alert("Sizi tanıyamadım. Sistemi kandırmaya çalışıyorsanız, NovaVision'dan kaçamazsınız! :)");
        }
      }
    } catch (err: any) {
      console.error("Giriş Hatası:", err);
      alert("Giriş işlemi sırasında bir hata oluştu: " + (err.message || err) + "\n\nLütfen Firebase console üzerinden Firestore Kurallarını (Rules) veya kamera izinlerinizi kontrol edin!");
    }
    setIsLoggingIn(false);
  };

  // --- OKUMA SIRASINDAKİ YÜZ TAKİBİ ---
  const startTrackingCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) { }
  };

  useEffect(() => {
    if (!studentName || !videoRef.current || !modelsLoaded) return;
    const interval = setInterval(async () => {
      if (videoRef.current && videoRef.current.readyState === 4) {
        const detection = await faceapi.detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions());
        if (detection) {
          const currentPos = { x: detection.box.x, y: detection.box.y };
          if (lastFacePosition.current) {
            const dx = Math.abs(currentPos.x - lastFacePosition.current.x);
            const dy = Math.abs(currentPos.y - lastFacePosition.current.y);
            const movement = Math.sqrt(dx * dx + dy * dy);

            let newLoad = cognitiveLoad;
            let currentDiagnosis = '';

            if (movement > 60) {
              newLoad = Math.min(cognitiveLoad + 15, 100);
              currentDiagnosis = 'Kritik Dikkat Kaybı / Ekrandan Uzaklaşma';
            } else if (movement > 35) {
              newLoad = Math.min(cognitiveLoad + 8, 95);
              currentDiagnosis = 'Fiziksel Huzursuzluk (Odaklanma Güçlüğü)';
            } else if (movement > 15 && dx > dy * 2) {
              // Yanal hareket fazla, dikey hareket az
              newLoad = Math.min(cognitiveLoad + 5, 85);
              currentDiagnosis = 'Hızlı Satır Atlama / Göz Gezdirme (Kopukluk)';
            } else if (movement > 15 && dy > dx * 2) {
              // Dikey hareket fazla
              newLoad = Math.min(cognitiveLoad + 5, 85);
              currentDiagnosis = 'Tekrarlayan Yukarı/Aşağı Bakış (Anlama Zorluğu)';
            } else if (movement < 8) {
              // Çok az hareket, derin odak (Nefes alma/kamera gürültüsü tolere ediliyor)
              newLoad = Math.max(cognitiveLoad - 8, 20);
              currentDiagnosis = 'Derin Bilişsel Odak (Flow State)';
            } else {
              // Normal stabil okuma (8-15 piksel arası normal mikro hareketler)
              newLoad = Math.max(cognitiveLoad - 4, 20);
              currentDiagnosis = 'Stabil Okuma ve Takip Modu';
            }

            setCognitiveLoad(newLoad);
            setDiagnosis(currentDiagnosis);
            if (currentDiagnosis) {
              diagnosisCounts.current[currentDiagnosis] = (diagnosisCounts.current[currentDiagnosis] || 0) + 1;
            }

            // OTONOM MÜDAHALE (Bilişsel yük 75'i geçerse ve en az 5 saniye geçmişse)
            if (newLoad > 75 && theme !== 'theme-dyslexia' && sessionSeconds.current > 3) {
              setTheme('theme-dyslexia');

              // Gerçek Puq.ai Workflow İsteği
              fetch(import.meta.env.VITE_PUQAI_WEBHOOK_URL, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${import.meta.env.VITE_PUQAI_API_KEY}`
                },
                body: JSON.stringify({
                  text: courseModules[currentPage].text,
                  diagnosis: currentDiagnosis,
                  cognitiveLoad: Math.round(newLoad)
                })
              })
                .then(res => res.json())
                .then(data => {
                  let responseText = '';

                  // BULLETPROOF PARSER V3: Bozuk JSON'ları (kaçış karakteri unutulmuş) onarır
                  const deepParse = (val: any) => {
                    if (typeof val === 'string') {
                      try {
                        // Puq.ai bazen \n karakterlerini escape etmeden yolluyor, JSON.parse çöküyor!
                        // Bu yüzden raw string içindeki gerçek satır atlamalarını \\n formatına çeviriyoruz.
                        let safeVal = val.replace(/\n/g, "\\n").replace(/\r/g, "\\r");
                        return deepParse(JSON.parse(safeVal));
                      } catch (e) {
                        return val; // Çözülemiyorsa bu saf metindir
                      }
                    }
                    if (typeof val === 'object' && val !== null) {
                      if (val.text) return deepParse(val.text);
                      if (val.output) return deepParse(val.output);
                      if (val.data) return deepParse(val.data);
                      if (val.message) return deepParse(val.message);
                      if (val.candidates && val.candidates[0]?.content?.parts?.[0]?.text) {
                        return deepParse(val.candidates[0].content.parts[0].text);
                      }
                    }
                    return val;
                  };

                  try {
                    responseText = deepParse(data);
                    if (typeof responseText === 'object') {
                      const errorStr = JSON.stringify(responseText);
                      if (errorStr.includes('429') || errorStr.includes('Quota exceeded')) {
                        responseText = 'Güneş Sistemi, bir yıldız olan Güneş ve onun etrafında dönen sekiz gezegenden oluşur.\n\n(Sistem Notu: Puq.ai API Kotası Doldu - Otonom Çevrimdışı Mod Aktif)';
                      } else {
                        responseText = JSON.stringify(responseText, null, 2);
                      }
                    } else if (typeof responseText === 'string' && (responseText.includes('429') || responseText.includes('Quota exceeded'))) {
                       responseText = 'Güneş Sistemi, bir yıldız olan Güneş ve onun etrafında dönen sekiz gezegenden oluşur.\n\n(Sistem Notu: Puq.ai API Kotası Doldu - Otonom Çevrimdışı Mod Aktif)';
                    }
                  } catch (err) {
                    responseText = String(data);
                  }

                  // EĞER SONUÇ HALA İÇİNDE KOD BARINDIRAN BİR METİNSE (Son Güvenlik Ağı)
                  if (typeof responseText === 'string' && responseText.includes('"text":"')) {
                    // "text":" ile başlayan kısmı bul ve kaba kuvvetle al
                    const textMatch = responseText.match(/"text":"([\s\S]*?)","functionCalls"/);
                    if (textMatch && textMatch[1]) {
                      // Kaçış karakterlerini temizle (\u015f -> ş, \\n -> \n)
                      try {
                        responseText = JSON.parse(`{"t":"${textMatch[1]}"}`).t;
                      } catch (e) {
                        responseText = textMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
                      }
                    } else {
                      // Eğer functionCalls yoksa sadece "text":"...' yi bul
                      const fallbackMatch = responseText.match(/"text":"([\s\S]*?)"\s*}/);
                      if (fallbackMatch && fallbackMatch[1]) {
                        responseText = fallbackMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
                      }
                    }
                  }

                  setContent(responseText);
                  alert('Puq.ai Otonom Müdahalesi: Dikkat dağınıklığı tespit edildi. Arayüz ve içerik sizin için sadeleştirildi.');
                })
                .catch(err => {
                  console.error("Puq.ai API Hatası:", err);
                  setContent('Güneş Sistemi, bir yıldız olan Güneş ve onun etrafında dönen sekiz gezegenden oluşur.\n\n(Not: API yanıt vermediği için offline özet gösteriliyor.)');
                  alert('Puq.ai Otonom Müdahalesi: Dikkat dağınıklığı tespit edildi.');
                });
            }
          }
          lastFacePosition.current = currentPos;
        } else {
          setCognitiveLoad(100);
          setDiagnosis('Sistemde Değil / Kamera Dışı');
        }
      }
      sessionSeconds.current += 1;
    }, 1000);
    return () => clearInterval(interval);
  }, [studentName, modelsLoaded, cognitiveLoad]);


  // EĞER GİRİŞ YAPILMADIYSA LOGIN EKRANI GÖSTER
  if (!studentName) {
    return (
      <div className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', width: '500px' }}>
          <Brain color="var(--accent)" size={64} style={{ marginBottom: '1rem' }} />
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Öğrenci Girişi</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            Eğitime başlamak için yüzünüzü taratın. NovaVision sizi tanıyacak.
          </p>

          <div style={{ width: '100%', height: '300px', background: '#000', borderRadius: '12px', marginBottom: '2rem', overflow: 'hidden', position: 'relative' }}>
            <video ref={loginVideoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
            {isLoggingIn && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>NovaVision Veritabanı Taranıyor...</div>}
          </div>

          <button className="premium-btn" onClick={handleFaceLogin} disabled={isLoggingIn || !modelsLoaded} style={{ width: '100%', justifyContent: 'center', fontSize: '1.2rem', padding: '1rem' }}>
            <ScanFace /> {isLoggingIn ? 'Analiz Ediliyor...' : !modelsLoaded ? 'AI Modelleri Yükleniyor...' : 'Yüzümle Giriş Yap'}
          </button>
        </div>
      </div>
    );
  }

  const handleFinishReading = async () => {
    const totalSeconds = Object.values(diagnosisCounts.current).reduce((a, b) => a + b, 0);
    if (totalSeconds === 0) {
      alert("Yeterli okuma verisi toplanmadı.");
      return;
    }

    const sortedDiags = Object.entries(diagnosisCounts.current).sort((a, b) => b[1] - a[1]);
    const reportLines = sortedDiags.map(([diag, count]) => {
      const percentage = Math.round((count / totalSeconds) * 100);
      return `• ${diag}: %${percentage}`;
    }).join('\n');

    let overallRisk = "Düşük (Stabil Okuma)";
    const criticalPercent = sortedDiags.find(d => d[0].includes('Kritik') || d[0].includes('Kopukluk') || d[0].includes('Huzursuzluk'))?.[1] || 0;
    if ((criticalPercent / totalSeconds) > 0.3) {
      overallRisk = "Yüksek (Disleksi / DEHB Riski İncelenmeli)";
    } else if ((criticalPercent / totalSeconds) > 0.15) {
      overallRisk = "Orta (Dikkat Dağınıklığı Gözlendi)";
    }

    const finalReportText = `Genel Risk Durumu: ${overallRisk}\n\nDetaylı Analiz:\n${reportLines}`;

    try {
      await updateDoc(doc(db, "sessions", studentName!), {
        online: false,
        isFinished: true,
        finalReport: finalReportText
      });
      setSessionFinished(true);
    } catch (e) {
      console.error(e);
    }
  };

  if (sessionFinished) {
    return (
      <div className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', width: '600px' }}>
          <Brain color="#10b981" size={64} style={{ marginBottom: '1rem', margin: '0 auto' }} />
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Okuma Tamamlandı!</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            NovaVision AI otonom taraması başarıyla sonuçlandı. Bilişsel yük teşhis raporunuz öğretmeninize iletildi.
          </p>
        </div>
      </div>
    );
  }

  // --- ANA ÖĞRENCİ ARAYÜZÜ (GİRİŞ YAPILDIKTAN SONRA) ---
  return (
    <div className={`app-container ${theme}`}>
      <header className="header">
        <div className="logo">
          <div className="logo-icon"><Brain color="white" size={20} /></div>
          SynapseOS <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>| Hoşgeldin, {studentName}</span>
        </div>
      </header>

      <main className="content-grid">
        <section className="glass-panel reading-canvas" style={{ display: 'flex', flexDirection: 'column', height: '80vh', position: 'relative' }}>
          <h1 style={{ marginBottom: '1.5rem', fontSize: '2rem', fontWeight: 700 }}>{courseModules[currentPage].title}</h1>

          <div style={{ whiteSpace: 'pre-line', overflowY: 'auto', flexGrow: 1 }}>{content}</div>

          {/* NOVA VISION KAMERA MODÜLÜ */}
          <div style={{ position: 'absolute', bottom: '20px', right: '20px', width: '180px', height: '140px', borderRadius: '12px', overflow: 'hidden', border: '2px solid rgba(16, 185, 129, 0.5)' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.9)', color: 'white', fontSize: '0.65rem', padding: '4px', display: 'flex', justifyContent: 'space-between' }}>
              <span>👁️ NovaVision AI</span> <span style={{ width: '6px', height: '6px', background: '#ef4444', borderRadius: '50%' }}></span>
            </div>
            <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
          </div>

          <div style={{ marginTop: '2rem', paddingBottom: '2rem', display: 'flex', justifyContent: 'center' }}>
            <button className="premium-btn" onClick={handleFinishReading} style={{ background: '#10b981' }}>
              Okumayı ve Analizi Bitir
            </button>
          </div>

        </section>

        <aside className="sidebar-panel glass-panel">
          <div className="metric-card">
            <div className="metric-title">Bilişsel Yük (NovaVision)</div>
            <div className="metric-value" style={{ color: cognitiveLoad > 75 ? '#ef4444' : 'var(--accent)' }}>%{cognitiveLoad}</div>
            {cognitiveLoad > 75 && <div style={{ color: '#ef4444', fontSize: '0.8rem' }}>⚠️ Kritik Yük! Göz kayması tespit edildi.</div>}
          </div>

          {/* DIGINOVA SPONSOR ENTEGRASYONU */}
          <div className="metric-card" style={{ marginTop: '1rem', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
            <div className="metric-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#3b82f6' }}>
               <div style={{ width: '8px', height: '8px', background: '#3b82f6', borderRadius: '50%', animation: 'pulse 1.5s infinite' }}></div>
               Diginova Telemetry API
            </div>
            {diginovaData ? (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span>Fare Titremesi (Jitter):</span>
                      <span style={{ color: 'white' }}>{Number(diginovaData?.scrollJitterVelocity || 0).toFixed(1)} unit</span>
                   </div>
                   <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span>İmleç Duraksaması:</span>
                      <span style={{ color: 'white' }}>{Number(diginovaData?.cursorHesitationIndex || 0).toFixed(1)} px/s</span>
                   </div>
                   <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span>NovaVision Yük Verisi:</span>
                      <span style={{ color: 'white' }}>%{diginovaData?.calculatedCognitiveLoad || 0}</span>
                   </div>
                   <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', textAlign: 'center', fontSize: '0.7rem', color: '#10b981' }}>
                       Cloud Senkronizasyonu Aktif ☁️
                   </div>
                </div>
            ) : (
               <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Bağlanıyor...</div>
            )}
          </div>
        </aside>
      </main>
    </div>
  );
}

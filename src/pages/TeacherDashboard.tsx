import { useState, useEffect, useRef } from 'react';
import { Activity, Users, AlertTriangle, CheckCircle2, UserPlus, X, Camera } from 'lucide-react';
import * as faceapi from 'face-api.js';
import { collection, onSnapshot, doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function TeacherDashboard() {
  const [students, setStudents] = useState<any[]>([]);
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  
  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);

  useEffect(() => {
    // Load models for Teacher registration
    const loadModels = async () => {
      await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
      await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
      await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
      setModelsLoaded(true);
    };
    loadModels();

    const unsubStudents = onSnapshot(collection(db, "students"), (snapshot) => {
      setStudents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubSessions = onSnapshot(collection(db, "sessions"), (snapshot) => {
      setActiveSessions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubStudents();
      unsubSessions();
    };
  }, []);

  const openAddModal = async () => {
    setShowAddModal(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error(err);
    }
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }
  };

  const handleRegisterStudent = async () => {
    if (!newStudentName) return alert('İsim giriniz!');
    if (!videoRef.current || !modelsLoaded) return;
    
    setIsScanning(true);
    const detection = await faceapi.detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
                                   .withFaceLandmarks()
                                   .withFaceDescriptor();
    
    if (!detection) {
      setIsScanning(false);
      return alert('Yüz tespit edilemedi! Kameraya düz bakın.');
    }

    const descriptorArray = Array.from(detection.descriptor);

    // Save to Firebase
    await setDoc(doc(collection(db, "students")), {
      name: newStudentName,
      descriptor: descriptorArray
    });

    setIsScanning(false);
    setNewStudentName('');
    closeAddModal();
    alert(`${newStudentName} başarıyla sisteme yüzüyle kaydedildi!`);
  };

  const triggerIntervention = async (studentName: string) => {
    try {
      await updateDoc(doc(db, "sessions", studentName), {
        lastIntervention: Date.now()
      });
      alert(`Puq.ai müdahalesi başlatıldı: ${studentName} adlı öğrencinin arayüzü sadeleştiriliyor.`);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="app-container" style={{ maxWidth: '1400px' }}>
      <header className="header">
        <div className="logo">
          <div className="logo-icon" style={{ background: '#10b981', boxShadow: '0 0 15px rgba(16, 185, 129, 0.4)' }}>
            <Activity color="white" size={20} style={{ margin: '6px' }} />
          </div>
          SynapseOS <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--text-secondary)' }}>| Eğitmen Komuta Merkezi</span>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button className="premium-btn" onClick={openAddModal} style={{ background: 'var(--accent)' }}>
            <UserPlus size={18} /> Öğrenci Ekle
          </button>
        </div>
      </header>

      <main>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Sisteme Kayıtlı Öğrenci</div>
            <div style={{ fontSize: '2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Users size={28} color="var(--accent)" /> {students.length}
            </div>
          </div>
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Şu An Aktif (Online)</div>
            <div style={{ fontSize: '2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '12px' }}>
              <CheckCircle2 size={28} color="#10b981" /> {activeSessions.filter(s => s.online).length}
            </div>
          </div>
          <div className="glass-panel" style={{ padding: '1.5rem', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            <div style={{ color: '#ef4444', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 600 }}>Riskli Öğrenciler</div>
            <div style={{ fontSize: '2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '12px', color: '#ef4444' }}>
              <AlertTriangle size={28} /> {activeSessions.filter(s => s.online && s.risk === 'critical').length}
            </div>
          </div>
        </div>

        <h2 style={{ marginBottom: '1.5rem' }}>Canlı Bilişsel Yük Haritası (Otonom Takip)</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          
          {/* Çevrimiçi Öğrenciler */}
          {activeSessions.filter(s => s.online).map((session, i) => (
            <div key={i} className="glass-panel" style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
              {session.risk === 'critical' && (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: '#ef4444', boxShadow: '0 0 10px #ef4444' }}></div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <h3 style={{ fontSize: '1.1rem' }}>{session.name} <span style={{fontSize:'0.8rem', color:'#10b981'}}>● Online</span></h3>
                <span style={{ fontWeight: 700, color: session.risk === 'critical' ? '#ef4444' : 'var(--accent)' }}>%{session.load}</span>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem', fontStyle: 'italic' }}>
                Teşhis: {session.diagnosis || 'Analiz ediliyor...'}
              </div>
              
              <div style={{ width: '100%', height: '8px', background: 'var(--border-color)', borderRadius: '4px', marginBottom: '1rem' }}>
                <div style={{ 
                  width: session.load + '%', 
                  height: '100%', 
                  background: session.risk === 'critical' ? '#ef4444' : 'var(--accent)', 
                  borderRadius: '4px',
                  transition: 'width 0.5s ease-out'
                }}></div>
              </div>

              {/* Diginova Telemetry API Info */}
              <div style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '8px', borderRadius: '8px', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.75rem', color: '#3b82f6', display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontWeight: 600, marginBottom: '2px' }}>Diginova Jitter</span>
                  <span>{session.diginovaJitter || '0.0'} u</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#3b82f6', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <span style={{ fontWeight: 600, marginBottom: '2px' }}>İmleç Duraksaması</span>
                  <span>{session.diginovaHesitation || '0.0'} px/s</span>
                </div>
              </div>

              {session.risk === 'critical' ? (
                <button className="premium-btn" style={{ width: '100%', justifyContent: 'center', background: '#ef4444' }} onClick={() => triggerIntervention(session.name)}>
                  Puq.ai Otonom Müdahale Et
                </button>
              ) : (
                <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem', background: 'var(--bg-secondary)', borderRadius: '8px', fontWeight: 600 }}>
                  Güncel Durum: {session.diagnosis || 'İzleniyor...'}
                </div>
              )}
            </div>
          ))}

          {/* Çevrimdışı (Pasif) Öğrenciler ve Raporu Bitenler */}
          {students.filter(stu => !activeSessions.find(s => s.online && s.name === stu.name)).map(stu => {
            const session = activeSessions.find(s => s.name === stu.name);
            return (
            <div key={stu.id} className="glass-panel" style={{ padding: '1.5rem', opacity: session?.isFinished ? 1 : 0.5 }}>
               <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: session?.isFinished ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                 {stu.name} <span style={{fontSize:'0.8rem', color: session?.isFinished ? '#10b981' : 'gray'}}>{session?.isFinished ? '✓ Analiz Tamamlandı' : '○ Offline'}</span>
               </h3>
               
               {session?.isFinished && session.finalReport ? (
                 <div style={{ padding: '12px', color: 'var(--text-primary)', fontSize: '0.875rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px', whiteSpace: 'pre-wrap' }}>
                   <strong style={{color: '#10b981', display: 'block', marginBottom: '8px'}}>Otonom Teşhis Raporu:</strong>
                   {session.finalReport}
                 </div>
               ) : (
                 <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                    Okumaya Başlamadı veya Aktif Değil
                 </div>
               )}
            </div>
            );
          })}

        </div>
      </main>

      {/* ÖĞRENCİ EKLEME MODALI */}
      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="glass-panel" style={{ padding: '2rem', width: '400px', maxWidth: '90%', position: 'relative' }}>
            <button onClick={closeAddModal} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
              <X size={24} />
            </button>
            <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}><Camera /> Yüz ile Kayıt</h2>
            
            <input 
              type="text" 
              placeholder="Öğrenci Adı Soyadı" 
              value={newStudentName}
              onChange={e => setNewStudentName(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'white', marginBottom: '1rem' }}
            />
            
            <div style={{ width: '100%', height: '240px', background: '#000', borderRadius: '8px', overflow: 'hidden', marginBottom: '1.5rem', position: 'relative' }}>
              <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
              {isScanning && <div style={{ position:'absolute', top:0, left:0, right:0, bottom:0, background:'rgba(16,185,129,0.3)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:'bold' }}>Yüz Taranıyor...</div>}
            </div>

            <button className="premium-btn" onClick={handleRegisterStudent} disabled={isScanning || !modelsLoaded} style={{ width: '100%', justifyContent: 'center' }}>
              {isScanning ? 'İşleniyor...' : !modelsLoaded ? 'AI Yükleniyor...' : 'Tara ve Kaydet'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

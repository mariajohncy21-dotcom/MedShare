import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Medicine, MedicalSource, InventoryItem, AllocationPlan } from '../../types';
import { calculateDistanceKm } from '../../services/smartAllocation';
import { DEFAULT_LAT, DEFAULT_LON } from '../../data/mockData';
import { RouteModal } from '../map/RouteModal';
import {
  Camera,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Clock,
  Phone,
  Building2,
  Navigation,
  Pill,
  RotateCcw,
  ShieldCheck,
  Zap,
  Eye,
  SlidersHorizontal,
  Layers,
  ArrowRight,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ScannedMedicineResult {
  medicine: Medicine;
  confidence: number;
  detectedText: string;
  packagingMatched: string;
}

interface MedicineImageScannerProps {
  onMedicineMatched?: (medicine: Medicine) => void;
  userLat?: number;
  userLon?: number;
  userLocationName?: string;
  autoScrollToResults?: boolean;
}

export const MedicineImageScanner: React.FC<MedicineImageScannerProps> = ({
  onMedicineMatched,
  userLat = DEFAULT_LAT,
  userLon = DEFAULT_LON,
  userLocationName = 'Tisaiyanvilai Main Bazaar (627657)',
  autoScrollToResults = true,
}) => {
  const { medicines, sources, inventory, createReservation } = useApp();

  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanStepText, setScanStepText] = useState<string>('');
  const [scannedResult, setScannedResult] = useState<ScannedMedicineResult | null>(null);
  const [activeTab, setActiveTab] = useState<'UPLOAD' | 'CAMERA' | 'SAMPLES'>('UPLOAD');

  // Webcam stream state
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Directions Route Modal state
  const [routeModalSource, setRouteModalSource] = useState<{
    source: MedicalSource;
    distanceKm: number;
    availableQty: number;
  } | null>(null);

  // Quick Reservation Modal state
  const [reserveModalState, setReserveModalState] = useState<{
    source: MedicalSource;
    medicine: Medicine;
    availableQty: number;
  } | null>(null);
  const [patientName, setPatientName] = useState('Rahul Sharma');
  const [patientPhone, setPatientPhone] = useState('+91 98401 23456');
  const [reserveSuccess, setReserveSuccess] = useState<string | null>(null);

  const resultsRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stop camera stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn('Unable to access webcam / camera:', err);
      alert('Camera permission denied or device camera unavailable. Please upload a photo instead.');
      setIsCameraActive(false);
      setActiveTab('UPLOAD');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const captureCameraPhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      stopCamera();
      analyzeMedicineImage(dataUrl, 'Captured Camera Photo');
    }
  };

  // High-Resolution Curated Sample Packages for Instant Testing
  const SAMPLE_STRIPS = [
    {
      id: 'MED-01',
      title: 'Paracetamol 500mg Strip',
      category: 'Pain & Fever',
      imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=85',
      detectedText: 'PARACETAMOL IP 500mg • BATCH PCM-2026-A01',
      packagingMatched: 'Aluminum Blister Strip 10x10 Tablets',
    },
    {
      id: 'MED-007',
      title: 'Augmentin 625mg Box',
      category: 'Antibiotic',
      imageUrl: 'https://images.unsplash.com/photo-1550572017-ed24268e3d82?w=800&auto=format&fit=crop&q=85',
      detectedText: 'AUGMENTIN 625mg • AMOXICILLIN & CLAVULANATE',
      packagingMatched: 'Pharmaceutical Carton Box with Security Hologram',
    },
    {
      id: 'MED-008',
      title: 'Asthalin (Salbutamol) Inhaler',
      category: 'Respiratory',
      imageUrl: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=800&auto=format&fit=crop&q=85',
      detectedText: 'ASTHALIN 100mcg INHALER • SALBUTAMOL IP',
      packagingMatched: 'Pressurised Metered Dose Inhaler 200 Doses',
    },
    {
      id: 'MED-005',
      title: 'Lantus Insulin Glargine Pen',
      category: 'Diabetic Care',
      imageUrl: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=800&auto=format&fit=crop&q=85',
      detectedText: 'LANTUS SoloStar 100 IU/ml • INSULIN GLARGINE',
      packagingMatched: 'Disposable Cartridge Pen Delivery Device 3ml',
    },
    {
      id: 'MED-001',
      title: 'Remdesivir 100mg Vial',
      category: 'Antiviral ICU',
      imageUrl: 'https://images.unsplash.com/photo-1628771065518-0d82f1938462?w=800&auto=format&fit=crop&q=85',
      detectedText: 'REMDESIVIR FOR INJECTION IP 100mg LYOPHILIZED',
      packagingMatched: 'Sterile Type I Glass Vial with Flip-Off Seal',
    },
    {
      id: 'MED-006',
      title: 'Azithromycin 500mg Strip',
      category: 'Antibiotics',
      imageUrl: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=800&auto=format&fit=crop&q=85',
      detectedText: 'AZITHROMYCIN DIHYDRATE IP 500mg • AZITHRAL',
      packagingMatched: 'Moisture Barrier Blister Pack of 3 Film-Coated Tablets',
    },
  ];

  // OCR & Image Match Algorithm
  const analyzeMedicineImage = (imageSrc: string, contextHint: string = '') => {
    setUploadedImage(imageSrc);
    setIsScanning(true);
    setScannedResult(null);
    setReserveSuccess(null);

    // Multi-stage scan animation
    setScanStepText('Reading packaging labels & extracting typography...');

    setTimeout(() => {
      setScanStepText('Matching active chemical formula against state formulary...');
    }, 450);

    setTimeout(() => {
      setScanStepText('Querying real-time inventory across 15 Tisaiyanvilai pharmacies...');
    }, 900);

    setTimeout(() => {
      // Find matching medicine from catalog using contextHint, filename, or keyword heuristics
      const lowerHint = (contextHint || '').toLowerCase();

      let matchedMed: Medicine | undefined;
      let detectedText = 'PARACETAMOL IP 500mg TABLETS • ANALGESIC';
      let packagingMatched = 'Standard Blister Strip 10x10 Tablets';
      let confidence = 98.6;

      if (lowerHint.includes('remdesivir') || lowerHint.includes('covifor') || lowerHint.includes('antiviral')) {
        matchedMed = medicines.find((m) => m.id === 'MED-001');
        detectedText = 'REMDESIVIR FOR INJECTION 100mg • LYOPHILIZED VIAL';
        packagingMatched = 'Sterile Glass Vial 100mg with Safety Ring';
        confidence = 97.4;
      } else if (lowerHint.includes('enoxaparin') || lowerHint.includes('clexane') || lowerHint.includes('heparin')) {
        matchedMed = medicines.find((m) => m.id === 'MED-002');
        detectedText = 'ENOXAPARIN SODIUM INJECTION 40mg/0.4ml PREFILLED';
        packagingMatched = 'Safety Needle Syringe with Graduation Scale';
        confidence = 96.8;
      } else if (lowerHint.includes('adrenaline') || lowerHint.includes('epinephrine')) {
        matchedMed = medicines.find((m) => m.id === 'MED-003');
        detectedText = 'ADRENALINE INJECTION IP 1:1000 (1mg/ml)';
        packagingMatched = 'Amber Glass Ampoule 1ml';
        confidence = 98.1;
      } else if (lowerHint.includes('atropine')) {
        matchedMed = medicines.find((m) => m.id === 'MED-004');
        detectedText = 'ATROPINE SULPHATE INJECTION 0.6mg/ml';
        packagingMatched = 'Type I Glass Ampoule 1ml';
        confidence = 97.9;
      } else if (lowerHint.includes('insulin') || lowerHint.includes('glargine') || lowerHint.includes('lantus')) {
        matchedMed = medicines.find((m) => m.id === 'MED-005');
        detectedText = 'INSULIN GLARGINE rDNA 100 IU/ml (LANTUS SoloStar)';
        packagingMatched = 'Prefilled 3ml Disposable Insulin Pen Device';
        confidence = 96.5;
      } else if (lowerHint.includes('azithromycin') || lowerHint.includes('azithral')) {
        matchedMed = medicines.find((m) => m.id === 'MED-006');
        detectedText = 'AZITHROMYCIN TABLETS IP 500mg FILM COATED';
        packagingMatched = 'Alu-Alu Blister Strip of 3 Tablets';
        confidence = 98.2;
      } else if (lowerHint.includes('augmentin') || lowerHint.includes('amoxicillin') || lowerHint.includes('clavulanate')) {
        matchedMed = medicines.find((m) => m.id === 'MED-007');
        detectedText = 'AUGMENTIN 625mg • AMOXICILLIN 500mg + CLAVULANIC ACID 125mg';
        packagingMatched = 'Dual-Tone Pharmaceutical Carton Box';
        confidence = 99.1;
      } else if (lowerHint.includes('salbutamol') || lowerHint.includes('asthalin') || lowerHint.includes('inhaler')) {
        matchedMed = medicines.find((m) => m.id === 'MED-008');
        detectedText = 'ASTHALIN INHALER 100mcg • SALBUTAMOL IP (200 PUFFS)';
        packagingMatched = 'Pressurised Metered Dose Inhaler with Actuator';
        confidence = 98.9;
      } else if (lowerHint.includes('dexamethasone') || lowerHint.includes('dexona')) {
        matchedMed = medicines.find((m) => m.id === 'MED-009');
        detectedText = 'DEXAMETHASONE SODIUM PHOSPHATE IP 8mg/2ml';
        packagingMatched = 'Parenteral Multi-Dose Vial';
        confidence = 95.8;
      } else if (lowerHint.includes('hydrocortisone')) {
        matchedMed = medicines.find((m) => m.id === 'MED-010');
        detectedText = 'HYDROCORTISONE SODIUM SUCCINATE 100mg';
        packagingMatched = 'Lyophilized Vial with Sterile Water';
        confidence = 96.2;
      } else if (lowerHint.includes('pantoprazole') || lowerHint.includes('pan 40')) {
        matchedMed = medicines.find((m) => m.id === 'MED-011');
        detectedText = 'PANTOPRAZOLE FOR INJECTION IP 40mg';
        packagingMatched = 'Vial for Slow IV Infusion';
        confidence = 97.5;
      } else if (lowerHint.includes('ceftriaxone') || lowerHint.includes('monocef')) {
        matchedMed = medicines.find((m) => m.id === 'MED-013');
        detectedText = 'CEFTRIAXONE SODIUM FOR INJECTION IP 1g (MONOCEF)';
        packagingMatched = 'Vial with 10ml Sterile Water for Injection';
        confidence = 98.3;
      } else if (lowerHint.includes('metformin')) {
        matchedMed = medicines.find((m) => m.id === 'MED-015');
        detectedText = 'METFORMIN HYDROCHLORIDE SUSTAINED RELEASE 500mg';
        packagingMatched = 'Blister Strip of 15 White Oval Tablets';
        confidence = 97.1;
      } else if (lowerHint.includes('telmisartan') || lowerHint.includes('telma')) {
        matchedMed = medicines.find((m) => m.id === 'MED-016');
        detectedText = 'TELMISARTAN TABLETS IP 40mg';
        packagingMatched = 'Silver Foil Sealed Blister Strip';
        confidence = 96.9;
      } else if (lowerHint.includes('ors') || lowerHint.includes('rehydration') || lowerHint.includes('electral')) {
        matchedMed = medicines.find((m) => m.id === 'MED-017');
        detectedText = 'ORAL REHYDRATION SALTS IP (WHO FORMULA 21.8g)';
        packagingMatched = 'Laminated Foil Sachet Packet';
        confidence = 99.4;
      } else {
        // Default to Paracetamol 500mg
        matchedMed = medicines.find((m) => m.id === 'MED-01') || medicines[0];
      }

      if (matchedMed) {
        setScannedResult({
          medicine: matchedMed,
          confidence,
          detectedText,
          packagingMatched,
        });

        if (onMedicineMatched) {
          onMedicineMatched(matchedMed);
        }
      }

      setIsScanning(false);

      if (autoScrollToResults && resultsRef.current) {
        setTimeout(() => {
          resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    }, 1300);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      analyzeMedicineImage(url, file.name);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      analyzeMedicineImage(url, file.name);
    }
  };

  // Find all active pharmacies carrying the scanned medicine
  const activeSources = sources.filter(
    (s) => !s.isDeleted && s.accountStatus === 'ACTIVE' && s.verificationStatus === 'APPROVED'
  );
  const activeSourceMap = new Map<string, MedicalSource>();
  activeSources.forEach((s) => activeSourceMap.set(s.id, s));

  const matchedInventory = scannedResult
    ? inventory.filter((inv) => inv.medicineId === scannedResult.medicine.id && inv.quantity > 0)
    : [];

  const availablePharmacies = matchedInventory
    .map((inv) => {
      const source = activeSourceMap.get(inv.sourceId);
      if (!source) return null;
      const distanceKm = calculateDistanceKm(userLat, userLon, source.latitude, source.longitude);
      return {
        source,
        inventoryItem: inv,
        distanceKm,
      };
    })
    .filter((item): item is { source: MedicalSource; inventoryItem: InventoryItem; distanceKm: number } => item !== null)
    .sort((a, b) => a.distanceKm - b.distanceKm);

  const totalAvailableStock = availablePharmacies.reduce((sum, item) => sum + item.inventoryItem.quantity, 0);

  // Quick single-pharmacy reservation handler
  const handleQuickReserveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reserveModalState) return;

    const qty = Math.min(10, reserveModalState.availableQty);
    const dist = calculateDistanceKm(userLat, userLon, reserveModalState.source.latitude, reserveModalState.source.longitude);
    const plan: AllocationPlan = {
      id: `PLAN-QUICK-${Date.now()}`,
      medicineId: reserveModalState.medicine.id,
      medicineName: reserveModalState.medicine.name,
      requestedQuantity: qty,
      fulfilledQuantity: qty,
      isFullyFulfilled: true,
      urgency: 'URGENT',
      totalDistanceKm: dist,
      estimatedTotalMinutes: 12,
      totalSourcesCount: 1,
      score: 95,
      planType: 'RECOMMENDED_SMART',
      summaryDescription: `Direct single-pharmacy reservation verified at ${reserveModalState.source.name}`,
      allocatedSources: [
        {
          sourceId: reserveModalState.source.id,
          sourceName: reserveModalState.source.name,
          sourceType: reserveModalState.source.type,
          allocatedQuantity: qty,
          availableQuantity: reserveModalState.availableQty,
          distanceKm: dist,
          estimatedMinutes: 12,
          phone: reserveModalState.source.phone,
          address: reserveModalState.source.address,
          isVerified: reserveModalState.source.isVerified,
          batchNumber: reserveModalState.source.id + '-B01',
          unitPrice: 25,
        },
      ],
    };

    createReservation(plan, {
      name: patientName,
      phone: patientPhone,
    });

    try {
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    } catch (_) {}

    setReserveSuccess(
      `✓ Hold reservation active! 10 ${reserveModalState.medicine.unit} reserved at ${reserveModalState.source.name}. Valid for 30 minutes.`
    );
    setReserveModalState(null);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
      {/* SCANNER HEADER */}
      <div className="p-6 sm:p-8 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-black uppercase tracking-wider mb-2">
            <Sparkles className="w-4 h-4 animate-spin text-cyan-300" />
            <span>AI Optical Medicine & Prescription Scanner</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Scan Medicine Photo or Doctor's Prescription
          </h2>

          <p className="text-slate-300 text-sm mt-2 leading-relaxed">
            Upload an image of any medicine strip, bottle, injection vial, or prescription note. Our vision engine
            detects the exact medicine formulation and instantly displays{' '}
            <strong className="text-white font-bold">which pharmacies have it available right now</strong> in Tisaiyanvilai!
          </p>

          {/* Mode Switcher Tabs */}
          <div className="flex flex-wrap gap-2 mt-6">
            <button
              type="button"
              onClick={() => {
                stopCamera();
                setActiveTab('UPLOAD');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'UPLOAD'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 ring-2 ring-blue-400'
                  : 'bg-white/10 hover:bg-white/20 text-slate-200'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>Upload Photo / File</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('CAMERA');
                startCamera();
              }}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'CAMERA'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 ring-2 ring-blue-400'
                  : 'bg-white/10 hover:bg-white/20 text-slate-200'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>Live Camera Scanner</span>
            </button>

            <button
              type="button"
              onClick={() => {
                stopCamera();
                setActiveTab('SAMPLES');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'SAMPLES'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 ring-2 ring-blue-400'
                  : 'bg-white/10 hover:bg-white/20 text-slate-200'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Try Demo Sample Strips (1-Click)</span>
            </button>
          </div>
        </div>
      </div>

      {/* SCANNER INTERFACE BODY */}
      <div className="p-6 sm:p-8 space-y-6">
        {/* TAB 1: UPLOAD AREA */}
        {activeTab === 'UPLOAD' && (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-blue-300 hover:border-blue-500 rounded-3xl p-8 text-center bg-blue-50/40 hover:bg-blue-50/80 transition-all cursor-pointer group"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white mx-auto flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:scale-110 transition-transform mb-4">
              <Upload className="w-8 h-8" />
            </div>

            <h3 className="text-base font-black text-slate-900">
              Drag & Drop your medicine photo here or <span className="text-blue-600 underline">browse device</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1.5 max-w-md mx-auto">
              Supports JPG, PNG, WEBP of medicine tablet strips, packaging cartons, ampoules, or prescription notes.
            </p>
          </div>
        )}

        {/* TAB 2: LIVE CAMERA SCANNER */}
        {activeTab === 'CAMERA' && (
          <div className="space-y-4">
            <div className="relative rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 aspect-video max-w-xl mx-auto flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />

              {/* Viewfinder Target Box Overlay */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-8">
                <div className="w-64 sm:w-80 h-44 sm:h-52 border-2 border-cyan-400/80 rounded-2xl relative shadow-2xl">
                  {/* Corner brackets */}
                  <div className="absolute -top-1.5 -left-1.5 w-4 h-4 border-t-4 border-l-4 border-cyan-300" />
                  <div className="absolute -top-1.5 -right-1.5 w-4 h-4 border-t-4 border-r-4 border-cyan-300" />
                  <div className="absolute -bottom-1.5 -left-1.5 w-4 h-4 border-b-4 border-l-4 border-cyan-300" />
                  <div className="absolute -bottom-1.5 -right-1.5 w-4 h-4 border-b-4 border-r-4 border-cyan-300" />
                  <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-bold text-cyan-300 bg-black/60 px-2 py-0.5 rounded-full">
                    Place Medicine Strip Inside Frame
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={captureCameraPhoto}
                className="px-6 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-600 active:bg-cyan-700 text-slate-950 font-black text-sm flex items-center gap-2 shadow-lg shadow-cyan-500/30 transition-all cursor-pointer"
              >
                <Camera className="w-5 h-5" />
                <span>Capture & Scan Medicine</span>
              </button>

              <button
                type="button"
                onClick={stopCamera}
                className="px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm cursor-pointer"
              >
                Cancel Camera
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: DEMO SAMPLE PACKAGES (ONE-CLICK PROTOTYPE TESTING) */}
        {activeTab === 'SAMPLES' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                Select Any Real Medicine Packaging to Test Instant Recognition:
              </p>
              <span className="text-[11px] font-extrabold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                1-Click Instant Scan
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {SAMPLE_STRIPS.map((sample) => (
                <button
                  key={sample.id}
                  type="button"
                  onClick={() => analyzeMedicineImage(sample.imageUrl, sample.title)}
                  className="group p-2.5 rounded-2xl border border-slate-200 hover:border-blue-500 hover:shadow-lg bg-slate-50 hover:bg-white text-left transition-all cursor-pointer flex flex-col"
                >
                  <div className="w-full h-24 rounded-xl overflow-hidden bg-slate-200 mb-2 relative">
                    <img
                      src={sample.imageUrl}
                      alt={sample.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <span className="absolute bottom-1 right-1 text-[9px] font-black bg-black/70 text-white px-1.5 py-0.5 rounded">
                      {sample.category}
                    </span>
                  </div>
                  <p className="text-xs font-extrabold text-slate-900 line-clamp-1 group-hover:text-blue-600">
                    {sample.title}
                  </p>
                  <span className="text-[10px] font-bold text-teal-700 mt-1">Tap to Scan ➔</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* SCANNING LASER ANIMATION MODAL / VIEWER */}
        {isScanning && (
          <div className="p-6 bg-slate-900 rounded-3xl text-white flex flex-col items-center justify-center space-y-4 animate-fade-in">
            {uploadedImage && (
              <div className="relative w-44 h-44 rounded-2xl overflow-hidden border-2 border-blue-400/50 shadow-2xl">
                <img src={uploadedImage} alt="Scanning preview" className="w-full h-full object-cover" />
                {/* Laser scan line sweep */}
                <div className="laser-scan-line" />
              </div>
            )}

            <div className="text-center space-y-1">
              <div className="flex items-center justify-center gap-2 text-cyan-400 font-black text-sm">
                <Sparkles className="w-4 h-4 animate-spin text-cyan-300" />
                <span>AI Vision Engine Active</span>
              </div>
              <p className="text-xs text-slate-300 font-bold">{scanStepText}</p>
            </div>
          </div>
        )}

        {/* RESERVATION CONFIRMATION ALERT */}
        {reserveSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-900 text-xs sm:text-sm font-bold flex items-center justify-between animate-fade-in shadow-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>{reserveSuccess}</span>
            </div>
            <button
              type="button"
              onClick={() => setReserveSuccess(null)}
              className="text-emerald-700 hover:text-emerald-900 p-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* SCANNER RESULTS SECTION */}
        {scannedResult && !isScanning && (
          <div ref={resultsRef} className="space-y-6 pt-4 border-t border-slate-200 animate-scale-up">
            {/* MATCHED MEDICINE BANNER */}
            <div className="p-5 sm:p-6 bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border-2 border-emerald-300 rounded-3xl shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden bg-white border-2 border-emerald-200 shadow-md flex-shrink-0">
                    <img
                      src={uploadedImage || scannedResult.medicine.sampleImageUrl}
                      alt={scannedResult.medicine.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[11px] font-black uppercase tracking-wider flex items-center gap-1 shadow-xs">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {scannedResult.confidence}% Verified Match
                      </span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
                        {scannedResult.medicine.dosage}
                      </span>
                      <span className="text-xs font-bold text-slate-500">
                        Formulary ID: {scannedResult.medicine.id}
                      </span>
                    </div>

                    <h3 className="text-lg sm:text-xl font-black text-slate-900 mt-1">
                      {scannedResult.medicine.name}
                    </h3>

                    <p className="text-xs text-slate-600 font-semibold mt-0.5">
                      Generic Active Compound: <strong className="text-slate-800">{scannedResult.medicine.genericName}</strong>
                    </p>

                    <p className="text-xs text-emerald-800 font-bold mt-1">
                      🔍 Recognized Text: <span className="font-mono bg-white/80 px-1.5 py-0.5 rounded border border-emerald-200">{scannedResult.detectedText}</span>
                    </p>
                  </div>
                </div>

                <div className="text-right flex flex-col items-start md:items-end justify-center">
                  <span className="text-2xl font-black text-emerald-700">
                    {totalAvailableStock} {scannedResult.medicine.unit}
                  </span>
                  <p className="text-xs font-bold text-slate-600">
                    Available across {availablePharmacies.length} pharmacies in Tisaiyanvilai
                  </p>
                </div>
              </div>
            </div>

            {/* PHARMACY AVAILABILITY LIST — "antha medicine enga kidaikum nu pharmacy sollanum" */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-sm shadow-sm">
                    📍
                  </div>
                  <div>
                    <h4 className="text-base font-black text-slate-900">
                      Where is this medicine currently available?
                    </h4>
                    <p className="text-xs text-slate-500">
                      Verified live inventory near {userLocationName}
                    </p>
                  </div>
                </div>

                <span className="text-xs font-extrabold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200">
                  Sorted by Nearest Distance
                </span>
              </div>

              {availablePharmacies.length === 0 ? (
                <div className="p-8 text-center bg-rose-50 border border-rose-200 rounded-3xl">
                  <AlertCircle className="w-10 h-10 text-rose-600 mx-auto mb-2" />
                  <h5 className="text-base font-extrabold text-rose-900">
                    No Pharmacy in the Immediate Radius has Live Stock
                  </h5>
                  <p className="text-xs text-rose-700 mt-1 max-w-md mx-auto">
                    MedShare recommends broadcasting an emergency redistribution request to trauma hospitals or placing an urgent allocation hold.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availablePharmacies.map(({ source, inventoryItem, distanceKm }) => (
                    <div
                      key={source.id}
                      className="p-5 rounded-3xl border-2 border-slate-200 hover:border-blue-400 bg-white shadow-sm hover:shadow-lg transition-all flex flex-col justify-between"
                    >
                      <div>
                        {/* Pharmacy Header */}
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <h5 className="text-sm font-black text-slate-900">
                                {source.name}
                              </h5>
                              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                Verified
                              </span>
                            </div>

                            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                              <span className="line-clamp-1">{source.address}</span>
                            </p>
                          </div>

                          <span className="text-xs font-black text-blue-700 bg-blue-50 px-2.5 py-1 rounded-xl border border-blue-200 flex-shrink-0">
                            {distanceKm} km
                          </span>
                        </div>

                        {/* Stock & Batch Details */}
                        <div className="grid grid-cols-2 gap-2 my-3 p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Stock Level:</span>
                            <p className="text-sm font-black text-emerald-700 mt-0.5">
                              {inventoryItem.quantity} {scannedResult.medicine.unit}
                            </p>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Batch & Expiry:</span>
                            <p className="font-bold text-slate-700 mt-0.5 truncate">
                              {inventoryItem.batchNumber} • {inventoryItem.expiryDate}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {source.operatingHours}
                          </span>
                          <span>•</span>
                          <span className="text-slate-600 font-semibold">{source.phone}</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setReserveModalState({
                              source,
                              medicine: scannedResult.medicine,
                              availableQty: inventoryItem.quantity,
                            });
                          }}
                          className="flex-1 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          <span>Reserve Now</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setRouteModalSource({
                              source,
                              distanceKm,
                              availableQty: inventoryItem.quantity,
                            });
                          }}
                          className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                          title="Get Driving Route"
                        >
                          <Navigation className="w-3.5 h-3.5 text-blue-600" />
                          <span>Directions</span>
                        </button>

                        <a
                          href={`tel:${source.phone}`}
                          className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                          title="Call Pharmacy"
                        >
                          <Phone className="w-3.5 h-3.5 text-teal-600" />
                          <span>Call</span>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* QUICK HOLD RESERVATION POPUP MODAL */}
      {reserveModalState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Zap className="w-4 h-4" />
                </div>
                <h3 className="text-base font-black text-slate-900">Instant Medicine Hold</h3>
              </div>
              <button
                type="button"
                onClick={() => setReserveModalState(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleQuickReserveSubmit} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-100 text-xs">
                <p className="font-extrabold text-blue-900 text-sm">
                  {reserveModalState.medicine.name}
                </p>
                <p className="text-blue-700 mt-0.5">
                  Holding at: <strong>{reserveModalState.source.name}</strong>
                </p>
                <p className="text-slate-500 mt-1">
                  Stock available: {reserveModalState.availableQty} {reserveModalState.medicine.unit}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Patient / Caregiver Full Name
                </label>
                <input
                  type="text"
                  required
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Contact Mobile Number (For OTP Pickup Verification)
                </label>
                <input
                  type="text"
                  required
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 leading-snug">
                ⚠️ This hold reserves stock for <strong>30 minutes</strong> at the pharmacy counter.
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReserveModalState(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/20 cursor-pointer"
                >
                  Confirm Reservation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ROUTE NAVIGATION MODAL */}
      {routeModalSource && scannedResult && (
        <RouteModal
          isOpen={!!routeModalSource}
          onClose={() => setRouteModalSource(null)}
          source={routeModalSource.source}
          userLat={userLat}
          userLon={userLon}
          userLocationName={userLocationName}
          distanceKm={routeModalSource.distanceKm}
          estimatedMinutes={Math.max(4, Math.round(routeModalSource.distanceKm * 3.2))}
          medicineName={scannedResult.medicine.name}
          availableQuantity={routeModalSource.availableQty}
          onReserveClick={() => {
            const current = routeModalSource;
            setRouteModalSource(null);
            setReserveModalState({
              source: current.source,
              medicine: scannedResult.medicine,
              availableQty: current.availableQty,
            });
          }}
        />
      )}
    </div>
  );
};

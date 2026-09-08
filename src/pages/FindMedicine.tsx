import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { SmartAllocationService, calculateDistanceKm } from '../services/smartAllocation';
import { AllocationPlan, UrgencyLevel, MedicalSource, ImageCatalogMatch, Medicine } from '../types';
import {
  Search,
  Layers,
  Clock,
  MapPin,
  ShieldCheck,
  Building2,
  Hospital,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Phone,
  ArrowRight,
  SlidersHorizontal,
  Navigation,
  X,
  FileCheck,
  LocateFixed,
  Compass,
  Check,
  Camera,
  Upload,
  Info,
  ChevronRight,
  ExternalLink,
  PackageCheck,
  Activity,
  Zap,
  LayoutGrid,
} from 'lucide-react';
import { MedMap } from '../components/map/MedMap';
import { RouteModal } from '../components/map/RouteModal';
import { MedicineCard } from '../components/common/MedicineCard';
import { MedicineImageScanner } from '../components/common/MedicineImageScanner';
import { TISAIYANVILAI_LOCALITIES, DEMO_IMAGE_CATALOG, DEFAULT_CITY, DEFAULT_PINCODE } from '../data/mockData';
import confetti from 'canvas-confetti';

const CATEGORIES = [
  { id: 'ALL', label: 'All Categories' },
  { id: 'ANTIVIRAL', label: 'Antiviral' },
  { id: 'EMERGENCY_CARDIAC', label: 'Cardiac Emergency' },
  { id: 'ANTICOAGULANT', label: 'Anticoagulant' },
  { id: 'DIABETIC_CRITICAL', label: 'Diabetic Care' },
  { id: 'ANALGESIC_ANTIPYRETIC', label: 'Pain & Fever' },
  { id: 'ANTIBIOTIC', label: 'Antibiotics' },
  { id: 'RESPIRATORY_EMERGENCY', label: 'Respiratory' },
];

export const FindMedicine: React.FC = () => {
  const { medicines, sources, inventory, createReservation } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Search Mode: 'NAME', 'IMAGE', or 'CATALOG'
  const [searchMode, setSearchMode] = useState<'NAME' | 'IMAGE' | 'CATALOG'>('NAME');

  // Search Inputs
  const [selectedMedicineId, setSelectedMedicineId] = useState<string>('MED-01'); // Default Paracetamol 500mg
  const [searchQuery, setSearchQuery] = useState<string>('Paracetamol 500mg Tablets');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [quantity, setQuantity] = useState<number>(20);
  const [urgency, setUrgency] = useState<UrgencyLevel>('CRITICAL');
  const [searchRadiusKm, setSearchRadiusKm] = useState<number>(5);

  // Image Search State
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null);
  const [matchedImageResult, setMatchedImageResult] = useState<ImageCatalogMatch | null>(null);
  const [isMatchingImage, setIsMatchingImage] = useState<boolean>(false);

  // Location States
  const [userLocationName, setUserLocationName] = useState<string>('Tisaiyanvilai Main Bazaar (627657)');
  const [userCoordinates, setUserCoordinates] = useState<{ lat: number; lon: number }>({
    lat: 8.4184, // Default Tisaiyanvilai 627657
    lon: 77.8732,
  });
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationSuccessMsg, setLocationSuccessMsg] = useState<string | null>(null);

  // Smart Allocation Result State
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [allocationResult, setAllocationResult] = useState<{
    recommendedPlan: AllocationPlan | null;
    alternativePlans: AllocationPlan[];
  } | null>(null);

  // Details Modal
  const [detailsSource, setDetailsSource] = useState<{ source: MedicalSource; availableQty: number; updatedAt: string } | null>(null);

  // Route Navigation Modal
  const [routeSource, setRouteSource] = useState<MedicalSource | null>(null);

  // Reservation Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlanToReserve, setSelectedPlanToReserve] = useState<AllocationPlan | null>(null);
  const [patientName, setPatientName] = useState('Rahul Sharma');
  const [patientPhone, setPatientPhone] = useState('+91 98765 43210');

  // Filtered medicines for autocomplete
  const filteredCatalog = medicines.filter((m) => {
    const matchesQuery =
      !searchQuery ||
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.genericName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'ALL' || m.category === selectedCategory;
    return matchesQuery && matchesCat;
  });

  // GPS Geolocation Handler
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Location permission is not supported on this browser. Defaulting to Tisaiyanvilai center.');
      return;
    }

    setIsLocating(true);
    setLocationSuccessMsg(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserCoordinates({ lat: latitude, lon: longitude });
        setUserLocationName(`GPS Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)}) • Tisaiyanvilai`);
        setIsLocating(false);
        setLocationSuccessMsg('Exact GPS location captured successfully!');
        setTimeout(() => setLocationSuccessMsg(null), 3000);
      },
      (error) => {
        console.warn('Geolocation error:', error);
        setIsLocating(false);
        setUserCoordinates({ lat: 8.4184, lon: 77.8732 });
        setUserLocationName('Tisaiyanvilai, Tamil Nadu - 627657');
        setLocationSuccessMsg('Location permission was not granted. Please select a location manually.');
        setTimeout(() => setLocationSuccessMsg(null), 3500);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleSelectPreset = (preset: typeof TISAIYANVILAI_LOCALITIES[0]) => {
    setUserCoordinates({ lat: preset.lat, lon: preset.lon });
    setUserLocationName(`${preset.name} (${preset.pincode})`);
    setLocationSuccessMsg(`Location set to ${preset.name}`);
    setTimeout(() => setLocationSuccessMsg(null), 2500);
  };

  // Medicine selection handler
  const handleSelectMedicine = (med: Medicine) => {
    setSelectedMedicineId(med.id);
    setSearchQuery(med.name);
    setIsDropdownOpen(false);
  };

  // Image Upload / Preset Matching
  const handleImageMatch = (match: ImageCatalogMatch) => {
    setIsMatchingImage(true);
    setMatchedImageResult(null);

    setTimeout(() => {
      setMatchedImageResult(match);
      setSelectedMedicineId(match.medicineId);
      const med = medicines.find((m) => m.id === match.medicineId);
      if (med) setSearchQuery(med.name);
      setIsMatchingImage(false);
    }, 450);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setUploadedImagePreview(previewUrl);
      const match = DEMO_IMAGE_CATALOG[0]; // Default match to Paracetamol
      handleImageMatch(match);
    }
  };

  // Run Smart Allocation Engine
  const runSmartAllocation = () => {
    setIsSearching(true);
    const selectedMed = medicines.find((m) => m.id === selectedMedicineId);
    if (!selectedMed) {
      setIsSearching(false);
      return;
    }

    const activeSources = sources.filter(
      (s) =>
        !s.isDeleted &&
        s.accountStatus === 'ACTIVE' &&
        s.verificationStatus === 'APPROVED' &&
        s.availabilityStatus !== 'CLOSED' &&
        s.availabilityStatus !== 'OFFLINE'
    );

    setTimeout(() => {
      const res = SmartAllocationService.calculateAllocation({
        medicineId: selectedMedicineId,
        medicineName: selectedMed.name,
        requiredQuantity: quantity,
        urgency,
        inventories: inventory,
        sources: activeSources,
        userLat: userCoordinates.lat,
        userLon: userCoordinates.lon,
      });

      setAllocationResult({
        recommendedPlan: res.recommendedPlan,
        alternativePlans: res.alternativePlans,
      });
      setIsSearching(false);
    }, 250);
  };

  useEffect(() => {
    runSmartAllocation();
  }, [selectedMedicineId, quantity, urgency, inventory, userCoordinates, sources, searchRadiusKm]);

  useEffect(() => {
    const medParam = searchParams.get('med');
    if (medParam) {
      const found = medicines.find((m) => m.id === medParam);
      if (found) {
        setSelectedMedicineId(found.id);
        setSearchQuery(found.name);
      }
    }
  }, [searchParams, medicines]);

  const handleSearchClick = (e: React.FormEvent) => {
    e.preventDefault();
    setIsDropdownOpen(false);
    // Find closest match if query was manually typed
    if (searchQuery.trim()) {
      const match = medicines.find(
        (m) =>
          m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.genericName.toLowerCase().includes(searchQuery.toLowerCase())
      );
      if (match) {
        setSelectedMedicineId(match.id);
        setSearchQuery(match.name);
      }
    }
    runSmartAllocation();
  };

  const handleOpenReserveModal = (plan: AllocationPlan) => {
    setSelectedPlanToReserve(plan);
    setIsModalOpen(true);
  };

  const handleConfirmReservation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanToReserve) return;

    createReservation(selectedPlanToReserve, {
      name: patientName,
      phone: patientPhone,
    });

    setIsModalOpen(false);

    try {
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (_) {}

    navigate('/reservations');
  };

  const currentMedicine = medicines.find((m) => m.id === selectedMedicineId);

  // List of nearby verified sources with this medicine for direct cards
  const nearbySourceResults = inventory
    .filter((inv) => inv.medicineId === selectedMedicineId && inv.quantity > 0)
    .map((inv) => {
      const src = sources.find((s) => s.id === inv.sourceId);
      if (!src || src.isDeleted || src.accountStatus !== 'ACTIVE' || !src.isVerified) return null;
      const distance = calculateDistanceKm(userCoordinates.lat, userCoordinates.lon, src.latitude, src.longitude);
      if (distance > searchRadiusKm) return null;
      return {
        inventory: inv,
        source: src,
        distance,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort((a, b) => a.distance - b.distance);

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Find Medicine & Pharmacy Stock
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Type any medicine name or search by photo to view live verified stock across licensed pharmacies & emergency hospitals in your regional network.
          </p>
        </div>

        {/* Current Location Badge */}
        <div className="flex items-center gap-2 bg-slate-100 p-2.5 rounded-2xl border border-slate-200 text-xs font-bold text-slate-700">
          <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <span className="truncate max-w-[220px] sm:max-w-xs">{userLocationName}</span>
        </div>
      </div>

      {/* SEARCH AND LOCATION CONTROL PANEL */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-200/90 space-y-6">
        {/* Toggle Mode: Name Search vs Image Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex flex-wrap rounded-2xl bg-slate-100 p-1 border border-slate-200 text-xs font-bold gap-1">
            <button
              type="button"
              onClick={() => setSearchMode('NAME')}
              className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
                searchMode === 'NAME' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>Search by Medicine Name</span>
            </button>
            <button
              type="button"
              onClick={() => setSearchMode('IMAGE')}
              className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
                searchMode === 'IMAGE' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>📷 Optical Medicine & Prescription Scanner</span>
            </button>
            <button
              type="button"
              onClick={() => setSearchMode('CATALOG')}
              className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
                searchMode === 'CATALOG' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span>🗂️ 4-Column Medicine Catalog</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="font-bold text-slate-700">100% Real-Time Stock Grid</span>
          </div>
        </div>

        {/* MODE A: NAME SEARCH WITH PROMINENT SEARCH BAR & SEARCH BUTTON */}
        {searchMode === 'NAME' && (
          <form onSubmit={handleSearchClick} className="space-y-4">
            {/* Category Quick Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pb-1">
              <span className="text-[11px] font-bold text-slate-400 mr-1 uppercase">Categories:</span>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Main Interactive Search Input & Big Search Button */}
            <div className="relative">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Type Medicine Name or Generic Formula
              </label>
              <div className="flex flex-col sm:flex-row gap-2.5">
                <div className="relative flex-1">
                  <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setIsDropdownOpen(true);
                    }}
                    onFocus={() => setIsDropdownOpen(true)}
                    placeholder="Search medicines (e.g. Paracetamol, Insulin, Remdesivir, Adrenaline, Enoxaparin, Atropine...)"
                    className="w-full pl-12 pr-10 py-3.5 rounded-2xl border border-slate-300 bg-slate-50/80 text-slate-900 text-sm font-bold placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none transition-all shadow-inner"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setIsDropdownOpen(true);
                      }}
                      className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}

                  {/* Autocomplete Dropdown */}
                  {isDropdownOpen && filteredCatalog.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 max-h-72 overflow-y-auto divide-y divide-slate-100">
                      {filteredCatalog.map((med) => {
                        const totalStock = inventory
                          .filter((i) => i.medicineId === med.id)
                          .reduce((sum, item) => sum + item.quantity, 0);

                        return (
                          <button
                            key={med.id}
                            type="button"
                            onClick={() => handleSelectMedicine(med)}
                            className="w-full px-4 py-3 text-left hover:bg-blue-50/80 transition-colors flex items-center justify-between group cursor-pointer"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-sm text-slate-900 group-hover:text-blue-700">
                                  {med.name}
                                </span>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 uppercase">
                                  {med.category}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 mt-0.5">{med.genericName} • {med.dosage}</p>
                            </div>

                            <div className="text-right">
                              <span className={`text-xs font-extrabold px-2 py-1 rounded-xl ${
                                totalStock > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {totalStock > 0 ? `${totalStock} ${med.unit} in stock` : 'Out of Stock'}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Primary Search Button */}
                <button
                  type="submit"
                  disabled={isSearching}
                  className="px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-extrabold text-sm shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer flex-shrink-0"
                >
                  <Search className={`w-4 h-4 ${isSearching ? 'animate-spin' : ''}`} />
                  <span>{isSearching ? 'Searching Stock...' : 'Search Medicine & Stock'}</span>
                </button>
              </div>
            </div>

            {/* Search Filters Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1 items-end">
              {/* Quantity Required */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Quantity Required
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={1}
                    max={500}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-300 bg-slate-50/80 text-slate-900 text-sm font-extrabold focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs text-slate-400 font-semibold pointer-events-none">
                    {currentMedicine?.unit || 'units'}
                  </span>
                </div>
              </div>

              {/* Urgency Level */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Urgency Level
                </label>
                <select
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value as UrgencyLevel)}
                  className={`w-full px-3.5 py-2.5 rounded-2xl border text-xs sm:text-sm font-bold focus:ring-2 transition-all cursor-pointer ${
                    urgency === 'CRITICAL'
                      ? 'border-red-300 bg-red-50 text-red-700 focus:ring-red-500'
                      : urgency === 'URGENT'
                      ? 'border-amber-300 bg-amber-50 text-amber-800 focus:ring-amber-500'
                      : 'border-slate-300 bg-slate-50 text-slate-800 focus:ring-blue-500'
                  }`}
                >
                  <option value="CRITICAL">🔴 Critical (Immediate / ICU)</option>
                  <option value="URGENT">🟡 Urgent (&lt; 2 Hours)</option>
                  <option value="NORMAL">🟢 Normal Schedule</option>
                </select>
              </div>

              {/* Radius Filter */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Search Radius
                </label>
                <select
                  value={searchRadiusKm}
                  onChange={(e) => setSearchRadiusKm(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-300 bg-slate-50/80 text-slate-900 text-xs sm:text-sm font-bold focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value={2}>Within 2 km</option>
                  <option value={5}>Within 5 km (Standard Town)</option>
                  <option value={10}>Within 10 km (Sub-District)</option>
                  <option value={25}>Within 25 km (Full District Grid)</option>
                </select>
              </div>
            </div>
          </form>
        )}

        {/* MODE B: IMAGE SEARCH WITH AI VISION & IMMEDIATE PHARMACY AVAILABILITY */}
        {searchMode === 'IMAGE' && (
          <div className="pt-2">
            <MedicineImageScanner
              userLat={userCoordinates.lat}
              userLon={userCoordinates.lon}
              userLocationName={userLocationName}
              onMedicineMatched={(med) => {
                setSelectedMedicineId(med.id);
                setSearchQuery(med.name);
              }}
            />
          </div>
        )}

        {/* MODE C: 4-CARDS-PER-ROW RECTANGULAR CATALOG */}
        {searchMode === 'CATALOG' && (
          <div className="space-y-6 pt-2">
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <strong className="text-xs font-black text-blue-900">
                  Visual Medicine Formulary Grid:
                </strong>
                <p className="text-[11px] text-blue-700 mt-0.5">
                  Browsing all 18 emergency & essential medicines in clean rectangular cards with live pharmacy stock.
                </p>
              </div>
              <span className="text-xs font-bold text-blue-800 bg-white px-3 py-1.5 rounded-xl border border-blue-200 shadow-2xs w-fit">
                4 Cards / Row Layout
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredCatalog.map((med) => (
                <MedicineCard
                  key={med.id}
                  medicine={med}
                  inventory={inventory}
                  sources={sources}
                  userLat={userCoordinates.lat}
                  userLon={userCoordinates.lon}
                  onSelectMedicine={(selected) => {
                    handleSelectMedicine(selected);
                    setSearchMode('NAME');
                  }}
                  onOpenReserve={(selectedMed) => {
                    handleSelectMedicine(selectedMed);
                    setSearchMode('NAME');
                  }}
                  onOpenDirections={(source) => {
                    setRouteSource(source);
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* LOCATION SELECTOR & CURRENT GPS */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                User Location / Municipal Hub:
              </span>
            </div>

            {/* GPS Location Button */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={isLocating}
                className="px-3.5 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              >
                <LocateFixed className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin text-teal-600' : 'text-teal-700'}`} />
                <span>{isLocating ? 'Detecting GPS...' : '📍 Use Current Location'}</span>
              </button>

              {locationSuccessMsg && (
                <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-xl border border-teal-200">
                  {locationSuccessMsg}
                </span>
              )}
            </div>
          </div>

          {/* Quick Locality Presets */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-slate-400 font-bold mr-1">Quick Locality Presets:</span>
            {TISAIYANVILAI_LOCALITIES.map((loc) => (
              <button
                key={loc.name}
                type="button"
                onClick={() => handleSelectPreset(loc)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  userLocationName.includes(loc.name)
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                }`}
              >
                {loc.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SEARCH RESULTS SECTION */}
      <div className="space-y-6">
        {/* Results Banner Explanation with Medicine Image */}
        <div className="bg-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {currentMedicine?.sampleImageUrl && (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-white/10 border border-white/20 flex-shrink-0 shadow-md">
                <img
                  src={currentMedicine.sampleImageUrl}
                  alt={currentMedicine.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <PackageCheck className="w-5 h-5 text-teal-400" />
                <span className="text-xs font-extrabold uppercase tracking-wider text-teal-400">
                  Live Stock Availability Results
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black">
                {currentMedicine?.name || 'Selected Medicine'}
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                {currentMedicine?.dosage && <span className="text-teal-300 font-semibold">{currentMedicine.dosage} • </span>}
                Showing verified facilities within <strong className="text-white">{searchRadiusKm} km</strong> of <strong className="text-white">{userLocationName}</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-800 px-4 py-2 rounded-2xl border border-slate-700 text-right">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Facilities Stocking</span>
              <span className="text-lg font-black text-white">{nearbySourceResults.length} Found</span>
            </div>
            <div className="bg-slate-800 px-4 py-2 rounded-2xl border border-slate-700 text-right">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Stock</span>
              <span className="text-lg font-black text-emerald-400">
                {nearbySourceResults.reduce((acc, r) => acc + r.inventory.quantity, 0)} {currentMedicine?.unit || 'units'}
              </span>
            </div>
          </div>
        </div>

        {/* RESULTS GRID: Requirements 12, 13, 14 (4 CARDS PER ROW) */}
        {nearbySourceResults.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {nearbySourceResults.map(({ source, inventory: inv, distance }) => (
              <div
                key={source.id}
                className="bg-white rounded-3xl overflow-hidden border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative group hover:-translate-y-0.5"
              >
                {/* Facility Image Header Banner - RECTANGULAR 16:10 */}
                <div className="w-full aspect-[16/10] relative bg-slate-100 overflow-hidden flex-shrink-0">
                  <img
                    src={source.imageUrl || source.logoUrl || 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&auto=format&fit=crop&q=80'}
                    alt={source.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent" />
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`text-[9.5px] font-black uppercase px-2 py-0.5 rounded-lg backdrop-blur-md text-white ${
                        source.type === 'HOSPITAL' ? 'bg-indigo-600/90' : 'bg-teal-600/90'
                      }`}
                    >
                      {source.type}
                    </span>
                    {source.isVerified && (
                      <span className="bg-blue-600/90 text-white text-[9px] font-black px-1.5 py-0.5 rounded-lg backdrop-blur-md flex items-center gap-0.5">
                        <ShieldCheck className="w-2.5 h-2.5" /> Verified
                      </span>
                    )}
                  </div>
                  {source.emergencySupport24x7 && (
                    <span className="absolute top-2.5 right-2.5 bg-red-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full shadow-sm">
                      24x7
                    </span>
                  )}
                  <div className="absolute bottom-2 left-3 right-3">
                    <h3 className="font-extrabold text-white text-[13px] leading-tight drop-shadow-sm truncate">
                      {source.name}
                    </h3>
                  </div>
                </div>

                <div className="p-4 sm:p-5 space-y-3 flex-1 flex flex-col justify-between">

                  {/* Stock Availability Metric */}
                  <div className="p-3.5 bg-emerald-50/80 border border-emerald-200/90 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wide">
                        Verified Stock on Hand
                      </span>
                      <p className="text-xl font-black text-emerald-900 mt-0.5">
                        {inv.quantity} <span className="text-xs font-bold text-emerald-700">{currentMedicine?.unit}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-500 block">Unit Price</span>
                      <span className="text-sm font-black text-slate-800">₹{inv.unitPrice || 45}</span>
                    </div>
                  </div>

                  {/* Distance & Address */}
                  <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-blue-700 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" /> {distance} km away
                      </span>
                      <span className="text-slate-500">
                        ~{Math.max(4, Math.round(distance * 3.2))} mins drive
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">{source.address}</p>
                    <div className="flex items-center justify-between text-[11px] pt-1 text-slate-600 font-semibold border-t border-slate-200/60">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" /> {source.phone}
                      </span>
                      <span className="text-teal-700 font-bold">{source.operatingHours}</span>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-400 font-medium">
                    Batch: <span className="font-bold text-slate-600">{inv.batchNumber}</span> • Expiry: <span className="font-bold text-slate-600">{inv.expiryDate}</span>
                  </p>
                </div>

                {/* Card Action Buttons */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() =>
                      setDetailsSource({
                        source,
                        availableQty: inv.quantity,
                        updatedAt: inv.updatedAt,
                      })
                    }
                    className="py-2.5 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors cursor-pointer text-center"
                  >
                    Details
                  </button>

                  <button
                    type="button"
                    onClick={() => setRouteSource(source)}
                    className="py-2.5 px-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-200 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Route</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (allocationResult?.recommendedPlan) {
                        handleOpenReserveModal(allocationResult.recommendedPlan);
                      }
                    }}
                    className="py-2.5 px-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-sm flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Reserve</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 space-y-4">
            <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
            <h3 className="text-lg font-black text-slate-800">
              No stock found for "{currentMedicine?.name}" within {searchRadiusKm} km
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              No licensed dispensary within {searchRadiusKm} km currently holds available stock of this medicine. You can expand the radius to 25 km or broadcast a critical Emergency Request across Tisaiyanvilai.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSearchRadiusKm(25)}
                className="px-5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-all cursor-pointer"
              >
                Expand Radius to 25 km District Grid
              </button>
              <button
                type="button"
                onClick={() => navigate('/emergency')}
                className="px-5 py-2.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold transition-all cursor-pointer shadow-md shadow-red-500/20"
              >
                🚨 Broadcast Emergency Request
              </button>
            </div>
          </div>
        )}

        {/* SMART ALLOCATION ENGINE RECOMMENDATIONS (Multi-Source Greedy Optimizer) */}
        {allocationResult && (
          <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-200/90 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-black text-slate-900">
                    Smart Multi-Source Allocation Optimizer
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Algorithm minimizes patient travel distance while prioritizing 24x7 emergency facilities & verified rating.
                </p>
              </div>

              {allocationResult.recommendedPlan && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 font-bold text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                  Score: {allocationResult.recommendedPlan.score.toFixed(1)}/100
                </span>
              )}
            </div>

            {allocationResult.recommendedPlan ? (
              <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-50/80 via-white to-slate-50 border-2 border-blue-200 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-blue-600 text-white">
                      Recommended Allocation Route
                    </span>
                    <h4 className="text-base font-black text-slate-900 mt-2">
                      Fulfill {allocationResult.recommendedPlan.fulfilledQuantity} / {allocationResult.recommendedPlan.requestedQuantity} units of {allocationResult.recommendedPlan.medicineName}
                    </h4>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenReserveModal(allocationResult.recommendedPlan!)}
                    className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <Clock className="w-4 h-4" />
                    <span>Reserve via 15-Min QR Hold</span>
                  </button>
                </div>

                {/* Allocated Sources Breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                  {allocationResult.recommendedPlan.allocatedSources.map((s, idx) => (
                    <div
                      key={s.sourceId}
                      className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1.5 shadow-2xs"
                    >
                      <div className="flex items-center justify-between font-bold">
                        <span className="text-slate-900 truncate">
                          {idx + 1}. {s.sourceName}
                        </span>
                        <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-extrabold">
                          {s.allocatedQuantity} units
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">{s.address}</p>
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 pt-1 border-t border-slate-100">
                        <span>{s.distanceKm} km away</span>
                        <span>~{s.estimatedMinutes} mins</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center text-xs text-slate-600">
                No active source in the network could satisfy this quantity under the current radius.
              </div>
            )}
          </div>
        )}

        {/* INTERACTIVE LEAFLET MAP (Requirement #11) */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-200/90 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-slate-900">
                Interactive Emergency Map
              </h3>
              <p className="text-xs text-slate-500">
                Visualizing user location, verified dispensaries, and regional trauma units
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <span className="w-3 h-3 rounded-full bg-blue-600 inline-block" /> User Pin
              <span className="w-3 h-3 rounded-full bg-teal-600 inline-block ml-2" /> Pharmacy
              <span className="w-3 h-3 rounded-full bg-indigo-600 inline-block ml-2" /> Hospital
            </div>
          </div>

          <div className="h-[420px] rounded-2xl overflow-hidden border border-slate-200">
            <MedMap
              sources={sources.filter((s) => !s.isDeleted && s.accountStatus === 'ACTIVE')}
              inventories={inventory}
              centerLat={userCoordinates.lat}
              centerLon={userCoordinates.lon}
              selectedMedicineName={currentMedicine?.name}
              onSelectSource={(source) => setRouteSource(source)}
            />
          </div>
        </div>
      </div>

      {/* 15-MINUTE QR RESERVATION MODAL */}
      {isModalOpen && selectedPlanToReserve && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">
                  15-Minute Guaranteed Hold
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1">Confirm Medicine Reservation</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-2 text-xs text-blue-900">
              <div className="flex items-center justify-between font-bold">
                <span>Medicine:</span>
                <span className="text-slate-900">{selectedPlanToReserve.medicineName}</span>
              </div>
              <div className="flex items-center justify-between font-bold">
                <span>Reserved Quantity:</span>
                <span className="text-emerald-700">{selectedPlanToReserve.fulfilledQuantity} units</span>
              </div>
              <div className="flex items-center justify-between font-bold">
                <span>Hold Duration:</span>
                <span className="text-blue-700">15 Minutes from Confirmation</span>
              </div>
            </div>

            <form onSubmit={handleConfirmReservation} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Patient / Collector Full Name</label>
                <input
                  type="text"
                  required
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-300 text-xs sm:text-sm font-bold focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Contact Phone Number</label>
                <input
                  type="text"
                  required
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-300 text-xs sm:text-sm font-bold focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-1/2 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-lg shadow-blue-500/25 transition-all cursor-pointer"
                >
                  Generate QR Token & Hold
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FACILITY DETAILS MODAL */}
      {detailsSource && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base">{detailsSource.source.name}</h3>
              <button
                type="button"
                onClick={() => setDetailsSource(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2.5 text-xs text-slate-600">
              <p><strong>License Reg No:</strong> {detailsSource.source.registrationNumber}</p>
              <p><strong>Owner / Licensee:</strong> {detailsSource.source.ownerName}</p>
              <p><strong>Address:</strong> {detailsSource.source.address}</p>
              <p><strong>Phone:</strong> {detailsSource.source.phone}</p>
              <p><strong>Operating Hours:</strong> {detailsSource.source.operatingHours}</p>
              <p><strong>Available Units in Stock:</strong> <span className="font-bold text-emerald-700">{detailsSource.availableQty} units</span></p>
            </div>
            <button
              type="button"
              onClick={() => {
                setRouteSource(detailsSource.source);
                setDetailsSource(null);
              }}
              className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-colors"
            >
              Start GPS Navigation
            </button>
          </div>
        </div>
      )}

      {/* ROUTE NAVIGATION MODAL */}
      {routeSource && (
        <RouteModal
          isOpen={!!routeSource}
          onClose={() => setRouteSource(null)}
          source={routeSource}
          userLat={userCoordinates.lat}
          userLon={userCoordinates.lon}
          userLocationName={userLocationName}
          distanceKm={calculateDistanceKm(userCoordinates.lat, userCoordinates.lon, routeSource.latitude, routeSource.longitude)}
          estimatedMinutes={Math.max(4, Math.round(calculateDistanceKm(userCoordinates.lat, userCoordinates.lon, routeSource.latitude, routeSource.longitude) * 3.2))}
          medicineName={currentMedicine?.name}
          availableQuantity={inventory.find((i) => i.sourceId === routeSource.id && i.medicineId === selectedMedicineId)?.quantity}
          onReserveClick={() => {
            if (allocationResult?.recommendedPlan) {
              handleOpenReserveModal(allocationResult.recommendedPlan);
            }
          }}
        />
      )}
    </div>
  );
};

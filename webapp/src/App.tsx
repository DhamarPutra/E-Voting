import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { 
  Vote, 
  Shield, 
  UserCheck, 
  Settings, 
  Plus, 
  CheckCircle, 
  AlertCircle, 
  HelpCircle, 
  LogOut,
  RefreshCw,
  TrendingUp,
  Award
} from 'lucide-react';

// Human-readable ABI for our Voting contract
const VOTING_ABI = [
  "function admin() view returns (address)",
  "function currentEventId() view returns (uint256)",
  "function getVotingEvent(uint256 eventId) view returns (tuple(uint256 id, string title, bool isActive))",
  "function getResults(uint256 eventId) view returns (tuple(uint256 id, string name, uint256 voteCount)[])",
  "function hasVoted(uint256 eventId, bytes32 nikHash) view returns (bool)",
  "function getCurrentEventId() view returns (uint256)",
  "function createVotingEvent(string title, string[] candidateNames) external",
  "function castVote(bytes32 nikHash, uint256 candidateId) external",
  "function endVotingEvent(uint256 eventId) external",
  "event VotingEventCreated(uint256 indexed eventId, string title, uint256 candidateCount)",
  "event VoteCast(uint256 indexed eventId, bytes32 indexed nikHash, uint256 indexed candidateId)",
  "event VotingEventEnded(uint256 indexed eventId)"
];

// Default local config
const DEFAULT_RPC = import.meta.env.VITE_RPC_URL || "http://127.0.0.1:8545";
const DEFAULT_CONTRACT = import.meta.env.VITE_CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3";
// Standard Hardhat Account #0 private key
const DEFAULT_PRIVATE_KEY = import.meta.env.VITE_OPERATOR_PRIVATE_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

interface Candidate {
  id: number;
  name: string;
  voteCount: number;
}

interface VotingEvent {
  id: number;
  title: string;
  isActive: boolean;
}

function App() {
  // Tabs
  const [activeTab, setActiveTab] = useState<'vote' | 'admin'>('vote');

  // Config State
  const [rpcUrl, setRpcUrl] = useState(DEFAULT_RPC);
  const [contractAddress, setContractAddress] = useState(DEFAULT_CONTRACT);
  const [operatorKey, setOperatorKey] = useState(DEFAULT_PRIVATE_KEY);
  
  // Connection state
  const [isConnected, setIsConnected] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(true);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [operatorWallet, setOperatorWallet] = useState<ethers.Wallet | null>(null);
  const [adminAddress, setAdminAddress] = useState<string>("");

  // Blockchain Data State
  const [currentEvent, setCurrentEvent] = useState<VotingEvent | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Voting Input State
  const [nik, setNik] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState<number | null>(null);
  const [voteStatus, setVoteStatus] = useState<{ type: 'success' | 'error' | 'info' | null, message: string }>({ type: null, message: '' });

  // Admin Form State
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventCandidates, setNewEventCandidates] = useState<string[]>(['', '']);
  const [adminLogs, setAdminLogs] = useState<string[]>([]);

  // Demo Mock Data (Fallback)
  const [mockEvent, setMockEvent] = useState<VotingEvent>({
    id: 1,
    title: "Pemilihan Ketua Umum HIMA Web3 2026",
    isActive: true
  });
  const [mockCandidates, setMockCandidates] = useState<Candidate[]>([
    { id: 0, name: "Syailendra Damar", voteCount: 42 },
    { id: 1, name: "Putra Wijaya", voteCount: 38 },
    { id: 2, name: "Clara Amalia", voteCount: 29 }
  ]);
  const [mockVotedNikHashes, setMockVotedNikHashes] = useState<Record<number, Record<string, boolean>>>({
    1: {}
  });

  // Try to connect to blockchain on mount or config change
  useEffect(() => {
    connectBlockchain();
  }, [rpcUrl, contractAddress, operatorKey]);

  const connectBlockchain = async () => {
    try {
      setLoading(true);
      const tempProvider = new ethers.JsonRpcProvider(rpcUrl);
      
      // Test connectivity
      await tempProvider.getNetwork();
      
      const tempWallet = new ethers.Wallet(operatorKey, tempProvider);
      const tempContract = new ethers.Contract(contractAddress, VOTING_ABI, tempWallet);
      
      // Fetch current admin
      const currentAdmin = await tempContract.admin();
      setAdminAddress(currentAdmin);
      
      setOperatorWallet(tempWallet);
      setContract(tempContract);
      setIsConnected(true);
      setIsDemoMode(false);
      logAdminMessage(`Terkoneksi ke blockchain di ${rpcUrl}. Kontrak: ${contractAddress}`);
      
      // Load real blockchain data
      await loadBlockchainData(tempContract);
    } catch (error) {
      console.log("Blockchain connection failed, running in simulation mode:", error);
      setIsConnected(false);
      setIsDemoMode(true);
      setContract(null);
      setOperatorWallet(null);
      logAdminMessage("Koneksi blockchain lokal gagal. Menggunakan mode Simulasi (Mock Data).");
    } finally {
      setLoading(false);
    }
  };

  const loadBlockchainData = async (activeContract: ethers.Contract) => {
    try {
      const eventId = await activeContract.currentEventId();
      const eventIdNum = Number(eventId);
      
      if (eventIdNum > 0) {
        const eventData = await activeContract.getVotingEvent(eventId);
        setCurrentEvent({
          id: Number(eventData.id),
          title: eventData.title,
          isActive: eventData.isActive
        });

        const rawCandidates = await activeContract.getResults(eventId);
        const parsedCandidates = rawCandidates.map((c: any) => ({
          id: Number(c.id),
          name: c.name,
          voteCount: Number(c.voteCount)
        }));
        setCandidates(parsedCandidates);
      } else {
        setCurrentEvent(null);
        setCandidates([]);
      }
    } catch (error) {
      console.error("Error loading blockchain data:", error);
      logAdminMessage("Gagal memuat data dari smart contract.");
    }
  };

  const refreshData = async () => {
    if (contract && !isDemoMode) {
      setLoading(true);
      await loadBlockchainData(contract);
      setLoading(false);
    } else {
      // Mock refresh
      setVoteStatus({ type: 'info', message: 'Data simulasi diperbarui.' });
    }
  };

  const logAdminMessage = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setAdminLogs(prev => [`[${timestamp}] ${msg}`, ...prev.slice(0, 19)]);
  };

  // NIK Hashing (Keccak256)
  const hashNik = (nikInput: string): string => {
    return ethers.solidityPackedKeccak256(["string"], [nikInput.trim()]);
  };

  // Submit Vote
  const handleVote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nik || nik.length < 16) {
      setVoteStatus({ type: 'error', message: 'NIK harus terdiri dari 16 digit angka.' });
      return;
    }
    if (selectedCandidate === null) {
      setVoteStatus({ type: 'error', message: 'Pilih salah satu kandidat terlebih dahulu.' });
      return;
    }

    const nikHash = hashNik(nik);
    const eventId = isDemoMode ? mockEvent.id : currentEvent?.id;

    if (!eventId) {
      setVoteStatus({ type: 'error', message: 'Tidak ada event voting yang aktif saat ini.' });
      return;
    }

    setActionLoading(true);
    setVoteStatus({ type: 'info', message: 'Memproses suara Anda secara gasless...' });

    if (isDemoMode) {
      // Simulation Logic
      setTimeout(() => {
        const alreadyVoted = mockVotedNikHashes[mockEvent.id]?.[nikHash] || false;
        
        if (alreadyVoted) {
          setVoteStatus({ type: 'error', message: 'NIK ini sudah digunakan untuk memilih pada event berjalan!' });
          setActionLoading(false);
          return;
        }

        // Increment vote count
        setMockCandidates(prev => prev.map(c => 
          c.id === selectedCandidate ? { ...c, voteCount: c.voteCount + 1 } : c
        ));

        // Mark NIK as voted
        setMockVotedNikHashes(prev => ({
          ...prev,
          [mockEvent.id]: {
            ...(prev[mockEvent.id] || {}),
            [nikHash]: true
          }
        }));

        setVoteStatus({ 
          type: 'success', 
          message: `Suara berhasil direkam! NIK Anda (${nik.substring(0, 4)}***) terverifikasi unik melalui hash keccak256.` 
        });
        setNik('');
        setSelectedCandidate(null);
        setActionLoading(false);
        logAdminMessage(`Simulasi Vote: NIK Hash ${nikHash.substring(0, 16)}... memilih Kandidat #${selectedCandidate}`);
      }, 1200);
    } else {
      // Real Blockchain Logic
      try {
        if (!contract) return;
        
        // Check if NIK already voted on-chain
        const alreadyVoted = await contract.hasVoted(eventId, nikHash);
        if (alreadyVoted) {
          setVoteStatus({ type: 'error', message: 'NIK ini sudah pernah memberikan suara pada event ini!' });
          setActionLoading(false);
          return;
        }

        // Cast vote using the operator's gas (gasless for voter)
        const tx = await contract.castVote(nikHash, selectedCandidate);
        await tx.wait();

        setVoteStatus({ 
          type: 'success', 
          message: `Suara berhasil tercatat di blockchain! Transaksi diproses secara gasless via Relayer.` 
        });
        setNik('');
        setSelectedCandidate(null);
        await loadBlockchainData(contract);
      } catch (error: any) {
        console.error(error);
        setVoteStatus({ 
          type: 'error', 
          message: error.reason || 'Terjadi kesalahan saat memproses transaksi di blockchain.' 
        });
      } finally {
        setActionLoading(false);
      }
    }
  };

  // Admin: Create Event
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    const filteredCandidates = newEventCandidates.filter(name => name.trim() !== '');
    if (!newEventTitle) {
      alert("Masukkan judul event terlebih dahulu.");
      return;
    }
    if (filteredCandidates.length < 2) {
      alert("Masukkan minimal 2 kandidat.");
      return;
    }

    setActionLoading(true);

    if (isDemoMode) {
      setTimeout(() => {
        const newId = mockEvent.id + 1;
        setMockEvent({
          id: newId,
          title: newEventTitle,
          isActive: true
        });
        setMockCandidates(filteredCandidates.map((name, index) => ({
          id: index,
          name,
          voteCount: 0
        })));
        setMockVotedNikHashes(prev => ({
          ...prev,
          [newId]: {}
        }));

        logAdminMessage(`Event Baru Dimulai (Simulasi): ${newEventTitle}`);
        setNewEventTitle('');
        setNewEventCandidates(['', '']);
        setActionLoading(false);
        alert("Simulasi Event Baru Berhasil Dibuat!");
      }, 1000);
    } else {
      try {
        if (!contract) return;
        const tx = await contract.createVotingEvent(newEventTitle, filteredCandidates);
        await tx.wait();
        
        logAdminMessage(`Event Baru Terpasang di Blockchain: ${newEventTitle}`);
        setNewEventTitle('');
        setNewEventCandidates(['', '']);
        await loadBlockchainData(contract);
        alert("Smart contract event baru berhasil dibuat!");
      } catch (error: any) {
        console.error(error);
        alert("Gagal membuat event: " + (error.reason || error.message));
      } finally {
        setActionLoading(false);
      }
    }
  };

  // Admin: End Event
  const handleEndEvent = async () => {
    const eventId = isDemoMode ? mockEvent.id : currentEvent?.id;
    if (!eventId) return;

    if (!confirm("Apakah Anda yakin ingin mengakhiri event pemilu saat ini?")) return;

    setActionLoading(true);

    if (isDemoMode) {
      setTimeout(() => {
        setMockEvent(prev => ({ ...prev, isActive: false }));
        logAdminMessage(`Event Pemilu #${eventId} Telah Ditutup (Simulasi).`);
        setActionLoading(false);
      }, 800);
    } else {
      try {
        if (!contract) return;
        const tx = await contract.endVotingEvent(eventId);
        await tx.wait();

        logAdminMessage(`Event Pemilu #${eventId} Ditutup di Blockchain.`);
        await loadBlockchainData(contract);
      } catch (error: any) {
        console.error(error);
        alert("Gagal mengakhiri event: " + (error.reason || error.message));
      } finally {
        setActionLoading(false);
      }
    }
  };

  // Admin: Candidate fields helper
  const addCandidateField = () => {
    setNewEventCandidates([...newEventCandidates, '']);
  };

  const removeCandidateField = (index: number) => {
    if (newEventCandidates.length <= 2) return;
    setNewEventCandidates(newEventCandidates.filter((_, i) => i !== index));
  };

  const handleCandidateNameChange = (index: number, val: string) => {
    const updated = [...newEventCandidates];
    updated[index] = val;
    setNewEventCandidates(updated);
  };

  // Helpers for stats
  const activeEvent = isDemoMode ? mockEvent : currentEvent;
  const activeCandidates = isDemoMode ? mockCandidates : candidates;
  const totalVotes = activeCandidates.reduce((sum, c) => sum + c.voteCount, 0);

  return (
    <div className="min-h-screen bg-[#070a13] flex flex-col font-sans selection:bg-purple-500 selection:text-white">
      {/* Header */}
      <header className="glass sticky top-0 z-40 border-b border-white/5 py-4 px-6 md:px-12 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-primary rounded-xl shadow-lg shadow-blue-500/20">
            <Vote className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg md:text-xl tracking-tight bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              VOTE3.ID
            </h1>
            <p className="text-[10px] text-gray-500 font-medium tracking-widest uppercase">Decentralized Gasless E-Voting</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Status Indicator */}
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs">
            <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
            <span className="text-gray-300 font-medium">
              {isConnected ? 'Blockchain Terkoneksi' : 'Mode Simulasi (Offline)'}
            </span>
          </div>

          <button 
            onClick={refreshData}
            className="p-2 hover:bg-white/5 border border-white/10 rounded-lg text-gray-400 hover:text-white transition duration-200"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 flex flex-col gap-6">
        
        {/* Navigation Tabs */}
        <div className="flex bg-white/5 p-1 rounded-xl max-w-md w-full border border-white/5">
          <button
            onClick={() => setActiveTab('vote')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-semibold text-sm transition-all duration-300 ${
              activeTab === 'vote'
                ? 'bg-gradient-primary text-white shadow-lg shadow-purple-500/10'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            Dashboard Pemilih
          </button>
          <button
            onClick={() => setActiveTab('admin')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-semibold text-sm transition-all duration-300 ${
              activeTab === 'admin'
                ? 'bg-gradient-primary text-white shadow-lg shadow-purple-500/10'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Shield className="w-4 h-4" />
            Panel Admin
          </button>
        </div>

        {/* Tab 1: Voter Dashboard */}
        {activeTab === 'vote' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Candidates Card / Info */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              
              {/* Event Banner */}
              <div className="glass p-6 rounded-2xl relative overflow-hidden flex flex-col justify-between min-h-[160px]">
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -z-10"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -z-10"></div>
                
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-md tracking-wider ${
                      activeEvent?.isActive 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}>
                      {activeEvent?.isActive ? 'Event Aktif' : 'Event Selesai / Non-aktif'}
                    </span>
                    <h2 className="text-xl md:text-2xl font-bold mt-3 text-white">
                      {activeEvent ? activeEvent.title : "Tidak Ada Pemilu Berjalan"}
                    </h2>
                  </div>
                  <Award className="w-10 h-10 text-purple-400/80 shrink-0" />
                </div>

                <div className="flex gap-6 mt-6 border-t border-white/5 pt-4 text-xs text-gray-400">
                  <div>
                    Total Suara Masuk: <span className="text-white font-bold text-sm ml-1">{totalVotes}</span>
                  </div>
                  <div>
                    ID Event: <span className="text-white font-mono ml-1">{activeEvent?.id || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Candidates Grid */}
              <div>
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">Daftar Kandidat</h3>
                
                {activeCandidates.length === 0 ? (
                  <div className="glass p-12 rounded-2xl text-center text-gray-500">
                    Belum ada kandidat yang terdaftar untuk event berjalan.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeCandidates.map((candidate) => {
                      const percentage = totalVotes > 0 ? ((candidate.voteCount / totalVotes) * 100).toFixed(1) : '0.0';
                      const isSelected = selectedCandidate === candidate.id;

                      return (
                        <div
                          key={candidate.id}
                          onClick={() => activeEvent?.isActive && setSelectedCandidate(candidate.id)}
                          className={`glass p-5 rounded-2xl cursor-pointer transition-all duration-300 relative overflow-hidden flex flex-col justify-between ${
                            !activeEvent?.isActive ? 'opacity-70 cursor-not-allowed' : 'glass-hover'
                          } ${
                            isSelected 
                              ? 'ring-2 ring-purple-500 border-purple-500/30 bg-purple-500/5' 
                              : ''
                          }`}
                        >
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                                isSelected ? 'bg-purple-500 text-white' : 'bg-white/5 text-gray-400'
                              }`}>
                                {candidate.id + 1}
                              </div>
                              <span className="font-bold text-white text-base md:text-lg">{candidate.name}</span>
                            </div>
                            <span className="text-xs text-gray-400 font-semibold">{percentage}% ({candidate.voteCount} Suara)</span>
                          </div>

                          {/* Progress bar */}
                          <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden mt-6">
                            <div 
                              className="bg-gradient-primary h-full transition-all duration-500" 
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Voting Form Card */}
            <div className="flex flex-col gap-6">
              <div className="glass p-6 rounded-2xl flex flex-col gap-6 sticky top-24">
                <div className="flex items-center gap-2 border-b border-white/5 pb-4">
                  <Shield className="w-5 h-5 text-blue-400" />
                  <h3 className="font-bold text-white text-base">Autentikasi Pemilih</h3>
                </div>

                <form onSubmit={handleVote} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs text-gray-400 font-semibold">Nomor Induk Kependudukan (NIK)</label>
                    <input
                      type="text"
                      maxLength={16}
                      value={nik}
                      onChange={(e) => setNik(e.target.value.replace(/\D/g, ''))}
                      placeholder="Masukkan 16 digit NIK Anda"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-white font-mono placeholder:text-gray-600 transition"
                      disabled={actionLoading || !activeEvent?.isActive}
                    />
                  </div>

                  <div className="p-3 bg-white/5 border border-white/5 rounded-xl text-[11px] text-gray-400 leading-relaxed flex items-start gap-2">
                    <HelpCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                    <span>
                      Identitas NIK Anda akan disamarkan menggunakan fungsi hash kriptografi (<strong>Keccak256</strong>) di sisi browser sebelum dikirim ke smart contract. Kami tidak pernah merekam NIK Anda secara transparan.
                    </span>
                  </div>

                  {voteStatus.type && (
                    <div className={`p-4 rounded-xl text-xs flex items-start gap-2.5 leading-relaxed ${
                      voteStatus.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      voteStatus.type === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                      'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    }`}>
                      {voteStatus.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
                      <span>{voteStatus.message}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={actionLoading || !activeEvent?.isActive}
                    className="w-full py-3.5 bg-gradient-primary rounded-xl font-bold text-white shadow-lg shadow-purple-500/15 hover:shadow-purple-500/30 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:hover:scale-100 disabled:shadow-none transition duration-300 flex items-center justify-center gap-2"
                  >
                    {actionLoading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <Vote className="w-4 h-4" />
                        Kirim Suara
                      </>
                    )}
                  </button>
                </form>

                {/* Footer terms */}
                <div className="text-[10px] text-center text-gray-600 mt-2">
                  Vote3.id &copy; 2026. Powered by Ethereum Local network.
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Tab 2: Admin Panel */}
        {activeTab === 'admin' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Create Event & Configuration */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              
              {/* Active Event Operations */}
              <div className="glass p-6 rounded-2xl flex flex-col gap-4">
                <h3 className="font-bold text-white text-base border-b border-white/5 pb-3">Status Pemilu Saat Ini</h3>
                
                {activeEvent ? (
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <div className="font-bold text-lg text-white">{activeEvent.title}</div>
                      <div className="text-[11px] text-gray-400 mt-1 flex flex-col gap-1">
                        <span>ID Event: <span className="font-mono text-gray-300">{activeEvent.id}</span></span>
                        <span>Owner Kontrak: <span className="font-mono text-gray-300">{adminAddress || 'Mode Simulasi'}</span></span>
                      </div>
                    </div>
                    {activeEvent.isActive ? (
                      <button
                        onClick={handleEndEvent}
                        disabled={actionLoading}
                        className="px-5 py-2.5 bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-500/30 rounded-xl font-semibold text-xs transition duration-200 flex items-center gap-2"
                      >
                        Akhiri Event Pemilu
                      </button>
                    ) : (
                      <span className="px-3 py-1.5 bg-red-950 text-red-400 border border-red-950 rounded-lg text-xs font-bold">
                        Sudah Selesai
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="text-gray-500 text-sm py-4">Tidak ada event voting yang aktif.</div>
                )}
              </div>

              {/* Create New Voting Event Form */}
              <div className="glass p-6 rounded-2xl flex flex-col gap-6">
                <h3 className="font-bold text-white text-base border-b border-white/5 pb-3">Buat Event Pemilu Baru</h3>
                
                <form onSubmit={handleCreateEvent} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs text-gray-400 font-semibold">Judul Event Pemilu</label>
                    <input
                      type="text"
                      value={newEventTitle}
                      onChange={(e) => setNewEventTitle(e.target.value)}
                      placeholder="Contoh: Pemilihan Ketua RT 05 Periode 2026"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-white placeholder:text-gray-600 transition"
                      disabled={actionLoading}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs text-gray-400 font-semibold">Daftar Kandidat</label>
                      <button
                        type="button"
                        onClick={addCandidateField}
                        className="text-xs text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Tambah Kandidat
                      </button>
                    </div>

                    <div className="flex flex-col gap-3">
                      {newEventCandidates.map((candidate, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 font-mono w-4">{idx + 1}.</span>
                          <input
                            type="text"
                            value={candidate}
                            onChange={(e) => handleCandidateNameChange(idx, e.target.value)}
                            placeholder={`Nama Kandidat #${idx + 1}`}
                            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500 text-white placeholder:text-gray-600 transition"
                          />
                          {newEventCandidates.length > 2 && (
                            <button
                              type="button"
                              onClick={() => removeCandidateField(idx)}
                              className="p-2 hover:bg-red-500/10 rounded-lg text-red-500 transition"
                            >
                              <LogOut className="w-4 h-4 rotate-45" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="w-full py-3 bg-gradient-primary rounded-xl font-bold text-white shadow-lg hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:hover:scale-100 transition duration-300"
                  >
                    Mulai & Simpan Event Baru
                  </button>
                </form>
              </div>
            </div>

            {/* Config & Relayer Logs */}
            <div className="flex flex-col gap-6">
              
              {/* Web3 Node Configuration */}
              <div className="glass p-6 rounded-2xl flex flex-col gap-4">
                <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                  <Settings className="w-4 h-4 text-blue-400" />
                  <h3 className="font-bold text-white text-sm">Pengaturan Web3</h3>
                </div>

                <div className="flex flex-col gap-3 text-xs">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-gray-400 font-semibold">RPC Node URL</label>
                    <input
                      type="text"
                      value={rpcUrl}
                      onChange={(e) => setRpcUrl(e.target.value)}
                      className="bg-white/5 border border-white/10 rounded-lg p-2 font-mono text-white"
                    />
                  </div>
                  
                  <div className="flex flex-col gap-1.5">
                    <label className="text-gray-400 font-semibold">Alamat Contract</label>
                    <input
                      type="text"
                      value={contractAddress}
                      onChange={(e) => setContractAddress(e.target.value)}
                      className="bg-white/5 border border-white/10 rounded-lg p-2 font-mono text-white"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-gray-400 font-semibold">Relayer/Operator Wallet Private Key</label>
                    <input
                      type="password"
                      value={operatorKey}
                      onChange={(e) => setOperatorKey(e.target.value)}
                      className="bg-white/5 border border-white/10 rounded-lg p-2 font-mono text-white"
                    />
                    {operatorWallet && (
                      <span className="text-[10px] text-gray-500 font-mono mt-1 break-all">
                        Operator Address: {operatorWallet.address}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Event Logs */}
              <div className="glass p-6 rounded-2xl flex flex-col gap-4 flex-1">
                <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                  <TrendingUp className="w-4 h-4 text-purple-400" />
                  <h3 className="font-bold text-white text-sm">Log Aktivitas Relayer</h3>
                </div>

                <div className="bg-black/40 border border-white/5 rounded-xl p-3 flex-1 overflow-y-auto max-h-[220px] font-mono text-[10px] text-gray-400 flex flex-col gap-1.5 leading-relaxed">
                  {adminLogs.length === 0 ? (
                    <div className="text-gray-600 text-center py-8">Belum ada aktivitas.</div>
                  ) : (
                    adminLogs.map((log, index) => (
                      <div key={index} className="border-b border-white/5 pb-1">
                        {log}
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

          </div>
        )}

      </main>
    </div>
  );
}

export default App;

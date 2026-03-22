"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useStore } from "../../../store/useStore";
import { initSocket, getSocket } from "../../../lib/socketClient";
import { Gavel, Clock, Trophy, ChevronLeft, Hexagon, Wallet, PlayCircle, CheckCircle, ListFilter, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const getNextBid = (currentHighest: number, basePrice: number) => {
  if (!currentHighest || currentHighest === 0) return basePrice;
  if (currentHighest < 1.0) return currentHighest + 0.05;
  if (currentHighest < 2.0) return currentHighest + 0.10;
  if (currentHighest < 3.0) return currentHighest + 0.20;
  return currentHighest + 0.50;
};

const getRoleClass = (role: string) => {
  if (!role) return '';
  if (role.includes('Bat')) return 'role-batsman';
  if (role.includes('Bowl') || role.includes('Pacer')) return 'role-bowler';
  if (role.includes('Wicket')) return 'role-wk';
  if (role.includes('All')) return 'role-allrounder';
  return '';
};

export default function AuctionRoom() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { user } = useStore();
  
  const [auctionState, setAuctionState] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [logs, setLogs] = useState<any[]>([]);
  
  const [mySquad, setMySquad] = useState<any[]>([]);
  const [myPurse, setMyPurse] = useState(100.0);
  const [upcomingLots, setUpcomingLots] = useState<any[]>([]);

  // Animation & UI triggers
  const [hammerActive, setHammerActive] = useState(false);
  const [bidPop, setBidPop] = useState(false);
  const [showLotsModal, setShowLotsModal] = useState(false);
  const [showSquadModal, setShowSquadModal] = useState(false);
  
  const [showActiveVideo, setShowActiveVideo] = useState(false);
  const [revealShake, setRevealShake] = useState(false);

  const fetchSquadAndPurse = async () => {
    if (!user || !id) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_SOCKET_URL}/api/rooms/${id}/squad`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setMySquad(data.squad || []);
        setMyPurse(data.purseBalance || 0);
      }
    } catch (err) { console.error(err); }
  };

  const fetchLots = async () => {
    if (!user || !id) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_SOCKET_URL}/api/rooms/${id}/lots`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setUpcomingLots(data.lots || []);
      }
    } catch(err) { console.error(err); }
  };

  useEffect(() => {
    if (!user) {
      router.replace("/");
      return;
    }

    fetchSquadAndPurse();
    fetchLots();

    const socket = initSocket(user.token);
    socket.emit("join_room", id);

    socket.on("auction_started", (data) => {
      setAuctionState({ ...data, status: "ACTIVE" });
      setShowActiveVideo(true);
      setRevealShake(true);
      setTimeout(() => setRevealShake(false), 500);
      setLogs((prev) => [{ text: `INITIALIZED: ${data.player.name} on block`, type: "info" }, ...prev]);
    });

    socket.on("new_bid_update", (data) => {
      setAuctionState((prev: any) => ({
        ...prev,
        highestBid: data.highestBid,
        highestBidder: data.highestBidder,
        highestBidderTeam: data.highestBidderTeam,
        endTime: data.newEndTime,
        status: "ACTIVE"
      }));
      setLogs((prev) => [{ text: `${data.highestBidderTeam || 'Franchise'} raised ${data.highestBid} Cr`, type: "bid" }, ...prev]);
      
      setBidPop(true);
      setTimeout(() => setBidPop(false), 300);
    });

    socket.on("auction_ended", (data) => {
      setAuctionState((prev: any) => ({ ...prev, status: "ENDED", finalState: data }));
      
      if (data.status === "SOLD") {
        setLogs((prev) => [{ text: `SOLD: ${data.player} \u2192 ${data.soldToTeam} (${data.amount} Cr)`, type: "sold" }, ...prev]);
        setHammerActive(true);
        setTimeout(() => setHammerActive(false), 800);
      } else {
        setLogs((prev) => [{ text: `UNSOLD: ${data.player} retracted`, type: "unsold" }, ...prev]);
      }
      
      fetchSquadAndPurse();
      fetchLots(); 
    });

    socket.on("auction_finished", (data) => {
      setAuctionState((prev: any) => ({ ...prev, status: "COMPLETED" }));
      setLogs((prev) => [{ text: `END OF SYSTEM: ${data.message}`, type: "success" }, ...prev]);
    });

    socket.on("auction_error", (data) => {
      setLogs((prev) => [{ text: `SYSTEM HALT: ${data.message}`, type: "error" }, ...prev]);
    });

    return () => {
      socket.off("auction_started");
      socket.off("new_bid_update");
      socket.off("auction_ended");
      socket.off("auction_finished");
      socket.off("auction_error");
    };
  }, [id, user]);

  useEffect(() => {
    if (showActiveVideo && auctionState?.status === "ACTIVE") {
      const timer = setTimeout(() => setShowActiveVideo(false), 3500);
      return () => clearTimeout(timer);
    }
  }, [showActiveVideo, auctionState?.status]);

  useEffect(() => {
    if (!auctionState?.endTime || auctionState.status !== "ACTIVE") return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((auctionState.endTime - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining === 0) clearInterval(interval);
    }, 1000);

    return () => clearInterval(interval);
  }, [auctionState?.endTime, auctionState?.status]);

  const handleBid = () => {
    const socket = getSocket();
    if (socket) {
      socket.emit("place_bid", { roomId: id });
    }
  };

  const startMegaDraft = () => {
    const socket = getSocket();
    if (socket) {
      socket.emit("start_auction", { roomId: id });
    }
  };

  // Group by Price Slab for the Modal
  const groupedByPrice = useMemo(() => {
    const groups: { [key: string]: any[] } = {};
    upcomingLots.forEach(p => {
      const priceStr = Number(p.basePrice).toFixed(2);
      if (!groups[priceStr]) groups[priceStr] = [];
      groups[priceStr].push(p);
    });
    return Object.entries(groups).sort((a,b) => Number(b[0]) - Number(a[0]));
  }, [upcomingLots]);

  if (!user) return null;

  const currentBid = Number(auctionState?.highestBid) || 0;
  const basePrice = Number(auctionState?.player?.basePrice) || 0;
  const nextTargetBid = getNextBid(currentBid, basePrice).toFixed(2);
  const isWinning = auctionState?.highestBidder === user.id;

  const currentSquadCount = mySquad.length;
  const reservedSlots = Math.max(0, 15 - currentSquadCount - 1);
  const requiredReserve = reservedSlots * 0.20;
  const maxAllowedCapacity = myPurse - requiredReserve;
  
  const isCapped = currentSquadCount >= 25;
  const isBankrupt = Number(nextTargetBid) > maxAllowedCapacity;

  const roles = ["Batsman", "Bowler", "Pacer", "Wicketkeeper", "All-Rounder"];

  return (
    <motion.div 
      className="arena-container"
      animate={revealShake ? { 
        x: [-15, 15, -10, 10, -5, 5, 0], 
        y: [15, -15, 10, -10, 5, -5, 0],
        filter: ["brightness(1.5)", "brightness(1)", "brightness(1)"]
      } : { x: 0, y: 0, filter: "brightness(1)" }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
    >
      {/* FULLSCREEN LUMA AI VIDEO INTERRUPTS */}
      <AnimatePresence>
        {auctionState?.status === "ENDED" && (
          <motion.div
            key="fullscreen-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", zIndex: 99999, backgroundColor: "black", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}
          >
            <video 
              src={auctionState.finalState?.status === "SOLD" ? "/sold.mp4" : "/unsold.mp4"} 
              autoPlay muted playsInline 
              style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", opacity: auctionState.finalState?.status === "SOLD" ? 0.35 : 1 }} 
            />
            
            {auctionState.finalState?.status === "SOLD" && (
              <motion.div 
                initial={{ scale: 3, opacity: 0, filter: "blur(20px)" }}
                animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
                transition={{ type: "spring", stiffness: 150, damping: 10 }}
                style={{ position: "relative", zIndex: 10, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}
              >
                <Gavel size={120} color="var(--primary)" strokeWidth={1} style={{ marginBottom: "30px", filter: "drop-shadow(0px 0px 30px rgba(0, 240, 255, 0.5))" }} />
                <h1 style={{ fontSize: "100px", fontWeight: "900", color: "white", margin: 0, letterSpacing: "10px", lineHeight: "1" }}>SOLD</h1>
                <h2 style={{ fontSize: "50px", fontWeight: "300", color: "var(--primary)", marginTop: "20px", letterSpacing: "2px" }}>{auctionState.finalState?.player}</h2>
                <div style={{ padding: "20px 40px", background: "rgba(0,0,0,0.5)", border: "1px solid var(--primary)", borderRadius: "100px", marginTop: "40px", backdropFilter: "blur(10px)" }}>
                  <p style={{ fontSize: "24px", color: "var(--text-muted)", margin: 0 }}>
                    Acquired by <span style={{ color: "white", fontWeight: "700" }}>{auctionState.finalState?.soldToTeam}</span> for <span className="glow-gold" style={{ fontSize: "36px", fontWeight: "900", marginLeft: "10px" }}>{Number(auctionState.finalState?.amount).toFixed(2)} Cr</span>
                  </p>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* LEFT COLUMN: Controls & Logs */}
      <div style={{ display: "flex", flexDirection: "column", gap: "20px", height: "100%" }}>
        <button onClick={() => router.push("/dashboard")} className="btn-danger" style={{ width: "fit-content", display: "flex", alignItems: "center", gap: "8px", height: "40px" }}>
          <ChevronLeft size={16} /> RETURN
        </button>

        <div className="card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "15px" }}>
          <h3 style={{ color: "var(--text-muted)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "2px", fontWeight: "700" }}>Forecast Database</h3>
          <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>Current athletes remaining in the unassigned global pool: <span style={{ color: "white", fontWeight: "700" }}>{upcomingLots.length}</span></p>
          <button onClick={() => setShowLotsModal(true)} className="btn-primary" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
            <ListFilter size={18} /> OPEN FORECAST MODAL
          </button>
        </div>

        <div className="card" style={{ padding: "20px", flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <h3 style={{ color: "var(--text-muted)", marginBottom: "16px", fontSize: "11px", textTransform: "uppercase", letterSpacing: "2px", fontWeight: "700" }}>System Logs</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", overflowY: "auto", paddingRight: "5px" }}>
            {logs.map((l, i) => (
              <div key={i} className="animate-fade-in" style={{ 
                padding: "8px 0", 
                borderBottom: "1px solid var(--border)",
                color: l.type === 'error' ? 'var(--danger)' : l.type === 'sold' || l.type === 'success' ? 'var(--primary)' : 'var(--text-muted)'
              }}>
                <span style={{ fontSize: "12px", fontWeight: '500', letterSpacing: "0.5px" }}>{l.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CENTER COLUMN: The Stage */}
      <div className="card" style={{ display: "flex", flexDirection: "column", position: "relative", overflow: "hidden", border: "1px solid var(--border)" }}>
        <div style={{ padding: "20px 30px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: "14px", fontWeight: "700", letterSpacing: "3px", textTransform: "uppercase", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "8px" }}>
            <Hexagon size={16} /> Arena Matrix
          </h2>
          {auctionState?.status === "ACTIVE" && <span className="badge-live">LIVE</span>}
        </div>

        {/* ACTIVE PLAYER BACKGROUND VIDEO */}
        <AnimatePresence>
          {auctionState?.status === "ACTIVE" && showActiveVideo && (
            <motion.video 
              key="active-bg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.25 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
              src="/active.mp4" 
              autoPlay 
              muted 
              loop 
              playsInline 
              style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0, pointerEvents: "none" }} 
            />
          )}
        </AnimatePresence>

        <div style={{ padding: "40px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, position: "relative", zIndex: 10 }}>
          <AnimatePresence mode="wait">
            {auctionState && (auctionState.status === "ACTIVE" || auctionState.status === "ENDED") && (
              <motion.div 
                key={auctionState.player?.name || auctionState.finalState?.player + auctionState.status}
                initial={{ opacity: 0, scale: 0.95, filter: "blur(5px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                style={{ width: "100%", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}
              >
                
                <motion.h1 
                  initial={{ opacity: 0, scale: 3, filter: "blur(20px)" }}
                  animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                  transition={{ delay: 0.1, duration: 0.5, type: "spring", stiffness: 150 }}
                  style={{ fontSize: "64px", marginBottom: "0px", fontWeight: "300", color: "var(--primary)", letterSpacing: "2px", lineHeight: "1.1", textShadow: "0px 0px 30px rgba(0, 240, 255, 0.4)" }}
                >
                  {auctionState.player?.name || auctionState.finalState?.player}
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className={getRoleClass(auctionState.player?.role)} 
                  style={{ fontSize: "16px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "4px", marginBottom: "50px", marginTop: "10px" }}
                >
                  {auctionState.player?.role || "SYSTEM"} <span style={{ padding: "0 12px", color: "var(--border)", fontWeight: "300" }}>|</span> <span style={{ color: "var(--text-muted)" }}>{auctionState.player?.team || "END"}</span>
                </motion.p>

                {auctionState.status === "ACTIVE" ? (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div className="auction-stats-grid">
                      <div style={{ padding: "20px", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                        <p style={{ color: "var(--text-muted)", fontSize: "11px", fontWeight: "700", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "12px" }}>Base Price</p>
                        <p style={{ fontSize: "32px", fontWeight: "400", color: "var(--primary)" }}>{Number(auctionState.player?.basePrice).toFixed(2)} <span style={{ fontSize: "14px", fontWeight: "300" }}>Cr</span></p>
                      </div>
                      
                      <div className={bidPop ? "pop-in" : ""} style={{ padding: "20px", display: "flex", flexDirection: "column", alignItems: "center", borderRight: "1px solid var(--border)" }}>
                        <p style={{ color: "var(--text-muted)", fontSize: "11px", fontWeight: "700", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "12px" }}>Current Bid</p>
                        <p className="glow-cyan" style={{ fontSize: "56px", fontWeight: "700", lineHeight: "1" }}>
                          {auctionState.highestBid || 0} <span style={{ fontSize: "20px", fontWeight: "300", color: "var(--text-muted)" }}>Cr</span>
                        </p>
                        {auctionState.highestBidderTeam && (
                          <div style={{ marginTop: "12px", display: "inline-block", padding: "6px 16px", border: `1px solid ${isWinning ? "var(--primary)" : "var(--border)"}`, color: isWinning ? "var(--bg-main)" : "var(--text-muted)", background: isWinning ? "var(--primary)" : "transparent", fontSize: "11px", fontWeight: "700", letterSpacing: "1px", textTransform: "uppercase" }}>
                            {isWinning ? "Holding Matrix" : auctionState.highestBidderTeam}
                          </div>
                        )}
                      </div>

                      <div style={{ padding: "20px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
                        <p style={{ color: "var(--text-muted)", fontSize: "11px", fontWeight: "700", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "12px" }}>Timeout</p>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: timeLeft <= 5 ? "var(--danger)" : "var(--primary)" }}>
                          <span style={{ fontSize: "40px", fontWeight: "400", fontVariantNumeric: "tabular-nums", lineHeight: "1" }}>00:{timeLeft.toString().padStart(2, '0')}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", width: "100%", maxWidth: "400px" }}>
                      <button 
                        onClick={handleBid} 
                        className="btn-primary" 
                        disabled={isWinning || isCapped || isBankrupt} 
                        style={{ width: "100%", height: "64px", fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", opacity: (isWinning || isCapped || isBankrupt) ? 0.3 : 1, cursor: (isWinning || isCapped || isBankrupt) ? "not-allowed" : "pointer" }}>
                        <Gavel size={20} /> 
                        {isWinning ? "AWAITING CHALLENGERS" : isCapped ? "25/25 ROSTER MAXED" : isBankrupt ? "INSUFFICIENT CAPITAL" : `AUTHORIZE ${nextTargetBid} Cr`}
                      </button>
                      {(isBankrupt && !isCapped) && (
                        <p style={{ fontSize: "11px", color: "var(--danger)", marginTop: "5px", letterSpacing: "1px" }}>Need {(requiredReserve).toFixed(2)} Cr in reserve for min. 15 players.</p>
                      )}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    initial={auctionState.finalState?.status === "UNSOLD" ? { opacity: 0, filter: "grayscale(100%) brightness(50%)" } : { opacity: 0, scale: 0.8 }}
                    animate={auctionState.finalState?.status === "UNSOLD" ? { opacity: 1, filter: "grayscale(100%) brightness(100%)" } : { opacity: 1, scale: 1 }}
                    transition={{ type: "spring", stiffness: 100 }}
                    style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px", position: "relative", overflow: "hidden", borderRadius: "12px" }}
                  >
                    <motion.div 
                      key={auctionState.finalState?.status}
                      initial={auctionState.finalState?.status === "SOLD" ? { rotate: -40, scale: 1.5, opacity: 0 } : { y: -50, scale: 2, opacity: 0 }}
                      animate={auctionState.finalState?.status === "SOLD" ? { rotate: 0, scale: 1, opacity: 1 } : { y: 0, scale: 1, opacity: 1 }}
                      transition={auctionState.finalState?.status === "SOLD" ? { type: "spring", stiffness: 300, bounce: 0.6 } : { type: "spring", stiffness: 400, bounce: 0 }}
                      style={{ marginBottom: "30px", color: auctionState.finalState?.status === "SOLD" ? "var(--primary)" : "var(--danger)" }}
                    >
                      <Gavel size={100} strokeWidth={1} />
                    </motion.div>
                    
                    <h2 style={{ fontSize: "40px", fontWeight: "900", letterSpacing: "10px", color: auctionState.finalState?.status === "SOLD" ? "var(--primary)" : "var(--danger)", textTransform: "uppercase", marginBottom: "10px" }}>
                      {auctionState.finalState?.status}
                    </h2>
                    
                    {auctionState.finalState?.status === "SOLD" ? (
                      <p style={{ fontSize: "14px", color: "var(--text-muted)", letterSpacing: "1px", zIndex: 10 }}>
                        Allocated to <span style={{ color: "var(--primary)", fontWeight: "600" }}>{auctionState.finalState?.soldToTeam}</span> for <span className="glow-gold" style={{ fontSize: "18px" }}>{auctionState.finalState?.amount} Cr</span>
                      </p>
                    ) : (
                      <p style={{ fontSize: "14px", color: "var(--border)", letterSpacing: "1px", zIndex: 10 }}>Player retracted into unused database pool</p>
                    )}
                    <p style={{ fontSize: "11px", color: "var(--border)", letterSpacing: "2px", textTransform: "uppercase", marginTop: "40px", zIndex: 10 }}>System loading next lot...</p>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
            {(!auctionState || (auctionState.status !== "ACTIVE" && auctionState.status !== "ENDED")) && (
              <motion.div 
                key="system-idle"
                initial={{ opacity: 0, scale: 0.9 }} 
                animate={{ opacity: 1, scale: 1 }} 
                exit={{ opacity: 0, filter: "blur(10px)" }}
                transition={{ duration: 0.4 }}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1 }}
              >
                {auctionState?.status === "COMPLETED" ? (
                  <>
                    <div style={{ marginBottom: "30px" }}>
                      <CheckCircle size={60} color="var(--primary)" strokeWidth={1} />
                    </div>
                    <h2 style={{ fontSize: "24px", color: "var(--primary)", fontWeight: "300", textAlign: "center", letterSpacing: "4px" }}>DRAFT SYSTEM SHUTDOWN</h2>
                    <p style={{ color: "var(--text-muted)", marginTop: "12px", fontSize: "13px", textAlign: "center", letterSpacing: "1px" }}>All entries distributed.</p>
                  </>
                ) : (
                  <>
                    <Hexagon size={60} style={{ marginBottom: "30px", color: "var(--border)" }} strokeWidth={1} />
                    <h2 style={{ fontSize: "20px", color: "var(--text-muted)", fontWeight: "400", letterSpacing: "2px", marginBottom: "40px" }}>SYSTEM IDLE</h2>
                    
                    <button onClick={startMegaDraft} className="btn-accent" style={{ width: "240px" }}>
                      EXECUTE START
                    </button>
                  </>
                )}
              </motion.div>
            )}
        </div>
      </div>

      {/* RIGHT COLUMN: Live Roster & Wallet */}
      <div className="card" style={{ padding: "20px", display: "flex", flexDirection: "column", height: "100%" }}>
        <h3 style={{ color: "var(--text-muted)", marginBottom: "16px", fontSize: "11px", textTransform: "uppercase", letterSpacing: "2px", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px" }}>
          <Wallet size={14} /> Matrix Wallet
        </h3>
        
        <div style={{ padding: "20px", borderBottom: "1px solid var(--border)", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "700", textTransform: "uppercase", letterSpacing: "2px" }}>REMAINING</span>
          <span className="glow-emerald" style={{ fontSize: "32px", fontWeight: "400" }}>{Number(myPurse).toFixed(2)} <span style={{fontSize: "12px", fontWeight: "600", opacity: 0.6}}>CR</span></span>
        </div>

        <h3 style={{ color: "var(--text-muted)", marginBottom: "16px", fontSize: "11px", textTransform: "uppercase", letterSpacing: "2px", fontWeight: "700" }}>OBTAINED ASSETS</h3>
        
        <div style={{ padding: "15px", background: "var(--bg-main)", borderRadius: "8px", border: "1px solid var(--border)", marginBottom: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", letterSpacing: "1px" }}>Active Franchise Roster: <span style={{ color: "white", fontWeight: "700" }}>{mySquad.length} / 25</span></p>
          <button onClick={() => setShowSquadModal(true)} className="btn-primary" style={{ width: "100%", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", height: "40px" }}>
            <Hexagon size={16} /> VIEW FULL ROSTER
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "15px", overflowY: "auto", paddingRight: "5px", flex: 1 }}>
          {roles.map(role => {
            const playersInRole = mySquad.filter(s => s.player.role.includes(role));
            if (playersInRole.length === 0) return null;
            return (
              <div key={role}>
                <h4 className={getRoleClass(role)} style={{ fontSize: "10px", textTransform: "uppercase", marginBottom: "8px", letterSpacing: "2px", borderBottom: "1px solid var(--border)", paddingBottom: "6px" }}>
                  {role} [{playersInRole.length}]
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {playersInRole.map(s => (
                    <div key={s.id} className="animate-fade-in" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px dashed #27272a", paddingBottom: "4px" }}>
                      <div>
                        <p style={{ fontSize: "12px", fontWeight: "400", color: "var(--text-main)", letterSpacing: "0.5px" }}>{s.player.name}</p>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <p className="glow-gold" style={{ fontSize: "12px", fontWeight: "700" }}>{Number(s.boughtFor).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {mySquad.length === 0 && (
            <div style={{ padding: "30px 10px", textAlign: "center" }}>
              <p style={{ color: "var(--border)", fontSize: "12px", letterSpacing: "1px" }}>NO ASSETS</p>
            </div>
          )}
        </div>
      </div>

      {/* FORECAST MODAL */}
      {showLotsModal && (
        <div className="modal-overlay" onClick={() => setShowLotsModal(false)}>
          <div className="modal-content animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px", borderBottom: "1px solid var(--border)", paddingBottom: "20px" }}>
              <h2 style={{ fontSize: "24px", fontWeight: "300", letterSpacing: "2px", color: "var(--primary)" }}>UPCOMING DRAFT SECTIONS</h2>
              <button className="btn-accent" onClick={() => setShowLotsModal(false)} style={{ padding: "8px", height: "auto" }}><X size={20} /></button>
            </div>

            <div style={{ display: "grid", gap: "30px" }}>
              {groupedByPrice.map(([price, slabPlayers]) => (
                <div key={price} style={{ background: "var(--bg-main)", borderRadius: "8px", border: "1px solid var(--border)", padding: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "20px", borderBottom: "1px solid var(--border)", paddingBottom: "10px" }}>
                    <h3 style={{ fontSize: "28px", color: "var(--primary)", fontWeight: "300" }}>
                      <span className="glow-gold">{price}</span> <span style={{ fontSize: "16px", color: "var(--text-muted)" }}>Cr Prize Slab</span>
                    </h3>
                    <span style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: "600", letterSpacing: "1px" }}>{slabPlayers.length} PLAYERS</span>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "10px" }}>
                    {slabPlayers.map((p: any) => (
                      <div key={p.id} style={{ display: "flex", flexDirection: "column", padding: "12px", background: "var(--bg-card-hover)", borderRadius: "6px", border: "1px solid var(--border)" }}>
                        <span style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-main)", marginBottom: "4px" }}>{p.name} <span style={{ fontSize: "10px", color: "var(--text-muted)", marginLeft: "4px" }}>({p.team})</span></span>
                        <span className={getRoleClass(p.role)} style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px" }}>{p.role}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {groupedByPrice.length === 0 && (
                <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "15px", padding: "40px" }}>All sections empty.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SQUAD ROSTER MODAL */}
      {showSquadModal && (
        <div className="modal-overlay" onClick={() => setShowSquadModal(false)}>
          <div className="modal-content animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px", borderBottom: "1px solid var(--border)", paddingBottom: "20px" }}>
              <div>
                <h2 style={{ fontSize: "24px", fontWeight: "300", letterSpacing: "2px", color: "var(--primary)" }}>YOUR FRANCHISE ROSTER</h2>
                <p style={{ color: "var(--text-muted)", fontSize: "13px", marginTop: "5px" }}>Current Team Composition & Acquisitions</p>
              </div>
              <button className="btn-accent" onClick={() => setShowSquadModal(false)} style={{ padding: "8px", height: "auto" }}><X size={20} /></button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px" }}>
              {roles.map(role => {
                const playersInRole = mySquad.filter(s => s.player.role.includes(role));
                if (playersInRole.length === 0) return null;
                return (
                  <div key={role} style={{ background: "var(--bg-main)", borderRadius: "8px", border: "1px solid var(--border)", padding: "20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "15px", borderBottom: "1px solid var(--border)", paddingBottom: "10px" }}>
                      <h3 className={getRoleClass(role)} style={{ fontSize: "16px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "2px" }}>
                        {role}
                      </h3>
                      <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "600" }}>{playersInRole.length} PLAYERS</span>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {playersInRole.map(s => (
                        <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", background: "var(--bg-card-hover)", borderRadius: "6px", border: "1px solid var(--border)" }}>
                          <span style={{ fontSize: "14px", fontWeight: "600", color: "var(--primary)" }}>{s.player.name}</span>
                          <span className="glow-gold" style={{ fontSize: "15px", fontWeight: "700" }}>{Number(s.boughtFor).toFixed(2)} Cr</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              {mySquad.length === 0 && (
                <div style={{ gridColumn: "span 2", textAlign: "center", color: "var(--text-muted)", padding: "40px" }}>
                  <p style={{ fontSize: "16px", letterSpacing: "1px" }}>You have not secured any assets yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </motion.div>
  );
}

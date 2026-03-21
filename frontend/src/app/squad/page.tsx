"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "../../store/useStore";
import { ChevronLeft, ShieldCheck, UserCircle } from "lucide-react";

export default function SquadBuilder() {
  const { user } = useStore();
  const router = useRouter();
  const [squad, setSquad] = useState<any[]>([]);

  useEffect(() => {
    if (!user) {
      router.replace("/");
      return;
    }
  }, [user]);

  const togglePlaying11 = async (playerId: string, currentState: boolean) => {
    // Scaffolded for later API linkage
    // setSquad(prev => prev.map(p => p.id === playerId ? {...p, isInPlaying11: !currentState} : p))
  };

  const playingCount = squad.filter(p => p.isInPlaying11).length;

  if (!user) return null;

  return (
    <div style={{ padding: "40px", maxWidth: "1000px", margin: "0 auto", minHeight: "100vh" }}>
      <button onClick={() => router.push("/dashboard")} className="premium-btn" style={{ background: "transparent", border: "1px solid var(--glass-border)", display: "flex", alignItems: "center", gap: "8px", marginBottom: "30px", boxShadow: "none" }}>
        <ChevronLeft size={18} /> Back to Dashboard
      </button>

      <div className="glass-panel" style={{ padding: "40px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
          <div>
            <h1 className="neon-text" style={{ fontSize: "32px", display: "flex", alignItems: "center", gap: "10px" }}>
              <ShieldCheck size={32} color="var(--primary-glow)"/> Active Roster
            </h1>
            <p style={{ color: "var(--text-muted)", marginTop: "10px", fontSize: "16px" }}>Select exactly 11 players to formulate your active tournament squad.</p>
          </div>
          <div style={{ textAlign: "center", padding: "15px 30px", background: "rgba(0,240,255,0.05)", border: "1px solid var(--primary-glow)", borderRadius: "15px", boxShadow: "0 0 20px rgba(0, 240, 255, 0.1)" }}>
            <p style={{ color: "var(--primary-glow)", fontSize: "12px", textTransform: "uppercase", letterSpacing: "2px", fontWeight: "bold" }}>Playing 11</p>
            <p className="neon-text" style={{ fontSize: "36px", fontWeight: "bold" }}>{playingCount} / 11</p>
          </div>
        </div>

        <div style={{ display: "grid", gap: "15px" }}>
          {squad.length === 0 ? (
            <div style={{ textAlign: "center", padding: "50px", color: "var(--text-muted)", fontStyle: "italic", fontSize: "16px" }}>
              You haven't drafted any players yet. Enter an arena to begin your auction!
            </div>
          ) : (
            squad.map((player) => (
              <div key={player.id} className="animate-fade-in" style={{ 
                display: "flex", justifyContent: "space-between", alignItems: "center", 
                padding: "20px", background: "rgba(0,0,0,0.3)", borderRadius: "12px",
                borderLeft: player.isInPlaying11 ? "4px solid var(--primary-glow)" : "4px solid transparent"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                  <UserCircle size={40} color={player.isInPlaying11 ? "var(--primary-glow)" : "var(--text-muted)"} />
                  <div>
                    <h3 style={{ fontSize: "20px", color: "white" }}>{player.name}</h3>
                    <p style={{ color: "var(--text-muted)", fontSize: "14px", marginTop: "5px" }}>{player.role} • Bought for {player.boughtFor} Cr</p>
                  </div>
                </div>
                <button 
                  onClick={() => togglePlaying11(player.id, player.isInPlaying11)}
                  className="premium-btn" 
                  style={{ 
                    background: player.isInPlaying11 ? "transparent" : "linear-gradient(90deg, #7000ff, #00f0ff)",
                    boxShadow: player.isInPlaying11 ? "none" : "0 0 15px rgba(0, 240, 255, 0.4)",
                    border: player.isInPlaying11 ? "1px solid var(--primary-glow)" : "none",
                    color: player.isInPlaying11 ? "var(--primary-glow)" : "white"
                  }}
                >
                  {player.isInPlaying11 ? "BENCH PLAYER" : "MOVE TO PLAYING 11"}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

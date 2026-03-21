"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "../../store/useStore";
import { LogOut, Plus, Users, LayoutDashboard, Flag, Hexagon, Trash2 } from "lucide-react";

export default function Dashboard() {
  const { user, setUser } = useStore();
  const router = useRouter();
  const [globalRooms, setGlobalRooms] = useState<any[]>([]);
  const [myRooms, setMyRooms] = useState<any[]>([]);
  
  const [showCreate, setShowCreate] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [roomType, setRoomType] = useState("GLOBAL");
  const [passcode, setPasscode] = useState("");
  const [teamName, setTeamName] = useState("");
  
  // State for manual Join By Code
  const [joinCode, setJoinCode] = useState("");
  
  // Dynamic State for joining active clicked rooms
  const [joinRoomId, setJoinRoomId] = useState<string | null>(null);
  const [joinTeamName, setJoinTeamName] = useState("");
  const [joinPasscode, setJoinPasscode] = useState("");

  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!user) {
      router.replace("/");
      return;
    }
    fetchRooms();
  }, [user]);

  const fetchRooms = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_SOCKET_URL}/api/rooms`, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      const data = await res.json();
      setGlobalRooms(data.globalRooms || []);
      setMyRooms(data.myRooms || []);
    } catch (err) {
      console.error(err);
    }
  };

  const createRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_SOCKET_URL}/api/rooms`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.token}`
        },
        body: JSON.stringify({ name: roomName, type: roomType, passcode, teamName })
      });
      const data = await res.json();
      if (res.ok) {
        setShowCreate(false);
        fetchRooms();
        router.push(`/room/${data.id}`);
      } else {
        setErrorMsg(data.message || "Error creating room");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const submitJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if we are joining via typing a code directly, or clicking a room on the list
    const targetRoomId = joinCode.trim() !== "" ? joinCode : joinRoomId;
    if (!targetRoomId) return;

    setErrorMsg("");
    
    try {
      const res = await fetch(`http://localhost:3001/api/rooms/${targetRoomId}/join`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.token}`
        },
        body: JSON.stringify({ passcode: joinPasscode, teamName: joinTeamName })
      });
      const data = await res.json();
      
      if (res.ok) {
        // Backend now returns the absolute UUID if they joined by Code
        router.push(`/room/${data.roomUser.roomId}`);
      } else {
        setErrorMsg(data.message || "Error joining room");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteRoom = async (roomId: string) => {
    if (!window.confirm("Are you sure you want to permanently dissolve this Matrix?")) return;
    try {
      const res = await fetch(`http://localhost:3001/api/rooms/${roomId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      if (res.ok) {
        fetchRooms();
      } else {
        const data = await res.json();
        setErrorMsg(data.message || "Error deleting Matrix");
      }
    } catch(err) { console.error(err); }
  };

  const logout = () => {
    setUser(null);
    router.replace("/");
  };

  if (!user) return null;

  return (
    <div style={{ padding: "40px", maxWidth: "1200px", margin: "0 auto" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "40px", borderBottom: "1px solid var(--border)", paddingBottom: "20px" }}>
        <h1 style={{ fontSize: "28px", display: "flex", alignItems: "center", gap: "10px", fontWeight: "800" }}>
          <LayoutDashboard size={28} color="var(--primary)"/> Auction Central
        </h1>
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div style={{ color: "var(--text-muted)", fontSize: "15px" }}>
            Account: <span style={{ color: "white", fontWeight: "600" }}>{user.username}</span>
          </div>
          <button onClick={logout} className="btn-danger" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </header>

      {errorMsg && (
        <div style={{ background: "var(--danger)", color: "white", padding: "12px 20px", borderRadius: "8px", marginBottom: "20px", fontWeight: "600" }}>
          {errorMsg}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "30px" }}>
        {/* Actions Sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          
          <div className="card" style={{ padding: "24px" }}>
            <h2 style={{ marginBottom: "15px", fontSize: "16px", fontWeight: "700" }}>Connect Direct Link</h2>
            <form onSubmit={submitJoinRoom} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <input type="text" placeholder="6-Digit Room Code" className="input-field" style={{ textTransform: "uppercase", fontSize: "20px", letterSpacing: "2px", fontWeight: "700", textAlign: "center" }} value={joinCode} onChange={e => setJoinCode(e.target.value)} required />
              <input type="text" placeholder="Your Franchise Name" className="input-field" value={joinTeamName} onChange={e => setJoinTeamName(e.target.value)} required />
              <input type="password" placeholder="Passcode (Optional)" className="input-field" value={joinPasscode} onChange={e => setJoinPasscode(e.target.value)} />
              <button type="submit" className="btn-primary" style={{ marginTop: "5px" }}>JOIN DRAFT</button>
            </form>
          </div>

          <div className="card" style={{ padding: "24px" }}>
            <h2 style={{ marginBottom: "15px", fontSize: "16px", fontWeight: "700" }}>Host a New Draft</h2>
            <button onClick={() => setShowCreate(!showCreate)} className="btn-accent" style={{ width: "100%", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px" }}>
              <Plus size={18} /> CREATE ROOM
            </button>

            {showCreate && (
              <form onSubmit={createRoom} className="animate-fade-in" style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
                <input type="text" placeholder="Room Name" className="input-field" value={roomName} onChange={e => setRoomName(e.target.value)} required />
                <input type="text" placeholder="Your Franchise Name" className="input-field" value={teamName} onChange={e => setTeamName(e.target.value)} required />
                <select className="input-field" value={roomType} onChange={e => setRoomType(e.target.value)}>
                  <option value="GLOBAL">Global (Public)</option>
                  <option value="PRIVATE">Private (Passcode Secured)</option>
                </select>
                {roomType === "PRIVATE" && (
                  <input type="text" placeholder="Secret Passcode" className="input-field" value={passcode} onChange={e => setPasscode(e.target.value)} required />
                )}
                <button type="submit" className="btn-primary" style={{ marginTop: "5px", background: "linear-gradient(135deg, var(--accent), #D97706)" }}>DEPLOY HOST SERVER</button>
              </form>
            )}
          </div>
        </div>

        {/* Arenas List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
          
          {/* Active Join Selection Modal */}
          {joinRoomId && !joinCode && (
            <div className="card animate-fade-in" style={{ padding: "20px", borderLeft: "4px solid var(--accent)" }}>
              <h3 style={{ marginBottom: "15px" }}>Join Room Configuration</h3>
              <form onSubmit={submitJoinRoom} style={{ display: "flex", gap: "10px" }}>
                <input type="text" placeholder="Your Franchise Name" className="input-field" value={joinTeamName} onChange={e => setJoinTeamName(e.target.value)} required />
                <input type="password" placeholder="Passcode (if required)" className="input-field" value={joinPasscode} onChange={e => setJoinPasscode(e.target.value)} />
                <button type="submit" className="btn-primary" style={{ whiteSpace: "nowrap" }}>CONFIRM JOIN</button>
                <button type="button" onClick={() => setJoinRoomId(null)} className="btn-danger" style={{ height: "48px" }}>CANCEL</button>
              </form>
            </div>
          )}

          <div>
            <h2 style={{ marginBottom: "15px", display: "flex", alignItems: "center", gap: "10px", fontSize: "20px", fontWeight: "700" }}>
              <Users size={20} color="var(--primary)" /> Public Lobbies
            </h2>
            <div style={{ display: "grid", gap: "12px" }}>
              {globalRooms.map(r => (
                <div key={r.id} className="card" style={{ padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                      <h3 style={{ fontSize: "18px", color: "white" }}>{r.name}</h3>
                      <span className="badge">{r.status}</span>
                    </div>
                    <p style={{ fontSize: "14px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ color: "var(--primary)", fontWeight: "600" }}>Code: {r.code}</span>
                      <span style={{ color: "var(--border)" }}>|</span>
                      <span style={{ color: r._count.users >= 10 ? "var(--danger)" : "var(--success)"}}>{r._count.users} / 10</span> Franchises Validated
                    </p>
                  </div>
                  <button 
                    disabled={r._count.users >= 10}
                    onClick={() => { setJoinRoomId(r.id); setJoinCode(""); }} 
                    className="btn-primary" 
                    style={{ padding: "8px 20px", fontSize: "14px", opacity: r._count.users >= 10 ? 0.5 : 1 }}>
                    {r._count.users >= 10 ? "LOBBY FULL" : "ENTER DRAFT"}
                  </button>
                </div>
              ))}
              {globalRooms.length === 0 && (
                <div className="card" style={{ padding: "30px", textAlign: "center", color: "var(--text-muted)" }}>
                  No active public lobbies.
                </div>
              )}
            </div>
          </div>

          <div>
            <h2 style={{ marginBottom: "15px", display: "flex", alignItems: "center", gap: "10px", fontSize: "20px", fontWeight: "700" }}>
              <Flag size={20} color="var(--accent)" /> My Active Rosters
            </h2>
            <div style={{ display: "grid", gap: "12px" }}>
              {myRooms.map(r => (
                <div key={r.id} className="card" style={{ padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderLeft: "4px solid var(--accent)" }}>
                  <div>
                    <h3 style={{ fontSize: "18px", marginBottom: "8px", color: "white" }}>{r.name}</h3>
                    <p style={{ fontSize: "14px", color: "var(--text-muted)" }}>Code: <span style={{ color: "var(--primary)", fontWeight: "600" }}>{r.code}</span></p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <button onClick={() => router.push(`/room/${r.id}`)} className="btn-accent" style={{ padding: "8px 20px", fontSize: "14px" }}>
                      RESUME
                    </button>
                    {r.adminId === user.id && (
                      <button onClick={() => deleteRoom(r.id)} className="btn-danger" style={{ padding: "8px", height: "auto" }} title="Dissolve Matrix">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {myRooms.length === 0 && (
                <div className="card" style={{ padding: "30px", textAlign: "center", color: "var(--text-muted)" }}>
                  You have not joined any lobbies.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

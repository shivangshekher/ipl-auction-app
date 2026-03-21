"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "../store/useStore";
import { Trophy } from "lucide-react";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const setUser = useStore((state) => state.setUser);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (phone.length < 10) {
      setError("Phone number must be at least 10 digits");
      return;
    }

    const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
    const payload = isLogin ? { phone, password } : { username, phone, password };

    try {
      const res = await fetch(`http://localhost:3001${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Failed to authenticate");

      setUser({ id: data.id, username: data.username, phone: data.phone, token: data.token });
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", padding: "20px" }}>
      <div className="card animate-fade-in" style={{ padding: "50px", width: "100%", maxWidth: "450px" }}>
        
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "30px" }}>
          <Trophy size={40} color="var(--primary)" strokeWidth={1} />
        </div>

        <h1 style={{ fontSize: "28px", fontWeight: "300", letterSpacing: "3px", textAlign: "center", marginBottom: "8px", textTransform: "uppercase" }}>Matrix Drafts</h1>
        <p style={{ color: "var(--text-muted)", textAlign: "center", marginBottom: "40px", fontSize: "13px", letterSpacing: "1px", textTransform: "uppercase" }}>Secure Connection</p>
        
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {!isLogin && (
            <input 
              type="text" 
              placeholder="Manager Name" 
              className="input-field" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              required 
            />
          )}
          <input 
            type="tel" 
            placeholder="Phone Number (e.g. 9876543210)" 
            className="input-field" 
            value={phone} 
            onChange={(e) => setPhone(e.target.value)} 
            required 
          />
          <input 
            type="password" 
            placeholder="Password" 
            className="input-field" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />

          {error && <p style={{ color: "var(--danger)", fontSize: "14px", fontWeight: "600", padding: "10px", background: "rgba(239, 68, 68, 0.1)", borderRadius: "6px" }}>{error}</p>}

          <button type="submit" className="btn-primary" style={{ marginTop: "10px", padding: "14px", fontSize: "16px" }}>
            {isLogin ? "SECURE LOGIN" : "REGISTER FRANCHISE"}
          </button>
        </form>

        <p style={{ marginTop: "30px", color: "var(--text-muted)", fontSize: "14px", textAlign: "center" }}>
          {isLogin ? "Don't have an account?" : "Already registered?"}{" "}
          <span 
            onClick={() => setIsLogin(!isLogin)} 
            style={{ color: "var(--primary)", cursor: "pointer", fontWeight: "700" }}>
            {isLogin ? "Sign Up" : "Log In"}
          </span>
        </p>
      </div>
    </div>
  );
}

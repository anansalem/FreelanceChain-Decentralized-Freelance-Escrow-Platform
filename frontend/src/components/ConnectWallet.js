import React from "react";
import { useWeb3 } from "../context/Web3Context";

export default function ConnectWallet() {
  const { account, balance, connectWallet, disconnect, switchNetwork, isConnecting, wrongNetwork } = useWeb3();

  if (account && wrongNetwork) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{
          background: "rgba(239,68,68,0.15)",
          border: "1px solid #ef4444",
          color: "#ef4444",
          padding: "0.4rem 0.8rem",
          borderRadius: "8px",
          fontSize: "0.8rem",
          fontWeight: "600",
        }}>
        </span>
        <button onClick={switchNetwork} style={{
          background: "#ef4444",
          color: "white",
          border: "none",
          padding: "0.4rem 0.9rem",
          borderRadius: "8px",
          fontSize: "0.8rem",
          fontWeight: "600",
          cursor: "pointer",
        }}>
          Switch to Sepolia
        </button>
      </div>
    );
  }

  if (account) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <div style={{
          fontFamily: "monospace",
          fontSize: "0.8rem",
          background: "var(--bg)",
          border: "1px solid var(--border)",
          padding: "0.4rem 0.8rem",
          borderRadius: "8px",
          color: "#10b981",
        }}>
           {balance} ETH &nbsp;|&nbsp; {account.slice(0,6)}...{account.slice(-4)}
        </div>
        <button onClick={disconnect} style={{
          background: "transparent",
          border: "1px solid var(--border)",
          color: "var(--text-muted)",
          padding: "0.4rem 0.8rem",
          borderRadius: "8px",
          fontSize: "0.8rem",
          cursor: "pointer",
        }}>
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button onClick={connectWallet} disabled={isConnecting} className="connect-btn">
      {isConnecting ? "Connecting..." : " Connect Wallet"}
    </button>
  );
}
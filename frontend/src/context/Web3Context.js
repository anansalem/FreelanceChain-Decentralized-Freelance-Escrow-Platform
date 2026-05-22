import React, { createContext, useContext, useState, useEffect } from "react";
import Web3 from "web3";
import FreelanceEscrowABI from "../contracts/FreelanceEscrow.json";

const Web3Context = createContext();
const SEPOLIA_CHAIN_ID = "0xaa36a7";

export function Web3Provider({ children }) {
  const [web3,        setWeb3]       = useState(null);
  const [account,     setAccount]    = useState(null);
  const [contract,    setContract]   = useState(null);
  const [isConnecting,setConnecting] = useState(false);
  const [balance,     setBalance]    = useState(null);
  const [wrongNetwork,setWrongNet]   = useState(false);

  const connectWallet = async () => {
    if (!window.ethereum) { alert("Please install MetaMask."); return; }
    setConnecting(true);
    try {
      const accounts     = await window.ethereum.request({ method: "eth_requestAccounts" });
      const web3Instance = new Web3(window.ethereum);
      const chainId      = await window.ethereum.request({ method: "eth_chainId" });
      const escrow       = new web3Instance.eth.Contract(
        FreelanceEscrowABI.abi,
        process.env.REACT_APP_ESCROW_ADDRESS
      );
      const bal = await web3Instance.eth.getBalance(accounts[0]);
      setWeb3(web3Instance);
      setAccount(accounts[0]);
      setContract(escrow);
      setBalance((Number(bal) / 1e18).toFixed(4));
      setWrongNet(chainId !== SEPOLIA_CHAIN_ID);
    } catch (err) {
      console.error("Wallet connection failed:", err);
    } finally {
      setConnecting(false);
    }
  };

  const disconnect = () => {
    setAccount(null);
    setContract(null);
    setWeb3(null);
    setBalance(null);
    setWrongNet(false);
  };

  const switchNetwork = async () => {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: SEPOLIA_CHAIN_ID }],
      });
    } catch (err) {
      console.error("Network switch failed:", err);
    }
  };

  useEffect(() => {
    if (!window.ethereum) return;

    window.ethereum.on("accountsChanged", (accounts) => {
      if (accounts.length === 0) disconnect();
      else setAccount(accounts[0]);
    });

    window.ethereum.on("chainChanged", (chainId) => {
      setWrongNet(chainId !== SEPOLIA_CHAIN_ID);
      window.location.reload();
    });

    return () => {
      window.ethereum.removeAllListeners("accountsChanged");
      window.ethereum.removeAllListeners("chainChanged");
    };
  }, []);

  return (
    <Web3Context.Provider value={{
      web3, account, contract, connectWallet,
      disconnect, switchNetwork, isConnecting,
      balance, wrongNetwork
    }}>
      {children}
    </Web3Context.Provider>
  );
}

export const useWeb3 = () => useContext(Web3Context);
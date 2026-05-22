import React, { useState } from "react";
import { useWeb3 } from "../context/Web3Context";
import axios from "axios";
import Web3 from "web3";

export default function PostJob({ addToast }) {
  const { contract, account } = useWeb3();
  const [form, setForm] = useState({ title:"", description:"", skills:"", paymentEth:"" });
  const [txState, setTxState] = useState({ loading:false, txHash:null, error:null });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    if (!contract || !account) { addToast("Connect your wallet first.", "error"); return; }
    if (!form.title || !form.description || !form.paymentEth) { addToast("Fill all required fields.", "error"); return; }

    const jobId      = Date.now();
    const paymentWei = Web3.utils.toWei(form.paymentEth, "ether");

    setTxState({ loading: true, txHash: null, error: null });
    addToast("Transaction pending... Check MetaMask.", "info");

    try {
      const tx = await contract.methods.createJob(jobId).send({ from: account, value: paymentWei });

      await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/jobs`, {
        jobId, title: form.title, description: form.description,
        skills: form.skills.split(",").map(s => s.trim()),
        clientWallet: account, paymentEth: parseFloat(form.paymentEth),
        txHash: tx.transactionHash,
      });

      setTxState({ loading: false, txHash: tx.transactionHash, error: null });
      setForm({ title:"", description:"", skills:"", paymentEth:"" });
      addToast("Job created and ETH locked!", "success");
    } catch (err) {
      const msg = err.message || "Transaction failed.";
      setTxState({ loading: false, txHash: null, error: msg });
      addToast(msg.slice(0, 80), "error");
    }
  };

  return (
    <div className="page">
      <h2>Post a New Job</h2>
      <div className="form-group">
        <label>Job Title *</label>
        <input name="title" value={form.title} onChange={handleChange} placeholder="e.g. Build a React Dashboard" />
      </div>
      <div className="form-group">
        <label>Description *</label>
        <textarea name="description" value={form.description} onChange={handleChange} rows={5} placeholder="Describe the work..." />
      </div>
      <div className="form-group">
        <label>Required Skills</label>
        <input name="skills" value={form.skills} onChange={handleChange} placeholder="React, Solidity (comma separated)" />
      </div>
      <div className="form-group">
        <label>Payment (ETH) *</label>
        <input name="paymentEth" type="number" step="0.001" min="0.001" value={form.paymentEth} onChange={handleChange} placeholder="0.01" />
      </div>

      {txState.loading && (
        <div className="tx-feedback tx-loading">
          <div className="spinner" />
          <span> Transaction pending... Confirm in MetaMask.</span>
        </div>
      )}

      {txState.txHash && (
        <div className="tx-feedback tx-success">
          <p> Job created!</p>
          <p><strong>TX: </strong>
            <a href={`https://sepolia.etherscan.io/tx/${txState.txHash}`} target="_blank" rel="noreferrer">
              {txState.txHash.slice(0,28)}...
            </a>
          </p>
        </div>
      )}

      {txState.error && <div className="tx-feedback tx-error"> {txState.error}</div>}

      <button onClick={handleSubmit} disabled={txState.loading || !account} className="submit-btn">
        {txState.loading ? "Processing..." : " Post Job & Lock ETH"}
      </button>
    </div>
  );
}
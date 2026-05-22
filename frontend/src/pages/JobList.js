import React, { useEffect, useState } from "react";
import axios from "axios";
import { useWeb3 } from "../context/Web3Context";

const STATE_LABELS = ["Open","Accepted","Submitted","Completed","Disputed","Resolved"];
const STATE_COLORS = ["#3b82f6","#f59e0b","#8b5cf6","#10b981","#ef4444","#6b7280"];

export default function JobList() {
  const { contract, account } = useWeb3();
  const [jobs,        setJobs]        = useState([]);
  const [onChainData, setOnChainData] = useState({});
  const [loadingId,   setLoadingId]   = useState(null);
  const [txHash,      setTxHash]      = useState(null);

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/jobs`).then(r => setJobs(r.data));
  }, []);

  useEffect(() => {
    if (!contract || !jobs.length) return;
    const fetch = async () => {
      const data = {};
      for (const job of jobs) {
        try { data[job.jobId] = await contract.methods.getJob(job.jobId).call(); } catch {}
      }
      setOnChainData(data);
    };
    fetch();
  }, [contract, jobs]);

  const handleAccept = async (jobId) => {
    setLoadingId(jobId); setTxHash(null);
    try {
      const tx = await contract.methods.acceptJob(jobId).send({ from: account });
      setTxHash(tx.transactionHash);
      await axios.put(`${process.env.REACT_APP_BACKEND_URL}/api/jobs/${jobId}/accept`, { freelancerWallet: account });
      const updated = await contract.methods.getJob(jobId).call();
      setOnChainData(prev => ({ ...prev, [jobId]: updated }));
    } catch (err) { alert("Error: " + err.message); }
    finally { setLoadingId(null); }
  };

  return (
    <div className="page">
      <h2>Available Jobs</h2>
      {txHash && (
        <div className="tx-feedback tx-success">
          Accepted! TX: <a href={`https://sepolia.etherscan.io/tx/${txHash}`} target="_blank" rel="noreferrer">{txHash.slice(0,20)}...</a>
        </div>
      )}
      {jobs.length === 0 && <p className="empty-state">No jobs yet. Be the first!</p>}
      {jobs.map(job => {
        const chain = onChainData[job.jobId];
        const stateNum = chain ? Number(chain.state) : null;
        return (
          <div key={job.jobId} className="job-card">
            <div className="job-card-header">
              <h3>{job.title}</h3>
              <span className="job-payment"> {job.paymentEth} ETH</span>
            </div>
            <p className="job-desc">{job.description.slice(0,120)}...</p>
            <div className="job-card-footer">
              {stateNum !== null && (
                <span className="state-badge" style={{ backgroundColor: STATE_COLORS[stateNum] }}>
                  {STATE_LABELS[stateNum]}
                </span>
              )}
              <div className="skills-list">
                {job.skills?.slice(0,3).map(s => <span key={s} className="skill-chip">{s}</span>)}
              </div>
              <a href={`/jobs/${job.jobId}`} className="btn btn-small btn-blue">View →</a>
            </div>
            {stateNum === 0 && account && account.toLowerCase() !== job.clientWallet?.toLowerCase() && (
              <button onClick={() => handleAccept(job.jobId)} disabled={loadingId === job.jobId}
                className="btn btn-green" style={{ marginTop:"0.75rem" }}>
                {loadingId === job.jobId ? " Accepting..." : " Accept Job"}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

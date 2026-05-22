import React, { useEffect, useState } from "react";
import { useWeb3 } from "../context/Web3Context";
import axios from "axios";

export default function MyProfile() {
  const { contract, account, web3 } = useWeb3();
  const [rep,       setRep]       = useState(null);
  const [completed, setCompleted] = useState(null);
  const [eth,       setEth]       = useState(null);
  const [myJobs,    setMyJobs]    = useState([]);

  useEffect(() => {
    if (!contract || !account) return;
    const load = async () => {
      try {
        setRep((Number(await contract.methods.getReputation(account).call())/1e18).toFixed(0));
        setCompleted(Number(await contract.methods.completedJobs(account).call()));
        setEth((Number(await web3.eth.getBalance(account))/1e18).toFixed(4));
      } catch {}
    };
    load();
  }, [contract, account, web3]);

  useEffect(() => {
    if (!account) return;
    axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/jobs`).then(r => {
      setMyJobs(r.data.filter(j =>
        j.clientWallet?.toLowerCase()     === account.toLowerCase() ||
        j.freelancerWallet?.toLowerCase() === account.toLowerCase()
      ));
    });
  }, [account]);

  if (!account) return (
    <div className="page">
      <div className="empty-state"> Connect your wallet to view profile.</div>
    </div>
  );

  return (
    <div className="page">
      <h2>My Profile</h2>
      <div className="profile-stats">
        <div className="stat-card"><span className="stat-icon">🏅</span><span className="stat-value">{rep??"..."}</span><span className="stat-label">REP Tokens</span></div>
        <div className="stat-card"><span className="stat-icon">✅</span><span className="stat-value">{completed??"..."}</span><span className="stat-label">Completed Jobs</span></div>
        <div className="stat-card"><span className="stat-icon">⚡</span><span className="stat-value">{eth??"..."}</span><span className="stat-label">ETH Balance</span></div>
      </div>
      <div className="wallet-box"><strong>Wallet:</strong><code>{account}</code></div>
      <h3 style={{marginTop:"2rem"}}>My Jobs</h3>
      {myJobs.length===0 ? <p className="empty-state">No jobs yet.</p> :
        myJobs.map(job => (
          <div key={job.jobId} className="job-card mini">
            <span className="job-title">{job.title}</span>
            <span className="job-payment">{job.paymentEth} ETH</span>
            <a href={`/jobs/${job.jobId}`} className="btn btn-small btn-blue">View</a>
          </div>
        ))
      }
    </div>
  );
}

import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useWeb3 } from "../context/Web3Context";
import axios from "axios";

const STATE_LABELS = {
  0:{label:"Open",color:"#3b82f6"}, 1:{label:"Accepted",color:"#f59e0b"},
  2:{label:"Submitted",color:"#8b5cf6"}, 3:{label:"Completed",color:"#10b981"},
  4:{label:"Disputed",color:"#ef4444"}, 5:{label:"Resolved",color:"#6b7280"},
};
const ZERO = "0x0000000000000000000000000000000000000000";

export default function JobDetail() {
  const { jobId }             = useParams();
  const { contract, account } = useWeb3();
  const [mongoJob,   setMongo]  = useState(null);
  const [chainJob,   setChain]  = useState(null);
  const [repBalance, setRep]    = useState(null);
  const [txState,    setTx]     = useState({ loading:false, txHash:null, error:null, action:null });

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/jobs/${jobId}`)
      .then(r => setMongo(r.data)).catch(() => setMongo(null));
  }, [jobId]);

  useEffect(() => {
    if (!contract) return;
    const load = async () => {
      try {
        const job = await contract.methods.getJob(Number(jobId)).call();
        setChain(job);
        if (job.freelancer && job.freelancer !== ZERO) {
          setRep(await contract.methods.getReputation(job.freelancer).call());
        }
      } catch {}
    };
    load();
  }, [contract, jobId]);

  const sendTx = async (action, call) => {
    setTx({ loading:true, txHash:null, error:null, action });
    try {
      const tx = await call;
      setTx({ loading:false, txHash:tx.transactionHash, error:null, action });
      setChain(await contract.methods.getJob(Number(jobId)).call());
    } catch (err) {
      setTx({ loading:false, txHash:null, error:err.message||"Failed", action });
    }
  };

  const renderActions = () => {
    if (!chainJob || !account) return null;
    const s  = Number(chainJob.state);
    const iC = account.toLowerCase() === chainJob.client.toLowerCase();
    const iF = chainJob.freelancer && chainJob.freelancer !== ZERO &&
               account.toLowerCase() === chainJob.freelancer.toLowerCase();
    return (
      <div className="actions">
        {s===0 && !iC && (
          <button className="btn btn-blue" disabled={txState.loading}
            onClick={() => sendTx("accept", contract.methods.acceptJob(Number(jobId)).send({from:account}))}>
            {txState.loading&&txState.action==="accept"?" Accepting...":" Accept Job"}
          </button>
        )}
        {s===1 && iF && (
          <button className="btn btn-purple" disabled={txState.loading}
            onClick={() => sendTx("submit", contract.methods.submitWork(Number(jobId)).send({from:account}))}>
            {txState.loading&&txState.action==="submit"?" Submitting...":" Submit Work"}
          </button>
        )}
        {s===2 && iC && (
          <button className="btn btn-green" disabled={txState.loading}
            onClick={() => sendTx("approve", contract.methods.approveWork(Number(jobId)).send({from:account}))}>
            {txState.loading&&txState.action==="approve"?"⏳ Releasing...":"💰 Approve & Release Payment"}
          </button>
        )}
        {(s===1||s===2) && (iC||iF) && (
          <button className="btn btn-red" disabled={txState.loading}
            onClick={() => sendTx("dispute", contract.methods.raiseDispute(Number(jobId)).send({from:account}))}>
            {txState.loading&&txState.action==="dispute"?" Raising...":" Raise Dispute"}
          </button>
        )}
      </div>
    );
  };

  if (!mongoJob) return <div className="page"><p> Loading...</p></div>;
  const si = chainJob ? STATE_LABELS[Number(chainJob.state)] : null;

  return (
    <div className="page">
      <div className="job-detail-header">
        <h2>{mongoJob.title}</h2>
        {si && <span className="state-badge" style={{backgroundColor:si.color}}>{si.label}</span>}
      </div>
      <div className="detail-grid">
        <div className="detail-card"><h4> Description</h4><p>{mongoJob.description}</p></div>
        <div className="detail-card">
          <h4> On-Chain Data</h4>
          {chainJob ? (
            <ul>
              <li><strong>Job ID:</strong> {jobId}</li>
              <li><strong>Payment:</strong> {(Number(chainJob.payment)/1e18).toFixed(4)} ETH</li>
              <li><strong>Client:</strong> {chainJob.client.slice(0,8)}...{chainJob.client.slice(-6)}</li>
              <li><strong>Freelancer:</strong> {chainJob.freelancer===ZERO?"Not assigned":`${chainJob.freelancer.slice(0,8)}...${chainJob.freelancer.slice(-6)}`}</li>
              {repBalance && <li><strong>Freelancer REP:</strong> {(Number(repBalance)/1e18).toFixed(0)} REP</li>}
            </ul>
          ) : <p>Loading chain data...</p>}
        </div>
        <div className="detail-card">
          <h4> Skills</h4>
          <div className="skills-list">
            {mongoJob.skills?.map(s => <span key={s} className="skill-chip">{s}</span>)}
          </div>
        </div>
      </div>
      {renderActions()}
      {txState.loading && <div className="tx-feedback tx-loading"><div className="spinner"/><span>⏳ Pending... Check MetaMask.</span></div>}
      {txState.txHash && (
        <div className="tx-feedback tx-success">
          <p> Confirmed!</p>
          <p><strong>TX: </strong><a href={`https://sepolia.etherscan.io/tx/${txState.txHash}`} target="_blank" rel="noreferrer">{txState.txHash.slice(0,28)}...</a></p>
        </div>
      )}
      {txState.error && <div className="tx-feedback tx-error"> {txState.error}</div>}
    </div>
  );
}

import React from "react";
import { BrowserRouter as Router, Routes, Route, Link, NavLink } from "react-router-dom";
import { Web3Provider } from "./context/Web3Context";
import { useToast } from "./hooks/useToast";
import ConnectWallet from "./components/ConnectWallet";
import ToastContainer from "./components/ToastContainer";
import PostJob   from "./pages/PostJob";
import JobList   from "./pages/JobList";
import JobDetail from "./pages/JobDetail";
import MyProfile from "./pages/MyProfile";
import "./App.css";

function AppContent() {
  const { toasts, addToast, removeToast } = useToast();

  return (
    <>
      <Router>
        <nav className="navbar">
          <Link to="/" className="logo">⛓️ <span>FreelanceChain</span></Link>
          <div className="nav-links">
            <NavLink to="/"        className={({isActive})=>isActive?"nav-link active":"nav-link"}>Browse Jobs</NavLink>
            <NavLink to="/post"    className={({isActive})=>isActive?"nav-link active":"nav-link"}>Post a Job</NavLink>
            <NavLink to="/profile" className={({isActive})=>isActive?"nav-link active":"nav-link"}>My Profile</NavLink>
          </div>
          <ConnectWallet />
        </nav>
        <main className="container">
          <Routes>
            <Route path="/"            element={<JobList   addToast={addToast} />} />
            <Route path="/post"        element={<PostJob   addToast={addToast} />} />
            <Route path="/jobs/:jobId" element={<JobDetail addToast={addToast} />} />
            <Route path="/profile"     element={<MyProfile addToast={addToast} />} />
          </Routes>
        </main>
        <footer className="footer">
          <p>FreelanceChain — AID 325 | Ethereum Sepolia</p>
        </footer>
      </Router>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </>
  );
}

function App() {
  return (
    <Web3Provider>
      <AppContent />
    </Web3Provider>
  );
}

export default App;
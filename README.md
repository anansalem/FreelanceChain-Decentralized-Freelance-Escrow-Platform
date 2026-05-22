# FreelanceChain-Decentralized-Freelance-Escrow-Platform
**FreelanceChain** is a decentralized Ethereum escrow platform using Solidity smart contracts. ETH is locked when a job is posted and released to the freelancer upon approval, returned via dispute, or claimed after timeout. A 2% fee applies only on completed jobs — no middleman needed.


## 📖 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Smart Contracts](#smart-contracts)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Deployment](#deployment)
- [Testing](#testing)
- [Security Features](#security-features)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

## Overview

**FreelanceChain** is a decentralized escrow platform that connects clients and freelancers through blockchain technology. It eliminates middlemen by providing trustless payment escrow, dispute resolution, and a reputation system powered by REP tokens.

### Key Benefits

- 🔒 **Trustless Escrow** – Payments are locked in smart contracts, released only when work is approved
- 🛡️ **Dispute Resolution** – Validator mediates disputes when parties disagree
- 🏆 **Reputation System** – Freelancers earn REP tokens for completed work
- 💰 **Low Fees** – Only 2% platform fee, no hidden costs
- 🌐 **Decentralized** – No central authority controls the funds

## Features

### For Clients
- Post jobs with ETH locked in escrow
- Approve work and release payments automatically
- Raise disputes if work doesn't meet expectations
- View freelancer reputations before hiring

### For Freelancers
- Browse and accept available jobs
- Submit work for review
- Receive payments directly after client approval
- Build on-chain reputation with REP tokens

### Platform Features
- Real-time job status tracking
- Ethereum Sepolia testnet support
- MongoDB integration for off-chain job metadata
- Web3 wallet integration (MetaMask)
- Transaction confirmation feedback

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React)                       │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────────┐  │
│  │Job List │ │Job Detail│ │Post Job │ │  My Profile     │  │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────────┬────────┘  │
│       │           │           │               │            │
│       └───────────┴───────────┴───────────────┘            │
│                       │  │  │                               │
│              ┌────────┘  │  └────────┐                      │
│              │           │           │                      │
│         Web3.js     Axios API    React Router              │
└──────────────┼───────────┼───────────┼──────────────────────┘
               │           │           │
      ┌────────┴───┐  ┌────┴────┐  ┌───┴────────┐
      │ Ethereum   │  │ Backend │  │ MongoDB    │
      │ Blockchain │  │(Express)│  │ (Atlas)    │
      │  Sepolia   │  │         │  │            │
      └────────────┘  └─────────┘  └────────────┘
            │
      ┌─────┴─────────────────────────────────────────┐
      │           Smart Contracts                     │
      │  ┌─────────────────┐  ┌──────────────────┐   │
      │  │FreelanceEscrow  │  │    RepToken      │   │
      │  │ • createJob()    │  │ • awardReputation│   │
      │  │ • acceptJob()    │  │ • balanceOf()    │   │
      │  │ • submitWork()   │  └──────────────────┘   │
      │  │ • approveWork()  │                         │
      │  │ • raiseDispute() │                         │
      │  │ • resolveDispute()│                        │
      │  └─────────────────┘                         │
      └────────────────────────────────────────────────┘
```

## Tech Stack

### Frontend
- **React 19** – UI framework
- **React Router 7** – Navigation
- **Web3.js 1.10.4** – Blockchain interaction
- **Axios** – API calls
- **React App Rewired** – Webpack configuration

### Backend
- **Node.js / Express 5** – REST API server
- **MongoDB Atlas** – Job metadata storage
- **Mongoose 9** – ODM for MongoDB

### Blockchain
- **Solidity 0.8.20** – Smart contract language
- **OpenZeppelin Contracts 5.6.1** – Security patterns
- **Truffle Suite** – Development framework
- **Ganache** – Local blockchain (development)
- **Sepolia Testnet** – Deployment target

## Smart Contracts

### FreelanceEscrow

The main escrow contract that manages the entire workflow:

| Function | Description | Access |
|----------|-------------|--------|
| `createJob(jobId)` | Client creates job, locks ETH | Payable |
| `acceptJob(jobId)` | Freelancer accepts open job | Freelancer |
| `submitWork(jobId)` | Freelancer submits work | Freelancer |
| `approveWork(jobId)` | Client releases payment | Client |
| `raiseDispute(jobId)` | Either party raises dispute | Both |
| `resolveDispute(jobId, favorFreelancer)` | Validator resolves | Validator only |

**Job States:**
- `Open (0)` → `Accepted (1)` → `Submitted (2)` → `Completed (3)`
- `Accepted/Submitted (1-2)` → `Disputed (4)` → `Resolved (5)`

### RepToken

ERC20 token for on-chain reputation:

| Function | Description |
|----------|-------------|
| `awardReputation(freelancer, amount)` | Mint REP tokens (owner only) |
| `balanceOf(account)` | Check REP balance |

**Token Details:**
- Name: "Reputation Token"
- Symbol: "REP"
- Decimals: 18
- Minting: Only FreelanceEscrow contract

## Prerequisites

- **Node.js** v16+
- **npm** or **yarn**
- **MongoDB Atlas** account (or local MongoDB)
- **MetaMask** browser extension
- **Alchemy** or **Infura** account (for Sepolia deployment)
- **Etherscan** API key (for contract verification)

## Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/freelance-escrow.git
cd freelance-escrow
```

### 2. Install Dependencies

```bash
# Install Truffle dependencies (root directory)
npm install

# Install Backend dependencies
cd backend
npm install

# Install Frontend dependencies
cd ../frontend
npm install
```

### 3. Environment Configuration

#### Backend (.env in `/backend`)

```env
PORT=5001
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/freelance-escrow
```

#### Frontend (.env in `/frontend`)

```env
REACT_APP_ESCROW_ADDRESS=<deployed_contract_address>
REACT_APP_BACKEND_URL=http://localhost:5001
```

#### Root (.env for deployment)

```env
METAMASK_PRIVATE_KEY=<your_wallet_private_key>
ALCHEMY_URL=https://eth-sepolia.g.alchemy.com/v2/<your_api_key>
ETHERSCAN_API_KEY=<your_etherscan_api_key>
```

### 4. Start Ganache (Development)

```bash
ganache-cli --port 7545 --networkId 5777 --gasLimit 8000000
```

### 5. Compile Contracts

```bash
truffle compile
```

### 6. Deploy Contracts

**Development (Ganache):**
```bash
truffle migrate --network development
```

**Sepolia Testnet:**
```bash
truffle migrate --network sepolia
```

### 7. Start Backend Server

```bash
cd backend
npm run dev
```

### 8. Start Frontend

```bash
cd frontend
npm start
```

## Configuration Files

### truffle-config.js

```javascript
require("dotenv").config();
const HDWalletProvider = require("@truffle/hdwallet-provider");

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*",
    },
    sepolia: {
      provider: () => new HDWalletProvider(
        process.env.METAMASK_PRIVATE_KEY,
        process.env.ALCHEMY_URL
      ),
      network_id: 11155111,
      gas: 5500000,
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true,
    },
  },
  compilers: {
    solc: {
      version: "0.8.20",
      settings: {
        optimizer: { enabled: true, runs: 200 },
      },
    },
  },
  plugins: ["truffle-plugin-verify"],
  api_keys: {
    etherscan: process.env.ETHERSCAN_API_KEY,
  },
};
```

### Deployment Script

`migrations/2_deploy_contracts.js`:

```javascript
const FreelanceEscrow = artifacts.require("FreelanceEscrow");

module.exports = async function (deployer, network, accounts) {
  const validatorAddress = network === "development"
    ? accounts[1]
    : "0xYourValidatorWalletAddress"; // Replace for Sepolia

  await deployer.deploy(FreelanceEscrow, validatorAddress);
  const escrow = await FreelanceEscrow.deployed();
  const repTokenAddress = await escrow.repToken();

  console.log(`✅ FreelanceEscrow: ${escrow.address}`);
  console.log(`✅ RepToken: ${repTokenAddress}`);
};
```

## Running the Application

### Development Mode

1. Start Ganache (local blockchain)
2. Deploy contracts: `truffle migrate --network development`
3. Start backend: `cd backend && npm run dev`
4. Start frontend: `cd frontend && npm start`
5. Open http://localhost:3000

### Production Mode

1. Deploy contracts to Sepolia
2. Deploy backend to a cloud provider (Heroku, Render, etc.)
3. Build frontend: `cd frontend && npm run build`
4. Deploy frontend to Vercel/Netlify

## Deployment

### Deploy to Sepolia Testnet

```bash
# 1. Set up environment variables
echo "METAMASK_PRIVATE_KEY=your_private_key" > .env
echo "ALCHEMY_URL=https://eth-sepolia.g.alchemy.com/v2/your_key" >> .env

# 2. Deploy
truffle migrate --network sepolia

# 3. Verify on Etherscan
truffle run verify FreelanceEscrow --network sepolia
```

### Deploy Backend (Example: Render)

```bash
# Connect your GitHub repo to Render
# Set environment variables in Render dashboard:
# - PORT=5001
# - MONGO_URI=your_mongodb_uri
```

### Deploy Frontend (Example: Vercel)

```bash
cd frontend
vercel --prod
# Set environment variables in Vercel dashboard:
# - REACT_APP_ESCROW_ADDRESS
# - REACT_APP_BACKEND_URL
```

## Testing

### Smart Contract Tests

```bash
truffle test
```

### Backend API Tests

```bash
cd backend
npm test
```

### Frontend Tests

```bash
cd frontend
npm test
```

## Security Features

1. **ReentrancyGuard** – Prevents reentrancy attacks on payment functions
2. **Checks-Effects-Interactions** – State changes before external calls
3. **Input Validation** – All function parameters are validated
4. **Access Control** – Only authorized parties can perform actions
5. **State Management** – Job states prevent invalid transitions

## Project Structure

```
freelance-escrow/
├── contracts/
│   ├── FreelanceEscrow.sol      # Main escrow contract
│   └── RepToken.sol              # REP token contract
├── migrations/
│   └── 2_deploy_contracts.js    # Deployment script
├── test/                         # Contract tests
├── backend/
│   ├── models/
│   │   ├── Job.js               # Job MongoDB model
│   │   └── User.js              # User MongoDB model
│   ├── routes/
│   │   └── jobs.js              # Job API routes
│   ├── server.js                # Express server
│   └── .env                     # Backend environment
├── frontend/
│   ├── src/
│   │   ├── components/          # React components
│   │   ├── context/
│   │   │   └── Web3Context.js   # Web3 provider
│   │   ├── hooks/
│   │   │   └── useToast.js      # Toast notifications
│   │   └── pages/               # Page components
│   ├── public/
│   ├── config-overrides.js      # Webpack config
│   └── .env                     # Frontend environment
├── truffle-config.js            # Truffle configuration
└── package.json
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

Distributed under the MIT License. See `LICENSE` for more information.

---

## Acknowledgments

- [OpenZeppelin](https://openzeppelin.com/) for secure smart contract libraries
- [Truffle Suite](https://trufflesuite.com/) for development framework
- [Alchemy](https://www.alchemy.com/) for blockchain infrastructure
- [MongoDB Atlas](https://www.mongodb.com/atlas) for database hosting

---

**Built with ❤️ for the decentralized freelance community**

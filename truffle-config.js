require("dotenv").config();
const HDWalletProvider = require("@truffle/hdwallet-provider");

module.exports = {
  networks: {
    // Local Ganache
    development: {
      host:       "127.0.0.1",
      port:       7545,
      network_id: "*",
    },
    // Sepolia Testnet
    sepolia: {
      provider: () =>
        new HDWalletProvider(
          process.env.METAMASK_PRIVATE_KEY,
          process.env.ALCHEMY_URL
        ),
      network_id:    11155111,
      gas:           5500000,
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun:    true,
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
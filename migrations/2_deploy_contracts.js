const FreelanceEscrow = artifacts.require("FreelanceEscrow");

module.exports = async function (deployer, network, accounts) {

  // Local: accounts[1] is the validator
  // Sepolia: put your second MetaMask wallet address here
  const validatorAddress =
    network === "development"
      ? accounts[1]
      : "0x7e0571e944D724cECC5A0F143A0fCdA89D2B9981"; // ← Replace for Sepolia

  console.log(`\n📦 Deploying to: ${network}`);
  console.log(`🔑 Validator:    ${validatorAddress}`);

  await deployer.deploy(FreelanceEscrow, validatorAddress);
  const escrow = await FreelanceEscrow.deployed();

  // RepToken was deployed inside the constructor automatically
  const repTokenAddress = await escrow.repToken();

  console.log(`\n✅ FreelanceEscrow: ${escrow.address}`);
  console.log(`✅ RepToken:         ${repTokenAddress}`);
  console.log(`\n📋 Copy these into frontend/.env:`);
  console.log(`REACT_APP_ESCROW_ADDRESS=${escrow.address}`);
  console.log(`REACT_APP_REP_TOKEN_ADDRESS=${repTokenAddress}`);
};
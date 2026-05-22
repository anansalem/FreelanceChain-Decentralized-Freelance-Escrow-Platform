const FreelanceEscrow = artifacts.require("FreelanceEscrow");
const { BN, expectRevert, expectEvent } = require("@openzeppelin/test-helpers");

contract("FreelanceEscrow", (accounts) => {
  const [owner, validator, client, freelancer, stranger] = accounts;

  let escrow;
  const JOB_ID  = 1001;
  const PAYMENT = web3.utils.toWei("0.1", "ether");

  // Fresh contract before every test
  beforeEach(async () => {
    escrow = await FreelanceEscrow.new(validator, { from: owner });
  });

  // ── GROUP 1: HAPPY PATH ──────────────────────────────────────────
  describe("Happy Path: Normal successful flow", () => {

    it("TEST 1 — Client can create a job and lock ETH", async () => {
      const tx = await escrow.createJob(JOB_ID, { from: client, value: PAYMENT });

      expectEvent(tx, "JobCreated", {
        jobId: new BN(JOB_ID), client, payment: new BN(PAYMENT)
      });

      const job = await escrow.getJob(JOB_ID);
      assert.equal(job.client,            client,  "Client mismatch");
      assert.equal(job.payment.toString(), PAYMENT, "Payment mismatch");
      assert.equal(job.state.toString(),   "0",     "Should be Open");
    });

    it("TEST 2 — Freelancer can accept an open job", async () => {
      await escrow.createJob(JOB_ID, { from: client, value: PAYMENT });
      const tx = await escrow.acceptJob(JOB_ID, { from: freelancer });

      expectEvent(tx, "JobAccepted", { jobId: new BN(JOB_ID), freelancer });

      const job = await escrow.getJob(JOB_ID);
      assert.equal(job.freelancer,       freelancer, "Freelancer mismatch");
      assert.equal(job.state.toString(), "1",        "Should be Accepted");
    });

    it("TEST 3 — Full flow: create→accept→submit→approve releases ETH + REP", async () => {
      await escrow.createJob(JOB_ID,  { from: client,     value: PAYMENT });
      await escrow.acceptJob(JOB_ID,  { from: freelancer });
      await escrow.submitWork(JOB_ID, { from: freelancer });

      const before = new BN(await web3.eth.getBalance(freelancer));
      const tx     = await escrow.approveWork(JOB_ID, { from: client });

      expectEvent(tx, "PaymentReleased", { jobId: new BN(JOB_ID), freelancer });

      const after = new BN(await web3.eth.getBalance(freelancer));
      assert.isTrue(after.gt(before), "Freelancer should have received ETH");

      const job = await escrow.getJob(JOB_ID);
      assert.equal(job.state.toString(), "3", "Should be Completed");

      const rep = await escrow.getReputation(freelancer);
      assert.isTrue(new BN(rep).gt(new BN(0)), "Freelancer should have REP");
    });

  });

  // ── GROUP 2: EDGE CASES ──────────────────────────────────────────
  describe("Edge Cases: Wrong actions must revert", () => {

    it("TEST 4 — Cannot accept a job that is already accepted", async () => {
      await escrow.createJob(JOB_ID, { from: client,     value: PAYMENT });
      await escrow.acceptJob(JOB_ID, { from: freelancer });

      await expectRevert(
        escrow.acceptJob(JOB_ID, { from: stranger }),
        "Escrow: job is not in the required state"
      );
    });

    it("TEST 5 — Client cannot approve work not yet submitted", async () => {
      await escrow.createJob(JOB_ID, { from: client,     value: PAYMENT });
      await escrow.acceptJob(JOB_ID, { from: freelancer });

      await expectRevert(
        escrow.approveWork(JOB_ID, { from: client }),
        "Escrow: job is not in the required state"
      );
    });

    it("TEST 6 — Client cannot be their own freelancer", async () => {
      await escrow.createJob(JOB_ID, { from: client, value: PAYMENT });

      await expectRevert(
        escrow.acceptJob(JOB_ID, { from: client }),
        "Escrow: client cannot be their own freelancer"
      );
    });

    it("TEST 7 — Cannot create a job with zero payment", async () => {
      await expectRevert(
        escrow.createJob(JOB_ID, { from: client, value: 0 }),
        "Escrow: payment must be greater than zero"
      );
    });

  });

  // ── GROUP 3: DISPUTES ────────────────────────────────────────────
  describe("Dispute Resolution", () => {

    it("TEST 8 — Validator resolves dispute in favor of freelancer", async () => {
      await escrow.createJob(JOB_ID,    { from: client,     value: PAYMENT });
      await escrow.acceptJob(JOB_ID,    { from: freelancer });
      await escrow.raiseDispute(JOB_ID, { from: client });

      const before = new BN(await web3.eth.getBalance(freelancer));
      const tx     = await escrow.resolveDispute(JOB_ID, true, { from: validator });

      expectEvent(tx, "DisputeResolved", { jobId: new BN(JOB_ID), winner: freelancer });

      const after = new BN(await web3.eth.getBalance(freelancer));
      assert.isTrue(after.gt(before), "Freelancer should receive funds");
    });

    it("TEST 9 — Stranger cannot resolve a dispute", async () => {
      await escrow.createJob(JOB_ID,    { from: client,     value: PAYMENT });
      await escrow.acceptJob(JOB_ID,    { from: freelancer });
      await escrow.raiseDispute(JOB_ID, { from: client });

      await expectRevert(
        escrow.resolveDispute(JOB_ID, true, { from: stranger }),
        "Escrow: caller is not the validator"
      );
    });

  });
});
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./RepToken.sol";

/**
 * @title FreelanceEscrow
 * @author Your Team Name
 * @notice Decentralized escrow for freelance work.
 *         Clients lock ETH. Freelancers complete work.
 *         Funds released on approval. Disputes resolved by validator.
 * @dev Uses ReentrancyGuard and Checks-Effects-Interactions throughout.
 */
contract FreelanceEscrow is ReentrancyGuard {

    // ─── State Variables ──────────────────────────────────────────────
    /// @notice Platform owner address (deployer)
    address public immutable owner;

    /// @notice Dispute resolution validator address
    address public immutable validator;

    /// @notice The REP token contract
    RepToken public immutable repToken;

    /// @notice Platform fee: 2%
    uint256 public constant FEE_PERCENT = 2;

    /// @notice REP tokens awarded per completed job (1 REP)
    uint256 public constant REP_PER_JOB = 1 * 10**18;

    /// @notice Total jobs ever created
    uint256 public jobCount;

    /// @notice Days before freelancer can claim if client is unresponsive
    uint256 public constant TIMEOUT_DAYS = 7;

    // ─── Enum ─────────────────────────────────────────────────────────
    /**
     * @notice Job lifecycle states
     * @dev Open→Accepted→Submitted→Completed
     *      Accepted/Submitted→Disputed→Resolved
     */
    enum JobState { Open, Accepted, Submitted, Completed, Disputed, Resolved }

    // ─── Struct ───────────────────────────────────────────────────────
    /**
     * @notice Stores all on-chain data for a job
     * @param jobId Links to MongoDB document
     * @param client Client wallet address
     * @param freelancer Assigned freelancer address
     * @param payment Locked ETH in wei
     * @param state Current lifecycle state
     * @param createdAt Block timestamp of creation
     */
    struct Job {
        uint256 jobId;
        address payable client;
        address payable freelancer;
        uint256 payment;
        JobState state;
        uint256 createdAt;
    }

    // ─── Mappings ─────────────────────────────────────────────────────
    /// @notice All jobs indexed by ID
    mapping(uint256 => Job) public jobs;

    /// @notice Completed job count per address (on-chain reputation)
    mapping(address => uint256) public completedJobs;

    // ─── Events ───────────────────────────────────────────────────────
    event JobCreated(uint256 indexed jobId, address indexed client, uint256 payment);
    event JobAccepted(uint256 indexed jobId, address indexed freelancer);
    event WorkSubmitted(uint256 indexed jobId, address indexed freelancer);
    event PaymentReleased(uint256 indexed jobId, address indexed freelancer, uint256 amount);
    event DisputeRaised(uint256 indexed jobId, address indexed raisedBy);
    event DisputeResolved(uint256 indexed jobId, address indexed winner, uint256 amount);
    /// @notice Emitted when freelancer claims payment after client timeout
    event TimeoutClaim(uint256 indexed jobId, address indexed freelancer, uint256 amount);
    // ─── Modifiers ────────────────────────────────────────────────────
    /** @notice Only platform owner */
    modifier onlyOwner() {
        require(msg.sender == owner, "Escrow: caller is not the owner");
        _;
    }

    /** @notice Only dispute validator */
    modifier onlyValidator() {
        require(msg.sender == validator, "Escrow: caller is not the validator");
        _;
    }

    /** @notice Only client of this specific job */
    modifier onlyClient(uint256 jobId) {
        require(msg.sender == jobs[jobId].client, "Escrow: caller is not the client");
        _;
    }

    /** @notice Only assigned freelancer of this job */
    modifier onlyFreelancer(uint256 jobId) {
        require(msg.sender == jobs[jobId].freelancer, "Escrow: caller is not the freelancer");
        _;
    }

    /**
     * @notice Enforces job is in a specific state before proceeding
     * @param jobId Job to check
     * @param expectedState Required state
     */
    modifier inState(uint256 jobId, JobState expectedState) {
        require(jobs[jobId].state == expectedState, "Escrow: job is not in the required state");
        _;
    }

    // ─── Constructor ──────────────────────────────────────────────────
    /**
     * @notice Deploys escrow, creates RepToken, sets owner and validator
     * @param _validator Address that resolves disputes
     */
    constructor(address _validator) {
        require(_validator != address(0), "Escrow: validator cannot be zero address");
        owner     = msg.sender;
        validator = _validator;
        repToken  = new RepToken(address(this));
    }

    // ─── Functions ────────────────────────────────────────────────────

    /**
     * @notice Client creates a job and locks ETH in escrow
     * @param jobId Matches the MongoDB document ID
     */
    function createJob(uint256 jobId) external payable {
        // CHECKS
        require(msg.value > 0, "Escrow: payment must be greater than zero");
        require(jobs[jobId].client == address(0), "Escrow: job ID already exists");
        // EFFECTS
        jobs[jobId] = Job({
            jobId:     jobId,
            client:    payable(msg.sender),
            freelancer: payable(address(0)),
            payment:   msg.value,
            state:     JobState.Open,
            createdAt: block.timestamp
        });
        jobCount++;
        // INTERACTIONS
        emit JobCreated(jobId, msg.sender, msg.value);
    }

    /**
     * @notice Freelancer accepts an open job
     * @param jobId Job to accept
     */
    function acceptJob(uint256 jobId) external inState(jobId, JobState.Open) {
        // CHECKS
        require(msg.sender != jobs[jobId].client, "Escrow: client cannot be their own freelancer");
        // EFFECTS
        jobs[jobId].freelancer = payable(msg.sender);
        jobs[jobId].state      = JobState.Accepted;
        // INTERACTIONS
        emit JobAccepted(jobId, msg.sender);
    }

    /**
     * @notice Freelancer submits work for review
     * @param jobId Job to submit
     */
    function submitWork(uint256 jobId)
        external
        onlyFreelancer(jobId)
        inState(jobId, JobState.Accepted)
    {
        jobs[jobId].state = JobState.Submitted;
        emit WorkSubmitted(jobId, msg.sender);
    }

    /**
     * @notice Client approves work and releases ETH to freelancer
     * @param jobId Job to approve
     * @dev nonReentrant + Checks-Effects-Interactions prevents reentrancy
     */
    function approveWork(uint256 jobId)
        external
        onlyClient(jobId)
        inState(jobId, JobState.Submitted)
        nonReentrant
    {
        Job storage job = jobs[jobId];
        // CHECKS
        uint256 total = job.payment;
        require(total > 0, "Escrow: no payment to release");
        // EFFECTS — MUST happen before any external call
        job.state   = JobState.Completed;
        job.payment = 0;
        completedJobs[job.freelancer]++;
        uint256 fee    = (total * FEE_PERCENT) / 100;
        uint256 payout = total - fee;
        // INTERACTIONS — external calls last
        job.freelancer.transfer(payout);
        payable(owner).transfer(fee);
        repToken.awardReputation(job.freelancer, REP_PER_JOB);
        emit PaymentReleased(jobId, job.freelancer, payout);
    }

    /**
     * @notice Either party raises a dispute on an active job
     * @param jobId Disputed job
     */
    function raiseDispute(uint256 jobId) external {
        Job storage job = jobs[jobId];
        require(
            msg.sender == job.client || msg.sender == job.freelancer,
            "Escrow: only job participants can raise a dispute"
        );
        require(
            job.state == JobState.Accepted || job.state == JobState.Submitted,
            "Escrow: dispute can only be raised on active jobs"
        );
        job.state = JobState.Disputed;
        emit DisputeRaised(jobId, msg.sender);
    }
    
    /**
    * @notice Freelancer claims payment if client is unresponsive for 7 days
    * @param jobId The job where client has not responded
    * @dev Only callable after TIMEOUT_DAYS since work was submitted
    */  
    function claimAfterTimeout(uint256 jobId)
        external
        onlyFreelancer(jobId)
        inState(jobId, JobState.Submitted)
        nonReentrant
    {
        Job storage job = jobs[jobId];

        // CHECKS
        require(
            block.timestamp >= job.createdAt + (TIMEOUT_DAYS * 1 days),
            "Escrow: timeout period has not passed yet"
        );

        uint256 totalPayment = job.payment;
        require(totalPayment > 0, "Escrow: no payment to release");

        // EFFECTS
        job.state   = JobState.Completed;
        job.payment = 0;
        completedJobs[job.freelancer]++;

        // INTERACTIONS
        job.freelancer.transfer(totalPayment);
        repToken.awardReputation(job.freelancer, REP_PER_JOB);

        emit TimeoutClaim(jobId, job.freelancer, totalPayment);
    }

    /**
     * @notice Validator decides dispute outcome
     * @param jobId Disputed job
     * @param favorFreelancer True = pay freelancer, false = refund client
     */
    function resolveDispute(uint256 jobId, bool favorFreelancer)
        external
        onlyValidator
        inState(jobId, JobState.Disputed)
        nonReentrant
    {
        Job storage job = jobs[jobId];
        uint256 total   = job.payment;
        require(total > 0, "Escrow: no funds to distribute");
        // EFFECTS
        job.state   = JobState.Resolved;
        job.payment = 0;
        address payable winner = favorFreelancer ? job.freelancer : job.client;
        if (favorFreelancer) completedJobs[job.freelancer]++;
        // INTERACTIONS
        winner.transfer(total);
        if (favorFreelancer) repToken.awardReputation(job.freelancer, REP_PER_JOB);
        emit DisputeResolved(jobId, winner, total);
    }

    // ─── View Functions ───────────────────────────────────────────────

    /**
     * @notice Returns all data for a job
     * @param jobId Job to query
     */
    function getJob(uint256 jobId) external view returns (Job memory) {
        require(jobs[jobId].client != address(0), "Escrow: job does not exist");
        return jobs[jobId];
    }

    /**
     * @notice Returns REP token balance of any address
     * @param account Address to query
     */
    function getReputation(address account) external view returns (uint256) {
        return repToken.balanceOf(account);
    }

    /**
     * @notice Returns total ETH locked in this contract
     */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
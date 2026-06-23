import { expect } from "chai";
import { ethers } from "hardhat";

describe("Voting Contract", function () {
  let voting: any;
  let admin: any;
  let otherAccount: any;

  beforeEach(async function () {
    [admin, otherAccount] = await ethers.getSigners();
    const VotingFactory = await ethers.getContractFactory("Voting");
    voting = await VotingFactory.deploy();
    await voting.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right admin", async function () {
      expect(await voting.admin()).to.equal(admin.address);
    });
  });

  describe("Voting Event Creation", function () {
    it("Should allow admin to create event", async function () {
      await expect(voting.createVotingEvent("Pilpres 2026", ["Kandidat 01", "Kandidat 02"]))
        .to.emit(voting, "VotingEventCreated")
        .withArgs(1, "Pilpres 2026", 2);

      expect(await voting.currentEventId()).to.equal(1);
      const ev = await voting.getVotingEvent(1);
      expect(ev.title).to.equal("Pilpres 2026");
      expect(ev.isActive).to.equal(true);
    });

    it("Should fail if non-admin attempts to create event", async function () {
      await expect(
        voting.connect(otherAccount).createVotingEvent("Pilpres 2026", ["K01"])
      ).to.be.revertedWithCustomError(voting, "OnlyAdmin");
    });
  });

  describe("Voting Process", function () {
    const nik1 = ethers.solidityPackedKeccak256(["string"], ["1234567890123456"]);
    const nik2 = ethers.solidityPackedKeccak256(["string"], ["9876543210987654"]);

    beforeEach(async function () {
      await voting.createVotingEvent("Pilpres 2026", ["Kandidat 01", "Kandidat 02"]);
    });

    it("Should allow casting a vote via admin (relayer)", async function () {
      await expect(voting.castVote(nik1, 0))
        .to.emit(voting, "VoteCast")
        .withArgs(1, nik1, 0);

      expect(await voting.hasVoted(1, nik1)).to.equal(true);
      
      const results = await voting.getResults(1);
      expect(results[0].voteCount).to.equal(1);
      expect(results[1].voteCount).to.equal(0);
    });

    it("Should prevent double voting with same NIK hash", async function () {
      await voting.castVote(nik1, 0);
      await expect(voting.castVote(nik1, 1)).to.be.revertedWithCustomError(voting, "AlreadyVoted");
    });

    it("Should prevent voting for invalid candidate ID", async function () {
      await expect(voting.castVote(nik1, 5)).to.be.revertedWithCustomError(voting, "InvalidCandidate");
    });

    it("Should prevent voting if event is not active", async function () {
      await voting.endVotingEvent(1);
      await expect(voting.castVote(nik1, 0)).to.be.revertedWithCustomError(voting, "VotingNotActive");
    });

    it("Should allow voting again when a new event is created", async function () {
      // Vote in event 1
      await voting.castVote(nik1, 0);
      expect(await voting.hasVoted(1, nik1)).to.equal(true);

      // Create event 2
      await voting.createVotingEvent("Pilkada 2026", ["Kandidat A", "Kandidat B"]);
      expect(await voting.currentEventId()).to.equal(2);

      // NIK 1 should not have voted in event 2 yet
      expect(await voting.hasVoted(2, nik1)).to.equal(false);

      // Vote in event 2
      await voting.castVote(nik1, 1);
      expect(await voting.hasVoted(2, nik1)).to.equal(true);

      const results1 = await voting.getResults(1);
      const results2 = await voting.getResults(2);

      expect(results1[0].voteCount).to.equal(1);
      expect(results2[1].voteCount).to.equal(1);
    });
  });
});

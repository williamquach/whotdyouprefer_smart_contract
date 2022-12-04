import {Contract} from "ethers";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {ethers} from "hardhat";
import {expect} from "chai";

describe("VoteFactory Contract", function () {
    let VoteFactory;
    let voteFactory: Contract;
    let owner: SignerWithAddress;
    let addr1: SignerWithAddress;
    let addr2: SignerWithAddress;

    beforeEach(async function () {
        VoteFactory = await ethers.getContractFactory("VoteFactory");
        [owner, addr1, addr2] = await ethers.getSigners();
        voteFactory = await VoteFactory.deploy();
    });

    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            expect(await voteFactory.owner()).to.equal(owner.address);
        });
        it("Should have 0 vote", async function () {
            expect(await voteFactory.voteCount()).to.equal(0);
        });
    });

    describe("Vote Creation", function () {
        let vote: any;
        describe("First session vote", function () {
            beforeEach(async function () {
                const sessionEndDate = 1669852800; // Thu Dec 01 2022 00:00:00 UTC
                await voteFactory.createSession("Label", "Description", sessionEndDate,["Choice 1", "Choice 2", "Choice 3", "Choice 4"]);
                vote = await voteFactory.createVote(0, [0,1,2,3]);
            });
            it("Should create a session", async function () {
                expect(await voteFactory.sessionCount()).to.equal(1);
            });
            it("Should create a vote", async function () {
                expect(await voteFactory.voteCount()).to.equal(1);
            });
            it("Should fail because already voted (even if choice order changed)", async function () {
                await expect(voteFactory.createVote(0, [3,2,0,1])).to.be.revertedWith("You have already voted");
                expect(await voteFactory.voteCount()).to.equal(1);
            });
            it("Should fail because vote choices don't exist", async function () {
                await expect(voteFactory.createVote(0, [4,1,2,3])).to.be.revertedWith("Choice ids do not exist for this session");
            });
            it("Should fail because vote session don't exist", async function () {
                await expect(voteFactory.createVote(1, [0,1,2,3])).to.be.revertedWith("Session does not exist");
            });
            it("should emit a NewVote event", async function () {
                await expect(vote).to.emit(voteFactory, "NewVote").withArgs(0, 0, [0,1,2,3]);
            });
        });
    });
});
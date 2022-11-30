import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {Contract} from "ethers";

const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SessionFactory contract", function () {
    let SessionFactory;
    let VoteFactory;
    let sessionFactory: Contract;
    let voteFactory: Contract;
    let owner: SignerWithAddress;
    let addr1: SignerWithAddress;
    let addr2: SignerWithAddress;
    beforeEach(async function () {
        SessionFactory = await ethers.getContractFactory("SessionFactory");
        [owner, addr1, addr2] = await ethers.getSigners();
        sessionFactory = await SessionFactory.deploy();
    });

    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            expect(await sessionFactory.owner()).to.equal(owner.address);
        });
        it("Should have 0 session", async function () {
            expect(await sessionFactory.sessionCount()).to.equal(0);
        });
    });

    describe("Session Creation", function () {
        let session: any;
        let result: any;
        describe("First session", function () {
            beforeEach(async function () {
                session = await sessionFactory.createSession("Label", "Description", "31/11/22",["Choice 1", "Choice 2", "Choice 3", "Choice 4"]);
                result = await sessionFactory.getSession(0);
            });
            it("Should create a session", async function () {
                expect(await sessionFactory.sessionCount()).to.equal(1);
            });
            it("with the right label: 'Label'", async function () {
                expect(result[0]).to.equal("Label");
            });
            it("with the right description: 'Description'", async function () {
                expect(result[1]).to.equal("Description");
            });
            it("with the right end date: '31/11/22'", async function () {
                expect(result[2]).to.equal("31/11/22");
            });
            it("with the right choices: ['Choice 1', 'Choice 2', 'Choice 3', 'Choice 4']", async function () {
                expect(result[3][0]).to.equal("Choice 1");
                expect(result[3][1]).to.equal("Choice 2");
                expect(result[3][2]).to.equal("Choice 3");
                expect(result[3][3]).to.equal("Choice 4");
            });
            it("with the right status: 0 (Open)", async function () {
                expect(result[4]).to.equal(0);
            });
            it("should emit a NewSession event", async function () {
                await expect(session).to.emit(sessionFactory, "NewSession").withArgs(0, "Label", "Description", "31/11/22", 0, ["Choice 1", "Choice 2", "Choice 3", "Choice 4"]);
            });
        });
        describe("Second session", function () {
            it("Should create a second session", async function () {
                await sessionFactory.createSession("Label", "Description", "31/11/22",["Choice 1", "Choice 2", "Choice 3", "Choice 4"]);
                await sessionFactory.createSession("Label2", "Description2", "31/11/22",["Choice 5", "Choice 6", "Choice 7", "Choice 8"]);
                expect(await sessionFactory.sessionCount()).to.equal(2);
            });
        });
    });

    describe("VoteFactory Contract", function () {
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
                    vote = await voteFactory.createVote(0, [0,1,2,3]);
                });
                it("Should create a vote", async function () {
                    expect(await voteFactory.voteCount()).to.equal(1);
                });
                it("Should fail if already voted (even if choice order changed)", async function () {
                    await expect(voteFactory.createVote(0, [3,2,0,1])).to.be.revertedWith("You have already voted");
                    expect(await voteFactory.voteCount()).to.equal(1);
                });
            });
        });
    });
});

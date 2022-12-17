import {Contract, ContractFactory} from "ethers";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";

import {ethers} from "hardhat";
import {expect} from 'chai';

const chai = require('chai');
chai.use(require('chai-shallow-deep-equal'));

describe("VoteResult Contract", function() {
    let VoteResult: ContractFactory;
    let voteResult: Contract;
    let owner: SignerWithAddress;
    let addr1: SignerWithAddress;
    let addr2: SignerWithAddress;

    beforeEach(async function() {
        VoteResult = await ethers.getContractFactory("VoteResult");
        [owner, addr1, addr2] = await ethers.getSigners();
        voteResult = await VoteResult.deploy();
    });

    describe("Deployment", function() {
        it("Should set the right owner", async function() {
            expect(await voteResult.owner()).to.equal(owner.address);
        });
    });

    describe("Vote Result", function() {
        describe("Result for a session", function() {
            const sessionEndDate = 3093525298800; // Dec 01 99999 00:00:00 UTC
            beforeEach(async function() {
                await voteResult.createSession("Label", "Description", sessionEndDate, ["Choice 1", "Choice 2", "Choice 3", "Choice 4"]);
                await voteResult.createVote(0, [0, 1, 2, 3]);
                await voteResult.createVote(0, [0, 1, 2, 3]);
                await voteResult.createVote(0, [1, 0, 2, 3]);
                await voteResult.createVote(0, [2, 1, 0, 3]);
                await voteResult.createVote(0, [3, 1, 0, 2]);
            });
            it("Should return choice ids array for session 0", async function() {
                expect(await voteResult.sessionToChoices[0]).to.equal([0, 1, 2, 3]);
            });
            it("Should return a results table of the initial votes by choice", async function() {
                expect(await voteResult.getInitializeResultArray(voteResult.sessionToChoices[0])).to.equal([[2, 1, 2, 0],[1, 3, 0, 0],[1, 0, 2, 1],[1, 0, 0, 3]]);
            });
        });
    });
});
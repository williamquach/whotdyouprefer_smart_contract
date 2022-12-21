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
    let addr3: SignerWithAddress;
    let addr4: SignerWithAddress;
    let addr5: SignerWithAddress;

    beforeEach(async function() {
        VoteResult = await ethers.getContractFactory("VoteResults");
        [owner, addr1, addr2, addr3, addr4, addr5] = await ethers.getSigners();
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
                await voteResult.connect(addr1).createVote(0, [0, 1, 2, 3]);
                await voteResult.connect(addr2).createVote(0, [0, 1, 2, 3]);
                await voteResult.connect(addr3).createVote(0, [1, 0, 2, 3]);
                await voteResult.connect(addr4).createVote(0, [2, 1, 0, 3]);
                await voteResult.connect(addr5).createVote(0, [3, 1, 0, 2]);
            });
            it("Should return choice ids array for session 0", async function() {
                expect(await voteResult.choicesForSession[0]).to.deep.equal([0, 1, 2, 3]);
            });
            it("Should return a results table of the initial votes by choice", async function() {
                expect(await voteResult.getInitializeResultArray(voteResult.choicesForSession[0])).to.equal([[2, 1, 2, 0],[1, 3, 0, 0],[1, 0, 2, 1],[1, 0, 0, 3]]);
            });
        });
    });
});
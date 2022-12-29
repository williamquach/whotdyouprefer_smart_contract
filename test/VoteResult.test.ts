import {BigNumber, Contract, ContractFactory} from "ethers";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";

import {ethers} from "hardhat";
import {expect} from 'chai';

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

            it("Should return choice ids array for session 0", async function () {
                expect(await voteResult.getChoiceBySessionId(0)).to.deep.equal([0, 1, 2, 3]);
            });

            it("Should return a results table of the initial votes by choice", async function () {
                expect(await voteResult.getInitializeResultArray(await voteResult.getAllVotesBySessionId(0),await voteResult.getChoiceBySessionId(0))).to.deep.equal(
                    [
                        [
                            BigNumber.from(2),
                            BigNumber.from(1),
                            BigNumber.from(2),
                            BigNumber.from(0)
                        ],
                        [
                            BigNumber.from(1),
                            BigNumber.from(4),
                            BigNumber.from(0),
                            BigNumber.from(0)
                        ],
                        [
                            BigNumber.from(1),
                            BigNumber.from(0),
                            BigNumber.from(3),
                            BigNumber.from(1)
                        ],
                        [
                            BigNumber.from(1),
                            BigNumber.from(0),
                            BigNumber.from(0),
                            BigNumber.from(4)
                        ]
                    ]
                );
            });

            it("Should return the loser of the first turn", async function () {
                let result =  await voteResult.getInitializeResultArray(await voteResult.getAllVotesBySessionId(0),await voteResult.getChoiceBySessionId(0));
                expect(await voteResult.getTheLoserFromTheRound(result, await voteResult.getChoiceBySessionId(0))).to.deep.equal(3);
            });

            describe("Should return votes redissolved",  function () {
                let result: any;
                let votes: any;
                let choiceIds: any;

                beforeEach(async function () {
                    result =  await voteResult.getInitializeResultArray(await voteResult.getAllVotesBySessionId(0),await voteResult.getChoiceBySessionId(0));
                    votes = await voteResult.getAllVotesBySessionId(0);
                    choiceIds = await voteResult.getChoiceBySessionId(0);

                });

                it("Of the second round", async function () {
                    expect(await voteResult.rediscoverTheVotes(3, result, votes, choiceIds, 2)).to.deep.equal(
                        [
                            [
                                BigNumber.from(2),
                                BigNumber.from(1),
                                BigNumber.from(2),
                                BigNumber.from(0)
                            ],
                            [
                                BigNumber.from(2),
                                BigNumber.from(4),
                                BigNumber.from(0),
                                BigNumber.from(0)
                            ],
                            [
                                BigNumber.from(1),
                                BigNumber.from(0),
                                BigNumber.from(3),
                                BigNumber.from(1)
                            ],
                            [
                                BigNumber.from(1),
                                BigNumber.from(0),
                                BigNumber.from(0),
                                BigNumber.from(4)
                            ]
                        ]
                    );
                });

                it("Of the third round", async function () {
                    result = await voteResult.rediscoverTheVotes(3, result, votes, choiceIds, 2)
                    choiceIds = await voteResult.remove(choiceIds, 3);
                    expect(await voteResult.rediscoverTheVotes(2, result, votes, choiceIds, 3)).to.deep.equal(
                        [
                            [
                                BigNumber.from(3),
                                BigNumber.from(1),
                                BigNumber.from(2),
                                BigNumber.from(0)
                            ],
                            [
                                BigNumber.from(3),
                                BigNumber.from(4),
                                BigNumber.from(0),
                                BigNumber.from(0)
                            ],
                            [
                                BigNumber.from(1),
                                BigNumber.from(0),
                                BigNumber.from(3),
                                BigNumber.from(1)
                            ],
                            [
                                BigNumber.from(1),
                                BigNumber.from(0),
                                BigNumber.from(0),
                                BigNumber.from(4)
                            ]
                        ]
                    );
                });
            });

            it("Should return the winner of the session", async function () {
                expect(await voteResult.getWinnerBySessionId(0)).to.deep.equal(1);
            });
        });
    });
});
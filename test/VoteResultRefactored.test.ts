import {Contract, ContractFactory} from "ethers";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";

import {ethers} from "hardhat";
import {expect} from 'chai';

const chai = require('chai');
chai.use(require('chai-shallow-deep-equal'));

describe("VoteResult Contract - Refactored", function() {
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
            it("Should return choice ids array for session 0", async function() {
                await voteResult.createSession("Label", "Description", sessionEndDate, ["Choice 1", "Choice 2", "Choice 3", "Choice 4"]);
                await voteResult.connect(addr1).createVote(0, [0, 1, 2, 3]);
                await voteResult.connect(addr2).createVote(0, [0, 1, 2, 3]);
                await voteResult.connect(addr3).createVote(0, [1, 0, 2, 3]);
                await voteResult.connect(addr4).createVote(0, [2, 1, 0, 3]);
                await voteResult.connect(addr5).createVote(0, [3, 1, 0, 2]);
                expect(await voteResult.getChoiceBySessionId(0)).to.deep.equal([0, 1, 2, 3]);
            });

            it("Should return an empty array and no winner when no vote", async function() {
                await voteResult.createSession("Label", "Description", sessionEndDate, ["Choice 1", "Choice 2", "Choice 3", "Choice 4"]);
                const results = await voteResult.getSessionResults(0);
                //@ts-ignore
                expect(results).to.shallowDeepEqual(
                    {
                        session: {
                            session: {
                                sessionId: 0,
                                endDateTime: sessionEndDate,
                                label: "Label",
                                description: "Description"
                            },
                            choices: [
                                {
                                    choiceId: 0,
                                    label: "Choice 1",
                                },
                                {
                                    choiceId: 1,
                                    label: "Choice 2",
                                },
                                {
                                    choiceId: 2,
                                    label: "Choice 3",
                                },
                                {
                                    choiceId: 3,
                                    label: "Choice 4",
                                },
                            ]
                        },
                        result: [],
                        choiceIdWinners: []
                    }
                );
            });

            it("Should return the winner of the session when complex", async function() {
                await voteResult.createSession("Label", "Description", sessionEndDate, ["Choice 1", "Choice 2", "Choice 3", "Choice 4"]);
                await voteResult.connect(addr1).createVote(0, [0, 1, 2, 3]);
                await voteResult.connect(addr2).createVote(0, [0, 1, 2, 3]);
                await voteResult.connect(addr3).createVote(0, [1, 0, 2, 3]);
                await voteResult.connect(addr4).createVote(0, [2, 1, 0, 3]);
                await voteResult.connect(addr5).createVote(0, [3, 1, 0, 2]);

                // nb  v1  -v2  -v3  v4
                // 2   1   -2   -2   2
                // 1   1   -1   -2   2
                // 1   1   -2   -1   2
                // 1   2   -2   -3   1

                const results = await voteResult.getSessionResults(0);
                //@ts-ignore
                expect(results).to.shallowDeepEqual(
                    {
                        session: {
                            session: {
                                sessionId: 0,
                                endDateTime: sessionEndDate,
                                label: "Label",
                                description: "Description"
                            },
                            choices: [
                                {
                                    choiceId: 0,
                                    label: "Choice 1",
                                },
                                {
                                    choiceId: 1,
                                    label: "Choice 2",
                                },
                                {
                                    choiceId: 2,
                                    label: "Choice 3",
                                },
                                {
                                    choiceId: 3,
                                    label: "Choice 4",
                                },
                            ]
                        },
                        result:
                            [
                                [2, 1, 2, 0],
                                [1, 4, 0, 0],
                                [1, 0, 3, 1],
                                [1, 0, 0, 4]
                            ],
                        choiceIdWinners: [1]
                    }
                );
            });

            it("Should return the third choice id as winner with only 1 vote", async function() {
                await voteResult.createSession("Testing 1 vote", "Description", sessionEndDate, ["Choice 1", "Choice 2", "Choice 3", "Choice 4"]);
                await voteResult.connect(addr1).createVote(0, [2, 1, 3, 0]); // Voting for choice 3, choice 2, choice 4, then choice 1
                const results = await voteResult.getSessionResults(0);
                //@ts-ignore
                expect(results).to.shallowDeepEqual(
                    {
                        session: {
                            session: {
                                sessionId: 0,
                                endDateTime: sessionEndDate,
                                label: "Testing 1 vote",
                                description: "Description"
                            },
                            choices: [
                                {
                                    choiceId: 0,
                                    label: "Choice 1",
                                },
                                {
                                    choiceId: 1,
                                    label: "Choice 2",
                                },
                                {
                                    choiceId: 2,
                                    label: "Choice 3",
                                },
                                {
                                    choiceId: 3,
                                    label: "Choice 4",
                                },
                            ]
                        },
                        result:
                            [
                                [0, 0, 0, 1],
                                [0, 1, 0, 0],
                                [1, 0, 0, 0],
                                [0, 0, 1, 0]
                            ],
                        choiceIdWinners: [2]
                    }
                );
            });

            it('Should return the third choice id as winner of the session with 2 votes for the same choice', async function() {
                await voteResult.createSession("Testing 2 votes for same choice", "Description", sessionEndDate, ["Choice 1", "Choice 2", "Choice 3", "Choice 4"]);
                await voteResult.connect(addr1).createVote(0, [2, 1, 3, 0]); // Voting for choice 3, choice 2, choice 4, then choice 1
                await voteResult.connect(addr2).createVote(0, [2, 1, 3, 0]); // Voting for choice 3, choice 2, choice 4, then choice 1
                const results = await voteResult.getSessionResults(0);
                //@ts-ignore
                expect(results).to.shallowDeepEqual(
                    {
                        session: {
                            session: {
                                sessionId: 0,
                                endDateTime: sessionEndDate,
                                label: "Testing 2 votes for same choice",
                                description: "Description"
                            },
                            choices: [
                                {
                                    choiceId: 0,
                                    label: "Choice 1",
                                },
                                {
                                    choiceId: 1,
                                    label: "Choice 2",
                                },
                                {
                                    choiceId: 2,
                                    label: "Choice 3",
                                },
                                {
                                    choiceId: 3,
                                    label: "Choice 4",
                                },
                            ]
                        },
                        result:
                            [
                                [0, 0, 0, 2],
                                [0, 2, 0, 0],
                                [2, 0, 0, 0],
                                [0, 0, 2, 0]
                            ],
                        choiceIdWinners: [2]
                    }
                );
            });

            it('Should return the third choice id as winner of the session with 2 partially different votes', async function() {
                await voteResult.createSession("Testing 2 different votes", "Description", sessionEndDate, ["Choice 1", "Choice 2", "Choice 3", "Choice 4"]);
                await voteResult.connect(addr1).createVote(0, [2, 1, 3, 0]);
                await voteResult.connect(addr2).createVote(0, [2, 0, 1, 3]);
                const results = await voteResult.getSessionResults(0);
                //@ts-ignore
                expect(results).to.shallowDeepEqual(
                    {
                        session: {
                            session: {
                                sessionId: 0,
                                endDateTime: sessionEndDate,
                                label: "Testing 2 different votes",
                                description: "Description"
                            },
                            choices: [
                                {
                                    choiceId: 0,
                                    label: "Choice 1",
                                },
                                {
                                    choiceId: 1,
                                    label: "Choice 2",
                                },
                                {
                                    choiceId: 2,
                                    label: "Choice 3",
                                },
                                {
                                    choiceId: 3,
                                    label: "Choice 4",
                                },
                            ]
                        },
                        result:
                            [
                                [0, 1, 0, 1],
                                [0, 1, 1, 0],
                                [2, 0, 0, 0],
                                [0, 0, 1, 1]
                            ],
                        choiceIdWinners: [2]
                    }
                );
            });

            it('Should return the third choice id as winner of the session with 2 partially different votes - bis', async function() {
                await voteResult.createSession("Forgettable", "Description", sessionEndDate, ["Choice 1", "Choice 2", "Choice 3", "Choice 4"]);

                await voteResult.createSession("Testing 2 different votes", "Description", sessionEndDate, ["Choice 1", "Choice 2", "Choice 3", "Choice 4"]);
                await voteResult.connect(addr1).createVote(1, [6, 5, 7, 4]);
                await voteResult.connect(addr2).createVote(1, [6, 4, 5, 7]);
                const results = await voteResult.getSessionResults(1);
                //@ts-ignore
                expect(results).to.shallowDeepEqual(
                    {
                        session: {
                            session: {
                                sessionId: 1,
                                endDateTime: sessionEndDate,
                                label: "Testing 2 different votes",
                                description: "Description"
                            },
                            choices: [
                                {
                                    choiceId: 4,
                                    label: "Choice 1",
                                },
                                {
                                    choiceId: 5,
                                    label: "Choice 2",
                                },
                                {
                                    choiceId: 6,
                                    label: "Choice 3",
                                },
                                {
                                    choiceId: 7,
                                    label: "Choice 4",
                                },
                            ]
                        },
                        result:
                            [
                                [0, 1, 0, 1],
                                [0, 1, 1, 0],
                                [2, 0, 0, 0],
                                [0, 0, 1, 1]
                            ],
                        choiceIdWinners: [6]
                    }
                );
            });

            it('Should return the first and third choice id as winner of the session with 2 different votes', async function() {
                await voteResult.createSession("Testing 2 different votes", "Description", sessionEndDate, ["Choice 1", "Choice 2", "Choice 3", "Choice 4"]);
                await voteResult.connect(addr1).createVote(0, [2, 1, 3, 0]);
                await voteResult.connect(addr2).createVote(0, [0, 2, 1, 3]);
                const results = await voteResult.getSessionResults(0);
                //@ts-ignore
                expect(results).to.shallowDeepEqual(
                    {
                        session: {
                            session: {
                                sessionId: 0,
                                endDateTime: sessionEndDate,
                                label: "Testing 2 different votes",
                                description: "Description"
                            },
                            choices: [
                                {
                                    choiceId: 0,
                                    label: "Choice 1",
                                },
                                {
                                    choiceId: 1,
                                    label: "Choice 2",
                                },
                                {
                                    choiceId: 2,
                                    label: "Choice 3",
                                },
                                {
                                    choiceId: 3,
                                    label: "Choice 4",
                                },
                            ]
                        },
                        result:
                            [
                                [1, 0, 0, 1],
                                [0, 1, 1, 0],
                                [1, 1, 0, 0],
                                [0, 0, 1, 1]
                            ],
                        choiceIdWinners: [0, 2]
                    }
                );
            });
        });
    });
});

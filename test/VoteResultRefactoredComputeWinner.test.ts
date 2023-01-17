import {Contract, ContractFactory} from "ethers";

import {ethers} from "hardhat";
import {expect} from 'chai';

const chai = require('chai');
chai.use(require('chai-shallow-deep-equal'));

describe("VoteResult Contract - Refactored", function() {
    let VoteResult: ContractFactory;
    let voteResult: Contract;

    beforeEach(async function() {
        VoteResult = await ethers.getContractFactory("VoteResults");
        voteResult = await VoteResult.deploy();
    });


    describe('Testing Compute winner', function() {
        // function computeWinners(Vote[] memory votes, int[] memory choiceIds, uint preferenceRank) public pure returns (uint[] memory)
        describe('computeWinners(votes, choiceIds, preferenceRank)', function() {
            it('Should compute winners', async function() {
                const sessionId = 0;
                const choiceIds = [4, 5, 6, 7];
                const votes = [
                    {sessionId, choiceIds: [7, 6, 5, 4]},
                    {sessionId, choiceIds: [7, 6, 5, 4]},
                ];

                const res = await voteResult.computeWinners({
                    votes: votes,
                    choiceIds: choiceIds,
                    preferenceRank: 0,
                    choiceIdsThatCanLose: choiceIds
                });
                // @ts-ignore
                expect(res).to.shallowDeepEqual(
                    [
                        [7],
                        [
                            {sessionId, choiceIds: [7, -1, -1, -1]},
                            {sessionId, choiceIds: [7, -1, -1, -1]}
                        ],
                        [-1, -1, -1, 7],
                    ]
                );
            });

            it('Should compute winners with case that doesnt pass in external tests', async function() {
                const sessionId = 0;
                const choiceIds = [0, 1, 2, 3];
                const votes = [
                    {sessionId, choiceIds: [0, 1, 2, 3]},
                    {sessionId, choiceIds: [0, 1, 2, 3]},
                    {sessionId, choiceIds: [1, 0, 2, 3]},
                    {sessionId, choiceIds: [2, 1, 0, 3]},
                    {sessionId, choiceIds: [3, 1, 0, 2]},
                ];

                const winners = await voteResult.computeWinners({
                    votes: votes,
                    choiceIds: choiceIds,
                    preferenceRank: 0,
                    choiceIdsThatCanLose: choiceIds
                });
                // @ts-ignore
                expect(winners).to.shallowDeepEqual(
                    {
                        winners: [1],
                        votes: [
                            {sessionId, choiceIds: [1, -1, -1, -1]},
                            {sessionId, choiceIds: [1, -1, -1, -1]},
                            {sessionId, choiceIds: [1, -1, -1, -1]},
                            {sessionId, choiceIds: [1, -1, -1, -1]},
                            {sessionId, choiceIds: [1, -1, -1, -1]},
                        ],
                        choiceIds: [-1, 1, -1, -1],
                    }
                );
            });
        });
    });
});
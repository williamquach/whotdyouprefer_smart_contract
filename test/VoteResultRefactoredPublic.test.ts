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

    describe('Testing public functions', function() {
        const sessionEndDate = 3093525298800; // Dec 01 99999 00:00:00 UTC
        // function countVotesByChoiceOnPreference(Vote[] memory votes, int[] memory choiceIds, uint preference) public pure returns (uint[] memory)
        describe('countVotesByChoiceOnPreference(votes, choiceIds, preference)', function() {
            it('Should count votes by choice on preference', async function() {
                const votes = [
                    {
                        sessionId: 0,
                        choiceIds: [0, 1, 2, 3],
                    },
                    {
                        sessionId: 0,
                        choiceIds: [2, 1, 0, 3],
                    },
                    {
                        sessionId: 0,
                        choiceIds: [2, 1, 0, 3],
                    }
                ];
                const choiceIds = [0, 1, 2, 3];
                const preferenceZero = 0
                expect(await voteResult.countVotesByChoiceOnPreference(votes, choiceIds, preferenceZero, choiceIds)).to.deep.equal([1, 0, 2, 0]);

                const preferenceOne = 1
                expect(await voteResult.countVotesByChoiceOnPreference(votes, choiceIds, preferenceOne, choiceIds)).to.deep.equal([0, 3, 0, 0]);

                const preferenceTwo = 2
                expect(await voteResult.countVotesByChoiceOnPreference(votes, choiceIds, preferenceTwo, choiceIds)).to.deep.equal([2, 0, 1, 0]);

                const preferenceThree = 3
                expect(await voteResult.countVotesByChoiceOnPreference(votes, choiceIds, preferenceThree, choiceIds)).to.deep.equal([0, 0, 0, 3]);
            });

            it('Should count votes by choice on preference with deleted choices', async function() {
                let choiceIds = [4, 5, -1, 7];
                let votes = [
                    {sessionId: 0, choiceIds: [4, 5, 7, -1]},
                    {sessionId: 0, choiceIds: [5, 4, 7, -1]},
                    {sessionId: 0, choiceIds: [5, 4, 7, -1]}
                ];
                const preferenceZero = 0
                expect(await voteResult.countVotesByChoiceOnPreference(votes, choiceIds, preferenceZero, choiceIds)).to.deep.equal([1, 2, -1, 0]);

                choiceIds = [4, 5, -1, -1];
                votes = [
                    {sessionId: 0, choiceIds: [4, 5, -1, -1]},
                    {sessionId: 0, choiceIds: [5, 4, -1, -1]},
                    {sessionId: 0, choiceIds: [5, 4, -1, -1]}
                ];
                expect(await voteResult.countVotesByChoiceOnPreference(votes, choiceIds, preferenceZero, choiceIds)).to.deep.equal([1, 2, -1, -1]);

                choiceIds = [-1, 5, -1, -1];
                votes = [
                    {sessionId: 0, choiceIds: [5, -1, -1, -1]},
                    {sessionId: 0, choiceIds: [5, -1, -1, -1]},
                    {sessionId: 0, choiceIds: [5, -1, -1, -1]}
                ];
                expect(await voteResult.countVotesByChoiceOnPreference(votes, choiceIds, preferenceZero, choiceIds)).to.deep.equal([-1, 3, -1, -1]);
            });
        });

        // function getInitializeResultArray(Vote[] memory _votes, int[] memory _choiceIds) public pure returns (uint[4][4] memory)
        describe('getInitializeResultArray(votes, choiceIds)', function() {
            it('Should initialize result array', async function() {
                const votes = [
                    {
                        sessionId: 0,
                        choiceIds: [0, 1, 2, 3],
                    },
                    {
                        sessionId: 0,
                        choiceIds: [2, 1, 0, 3],
                    }
                ];
                const choiceIds = [0, 1, 2, 3];
                expect(await voteResult.getInitializeResultArray(votes, choiceIds)).to.deep.equal([
                    [1, 0, 1, 0],
                    [0, 2, 0, 0],
                    [1, 0, 1, 0],
                    [0, 0, 0, 2]
                ]);
            });
        });

        // function getChoiceLoserIndexes(uint[] memory array) public pure returns (uint[] memory)
        describe('getChoiceLoserIndexes(array)', function() {
            it('Should get choice loser indexes (by min values except -1)', async function() {
                const array = [1, 2, 3, 4];
                expect(await voteResult.getChoiceLoserIndexes(array)).to.deep.equal([0]);

                const array2 = [2, 1, 3, 4];
                expect(await voteResult.getChoiceLoserIndexes(array2)).to.deep.equal([1]);

                const array3 = [2, 3, 1, 4];
                expect(await voteResult.getChoiceLoserIndexes(array3)).to.deep.equal([2]);

                const array4 = [2, 3, 4, 1];
                expect(await voteResult.getChoiceLoserIndexes(array4)).to.deep.equal([3]);

                const array6 = [2, 2, 2, 2];
                expect(await voteResult.getChoiceLoserIndexes(array6)).to.deep.equal([]);

                const array7 = [2, 2, 2, 1];
                expect(await voteResult.getChoiceLoserIndexes(array7)).to.deep.equal([3]);

                const array8 = [2, 2, 1, 1];
                expect(await voteResult.getChoiceLoserIndexes(array8)).to.deep.equal([2, 3]);

                const array9 = [2, 1, 1, 1];
                expect(await voteResult.getChoiceLoserIndexes(array9)).to.deep.equal([1, 2, 3]);

                const array10 = [-1, 2, -1, 3];
                expect(await voteResult.getChoiceLoserIndexes(array10)).to.deep.equal([1]);

                const array11 = [-1, -1, 1, 1];
                expect(await voteResult.getChoiceLoserIndexes(array11)).to.deep.equal([2, 3]);

                const array12 = [-1, -1, -1, -1];
                expect(await voteResult.getChoiceLoserIndexes(array12)).to.deep.equal([]);

                const array13 = [0, 0, 0, 0];
                expect(await voteResult.getChoiceLoserIndexes(array13)).to.deep.equal([]);
            });
        });

        // function removeLosersFromChoices(uint[] memory choiceLoserIndexes, int[] memory choiceIds) public pure returns (int[] memory)
        describe('removeLosersFromChoices(choiceLoserIndexes, choiceIds)', function() {
            it('Should remove losers from choices', async function() {
                const choiceIds = [0, 1, 2, 3];

                const choiceLoserIndexes = [0];
                expect(await voteResult.removeLosersFromChoices(choiceLoserIndexes, choiceIds)).to.deep.equal([-1, 1, 2, 3]);

                const choiceLoserIndexes2 = [1];
                expect(await voteResult.removeLosersFromChoices(choiceLoserIndexes2, choiceIds)).to.deep.equal([0, -1, 2, 3]);

                const choiceLoserIndexes3 = [2];
                expect(await voteResult.removeLosersFromChoices(choiceLoserIndexes3, choiceIds)).to.deep.equal([0, 1, -1, 3]);

                const choiceLoserIndexes4 = [3];
                expect(await voteResult.removeLosersFromChoices(choiceLoserIndexes4, choiceIds)).to.deep.equal([0, 1, 2, -1]);

                const choiceLoserIndexes5 = [0, 1, 2, 3];
                expect(await voteResult.removeLosersFromChoices(choiceLoserIndexes5, choiceIds)).to.deep.equal([-1, -1, -1, -1]);

                const choiceLoserIndexes6 = [0, 1, 2];
                expect(await voteResult.removeLosersFromChoices(choiceLoserIndexes6, choiceIds)).to.deep.equal([-1, -1, -1, 3]);

                const choiceLoserIndexes7 = [0, 1];
                expect(await voteResult.removeLosersFromChoices(choiceLoserIndexes7, choiceIds)).to.deep.equal([-1, -1, 2, 3]);

                const choiceLoserIndexes8 = [1, 2];
                expect(await voteResult.removeLosersFromChoices(choiceLoserIndexes8, choiceIds)).to.deep.equal([0, -1, -1, 3]);

                const choiceLoserIndexes9 = [2, 3];
                expect(await voteResult.removeLosersFromChoices(choiceLoserIndexes9, choiceIds)).to.deep.equal([0, 1, -1, -1]);

                const choiceLoserIndexes10 = [0, 3];
                expect(await voteResult.removeLosersFromChoices(choiceLoserIndexes10, choiceIds)).to.deep.equal([-1, 1, 2, -1]);

                const choiceLoserIndexes11 = [0, 2];
                expect(await voteResult.removeLosersFromChoices(choiceLoserIndexes11, choiceIds)).to.deep.equal([-1, 1, -1, 3]);

                const choiceLoserIndexes12 = [1, 3];
                expect(await voteResult.removeLosersFromChoices(choiceLoserIndexes12, choiceIds)).to.deep.equal([0, -1, 2, -1]);

                const choiceLoserIndexes13 = [1, 2, 3];
                expect(await voteResult.removeLosersFromChoices(choiceLoserIndexes13, choiceIds)).to.deep.equal([0, -1, -1, -1]);
            });
        });

        // function getWinnersFromChoiceIds(int[] memory _choiceIds) public pure returns (uint[] memory)
        describe('getWinnersFromChoiceIds(choiceIds)', function() {
            it('Should get winners from choice ids', async function() {
                const choiceIds = [0, 1, 2, 3];
                expect(await voteResult.getWinnersFromChoiceIds(choiceIds)).to.deep.equal([0, 1, 2, 3]);

                const choiceIds2 = [-1, 1, 2, 3];
                expect(await voteResult.getWinnersFromChoiceIds(choiceIds2)).to.deep.equal([1, 2, 3]);

                const choiceIds3 = [-1, -1, 2, 3];
                expect(await voteResult.getWinnersFromChoiceIds(choiceIds3)).to.deep.equal([2, 3]);

                const choiceIds4 = [-1, -1, -1, 3];
                expect(await voteResult.getWinnersFromChoiceIds(choiceIds4)).to.deep.equal([3]);

                const choiceIds5 = [-1, -1, -1, -1];
                expect(await voteResult.getWinnersFromChoiceIds(choiceIds5)).to.deep.equal([]);

                const choiceIds6 = [0, -1, -1, -1];
                expect(await voteResult.getWinnersFromChoiceIds(choiceIds6)).to.deep.equal([0]);

                const choiceIds7 = [0, 1, -1, -1];
                expect(await voteResult.getWinnersFromChoiceIds(choiceIds7)).to.deep.equal([0, 1]);

                const choiceIds8 = [0, 1, 2, -1];
                expect(await voteResult.getWinnersFromChoiceIds(choiceIds8)).to.deep.equal([0, 1, 2]);

                const choiceIds9 = [-1, 1, -1, -1];
                expect(await voteResult.getWinnersFromChoiceIds(choiceIds9)).to.deep.equal([1]);

                const choiceIds10 = [-1, 1, 2, -1];
                expect(await voteResult.getWinnersFromChoiceIds(choiceIds10)).to.deep.equal([1, 2]);

                const choiceIds11 = [-1, 1, -1, 3];
                expect(await voteResult.getWinnersFromChoiceIds(choiceIds11)).to.deep.equal([1, 3]);

                const choiceIds12 = [0, -1, 2, -1];
                expect(await voteResult.getWinnersFromChoiceIds(choiceIds12)).to.deep.equal([0, 2]);

                const choiceIds13 = [0, -1, 2, 3];
                expect(await voteResult.getWinnersFromChoiceIds(choiceIds13)).to.deep.equal([0, 2, 3]);

                const choiceIds14 = [0, 1, -1, 3];
                expect(await voteResult.getWinnersFromChoiceIds(choiceIds14)).to.deep.equal([0, 1, 3]);
            });
        });

        // function countChoiceIdsLeftInResults(int[] memory choiceIds) public pure returns (uint)
        describe('countChoiceIdsLeftInResults(choiceIds)', function() {
            it('Should get choice ids left in results', async function() {
                const choiceIds = [0, 1, 2, 3];
                expect(await voteResult.countChoiceIdsLeftInResults(choiceIds)).to.equal(4);

                const choiceIds2 = [-1, 1, 2, 3];
                expect(await voteResult.countChoiceIdsLeftInResults(choiceIds2)).to.equal(3);

                const choiceIds3 = [-1, -1, 2, 3];
                expect(await voteResult.countChoiceIdsLeftInResults(choiceIds3)).to.equal(2);

                const choiceIds4 = [-1, -1, -1, 3];
                expect(await voteResult.countChoiceIdsLeftInResults(choiceIds4)).to.equal(1);

                const choiceIds5 = [-1, -1, -1, -1];
                expect(await voteResult.countChoiceIdsLeftInResults(choiceIds5)).to.equal(0);

                const choiceIds6 = [0, -1, -1, -1];
                expect(await voteResult.countChoiceIdsLeftInResults(choiceIds6)).to.equal(1);

                const choiceIds7 = [0, 1, -1, -1];
                expect(await voteResult.countChoiceIdsLeftInResults(choiceIds7)).to.equal(2);

                const choiceIds8 = [0, 1, 2, -1];
                expect(await voteResult.countChoiceIdsLeftInResults(choiceIds8)).to.equal(3);

                const choiceIds9 = [-1, 1, -1, -1];
                expect(await voteResult.countChoiceIdsLeftInResults(choiceIds9)).to.equal(1);

                const choiceIds10 = [-1, 1, 2, -1];
                expect(await voteResult.countChoiceIdsLeftInResults(choiceIds10)).to.equal(2);

                const choiceIds11 = [-1, 1, -1, 3];
                expect(await voteResult.countChoiceIdsLeftInResults(choiceIds11)).to.equal(2);

                const choiceIds12 = [0, -1, 2, -1];
                expect(await voteResult.countChoiceIdsLeftInResults(choiceIds12)).to.equal(2);

                const choiceIds13 = [0, -1, 2, 3];
                expect(await voteResult.countChoiceIdsLeftInResults(choiceIds13)).to.equal(3);

                const choiceIds14 = [0, 1, -1, 3];
                expect(await voteResult.countChoiceIdsLeftInResults(choiceIds14)).to.equal(3);
            })

            // function orderArrayDesc(uint[] memory array) public pure returns (uint[] memory) {
            describe('orderArrayDesc(array)', function() {
                it('Should order array desc', async function() {
                    const array = [0, 1, 2, 3];
                    expect(await voteResult.orderArrayDesc(array)).to.deep.equal([3, 2, 1, 0]);

                    const array2 = [3, 2, 1, 0];
                    expect(await voteResult.orderArrayDesc(array2)).to.deep.equal([3, 2, 1, 0]);

                    const array3 = [1, 2, 3, 0];
                    expect(await voteResult.orderArrayDesc(array3)).to.deep.equal([3, 2, 1, 0]);

                    const array4 = [1, 3, 2, 0];
                    expect(await voteResult.orderArrayDesc(array4)).to.deep.equal([3, 2, 1, 0]);

                    const array5 = [3, 1, 2, 0];
                    expect(await voteResult.orderArrayDesc(array5)).to.deep.equal([3, 2, 1, 0]);

                    const array6 = [3, 2, 0, 1];
                    expect(await voteResult.orderArrayDesc(array6)).to.deep.equal([3, 2, 1, 0]);

                    const array7 = [3, 0, 2, 1];
                    expect(await voteResult.orderArrayDesc(array7)).to.deep.equal([3, 2, 1, 0]);

                    const array8 = [0, 3, 2, 1];
                    expect(await voteResult.orderArrayDesc(array8)).to.deep.equal([3, 2, 1, 0]);

                    const array9 = [2, 3, 1, 0];
                    expect(await voteResult.orderArrayDesc(array9)).to.deep.equal([3, 2, 1, 0]);

                    const array10 = [2, 1, 3, 0];
                    expect(await voteResult.orderArrayDesc(array10)).to.deep.equal([3, 2, 1, 0]);

                    const array11 = [2, 0, 3, 1];
                    expect(await voteResult.orderArrayDesc(array11)).to.deep.equal([3, 2, 1, 0]);

                    const array12 = [0, 2, 3, 1];
                    expect(await voteResult.orderArrayDesc(array12)).to.deep.equal([3, 2, 1, 0]);
                });
            });

            // function shiftNotLostArrayElementToTheLeft(int[] memory array, uint index) public pure returns (int[] memory) {
            describe('shiftNotLostArrayElementToTheLeft(array, index)', function() {
                it('Should shift not lost array element to the left', async function() {
                    const array = [0, 1, 2, 3];
                    expect(await voteResult.shiftElementToTheLeftAndSetLostLast(array, 0)).to.deep.equal([1, 2, 3, -1]);
                    expect(await voteResult.shiftElementToTheLeftAndSetLostLast(array, 1)).to.deep.equal([0, 2, 3, -1]);
                    expect(await voteResult.shiftElementToTheLeftAndSetLostLast(array, 2)).to.deep.equal([0, 1, 3, -1]);
                    expect(await voteResult.shiftElementToTheLeftAndSetLostLast(array, 3)).to.deep.equal([0, 1, 2, -1]);

                    const array2 = [3, 2, 1, 0];
                    expect(await voteResult.shiftElementToTheLeftAndSetLostLast(array2, 0)).to.deep.equal([2, 1, 0, -1]);
                    expect(await voteResult.shiftElementToTheLeftAndSetLostLast(array2, 1)).to.deep.equal([3, 1, 0, -1]);
                    expect(await voteResult.shiftElementToTheLeftAndSetLostLast(array2, 2)).to.deep.equal([3, 2, 0, -1]);
                    expect(await voteResult.shiftElementToTheLeftAndSetLostLast(array2, 3)).to.deep.equal([3, 2, 1, -1]);

                    const array3 = [1, 2, 3, 0];
                    expect(await voteResult.shiftElementToTheLeftAndSetLostLast(array3, 0)).to.deep.equal([2, 3, 0, -1]);
                    expect(await voteResult.shiftElementToTheLeftAndSetLostLast(array3, 1)).to.deep.equal([1, 3, 0, -1]);
                    expect(await voteResult.shiftElementToTheLeftAndSetLostLast(array3, 2)).to.deep.equal([1, 2, 0, -1]);
                    expect(await voteResult.shiftElementToTheLeftAndSetLostLast(array3, 3)).to.deep.equal([1, 2, 3, -1]);

                    const array4 = [1, 3, 2, 0];
                    expect(await voteResult.shiftElementToTheLeftAndSetLostLast(array4, 0)).to.deep.equal([3, 2, 0, -1]);
                    expect(await voteResult.shiftElementToTheLeftAndSetLostLast(array4, 1)).to.deep.equal([1, 2, 0, -1]);
                    expect(await voteResult.shiftElementToTheLeftAndSetLostLast(array4, 2)).to.deep.equal([1, 3, 0, -1]);
                    expect(await voteResult.shiftElementToTheLeftAndSetLostLast(array4, 3)).to.deep.equal([1, 3, 2, -1]);

                    const array5 = [-1, 1, 2, 3];
                    expect(await voteResult.shiftElementToTheLeftAndSetLostLast(array5, 0)).to.deep.equal([1, 2, 3, -1]);
                    expect(await voteResult.shiftElementToTheLeftAndSetLostLast(array5, 1)).to.deep.equal([-1, 2, 3, -1]);
                    expect(await voteResult.shiftElementToTheLeftAndSetLostLast(array5, 2)).to.deep.equal([-1, 1, 3, -1]);
                    expect(await voteResult.shiftElementToTheLeftAndSetLostLast(array5, 3)).to.deep.equal([-1, 1, 2, -1]);
                });
            });

            // function redistributeLoserVotes(uint[] memory choiceLoserIds, Vote[] memory votes) public pure returns (Vote[] memory)
            describe('redistributeLoserVotes(choiceLoserIds, votes)', function() {
                it('Should redistribute loser votes', async function() {
                    const choiceIds = [0, 1, 2, 3];
                    const sessionId = 0;

                    const choiceLoserIds = [0];
                    const votes = [
                        {sessionId, choiceIds},
                    ]
                    // @ts-ignore
                    expect(await voteResult.redistributeLoserVotes(choiceLoserIds, votes, choiceIds)).to.shallowDeepEqual([
                        {sessionId, choiceIds: [1, 2, 3, -1]},
                    ]);

                    const choiceLoserIds2 = [0, 1];
                    const votes2 = [
                        {sessionId, choiceIds},
                    ]
                    // @ts-ignore
                    expect(await voteResult.redistributeLoserVotes(choiceLoserIds2, votes2, choiceIds)).to.shallowDeepEqual([
                        {sessionId, choiceIds: [2, 3, -1, -1]},
                    ]);

                    const choiceLoserIds3 = [0, 1, 2];
                    const votes3 = [
                        {sessionId, choiceIds},
                    ]
                    // @ts-ignore
                    expect(await voteResult.redistributeLoserVotes(choiceLoserIds3, votes3, choiceIds)).to.shallowDeepEqual([
                        {sessionId, choiceIds: [3, -1, -1, -1]},
                    ]);

                    const choiceLoserIds4 = [0, 1, 2, 3];
                    const votes4 = [
                        {sessionId, choiceIds},
                    ]
                    // @ts-ignore
                    expect(await voteResult.redistributeLoserVotes(choiceLoserIds4, votes4, choiceIds)).to.shallowDeepEqual([
                        {sessionId, choiceIds: [-1, -1, -1, -1]},
                    ]);

                    const choiceLoserIds5 = [1, 2]
                    const votes5 = [
                        {sessionId, choiceIds},
                        {sessionId, choiceIds},
                    ]
                    // @ts-ignore
                    expect(await voteResult.redistributeLoserVotes(choiceLoserIds5, votes5, choiceIds)).to.shallowDeepEqual([
                        {sessionId, choiceIds: [0, 3, -1, -1]},
                        {sessionId, choiceIds: [0, 3, -1, -1]},
                    ]);
                });

                it('Should redistribute loser votes with choices already lost', async function() {
                    let choiceIds = [0, -1, -1, 3];
                    const sessionId = 0;

                    const choiceLoserIds = [0];
                    const votes = [
                        {sessionId, choiceIds: [0, 3, -1, -1]},
                    ]
                    // @ts-ignore
                    expect(await voteResult.redistributeLoserVotes(choiceLoserIds, votes, choiceIds)).to.shallowDeepEqual([
                        {sessionId, choiceIds: [3, -1, -1, -1]},
                    ]);

                    choiceIds = [0, -1, 2, 3];
                    const choiceLoserIds2 = [0, 2];
                    const votes2 = [
                        {sessionId, choiceIds: [0, 3, 2, -1]},
                    ]
                    // @ts-ignore
                    expect(await voteResult.redistributeLoserVotes(choiceLoserIds2, votes2, choiceIds)).to.shallowDeepEqual([
                        {sessionId, choiceIds: [3, -1, -1, -1]},
                    ]);
                });
            });
        });

        // function removeWinnersFromIndexesThatCanLose(uint[] memory choiceLoserIndexes, int[] memory choiceIndexesThatCanLose) public pure returns (int[] memory) {
        describe('removeWinnersFromIndexesThatCanLose(choiceLoserIndexes, choiceIndexesThatCanLose)', function() {
            it('Should remove winner from indexes that can lose', async function() {
                const choiceLoserIds = [4];
                const choiceIdsThatCanLose = [4, 5, 6, 7];
                expect(await voteResult.removeWinnersFromIdsThatCanLose(choiceLoserIds, choiceIdsThatCanLose)).to.deep.equal(
                    [4]
                );

                const choiceLoserIds2 = [4, 5];
                const choiceIdsThatCanLose2 = [4, 5, 6, 7];
                expect(await voteResult.removeWinnersFromIdsThatCanLose(choiceLoserIds2, choiceIdsThatCanLose2)).to.deep.equal(
                    [4, 5]
                );

                const choiceLoserIds3 = [4, 5, 6];
                const choiceIdsThatCanLose3 = [4, 5, 6, 7];
                expect(await voteResult.removeWinnersFromIdsThatCanLose(choiceLoserIds3, choiceIdsThatCanLose3)).to.deep.equal(
                    [4, 5, 6]
                );
            });
        });

        // function getNewChoiceIdsThatCanLose(int[] memory choiceIds) public pure returns (int[] memory) {
        describe('getNewChoiceIdsThatCanLose(choiceIds)', function() {
            it('Should get new choice ids that can lose', async function() {
                const choiceIds = [4, 5, 6, 7];
                expect(await voteResult.getNewChoiceIdsThatCanLose(choiceIds)).to.deep.equal(
                    [4, 5, 6, 7]
                );

                const choiceIds2 = [-1, 5, 6, 7];
                expect(await voteResult.getNewChoiceIdsThatCanLose(choiceIds2)).to.deep.equal(
                    [5, 6, 7]
                );

                const choiceIds3 = [-1, -1, 6, 7];
                expect(await voteResult.getNewChoiceIdsThatCanLose(choiceIds3)).to.deep.equal(
                    [6, 7]
                );

                const choiceIds4 = [-1, -1, -1, 7];
                expect(await voteResult.getNewChoiceIdsThatCanLose(choiceIds4)).to.deep.equal(
                    [7]
                );

                const choiceIds5 = [-1, -1, -1, -1];
                expect(await voteResult.getNewChoiceIdsThatCanLose(choiceIds5)).to.deep.equal(
                    []
                );

                const choiceIds6 = [4, 5, 6, -1];
                expect(await voteResult.getNewChoiceIdsThatCanLose(choiceIds6)).to.deep.equal(
                    [4, 5, 6]
                );

                const choiceIds7 = [4, 5, -1, -1];
                expect(await voteResult.getNewChoiceIdsThatCanLose(choiceIds7)).to.deep.equal(
                    [4, 5]
                );

                const choiceIds8 = [4, -1, -1, -1];
                expect(await voteResult.getNewChoiceIdsThatCanLose(choiceIds8)).to.deep.equal(
                    [4]
                );
            });
        });
    });
});
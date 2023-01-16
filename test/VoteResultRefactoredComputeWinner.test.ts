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
                const res = await voteResult.computeWinners(votes, choiceIds, 0, choiceIds);
                console.log('DEBUG - easy case : ', JSON.stringify(res, null, 4));
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

                const winners = await voteResult.computeWinners(votes, choiceIds, 0, choiceIds);
                // console.log('DEBUG : winners', JSON.stringify(winners, null, 4));
                // @ts-ignore
                expect(winners).to.shallowDeepEqual(
                    [
                        [1],
                        [
                            {sessionId, choiceIds: [1, -1, -1, -1]},
                            {sessionId, choiceIds: [1, -1, -1, -1]},
                            {sessionId, choiceIds: [1, -1, -1, -1]},
                            {sessionId, choiceIds: [1, -1, -1, -1]},
                            {sessionId, choiceIds: [1, -1, -1, -1]},
                        ],
                        [-1, 1, -1, -1],
                    ]
                );
            });
        });

        describe('Testing e2e - like it was computeWinners function', function() {
            it('should compute winners', async function() {
                // Entries : Vote[] memory votes, int[] memory choiceIds, uint preferenceRank, int[] memory choiceIdsThatCanLose
                const sessionId = 0;
                let choiceIds = [4, 5, 6, 7];
                let votes = [
                    {sessionId, choiceIds: [6, 5, 7, 4]},
                    {sessionId, choiceIds: [6, 4, 5, 7]},
                ];
                const preferenceRank: number = 0;
                let choiceIdsThatCanLose = choiceIds; // For now

                // Simulate : uint choiceIdsLeftCount = countChoiceIdsLeftInResults(choiceIds);
                const choiceIdsLeftCount = await voteResult.countChoiceIdsLeftInResults(choiceIds);
                expect(choiceIdsLeftCount).to.equal(4);
                console.log('DEBUG - choiceIdsLeftCount : ', choiceIdsLeftCount);

                // if (choiceIdsLeftCount == 1) {
                //     return (getWinnersFromChoiceIds(choiceIds), votes, choiceIds, preferenceRank);
                // }
                // if (preferenceRank > choiceIdsLeftCount - 1) {
                //     return (getWinnersFromChoiceIds(choiceIds), votes, choiceIds, preferenceRank);
                // }
                if (choiceIdsLeftCount === 1 || preferenceRank > choiceIdsLeftCount - 1) {
                    const winners = await voteResult.getWinnersFromChoiceIds(choiceIds);
                    console.log('DEBUG - winners : ', winners);
                    return;
                }

                // // Count number of preferenceRank for each choice
                // int[] memory preferenceCountByChoiceId = countVotesByChoiceOnPreference(votes, choiceIds, preferenceRank, choiceIdsThatCanLose);
                const preferenceCountByChoiceId = await voteResult.countVotesByChoiceOnPreference(votes, choiceIds, preferenceRank, choiceIdsThatCanLose);
                console.log('DEBUG - preferenceCountByChoiceId : ', preferenceCountByChoiceId);
                expect(preferenceCountByChoiceId).to.deep.equal([0, 0, 2, 0]);


                // RIGHT IN ASCII CHARS : TODO -> VERIFIER QUE LE FLOW ICI EST LE MEME QUE DANS LE CODE DE LA FONCTION computeWinners
                // __     _______ ____  ___ _____ ___ _____ ____     ___  _   _ _____   _     _____   _____ _     _____        __  ___ ____ ___   _____ ____ _____   _     _____   __  __ _____ __  __ _____    ___  _   _ _____   ____    _    _   _ ____    _     _____    ____ ___  ____  _____   ____  _____   _        _      _____ ___  _   _  ____ _____ ___ ___  _   _                                   _     __        ___
                //  \ \   / / ____|  _ \|_ _|  ___|_ _| ____|  _ \   / _ \| | | | ____| | |   | ____| |  ___| |   / _ \ \      / / |_ _/ ___|_ _| | ____/ ___|_   _| | |   | ____| |  \/  | ____|  \/  | ____|  / _ \| | | | ____| |  _ \  / \  | \ | / ___|  | |   | ____|  / ___/ _ \|  _ \| ____| |  _ \| ____| | |      / \    |  ___/ _ \| \ | |/ ___|_   _|_ _/ _ \| \ | |   ___ ___  _ __ ___  _ __  _   _| |_ __\ \      / (_)_ __  _ __   ___ _ __ ___
                //   \ \ / /|  _| | |_) || || |_   | ||  _| | |_) | | | | | | | |  _|   | |   |  _|   | |_  | |  | | | \ \ /\ / /   | | |    | |  |  _| \___ \ | |   | |   |  _|   | |\/| |  _| | |\/| |  _|   | | | | | | |  _|   | | | |/ _ \ |  \| \___ \  | |   |  _|   | |  | | | | | | |  _|   | | | |  _|   | |     / _ \   | |_ | | | |  \| | |     | |  | | | | |  \| |  / __/ _ \| '_ ` _ \| '_ \| | | | __/ _ \ \ /\ / /| | '_ \| '_ \ / _ \ '__/ __|
                //    \ V / | |___|  _ < | ||  _|  | || |___|  _ <  | |_| | |_| | |___  | |___| |___  |  _| | |__| |_| |\ V  V /    | | |___ | |  | |___ ___) || |   | |___| |___  | |  | | |___| |  | | |___  | |_| | |_| | |___  | |_| / ___ \| |\  |___) | | |___| |___  | |__| |_| | |_| | |___  | |_| | |___  | |___ / ___ \  |  _|| |_| | |\  | |___  | |  | | |_| | |\  | | (_| (_) | | | | | | |_) | |_| | ||  __/\ V  V / | | | | | | | |  __/ |  \__ \
                //     \_/  |_____|_| \_\___|_|   |___|_____|_| \_\  \__\_\\___/|_____| |_____|_____| |_|   |_____\___/  \_/\_/    |___\____|___| |_____|____/ |_|   |_____|_____| |_|  |_|_____|_|  |_|_____|  \__\_\\___/|_____| |____/_/   \_\_| \_|____/  |_____|_____|  \____\___/|____/|_____| |____/|_____| |_____/_/   \_\ |_|   \___/|_| \_|\____| |_| |___\___/|_| \_|  \___\___/|_| |_| |_| .__/ \__,_|\__\___| \_/\_/  |_|_| |_|_| |_|\___|_|  |___/


                // // See if there are loser to eliminate
                // uint[] memory choiceLoserIndexes = getChoiceLoserIndexes(preferenceCountByChoiceId);
                // int[] memory choiceLoserIds = getChoiceLoserIds(choiceIds, choiceLoserIndexes);
                let choiceLoserIndexes = await voteResult.getChoiceLoserIndexes(preferenceCountByChoiceId);
                const choiceLoserIds = await voteResult.getChoiceLoserIds(choiceIds, choiceLoserIndexes);
                console.log('DEBUG - choiceLoserIds : ', choiceLoserIds);
                expect(choiceLoserIds).to.deep.equal([4, 5, 7]);

                // // Remove losers from choiceIdsThatCanLose
                // choiceIdsThatCanLose = removeWinnersFromIdsThatCanLose(choiceLoserIds, choiceIdsThatCanLose);
                choiceIdsThatCanLose = await voteResult.removeWinnersFromIdsThatCanLose(choiceLoserIds, choiceIdsThatCanLose);
                console.log('DEBUG - choiceIdsThatCanLose : ', choiceIdsThatCanLose);
                expect(choiceIdsThatCanLose).to.deep.equal([4, 5, 7]);


                // // If there is no loser :
                // if (choiceLoserIndexes.length == 0) {
                //     if (preferenceRank == 3) {
                //         return (getWinnersFromChoiceIds(choiceIds), votes, choiceIds, preferenceRank);
                //     }
                //     // Start again with preference n + 1
                //     return computeWinners(votes, choiceIds, preferenceRank + 1, choiceIdsThatCanLose);
                // }
                if (choiceLoserIndexes.length === 0) {
                    console.log('DEBUG - choiceLoserIndexes.length === 0');
                    if (preferenceRank == 3) {
                        const winners = await voteResult.getWinnersFromChoiceIds(choiceIds);
                        console.log('DEBUG - winners : ', winners);
                        return;
                    }
                    // Start again with preference n + 1
                    console.log('DEBUG - Start again with preference n + 1');
                    return;
                }

                // if (choiceLoserIndexes.length == choiceIdsLeftCount) {
                //     if (preferenceRank == 3) {
                //         // If losers.length == number of choices left && preferenceRank == 3 (last preference)
                //         // -> return the result bc there is no winner
                //         return (getWinnersFromChoiceIds(choiceIds), votes, choiceIds, preferenceRank);
                //     }
                //     // Start again with preference n + 1
                //     return computeWinners(votes, choiceIds, preferenceRank + 1, choiceIdsThatCanLose);
                // }
                if (choiceLoserIndexes.length === choiceIdsLeftCount) {
                    console.log('DEBUG - choiceLoserIndexes.length === choiceIdsLeftCount');
                    if (preferenceRank == 3) {
                        // If losers.length == number of choices left && preferenceRank == 3 (last preference)
                        // -> return the result bc there is no winner
                        const winners = await voteResult.getWinnersFromChoiceIds(choiceIds);
                        console.log('DEBUG - winners : ', winners);
                        return;
                    }
                    // Start again with preference n + 1
                    console.log('DEBUG - Start again with preference n + 1');
                    return;
                }

                // // If there is loser, eliminate the loser and start again
                // if (choiceLoserIndexes.length == 1) {
                //     votes = redistributeLoserVotes(choiceLoserIndexes, votes, choiceIds);
                //     choiceIds = removeLosersFromChoices(choiceLoserIndexes, choiceIds);
                //     return computeWinners(votes, choiceIds, 0, getNewChoiceIdsThatCanLose(choiceIds));
                // }
                if (choiceLoserIndexes.length === 1) {
                    console.log('DEBUG - choiceLoserIndexes.length === 1');
                    votes = await voteResult.redistributeLoserVotes(choiceLoserIndexes, votes, choiceIds);
                    console.log('DEBUG - votes : ', votes);
                    expect(votes).to.deep.equal([
                        {sessionId, choiceIds: [6, 5, 7, 4]},
                        {sessionId, choiceIds: [6, 4, 5, 7]},
                    ]);

                    choiceIds = await voteResult.removeLosersFromChoices(choiceLoserIndexes, choiceIds);
                    console.log('DEBUG - choiceIds : ', choiceIds);
                    expect(choiceIds).to.deep.equal([6, 5, 7]);

                    choiceIdsThatCanLose = await voteResult.getNewChoiceIdsThatCanLose(choiceIds);
                    console.log('DEBUG - choiceIdsThatCanLose : ', choiceIdsThatCanLose);
                    expect(choiceIdsThatCanLose).to.deep.equal([6, 5, 7]);

                    return;
                }
                //
                // // If there is multiple losers :
                //
                // // If losers.length < number of choices left -> eliminate the losers and start again
                // if (choiceLoserIndexes.length < choiceIdsLeftCount) {
                //     if (preferenceRank == 3) {
                //         votes = redistributeLoserVotes(choiceLoserIndexes, votes, choiceIds);
                //         choiceIds = removeLosersFromChoices(choiceLoserIndexes, choiceIds);
                //         return computeWinners(votes, choiceIds, 0, getNewChoiceIdsThatCanLose(choiceIds));
                //     }
                //     return computeWinners(votes, choiceIds, preferenceRank + 1, choiceIdsThatCanLose);
                // }
                if (choiceLoserIndexes.length < choiceIdsLeftCount) {
                    console.log('DEBUG - choiceLoserIndexes.length < choiceIdsLeftCount');
                    if (preferenceRank == 3) {
                        votes = await voteResult.redistributeLoserVotes(choiceLoserIndexes, votes, choiceIds);
                        console.log('DEBUG - votes : ', votes);
                        expect(votes).to.deep.equal([
                            {sessionId, choiceIds: [6, 5, 7, 4]},
                            {sessionId, choiceIds: [6, 4, 5, 7]},
                        ]);

                        choiceIds = await voteResult.removeLosersFromChoices(choiceLoserIndexes, choiceIds);
                        console.log('DEBUG - choiceIds : ', choiceIds);
                        expect(choiceIds).to.deep.equal([6, 5, 7]);

                        choiceIdsThatCanLose = await voteResult.getNewChoiceIdsThatCanLose(choiceIds);
                        console.log('DEBUG - choiceIdsThatCanLose : ', choiceIdsThatCanLose);
                        expect(choiceIdsThatCanLose).to.deep.equal([6, 5, 7]);

                        return;
                    }
                    console.log('==============================');
                    console.log('==============================');
                    console.log('==============================');
                    console.log('DEBUG - Start again with preference n + 1');
                    const choiceIdsLeftCount = await voteResult.countChoiceIdsLeftInResults(choiceIds);
                    expect(choiceIdsLeftCount).to.equal(4);
                    console.log('DEBUG - choiceIdsLeftCount : ', choiceIdsLeftCount);

                    const preferenceCountByChoiceId = await voteResult.countVotesByChoiceOnPreference(votes, choiceIds, 1, choiceIdsThatCanLose);
                    console.log('DEBUG - preferenceCountByChoiceId : ', preferenceCountByChoiceId);
                    expect(preferenceCountByChoiceId).to.deep.equal([1, 1, -1, 0]);

                    choiceLoserIndexes = await voteResult.getChoiceLoserIndexes(preferenceCountByChoiceId);
                    const choiceLoserIds = await voteResult.getChoiceLoserIds(choiceIds, choiceLoserIndexes);
                    console.log('DEBUG - choiceLoserIds : ', choiceLoserIds);
                    expect(choiceLoserIds).to.deep.equal([7]);

                    choiceIdsThatCanLose = await voteResult.removeWinnersFromIdsThatCanLose(choiceLoserIds, choiceIdsThatCanLose);
                    console.log('DEBUG - choiceIdsThatCanLose : ', choiceIdsThatCanLose);
                    expect(choiceIdsThatCanLose).to.deep.equal([7]);

                    votes = await voteResult.redistributeLoserVotes(choiceLoserIndexes, votes, choiceIds);
                    console.log('DEBUG - votes : ', votes);
                    choiceIds = await voteResult.removeLosersFromChoices(choiceLoserIndexes, choiceIds);
                    console.log('DEBUG - choiceIds : ', choiceIds);
                    expect(choiceIds).to.deep.equal([4, 5, 6, -1]);

                    console.log('==============================');
                    console.log('==============================');
                    console.log('==============================');
                    console.log('DEBUG - Start again with preference 0');
                    const choiceIdsLeftCount2 = await voteResult.countChoiceIdsLeftInResults(choiceIds);
                    expect(choiceIdsLeftCount2).to.equal(3);
                    console.log('DEBUG - choiceIdsLeftCount2 : ', choiceIdsLeftCount2);

                    choiceIdsThatCanLose = await voteResult.getNewChoiceIdsThatCanLose(choiceIds);
                    const preferenceCountByChoiceId2 = await voteResult.countVotesByChoiceOnPreference(votes, choiceIds, 0, choiceIdsThatCanLose);
                    console.log('DEBUG - preferenceCountByChoiceId2 : ', preferenceCountByChoiceId2);
                    expect(preferenceCountByChoiceId2).to.deep.equal([0, 0, 2, -1]);

                    const choiceLoserIndexes2 = await voteResult.getChoiceLoserIndexes(preferenceCountByChoiceId2);
                    const choiceLoserIds2 = await voteResult.getChoiceLoserIds(choiceIds, choiceLoserIndexes2);
                    console.log('DEBUG - choiceLoserIds2 : ', choiceLoserIds2);
                    expect(choiceLoserIds2).to.deep.equal([4, 5]);

                    choiceIdsThatCanLose = await voteResult.removeWinnersFromIdsThatCanLose(choiceLoserIds2, choiceIdsThatCanLose);
                    console.log('DEBUG - choiceIdsThatCanLose : ', choiceIdsThatCanLose);
                    expect(choiceIdsThatCanLose).to.deep.equal([4, 5]);

                    console.log('==============================');
                    console.log('==============================');
                    console.log('==============================');
                    console.log('DEBUG - Start again with preference 1');
                    const choiceIdsLeftCount3 = await voteResult.countChoiceIdsLeftInResults(choiceIds);
                    expect(choiceIdsLeftCount3).to.equal(3);
                    console.log('DEBUG - choiceIdsLeftCount3 : ', choiceIdsLeftCount3);

                    const preferenceCountByChoiceId3 = await voteResult.countVotesByChoiceOnPreference(votes, choiceIds, 1, choiceIdsThatCanLose);
                    console.log('DEBUG - preferenceCountByChoiceId3 : ', preferenceCountByChoiceId3);
                    expect(preferenceCountByChoiceId3).to.deep.equal([1, 1, -1, -1]);

                    const choiceLoserIndexes3 = await voteResult.getChoiceLoserIndexes(preferenceCountByChoiceId3);
                    const choiceLoserIds3 = await voteResult.getChoiceLoserIds(choiceIds, choiceLoserIndexes3);
                    console.log('DEBUG - choiceLoserIds3 : ', choiceLoserIds3);
                    expect(choiceLoserIds3).to.deep.equal([4, 5]);

                    choiceIdsThatCanLose = await voteResult.removeWinnersFromIdsThatCanLose(choiceLoserIds3, choiceIdsThatCanLose);
                    console.log('DEBUG - choiceIdsThatCanLose : ', choiceIdsThatCanLose);
                    expect(choiceIdsThatCanLose).to.deep.equal([4, 5]);

                    console.log('==============================');
                    console.log('==============================');
                    console.log('==============================');
                    console.log('DEBUG - Start again with preference 2');
                    const choiceIdsLeftCount4 = await voteResult.countChoiceIdsLeftInResults(choiceIds);
                    expect(choiceIdsLeftCount4).to.equal(3);
                    console.log('DEBUG - choiceIdsLeftCount4 : ', choiceIdsLeftCount4);

                    const preferenceCountByChoiceId4 = await voteResult.countVotesByChoiceOnPreference(votes, choiceIds, 2, choiceIdsThatCanLose);
                    console.log('DEBUG - preferenceCountByChoiceId4 : ', preferenceCountByChoiceId4);
                    expect(preferenceCountByChoiceId4).to.deep.equal([1, 1, -1, -1]);

                    const choiceLoserIndexes4 = await voteResult.getChoiceLoserIndexes(preferenceCountByChoiceId4);
                    const choiceLoserIds4 = await voteResult.getChoiceLoserIds(choiceIds, choiceLoserIndexes4);
                    console.log('DEBUG - choiceLoserIds4 : ', choiceLoserIds4);
                    expect(choiceLoserIds4).to.deep.equal([4, 5]);

                    choiceIdsThatCanLose = await voteResult.removeWinnersFromIdsThatCanLose(choiceLoserIds4, choiceIdsThatCanLose);
                    console.log('DEBUG - choiceIdsThatCanLose : ', choiceIdsThatCanLose);
                    expect(choiceIdsThatCanLose).to.deep.equal([4, 5]);

                    console.log('==============================');
                    console.log('==============================');
                    console.log('==============================');
                    console.log('DEBUG - Start again with preference 3');
                    const choiceIdsLeftCount5 = await voteResult.countChoiceIdsLeftInResults(choiceIds);
                    expect(choiceIdsLeftCount5).to.equal(3);
                    console.log('DEBUG - choiceIdsLeftCount5 : ', choiceIdsLeftCount5);

                    const preferenceCountByChoiceId5 = await voteResult.countVotesByChoiceOnPreference(votes, choiceIds, 3, choiceIdsThatCanLose);
                    console.log('DEBUG - preferenceCountByChoiceId5 : ', preferenceCountByChoiceId5);
                    expect(preferenceCountByChoiceId5).to.deep.equal([0, 0, -1, -1]);

                    const choiceLoserIndexes5 = await voteResult.getChoiceLoserIndexes(preferenceCountByChoiceId5);
                    const choiceLoserIds5 = await voteResult.getChoiceLoserIds(choiceIds, choiceLoserIndexes5);
                    console.log('DEBUG - choiceLoserIds5 : ', choiceLoserIds5);
                    expect(choiceLoserIds5).to.deep.equal([4, 5]);

                    choiceIdsThatCanLose = await voteResult.removeWinnersFromIdsThatCanLose(choiceLoserIds5, choiceIdsThatCanLose);
                    console.log('DEBUG - choiceIdsThatCanLose : ', choiceIdsThatCanLose);
                    expect(choiceIdsThatCanLose).to.deep.equal([4, 5]);

                    console.log('==============================');
                    console.log('==============================');
                    console.log('==============================');
                    console.log('DEBUG - Redistribution of votes');
                    votes = await voteResult.redistributeLoserVotes(choiceLoserIndexes5, votes, choiceIds);
                    choiceIds = await voteResult.removeLosersFromChoices(choiceLoserIndexes5, choiceIds);
                    console.log('DEBUG - choiceIds : ', choiceIds);
                    console.log('DEBUG - votes : ', votes);
                    expect(choiceIds).to.deep.equal([-1, -1, 6, -1]);


                    console.log('==============================');
                    console.log('==============================');
                    console.log('==============================');
                    console.log('DEBUG - Start again with preference 0');
                    const choiceIdsLeftCount6 = await voteResult.countChoiceIdsLeftInResults(choiceIds);
                    expect(choiceIdsLeftCount6).to.equal(1);
                    console.log('DEBUG - choiceIdsLeftCount6 : ', choiceIdsLeftCount6)
                    return;
                }
            });
        });
    });
});
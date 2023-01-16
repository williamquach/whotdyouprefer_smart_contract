pragma solidity ^0.8.9;

import "./VoteFactory.sol";
import "./VoteResults.sol";

contract VoteResults is VoteFactory {

    struct Result {
        SessionInfoForSender session;
        uint[4][4] result;
        uint[] choiceIdWinners;
        int[] choiceIds;
        Vote[] votes;
    }

    function convertUIntMemoryArrayToIntMemoryArray(uint[] memory _array) private pure returns (int[] memory) {
        int[] memory result = new int[](_array.length);
        for (uint i = 0; i < _array.length; i++) {
            result[i] = int(_array[i]);
        }
        return result;
    }

    function getSessionResults(uint _sessionId) external view returns (Result memory) {
        int[] memory choiceIds = convertUIntMemoryArrayToIntMemoryArray(sessionToChoices[_sessionId]);
        Vote[] memory votes = getAllVotesBySessionId(_sessionId);
        SessionInfoForSender memory session = getSessionForSender(_sessionId);
        uint[4][4] memory result = getInitializeResultArray(votes, choiceIds);

        // If there is no vote, return an empty result
        if (votes.length == 0) {
            return Result(session, result, new uint[](0), choiceIds, votes);
        }

        uint[] memory winners;
        uint preferenceRank;
        (winners, votes, choiceIds, preferenceRank) = computeWinners(votes, choiceIds, 0, getNewChoiceIdsThatCanLose(choiceIds));

        return Result(session, result, winners, choiceIds, votes);
    }

    function contains(int[] memory _array, int _value) private pure returns (bool) {
        for (uint i = 0; i < _array.length; i++) {
            if (_array[i] == _value) {
                return true;
            }
        }
        return false;
    }

    function countVotesByChoiceOnPreference(Vote[] memory votes, int[] memory choiceIds, uint preference, int[] memory choiceIdsThatCanLose) public pure returns (int[] memory) {
        int[] memory result = new int[](choiceIds.length);
        for (uint voteIndex = 0; voteIndex < votes.length; voteIndex++) {
            Vote memory vote = votes[voteIndex];
            for (uint choiceIndex = 0; choiceIndex < choiceIds.length; choiceIndex++) {
                if (choiceIds[choiceIndex] >= 0 && contains(choiceIdsThatCanLose, choiceIds[choiceIndex])) {
                    if (vote.choiceIds[preference] == choiceIds[choiceIndex]) {
                        result[choiceIndex]++;
                    }
                }
                else {
                    result[choiceIndex] = - 1;
                }
            }
        }
        return result;
    }

    function getInitializeResultArray(Vote[] memory _votes, int[] memory _choiceIds) public pure returns (uint[4][4] memory) {
        uint[4][4] memory result;
        for (uint voteIndex = 0; voteIndex < _votes.length; voteIndex++) {
            for (uint choiceIndexInVote = 0; choiceIndexInVote < _votes[voteIndex].choiceIds.length; choiceIndexInVote++) {
                if (_votes[voteIndex].choiceIds[choiceIndexInVote] == _choiceIds[0]) result[0][choiceIndexInVote]++;
                if (_votes[voteIndex].choiceIds[choiceIndexInVote] == _choiceIds[1]) result[1][choiceIndexInVote]++;
                if (_votes[voteIndex].choiceIds[choiceIndexInVote] == _choiceIds[2]) result[2][choiceIndexInVote]++;
                if (_votes[voteIndex].choiceIds[choiceIndexInVote] == _choiceIds[3]) result[3][choiceIndexInVote]++;
            }
        }
        return result;
    }

    function getChoiceLoserIndexes(int[] memory array) public pure returns (uint[] memory) {
        // If all same value
        for (uint i = 1; i < array.length; i++) {
            if (array[i] != array[0]) {
                break;
            }
            if (i == array.length - 1) {
                uint[] memory result = new uint[](0);
                return result;
            }
        }

        int minValue = array[0];
        for (uint i = 0; i < array.length; i++) {
            if ((array[i] >= 0 && array[i] < minValue) || minValue < 0) {
                minValue = array[i];
            }
        }

        // Count the number of min values in array
        uint nbMinValues = 0;
        for (uint i = 0; i < array.length; i++) {
            if (array[i] == minValue) {
                nbMinValues++;
            }
        }

        // Check for others values equals to minValue
        uint[] memory minIndexes = new uint[](nbMinValues);
        uint count = 0;
        for (uint i = 0; i < array.length; i++) {
            if (array[i] == minValue) {
                minIndexes[count] = uint(i);
                count++;
            }
        }

        return minIndexes;
    }

    function removeLosersFromChoices(uint[] memory choiceLoserIndexes, int[] memory _choiceIds) public pure returns (int[] memory) {
        for (uint i = 0; i < choiceLoserIndexes.length; i++) {
            uint choiceLoserIndex = choiceLoserIndexes[i];
            _choiceIds[choiceLoserIndex] = - 1;
        }
        return _choiceIds;
    }

    function getWinnersFromChoiceIds(int[] memory _choiceIds) public pure returns (uint[] memory) {
        uint winnersCount = 0;
        for (uint i = 0; i < _choiceIds.length; i++) {
            if (_choiceIds[i] != - 1) {
                winnersCount++;
            }
        }

        uint[] memory winners = new uint[](winnersCount);
        uint winnerIndex = 0;
        for (uint i = 0; i < _choiceIds.length; i++) {
            if (_choiceIds[i] != - 1) {
                winners[winnerIndex] = uint(_choiceIds[i]);
                winnerIndex++;
            }
        }
        return winners;
    }

    function countChoiceIdsLeftInResults(int[] memory choiceIds) public pure returns (uint) {
        uint count = 0;
        for (uint i = 0; i < choiceIds.length; i++) {
            if (choiceIds[i] != - 1) {
                count++;
            }
        }
        return count;
    }

    function findFirstMinusOneInArray(int[] memory array) public pure returns (uint) {
        uint index = array.length - 1;
        for (uint i = 0; i < array.length; i++) {
            if (array[i] == - 1) {
                if (i - 1 > 0) {
                    index = i - 1;
                }
                else {
                    index = i;
                }
                break;
            }
        }
        return index;
    }

    function orderArrayDesc(uint[] memory array) public pure returns (uint[] memory) {
        for (uint i = 0; i < array.length; i++) {
            for (uint j = i + 1; j < array.length; j++) {
                if (array[i] < array[j]) {
                    uint temp = array[i];
                    array[i] = array[j];
                    array[j] = temp;
                }
            }
        }
        return array;
    }

    function shiftElementToTheLeftAndSetLostLast(int[] memory array, uint index) public pure returns (int[] memory) {
        for (uint i = index; i < array.length - 1; i++) {
            array[i] = array[i + 1];
        }
        array[array.length - 1] = - 1;
        return array;
        //        for (uint choiceIndex = choicePreferenceIndexInVote; choiceIndex < vote.choiceIds.length - 1; choiceIndex++) {
        //            vote.choiceIds[choiceIndex] = vote.choiceIds[choiceIndex + 1];
        //        }
        //        vote.choiceIds[vote.choiceIds.length - 1] = - 1;
    }

    function redistributeLoserVotes(uint[] memory choiceLoserIndexes, Vote[] memory votes, int[] memory choiceIds) public pure returns (Vote[] memory) {
        // Order choiceLoserIndex DESC to avoid index problems
        choiceLoserIndexes = orderArrayDesc(choiceLoserIndexes);

        Vote[] memory newVotes = new Vote[](votes.length);
        for (uint voteIndex = 0; voteIndex < votes.length; voteIndex++) {
            Vote memory vote = votes[voteIndex];
            // Remove the loser choice from the vote and move others votes to the left
            for (uint choiceLoserIndex = 0; choiceLoserIndex < choiceLoserIndexes.length; choiceLoserIndex++) {
                // votes = [
                //     {choiceIds: [1, 3, -1, -1]
                // ]
                // choiceLoserIndexes = [0, 2]
                // choiceIds = [-1, 1, -1, 3]
                int loserChoiceId = choiceIds[choiceLoserIndexes[choiceLoserIndex]];
                if (loserChoiceId != - 1) {
                    for (uint choicePreferenceIndexInVote = 0; choicePreferenceIndexInVote < vote.choiceIds.length; choicePreferenceIndexInVote++) {
                        if (vote.choiceIds[choicePreferenceIndexInVote] == loserChoiceId) {
                            // Move vote choice from the lost choice to the left
                            vote.choiceIds = shiftElementToTheLeftAndSetLostLast(vote.choiceIds, choicePreferenceIndexInVote);
                        }
                    }
                }
            }
            newVotes[voteIndex] = vote;
        }
        return newVotes;
    }

    function removeWinnersFromIdsThatCanLose(int[] memory choiceLoserIds, int[] memory choiceIdsThatCanLose) public pure returns (int[] memory) {
        int[] memory newChoiceIdsThatCanLose = new int[](choiceLoserIds.length);
        for (uint i = 0; i < choiceLoserIds.length; i++) {
            int choiceLoserId = choiceLoserIds[i];
            for (uint j = 0; j < choiceIdsThatCanLose.length; j++) {
                int choiceIdThatCanLose = choiceIdsThatCanLose[j];
                if (choiceLoserId == choiceIdThatCanLose) {
                    newChoiceIdsThatCanLose[i] = choiceIdThatCanLose;
                }
            }
        }
        return newChoiceIdsThatCanLose;
    }

    function getNewChoiceIdsThatCanLose(int[] memory choiceIds) public pure returns (int[] memory) {
        uint choiceIdThatCanLose = 0;
        for (uint i = 0; i < choiceIds.length; i++) {
            if (choiceIds[i] != - 1) {
                choiceIdThatCanLose++;
            }
        }
        int[] memory choiceIdsThatCanLose = new int[](choiceIdThatCanLose);
        uint choiceIdsThatCanLoseIndex = 0;
        for (uint i = 0; i < choiceIds.length; i++) {
            if (choiceIds[i] != - 1) {
                choiceIdsThatCanLose[choiceIdsThatCanLoseIndex] = choiceIds[i];
                choiceIdsThatCanLoseIndex++;
            }
        }
        return choiceIdsThatCanLose;
    }

    function getChoiceLoserIds(int[] memory choiceIds, uint[] memory choiceLoserIndexes) public pure returns (int[] memory) {
        int[] memory choiceLoserIds = new int[](choiceLoserIndexes.length);
        for (uint i = 0; i < choiceLoserIndexes.length; i++) {
            choiceLoserIds[i] = choiceIds[choiceLoserIndexes[i]];
        }
        return choiceLoserIds;
    }

    function computeWinners(Vote[] memory votes, int[] memory choiceIds, uint preferenceRank, int[] memory choiceIdsThatCanLose) public pure returns (uint[] memory, Vote[] memory, int[] memory, uint) {
        uint choiceIdsLeftCount = countChoiceIdsLeftInResults(choiceIds);

        if (choiceIdsLeftCount == 1) {
            return (getWinnersFromChoiceIds(choiceIds), votes, choiceIds, preferenceRank);
        }
        if (preferenceRank > choiceIdsLeftCount - 1) {
            return (getWinnersFromChoiceIds(choiceIds), votes, choiceIds, preferenceRank);
        }

        // Count number of preferenceRank for each choice
        int[] memory preferenceCountByChoiceId = countVotesByChoiceOnPreference(votes, choiceIds, preferenceRank, choiceIdsThatCanLose);

        // See if there are loser to eliminate
        uint[] memory choiceLoserIndexes = getChoiceLoserIndexes(preferenceCountByChoiceId);
        int[] memory choiceLoserIds = getChoiceLoserIds(choiceIds, choiceLoserIndexes);

        // Remove losers from choiceIdsThatCanLose
        choiceIdsThatCanLose = removeWinnersFromIdsThatCanLose(choiceLoserIds, choiceIdsThatCanLose);

        // If there is no loser :
        if (choiceLoserIndexes.length == 0) {
            if (preferenceRank == 3) {
                return (getWinnersFromChoiceIds(choiceIds), votes, choiceIds, preferenceRank);
            }
            // Start again with preference n + 1
            return computeWinners(votes, choiceIds, preferenceRank + 1, choiceIdsThatCanLose);
        }

        if (choiceLoserIndexes.length == choiceIdsLeftCount) {
            if (preferenceRank == 3) {
                // If losers.length == number of choices left && preferenceRank == 3 (last preference)
                // -> return the result bc there is no winner
                return (getWinnersFromChoiceIds(choiceIds), votes, choiceIds, preferenceRank);
            }
            // Start again with preference n + 1
            return computeWinners(votes, choiceIds, preferenceRank + 1, choiceIdsThatCanLose);
        }

        // If there is loser, eliminate the loser and start again
        if (choiceLoserIndexes.length == 1) {
            votes = redistributeLoserVotes(choiceLoserIndexes, votes, choiceIds);
            choiceIds = removeLosersFromChoices(choiceLoserIndexes, choiceIds);
            return computeWinners(votes, choiceIds, 0, getNewChoiceIdsThatCanLose(choiceIds));
        }

        // If there is multiple losers :

        // If losers.length < number of choices left -> eliminate the losers and start again
        if (choiceLoserIndexes.length < choiceIdsLeftCount) {
            if (preferenceRank == 3) {
                votes = redistributeLoserVotes(choiceLoserIndexes, votes, choiceIds);
                choiceIds = removeLosersFromChoices(choiceLoserIndexes, choiceIds);
                return computeWinners(votes, choiceIds, 0, getNewChoiceIdsThatCanLose(choiceIds));
            }
            return computeWinners(votes, choiceIds, preferenceRank + 1, choiceIdsThatCanLose);
        }

        // Wtf ?
        return (new uint[](0), votes, choiceIds, preferenceRank);
    }
}
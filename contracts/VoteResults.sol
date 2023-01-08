pragma solidity ^0.8.9;

import "./VoteFactory.sol";
import "./VoteResults.sol";

contract VoteResults is VoteFactory {

    struct Result {
        SessionInfoForSender session;
        uint [4][4] result;
        uint choiceIdWinner;
    }

    function getWinnerBySessionId(uint _sessionId) external view returns (Result memory) {
        uint[] memory choiceIds = sessionToChoices[_sessionId];
        Vote[] memory votes = getAllVotesBySessionId(_sessionId);
        //round 1
        uint[4][4] memory result = getInitializeResultArray(votes, choiceIds);
        uint loserId = getTheLoserFromTheRound(result, choiceIds);
        //round 2
        uint round = 2;
        // rediscover the votes of the loser round 2
        result = rediscoverTheVotes(loserId, result, votes, choiceIds, round);
        choiceIds = remove(choiceIds, loserId);
        loserId = getTheLoserFromTheRound(result, choiceIds);
        //round 3
        round++;
        // rediscover the votes of the loser round 3
        result = rediscoverTheVotes(loserId, result, votes, choiceIds, round);
        choiceIds = remove(choiceIds, loserId);
        loserId = getTheLoserFromTheRound(result, choiceIds);
        // last round
        choiceIds = remove(choiceIds, loserId);
        uint winner = getWinnerOfTheLastRound(choiceIds);
        SessionInfoForSender memory session = getSessionForSender(_sessionId);
        return Result(session, result, winner);
    }

    function getInitializeResultArray(Vote[] memory _votes, uint[] memory _choiceIds) private pure returns (uint[4][4] memory) {
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

    function rediscoverTheVotes(uint _loserId, uint[4][4] memory _result, Vote[] memory _votes, uint[] memory _choiceIds, uint _round) private pure returns (uint[4][4] memory) {
        for (uint i = 0; i < _votes.length; i++) {
            if (_votes[i].choiceIds[0] == _choiceIds[_loserId]) {
                if (_round == 2 || _round == 3) {
                    if (_choiceIds[0] == _votes[i].choiceIds[1]) _result[0][0]++;
                    else if (_choiceIds[1] == _votes[i].choiceIds[1]) _result[1][0]++;
                    else if (_choiceIds[2] == _votes[i].choiceIds[1]) _result[2][0]++;
                    else if (_choiceIds[3] == _votes[i].choiceIds[1]) _result[3][0]++;
                }
                if (_round == 3) {
                    if (_choiceIds[0] == _votes[i].choiceIds[2]) _result[0][0]++;
                    else if (_choiceIds[1] == _votes[i].choiceIds[2]) _result[1][0]++;
                    else if (_choiceIds[2] == _votes[i].choiceIds[2]) _result[2][0]++;
                    else if (_choiceIds[3] == _votes[i].choiceIds[2]) _result[3][0]++;
                }
            }
        }
        return _result;
    }

    function getTheLoserFromTheRound(uint[4][4] memory _result, uint[] memory _choiceIds) private pure returns (uint){
        uint loserId = 0;
        for (uint i = 1; i < _result.length; i++) {
            if (isRemoved(_choiceIds, i)) {
                continue;
            } else if (_result[i][0] < _result[loserId][0]) {
                loserId = i;
            } else if (_result[i][0] == _result[loserId][0]) {
                if (_result[i][1] < _result[loserId][1]) {
                    loserId = i;
                } else if (_result[i][1] == _result[loserId][1]) {
                    if (_result[i][2] < _result[loserId][2]) {
                        loserId = i;
                    } else if (_result[i][2] == _result[loserId][2]) {
                        if (_result[i][3] < _result[loserId][3]) {
                            loserId = i;
                        }
                    }
                }
            }
        }
        return loserId;
    }

    function isRemoved(uint[] memory _array, uint _choiceId) private pure returns (bool){
        return _array[_choiceId] == 99999999;
    }

    function remove(uint[] memory _array, uint _choiceId) private pure returns (uint[] memory){
        uint[] memory newArray = new uint[](_array.length);
        for (uint i = 0; i < _array.length; i++) {
            if (i == _choiceId) newArray[i] = 99999999;
            else newArray[i] = _array[i];
        }
        return newArray;
    }

    function getWinnerOfTheLastRound(uint[] memory _choiceIds) private pure returns (uint){
        uint winner = 99999999;
        for (uint i = 0; i < _choiceIds.length; i++) {
            if (_choiceIds[i] != 99999999) return i;
        }
        return winner;
    }
}
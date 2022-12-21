pragma solidity ^0.8.9;

import "./VoteFactory.sol";
import "./VoteResults.sol";

contract VoteResults is VoteFactory{

    event GetResult(Result);

    struct Result {
        uint sessionId;
        uint [][] result;
        uint choiceIdWinner;
    }

    Result[] public results;

    function getWinnerBySessionId(uint _sessionId) external view returns(uint) {
        uint[] memory choiceIds = sessionToChoices[_sessionId];
        Vote[] memory votes = getAllVotesBySessionId(_sessionId);
        //turn 1
        uint[][] memory result = getInitializeResultArray(votes);
        uint loserId = getTheLoserFromTheTurn(choiceIds, result);
        //turn 2
        uint turn = 2;
        // distribuer les voix du perdant tour 2
        result = rediscoverTheVotes(loserId, result, votes, turn);
        choiceIds = remove(choiceIds, loserId);
        loserId = getTheLoserFromTheTurn(choiceIds, result);
        //turn 3
        turn++;
        // distribuer les voix du perdant tour 3
        result = rediscoverTheVotes(loserId, result, votes,  turn);
        choiceIds = remove(choiceIds, loserId);
        loserId = getTheLoserFromTheTurn(choiceIds, result);
        // last turn
        choiceIds = remove(choiceIds, loserId);
        return choiceIds[0];
    }

    function getInitializeResultArray(Vote[] memory _votes) public pure returns(uint[][] memory) {
        uint[][] memory result;
        for(uint i = 0; i < _votes.length; i++) {
            for(uint j = 0; j < _votes[i].choiceIds.length; j++) {
                result[_votes[i].choiceIds[j]][j]++;
            }
        }
        return result;
    }

    function rediscoverTheVotes(uint _loserId, uint[][] memory _result, Vote[] memory _votes,  uint _turn) private pure returns(uint[][] memory) {
        for(uint i = 0; i < _votes.length; i++){
            if(_votes[i].choiceIds[0] == _loserId) {
                if(_turn == 2 || _turn == 3) {
                    _result[_votes[i].choiceIds[1]][0]++;
                }
                if(_turn == 3) {
                    _result[_votes[i].choiceIds[2]][0]++;
                }
            }
        }
        return _result;
    }

    function getTheLoserFromTheTurn(uint[] memory _choices, uint[][] memory _result) private pure returns(uint){
        uint loserId = _choices[0];
        for(uint i  = 1; i < _choices.length; i++) {
            if (_result[_choices[i]][0] < _result[loserId][0]) {
                loserId = _choices[i];
            }
        }
        return loserId;
    }

    function remove(uint[] memory _array, uint choiceId) private pure returns(uint[] memory){
        uint[] memory newArray;
        _array[choiceId] = _array[_array.length - 1];

    for (uint i = 0; i < _array.length - 1; i++) {
            _array[i] = newArray[i];
        }
        return newArray;
    }
}
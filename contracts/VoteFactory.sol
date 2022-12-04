pragma solidity ^0.8.9;

import "./SessionFactory.sol";
import "hardhat/console.sol";

contract VoteFactory is SessionFactory {
    event NewVote(uint voteId, uint sessionId, uint[] choiceIds);

    struct Vote {
        uint sessionId;
        uint[] choiceIds;
    }

    Vote[] public votes;

    mapping (uint => address) voteToOwner;
    mapping (address => Vote[]) voteOwnerVotes;

    function _hasVoted(uint _sessionId) private view returns(bool){
        for(uint i = 0; i < voteOwnerVotes[msg.sender].length; i++){
            if(voteOwnerVotes[msg.sender][i].sessionId == _sessionId){
                return true;
            }
        }
        return false;
    }

    function _isChoiceIdsExistingForThisSessionId(uint _sessionId, uint[] memory _choiceIds) private view returns(bool){
        for(uint i = 0; i < _choiceIds.length; i++){
            bool found = false;
            for(uint j = 0; j < sessionToChoices[_sessionId].length; j++){
                if(_choiceIds[i] == sessionToChoices[_sessionId][j]){
                    found = true;
                    break;
                }
            }
            if(!found){
                return false;
            }
        }
        return true;
    }

    modifier _isAbleToVote(uint _sessionId, uint[] memory _choiceIds) {
        require(_isSessionIdExisting(_sessionId), "Session does not exist");
        require(!_isSessionClosed(_sessionId), "Session is closed");
        require(_isChoiceIdsExistingForThisSessionId(_sessionId, _choiceIds), "Choice ids do not exist for this session");
        require(!_hasVoted(_sessionId), "You have already voted");
        _;
    }

    function createVote(uint _sessionId, uint[] memory _choiceIds) external _isAbleToVote(_sessionId, _choiceIds) {
        votes.push(Vote(_sessionId, _choiceIds));
        uint voteId = votes.length - 1;
        voteToOwner[voteId] = msg.sender;
        voteOwnerVotes[msg.sender] = votes;
        emit NewVote(voteId, _sessionId, _choiceIds);
    }

    function voteCount() public view returns (uint) {
        return votes.length;
    }
}

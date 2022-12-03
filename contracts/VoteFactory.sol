pragma solidity ^0.8.9;

import "./SessionFactory.sol";
import "hardhat/console.sol";

contract VoteFactory is SessionFactory{
    event NewVote(uint voteId, uint sessionId, uint[] choiceIds);

    struct Vote {
        uint sessionId;
        uint[] choiceIds;
    }

    Vote[] public votes;

    mapping (uint => address) voteToOwner;
    mapping (address => Vote[]) voteOwnerVotes;

    function _hasVoted(uint sessionId) private view returns(bool){
        for(uint i = 0; i < voteOwnerVotes[msg.sender].length; i++){
            if(voteOwnerVotes[msg.sender][i].sessionId == sessionId){
                return true;
            }
        }
        return false;
    }

    function _isChoiceIdsExistingForThisSessionId(uint sessionId, uint[] memory choiceIds) private view returns(bool){
        for(uint i = 0; i < choiceIds.length; i++){
            bool found = false;
            for(uint j = 0; j < sessionToChoices[sessionId].length; j++){
                if(choiceIds[i] == sessionToChoices[sessionId][j]){
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

    function _isSessionIdExisting(uint sessionId) public view returns(bool){
        return sessionId < sessions.length;
    }

    function _isSessionClosed(uint sessionId) internal view returns(bool){
        return sessions[sessionId].sessionStatus == SessionStatus.Closed;
    }

    modifier _isAbleToVote(uint sessionId, uint[] memory choiceIds) {
        //require(_isSessionIdExisting(sessionId), "Session does not exist");
        require(!_isSessionClosed(sessionId), "Session is closed");
        require(!_isChoiceIdsExistingForThisSessionId(sessionId, choiceIds), "Choice ids do not exist for this session");
        require(!_hasVoted(sessionId), "You have already voted");
        _;
    }

    function createVote(uint sessionId, uint[] memory choiceIds) external _isAbleToVote(sessionId, choiceIds) {
        votes.push(Vote(sessionId, choiceIds));
        uint voteId = votes.length - 1;
        voteToOwner[voteId] = msg.sender;
        voteOwnerVotes[msg.sender] = votes;
        emit NewVote(voteId, sessionId, choiceIds);
    }

    function voteCount() public view returns (uint) {
        return votes.length;
    }
}

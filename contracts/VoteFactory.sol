pragma solidity ^0.8.9;

import "./SessionFactory.sol";

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

    function createVote(uint sessionId, uint[] memory choiceIds) public {
        require(!_hasVoted(sessionId), "You have already voted");
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

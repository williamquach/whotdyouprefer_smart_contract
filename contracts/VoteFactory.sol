pragma solidity ^0.8.9;

import "./SessionFactory.sol";
import "hardhat/console.sol";

contract VoteFactory is SessionFactory {
    event NewVote(uint voteId, uint sessionId, uint[] choiceIds);

    struct Vote {
        uint sessionId;
        uint[] choiceIds;
    }

    struct SessionInfoForOwner {
        Session session;
        Choice[] choices;
        // TODO -> Add vote results
        Vote vote;
        bool hasVoted;
        bool isClosed;
    }

    Vote[] public votes;

    mapping(uint => address) voteToOwner;
    mapping(address => Vote[]) OwnerVotes;
    mapping(uint => uint) voteToSession;

    function _hasVoted(uint _sessionId) private view returns (bool){
        for (uint i = 0; i < OwnerVotes[msg.sender].length; i++) {
            if (OwnerVotes[msg.sender][i].sessionId == _sessionId) {
                return true;
            }
        }
        return false;
    }

    function _isChoiceIdsExistingForThisSessionId(uint _sessionId, uint[] memory _choiceIds) private view returns (bool){
        for (uint i = 0; i < _choiceIds.length; i++) {
            bool found = false;
            for (uint j = 0; j < sessionToChoices[_sessionId].length; j++) {
                if (_choiceIds[i] == sessionToChoices[_sessionId][j]) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                return false;
            }
        }
        return true;
    }

    modifier _isAbleToVote(uint _sessionId, uint[] memory _choiceIds) {
        require(_isSessionIdExisting(_sessionId), "Session does not exist.");
        require(!_isSessionClosed(_sessionId), "Session is closed.");
        require(_isChoiceIdsExistingForThisSessionId(_sessionId, _choiceIds), "Choice ids do not exist for this session.");
        require(!_hasVoted(_sessionId), "You have already voted.");
        _;
    }

    function createVote(uint _sessionId, uint[] memory _choiceIds) external _isAbleToVote(_sessionId, _choiceIds) {
        votes.push(Vote(_sessionId, _choiceIds));
        uint voteId = votes.length - 1;
        voteToOwner[voteId] = msg.sender;
        OwnerVotes[msg.sender] = votes;
        voteToSession[voteId] = _sessionId;
        emit NewVote(voteId, _sessionId, _choiceIds);
    }

    function getVoteBySessionId(uint _sessionId) internal view returns (Vote memory){
        Vote memory vote;
        for (uint i = 0; i < votes.length; i++) {
            if (votes[i].sessionId == _sessionId) {
                vote = votes[i];
                break;
            }
        }
        return vote;
    }

    function getSessionForOwner(uint _sessionId) external view returns (SessionInfoForOwner memory){
        SessionWithChoice memory sessionWithChoice = getSession(_sessionId);
        return SessionInfoForOwner(sessionWithChoice.session, sessionWithChoice.choices, getVoteBySessionId(_sessionId), _hasVoted(_sessionId), _isSessionClosed(_sessionId));
    }

    function getOpenedSessionsForOwner() external view returns (SessionInfoForOwner[] memory){
        Vote memory vote;
        Session[] memory openedSessions = getOpenedSessions();
        SessionInfoForOwner[] memory openedSessionsForOwner = new SessionInfoForOwner[](openedSessions.length);
        for (uint i = 0; i < openedSessions.length; i++) {
            openedSessionsForOwner[i] = SessionInfoForOwner(openedSessions[i], new Choice[](0), vote, _hasVoted(openedSessions[i].sessionId), false);
        }
        return openedSessionsForOwner;
    }

    function getClosedSessionsCountWhereUserHasVoted() private view returns (uint) {
        uint count = 0;
        Session[] memory closedSessions = getClosedSessions();
        for (uint i = 0; i < closedSessions.length; i++) {
            if (_hasVoted(closedSessions[i].sessionId)) {
                count++;
            }
        }
        return count;
    }

    function getOwnerHistory() external view returns (SessionInfoForOwner[] memory) {
        Session[] memory closedSessions = getClosedSessions();
        SessionInfoForOwner[] memory ownerHistoryForOwner = new SessionInfoForOwner[](getClosedSessionsCountWhereUserHasVoted());
        uint counter = 0;
        for (uint i = 0; i < closedSessions.length; i++) {
            if (_hasVoted(closedSessions[i].sessionId)) {
                ownerHistoryForOwner[counter] = SessionInfoForOwner(closedSessions[i], new Choice[](0), getVoteBySessionId(closedSessions[i].sessionId), true, true);
                counter++;
            }
        }
        return ownerHistoryForOwner;
    }

    function voteCount() external view returns (uint) {
        return votes.length;
    }
}

pragma solidity ^0.8.9;

import "./ChoiceFactory.sol";
import "hardhat/console.sol";

contract SessionFactory is ChoiceFactory{
    event NewSession(uint sessionId, string label, string description, uint endDateTime, string[] choiceIds);

    uint CHOICES_COUNT_BY_SESSION = 4;

    struct Session {
        uint sessionId;
        uint endDateTime;
        string label;
        string description;
    }

    struct SessionWithChoice {
        Session session;
        Choice[] choices;
    }

    Session[] public sessions;

    mapping (uint => address) public sessionToOwner;
    mapping (uint => uint[]) public sessionToChoices;

    function createChoices(string[] memory _labels, uint _sessionId) internal {
        for(uint i = 0; i < _labels.length; i++){
            uint choiceId = _createChoice(_labels[i]);
            sessionToChoices[_sessionId].push(choiceId);
        }
    }

    function createSession(string memory _label, string memory _description, uint _endDateTime, string[] memory _choices) external {
        uint sessionId = sessions.length;
        Session memory newSession = Session(sessionId, _endDateTime, _label, _description);
        sessions.push(newSession);
        sessionToOwner[sessionId] = msg.sender;
        createChoices(_choices, sessionId);
        emit NewSession(sessionId, _label, _description, _endDateTime, getChoices(sessionId));
    }

    function isOpen(uint _sessionId) public view returns(bool) {
        return sessions[_sessionId].endDateTime > block.timestamp;
    }

    function getChoices(uint _sessionId) private view returns(string [] memory) {
        string [] memory choicesLabel = new string [](CHOICES_COUNT_BY_SESSION);
        for(uint i = 0; i < sessionToChoices[_sessionId].length; i++){
            choicesLabel[i] = ChoiceFactory.choices[sessionToChoices[_sessionId][i]].label;
        }
        return choicesLabel;
    }

    function getChoiceIdsBySessionId(uint _sessionId) public view returns(uint [] memory) {
        uint[] memory choiceIds = new uint[](CHOICES_COUNT_BY_SESSION);
        for(uint i = 0; i < sessionToChoices[_sessionId].length; i++){
            choiceIds[i] = sessionToChoices[_sessionId][i];
        }
        return choiceIds;
    }

    function getSession(uint _sessionId) public view returns (SessionWithChoice memory) {
        Choice [] memory choices = new Choice[](CHOICES_COUNT_BY_SESSION);
        for(uint i = 0; i < sessionToChoices[_sessionId].length; i++){
            choices[i] = ChoiceFactory.choices[sessionToChoices[_sessionId][i]];
        }
        SessionWithChoice memory sessionWithChoice = SessionWithChoice(sessions[_sessionId], choices);
        return sessionWithChoice;
    }

    function getSessions() external view returns (Session[] memory) {
        return sessions;
    }

    function getNumberOfOpenedSessions() internal view returns (uint) {
        uint numberOfOpenedSessions = 0;
        for(uint i = 0; i < sessions.length; i++){
            if(isOpen(sessions[i].sessionId)){
                numberOfOpenedSessions++;
            }
        }
        return numberOfOpenedSessions;
    }

    function getOpenedSessions() public view returns (Session[] memory) {
        Session[] memory openedSessions = new Session[](getNumberOfOpenedSessions());
        uint openedSessionsIndex = 0;
        for(uint i = 0; i < sessions.length; i++){
            if(isOpen(sessions[i].sessionId)){
                openedSessions[openedSessionsIndex] = sessions[i];
                openedSessionsIndex++;
            }
        }
        return openedSessions;
    }

    function getNumberOfClosedSessions() internal view returns (uint) {
        uint numberOfClosedSessions = 0;
        for(uint i = 0; i < sessions.length; i++){
            if(!isOpen(sessions[i].sessionId) && sessions[i].endDateTime > 0){
                numberOfClosedSessions++;
            }
        }
        return numberOfClosedSessions;
    }

    function getClosedSessions() internal view returns (Session[] memory) {
        Session[] memory closedSessions = new Session[](getNumberOfClosedSessions());
        uint closedSessionsIndex = 0;
        for(uint i = 0; i < sessions.length; i++) {
            if(!isOpen(sessions[i].sessionId) && sessions[i].endDateTime > 0) {
                closedSessions[closedSessionsIndex] = sessions[i];
                closedSessionsIndex++;
            }
        }
        return closedSessions;
    }

    function updateSession(uint _sessionId, string memory label, string memory description, string[] memory choices) external {
        require(sessionToOwner[_sessionId] == msg.sender, "You are not the owner of this session.");
        sessions[_sessionId].label = label;
        sessions[_sessionId].description = description;
        for(uint i = 0; i < sessionToChoices[_sessionId].length; i++){
            ChoiceFactory.choices[sessionToChoices[_sessionId][i]].label = choices[i];
        }
    }

    function deleteSession(uint _sessionId) external {
        require(sessionToOwner[_sessionId] == msg.sender, "You are not the owner of this session.");
        for(uint i = 0; i < sessionToChoices[_sessionId].length; i++){
            ChoiceFactory.deleteChoice(sessionToChoices[_sessionId][i]);
        }
        delete sessionToChoices[_sessionId];
        delete sessionToOwner[_sessionId];
        delete sessions[_sessionId];
    }

    function _isSessionIdExisting(uint _sessionId) internal view returns(bool) {
        return _sessionId < sessions.length;
    }

    function _isSessionClosed(uint _sessionId) internal view returns(bool) {
        return !isOpen(_sessionId);
    }

    function sessionCount() external view returns (uint) {
        return sessions.length;
    }

    function getChoiceBySessionId(uint _sessionId) external view returns(uint[] memory) {
        return sessionToChoices[_sessionId];
    }
}
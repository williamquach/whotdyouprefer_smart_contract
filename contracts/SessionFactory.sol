pragma solidity ^0.8.9;

import "./ChoiceFactory.sol";
import "hardhat/console.sol";

contract SessionFactory is ChoiceFactory{
    event NewSession(uint sessionId, string label, string description, uint endDateTime, SessionStatus status, string[] choiceIds);

    uint CHOICE_NUMBER = 4;

    enum SessionStatus {Open, Closed}

    struct Session {
        uint sessionId;
        uint endDateTime;
        string label;
        string description;
        SessionStatus sessionStatus;
    }

    struct SessionWithChoice {
        Session session;
        Choice[] choices;
    }

    Session[] public sessions;

    mapping (uint => address) public sessionToOwner;
    mapping (uint => uint[]) public sessionToChoices;

    function createChoices(string[] memory _labels, uint _sessionId) internal onlyOwner {
        for(uint i = 0; i < _labels.length; i++){
            uint choiceId = _createChoice(_labels[i]);
            sessionToChoices[_sessionId].push(choiceId);
        }
    }

    function createSession(string memory _label, string memory _description, uint _endDateTime, string[] memory _choices) public onlyOwner {
        uint sessionId = sessions.length;
        Session memory newSession = Session(sessionId, _endDateTime, _label, _description, SessionStatus.Open);
        sessions.push(newSession);
        sessionToOwner[sessionId] = msg.sender;
        createChoices(_choices, sessionId);
        emit NewSession(sessionId, _label, _description, _endDateTime, SessionStatus.Open, getChoices(sessionId));
    }

    function closeSession(uint _sessionId) private {
        sessions[_sessionId].sessionStatus = SessionStatus.Closed;
    }

    function checkSessionValidity(uint _sessionId) external {
        Session memory currentSession = sessions[_sessionId];
        if(currentSession.endDateTime < block.timestamp) closeSession(_sessionId);
    }

    function getChoices(uint _sessionId) private view returns(string [] memory) {
        string [] memory choicesLabel = new string [](CHOICE_NUMBER);
        for(uint i = 0; i < sessionToChoices[_sessionId].length; i++){
            choicesLabel[i] = ChoiceFactory.choices[sessionToChoices[_sessionId][i]].label;
        }
        return choicesLabel;
    }

    function getSession(uint _sessionId) external view returns (SessionWithChoice memory) {
        Choice [] memory choices = new Choice[](CHOICE_NUMBER);
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
            if(sessions[i].sessionStatus == SessionStatus.Open){
                numberOfOpenedSessions++;
            }
        }
        return numberOfOpenedSessions;
    }

    function getOpenedSessions() external view returns (Session[] memory) {
        Session[] memory openedSessions = new Session[](getNumberOfOpenedSessions());
        uint openedSessionsIndex = 0;
        for(uint i = 0; i < sessions.length; i++){
            if(sessions[i].sessionStatus == SessionStatus.Open){
                openedSessions[openedSessionsIndex] = sessions[i];
                openedSessionsIndex++;
            }
        }
        return openedSessions;
    }

    function getNumberOfClosedSessions() internal view returns (uint) {
        uint numberOfClosedSessions = 0;
        for(uint i = 0; i < sessions.length; i++){
            if(sessions[i].sessionStatus == SessionStatus.Closed){
                numberOfClosedSessions++;
            }
        }
        return numberOfClosedSessions;
    }

    function getClosedSessions() internal view returns (Session[] memory) {
        Session[] memory closedSessions = new Session[](getNumberOfClosedSessions());
        uint closedSessionsIndex = 0;
        for(uint i = 0; i < sessions.length; i++){
            if(sessions[i].sessionStatus == SessionStatus.Closed){
                closedSessions[closedSessionsIndex] = sessions[i];
                closedSessionsIndex++;
            }
        }
        return closedSessions;
    }

    function _isSessionIdExisting(uint _sessionId) internal view returns(bool){
        return _sessionId < sessions.length;
    }

    function _isSessionClosed(uint _sessionId) internal view returns(bool){
        return sessions[_sessionId].sessionStatus == SessionStatus.Closed;
    }

    function sessionCount() external view returns (uint) {
        return sessions.length;
    }
}

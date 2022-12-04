pragma solidity ^0.8.9;

import "./ChoiceFactory.sol";
import "hardhat/console.sol";

contract SessionFactory is ChoiceFactory{
    event NewSession(uint sessionId, string label, string description, string endDateTime, SessionStatus status, string[] choiceIds);

    uint CHOICE_NUMBER = 4;

    enum SessionStatus {Open, Closed}

    struct Session {
        string label;
        string description;
        uint endDateTime;
        SessionStatus sessionStatus;
    }
    Session[] public sessions;

    mapping (uint => address) public sessionToOwner;
    mapping (uint => uint[]) public sessionToChoices;

    function createChoices(string[] memory _labels, uint sessionId) internal onlyOwner {
        for(uint i = 0; i < _labels.length; i++){
            uint choiceId = _createChoice(_labels[i]);
            sessionToChoices[sessionId].push(choiceId);
        }
    }
    function createSession(string memory _label, string memory _description, uint memory _endDateTime, string[] memory choices) public onlyOwner {
        sessions.push(Session(_label, _description, _endDateTime, SessionStatus.Open));
        uint sessionId = sessions.length - 1;
        sessionToOwner[sessionId] = msg.sender;
        createChoices(choices, sessionId);
        emit NewSession(sessionId, _label, _description, _endDateTime, SessionStatus.Open, getChoices(sessionId));
    }

    function closeSession(uint _sessionId) private {
        sessions[_sessionId].sessionStatus = SessionStatus.Closed;
    }

    //TODO implement cron
    function checkSessionValidity( uint _sessionId) private {
        Session currentSession = sessions[_sessionId];
        if(currentSession.endDateTime < now) closeSession(_sessionId);
    }

    function getChoices(uint sessionId) private view returns(string [] memory) {
        string [] memory choicesLabel = new string [](CHOICE_NUMBER);
        for(uint i = 0; i < sessionToChoices[sessionId].length; i++){
            choicesLabel[i] = ChoiceFactory.choices[sessionToChoices[sessionId][i]].label;
        }
        return choicesLabel;
    }

    function getSession(uint sessionId) public view returns (string memory, string memory, uint memory, string[] memory, SessionStatus) {
        return (sessions[sessionId].label, sessions[sessionId].description, sessions[sessionId].endDateTime, getChoices(sessionId), sessions[sessionId].sessionStatus);
    }

    function _isSessionIdExisting(uint sessionId) public view returns(bool){
        return sessionId < sessions.length;
    }

    function _isSessionClosed(uint sessionId) internal view returns(bool){
        return sessions[sessionId].sessionStatus == SessionStatus.Closed;
    }

    function sessionCount() public view returns (uint) {
        return sessions.length;
    }
}

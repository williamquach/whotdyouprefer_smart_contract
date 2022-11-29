pragma solidity ^0.8.9;

import "./ChoiceFactory.sol";

contract SessionFactory is ChoiceFactory{
    event NewSession(uint sessionId, string label, string description);

    struct Session {
        string label;
        string description;
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

    function createSession(string memory _label, string memory _description, string[] memory choices) public onlyOwner {
        sessions.push(Session(_label, _description));
        uint sessionId = sessions.length - 1;
        sessionToOwner[sessionId] = msg.sender;
        createChoices(choices, sessionId);
        emit NewSession(sessionId, _label, _description);
    }

    function getChoices(uint sessionId) public view returns(string [] memory){
        string [] memory choicesLabel = new string [](4);
        for(uint i = 0; i < sessionToChoices[sessionId].length; i++){
            choicesLabel[i] = ChoiceFactory.choices[sessionToChoices[sessionId][i]].label;
        }
        return choicesLabel;
    }

    function getSession(uint sessionId) public view returns (string memory, string memory, string[] memory) {
        return (sessions[sessionId].label, sessions[sessionId].description, getChoices(sessionId));
    }
}

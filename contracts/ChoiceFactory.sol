pragma solidity ^0.8.9;

import "./Ownable.sol";

contract ChoiceFactory is Ownable {
    struct Choice {
        uint choiceId;
        string label;
    }

    Choice[] public choices;

    function _createChoice(string memory _label) internal onlyOwner returns (uint) {
        uint choiceId = choices.length;
        choices.push(Choice(choiceId, _label));
        return choiceId;
    }
}

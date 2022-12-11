pragma solidity ^0.8.9;

import "./Donation.sol";

contract ChoiceFactory is Donation {
    struct Choice {
        uint choiceId;
        string label;
    }

    Choice[] public choices;

    function _createChoice(string memory _label) internal returns (uint) {
        uint choiceId = choices.length;
        choices.push(Choice(choiceId, _label));
        return choiceId;
    }
}

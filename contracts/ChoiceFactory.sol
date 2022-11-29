pragma solidity ^0.8.9;

import "./Ownable.sol";

contract ChoiceFactory is Ownable {
    struct Choice {
        string label;
    }

    Choice[] public choices;

    function _createChoice(string memory _label) internal onlyOwner returns (uint) {
        choices.push(Choice(_label));
        return choices.length - 1;
    }
}

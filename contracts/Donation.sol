pragma solidity ^0.8.9;

import "./Ownable.sol";

contract Donation is Ownable {
    event NewDonation(address indexed donor, uint256 value);
    address payable WHODYOUPREFERACCOUNT = payable(0xB815fC4F08eDA9876D1abee1DB5A5C20B12dEa35);
    uint256 totalDonationsAmount;
    uint256 highestDonation;
    address payable highestDonor;

    modifier validateTransferAmount() {
        require(msg.value > 0, 'Transfer amount has to be greater than 0.');
        _;
    }

    function donate() external validateTransferAmount() payable {
        uint donationAmount = msg.value;
        WHODYOUPREFERACCOUNT.transfer(msg.value);
        emit NewDonation(msg.sender, msg.value);
        totalDonationsAmount += donationAmount;
        if (msg.value > highestDonation) {
            highestDonation = msg.value;
            highestDonor = payable(msg.sender);
        }
    }

    function getTotalDonationsAmount() external view returns (uint256) {
        return totalDonationsAmount;
    }

    function getHighestDonation() external view returns (uint256, address payable) {
        return (highestDonation, highestDonor);
    }
}

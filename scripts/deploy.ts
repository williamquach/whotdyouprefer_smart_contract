import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  const Donation = await ethers.getContractFactory("Donation");
  const donation = await Donation.deploy();

  console.log("Contract address - Donation :", donation.address);

  const VoteFactory = await ethers.getContractFactory("VoteFactory");
  const voteFactory = await VoteFactory.deploy();

  console.log("Contract address - VoteFactory :", voteFactory.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });

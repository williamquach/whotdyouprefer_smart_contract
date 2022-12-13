import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  const Donation = await ethers.getContractFactory("Donation");
  const donation = await Donation.deploy();

  console.log("Contract address:", donation.address);

  const ChoiceFactory = await ethers.getContractFactory("ChoiceFactory");
  const choiceFactory = await ChoiceFactory.deploy();

  console.log("Contract address:", choiceFactory.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });

import {Contract, ContractFactory} from "ethers";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";

import {ethers} from "hardhat";
import {expect} from "chai";


describe("Donation Contract", function () {
    let Donation: ContractFactory;
    let donation: Contract;
    let owner: SignerWithAddress;
    let addr1: SignerWithAddress;
    let addr2: SignerWithAddress;

    beforeEach(async function () {
        Donation = await ethers.getContractFactory("Donation");
        [owner, addr1, addr2] = await ethers.getSigners();
        donation = await Donation.deploy();
    });

    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            expect(await donation.owner()).to.equal(owner.address);
        });
    });

    describe("Donate", function () {
        let result: any;
        describe("One donation", function () {
            beforeEach(async function () {
                result = await donation.donate({value: 100});
            });
            it("Should create a donation with 100 wei", async function () {
                expect(result.value).to.equal(100);
            });
            it("Should emit a NewDonation event", async function () {
                await expect(result).to.emit(donation, "NewDonation").withArgs(owner.address, 100);
            });
            it("TotalDonationsAmount should return 100 wei", async function () {
                expect(await donation.getTotalDonationsAmount()).to.equal(100);
            });
            it("HighestDonation should return 100 and owner.address", async function () {
                expect(await donation.getHighestDonation()).to.deep.equal(
                    [
                        ethers.BigNumber.from(100),
                        owner.address
                    ]
                );
            });
        });

        describe("Two donation", function () {
            beforeEach(async function () {
                await donation.donate({value: 100});
                await donation.connect(addr1).donate({value: 200});
            });
            it("Should fail because donation amount is 0 or under", async function () {
                await expect(donation.donate({value: 0})).to.be.revertedWith("Transfer amount has to be greater than 0.");
            });
            it("TotalDonationsAmount should return 300 wei", async function () {
                expect(await donation.getTotalDonationsAmount()).to.equal(300);
            });
            it("HighestDonation should return 200 and addr1.address", async function () {
                expect(await donation.getHighestDonation()).to.deep.equal(
                    [
                        ethers.BigNumber.from(200),
                        addr1.address
                    ]
                );
            });
        });
    });
});

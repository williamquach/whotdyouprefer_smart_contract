const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SessionFactory", function () {
    it("Should deploy a new SessionFactory", async function () {
        //const [owner] = await ethers.getSigners();
        const SessionFactory = await ethers.getContractFactory("SessionFactory");
        const sessionFactory = await SessionFactory.deploy();
        await sessionFactory.deployed();
        /*const session = await sessionFactory.createSession("Label", "Description", ["Choice 1", "Choice 2", "Choice 3", "Choice 4"]);
        expect(await sessionFactory.getSession(0).label).to.equal(session.label);*/
    });
});
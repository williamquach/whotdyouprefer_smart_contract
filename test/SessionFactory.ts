import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {Contract} from "ethers";

const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SessionFactory", function () {
    let SessionFactory;
    let sessionFactory: Contract;
    let owner: SignerWithAddress;
    let addr1: SignerWithAddress;
    let addr2: SignerWithAddress;
    beforeEach(async function () {
        SessionFactory = await ethers.getContractFactory("SessionFactory");
        [owner, addr1, addr2] = await ethers.getSigners();
        sessionFactory = await SessionFactory.deploy();
        //await sessionFactory.deployed();
        //const session = await sessionFactory.createSession("Label", "Description", ["Choice 1", "Choice 2", "Choice 3", "Choice 4"]);
    });

    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            expect(await sessionFactory.owner()).to.equal(owner.address);
        });
        it("Should have 0 session", async function () {
            expect(await sessionFactory.sessionCount()).to.equal(0);
        });
    });

    describe("Session Creation", function () {
        let result: any;
        beforeEach(async function () {
            await sessionFactory.createSession("Label", "Description", "31/11/22",["Choice 1", "Choice 2", "Choice 3", "Choice 4"]);
            result = await sessionFactory.getSession(0);
        });
        describe("Verifications", function () {
            it("Should create a session", async function () {
                expect(await sessionFactory.sessionCount()).to.equal(1);
            });
            it("with the right label: 'Label'", async function () {
                expect(result[0]).to.equal("Label");
            });
            it("with the right description: 'Description'", async function () {
                expect(result[1]).to.equal("Description");
            });
            it("with the right end date: '31/11/22'", async function () {
                expect(result[2]).to.equal("31/11/22");
            });
            it("with the right choices: ['Choice 1', 'Choice 2', 'Choice 3', 'Choice 4']", async function () {
                expect(result[3][0]).to.equal("Choice 1");
                expect(result[3][1]).to.equal("Choice 2");
                expect(result[3][2]).to.equal("Choice 3");
                expect(result[3][3]).to.equal("Choice 4");
            });
            it("with the right status: 0 (Open)", async function () {
                expect(result[4]).to.equal(0);
            });
        });
    });
});

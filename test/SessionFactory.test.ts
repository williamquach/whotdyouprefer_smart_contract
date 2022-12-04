import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {Contract} from "ethers";

const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SessionFactory contract", function () {
    let SessionFactory;
    let sessionFactory: Contract;
    let owner: SignerWithAddress;
    let addr1: SignerWithAddress;
    let addr2: SignerWithAddress;

    beforeEach(async function () {
        SessionFactory = await ethers.getContractFactory("SessionFactory");
        [owner, addr1, addr2] = await ethers.getSigners();
        sessionFactory = await SessionFactory.deploy();
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
        let session: any;
        let result: any;
        describe("First session", function () {
            const sessionEndDate = 1669852800000; // Thu Dec 01 2022 00:00:00 UTC
            beforeEach(async function () {
                session = await sessionFactory.createSession("Label", "Description", sessionEndDate,["Choice 1", "Choice 2", "Choice 3", "Choice 4"]);
                result = await sessionFactory.getSession(0);
            });
            it("Should create a session", async function () {
                expect(await sessionFactory.sessionCount()).to.equal(1);
            });
            it("with the right label: 'Label'", async function () {
                expect(result[0]).to.equal("Label");
            });
            it("with the right description: 'Description'", async function () {
                expect(result[1]).to.equal("Description");
            });
            it(`with the right end date: ${sessionEndDate}`, async function () {
                expect(result[2]).to.equal(sessionEndDate);
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
            it("should emit a NewSession event", async function () {
                await expect(session).to.emit(sessionFactory, "NewSession").withArgs(0, "Label", "Description", sessionEndDate, 0, ["Choice 1", "Choice 2", "Choice 3", "Choice 4"]);
            });
        });
        describe("Second session", function () {
            const sessionEndDate = 1669852800000; // Thu Dec 01 2022 00:00:00 UTC
            it("Should create a second session", async function () {
                await sessionFactory.createSession("Label", "Description", sessionEndDate,["Choice 1", "Choice 2", "Choice 3", "Choice 4"]);
                await sessionFactory.createSession("Label2", "Description2", sessionEndDate,["Choice 5", "Choice 6", "Choice 7", "Choice 8"]);
                expect(await sessionFactory.sessionCount()).to.equal(2);
            });
        });
    });
});

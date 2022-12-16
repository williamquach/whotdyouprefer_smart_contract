import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {Contract, ContractFactory} from "ethers";

const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SessionFactory contract", function () {
    let SessionFactory: ContractFactory;
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
            const sessionEndDate = 1669852800; // Thu Dec 01 2022 00:00:00 UTC
            beforeEach(async function () {
                session = await sessionFactory.createSession("Label", "Description", sessionEndDate, ["Choice 1", "Choice 2", "Choice 3", "Choice 4"]);
                result = await sessionFactory.getSession(0);
            });
            it("Should create a session", async function () {
                expect(await sessionFactory.sessionCount()).to.equal(1);
            });
            it("with the right label: 'Label'", async function () {
                expect(result.session.label).to.equal("Label");
            });
            it("with the right description: 'Description'", async function () {
                expect(result.session.description).to.equal("Description");
            });
            it(`with the right end date: ${sessionEndDate}`, async function () {
                expect(result.session.endDateTime).to.equal(sessionEndDate);
            });
            it("with the right choices: ['Choice 1', 'Choice 2', 'Choice 3', 'Choice 4']", async function () {
                expect(result.choices[0].label).to.equal("Choice 1");
                expect(result.choices[1].label).to.equal("Choice 2");
                expect(result.choices[2].label).to.equal("Choice 3");
                expect(result.choices[3].label).to.equal("Choice 4");
            });
            it("should emit a NewSession event", async function () {
                await expect(session).to.emit(sessionFactory, "NewSession").withArgs(0, "Label", "Description", sessionEndDate, ["Choice 1", "Choice 2", "Choice 3", "Choice 4"]);
            });
            it("should update the session", async function () {
                await sessionFactory.updateSession(0, "Label 2", "Description 2", ["Choice 5", "Choice 6", "Choice 7", "Choice 8"]);
                result = await sessionFactory.getSession(0);
                expect(result.session.label).to.equal("Label 2");
                expect(result.session.description).to.equal("Description 2");
                expect(result.choices[0].label).to.equal("Choice 5");
                expect(result.choices[1].label).to.equal("Choice 6");
                expect(result.choices[2].label).to.equal("Choice 7");
                expect(result.choices[3].label).to.equal("Choice 8");
            });
            it("should 'delete' the session", async function () {
                await sessionFactory.deleteSession(0);
                result = await sessionFactory.getSession(0);
                expect(result.session.label).to.equal("");
                expect(result.session.description).to.equal("");
                expect(result.choices[0].label).to.equal("");
                expect(result.choices[1].label).to.equal("");
                expect(result.choices[2].label).to.equal("");
                expect(result.choices[3].label).to.equal("");
            });
        });
        describe("Second session", function () {
            const sessionEndDate = 3093525298800; // Dec 01 99999 00:00:00 UTC
            const sessionPassedEndDate = 1606780800;
            beforeEach(async function () {
                await sessionFactory.connect(addr1).createSession("Label", "Description", sessionEndDate,["Choice 1", "Choice 2", "Choice 3", "Choice 4"]);
                await sessionFactory.connect(addr1).createSession("Label2", "Description2", sessionPassedEndDate,["Choice 5", "Choice 6", "Choice 7", "Choice 8"]);
            });
            it("Should create a second session", async function () {
                expect(await sessionFactory.sessionCount()).to.equal(2);
            });
            it("Should return all sessions", async function () {
                expect(await sessionFactory.getSessions()).to.deep.equal(
                    [
                        [
                            ethers.BigNumber.from(0),
                            ethers.BigNumber.from(sessionEndDate),
                            "Label",
                            "Description"
                        ],
                        [
                            ethers.BigNumber.from(1),
                            ethers.BigNumber.from(sessionPassedEndDate),
                            "Label2",
                            "Description2"
                        ]
                    ]
                );
            });
            it("Should return opened sessions", async function () {
                expect(await sessionFactory.getOpenedSessions()).to.deep.equal(
                    [
                        [
                            ethers.BigNumber.from(0),
                            ethers.BigNumber.from(sessionEndDate),
                            "Label",
                            "Description"
                        ]
                    ]
                );
            });
        });
    });
});

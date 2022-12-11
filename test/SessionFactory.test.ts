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
            it("with the right status: 0 (Open)", async function () {
                expect(result.session.sessionStatus).to.equal(0);
            });
            it("should emit a NewSession event", async function () {
                await expect(session).to.emit(sessionFactory, "NewSession").withArgs(0, "Label", "Description", sessionEndDate, 0, ["Choice 1", "Choice 2", "Choice 3", "Choice 4"]);
            });
        });
        describe("Second session", function () {
            const sessionEndDate = 1669852800; // Thu Dec 01 2022 00:00:00 UTC
            const sessionPassedEndDate = 1606780800;
            const createSessionFee = "0.001";
            beforeEach(async function () {
                await sessionFactory.connect(addr1).createSession("Label", "Description", sessionEndDate,["Choice 1", "Choice 2", "Choice 3", "Choice 4"], {value: ethers.utils.parseEther(createSessionFee)});
                await sessionFactory.connect(addr1).createSession("Label2", "Description2", sessionPassedEndDate,["Choice 5", "Choice 6", "Choice 7", "Choice 8"], {value: ethers.utils.parseEther(createSessionFee)});
                await sessionFactory.checkSessionValidity(1);
            });
            it("Should fail because not owner", async function () {
                await expect(sessionFactory.connect(addr1).createSession("Label", "Description", sessionEndDate,["Choice 1", "Choice 2", "Choice 3", "Choice 4"])).to.be.revertedWith("Transfer amount is not correct.");
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
                            "Description",
                            0
                        ],
                        [
                            ethers.BigNumber.from(1),
                            ethers.BigNumber.from(sessionPassedEndDate),
                            "Label2",
                            "Description2",
                            1
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
                            "Description",
                            0
                        ]
                    ]
                );
            });
        });
    });

    describe("Session Closing", function () {
        it("Should close a passed session when checking validity", async function () {
            const sessionPassedEndDate = 1606780800; // Thu Dec 01 2020 00:00:00 UTC
            await sessionFactory.createSession("Session to close", "Session description", sessionPassedEndDate, ["Choice 1", "Choice 2", "Choice 3", "Choice 4"]);
            await sessionFactory.getSession(0);
            await sessionFactory.checkSessionValidity(0)
            const foundSessionAfterCheckingValidity = await sessionFactory.getSession(0)
            expect(foundSessionAfterCheckingValidity.session.sessionStatus).to.equal(1);
        })

        it("Should not close a future session when checking validity", async function () {
            const sessionEndDate = 8639975203200; // Sat Dec 01 275759 00:00:00 UTC
            await sessionFactory.createSession("Session infinite", "Session description", sessionEndDate, ["Choice 1", "Choice 2", "Choice 3", "Choice 4"]);
            await sessionFactory.getSession(0);
            await sessionFactory.checkSessionValidity(0)
            const foundSessionAfterCheckingValidity = await sessionFactory.getSession(0)
            expect(foundSessionAfterCheckingValidity.session.sessionStatus).to.equal(0);
        })
    });
});

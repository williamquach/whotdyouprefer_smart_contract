import {CronJob} from 'cron';
import {ethers} from "hardhat";
import {Contract, ContractFactory} from "ethers";


enum SessionStatus {Open, Closed}

let contractFactory: ContractFactory;
let sessionFactory: Contract;

async function main() {
    contractFactory = await ethers.getContractFactory("SessionFactory");
    sessionFactory = await contractFactory.deploy();

    // await sessionFactory.createSession("First session", "launching cron close sessions", 1669852800, ['Choice 1', 'Choice 2', 'Choice 3', 'Choice 4']); // Thu Dec 01 2022 00:00:00 UTC
    // await sessionFactory.createSession("Second session", "launching cron close sessions", 8639975203200, ['Choice 1', 'Choice 2', 'Choice 3', 'Choice 4']); // Sat Dec 01 275759 00:00:00 UTC

    new CronJob('0/* * * * * *', async () => {
        await checkSessionsValidity();
    }).start();
}

main().catch((error) => {
    console.error(`Got an error during session closing cron :`, error);
    process.exit(1);
})

async function checkSessionsValidity() {
    const openedSessions = await sessionFactory.getOpenedSessions();

    const closedSessions: any[] = [];
    await Promise.all(openedSessions.map(async (session: any) => {
        if (session.sessionStatus === SessionStatus.Open) {
            await sessionFactory.checkSessionValidity(session.sessionId);

            const sessionAfterClose = await sessionFactory.getSession(session.sessionId)
            if (sessionAfterClose.session.sessionStatus === SessionStatus.Closed) {
                closedSessions.push(sessionAfterClose.session);
            }
        }
    }));
    console.log("Closed sessions: ", closedSessions);
}

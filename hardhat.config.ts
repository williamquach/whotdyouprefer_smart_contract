import {HardhatUserConfig} from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

require('dotenv').config();

const {API_URL, PRIVATE_KEY} = process.env;

const config: HardhatUserConfig = {
    networks: {
        hardhat: {
            allowUnlimitedContractSize: true,
        },
        polygon_mumbai: {
            url: API_URL,
            accounts: [`0x${PRIVATE_KEY}`],
        },
    },
    solidity: {
        version: "0.8.9",
        settings: {
            optimizer: {
                enabled: true,
                runs: 1000,
            },
        },
    },
    paths: {
        sources: "./contracts",
        tests: "./test",
        cache: "./cache",
        artifacts: "./artifacts",
    },
    mocha: {
        timeout: 40000,
    },
}

export default config;
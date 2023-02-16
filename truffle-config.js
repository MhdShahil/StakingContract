const HDWalletProvider = require("@truffle/hdwallet-provider");
require("dotenv").config();

const mnemonic = process.env.MNEMONIC;
const infuraProjectId = process.env.INFURA_PROJECT_ID;
const etherscanApiKey = process.env.ETHERSCAN_API_KEY;

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1", // Localhost (default: none)
      port: 8545, // Standard Ethereum port (default: none)
      network_id: "*", // Any network (default: none)
    },
    goerli_new: {
      provider: function () {
        return new HDWalletProvider({
          mnemonic: {
            phrase: mnemonic,
          },
          providerOrUrl: `wss://goerli.infura.io/ws/v3/${infuraProjectId}`,
          chainId: 5,
        });
      },
      network_id: 5,
      confirmations: 10,
      timeoutBlocks: 200,
      skipDryRun: true,
      chainId: 5,
    },

    goerli: {
      networkCheckTimeout: 60000,
      provider: () =>
        new HDWalletProvider(
          mnemonic,
          `wss://goerli.infura.io/ws/v3/${infuraProjectId}`
        ),
      network_id: 5,
      confirmations: 2,
      timeoutBlocks: 1000,
      skipDryRun: true,
    },
  },

  // Configure your compilers
  compilers: {
    solc: {
      version: "0.8.17", // Fetch exact version from solc-bin (default: truffle's version)
      // docker: true,        // Use "0.5.1" you've installed locally with docker (default: false)
      // settings: {          // See the solidity docs for advice about optimization and evmVersion
      //  optimizer: {
      //    enabled: false,
      //    runs: 200
      //  },
      //  evmVersion: "byzantium"
      // }
    },
  },
  plugins: ["truffle-plugin-verify"],
  api_keys: {
    etherscan: etherscanApiKey,
  },
};

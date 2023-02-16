const Staking = artifacts.require("Staking");
const Erc20Token = artifacts.require("Erc20Token");

module.exports = async function (deployer, network, accounts) {
  await deployer.deploy(Erc20Token);
  const erc20Token = await Erc20Token.deployed();

  await deployer.deploy(Staking, erc20Token.address);
  const staking = await Staking.deployed();
};

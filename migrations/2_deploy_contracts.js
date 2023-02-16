const Staking = artifacts.require("Staking");
const AccuCoin = artifacts.require("AccuCoin");

module.exports = async function (deployer, network, accounts) {
  await deployer.deploy(AccuCoin, accounts[0]);
  const accuCoin = await AccuCoin.deployed();

  await deployer.deploy(Staking, accuCoin.address);
  const staking = await Staking.deployed();
};

// LIBRARIES
const { expect } = require("chai");

const {
  expectEvent,
  expectRevert,
  constants,
  time,
  ether,
} = require("@openzeppelin/test-helpers");
const {
  BN,
  expectInvalidArgument,
  getEventProperty,
} = require("@openzeppelin/test-helpers");
const { web3 } = require("@openzeppelin/test-helpers/src/setup");
const { ZERO_ADDRESS } = constants;

// CONTRACTS
const StakingContract = artifacts.require("Staking");
const Token = artifacts.require("Erc20Token");
const totalSupply = ether(BN(1e6));
const depositAmount = BN(1000);
const from = (account) => ({ from: account });
contract("Staking", function ([admin, account1, account2, account3]) {
  let stakingToken, stakingContract;
  beforeEach(async () => {
    stakingToken = await Token.new(admin);
    stakingContract = await StakingContract.new(stakingToken.address);
  });
  describe("1. On deployment", async function () {
    it("1.1. should set deployer as default owner", async function () {
      expect(await stakingContract.owner()).to.equal(admin);
    });
    it("1.2. should set the token correctly", async function () {
      expect(await stakingContract.token()).to.equal(stakingToken.address);
    });
    it("1.3. should revert if token address is zero", async function () {
      await expectRevert(
        stakingContract.setTokenAddress(ZERO_ADDRESS),
        "Staking: Invalid token address"
      );
    });
  });
  describe("Staking & Unstaking", async function () {
    beforeEach(async () => {
      await stakingContract.setTokenAddress(stakingToken.address, from(admin));
      await stakingToken.transfer(account1, depositAmount, from(admin));
      await stakingToken.approve(
        stakingContract.address,
        depositAmount,
        from(account1)
      );
    });
    describe("2. Deposit & Stake ", async function () {
      it("2.1. deposit should revert if stake is called with an amount of 0", async function () {
        const message = "Staking: The stake deposit has to be larger than 0";
        await expectRevert(stakingContract.stake("0"), message);
      });
      it("2.2. should create a new deposit for the depositing account and emit StakeDeposited(msg.sender, amount)", async function () {
        const eventData = {
          account: account1,
          amount: depositAmount,
        };

        const initialBalance = await stakingToken.balanceOf(
          stakingContract.address
        );

        const { logs } = await stakingContract.stake(
          depositAmount,
          from(account1)
        );
        const currentBalance = await stakingToken.balanceOf(
          stakingContract.address
        );

        expectEvent.inLogs(logs, "StakeDeposited", eventData);
        expect(initialBalance.add(depositAmount)).to.be.bignumber.equal(
          currentBalance
        );
      });
    });

    describe("3. Withdrawal Stake", async function () {
      it("3.1. initiateWithdrawal: should revert if the account has no stake deposit", async function () {
        const withdrawAmount = BN("100");
        const revertMessage =
          "Staking: There is no stake deposit for this account";
        await expectRevert(
          stakingContract.unstake(withdrawAmount, from(account2)),
          revertMessage
        );
      });
      it("3.2. initiateWithdrawal: should revert if the account tries to withdraw more than stake deposit", async function () {
        await stakingContract.stake(depositAmount, from(account1));
        const withdrawAmount = BN("2000");
        const revertMessage = "Staking: Invalid withdraw amount";
        await expectRevert(
          stakingContract.unstake(withdrawAmount, from(account1)),
          revertMessage
        );
      });

      it("3.3. executeWithdrawal: should transfer the initial staking deposit and emit WithdrawExecuted", async function () {
        const withdrawalAmount = depositAmount;
        await stakingContract.stake(depositAmount, from(account1));

        const { logs } = await stakingContract.unstake(
          withdrawalAmount,
          from(account1)
        );

        const eventData = {
          account: account1,
          amount: withdrawalAmount,
        };

        expectEvent.inLogs(logs, "WithdrawExecuted", eventData);
      });
    });
    describe("4. Reward Calculation & Claiming", async function () {
      it("4.1. calculateReward: should calculate reward (amount / 100) for the stake deposited", async function () {
        await stakingContract.stake(1000, from(account1));
        const expectedReward = BN("10");
        const stakeDeposit = await stakingContract.getStakeDetails(account1);
        await expect(stakeDeposit[1]).to.be.bignumber.equal(expectedReward);
      });
      it("4.2. claim Reward: should revert if claim rewards called by non staker", async function () {
        const message = "Staking: This account doesn't have stake deposits";
        await expectRevert(stakingContract.claimRewards(account2), message);
      });

      it("4.3. claim Reward: should transfer admin commission(2%) to admin ", async function () {
        await stakingContract.stake(1000, from(account1));
        const expectedAdminCommission = BN("20");
        await stakingContract.claimRewards(account1);
        await expect(expectedAdminCommission).to.be.bignumber.equal(
          BN(await stakingContract.getAdminCommissionDetails())
        );
      });
      it("4.4. claim Reward: should transfer reward to user after admin fee and emit RewardClaimed ", async function () {
        await stakingContract.stake(1000, from(account1));
        const stakeDeposit = await stakingContract.getStakeDetails(account1);
        const expectedAdminCommission = BN("20");
        const expectedReward = BN(stakeDeposit[1] - expectedAdminCommission);
        const { logs } = await stakingContract.claimRewards(account1);

        const eventData = {
          account: account1,
          reward: expectedReward,
        };

        expectEvent.inLogs(logs, "RewardClaimed", eventData);
      });
    });
    describe("5. Staker Detail ", async function () {
      it("5.1 Stakers: should revert if staker not present ", async function () {
        const message = "Staking: User not Staker";
        await expectRevert(
          stakingContract.checkUserStakerStatus(account2),
          message
        );
      });
    });
    describe("6. Admin Commission ", async function () {
      it("6.1 Admin: should return total admin commission ", async function () {
        await stakingContract.stake(1000, from(account1));
        const adminCommissionInitially =
          await stakingContract.getAdminCommissionDetails();
        await stakingContract.claimRewards(account1);
        const adminCommissionAfterRewardClaims =
          await stakingContract.getAdminCommissionDetails();
        expect(adminCommissionInitially).to.be.bignumber.not.equal(
          adminCommissionAfterRewardClaims
        );
      });
    });
  });
});

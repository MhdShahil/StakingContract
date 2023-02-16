// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

//import "@openzeppelin/contracts/utils/math/Math.sol";

contract Staking is Ownable {
    /* Contract state variables */
    IERC20 public token; //staking token
    uint256 public currentTotalStake; //total stakes in the platform
    uint256 public totalAdminCommission; //total commissions earned by the admin

    /* Struct Declarations */
    struct StakeDeposit {
        uint256 amount;
        uint256 rewards;
        bool exists;
    }

    /* Mappings */
    mapping(address => StakeDeposit) public _stakeDeposits;

    /* Events */
    event StakeDeposited(address indexed account, uint256 amount);
    event WithdrawExecuted(address indexed account, uint256 amount);
    event RewardClaimed(address indexed account, uint256 reward);

    /* Constructor */
    constructor(address _stakingToken) {
        require(_stakingToken != address(0), "Staking: Invalid token address");

        token = IERC20(_stakingToken);
    }

    /* Owner Functions */

    /**
     * @notice This function is used to set staking token address
     * @dev only the owner can call this function
     * @param _token Address of the staking token
     */
    function setTokenAddress(address _token) external onlyOwner {
        require(_token != address(0), "Staking: Invalid token address");
        token = IERC20(_token);
    }

    /* Staking */

    /**
     * @notice This function is used to deposit and stake the token
     * @param _amount Amount of staking token the user wish to stake
     */
    function stake(uint256 _amount) external {
        require(
            _amount != 0,
            "Staking: The stake deposit has to be larger than 0"
        );
        StakeDeposit storage stakeDeposit = _stakeDeposits[msg.sender];

        stakeDeposit.amount += _amount;
        stakeDeposit.exists = true;
        currentTotalStake += _amount;

        calculateRewards(stakeDeposit);

        // Transfer the Tokens to this contract
        require(
            token.transferFrom(msg.sender, address(this), _amount),
            "Staking: Something went wrong during the token transfer"
        );

        emit StakeDeposited(msg.sender, _amount);
    }

    /**
     * @notice This function is used to claim rewards of staked tokens
     * @param stakeDeposit address of the staker
     */
    function calculateRewards(
        StakeDeposit memory stakeDeposit
    ) private pure returns (uint256) {
        uint256 reward = stakeDeposit.amount / 100;
        stakeDeposit.rewards = reward;
        return stakeDeposit.rewards;
    }

    /**
     * @notice This function is used to claim rewards of staked tokens
     */
    function claimRewards(address _user) external {
        StakeDeposit memory stakeDeposit = _stakeDeposits[_user];
        require(
            stakeDeposit.exists,
            "Staking: This account doesn't have stake deposits"
        );
        require(
            stakeDeposit.rewards != 0,
            "Staking: Reward tokens already claimed"
        );

        uint256 adminFee = (stakeDeposit.rewards * 2) / 100;
        totalAdminCommission += adminFee;
        uint256 tokenToTransfer = stakeDeposit.rewards - adminFee;
        stakeDeposit.rewards = 0;

        token.transfer(_user, tokenToTransfer);
        emit RewardClaimed(_user, tokenToTransfer);
    }

    /**
     * @notice This function is used to execute withdrawal of staked tokens
     * @param _withdrawAmount Amount of staking token the user wish to unstake
     */
    function unstake(uint256 _withdrawAmount) external {
        StakeDeposit memory stakeDeposit = _stakeDeposits[msg.sender];

        require(
            stakeDeposit.amount != 0,
            "Staking: There is no stake deposit for this account"
        );

        require(
            stakeDeposit.amount >= _withdrawAmount,
            "Staking: Invalid withdraw amount"
        );
        if (stakeDeposit.amount > _withdrawAmount) {
            _stakeDeposits[msg.sender].amount =
                (_stakeDeposits[msg.sender].amount) -
                (_withdrawAmount);
        } else {
            _stakeDeposits[msg.sender].exists = false;
        }
        currentTotalStake -= _withdrawAmount;

        require(
            token.transfer(msg.sender, _withdrawAmount),
            "Staking: Something went wrong while transferring your initial deposit"
        );

        //emit WithdrawExecuted(msg.sender, amount);
        emit WithdrawExecuted(msg.sender, _withdrawAmount);
    }

    // VIEW FUNCTIONS FOR HELPING THE USER AND CLIENT INTERFACE

    /**
     * @notice Helper function to fetch the commissions earned by the admin
     */
    function getAdminCommissionDetails()
        external
        view
        returns (uint256 adminCommission)
    {
        return totalAdminCommission;
    }

    /**
     * @notice Helper function to to check whether the address is a staker
     */
    function checkUserStakerStatus(address _user) external view {
        StakeDeposit memory stakeDeposit = _stakeDeposits[_user];
        require(stakeDeposit.exists, "Staking: User not Staker");
    }

    /**
     * @notice Helper function to to get details of the staker
     * @param account Address of the stakers account
     */
    function getStakeDetails(
        address account
    ) external view returns (uint256 stakeDeposit, uint256 rewards) {
        require(
            _stakeDeposits[account].exists &&
                _stakeDeposits[account].amount != 0,
            "Staking: This account doesn't have a stake deposit"
        );

        StakeDeposit memory s = _stakeDeposits[account];

        return (s.amount, calculateRewards(s));
    }
}

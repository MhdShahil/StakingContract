// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract AccuCoin is ERC20 {
    constructor(address admin) ERC20("AccuCoin", "ACCU") {
        _mint(admin, 1000000 * 10 ** decimals()); //totalsupply=10Million
    }

    /**
     * @notice This function is to get decimals for token
     */
    function decimals() public pure override returns (uint8) {
        return 18;
    }
}

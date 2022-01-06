//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./ISFTReceiver.sol";

/**
    Note: The ERC-165 identifier for this interface is TODO.
*/
/**
 * @dev Implementation of the {ISFTReceiver} interface.
 */
contract SFTReceiver is ISFTReceiver {

    /**
     * @dev See {ISFTReceiver-onERCSFTReceived}
     */
    function onERCSFTReceived(address, address, uint256, uint256, bytes memory) public virtual override returns(bytes4) {
        return this.onERCSFTReceived.selector;
    }

    /**
     * @dev See {ISFTReceiver-onERCSFTBatchReceived}
     */
    function onERCSFTBatchReceived(address, address, uint256[] memory, uint256[] memory, bytes memory) public virtual override returns(bytes4) {
        return this.onERCSFTBatchReceived.selector;
    }
}

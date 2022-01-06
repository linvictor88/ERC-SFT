// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../SFT/ISFTReceiver.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165.sol";

contract ERCSFTReceiverMock is ERC165, ISFTReceiver {
    bytes4 private _recRetval;
    bool private _recReverts;
    bytes4 private _batRetval;
    bool private _batReverts;

    event Received(address operator, address from, uint256 id, uint256 value, bytes data, uint256 gas);
    event BatchReceived(address operator, address from, uint256[] ids, uint256[] values, bytes data, uint256 gas);

    constructor(
        bytes4 recRetval,
        bool recReverts,
        bytes4 batRetval,
        bool batReverts
    ) {
        _recRetval = recRetval;
        _recReverts = recReverts;
        _batRetval = batRetval;
        _batReverts = batReverts;
    }

    function onERCSFTReceived(
        address operator,
        address from,
        uint256 id,
        uint256 value,
        bytes calldata data
    ) external override returns (bytes4) {
        require(!_recReverts, "ERCSFTReceiverMock: reverting on receive");
        emit Received(operator, from, id, value, data, gasleft());
        return _recRetval;
    }

    function onERCSFTBatchReceived(
        address operator,
        address from,
        uint256[] calldata ids,
        uint256[] calldata values,
        bytes calldata data
    ) external override returns (bytes4) {
        require(!_batReverts, "ERCSFTReceiverMock: reverting on batch receive");
        emit BatchReceived(operator, from, ids, values, data, gasleft());
        return _batRetval;
    }
}

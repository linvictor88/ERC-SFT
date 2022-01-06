//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

interface ISFT is IERC721{
    /**
        @dev This emits when `_value` tokens of semi-fungible token (SFT) type are minted.
        The `_operator` argument MUST be the address of an account/contract that is approved to
        mint this type of token.
     */
    event SemiTypeMinted(address indexed _operator, address indexed _to, uint256 indexed _tokenType, bytes _data, uint256 _value);

    /**
        @dev This emits when approval for a second party/operator address to manage `_tokenType` of SFTs
        for an owner address is enabled or disabled.
     */
    event ApprovalForSemi(address indexed _owner, address indexed _operator, uint256 indexed _tokenType, bool _approved);

    /**
        @dev This emits when approval for a second party/operator address to manage all types of SFTs
        for an owner address is enabled or disabled.
      */
    event ApprovalForAllSemi(address indexed _owner, address indexed _operator, bool _approved);

    /**
        @dev This emits when a new NFT is minted from one type of SFT
     */
    event SemiMinted(address _operator, address indexed _from, address indexed _to, uint256 indexed _tokenId, uint256 _tokenType);

    /* ERC-1155 events compatible*/
    /**
        @dev Either `SemiTransferSingle` or `SemiTransferBatch` MUST emit when tokens are transferred, including zero value transfers as well as minting or burning (see "Safe Transfer Rules" section of the standard).
        The `_operator` argument MUST be the address of an account/contract that is approved to make the transfer (SHOULD be msg.sender).
        The `_from` argument MUST be the address of the holder whose balance is decreased.
        The `_to` argument MUST be the address of the recipient whose balance is increased.
        The `_tokenType` argument MUST be the token type being transferred.
        The `_value` argument MUST be the number of tokens the holder balance is decreased by and match what the recipient balance is increased by.
        When minting/creating tokens, the `_from` argument MUST be set to `0x0` (i.e. zero address).
        When burning/destroying tokens, the `_to` argument MUST be set to `0x0` (i.e. zero address).
    */
    event SemiTransferSingle(address indexed _operator, address indexed _from, address indexed _to, uint256 _tokenType, uint256 _value);

    /**
        @dev Either `SemiTransferSingle` or `SemiTransferBatch` MUST emit when tokens are transferred, including zero value transfers as well as minting or burning (see "Safe Transfer Rules" section of the standard).
        The `_operator` argument MUST be the address of an account/contract that is approved to make the transfer (SHOULD be msg.sender).
        The `_from` argument MUST be the address of the holder whose balance is decreased.
        The `_to` argument MUST be the address of the recipient whose balance is increased.
        The `_tokenTypes` argument MUST be the list of token types being transferred.
        The `_values` argument MUST be the list of number of tokens (matching the list and order of tokens specified in _ids) the holder balance is decreased by and match what the recipient balance is increased by.
        When minting/creating tokens, the `_from` argument MUST be set to `0x0` (i.e. zero address).
        When burning/destroying tokens, the `_to` argument MUST be set to `0x0` (i.e. zero address).
    */
    event SemiTransferBatch(address indexed _operator, address indexed _from, address indexed _to, uint256[] _tokenTypes, uint256[] _values);

    /**
        @notice Create `_value` tokens of `_tokenType` to `_to`.
        @dev Caller must be owner or approved to create new SFT type
        `to` cannot be zero address.
        MUST emit `SemiTypeMinted` event to reflect the new sem-fungible token type creation.
        @param _to          address that `_tokenType` tokens assigned to.
        @param _tokenType   SFT type
        @param _data        The metadata for `_tokenType`
        @param _value       The number of tokens for `_tokenType`
     */
    function semiTypeMint(address _to, uint256 _tokenType, uint256 _value, bytes calldata _data) external;

    /**
        @notice Enable or disable approval for a third party ("operator") to manage caller's '_tokenType' tokens.
        @dev MUST emit `ApprovalForSemi` event on success.
        MUST revert if `_tokenType` doesn't exist
        @param _operator    Address of authorized operators
        @param _tokenType   SFT type
        @param _approved    True if the operator is approved, false to revoke approval
    */
    function setApprovalForSemi(address _operator, uint256 _tokenType, bool _approved) external;

    /**
        @notice Queries the approval status of an operator for a given owner and `_tokenType`.
        @param _owner      The address of the token holder
        @param _operator   Address of authorized operator
        @param _tokenType  SFT type
        @return            True if the operator is approved, false if not
    */
    function isApprovedForSemi(address _owner, address _operator, uint256 _tokenType) external view returns (bool);

    /**
        @notice Enable or disable approval for a third party ("operator") to manage caller's all SFT tokens.
        @dev MUST emit `SemiApprovalForAll` event on success.
        @param _operator  Address of authorized operators
        @param _approved  True if the operator is approved, false to revoke approval
     */
    function setApprovalForAllSemi(address _operator, bool _approved) external;

    /**
        @notice Queries the approval status of an operator for a given owner.
        @param _owner     The address of the token holder
        @param _operator  Address of authorized operator
        @return           True if the operator is approved, false if not
    */
    function isApprovedForAllSemi(address _owner, address _operator) external view returns (bool);

    /**
       @notice Mint one SFT type of NFT from the `_from` to the `_to` as ownership of converted NFT with `_tokenId`.
       @dev Caller must be approved to manage the token being transferred out of the `_from` account.
       MUST emit `SemiTransferSingle` event to reflect the SFT converted to NFT information.
       MUST emit `SemiMinted` event to reflect the new NFT creation information.
       MUST emit `Transfer` event to reflect NFT creation.
       MUST revert if `_to` is the zero address.
       MUST revert if semiBalance of `_from` is lower than 1.
       MUST revert if `_tokenType` is invalid
       MUST revert on any other error.
       would generate unique tokenId across the contract as the NFT id to caller.
       unique tokenId is recorded in `SemiMinted` event.
       SFT owner calling this function to mint one SFT type of NFT to `_to`, accordingly, the SFT
       balance of `_from` is decreased by 1, while NFT balance of `_to` is increased by 1.
       @param _from        Source address
       @param _to          Target address
       @param _tokenType   SFT type
       @param _data        The metadata for `_tokenType`
     */
    function semiMint(address _from, address _to, uint256 _tokenType, bytes calldata _data) external;

    /**
        @notice Transfers `_value` amount of a `_tokenType` from the `_from` address to the `_to` address specified (with safety call).
        @dev Caller must be approved to manage the tokens being transferred out of the `_from` account (see "Approval" section of the standard).
        MUST revert if `_to` is the zero address.
        MUST revert if balance of holder for `_tokenType` tokens is lower than the `_value` sent.
        MUST revert on any other error.
        MUST emit the `SemiTransferSingle` event to reflect the balance change (see "Safe Transfer Rules" section of the standard).
        After the above conditions are met, this function MUST check if `_to` is a smart contract (e.g. code size > 0). If so, it MUST call `onERCSFTReceived` on `_to` and act appropriately (see "Safe Transfer Rules" section of the standard).
        @param _from        Source address
        @param _to          Target address
        @param _tokenType   SFT type
        @param _value       Transfer amount
        @param _data        Additional data with no specified format, MUST be sent unaltered in call to `onERCSFTReceived` on `_to`
    */
    function semiSafeTransferFrom(address _from, address _to, uint256 _tokenType, uint256 _value, bytes calldata _data) external;

    /**
        @notice Transfers `_values` amount(s) of `_tokenTypes` from the `_from` address to the `_to` address specified (with safety call).
        @dev Caller must be approved to manage the tokens being transferred out of the `_from` account (see "Approval" section of the standard).
        MUST revert if `_to` is the zero address.
        MUST revert if length of `_tokenTypes` is not the same as length of `_values`.
        MUST revert if any of the balance(s) of the holder(s) for token(s) in `_tokenTypes` is lower than the respective amount(s) in `_values` sent to the recipient.
        MUST revert on any other error.
        MUST emit `SemiTransferSingle` or `SemiTransferBatch` event(s) such that all the balance changes are reflected (see "Safe Transfer Rules" section of the standard).
        Balance changes and events MUST follow the ordering of the arrays (_ids[0]/_values[0] before _ids[1]/_values[1], etc).
        After the above conditions for the transfer(s) in the batch are met, this function MUST check if `_to` is a smart contract (e.g. code size > 0). If so, it MUST call the relevant `ERCSFTTokenReceiver` hook(s) on `_to` and act appropriately (see "Safe Transfer Rules" section of the standard).
        @param _from            Source address
        @param _to              Target address
        @param _tokenTypes      SFT types (order and length must match _values array)
        @param _values          Transfer amounts per token type (order and length must match _tokenTypes array)

        @param _data        Additional data with no specified format, MUST be sent unaltered in call to `onERCSFTReceived` on `_to`
    */
    function semiSafeBatchTransferFrom(address _from, address _to, uint256[] calldata _tokenTypes, uint256[] calldata _values, bytes calldata _data) external;

    /**
        @notice Get the balance of an account's tokens for `_tokenType`.
        @param _owner         The address of the token holder
        @param _tokenType     The token type
        @return               The _owner's balance of the token type requested
     */
    function balanceOfSemi(address _owner, uint256 _tokenType) external view returns (uint256);

    /**
     * @dev Total amount of SFTs in with a given `_tokenType`.
     */
    function totalSupplyForSemi(uint256 _tokenType) external view returns (uint256);
}

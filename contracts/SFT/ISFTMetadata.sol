//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface ISFTMetadata /* is ISFT */{
    /// @notice A descriptive name for a collection of SFTs in this contract
    function semiName(uint256 _tokenType) external view returns (string memory);
    /// @notice An abbreviated name for SFTs in this contract
    function semiSymbol(uint256 _tokenType) external view returns (string memory);
    /// @notice A distinct Uniform Resource Identifier (URI) for a given asset.
    /// @dev Throws if `_id` is not a valid NFT. URIs are defined in RFC
    ///  3986. The URI may point to a JSON file that conforms to the "ERC721
    ///  Metadata JSON Schema".
    function semiURI(uint256 _tokenType) external view returns (string memory);
}

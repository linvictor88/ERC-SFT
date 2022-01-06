// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../SFT/SFT.sol";

/**
 * @title ERCSFTMock
 * This mock just provides a public burn functions for testing purposes
 */
contract ERCSFTMock is SFT {
    constructor(string memory name, string memory symbol) SFT(name, symbol) {}

    function setSemiBaseURI(string memory baseUri) public {
        _setSemiBaseURI(baseUri);
    }

    function SemiBaseURI() public view returns (string memory) {
        return _semiBaseURI();
    }

    function setSemiURI(uint256 _tokenType, string memory _uri) public {
        _setSemiURI(_tokenType, _uri);
    }

    function setSemiName(uint256 _tokenType, string memory name) public {
        _setSemiName(_tokenType, name);
    }

    function setSemiSymbol(uint256 _tokenType, string memory symbol) public {
        _setSemiSymbol(_tokenType, symbol);
    }

    function semiTypeBurn(
        address _from,
        uint256 _tokenType,
        uint256 _value
    ) public {
        _semiTypeBurn(_from, _tokenType, _value);
    }

    /* ERC721 mock */
    function baseURI() public view returns (string memory) {
        return _baseURI();
    }

    function exists(uint256 tokenId) public view returns (bool) {
        return _exists(tokenId);
    }

    function mint(address to, uint256 tokenId) public {
        _mint(to, tokenId);
    }

    function safeMint(address to, uint256 tokenId) public {
        _safeMint(to, tokenId);
    }

    function safeMint(
        address to,
        uint256 tokenId,
        bytes memory _data
    ) public {
        _safeMint(to, tokenId, _data);
    }

    function burn(uint256 tokenId) public {
        _burn(tokenId);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

import "./ISFT.sol";
import "./ISFTReceiver.sol";
import "./ISFTMetadata.sol";


/**
 * @dev Implementation of the basic standard semi-fungible token.
 * @notice Copy some codes from openzeppelin/contract/token/ERC1155/ERC1155.sol with MIT license
 */

contract SFT is Context, ISFT, ISFTMetadata, ERC721 {
    using Address for address;
    using Strings for uint256;

    // Mapping from semi-fungible token (SFT) type to metadata
    mapping(uint256 => bytes) private _semiMetadatas;

    // Mapping from SFT type to totalSupply
    mapping(uint256 => uint256) private _semiTotals;


    // Used as default URI for all types of SFT.
    string private _semiBaseUri;

    // Used as the URI for one type of SFT.
    mapping(uint256 => string) private _semiUri;

    // Mapping from SFT type to name
    mapping(uint256 => string) private _semiName;

    //Mapping from SFT type to symbol
    mapping(uint256 => string) private _semiSymbol;

    // Mapping from SFT type to account balances
    mapping(uint256 => mapping(address => uint256)) private _balances;

    // Mapping from one type of SFT owner to operator approvals
    mapping(uint256 => mapping(address => mapping(address => bool))) private _semiApprovals;

    // Mapping from all types of SFT owner to operator approvals
    mapping(address => mapping(address => bool)) private _semiAllApprovals;

    // NFT token index
    uint256 private _nftId = 0;

    constructor(string memory name_, string memory symbol_) ERC721(name_, symbol_) {
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721, IERC165) returns (bool) {
        return
            interfaceId == type(ISFT).interfaceId ||
            interfaceId == type(ISFTMetadata).interfaceId ||
            super.supportsInterface(interfaceId);
    }

    /**
     * @dev Returns whether `operator` is the contract owner or get approval.
     */
    function _isSemiTypeMintApproved(address, address, uint256, uint256, bytes memory) internal virtual returns (bool) {
        return true;
    }

    /**
     * `_tokenType` process after minting operation.
     */
    function _afterSemiTypeMint(address, address, uint256 _tokenType, uint256, bytes memory _data) internal virtual {
        _semiMetadatas[_tokenType] = _data;
    }

    function _getSemiTypeData(uint256 _tokenType) internal view virtual returns (bytes memory) {
        return _semiMetadatas[_tokenType];
    }

    /**
     * @dev See {ISFT-semiTypeMint}.
     */
    function semiTypeMint(address _to, uint256 _tokenType, uint256 _value, bytes memory _data) public virtual override {
        require(_to != address(0), "SFT: mint to the zero address");

        address _operator = _msgSender();
        require(_isSemiTypeMintApproved(_operator, _to, _tokenType, _value, _data),
                "SFT: semiTypeMint caller is not owner nor approved");

        _beforeSemiTokenTransfer(_operator, address(0), _to, _asSingletonArray(_tokenType), _asSingletonArray(_value), _data);

        _balances[_tokenType][_to] += _value;
        emit SemiTypeMinted(_operator, _to, _tokenType, _data, _value);
        emit SemiTransferSingle(_operator, address(0), _to, _tokenType, _value);

        _doSafeTransferAcceptanceCheck(_operator, address(0), _to, _tokenType, _value, _data);
        _afterSemiTypeMint(_operator, _to, _tokenType, _value, _data);
    }

    function _setSemiName(uint256 _tokenType, string memory name) internal virtual {
        _semiName[_tokenType] = name;
    }

    function semiName(uint256 _tokenType) public view virtual override returns (string memory) {
        return _semiName[_tokenType];
    }

    function _setSemiSymbol(uint256 _tokenType, string memory symbol) internal virtual {
        _semiSymbol[_tokenType] = symbol;
    }

    function semiSymbol(uint256 _tokenType) public view virtual override returns (string memory) {
        return _semiSymbol[_tokenType];
    }

    function _setSemiBaseURI(string memory baseUri) internal virtual {
        _semiBaseUri = baseUri;
    }

    function _semiBaseURI() internal view virtual returns (string memory) {
        return _semiBaseUri;
    }

    function _setSemiURI(uint256 _tokenType, string memory _uri) internal virtual {
        _semiUri[_tokenType] = _uri;
    }

    function semiURI(uint256 _tokenType) public view virtual override returns (string memory) {
        // TODO(linb): SVG refers to uniswap3 LP token
        if (bytes(_semiUri[_tokenType]).length > 0) {
            return _semiUri[_tokenType];
        }
        return _semiBaseUri;
    }

    function totalSupplyForSemi(uint256 _tokenType) public view virtual override returns (uint256) {
        return _semiTotals[_tokenType];
    }

    function balanceOfSemi(address _owner, uint256 _tokenType) public view virtual override returns (uint256) {
        require(_owner != address(0), "SFT: balance query for the zero address");
        return _balances[_tokenType][_owner];
    }

    function _setApprovalForSemi(address _owner, address _operator, uint256 _tokenType, bool _approved) internal virtual {
        require(_owner != _operator, "SFT: setting approval status for self");
        _semiApprovals[_tokenType][_owner][_operator] = _approved;
        emit ApprovalForSemi(_owner, _operator, _tokenType, _approved);
    }

    function setApprovalForSemi(address _operator, uint256 _tokenType, bool _approved) public virtual override {
        _setApprovalForSemi(_msgSender(), _operator, _tokenType, _approved);
    }

    function isApprovedForSemi(address _owner, address _operator, uint256 _tokenType) public view virtual override returns (bool) {
        return
            _semiAllApprovals[_owner][_operator] ||
            _semiApprovals[_tokenType][_owner][_operator];
    }

    function _setApprovalForAllSemi(
        address _owner,
        address _operator,
        bool _approved
    ) internal virtual {
        require(_owner != _operator, "SFT: setting approval status for self");
        _semiAllApprovals[_owner][_operator] = _approved;
        emit ApprovalForAllSemi(_owner, _operator, _approved);
    }

    function setApprovalForAllSemi(address _operator, bool _approved) public virtual override {
        _setApprovalForAllSemi(_msgSender(), _operator, _approved);
    }

    function isApprovedForAllSemi(address _owner, address _operator) public view virtual override returns (bool) {
        return _semiAllApprovals[_owner][_operator];
    }

    /**
     * Approve the semi-fungible token transfer operation from `_tokenType` if:
     *   `_operator` is the `_tokenTypes` owner `_owner`
     *   `_operator` has approval on `_tokenType` of `_owner`
     *   `_operator` has all semi-fungible token types' approval for `_owner`
     */
    function _isSemiTransferApproved(address _owner, address _operator, uint256[] memory _tokenTypes) internal virtual returns (bool) {
        if (_owner == _operator ||
            isApprovedForAllSemi(_owner, _operator)) {
            return true;
        }

        for (uint256 i = 0; i < _tokenTypes.length; i++) {
            if (!isApprovedForSemi(_owner, _operator, _tokenTypes[i])) {
                return false;
            }
        }
        return true;
    }

    /**
     * @dev Destroys `amount` tokens of `_tokenType` SFT from `from`
     *
     * This is a reverse operation of semiTypeMint
     * Requirements:
     *
     * - `from` cannot be the zero address.
     * - `from` must have at least `amount` tokens of token type `id`.
     */

    function _semiTypeBurn(
        address _from,
        uint256 _tokenType,
        uint256 _value
    ) internal virtual {
        require(_from != address(0), "SFT: burn from the zero address");

        uint256 _balance = _balances[_tokenType][_from];
        require(_balance >= _value, "SFT: burn amount exceeds balance");

        address _operator = _msgSender();
        _beforeSemiTokenTransfer(_operator, _from, address(0), _asSingletonArray(_tokenType), _asSingletonArray(_value), "");

        _balances[_tokenType][_from] -= _value;

        emit SemiTransferSingle(_operator, _from, address(0), _tokenType, _value);
    }

    function _getNftId() internal virtual returns (uint256) {
        return _nftId;
    }

    /**
     * @notice find one available non-fungible token id for use
     */
    function _findNftId() internal virtual returns (uint256) {
        return _nftId++;
    }

    function _semiMint(address _owner, address _operator, address _to,
                       uint256 _tokenType, uint256 tokenId, bytes memory _data) internal virtual {
        _balances[_tokenType][_owner] -= 1;
        emit SemiTransferSingle(_msgSender(), _owner, address(0), _tokenType, 1);
        // call safe minting operation to mint the NFT from `_tokenType`
        _safeMint(_to, tokenId, _data);
        emit SemiMinted(_operator, _owner, _to, tokenId, _tokenType);
    }

    function _isSemiMintApproved(address, address, address, uint256, uint256, bytes memory) internal virtual returns (bool) {
        return true;
    }

    /**
     * @dev See {ISFT-semiMint}.
     */
    function semiMint(
        address _from,
        address _to,
        uint256 _tokenType,
        bytes memory _data) public virtual override {
        uint256 tokenId = _findNftId();
        require(_isSemiMintApproved(_msgSender(), _from, _to, _tokenType, tokenId, _data),
                "SFT: caller is not mint owner nor approved");
        require(_isSemiTransferApproved(_from, _msgSender(), _asSingletonArray(_tokenType)),
                "SFT: caller is not owner nor approved");
        require(_to != address(0), "SFT: semi-mint to the zero address");
        require(_balances[_tokenType][_from] > 0, "SFT: owner has no sft balance");

        _semiMint(_from, _msgSender(), _to, _tokenType, tokenId, _data);
    }

    /**
     * @dev Hook that is called before any SFT token transfer. This includes minting
     * and burning, as well as batched variants.
     *
     * The same hook is called on both single and batched variants. For single
     * transfers, the length of the `id` and `amount` arrays will be 1.
     *
     * Calling conditions (for each `id` and `amount` pair):
     *
     * - When `from` and `to` are both non-zero, `amount` of ``from``'s tokens
     * of token type `id` will be  transferred to `to`.
     * - When `from` is zero, `amount` tokens of token type `id` will be minted
     * for `to`.
     * - when `to` is zero, `amount` of ``from``'s tokens of token type `id`
     * will be burned.
     * - `from` and `to` are never both zero.
     * - `ids` and `amounts` have the same, non-zero length.
     *
     * To learn more about hooks, head to xref:ROOT:extending-contracts.adoc#using-hooks[Using Hooks].
     */
    function _beforeSemiTokenTransfer(
        address,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory
    ) internal virtual {
        if (from == address(0)) {
            for (uint256 i = 0; i < ids.length; ++i) {
                _semiTotals[ids[i]] += amounts[i];
            }
        }

        if (to == address(0)) {
            for (uint256 i = 0; i < ids.length; ++i) {
                _semiTotals[ids[i]] -= amounts[i];
            }
        }
    }

    function _asSingletonArray(uint256 element) private pure returns (uint256[] memory) {
        uint256[] memory array = new uint256[](1);
        array[0] = element;

        return array;
    }

    function _doSafeTransferAcceptanceCheck(
        address operator,
        address from,
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) private {
        if (to.isContract()) {
            try ISFTReceiver(to).onERCSFTReceived(operator, from, id, amount, data) returns (bytes4 response) {
                if (response != ISFTReceiver.onERCSFTReceived.selector) {
                    revert("ERCSFT: ERCSFTReceiver rejected tokens");
                }
            } catch Error(string memory reason) {
                revert(reason);
            } catch {
                revert("ERCSFT: transfer to non ERCSFTReceiver implementer");
            }
        }
    }

    function _doSafeBatchTransferAcceptanceCheck(
        address _operator,
        address _from,
        address _to,
        uint256[] memory _tokenTypes,
        uint256[] memory _values,
        bytes memory _data) private {

        if (_to.isContract()) {
            try ISFTReceiver(_to).onERCSFTBatchReceived(_operator, _from, _tokenTypes, _values, _data) returns (
                bytes4 response
            ) {
                if (response != ISFTReceiver.onERCSFTBatchReceived.selector) {
                    revert("SFT: ERCSFTReceiver rejected tokens");
                }
            } catch Error(string memory reason) {
                revert(reason);
            } catch {
                revert("SFT: transfer to non SFTReceiver implementer");
            }
        }
    }

    /**
     * @dev See {ISFT-semiSafeTransferFrom}
     */
    function semiSafeTransferFrom(address _from, address _to, uint256 _tokenType, uint256 _value, bytes memory _data) public virtual override {
        require(_isSemiTransferApproved(_from, _msgSender(), _asSingletonArray(_tokenType)),
                "SFT: caller is not owner nor approved");
        require(_to != address(0), "SFT: transfer to the zero address");

        address _operator = _msgSender();

        _beforeSemiTokenTransfer(_operator, _from, _to, _asSingletonArray(_tokenType), _asSingletonArray(_value), _data);

        uint256  _balance  = _balances[_tokenType][_from];
        require(_balance >= _value, "SFT: insufficient balance for transfer");
        _balances[_tokenType][_from] -= _value;
        _balances[_tokenType][_to] += _value;

        emit SemiTransferSingle(_operator, _from, _to, _tokenType, _value);

        _doSafeTransferAcceptanceCheck(_operator, _from, _to, _tokenType, _value, _data);
    }

    function _semiSafeBatchTransferFrom(address _from, address _to, uint256[] memory _tokenTypes, uint256[] memory _values, bytes memory _data) internal virtual {
        require(_tokenTypes.length == _values.length, "SFT: _tokenTypes and _values length mismatch");
        require(_to != address(0), "SFT: transfer to the zero address");

        address _operator = _msgSender();

        _beforeSemiTokenTransfer(_operator, _from, _to, _tokenTypes, _values, _data);

        for (uint256 i = 0; i < _tokenTypes.length; i++) {
            uint256 _tokenType = _tokenTypes[i];
            uint256 _value = _values[i];

            uint256 _balance = _balances[_tokenType][_from];
            require(_balance >= _value, "SFT: insufficient balance for transfer");
            _balances[_tokenType][_from] -= _value;
            _balances[_tokenType][_to] += _value;

        }
        emit SemiTransferBatch(_operator, _from, _to, _tokenTypes, _values);
        _doSafeBatchTransferAcceptanceCheck(_operator, _from, _to, _tokenTypes, _values, _data);
    }

    function semiSafeBatchTransferFrom(address _from, address _to, uint256[] memory _tokenTypes, uint256[] memory _values, bytes memory _data) public virtual override {
        require(_isSemiTransferApproved(_from, _msgSender(), _tokenTypes),
                "SFT: caller is not owner nor approved");
        _semiSafeBatchTransferFrom(_from, _to, _tokenTypes, _values, _data);
    }

}

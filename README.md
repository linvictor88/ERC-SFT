---
eip: <to be assigned>
title: Semi-fungible token standard
author: Bo Lin (@linvictor88)
discussions-to: <URL>
status: Draft
type: Standards Track
category: ERC
created: 2021-12-16
requires (*optional): <EIP number(s)>
---

## Simple Summary
A standard interface for contracts that manage semi-fungible token(s). A single deployed contract usually includes multiple types of fungible tokens and one single transformational non-fungible token.

## Abstract
This standard outlines a smart contract interface that can represent semi-fungible tokens (SFT). SFTs start out as types of fungible tokens and finally ends as non-fungible tokens to provide value. ERC-1155 can manage combination of fungible tokens and non-fungible tokens, however, i think it's intractable for semi-fungible token representation. So here we suggest this standard sepcially for semi-fungible token use, in which fungible token types are managed like ERC-1155 and non-fungible tokens are totally managed by ERC-721.

## Motivation
ERC-1155 did the combination of ERC-20 and ERC-721 to allow transferring multiple token types and ids at once. This can greatly save transaction costs and remove the need to "approve" individual token contracts seperately. But we think it's not appropriate for semi-fungible token as following reasons:
* ERC-1155 requires smart contract to ensure the quantity as 1 to represent NFT which is not nature. Also ownership, as one of the important attribute in NFT, is hard to track with ERC-1155.

* By checking semi-fungible token scenarios, there are usually no requirements to have more than one types of NFT in the single smart contract such as mixing concert tickets and software licenses. Even we have such reqirement, we can work around it by defining the type in metadata of NFT.

* NFT usually has different value with fungible token in SFT, which needs separate approvals.

Also none of present ERCs has the transition from fungible token to non-fungible token, we think it's necessary to define a standard interface specially for SFT. SFT can manage mutiple types of fungible tokens and the transition from FTs to NFTs. SFT also defines different approvals for FT and NFT. There are many scenarios depending on SFT. For example, concert tickets can be fungible token owning same right to watch a show, will turn to NFT once delivered to audience with the unique seat number, owner name and et, al. TODO, copy something from paper

## Specification
The key words “MUST”, “MUST NOT”, “REQUIRED”, “SHALL”, “SHALL NOT”, “SHOULD”, “SHOULD NOT”, “RECOMMENDED”, “MAY”, and “OPTIONAL” in this document are to be interpreted as described in RFC 2119.

The technical specification should describe the syntax and semantics of any new feature. The specification should be detailed enough to allow competing, interoperable implementations for any of the current Ethereum platforms (go-ethereum, parity, cpp-ethereum, ethereumj, ethereumjs, and [others](https://github.com/ethereum/wiki/wiki/Clients)).

## Rationale
The rationale fleshes out the specification by describing what motivated the design and why particular design decisions were made. It should describe alternate designs that were considered and related work, e.g. how the feature is supported in other languages.

## Backwards Compatibility
All EIPs that introduce backwards incompatibilities must include a section describing these incompatibilities and their severity. The EIP must explain how the author proposes to deal with these incompatibilities. EIP submissions without a sufficient backwards compatibility treatise may be rejected outright.

## Test Cases
Test cases for an implementation are mandatory for EIPs that are affecting consensus changes.  If the test suite is too large to reasonably be included inline, then consider adding it as one or more files in `../assets/eip-####/`.

## Reference Implementation
An optional section that contains a reference/example implementation that people can use to assist in understanding or implementing this specification.  If the implementation is too large to reasonably be included inline, then consider adding it as one or more files in `../assets/eip-####/`.

## Security Considerations
All EIPs must contain a section that discusses the security implications/considerations relevant to the proposed change. Include information that might be important for security discussions, surfaces risks and can be used throughout the life cycle of the proposal. E.g. include security-relevant design decisions, concerns, important discussions, implementation-specific guidance and pitfalls, an outline of threats and risks and how they are being addressed. EIP submissions missing the "Security Considerations" section will be rejected. An EIP cannot proceed to status "Final" without a Security Considerations discussion deemed sufficient by the reviewers.

## Copyright
Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).

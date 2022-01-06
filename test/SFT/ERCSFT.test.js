const { BN, constants, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { ZERO_ADDRESS } = constants;

const { expect } = require('chai');

const {
    shouldBehaveLikeERCSFT,
    shouldBehaveLikeERCSFTMetadata,
} = require('./ERCSFT.behavior');

const {
  shouldBehaveLikeERC721,
  shouldBehaveLikeERC721Metadata,
} = require('./ERC721.behavior');

const ERCSFTMock = artifacts.require('ERCSFTMock');

contract('ERCSFT', function (accounts) {
  const [operator, tokenHolder, ...otherAccounts] = accounts;

  const name = 'Semi Fungible Token';
  const symbol = 'SFT';

  beforeEach(async function () {
    this.token = await ERCSFTMock.new(name, symbol);
  });

  shouldBehaveLikeERCSFT(otherAccounts);
  shouldBehaveLikeERCSFTMetadata(otherAccounts);

  // ERC721 compatible
  shouldBehaveLikeERC721('ERC721', ...otherAccounts);
  shouldBehaveLikeERC721Metadata('ERC721', name, symbol, ...otherAccounts);

  describe('internal functions', function () {
    const tokenId = new BN(1990);
    const mintAmount = new BN(9001);
    const burnAmount = new BN(3000);

    const tokenBatchIds = [new BN(2000), new BN(2010), new BN(2020)];
    const mintAmounts = [new BN(5000), new BN(10000), new BN(42195)];
    const burnAmounts = [new BN(5000), new BN(9001), new BN(195)];

    const data = '0x12345678';

    describe('_semiTypeBurn', function () {
      it('reverts when burning the zero account\'s tokens', async function () {
        await expectRevert(
          this.token.semiTypeBurn(ZERO_ADDRESS, tokenId, mintAmount),
          'SFT: burn from the zero address',
        );
      });

      it('reverts when burning a non-existent token id', async function () {

        expect(await this.token.balanceOfSemi(tokenHolder, tokenId)).to.be.bignumber.equal('0');

        await expectRevert(
          this.token.semiTypeBurn(tokenHolder, tokenId, mintAmount),
          'SFT: burn amount exceeds balance',
          {from: operator}
        );
      });

      it('reverts when burning more than available tokens', async function () {
        await this.token.semiTypeMint(
          tokenHolder,
          tokenId,
          mintAmount,
          data,
          { from: operator },
        );

        await expectRevert(
          this.token.semiTypeBurn(tokenHolder, tokenId, mintAmount.addn(1)),
          'SFT: burn amount exceeds balance',
        );
      });

      context('with minted-then-burnt tokens', function () {
        beforeEach(async function () {
          await this.token.semiTypeMint(tokenHolder, tokenId, mintAmount, data);
          ({ logs: this.logs } = await this.token.semiTypeBurn(
            tokenHolder,
            tokenId,
            burnAmount,
            { from: operator },
          ));
        });

        it('emits a SemiTransferSingle event', function () {
          expectEvent.inLogs(this.logs, 'SemiTransferSingle', {
            _operator: operator,
            _from: tokenHolder,
            _to: ZERO_ADDRESS,
            _tokenType: tokenId,
            _value: burnAmount,
          });
        });
      });
    });
  });

});

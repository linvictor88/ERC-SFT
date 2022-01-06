const { BN, constants, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { ZERO_ADDRESS } = constants;

const { expect } = require('chai');

const { shouldSupportInterfaces } = require('../utils/introspection/SupportsInterface.behavior');

const ERCSFTReceiverMock = artifacts.require('ERCSFTReceiverMock');
const ERC721ReceiverMock = artifacts.require('ERC721ReceiverMock');

const Error = [ 'None', 'RevertWithMessage', 'RevertWithoutMessage', 'Panic' ]
  .reduce((acc, entry, idx) => Object.assign({ [entry]: idx }, acc), {});

function shouldBehaveLikeERCSFT ([minter, firstTokenHolder, secondTokenHolder, multiTokenHolder, recipient, proxy]) {
  const firstTokenId = new BN(1);
  const secondTokenId = new BN(2);
  const unknownTokenId = new BN(3);

  const firstAmount = new BN(1000);
  const secondAmount = new BN(2000);
  const firstTotal = new BN(3000);

  const RECEIVER_SINGLE_MAGIC_VALUE = '0x198fb191';
  const RECEIVER_BATCH_MAGIC_VALUE = '0xa3a64bf1';
  //ERC721
  const RECEIVER_MAGIC_VALUE = '0x150b7a02';

  describe('like an ERCSFT', function () {
    describe('balanceOfSemi', function () {
      it('reverts when queried about the zero address', async function () {
        await expectRevert(
          this.token.balanceOfSemi(ZERO_ADDRESS, firstTokenId),
          'SFT: balance query for the zero address',
        );
      });

      context('when accounts don\'t own tokens', function () {
        it('returns zero for given addresses', async function () {
          expect(await this.token.balanceOfSemi(
            firstTokenHolder,
            firstTokenId,
          )).to.be.bignumber.equal('0');

          expect(await this.token.balanceOfSemi(
            secondTokenHolder,
            secondTokenId,
          )).to.be.bignumber.equal('0');

          expect(await this.token.balanceOfSemi(
            firstTokenHolder,
            unknownTokenId,
          )).to.be.bignumber.equal('0');
        });
      });

      context('when accounts own some tokens', function () {
        beforeEach(async function () {
          await this.token.semiTypeMint(firstTokenHolder, firstTokenId, firstAmount, '0x', {
            from: minter,
          });
          await this.token.semiTypeMint(
            secondTokenHolder,
            firstTokenId,
            secondAmount,
            '0x',
            {
              from: minter,
            },
          );
          await this.token.semiTypeMint(
            secondTokenHolder,
            secondTokenId,
            secondAmount,
            '0x',
            {
              from: minter,
            },
          );
        });

        it('returns the amount of tokens owned by the given addresses', async function () {
          expect(await this.token.balanceOfSemi(
            firstTokenHolder,
            firstTokenId,
          )).to.be.bignumber.equal(firstAmount);

          expect(await this.token.balanceOfSemi(
            secondTokenHolder,
            secondTokenId,
          )).to.be.bignumber.equal(secondAmount);

          expect(await this.token.balanceOfSemi(
            firstTokenHolder,
            unknownTokenId,
          )).to.be.bignumber.equal('0');
        });

        it('returns the totalSupply of different token types', async function() {
          expect(await this.token.totalSupplyForSemi(
            firstTokenId)).to.be.bignumber.equal(firstTotal);
          expect(await this.token.totalSupplyForSemi(
            secondTokenId)).to.be.bignumber.equal(secondAmount);
        });
      });
    });

    describe('semiTypeMint', function () {
      beforeEach(async function () {
        ({ logs: this.logs } = await this.token.semiTypeMint(firstTokenHolder, firstTokenId, firstAmount, '0x', {
            from: minter,
          }));
      });

      it('emits a SemiTypeMinted event', function () {
        expectEvent.inLogs(this.logs, 'SemiTypeMinted', {
          _operator: minter,
          _to: firstTokenHolder,
          _tokenType: firstTokenId,
          _value: firstAmount,
        })
      });

      it('emits a SemiTransferSingle event', function () {
        expectEvent.inLogs(this.logs, 'SemiTransferSingle', {
          _operator: minter,
          _from: ZERO_ADDRESS,
          _to: firstTokenHolder,
          _tokenType: firstTokenId,
          _value: firstAmount,
        });
      });
    });


    //setApprovalForSemi TODO
    describe('setApprovalForAllSemi', function () {
      let logs;
      beforeEach(async function () {
        ({ logs } = await this.token.setApprovalForAllSemi(proxy, true, { from: multiTokenHolder }));
      });

      it('sets approval status which can be queried via isApprovedForAllSemi', async function () {
        expect(await this.token.isApprovedForAllSemi(multiTokenHolder, proxy)).to.be.equal(true);
      });

      it('emits an ApprovalForAllSemi log', function () {
        expectEvent.inLogs(logs, 'ApprovalForAllSemi', { _owner: multiTokenHolder, _operator: proxy, _approved: true });
      });

      it('can unset approval for an operator', async function () {
        await this.token.setApprovalForAllSemi(proxy, false, { from: multiTokenHolder });
        expect(await this.token.isApprovedForAllSemi(multiTokenHolder, proxy)).to.be.equal(false);
      });

      it('reverts if attempting to approve self as an operator', async function () {
        await expectRevert(
          this.token.setApprovalForAllSemi(multiTokenHolder, true, { from: multiTokenHolder }),
          'SFT: setting approval status for self',
        );
      });
    });

    describe('semiMint', function () {
        beforeEach(async function () {
          await this.token.semiTypeMint(firstTokenHolder, firstTokenId, firstAmount, '0x', {
            from: minter,
          });
          await this.token.semiTypeMint(
            secondTokenHolder,
            firstTokenId,
            secondAmount,
            '0x',
            {
              from: minter,
            },
          );
          await this.token.semiTypeMint(
            secondTokenHolder,
            secondTokenId,
            secondAmount,
            '0x',
            {
              from: minter,
            },
          );
        });

      it('reverts when minted to the zero address', async function () {
        await expectRevert(
          this.token.semiMint(firstTokenHolder, ZERO_ADDRESS, firstTokenId, '0x', {from: firstTokenHolder}),
          'SFT: semi-mint to the zero address',
        );
      });

      it('reverts when operator is not approved', async function() {
        await expectRevert(
          this.token.semiMint(firstTokenHolder, ZERO_ADDRESS, firstTokenId, '0x', {from: multiTokenHolder}),
          'SFT: caller is not owner nor approved',
        );
      });

      it('reverts when owner has insufficient balance', async function() {
        await expectRevert(
          this.token.semiMint(firstTokenHolder, secondTokenHolder, secondTokenHolder, '0x', {from: firstTokenHolder}),
          'SFT: owner has no sft balance ',
        );
      });

      function semiMintWasSuccessful ({_operator, _from, _tokenType, _fromValue, _toValue, _nftId}) {
          it('debits minted balance from sft-sender', async function() {
              const newBalance = await this.token.balanceOfSemi(_from, _tokenType);
              expect(newBalance).to.be.a.bignumber.equal(_fromValue.addn(-1));
          });

          it('credits minted balance to nft-receiver', async function() {
              const newBalance = await this.token.balanceOf(this.toWhom);
              expect(newBalance).to.be.a.bignumber.equal(_toValue.addn(1));
          });

        it('emits a SemiTransferSingle log to burn from sft', function () {
          expectEvent.inLogs(this.transferLogs, 'SemiTransferSingle', {
            _operator,
            _from,
            _to: ZERO_ADDRESS,
            _tokenType,
            _value: new BN('1'),
          });
        });

        it('emits a Transfer event to mint from nft', async function () {
          expectEvent.inLogs(this.transferLogs, 'Transfer', {
              from: ZERO_ADDRESS, to: this.toWhom, tokenId: _nftId
          });
        });

        it('emits a SemiMinted event for mint from sft to nft', async function() {
            expectEvent.inLogs(this.transferLogs, 'SemiMinted', {
                _operator,
                _from,
                _to: this.toWhom,
                _tokenId: _nftId,
                _tokenType,
            });
        });

      }

      context('when called from firstTokenHolder to recipient', async function() {
          beforeEach(async function() {
              this.toWhom = recipient;
              this.transferReceipt = await this.token.semiMint(firstTokenHolder, recipient, firstTokenId, '0x', {
                  from: firstTokenHolder,
              });
              ({logs: this.transferLogs} = this.transferReceipt);
          });

          semiMintWasSuccessful.call(this, {
            _operator: firstTokenHolder,
            _from: firstTokenHolder,
            _tokenType: firstTokenId,
            _fromValue: firstAmount,
            _toValue: new BN('0'),
            _nftId: new BN('0'),
          });

        context('then called from secondTokenHolder to recipient', async function() {
            beforeEach(async function() {
                this.transferReceipt = await this.token.semiMint(secondTokenHolder, recipient, secondTokenId, '0x', {
                    from: secondTokenHolder,
                });
                ({logs: this.transferLogs} = this.transferReceipt);
            });

            semiMintWasSuccessful.call(this, {
              _operator: secondTokenHolder,
              _from: secondTokenHolder,
              _tokenType: secondTokenId,
              _fromValue: secondAmount,
              _toValue: new BN('1'),
              _nftId: new BN('1'),
            });

        });

      });

      context('when called by an operator from firstTokenHolder to recipient', async function() {
          beforeEach(async function() {
              this.toWhom = recipient;
              await this.token.setApprovalForAllSemi(proxy, true, {from: firstTokenHolder});
              this.transferReceipt = await this.token.semiMint(firstTokenHolder, recipient, firstTokenId, '0x', {
                  from: proxy,
              });
              ({logs: this.transferLogs} = this.transferReceipt);
          });

          semiMintWasSuccessful.call(this, {
            _operator: proxy,
            _from: firstTokenHolder,
            _tokenType: firstTokenId,
            _fromValue: firstAmount,
            _toValue: new BN('0'),
            _nftId: new BN('0'),
          });

        context('then called from operator for secondTokenHolder to recipient', async function() {
            beforeEach(async function() {
              await this.token.setApprovalForAllSemi(proxy, true, {from: secondTokenHolder});
                this.transferReceipt = await this.token.semiMint(secondTokenHolder, recipient, secondTokenId, '0x', {
                    from: proxy,
                });
                ({logs: this.transferLogs} = this.transferReceipt);
            });

            semiMintWasSuccessful.call(this, {
              _operator: proxy,
              _from: secondTokenHolder,
              _tokenType: secondTokenId,
              _fromValue: secondAmount,
              _toValue: new BN('1'),
              _nftId: new BN('1'),
            });

        });

      });

      context('when called from firstTokenHolder to a valid address without data', async function() {
          beforeEach(async function() {
              this.receiver = await ERC721ReceiverMock.new(RECEIVER_MAGIC_VALUE, Error.None);

              this.toWhom = this.receiver.address;
              this.transferReceipt = await this.token.semiMint(firstTokenHolder, this.receiver.address, firstTokenId, '0x', {
                  from: firstTokenHolder,
              });
              ({logs: this.transferLogs} = this.transferReceipt);
          });

          semiMintWasSuccessful.call(this, {
            _operator: firstTokenHolder,
            _from: firstTokenHolder,
            _tokenType: firstTokenId,
            _fromValue: firstAmount,
            _toValue: new BN('0'),
            _nftId: new BN('0'),
          });

          it('calls onERC721Received', async function() {
            await expectEvent.inTransaction(this.transferReceipt.tx, ERC721ReceiverMock, 'Received', {
              operator: firstTokenHolder,
              from: ZERO_ADDRESS,
              tokenId: new BN('0'),
              data: null,
            });
          });

        context('then called from secondTokenHolder to a valid address with data', async function() {
            beforeEach(async function() {
                this.transferReceipt = await this.token.semiMint(secondTokenHolder, this.receiver.address, secondTokenId, '0x0123', {
                    from: secondTokenHolder,
                });
                ({logs: this.transferLogs} = this.transferReceipt);
            });

            semiMintWasSuccessful.call(this, {
              _operator: secondTokenHolder,
              _from: secondTokenHolder,
              _tokenType: secondTokenId,
              _fromValue: secondAmount,
              _toValue: new BN('1'),
              _nftId: new BN('1'),
            });

          it('calls onERC721Received', async function() {
            await expectEvent.inTransaction(this.transferReceipt.tx, ERC721ReceiverMock, 'Received', {
              operator: secondTokenHolder,
              from: ZERO_ADDRESS,
              tokenId: new BN('1'),
              data: '0x0123',
            });
          });

        });

      });

      context('when called from firstTokenHolder to invalid receiver', async function() {
          it('reverts', async function () {
            const invalidReceiver = await ERC721ReceiverMock.new('0x42', Error.RevertWithoutMessage);
            await expectRevert(
              this.token.semiMint(firstTokenHolder, invalidReceiver.address, firstTokenId, '0x',{from: firstTokenHolder}),
              'ERC721: transfer to non ERC721Receiver implementer',
            );
          });
        });

      });

    describe('semiSafeTransferFrom', function () {
      beforeEach(async function () {
        await this.token.semiTypeMint(multiTokenHolder, firstTokenId, firstAmount, '0x', {
          from: minter,
        });
        await this.token.semiTypeMint(
          multiTokenHolder,
          secondTokenId,
          secondAmount,
          '0x',
          {
            from: minter,
          },
        );
      });

      it('reverts when transferring more than balance', async function () {
        await expectRevert(
          this.token.semiSafeTransferFrom(
            multiTokenHolder,
            recipient,
            firstTokenId,
            firstAmount.addn(1),
            '0x',
            { from: multiTokenHolder },
          ),
          'SFT: insufficient balance for transfer',
        );
      });

      it('reverts when transferring to zero address', async function () {
        await expectRevert(
          this.token.semiSafeTransferFrom(
            multiTokenHolder,
            ZERO_ADDRESS,
            firstTokenId,
            firstAmount,
            '0x',
            { from: multiTokenHolder },
          ),
          'SFT: transfer to the zero address',
        );
      });

      function transferWasSuccessful ({ operator, from, id, value }) {
        it('debits transferred balance from sender', async function () {
          const newBalance = await this.token.balanceOfSemi(from, id);
          expect(newBalance).to.be.a.bignumber.equal('0');
        });

        it('credits transferred balance to receiver', async function () {
          const newBalance = await this.token.balanceOfSemi(this.toWhom, id);
          expect(newBalance).to.be.a.bignumber.equal(value);
        });

        it('emits a SemiTransferSingle log', function () {
          expectEvent.inLogs(this.transferLogs, 'SemiTransferSingle', {
            _operator: operator,
            _from: from,
            _to: this.toWhom,
            _tokenType: id,
            _value: value,
          });
        });
      }

      context('when called by the multiTokenHolder', async function () {
        beforeEach(async function () {
          this.toWhom = recipient;
          ({ logs: this.transferLogs } =
            await this.token.semiSafeTransferFrom(multiTokenHolder, recipient, firstTokenId, firstAmount, '0x', {
              from: multiTokenHolder,
            }));
        });

        transferWasSuccessful.call(this, {
          operator: multiTokenHolder,
          from: multiTokenHolder,
          id: firstTokenId,
          value: firstAmount,
        });

        it('preserves existing balances which are not transferred by multiTokenHolder', async function () {
          const balance1 = await this.token.balanceOfSemi(multiTokenHolder, secondTokenId);
          expect(balance1).to.be.a.bignumber.equal(secondAmount);

          const balance2 = await this.token.balanceOfSemi(recipient, secondTokenId);
          expect(balance2).to.be.a.bignumber.equal('0');
        });
      });

      context('when called by an operator on behalf of the multiTokenHolder', function () {
        context('when operator is not approved by multiTokenHolder', function () {
          beforeEach(async function () {
            await this.token.setApprovalForAllSemi(proxy, false, { from: multiTokenHolder });
          });

          it('reverts', async function () {
            await expectRevert(
              this.token.semiSafeTransferFrom(multiTokenHolder, recipient, firstTokenId, firstAmount, '0x', {
                from: proxy,
              }),
              'SFT: caller is not owner nor approved',
            );
          });
        });

        context('when operator is approved by multiTokenHolder', function () {
          beforeEach(async function () {
            this.toWhom = recipient;
            await this.token.setApprovalForAllSemi(proxy, true, { from: multiTokenHolder });
            ({ logs: this.transferLogs } =
              await this.token.semiSafeTransferFrom(multiTokenHolder, recipient, firstTokenId, firstAmount, '0x', {
                from: proxy,
              }));
          });

          transferWasSuccessful.call(this, {
            operator: proxy,
            from: multiTokenHolder,
            id: firstTokenId,
            value: firstAmount,
          });

          it('preserves operator\'s balances not involved in the transfer', async function () {
            const balance1 = await this.token.balanceOfSemi(proxy, firstTokenId);
            expect(balance1).to.be.a.bignumber.equal('0');

            const balance2 = await this.token.balanceOfSemi(proxy, secondTokenId);
            expect(balance2).to.be.a.bignumber.equal('0');
          });
        });
      });

      context('when sending to a valid receiver', function () {
        beforeEach(async function () {
          this.receiver = await ERCSFTReceiverMock.new(
            RECEIVER_SINGLE_MAGIC_VALUE, false,
            RECEIVER_BATCH_MAGIC_VALUE, false,
          );
        });
        
        context('without data', function () {
          beforeEach(async function () {
            this.toWhom = this.receiver.address;
            this.transferReceipt = await this.token.semiSafeTransferFrom(
              multiTokenHolder,
              this.receiver.address,
              firstTokenId,
              firstAmount,
              '0x',
              { from: multiTokenHolder },
            );
            ({ logs: this.transferLogs } = this.transferReceipt);
          });

          transferWasSuccessful.call(this, {
            operator: multiTokenHolder,
            from: multiTokenHolder,
            id: firstTokenId,
            value: firstAmount,
          });

          it('calls onERCSFTReceived', async function () {
            await expectEvent.inTransaction(this.transferReceipt.tx, ERCSFTReceiverMock, 'Received', {
              operator: multiTokenHolder,
              from: multiTokenHolder,
              id: firstTokenId,
              value: firstAmount,
              data: null,
            });
          });
        });

        context('with data', function () {
          const data = '0xf00dd00d';
          beforeEach(async function () {
            this.toWhom = this.receiver.address;
            this.transferReceipt = await this.token.semiSafeTransferFrom(
              multiTokenHolder,
              this.receiver.address,
              firstTokenId,
              firstAmount,
              data,
              { from: multiTokenHolder },
            );
            ({ logs: this.transferLogs } = this.transferReceipt);
          });

          transferWasSuccessful.call(this, {
            operator: multiTokenHolder,
            from: multiTokenHolder,
            id: firstTokenId,
            value: firstAmount,
          });

          it('calls onERCSFTReceived', async function () {
            await expectEvent.inTransaction(this.transferReceipt.tx, ERCSFTReceiverMock, 'Received', {
              operator: multiTokenHolder,
              from: multiTokenHolder,
              id: firstTokenId,
              value: firstAmount,
              data,
            });
          });
        });
      });

      context('to a receiver contract returning unexpected value', function () {
        beforeEach(async function () {
          this.receiver = await ERCSFTReceiverMock.new(
            '0x00c0ffee', false,
            RECEIVER_BATCH_MAGIC_VALUE, false,
          );
        });

        it('reverts', async function () {
          await expectRevert(
            this.token.semiSafeTransferFrom(multiTokenHolder, this.receiver.address, firstTokenId, firstAmount, '0x', {
              from: multiTokenHolder,
            }),
            'ERCSFT: ERCSFTReceiver rejected tokens',
          );
        });
      });

      context('to a receiver contract that reverts', function () {
        beforeEach(async function () {
          this.receiver = await ERCSFTReceiverMock.new(
            RECEIVER_SINGLE_MAGIC_VALUE, true,
            RECEIVER_BATCH_MAGIC_VALUE, false,
          );
        });

        it('reverts', async function () {
          await expectRevert(
            this.token.semiSafeTransferFrom(multiTokenHolder, this.receiver.address, firstTokenId, firstAmount, '0x', {
              from: multiTokenHolder,
            }),
            'ERCSFTReceiverMock: reverting on receive',
          );
        });
      });

      context('to a contract that does not implement the required function', function () {
        it('reverts', async function () {
          const invalidReceiver = this.token;
          await expectRevert.unspecified(
            this.token.semiSafeTransferFrom(multiTokenHolder, invalidReceiver.address, firstTokenId, firstAmount, '0x', {
              from: multiTokenHolder,
            }),
          );
        });
      });
    });

    describe('semiSafeBatchTransferFrom', function () {
      beforeEach(async function () {
        await this.token.semiTypeMint(multiTokenHolder, firstTokenId, firstAmount, '0x', {
          from: minter,
        });
        await this.token.semiTypeMint(
          multiTokenHolder,
          secondTokenId,
          secondAmount,
          '0x',
          {
            from: minter,
          },
        );
      });

      it('reverts when transferring amount more than any of balances', async function () {
        await expectRevert(
          this.token.semiSafeBatchTransferFrom(
            multiTokenHolder, recipient,
            [firstTokenId, secondTokenId],
            [firstAmount, secondAmount.addn(1)],
            '0x', { from: multiTokenHolder },
          ),
          'SFT: insufficient balance for transfer',
        );
      });

      it('reverts when ids array length doesn\'t match amounts array length', async function () {
        await expectRevert(
          this.token.semiSafeBatchTransferFrom(
            multiTokenHolder, recipient,
            [firstTokenId],
            [firstAmount, secondAmount],
            '0x', { from: multiTokenHolder },
          ),
          'SFT: _tokenTypes and _values length mismatch',
        );

        await expectRevert(
          this.token.semiSafeBatchTransferFrom(
            multiTokenHolder, recipient,
            [firstTokenId, secondTokenId],
            [firstAmount],
            '0x', { from: multiTokenHolder },
          ),
          'SFT: _tokenTypes and _values length mismatch',
        );
      });

      it('reverts when transferring to zero address', async function () {
        await expectRevert(
          this.token.semiSafeBatchTransferFrom(
            multiTokenHolder, ZERO_ADDRESS,
            [firstTokenId, secondTokenId],
            [firstAmount, secondAmount],
            '0x', { from: multiTokenHolder },
          ),
          'SFT: transfer to the zero address',
        );
      });

      function batchTransferWasSuccessful ({ operator, from, ids, values }) {
        it('debits transferred balances from sender', async function () {
          for (const id of ids) {
            const newBalance = await this.token.balanceOfSemi(from, id);
            expect(newBalance).to.be.a.bignumber.equal('0');
          }
        });

        it('credits transferred balances to receiver', async function () {
          for (let i = 0; i < ids.length; i++) {
            const newBalance = await this.token.balanceOfSemi(this.toWhom, ids[i]);
            expect(newBalance).to.be.a.bignumber.equal(values[i]);
          }
        });

        it('emits a SemiTransferBatch log', function () {
          expectEvent.inLogs(this.transferLogs, 'SemiTransferBatch', {
            _operator: operator,
            _from: from,
            _to: this.toWhom,
            // ids,
            // values,
          });
        });
      }

      context('when called by the multiTokenHolder', async function () {
        beforeEach(async function () {
          this.toWhom = recipient;
          ({ logs: this.transferLogs } =
            await this.token.semiSafeBatchTransferFrom(
              multiTokenHolder, recipient,
              [firstTokenId, secondTokenId],
              [firstAmount, secondAmount],
              '0x', { from: multiTokenHolder },
            ));
        });

        batchTransferWasSuccessful.call(this, {
          operator: multiTokenHolder,
          from: multiTokenHolder,
          ids: [firstTokenId, secondTokenId],
          values: [firstAmount, secondAmount],
        });
      });

      context('when called by an operator on behalf of the multiTokenHolder', function () {
        context('when operator is not approved by multiTokenHolder', function () {
          beforeEach(async function () {
            await this.token.setApprovalForAllSemi(proxy, false, { from: multiTokenHolder });
          });

          it('reverts', async function () {
            await expectRevert(
              this.token.semiSafeBatchTransferFrom(
                multiTokenHolder, recipient,
                [firstTokenId, secondTokenId],
                [firstAmount, secondAmount],
                '0x', { from: proxy },
              ),
              'SFT: caller is not owner nor approved',
            );
          });
        });

        context('when operator is approved by multiTokenHolder', function () {
          beforeEach(async function () {
            this.toWhom = recipient;
            await this.token.setApprovalForAllSemi(proxy, true, { from: multiTokenHolder });
            ({ logs: this.transferLogs } =
              await this.token.semiSafeBatchTransferFrom(
                multiTokenHolder, recipient,
                [firstTokenId, secondTokenId],
                [firstAmount, secondAmount],
                '0x', { from: proxy },
              ));
          });

          batchTransferWasSuccessful.call(this, {
            operator: proxy,
            from: multiTokenHolder,
            ids: [firstTokenId, secondTokenId],
            values: [firstAmount, secondAmount],
          });

          it('preserves operator\'s balances not involved in the transfer', async function () {
            const balance1 = await this.token.balanceOfSemi(proxy, firstTokenId);
            expect(balance1).to.be.a.bignumber.equal('0');
            const balance2 = await this.token.balanceOfSemi(proxy, secondTokenId);
            expect(balance2).to.be.a.bignumber.equal('0');
          });
        });
      });

      context('when sending to a valid receiver', function () {
        beforeEach(async function () {
          this.receiver = await ERCSFTReceiverMock.new(
            RECEIVER_SINGLE_MAGIC_VALUE, false,
            RECEIVER_BATCH_MAGIC_VALUE, false,
          );
        });

        context('without data', function () {
          beforeEach(async function () {
            this.toWhom = this.receiver.address;
            this.transferReceipt = await this.token.semiSafeBatchTransferFrom(
              multiTokenHolder, this.receiver.address,
              [firstTokenId, secondTokenId],
              [firstAmount, secondAmount],
              '0x', { from: multiTokenHolder },
            );
            ({ logs: this.transferLogs } = this.transferReceipt);
          });

          batchTransferWasSuccessful.call(this, {
            operator: multiTokenHolder,
            from: multiTokenHolder,
            ids: [firstTokenId, secondTokenId],
            values: [firstAmount, secondAmount],
          });

          it('calls onERCSFTBatchReceived', async function () {
            await expectEvent.inTransaction(this.transferReceipt.tx, ERCSFTReceiverMock, 'BatchReceived', {
              operator: multiTokenHolder,
              from: multiTokenHolder,
              // ids: [firstTokenId, secondTokenId],
              // values: [firstAmount, secondAmount],
              data: null,
            });
          });
        });

        context('with data', function () {
          const data = '0xf00dd00d';
          beforeEach(async function () {
            this.toWhom = this.receiver.address;
            this.transferReceipt = await this.token.semiSafeBatchTransferFrom(
              multiTokenHolder, this.receiver.address,
              [firstTokenId, secondTokenId],
              [firstAmount, secondAmount],
              data, { from: multiTokenHolder },
            );
            ({ logs: this.transferLogs } = this.transferReceipt);
          });

          batchTransferWasSuccessful.call(this, {
            operator: multiTokenHolder,
            from: multiTokenHolder,
            ids: [firstTokenId, secondTokenId],
            values: [firstAmount, secondAmount],
          });

          it('calls onERCSFTReceived', async function () {
            await expectEvent.inTransaction(this.transferReceipt.tx, ERCSFTReceiverMock, 'BatchReceived', {
              operator: multiTokenHolder,
              from: multiTokenHolder,
              // ids: [firstTokenId, secondTokenId],
              // values: [firstAmount, secondAmount],
              data,
            });
          });
        });
      });

      context('to a receiver contract returning unexpected value', function () {
        beforeEach(async function () {
          this.receiver = await ERCSFTReceiverMock.new(
            RECEIVER_SINGLE_MAGIC_VALUE, false,
            RECEIVER_SINGLE_MAGIC_VALUE, false,
          );
        });

        it('reverts', async function () {
          await expectRevert(
            this.token.semiSafeBatchTransferFrom(
              multiTokenHolder, this.receiver.address,
              [firstTokenId, secondTokenId],
              [firstAmount, secondAmount],
              '0x', { from: multiTokenHolder },
            ),
            'SFT: ERCSFTReceiver rejected tokens',
          );
        });
      });

      context('to a receiver contract that reverts', function () {
        beforeEach(async function () {
          this.receiver = await ERCSFTReceiverMock.new(
            RECEIVER_SINGLE_MAGIC_VALUE, false,
            RECEIVER_BATCH_MAGIC_VALUE, true,
          );
        });

        it('reverts', async function () {
          await expectRevert(
            this.token.semiSafeBatchTransferFrom(
              multiTokenHolder, this.receiver.address,
              [firstTokenId, secondTokenId],
              [firstAmount, secondAmount],
              '0x', { from: multiTokenHolder },
            ),
            'ERCSFTReceiverMock: reverting on batch receive',
          );
        });
      });

      context('to a receiver contract that reverts only on single transfers', function () {
        beforeEach(async function () {
          this.receiver = await ERCSFTReceiverMock.new(
            RECEIVER_SINGLE_MAGIC_VALUE, true,
            RECEIVER_BATCH_MAGIC_VALUE, false,
          );

          this.toWhom = this.receiver.address;
          this.transferReceipt = await this.token.semiSafeBatchTransferFrom(
            multiTokenHolder, this.receiver.address,
            [firstTokenId, secondTokenId],
            [firstAmount, secondAmount],
            '0x', { from: multiTokenHolder },
          );
          ({ logs: this.transferLogs } = this.transferReceipt);
        });

        batchTransferWasSuccessful.call(this, {
          operator: multiTokenHolder,
          from: multiTokenHolder,
          ids: [firstTokenId, secondTokenId],
          values: [firstAmount, secondAmount],
        });

        it('calls onERCSFTBatchReceived', async function () {
          await expectEvent.inTransaction(this.transferReceipt.tx, ERCSFTReceiverMock, 'BatchReceived', {
            operator: multiTokenHolder,
            from: multiTokenHolder,
            // ids: [firstTokenId, secondTokenId],
            // values: [firstAmount, secondAmount],
            data: null,
          });
        });
      });

      //context('to a contract that does not implement the required function', function () {
      //  it('reverts', async function () {
      //    const invalidReceiver = this.token;
      //    await expectRevert.unspecified(
      //      this.token.semiSafeBatchTransferFrom(
      //        multiTokenHolder, invalidReceiver.address,
      //        [firstTokenId, secondTokenId],
      //        [firstAmount, secondAmount],
      //        '0x', { from: multiTokenHolder },
      //      ),
      //    );
      //  });
      //});
    });

    shouldSupportInterfaces(['ERC165', 'ERC721', 'ERCSFT']);
  });
}

function shouldBehaveLikeERCSFTMetadata([operator, tokenHolder]) {

  const initialURI = 'https://token-cdn-domain/{id}.json';

  describe('SFTMetadata', function () {
    const firstTokenID = new BN('42');
    const secondTokenID = new BN('1337');

    it('expect empty URI before initialization', async function() {
        expect(await this.token.semiURI(firstTokenID)).to.be.equal('');
        expect(await this.token.semiURI(secondTokenID)).to.be.equal('');
    });

    context('set URI', function() {
        beforeEach(async function() {
            await this.token.setSemiBaseURI(initialURI);
        });
        it('expect base URI for all token types', async function() {
            expect(await this.token.semiURI(firstTokenID)).to.be.equal(initialURI);
            expect(await this.token.semiURI(secondTokenID)).to.be.equal(initialURI);
        });

        context('set URI for firstTokenID', function() {
            beforeEach(async function() {
                await this.token.setSemiURI(firstTokenID, "firstURI");
            });
            it('expect different URIs', async function() {
                expect(await this.token.semiURI(firstTokenID)).to.be.equal("firstURI");
                expect(await this.token.semiURI(secondTokenID)).to.be.equal(initialURI);
            });
        });
    });

    context('set semiName', function() {
        it('expect empty name for all token types', async function() {
            expect(await this.token.semiName(firstTokenID)).to.be.equal('');
            expect(await this.token.semiName(secondTokenID)).to.be.equal('');
        });

        context('set name for firstTokenID', function() {
            beforeEach(async function() {
                await this.token.setSemiName(firstTokenID, "firstTokenName");
            });

            it("test name after setting", async function() {
            expect(await this.token.semiName(firstTokenID)).to.be.equal("firstTokenName");
            expect(await this.token.semiName(secondTokenID)).to.be.equal('');
            })
        });
    });

    context('set semiSymbol', function() {
        it('expect empty symbol for all token types', async function() {
            expect(await this.token.semiSymbol(firstTokenID)).to.be.equal('');
            expect(await this.token.semiSymbol(secondTokenID)).to.be.equal('');
        });

        context('set symbol for secondTokenID', function() {
            beforeEach(async function() {
                await this.token.setSemiSymbol(secondTokenID, "secondTokenSymbol");
            });

            it("test symbol after setting", async function() {
            expect(await this.token.semiSymbol(secondTokenID)).to.be.equal("secondTokenSymbol");
            expect(await this.token.semiSymbol(firstTokenID)).to.be.equal('');
            })
        });
    });

  });
}

module.exports = {
  shouldBehaveLikeERCSFT,
  shouldBehaveLikeERCSFTMetadata,
};

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useSigner, useAccount } from 'wagmi';
import libTokenABI from '../abi/Lib.json';
import bookLibraryABI from '../abi/BookLibraryWithToken.json';
import Button from '../components/ui/Button';

const Wallet = () => {
  const { data: signer } = useSigner();
  const { address } = useAccount();

  const [isLoading, setIsLoading] = useState(false);
  const [libraryTokenContract, setLibraryTokenContract] = useState();
  const [bookLibraryContract, setBookLibraryContract] = useState();
  /*   const [signedMessage, setSignedMessage] = useState();
  const [hashedMessage, setHashedMessage] = useState();
  const [tokenReceiver, setTokenReceiver] = useState(); */

  useEffect(() => {
    if (signer) {
      const _libraryTokenWithPermitsContract = new ethers.Contract(
        '0x5EeA5bC9f3c1F63136B7a194E0aaA6246043c2CB',
        libTokenABI.abi,
        signer,
      );

      setLibraryTokenContract(_libraryTokenWithPermitsContract);

      const _bookLibraryContract = new ethers.Contract(
        '0xe57e6cdb3d9605c261B58B45b78998F2E253e120',
        bookLibraryABI.abi,
        signer,
      );

      setBookLibraryContract(_bookLibraryContract);
    }
  }, [signer]);

  /*const getPermitSignature = async (signer, token, spender, value, deadline) => {
       const [nonce, name, version, chainId] = await Promise.all([
      token.nonces(signer.address),
      token.name(),
      '1',
      signer.getChainId(),
    ]);
 
    const nonce = await libraryTokenContract.nonces(address); // Our Token Contract Nonces
    const name = await libraryTokenContract.name();
    const version = '1';
    const chainId = await signer.getChainId();

    console.log('signing data');
    const signedData = await signer._signTypedData(
      {
        name,
        version,
        chainId,
        verifyingContract: token.address,
      },
      {
        Permit: [
          {
            name: 'owner',
            type: 'address',
          },
          {
            name: 'spender',
            type: 'address',
          },
          {
            name: 'value',
            type: 'uint256',
          },
          {
            name: 'nonce',
            type: 'uint256',
          },
          {
            name: 'deadline',
            type: 'uint256',
          },
        ],
      },
      {
        owner: signer.address,
        spender,
        value,
        nonce,
        deadline,
      },
    );

    console.log('signed data', signedData);
    console.log('splitting signature');
    return ethers.utils.splitSignature(signedData);
  };

  const handleBorrowWithPermit = async () => {
    const deadline = +new Date() + 60 * 60; // Permit with deadline which the permit is valid
    const amount = ethers.utils.parseEther('0.1'); // Value to approve for the spender to use

    // generating signature
    const { v, r, s } = await getPermitSignature(
      signer,
      libraryTokenContract,
      bookLibraryContract.address,
      amount,
      deadline,
    );

    console.log('v', v);

    const bookKey = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('100 years of solitude'));

    const borrowTx = await bookLibraryContract.borrowBookWithPermit(
      bookKey,
      amount,
      deadline,
      v,
      r,
      s,
    );
    console.log('Borrow with permit transaction created');
    await borrowTx.wait();
    console.log('Borrow with permit transaction completed');
  };*/

  const handleApproveWithPermitWagmi = async () => {
    setIsLoading(true);
    try {
      // Account here is the wallete address
      const nonce = await libraryTokenContract.nonces(address); // Our Token Contract Nonces
      const deadline = +new Date() + 60 * 60; // Permit with deadline which the permit is valid
      const wrapValue = ethers.utils.parseEther('0.1'); // Value to approve for the spender to use

      const EIP712Domain = [
        // array of objects -> properties from the contract and the types of them ircwithPermit
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'verifyingContract', type: 'address' },
      ];

      const domain = {
        name: await libraryTokenContract.name(),
        version: '1',
        verifyingContract: libraryTokenContract.address,
      };

      const Permit = [
        // array of objects -> properties from erc20withpermit
        { name: 'owner', type: 'address' },
        { name: 'spender', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' },
      ];

      const message = {
        owner: address, // Wallet Address
        spender: bookLibraryContract.address, // **This is the address of the spender whe want to give permit to.**
        value: wrapValue.toString(),
        nonce: nonce.toHexString(),
        deadline,
      };

      const data = JSON.stringify({
        types: {
          EIP712Domain,
          Permit,
        },
        domain,
        primaryType: 'Permit',
        message,
      });

      console.log('signing with wagmi lib');
      const signatureLikeWagmi = await signer._signTypedData(domain, { Permit }, message);
      console.log('signature', signatureLikeWagmi);

      const signature = await ethers.utils.splitSignature(signatureLikeWagmi);

      const bookKey = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('100 years of solitude'));

      console.log('Split signature', signature);

      const borrowTx = await bookLibraryContract.borrowBookWithPermit(
        bookKey,
        wrapValue,
        deadline,
        signature.v,
        signature.r,
        signature.s,
      );
      console.log('Borrow with permit transaction created');
      await borrowTx.wait();
      console.log('Borrow with permit transaction completed');
    } catch (e) {
      console.log('something went wrong');
      console.log('e', e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container my-5 my-lg-10">
      <div className="row">
        <div className="col-6">
          <h1 className="heading-medium mb-5">Contract interaction via permits</h1>
          <div className="d-flex align-items-center">
            <div className="ms-3">
              <Button loading={isLoading} onClick={handleApproveWithPermitWagmi} type="primary">
                Borrow book using permits
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Wallet;

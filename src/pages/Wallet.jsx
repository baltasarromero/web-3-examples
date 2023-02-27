import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useSigner, useAccount } from 'wagmi';
import libTokenABI from '../abi/Lib.json';
import bookLibraryABI from '../abi/BookLibraryWithToken.json';
import Button from '../components/ui/Button';
import { MetaMaskConnector } from 'wagmi/connectors/metaMask';
import { sepolia } from 'wagmi/chains';

const Wallet = () => {
  const { data: signer } = useSigner();
  const { address } = useAccount();
  const connector = new MetaMaskConnector({
    chains: [sepolia],
  });

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
        '0x202bbcdeDe703E3d7AC6fE5507F24BDB746f36fE',
        bookLibraryABI.abi,
        signer,
      );

      setBookLibraryContract(_bookLibraryContract); 

    }
  }, [signer]);

/*   const handleSingMessage = async () => {
    setIsLoading(true);

    try {
      const _messageHash = ethers.utils.solidityKeccak256(['string'], ["Yes, i Signed the message"]) 
      setHashedMessage(_messageHash);
      const _arrayfiedHash = ethers.utils.arrayify(_messageHash);
      const _signedMessage = await signer.signMessage(_arrayfiedHash);
      console.log("this is the signed message", _signedMessage);
      setSignedMessage(_signedMessage);
      const _signerAddress =  await signer.getAddress();
      console.log("this is the signer", _signerAddress);
      setTokenReceiver(_signerAddress);
    } catch (e) {
      console.log('e', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWrapTokenWithSignedMessage = async () => {
      setIsLoading(true);
      try {
        console.log("wrapping with signed message");
        console.log("signed message is ", signedMessage);
        console.log("hashed message is ", hashedMessage);
        const sig = ethers.utils.splitSignature(signedMessage);
        console.log(`signature parts are v: ${sig.v} r: ${sig.r} s: ${sig.s}`);
        console.log("This is the token receiver", tokenReceiver);

        const wrapValue = ethers.utils.parseEther("0.0003");
        console.log("wrapperContract is", wrapperContract.address);
        
        const wrapTx = await wrapperContract.wrapWithSignature(hashedMessage, sig.v, sig.r, sig.s, tokenReceiver,  {value: wrapValue})
        console.log("transaction created");
        await wrapTx.wait();
        console.log("transaction complete");
      } catch (e) {
        console.log("something went wrong");
        console.log('e', e);
      } finally {
        setIsLoading(false);
      }
  };
*/

  const handleAttemptToApprove = async () => {
    setIsLoading(true);
    try {
      // Account here is the wallet address
      const nonce = (await libraryTokenContract.nonces(address)); // Our Token Contract Nonces
      const deadline = + new Date() + 60 * 60; // Permit with deadline which the permit is valid
      const wrapValue = ethers.utils.parseEther('0.1'); // Value to approve for the spender to use

      const EIP712Domain = [ // array of objects -> properties from the contract and the types of them ircwithPermit
          { name: 'name', type: 'string' },
          { name: 'version', type: 'string' },
          { name: 'verifyingContract', type: 'address' }
      ];

      const domain = {
          name: await libraryTokenContract.name(),
          version: '1',
          verifyingContract: libraryTokenContract.address
      };

      console.log("this is the domain ", domain);

      const Permit = [ // array of objects -> properties from erc20withpermit
          { name: 'owner', type: 'address' },
          { name: 'spender', type: 'address' },
          { name: 'value', type: 'uint256' },
          { name: 'nonce', type: 'uint256' },
          { name: 'deadline', type: 'uint256' }
      ];

      const message = {
          owner: address, // Wallet Address
          spender: "0xbc4d110Ee25C9e1cCCA254eD68f1379fe4DB7F7b", // **This is the address of the spender whe want to give permit to.**
          value: wrapValue.toString(),
          nonce: nonce.toHexString(),
          deadline
      };

      const data = JSON.stringify({
          types: {
              EIP712Domain,
              Permit
          },
          domain,
          primaryType: 'Permit',
          message
      });

      console.log("this is the data to be sent", data);
      const signatureLike = await signer.signMessage('eth_signTypedData_v4', [address, data]); // Library is a provider.
      const signature = await ethers.utils.splitSignature(signatureLike);

      const preparedSignature = {
          v: signature.v,
          r: signature.r,
          s: signature.s,
          deadline
      };

      console.log("signature like: ", preparedSignature);
      // borrow the book using the signed message
      console.log("this is the book library addreSs", bookLibraryContract.address);

      const numberOfBooks = await bookLibraryContract.getNumberOfBooks();
      console.log("the number of books in the library is", numberOfBooks.toString());
      console.log("these are the parameters that will be sent");
      const bookKey = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("100 years of solitude"));
      console.log("book id", bookKey);
      console.log("value", 1000001);
      console.log("deadline", preparedSignature.deadline);  
      console.log("v", preparedSignature.v);
      console.log("r", preparedSignature.r);
      console.log("s", preparedSignature.s);

      const borrowTx = await bookLibraryContract.borrowBook(ethers.utils.formatBytes32String("100 years of solitude"), 1000001, preparedSignature.deadline, preparedSignature.v, preparedSignature.r, preparedSignature.s);
      console.log("borrow book transaction created");
      await borrowTx.wait();
      console.log("borrow book transaction complete"); 

      return preparedSignature;    

    } catch (e) {
      console.log("something went wrong");
      console.log('e', e);
    } finally {
      setIsLoading(false);
    }
  };


  /* const handleAttemptToApprove = async () => {
    const preparedSignature = await prepareSignature();
    console.log("this is the prepared signature", prepareSignature);
    // borrow the book using the signed message
    const borrowTx = await bookLibraryContract.borrowBook(ethers.utils.formatBytes32String("100 years of solitude"), 1000001, preparedSignature.deadline, preparedSignature.v, preparedSignature.r, preparedSignature.s); // Our Token Contract Nonces
    console.log("borrow book transaction created");
    await borrowTx.wait();
    console.log("borrow book transaction complete");
  }; */

  return (
    <div className="container my-5 my-lg-10">
      <div className="row">
        <div className="col-6">
          <h1 className="heading-medium mb-5">Contract interaction via permits</h1>
          <div className="d-flex align-items-center">
            <div className="ms-3">
              <Button loading={isLoading} onClick={handleAttemptToApprove} type="primary">
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

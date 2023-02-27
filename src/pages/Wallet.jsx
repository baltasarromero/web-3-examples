import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useSigner } from 'wagmi';
import wrapperABI from '../abi/ETHWrapper.json';
import Button from '../components/ui/Button';

const Wallet = () => {
  const { data: signer } = useSigner();

  const [isLoading, setIsLoading] = useState(false);
  const [wrapperContract, setWrapperContract] = useState();
  const [signedMessage, setSignedMessage] = useState();
  const [hashedMessage, setHashedMessage] = useState();
  const [tokenReceiver, setTokenReceiver] = useState();
  

  useEffect(() => {
    if (signer) {
      const _wrapperContract = new ethers.Contract(
        '0xcE6f72BbFa18B3c2eaDaF60C782c9699e40d44c0',
        wrapperABI.abi,
        signer,
      );

      setWrapperContract(_wrapperContract);

    }
  }, [signer]);

  const handleSingMessage = async () => {
    setIsLoading(true);

    try {
      const _messageHash = ethers.utils.solidityKeccak256(['string'], ["Yes, i Signed the message"]) 
      setHashedMessage(_messageHash);
      const _arrayfiedHash = ethers.utils.arrayify(_messageHash);
      console.log("arrayified message ", _arrayfiedHash);
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

  return (
    <div className="container my-5 my-lg-10">
      <div className="row">
        <div className="col-6">
          <h1 className="heading-medium mb-5">Wrap using signed message</h1>
          <div className="d-flex align-items-center">
            <div className="ms-3">
              <Button loading={isLoading} onClick={handleSingMessage} type="primary">
                Sign Message
              </Button>
            </div>
            <div className="ms-3">
              <Button loading={isLoading} onClick={handleWrapTokenWithSignedMessage} type="primary">
                Wrap With Signed Message
              </Button>
            </div>
          </div>
        </div>
      </div>

    </div>
    
  );
};

export default Wallet;

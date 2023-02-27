import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useSigner, useAccount } from 'wagmi';
import walletABI from '../abi/Wallet.json';
import wrapperABI from '../abi/ETHWrapper.json';
import Button from '../components/ui/Button';

const Wallet = () => {
  const { data: signer } = useSigner();
  const { address } = useAccount();

  const [contract, setContract] = useState();
  const [userBalance, setUserBalance] = useState('0');
  const [amount, setAmount] = useState('0');
  const [isLoading, setIsLoading] = useState(false);
  const [wrapperContract, setWrapperContract] = useState();
  const [signedMessage, setSignedMessage] = useState();
  const [hashedMessage, setHashedMessage] = useState();
  const [tokenReceiver, setTokenReceiver] = useState();
  

  const handleAmountChange = e => {
    const { value } = e.target;
    setAmount(value);
  };

  useEffect(() => {
    if (signer) {
       const _contract = new ethers.Contract(
        '0x9D9955688649A7071a032DBf1e565023E6775690',
        walletABI,
        signer,
      );

     
      setContract(_contract); 

      const _wrapperContract = new ethers.Contract(
        '0x54713b609D83A5cb7162A453566f31D71aA7D994',
        wrapperABI.abi,
        signer,
      );

      setWrapperContract(_wrapperContract);

    }
  }, [signer]);

  const getBalance = useCallback(async () => {
    const result = await contract.userBalance(address);
    const balanceFormatted = ethers.utils.formatEther(result);
    setUserBalance(balanceFormatted);
  }, [contract, address]);

  useEffect(() => {
    contract && getBalance();
  }, [contract, getBalance]);

  const handleDepositButtonClick = async () => {
    setIsLoading(true);

    try {
      const tx = await contract.deposit({ value: ethers.utils.parseEther(amount) });
      await tx.wait();

      setAmount('0');

      await getBalance();
    } catch (e) {
      console.log('e', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSingMessage = async () => {
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

  const handleWithdrawButtonClick = async () => {
    setIsLoading(true);

    try {
      const tx = await contract.withdraw();
      await tx.wait();

      await getBalance();
    } catch (e) {
      console.log('e', e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container my-5 my-lg-10">
      <div className="row">
        <div className="col-6">
          <h1 className="heading-medium mb-5">Basic contract interaction</h1>
          <div className="d-flex align-items-center">
            <div>
              <input
                type="text"
                className="form-control"
                value={amount}
                onChange={handleAmountChange}
              />
            </div>
            <div className="ms-3">
              <Button loading={isLoading} onClick={handleDepositButtonClick} type="primary">
                Deposit
              </Button>
            </div>
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
      <div className="mt-5">{userBalance} ETH</div>
      {Number(userBalance) > 0 ? (
        <div className="mt-2">
          <Button loading={isLoading} onClick={handleWithdrawButtonClick} type="primary">
            Withdraw
          </Button>
        </div>
      ) : null}
    </div>
    
  );
};

export default Wallet;

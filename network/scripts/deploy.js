const main = async () => {
    const domainContractFactory = await hre.ethers.getContractFactory('Domain');
    const domainContract = await domainContractFactory.deploy("tech");
    await domainContract.deployed();
  
    console.log("Contract deployed to:", domainContract.address);
  
    let txn = await domainContract.register("devblc",  {value: hre.ethers.utils.parseEther('0.5')});
    await txn.wait();
    console.log("Minted domain");
  
    txn = await domainContract.setRecord("devblc", "https://github.com/dev-blc");
    await txn.wait();
    console.log("Set record");
  
    const address = await domainContract.getDomainDetails("devblc");
    console.log("Owner of domain : ", address);
  
    const balance = await hre.ethers.provider.getBalance(domainContract.address);
    console.log("Contract balance:", hre.ethers.utils.formatEther(balance));
  }
  
  const runMain = async () => {
    try {
      await main();
      process.exit(0);
    } catch (error) {
      console.log(error);
      process.exit(1);
    }
  };
  
  runMain();
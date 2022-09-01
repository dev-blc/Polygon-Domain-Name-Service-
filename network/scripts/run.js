const main = async () => {
    const domainContractFactory = await hre.ethers.getContractFactory('Domain');
    const domainContract = await domainContractFactory.deploy("tech");
    await domainContract.deployed() ;
    
    const [owner,user] = await hre.ethers.getSigners();
    
    console.log("Domain Smartcontract Deployed to:", domainContract.address);
    console.log("Domain Smartcontract Deployed by:", owner.address);

    let tx = await domainContract.register("testDomain",{value: hre.ethers.utils.parseEther('1')});
    await tx.wait();

    // const domainOwner = await domainContract.getDomainDetails("testDomain");
    // console.log("Domain Owner -> ", domainOwner);

    
    let balance = await hre.ethers.provider.getBalance(domainContract.address);
    console.log("Contract Balance",hre.ethers.utils.formatEther(balance));

    try{
        let txn = await domainContract.connect(user).withdraw();
        await txn.wait();
    } catch(error){
        console.log(" wait a minute \n who are you?!\n Only owner can withdraw funds");
    }

    let ownerBalance = await hre.ethers.provider.getBalance(owner.address);
    console.log("Balance of owner before withdrawal:", hre.ethers.utils.formatEther(ownerBalance));

    let txn = await domainContract.connect(owner).withdraw();
    await txn.wait();

    ownerBalance = await hre.ethers.provider.getBalance(owner.address);
    console.log("Balance of after before withdrawal:", hre.ethers.utils.formatEther(ownerBalance));

    balance = await hre.ethers.provider.getBalance(domainContract.address);
    console.log("Contract Balance",hre.ethers.utils.formatEther(balance));
};

const runMain = async () => {
    try{
        await main();
        process.exit(0);
    } catch(err){
        console.log(err);
        process.exit(1);
    }
};

runMain();

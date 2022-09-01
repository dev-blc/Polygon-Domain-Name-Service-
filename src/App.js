import React, {useEffect, useState} from 'react';
import './styles/App.css';
import {ethers} from "ethers";
import contractAbi from "./utils/contractABI.json";
import polygonLogo from "./assets/polygonlogo.png";
import ethLogo from "./assets/ethlogo.png";
import {networks} from "./utils/networks";

const tld = '.tech';
const domainContractAddress = '0xD440c392e1E2bFc638bf420bFc1183064054FdD8';

const App = () => {	
	
	const [currentAccount, setCurrentAccount] = useState('');
	const [domain, setDomain] = useState('');
	const [record, setRecord] = useState('');
	const [network, setNetwork] = useState('');
	const [editing, setEditing] = useState(false);
 	const [loading, setLoading] = useState(false);
	const [mints, setMints] = useState([]);


	const connectWallet = async() => {
		try{
			const{ethereum} = window;
			if(!ethereum){
				alert("Install MetaMask -- https://metamask.io/");
				return;
			}
			const accounts = await ethereum.request({method: 'eth_requestAccounts'});
			console.log("Connected to - ",accounts[0]);
			setCurrentAccount(accounts[0]);
		}catch(err){
			console.log("!!!Error!!!-",err);
		}
	}
	
	const checkWalletConnected = async ()=>{
		const{ethereum} = window;

		if(!ethereum) {
			console.log("Please install metamask!!");
			return;
		}
		else{
			console.log("Available ethereum object - ", ethereum);
		}

		const accounts = await ethereum.request({method: 'eth_accounts'});
		if (accounts.length !== 0) {
			const account = accounts[0];
			console.log('Found an authorized account:', account);
			setCurrentAccount(account);
		} else {
			console.log('No authorized account found');
		}

		const chainId = await ethereum.request({method: 'eth_chainId'});
		setNetwork(networks[chainId]);
		ethereum.on('Chain Changed',handleChainChanged);
		function handleChainChanged(_chainId) {
			window.location.reload();
		}
	}

	const mintDomain = async () => {
		if(!domain) {	return	}
		if(domain.length < 3 ) {
			alert('Domain name must be atleast 3 charcters long!!!!');
			return;
		}
		const price = ((domain.length === 3) ? '0.5' : ((domain.length === 4) ? '0.3' : '0.1'));
		console.log("Minting ", domain, ".tech at a price of ", price, " MATIC.");

		try {
			const {ethereum} = window;
			if(ethereum) {
				const provider = new ethers.providers.Web3Provider(ethereum);
				const signer = provider.getSigner();
				const contract = new ethers.Contract(domainContractAddress, contractAbi.abi, signer);
				let tx = await contract.register(domain,{value: ethers.utils.parseEther(price)});
				const receipt = await tx.wait();
				if(receipt.status === 1){
					console.log("Domain Minted!! https://mumbai.polygonscan.com/tx/"+tx.hash);
					tx = await contract.setRecord(domain, record);
					await tx.wait();
					console.log("Record set! https://mumbai.polygonscan.com/tx/"+tx.hash);
					setTimeout(() => {
						fetchMints();
					},2000)
					setRecord('');
					setDomain('');
				}
				else{
					alert("Transaction failed!!!!");
				}
			}
		} catch (error) {
			console.log("ERROR!"+error);
		}

	}

	const fetchMints = async () => {
		try {
		  const { ethereum } = window;
		  if (ethereum) {
			// You know all this
			const provider = new ethers.providers.Web3Provider(ethereum);
			const signer = provider.getSigner();
			const contract = new ethers.Contract(domainContractAddress, contractAbi.abi, signer);
			  
			// Get all the domain names from our contract
			const names = await contract.getAllNames();
			  
			// For each name, get the record and the address
			const mintRecords = await Promise.all(names.map(async (name) => {
			const mintRecord = await contract.records(name);
			const owner = await contract.domains(name);
			return {
			  id: names.indexOf(name),
			  name: name,
			  record: mintRecord,
			  owner: owner,
			};
		  }));
	  
		  console.log("MINTS FETCHED ", mintRecords);
		  setMints(mintRecords);
		  }
		} catch(error){
		  console.log(error);
		}
	  }
	const renderNotConnected = () => (
		<div className="connect-wallet-container">
			<img src="https://media4.giphy.com/media/c6LsXARy3A9PxbmgAj/giphy.gif?cid=ecf05e47sbqzyh1dycgda9zzghar7lspr5p3hvr4qw4qc2mp&rid=giphy.gif&ct=g" alt="Ninja gif" />
				<button onClick={connectWallet} className="cta-button connect-wallet-button" >
					Connect Wallet
				</button>
    	</div>
	);

	const renderInputForm = () => {
		if (network !== 'Polygon Mumbai Testnet') {
			return (
			<div className="connect-wallet-container">
				<p>Please switch to the Polygon Mumbai Testnet</p>
				<button className='cta-button mint-button' onClick={switchNetwork}>Click here to switch</button>
			</div>
			);
		}
		return(
			<div className="form-container">
				<div className="first-row">
					<input
						type="text"
						value={domain}
						placeholder='domain name'
						onChange={e => setDomain(e.target.value)}
					/>
					<p className='tld'> {tld} </p>
				</div>

				<input
					type="text"
					value={record}
					placeholder='what does your domain hold'
					onChange={e => setRecord(e.target.value)}
				/>
				{ editing ? (
					<div className="button-container">
					
					<button className='cta-button mint-button' disabled={loading} onClick={updateDomain}>
						Set record
					</button>  
				
					<button className='cta-button mint-button' onClick={() => {setEditing(false)}}>
						Cancel
					</button>  
					</div>
				) : (
					// If editing is not true, the mint button will be returned instead
					<button className='cta-button mint-button' disabled={loading} onClick={mintDomain}>
					Mint
					</button>  
				)}
				

			</div>
		);
	}

	const renderMints = () => {
		if (currentAccount && mints.length > 0) {
		  return (
			<div className="mint-container">
			  <p className="subtitle"> Recently minted domains!</p>
			  <div className="mint-list">
				{ mints.map((mint, index) => {
				  return (
					<div className="mint-item" key={index}>
					  <div className='mint-row'>
						<a className="link" href={`https://testnets.opensea.io/assets/mumbai/${domainContractAddress}/${mint.id}`} target="_blank" rel="noopener noreferrer">
						  <p className="underlined">{' '}{mint.name}{tld}{' '}</p>
						</a>
						{/* If mint.owner is currentAccount, add an "edit" button*/}
						{ mint.owner.toLowerCase() === currentAccount.toLowerCase() ?
						  <button className="edit-button" onClick={() => editRecord(mint.name)}>
							<img className="edit-icon" src="https://img.icons8.com/metro/26/000000/pencil.png" alt="Edit button" />
						  </button>
						  :
						  null
						}
					  </div>
				<p> {mint.record} </p>
			  </div>)
			  })}
			</div>
		  </div>);
		}
	};
	  
	const editRecord = (name) => {
		console.log("Editing record for", name);
		setEditing(true);
		setDomain(name);
	}

	const switchNetwork = async () => {
		if (window.ethereum) {
		  try {
			// Try to switch to the Mumbai testnet
			await window.ethereum.request({
			  method: 'wallet_switchEthereumChain',
			  params: [{ chainId: '0x13881' }], // Check networks.js for hexadecimal network ids
			});
		  } catch (error) {
			// This error code means that the chain we want has not been added to MetaMask
			// In this case we ask the user to add it to their MetaMask
			if (error.code === 4902) {
			  try {
				await window.ethereum.request({
				  method: 'wallet_addEthereumChain',
				  params: [
					{	
					  chainId: '0x13881',
					  chainName: 'Polygon Mumbai Testnet',
					  rpcUrls: ['https://rpc-mumbai.maticvigil.com/'],
					  nativeCurrency: {
						  name: "Mumbai Matic",
						  symbol: "MATIC",
						  decimals: 18
					  },
					  blockExplorerUrls: ["https://mumbai.polygonscan.com/"]
					},
				  ],
				});
			  } catch (error) {
				console.log(error);
			  }
			}
			console.log(error);
		  }
		} else {
		  // If window.ethereum is not found then MetaMask is not installed
		  alert('MetaMask is not installed. Please install it to use this app: https://metamask.io/download.html');
		} 
	  }

	const updateDomain = async () => {
		if (!record || !domain) { return }
		setLoading(true);
		console.log("Updating domain", domain, "with record", record);
		  try {
		  const { ethereum } = window;
		  if (ethereum) {
			const provider = new ethers.providers.Web3Provider(ethereum);
			const signer = provider.getSigner();
			const contract = new ethers.Contract(domainContractAddress, contractAbi.abi, signer);
	  
			let tx = await contract.setRecord(domain, record);
			await tx.wait();
			console.log("Record set https://mumbai.polygonscan.com/tx/"+tx.hash);
	  
			fetchMints();
			setRecord('');
			setDomain('');
		  }
		  } catch(error) {
			console.log(error);
		  }
		setLoading(false);
	  }

	useEffect(() => {
		if (network === 'Polygon Mumbai Testnet') {
		  fetchMints();
		}
	}, [currentAccount, network]);

	useEffect(()=>{
		checkWalletConnected();
	},[]);
	return (
			<div className="App">
				<div className="container">

					<div className="header-container">
						<header>
							<div className="left">
								<p className="title">/> Tech Name Service 👨🏽‍💻 (.tech)</p>
								<p className="subtitle">Your .tech domain on Polygon chain. </p>
								<p className="subtitle">Host your projects and GitHub profiles and repos </p>
							</div>
							<div className="right">
      							<img alt="Network logo" className="logo" src={ network.includes("Polygon") ? polygonLogo : ethLogo} />
      							{ currentAccount ? <p> Wallet: {currentAccount.slice(0, 6)}...{currentAccount.slice(-4)} </p> : <p> Not connected </p> }
    						</div>
						</header>
					</div>

					{!currentAccount && renderNotConnected()}
					{currentAccount && renderInputForm()}
					{mints && renderMints()}
				</div>
			</div>
		);
}

export default App;

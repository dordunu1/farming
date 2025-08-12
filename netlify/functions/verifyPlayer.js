const { ethers } = require('ethers');
const { getAddress } = require('ethers');

const ABI = require('../../functions/RiseFarmingABI.json').abi;

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  // Handle preflight request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers
    };
  }

  try {
    // Extract address from query parameters
    const { address } = event.queryStringParameters || {};
    
    if (!address) {
      return {
        statusCode: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          error: 'Missing wallet address',
          success: false 
        })
      };
    }

    // Validate address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return {
        statusCode: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          error: 'Invalid wallet address format',
          success: false 
        })
      };
    }

    // Always use checksummed address
    let checksummedAddress;
    try {
      checksummedAddress = getAddress(address);
    } catch (e) {
      return {
        statusCode: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          error: 'Invalid Ethereum address',
          success: false 
        })
      };
    }

    // Connect to Somnia testnet
    const provider = new ethers.JsonRpcProvider('https://rpc.ankr.com/somnia_testnet/6e3fd81558cf77b928b06b38e9409b4677b637118114e83364486294d5ff4811');
    const contract = new ethers.Contract('0xa56919e3b51cE5e8cce02e76f145d9732db89c04', ABI, provider);

    // Check on-chain RT balance
    const riceTokens = await contract.riceTokens(checksummedAddress);
    const balance = Number(riceTokens);
    
    // Check if player has earned at least 200 RT
    const hasEarnedEnoughRT = balance >= 200;

    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        walletAddress: checksummedAddress,
        riceTokensBalance: balance,
        hasEarnedEnoughRT: hasEarnedEnoughRT,
        verified: hasEarnedEnoughRT,
        timestamp: new Date().toISOString()
      })
    };

  } catch (err) {
    console.error('Verification error:', err);
    return {
      statusCode: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Internal server error',
        success: false 
      })
    };
  }
};

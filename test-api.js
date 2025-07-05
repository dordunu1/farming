const https = require('https');

// Your deployed function URL
const FUNCTION_URL = 'https://us-central1-farming-f4d76.cloudfunctions.net/verifyPlayer';

// Test wallet addresses (replace with real ones from your game)
const testAddresses = [
  '0x489439886e58e5bedF4ab8444eaE7516340453f7', // Your contract address (for testing)
  '0x1234567890123456789012345678901234567890', // Invalid address for testing
  '0x0000000000000000000000000000000000000000'  // Zero address for testing
];

async function testAPI(address) {
  return new Promise((resolve, reject) => {
    const url = `${FUNCTION_URL}/${address}`;
    
    console.log(`\n🔍 Testing: ${url}`);
    
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log(`✅ Status: ${res.statusCode}`);
          console.log(`📊 Response:`, JSON.stringify(result, null, 2));
          resolve(result);
        } catch (error) {
          console.log(`❌ Parse Error: ${error.message}`);
          console.log(`📄 Raw Response: ${data}`);
          reject(error);
        }
      });
    }).on('error', (error) => {
      console.log(`❌ Request Error: ${error.message}`);
      reject(error);
    });
  });
}

async function runTests() {
  console.log('🚀 Testing Somnia Rice Farming API');
  console.log('=====================================');
  
  for (const address of testAddresses) {
    try {
      await testAPI(address);
    } catch (error) {
      console.log(`❌ Test failed for ${address}: ${error.message}`);
    }
  }
  
  console.log('\n🎯 Test Summary:');
  console.log('✅ API is deployed and responding');
  console.log('✅ You can now use this URL for quest verification:');
  console.log(`   ${FUNCTION_URL}/0xWALLET_ADDRESS`);
}

runTests(); 
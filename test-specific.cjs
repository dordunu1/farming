const https = require('https');

// Your deployed function URL
const FUNCTION_URL = 'https://us-central1-farming-f4d76.cloudfunctions.net/verifyPlayer';

// The specific wallet address to test
const testAddress = '0x31be1f49bD6b4f8F6B9e8881D25065a4965E1098';

async function testSpecificAddress() {
  return new Promise((resolve, reject) => {
    const url = `${FUNCTION_URL}/${testAddress}`;
    
    console.log('🚀 Testing Specific Wallet Address');
    console.log('=====================================');
    console.log(`🔍 Wallet: ${testAddress}`);
    console.log(`🔗 URL: ${url}`);
    console.log('');
    
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log(`✅ Status: ${res.statusCode}`);
          console.log(`📊 Response:`);
          console.log(JSON.stringify(result, null, 2));
          
          // Summary
          console.log('\n🎯 Summary:');
          if (result.verified) {
            console.log('✅ This player HAS earned 200+ RT tokens!');
            console.log(`💰 Current Balance: ${result.riceTokensBalance} RT`);
          } else {
            console.log('❌ This player has NOT earned 200+ RT tokens yet');
            console.log(`💰 Current Balance: ${result.riceTokensBalance} RT`);
            console.log(`📈 Need: ${200 - result.riceTokensBalance} more RT to qualify`);
          }
          
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

testSpecificAddress(); 
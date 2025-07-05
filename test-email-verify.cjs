const https = require('https');

const FUNCTION_URL = 'https://verifyplayerbyemail-hrksjsqhxq-uc.a.run.app';
const testEmail = 'somuchrekt4@gmail.com';

async function testEmailVerify() {
  return new Promise((resolve, reject) => {
    const url = `${FUNCTION_URL}/${encodeURIComponent(testEmail)}`;
    console.log('🚀 Testing Email Verification Endpoint');
    console.log('====================================');
    console.log(`🔍 Email: ${testEmail}`);
    console.log(`🔗 URL: ${url}`);
    console.log('');
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log(`✅ Status: ${res.statusCode}`);
          console.log(`📊 Response:`);
          console.log(JSON.stringify(result, null, 2));
          if (result.verified) {
            console.log('\n🎯 PASS: This email is linked to a wallet with enough RT!');
          } else {
            console.log('\n❌ FAIL: This email is not linked or does not meet the RT requirement.');
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

testEmailVerify(); 
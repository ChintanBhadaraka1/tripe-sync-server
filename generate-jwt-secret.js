import crypto from 'crypto';

const generateSecret = () => {
  // Generate 64 random bytes and convert to hex
  const secret = crypto.randomBytes(64).toString('hex');
  
  console.log('\n======================================================');
  console.log('                YOUR NEW JWT SECRET                   ');
  console.log('======================================================\n');
  console.log(secret);
  console.log('\n======================================================\n');
  console.log('☝️  Copy the string above and use it as your JWT_SECRET');
  console.log('   in your Voroa Environment Variables and your local .env file.');
  console.log('');
};

generateSecret();

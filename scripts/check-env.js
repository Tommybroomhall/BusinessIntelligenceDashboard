// Check environment variables
require('dotenv').config();

console.log('Checking environment variables...');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Defined' : 'Undefined');

// Print the first few characters of the connection string for security
if (process.env.MONGODB_URI) {
  const uri = process.env.MONGODB_URI;
  console.log('MONGODB_URI (masked):', uri.substring(0, 20) + '...' + uri.substring(uri.length - 10));
}

console.log('NODE_ENV:', process.env.NODE_ENV);

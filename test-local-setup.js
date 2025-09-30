import fetch from 'node-fetch';

async function testLocalSetup() {
  console.log('🧪 Testing local development setup...\n');

  // Test API server
  try {
    console.log('📡 Testing API server...');
    const apiResponse = await fetch('http://localhost:3001/api/health');
    const apiData = await apiResponse.json();
    console.log('✅ API server is running:', apiData.message);
  } catch (error) {
    console.log('❌ API server is not running:', error.message);
    console.log('💡 Run: npm run dev:api');
    return;
  }

  // Test frontend server
  try {
    console.log('\n🎨 Testing frontend server...');
    const frontendResponse = await fetch('http://localhost:5173');
    if (frontendResponse.ok) {
      console.log('✅ Frontend server is running at http://localhost:5173');
    } else {
      console.log('❌ Frontend server returned status:', frontendResponse.status);
    }
  } catch (error) {
    console.log('❌ Frontend server is not running:', error.message);
    console.log('💡 Run: npm run dev');
    return;
  }

  // Test API endpoints
  try {
    console.log('\n🔗 Testing API endpoints...');
    
    // Test stats endpoint
    const statsResponse = await fetch('http://localhost:3001/api/stats');
    const statsData = await statsResponse.json();
    console.log('✅ Stats endpoint working:', statsData.success ? 'Yes' : 'No');
    
    // Test participants endpoint
    const participantsResponse = await fetch('http://localhost:3001/api/participants');
    const participantsData = await participantsResponse.json();
    console.log('✅ Participants endpoint working:', participantsData.success ? 'Yes' : 'No');
    
  } catch (error) {
    console.log('❌ API endpoints error:', error.message);
  }

  console.log('\n🎉 Local development setup test complete!');
  console.log('\n📝 Next steps:');
  console.log('1. Open http://localhost:5173 in your browser');
  console.log('2. Test the ebook purchase flow');
  console.log('3. Check the console for any errors');
  console.log('4. Make your changes and see them hot-reload');
}

testLocalSetup().catch(console.error);

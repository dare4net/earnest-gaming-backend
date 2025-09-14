// Test script to check backend API endpoints
const fetch = require('node-fetch');

const API_BASE = 'http://localhost:5000/api';

async function testEndpoints() {
  console.log('🧪 Testing backend API endpoints...\n');

  // Test 1: Basic server response
  try {
    const response = await fetch('http://localhost:5000');
    const data = await response.json();
    console.log('✅ Server is running:', data.message);
  } catch (error) {
    console.log('❌ Server not responding:', error.message);
    return;
  }

  // Test 2: Auth test endpoint
  try {
    const response = await fetch(`${API_BASE}/auth/test`);
    const data = await response.json();
    console.log('✅ Auth route accessible:', data.message);
  } catch (error) {
    console.log('❌ Auth route error:', error.message);
  }

  // Test 3: Games endpoint
  try {
    const response = await fetch(`${API_BASE}/games`);
    const data = await response.json();
    console.log('✅ Games endpoint:', Array.isArray(data) ? `${data.length} games found` : 'Response received');
  } catch (error) {
    console.log('❌ Games endpoint error:', error.message);
  }

  // Test 4: Leagues endpoint
  try {
    const response = await fetch(`${API_BASE}/leagues`);
    const data = await response.json();
    console.log('✅ Leagues endpoint:', Array.isArray(data) ? `${data.length} leagues found` : 'Response received');
  } catch (error) {
    console.log('❌ Leagues endpoint error:', error.message);
  }

  // Test 5: Auth/me endpoint without token (should fail)
  try {
    const response = await fetch(`${API_BASE}/auth/me`);
    const data = await response.json();
    console.log('⚠️  Auth/me without token:', data.message);
  } catch (error) {
    console.log('✅ Auth/me properly protected:', error.message);
  }

  console.log('\n🔍 Testing complete!');
}

testEndpoints();

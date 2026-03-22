#!/usr/bin/env node

/**
 * Database Integration Verification Script
 * Tests that all features are properly integrated with database and user association
 * 
 * Run: node verify-integration.js
 */

const API_BASE_URL = process.env.VITE_BACKEND_URL || 'http://localhost:3000';
const TEST_USER_ID = 'test_user_' + Date.now();

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function section(title) {
  log(`\n${'='.repeat(70)}`, 'cyan');
  log(`  ${title}`, 'cyan');
  log(`${'='.repeat(70)}`, 'cyan');
}

function testPassed(name) {
  log(`✓ ${name}`, 'green');
}

function testFailed(name, error) {
  log(`✗ ${name}`, 'red');
  log(`  Error: ${error}`, 'red');
}

async function makeRequest(method, endpoint, body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
  const data = await response.json();
  
  return {
    status: response.status,
    ok: response.ok,
    data,
  };
}

async function testDatabaseHealth() {
  section('DATABASE HEALTH CHECK');
  
  try {
    const result = await makeRequest('GET', '/api/database/health');
    
    if (result.ok) {
      testPassed('Database connection');
      log(`  Status: ${result.data.status}`, 'blue');
    } else {
      testFailed('Database connection', result.data.error || 'Unknown error');
    }
  } catch (error) {
    testFailed('Database health check', error.message);
  }
}

async function testChatHistoryIntegration() {
  section('CHAT HISTORY INTEGRATION');
  
  const testMessage = 'Hello, I want to visit Paris';
  const testResponse = 'Paris is a wonderful city!';
  
  try {
    // Test 1: Save user message
    const saveUserResult = await makeRequest('POST', '/api/database/chat-history', {
      userId: TEST_USER_ID,
      role: 'user',
      content: testMessage,
      sessionId: 'test-session'
    });
    
    if (saveUserResult.ok) {
      testPassed('Save user message to chat history');
    } else {
      testFailed('Save user message', saveUserResult.data.message || 'Unknown error');
      return;
    }
    
    // Test 2: Save assistant message
    const saveAssistantResult = await makeRequest('POST', '/api/database/chat-history', {
      userId: TEST_USER_ID,
      role: 'assistant',
      content: testResponse,
      sessionId: 'test-session'
    });
    
    if (saveAssistantResult.ok) {
      testPassed('Save assistant message to chat history');
    } else {
      testFailed('Save assistant message', saveAssistantResult.data.message || 'Unknown error');
      return;
    }
    
    // Test 3: Retrieve chat history
    const retrieveResult = await makeRequest(
      'GET',
      `/api/database/chat-history?userId=${TEST_USER_ID}&sessionId=test-session`
    );
    
    if (retrieveResult.ok && retrieveResult.data.data && retrieveResult.data.data.length >= 2) {
      testPassed('Retrieve chat history');
      log(`  Messages found: ${retrieveResult.data.data.length}`, 'blue');
      
      // Verify messages are associated with correct user
      const messagesForUser = retrieveResult.data.data.filter(m => m.user_id === TEST_USER_ID);
      if (messagesForUser.length === retrieveResult.data.data.length) {
        testPassed('Chat history properly filtered by user_id');
      } else {
        testFailed('Chat history filtering', 'Not all messages belong to test user');
      }
    } else {
      testFailed('Retrieve chat history', 'No messages found or query failed');
    }
    
    // Test 4: Clear chat history
    const clearResult = await makeRequest(
      'DELETE',
      `/api/database/chat-history?userId=${TEST_USER_ID}&sessionId=test-session`
    );
    
    if (clearResult.ok) {
      testPassed('Clear chat history');
    } else {
      testFailed('Clear chat history', clearResult.data.message || 'Unknown error');
    }
    
  } catch (error) {
    testFailed('Chat history tests', error.message);
  }
}

async function testUserPreferencesIntegration() {
  section('USER PREFERENCES INTEGRATION');
  
  const preferences = {
    locationCity: 'Cairo',
    locationCountry: 'Egypt',
    locationLat: 30.0444,
    locationLon: 31.2357,
    travelStyle: 'adventure',
    budget: 5000,
    activities: ['hiking', 'beach', 'culture'],
    dietaryRestrictions: ['vegetarian'],
    travelPace: 'moderate',
    groupType: 'couple'
  };
  
  try {
    // Test 1: Save preferences
    const saveResult = await makeRequest('POST', '/api/database/user-preferences', {
      userId: TEST_USER_ID,
      preferences
    });
    
    if (saveResult.ok) {
      testPassed('Save user preferences');
    } else {
      testFailed('Save preferences', saveResult.data.message || 'Unknown error');
      return;
    }
    
    // Test 2: Retrieve preferences
    const getResult = await makeRequest(
      'GET',
      `/api/database/user-preferences?userId=${TEST_USER_ID}`
    );
    
    if (getResult.ok && getResult.data.data) {
      testPassed('Retrieve user preferences');
      
      // Verify correct user's data
      if (getResult.data.data.user_id === TEST_USER_ID) {
        testPassed('Preferences associated with correct user_id');
      } else {
        testFailed('User association', `Expected ${TEST_USER_ID}, got ${getResult.data.data.user_id}`);
      }
      
      // Verify fields are mapped correctly
      const savedData = getResult.data.data;
      if (savedData.current_location === preferences.locationCity &&
          savedData.current_country === preferences.locationCountry &&
          savedData.preferred_travel_style === preferences.travelStyle) {
        testPassed('Database field mapping correct');
      } else {
        testFailed('Field mapping', 'Database fields do not match expected values');
      }
    } else {
      testFailed('Retrieve preferences', getResult.data.message || 'Unknown error');
    }
    
    // Test 3: Delete preferences
    const deleteResult = await makeRequest(
      'DELETE',
      `/api/database/user-preferences?userId=${TEST_USER_ID}`
    );
    
    if (deleteResult.ok) {
      testPassed('Delete user preferences');
    } else {
      testFailed('Delete preferences', deleteResult.data.message || 'Unknown error');
    }
    
  } catch (error) {
    testFailed('User preferences tests', error.message);
  }
}

async function testFavoritesIntegration() {
  section('FAVORITES INTEGRATION');
  
  let favoriteId = null;
  
  try {
    // Test 1: Add favorite
    const addResult = await makeRequest('POST', '/api/favorites', {
      userId: TEST_USER_ID,
      destination: 'Paris',
      country: 'France',
      type: 'destination',
      reason: 'culture',
      description: 'City of light and art',
      imageUrl: 'https://example.com/paris.jpg',
      rating: 5
    });
    
    if (addResult.ok) {
      testPassed('Add favorite');
      favoriteId = addResult.data.favorite?.id;
    } else {
      testFailed('Add favorite', addResult.data.message || 'Unknown error');
      return;
    }
    
    // Test 2: Get favorites
    const getResult = await makeRequest('GET', `/api/favorites?userId=${TEST_USER_ID}`);
    
    if (getResult.ok && getResult.data.favorites) {
      testPassed('Retrieve favorites');
      log(`  Favorites found: ${getResult.data.count}`, 'blue');
      
      // Verify all favorites belong to the user
      const userFavorites = getResult.data.favorites.filter(f => f.user_id === TEST_USER_ID);
      if (userFavorites.length === getResult.data.favorites.length) {
        testPassed('Favorites properly filtered by user_id');
      } else {
        testFailed('Favorites filtering', 'Not all favorites belong to test user');
      }
    } else {
      testFailed('Retrieve favorites', getResult.data.message || 'Unknown error');
    }
    
    // Test 3: Update favorite
    if (favoriteId) {
      const updateResult = await makeRequest('PUT', `/api/favorites/${favoriteId}`, {
        userId: TEST_USER_ID,
        visited: true,
        visitDate: new Date().toISOString().split('T')[0],
        notes: 'Amazing experience!'
      });
      
      if (updateResult.ok) {
        testPassed('Update favorite (mark as visited)');
      } else {
        testFailed('Update favorite', updateResult.data.message || 'Unknown error');
      }
    }
    
    // Test 4: Delete favorite
    if (favoriteId) {
      const deleteResult = await makeRequest(
        'DELETE',
        `/api/favorites/${favoriteId}?userId=${TEST_USER_ID}`
      );
      
      if (deleteResult.ok) {
        testPassed('Delete favorite');
      } else {
        testFailed('Delete favorite', deleteResult.data.message || 'Unknown error');
      }
    }
    
  } catch (error) {
    testFailed('Favorites tests', error.message);
  }
}

async function testTripsIntegration() {
  section('TRIPS INTEGRATION');
  
  try {
    // Test 1: Create trip
    const tripData = {
      title: 'Paris Getaway',
      destination: 'Paris',
      destination_country: 'France',
      start_date: '2024-06-01',
      end_date: '2024-06-07',
      budget: 3000,
      trip_style: 'culture',
      description: 'A week in Paris'
    };
    
    const createResult = await makeRequest('POST', '/api/database/trips', {
      userId: TEST_USER_ID,
      tripData
    });
    
    if (createResult.ok) {
      testPassed('Create trip');
    } else {
      testFailed('Create trip', createResult.data.message || 'Unknown error');
      return;
    }
    
    // Test 2: Get user's trips
    const getResult = await makeRequest('GET', `/api/database/trips?userId=${TEST_USER_ID}`);
    
    if (getResult.ok && Array.isArray(getResult.data.data)) {
      testPassed('Retrieve user trips');
      
      // Verify trips belong to the user
      const userTrips = getResult.data.data.filter(t => t.user_id === TEST_USER_ID);
      if (userTrips.length === getResult.data.data.length) {
        testPassed('Trips properly filtered by user_id');
      } else {
        testFailed('Trips filtering', 'Not all trips belong to test user');
      }
    } else {
      testFailed('Retrieve trips', getResult.data.message || 'Unknown error');
    }
    
  } catch (error) {
    testFailed('Trips tests', error.message);
  }
}

async function testDataIsolation() {
  section('DATA ISOLATION & SECURITY');
  
  try {
    // Create data for user 1
    const user1 = 'user_' + Date.now();
    const user2 = 'user_' + (Date.now() + 1);
    
    // User 1 adds favorite
    await makeRequest('POST', '/api/favorites', {
      userId: user1,
      destination: 'Tokyo',
      country: 'Japan',
      type: 'destination'
    });
    
    // Try to access user 1's data with user 2's ID
    const result = await makeRequest('GET', `/api/favorites?userId=${user2}`);
    
    if (result.ok && (!result.data.favorites || result.data.favorites.length === 0)) {
      testPassed('Data isolation: Different users cannot see each other\'s data');
    } else {
      testFailed('Data isolation', 'User 2 can see User 1\'s data');
    }
    
  } catch (error) {
    testFailed('Data isolation tests', error.message);
  }
}

async function runAllTests() {
  log('\n╔════════════════════════════════════════════════════════════════════╗', 'cyan');
  log('║  DATABASE INTEGRATION VERIFICATION                                 ║', 'cyan');
  log('║  Tests user association, data isolation, and feature integration  ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════════════╝', 'cyan');
  
  log(`\nTest User ID: ${TEST_USER_ID}`, 'yellow');
  log(`API Base URL: ${API_BASE_URL}`, 'yellow');
  
  await testDatabaseHealth();
  await testChatHistoryIntegration();
  await testUserPreferencesIntegration();
  await testFavoritesIntegration();
  await testTripsIntegration();
  await testDataIsolation();
  
  section('VERIFICATION COMPLETE');
  log('\nAll tests completed. Check results above for any failures.', 'cyan');
  log('\nNext Steps:', 'blue');
  log('1. Fix any failed tests', 'blue');
  log('2. Deploy to production', 'blue');
  log('3. Enable Row-Level Security (RLS) in Supabase', 'blue');
  log('4. Set up monitoring and alerts', 'blue');
}

// Run tests
runAllTests().catch(error => {
  log(`\nFatal error: ${error.message}`, 'red');
  process.exit(1);
});

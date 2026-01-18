// utils/debugSunoAPI.ts
// Debug helper to test Suno API directly

const SUNO_API_KEY = 'e53be8225ca6b0c63cdec7a7d4091d59';
const SUNO_BASE_URL = 'https://api.sunoapi.org';

/**
 * Test Suno API with a simple prompt
 */
export async function testSunoAPI() {
  console.log('🧪 Testing Suno API...\n');

  try {
    // Step 1: Create a music generation task
    console.log('📤 Step 1: Creating music generation task...');
    
    const generateResponse = await fetch(`${SUNO_BASE_URL}/api/v1/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUNO_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: 'A short, calm piano melody for testing',
        customMode: false,
        instrumental: true,
        model: 'V4_5',
      }),
    });

    if (!generateResponse.ok) {
      throw new Error(`HTTP ${generateResponse.status}: ${generateResponse.statusText}`);
    }

    const generateResult = await generateResponse.json();
    console.log('📡 Generate Response:', JSON.stringify(generateResult, null, 2));

    if (generateResult.code !== 200) {
      throw new Error(`API Error: ${generateResult.msg}`);
    }

    const taskId = generateResult.data?.taskId;
    if (!taskId) {
      throw new Error('No taskId in response');
    }

    console.log(`✅ Task created: ${taskId}\n`);

    // Step 2: Poll for status
    console.log('⏳ Step 2: Polling for status (checking 5 times)...\n');

    for (let i = 1; i <= 5; i++) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds

      console.log(`🔍 Check ${i}/5:`);
      
      const statusResponse = await fetch(
        `${SUNO_BASE_URL}/api/v1/generate/record-info?taskId=${taskId}`,
        {
          headers: {
            'Authorization': `Bearer ${SUNO_API_KEY}`,
          },
        }
      );

      if (!statusResponse.ok) {
        console.error(`   ❌ HTTP ${statusResponse.status}`);
        continue;
      }

      const statusResult = await statusResponse.json();
      
      console.log(`   Code: ${statusResult.code}`);
      console.log(`   Status: ${statusResult.data?.status}`);
      console.log(`   Error: ${statusResult.data?.errorMessage || 'None'}`);
      
      if (statusResult.data?.response?.sunoData) {
        console.log(`   Tracks: ${statusResult.data.response.sunoData.length}`);
        console.log(`   Response Structure:`, JSON.stringify(statusResult, null, 2));
      }
      
      console.log('');

      if (statusResult.data?.status === 'SUCCESS') {
        const audioUrl = statusResult.data.response?.sunoData?.[0]?.audioUrl;
        console.log('🎉 SUCCESS! Audio URL:', audioUrl);
        return audioUrl;
      }

      if (statusResult.data?.status?.includes('FAILED') || 
          statusResult.data?.status?.includes('ERROR')) {
        console.error('❌ Generation failed');
        return null;
      }
    }

    console.log('⏱️  Still processing after 5 checks (25 seconds)');
    console.log('💡 Continue polling in the main app or check Suno website');
    console.log(`💡 Task ID: ${taskId}`);

  } catch (error) {
    console.error('❌ Test failed:', error);
    if (error instanceof Error) {
      console.error('   Details:', error.message);
    }
  }
}

/**
 * Check an existing task by ID
 */
export async function checkSunoTask(taskId: string) {
  console.log(`🔍 Checking task: ${taskId}\n`);

  try {
    const response = await fetch(
      `${SUNO_BASE_URL}/api/v1/generate/record-info?taskId=${taskId}`,
      {
        headers: {
          'Authorization': `Bearer ${SUNO_API_KEY}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    console.log('📡 Full Response:');
    console.log(JSON.stringify(result, null, 2));
    console.log('');

    console.log('📊 Status Summary:');
    console.log(`   Code: ${result.code}`);
    console.log(`   Message: ${result.msg}`);
    console.log(`   Status: ${result.data?.status}`);
    console.log(`   Error Code: ${result.data?.errorCode || 'None'}`);
    console.log(`   Error Message: ${result.data?.errorMessage || 'None'}`);
    
    if (result.data?.response?.sunoData) {
      console.log(`   Tracks: ${result.data.response.sunoData.length}`);
      result.data.response.sunoData.forEach((track: any, index: number) => {
        console.log(`\n   Track ${index + 1}:`);
        console.log(`      Title: ${track.title || 'Untitled'}`);
        console.log(`      Duration: ${track.duration || 0}s`);
        console.log(`      Audio URL: ${track.audioUrl || 'None'}`);
      });
    }

    return result;

  } catch (error) {
    console.error('❌ Check failed:', error);
    if (error instanceof Error) {
      console.error('   Details:', error.message);
    }
    return null;
  }
}

// Export for use in Expo app
export default { testSunoAPI, checkSunoTask };
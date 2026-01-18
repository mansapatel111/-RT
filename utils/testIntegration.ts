// utils/testIntegration.ts
// Quick test to verify frontend-backend integration

import { ARTapi } from './api';

/**
 * Test the API connection and database operations
 */
export async function testDatabaseIntegration() {
    console.log('🧪 Starting database integration test...\n');

    try {
        // Test 1: Save a test analysis
        console.log('Test 1: Saving test analysis to database...');
        const testData = {
            paintingName: 'Test Painting - Starry Night',
            artist: 'Vincent van Gogh',
            genre: 'Post-Impressionism',
            historicalPrompt: 'This is a test historical description of the famous painting.',
            immersivePrompt: 'Swirling blues and yellows dance across the canvas, evoking wonder.',
            audioUri: null,
            imageUri: 'test://image.jpg',
        };

        const savedAnalysis = await ARTapi.saveMuseumAnalysis(testData);
        console.log('✅ Test 1 PASSED - Analysis saved with ID:', savedAnalysis.id);
        console.log('   Saved data:', JSON.stringify(savedAnalysis, null, 2));

        // Test 2: Retrieve the saved analysis
        console.log('\nTest 2: Retrieving analysis by ID...');
        if (savedAnalysis.id) {
            const retrieved = await ARTapi.getAnalysisById(savedAnalysis.id);
            console.log('✅ Test 2 PASSED - Retrieved analysis:', retrieved.image_name);
        }

        // Test 3: Get all analyses
        console.log('\nTest 3: Getting all museum analyses...');
        const allAnalyses = await ARTapi.getAllAnalyses('museum');
        console.log(`✅ Test 3 PASSED - Found ${allAnalyses.length} museum analyses`);

        // Test 4: Search by name
        console.log('\nTest 4: Searching for analyses by name...');
        const searchResults = await ARTapi.searchAnalysesByName('Starry');
        console.log(`✅ Test 4 PASSED - Found ${searchResults.length} matching analyses`);

        // Test 5: Update analysis
        if (savedAnalysis.id) {
            console.log('\nTest 5: Updating analysis...');
            const updated = await ARTapi.updateAnalysis(savedAnalysis.id, {
                metadata: { ...savedAnalysis.metadata, testUpdated: true }
            });
            console.log('✅ Test 5 PASSED - Analysis updated');
        }

        // Test 6: Delete test analysis (cleanup)
        if (savedAnalysis.id) {
            console.log('\nTest 6: Cleaning up - deleting test analysis...');
            await ARTapi.deleteAnalysis(savedAnalysis.id);
            console.log('✅ Test 6 PASSED - Test analysis deleted');
        }

        console.log('\n🎉 All tests passed! Database integration is working correctly.\n');
        return true;

    } catch (error) {
        console.error('\n❌ Test failed with error:', error);
        console.error('\nTroubleshooting:');
        console.error('1. Make sure the backend is running: cd backend && python main.py');
        console.error('2. Check the API_BASE_URL in utils/api.ts matches your backend URL');
        console.error('3. Verify MongoDB connection in backend/.env');
        console.error('4. Check backend logs for errors\n');
        return false;
    }
}

// Export for use in development/debugging
export default testDatabaseIntegration;

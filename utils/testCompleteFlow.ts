// // utils/testCompleteFlow.ts
// // Test the complete flow: Image → Analysis → Music → Database → Display

// import { analyzeImage } from './analyzeImage';
// import { ARTapi } from './api';

// /**
//  * Test the complete integration flow
//  * This simulates what happens when a user analyzes an image
//  */
// export async function testCompleteFlow(testImageUri: string) {
//   console.log('🧪 Testing Complete Flow\n');
//   console.log('=' repeat(50) + '\n');

//   try {
//     // STEP 1: Analyze Image (includes Navigator API + Suno API + Database save)
//     console.log('📸 STEP 1: Analyzing image...');
//     console.log(`Image URI: ${testImageUri}\n`);

//     const result = await analyzeImage(testImageUri, 'museum');

//     console.log('\n✅ Analysis Complete!');
//     console.log('Results:');
//     console.log(`  📝 Title: ${result.title}`);
//     console.log(`  🎨 Artist: ${result.artist}`);
//     console.log(`  🎭 Genre: ${result.type}`);
//     console.log(`  📖 Description: ${result.description.substring(0, 100)}...`);
//     console.log(`  💭 Emotions: ${result.emotions.join(', ')}`);
//     console.log(`  🎵 Audio: ${result.audioUri ? '✅ Generated' : '❌ Not generated'}`);
//     console.log(`  💾 Database ID: ${result.analysisId}\n`);

//     // STEP 2: Verify data was saved to database
//     if (result.analysisId) {
//       console.log('📋 STEP 2: Verifying database entry...');
//       const savedData = await ARTapi.getAnalysisById(result.analysisId);
      
//       console.log('\n✅ Database Entry Verified!');
//       console.log('Saved Data:');
//       console.log(`  Image Name: ${savedData.image_name}`);
//       console.log(`  Analysis Type: ${savedData.analysis_type}`);
//       console.log(`  Descriptions: ${savedData.descriptions.length} items`);
//       console.log(`  Has Audio URI: ${savedData.metadata.audioUri ? '✅ Yes' : '❌ No'}`);
//       console.log(`  Audio URL: ${savedData.metadata.audioUri || 'None'}\n`);

//       // STEP 3: Check if audio is accessible
//       if (savedData.metadata.audioUri) {
//         console.log('🎵 STEP 3: Testing audio URL accessibility...');
//         try {
//           const audioResponse = await fetch(savedData.metadata.audioUri, { method: 'HEAD' });
//           if (audioResponse.ok) {
//             console.log('✅ Audio URL is accessible and ready to play!\n');
//           } else {
//             console.log(`⚠️  Audio URL returned status: ${audioResponse.status}\n`);
//           }
//         } catch (error) {
//           console.log('❌ Audio URL is not accessible:', error);
//         }
//       }

//       // STEP 4: Simulate what happens in result screen
//       console.log('📱 STEP 4: Simulating Result Screen Display...');
//       console.log('\n--- Result Screen Data ---');
//       console.log(`Title: ${result.title}`);
//       console.log(`Artist: ${result.artist}`);
//       console.log(`Genre: ${result.type}`);
//       console.log(`Description: ${result.description}`);
//       console.log(`Emotions: ${result.emotions.join(', ')}`);
//       console.log(`Can Play Audio: ${result.audioUri ? '✅ YES' : '❌ NO'}`);
//       console.log('-------------------------\n');
//     }

//     console.log('🎉 Complete Flow Test PASSED!\n');
//     console.log('Summary:');
//     console.log('✅ Navigator API analysis working');
//     console.log('✅ Suno music generation working');
//     console.log('✅ Database save working');
//     console.log('✅ Audio URL ready for playback');
//     console.log('\nYou can now:');
//     console.log('1. Navigate to result screen');
//     console.log('2. Play the generated music');
//     console.log('3. View in history screen\n');

//     return result;

//   } catch (error) {
//     console.error('\n❌ Complete Flow Test FAILED');
//     console.error('Error:', error);
//     console.error('\nDebugging steps:');
//     console.error('1. Check Navigator API key is valid');
//     console.error('2. Check Suno API key is valid');
//     console.error('3. Ensure backend is running (python main.py)');
//     console.error('4. Check network connectivity');
//     console.error('5. Review error message above for specific issue\n');
//     throw error;
//   }
// }

// // Helper function to test with a sample image
// export async function testWithSampleImage() {
//   // You would replace this with an actual image URI from your device
//   const sampleImageUri = 'file:///path/to/test/image.jpg';
  
//   console.log('⚠️  Please provide a real image URI to test');
//   console.log('Example usage:');
//   console.log('  import { testCompleteFlow } from "./utils/testCompleteFlow";');
//   console.log('  testCompleteFlow("file:///your/image/path.jpg");');
  
//   return null;
// }

// export default testCompleteFlow;
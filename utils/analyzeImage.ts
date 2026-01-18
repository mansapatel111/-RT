// // utils/analyzeImage.ts
// // Updated to use Navigator API and save to database

// import { analyzeMuseumImage, getQuickPaintingMetadata, MuseumAnalysisResult } from './analyzeImageWithNavigator';
// import { ARTapi } from './api';

// export interface AnalyzeImageResult {
//   imageUri: string;
//   title: string;
//   artist: string;
//   type: string;
//   description: string;
//   historicalPrompt?: string; // For museum mode
//   immersivePrompt?: string;  // For museum mode
//   emotions: string[];
//   audioUri: string | null;
//   analysisId?: string; // Database ID after saving
// }

// /**
//  * Main function to analyze images based on mode
//  * Currently supports: museum, monuments, landscape
//  */
// export async function analyzeImage(
//   imageUri: string,
//   mode: 'museum' | 'monuments' | 'landscape'
// ): Promise<AnalyzeImageResult> {

//   console.log(`🎯 Starting ${mode} analysis...`);

//   try {
//     if (mode === 'museum') {
//       return await analyzeMuseumMode(imageUri);
//     } else if (mode === 'monuments') {
//       return await analyzeMonumentsMode(imageUri);
//     } else if (mode === 'landscape') {
//       return await analyzeLandscapeMode(imageUri);
//     } else {
//       throw new Error(`Unsupported mode: ${mode}`);
//     }
//   } catch (error) {
//     console.error(`❌ Analysis failed for ${mode} mode:`, error);
//     throw error;
//   }
// }

// /**
//  * Museum Mode: Full Navigator AI + Suno integration
//  * Now with database caching to avoid re-analyzing the same artwork
//  */
// async function analyzeMuseumMode(imageUri: string): Promise<AnalyzeImageResult> {
//   try {
//     console.log('🎨 Museum Mode: Checking database for existing analysis...');

//     // Step 0a: Check if this exact image was already analyzed (by URI)
//     try {
//       const existingByUri = await ARTapi.findByImageUri(imageUri);

//       if (existingByUri) {
//         console.log('✅ Found existing analysis by image URI! Using cached data.');
//         console.log('📦 Cached painting:', existingByUri.image_name);

//         // Return cached result from database
//         const result: AnalyzeImageResult = {
//           imageUri: existingByUri.metadata.imageUri || imageUri,
//           title: existingByUri.image_name,
//           artist: existingByUri.metadata.artist || 'Unknown Artist',
//           type: existingByUri.metadata.genre || 'Unknown Genre',
//           description: existingByUri.metadata.historicalPrompt || existingByUri.descriptions[0] || '',
//           historicalPrompt: existingByUri.metadata.historicalPrompt || existingByUri.descriptions[0] || '',
//           immersivePrompt: existingByUri.metadata.immersivePrompt || existingByUri.descriptions[1] || '',
//           emotions: existingByUri.metadata.emotions || extractEmotions(existingByUri.metadata.immersivePrompt || ''),
//           audioUri: existingByUri.metadata.audioUri || null,
//           analysisId: existingByUri.id,
//         };

//         console.log('🚀 Returning cached analysis - no API calls needed!');
//         return result;
//       }

//       console.log('🔍 No existing analysis found by image URI.');
//     } catch (uriError) {
//       console.warn('⚠️ URI cache lookup failed, continuing with name check:', uriError);
//     }

//     // Step 0b: Get just the painting name first (lightweight call)
//     try {
//       console.log('🎨 Getting painting name to check database...');
//       const quickMetadata = await getQuickPaintingMetadata(imageUri);

//       if (quickMetadata?.paintingName) {
//         console.log('📝 Painting identified as:', quickMetadata.paintingName);

//         // Check database by painting name
//         const existingByName = await ARTapi.findByPaintingName(quickMetadata.paintingName);

//         if (existingByName) {
//           console.log('✅ Found existing analysis by painting name! Using cached data.');
//           console.log('📦 Cached painting:', existingByName.image_name);

//           // Return cached result from database
//           const result: AnalyzeImageResult = {
//             imageUri: imageUri, // Use current image URI
//             title: existingByName.image_name,
//             artist: existingByName.metadata.artist || 'Unknown Artist',
//             type: existingByName.metadata.genre || 'Unknown Genre',
//             description: existingByName.metadata.historicalPrompt || existingByName.descriptions[0] || '',
//             historicalPrompt: existingByName.metadata.historicalPrompt || existingByName.descriptions[0] || '',
//             immersivePrompt: existingByName.metadata.immersivePrompt || existingByName.descriptions[1] || '',
//             emotions: existingByName.metadata.emotions || extractEmotions(existingByName.metadata.immersivePrompt || ''),
//             audioUri: existingByName.metadata.audioUri || null,
//             analysisId: existingByName.id,
//           };

//           console.log('🚀 Returning cached analysis by name - no full analysis needed!');
//           return result;
//         }

//         console.log('🔍 No existing analysis found by painting name either.');
//       }
//     } catch (nameError) {
//       console.warn('⚠️ Name-based cache lookup failed, proceeding with full analysis:', nameError);
//     }

//     console.log('🔍 No existing analysis found. Running full AI analysis...');
//     console.log('🎨 Museum Mode: Starting Navigator AI analysis...');

//     // Step 1: Analyze with Navigator AI and generate music with Suno
//     const analysisResult: MuseumAnalysisResult = await analyzeMuseumImage(imageUri);

//     // Step 2: Save to database (even if music failed)
//     console.log('💾 Saving analysis to database...');
//     try {
//       const savedData = await ARTapi.saveMuseumAnalysis(analysisResult);
//       console.log('✅ Successfully saved to database with ID:', savedData.id);

//       // Step 3: Format for ResultScreen
//       const result: AnalyzeImageResult = {
//         imageUri: analysisResult.imageUri,
//         title: analysisResult.paintingName,
//         artist: analysisResult.artist,
//         type: analysisResult.genre,
//         description: analysisResult.historicalPrompt,
//         historicalPrompt: analysisResult.historicalPrompt,
//         immersivePrompt: analysisResult.immersivePrompt,
//         emotions: extractEmotions(analysisResult.immersivePrompt),
//         audioUri: analysisResult.audioUri,
//         analysisId: savedData.id,
//       };



//       console.log('✅ Museum analysis complete and saved!');
//       return result;

//     } catch (dbError) {
//       console.error('❌ Database save failed:', dbError);
//       console.log('⚠️  Continuing without database save - data will not be in history');

//       // Still return result so user can see analysis even if DB fails
//       const result: AnalyzeImageResult = {
//         imageUri: analysisResult.imageUri,
//         title: analysisResult.paintingName,
//         artist: analysisResult.artist,
//         type: analysisResult.genre,
//         description: analysisResult.historicalPrompt,
//         historicalPrompt: analysisResult.historicalPrompt,
//         immersivePrompt: analysisResult.immersivePrompt,
//         emotions: extractEmotions(analysisResult.immersivePrompt),
//         audioUri: analysisResult.audioUri,
//         analysisId: undefined, // No DB ID since save failed
//       };

//       console.log('⚠️  Museum analysis complete but NOT saved to database');
//       return result;
//     }

//   } catch (error) {
//     console.error('❌ Museum mode analysis failed:', error);
//     throw new Error(`Museum analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
//   }
// }

// /**
//  * Monuments Mode: Placeholder (you can implement similar logic)
//  */
// async function analyzeMonumentsMode(imageUri: string): Promise<AnalyzeImageResult> {
//   console.log('🗿 Monuments Mode: Using fallback analysis...');

//   // TODO: Implement monuments-specific analysis
//   // For now, return mock data
//   return {
//     imageUri,
//     title: 'Monument Placeholder',
//     artist: 'Unknown',
//     type: 'Monument',
//     description: 'This is a placeholder for monument analysis. Implement Navigator AI analysis for monuments mode.',
//     emotions: ['historical', 'grand', 'majestic'],
//     audioUri: null,
//   };
// }

// /**
//  * Landscape Mode: Placeholder (you can implement similar logic)
//  */
// async function analyzeLandscapeMode(imageUri: string): Promise<AnalyzeImageResult> {
//   console.log('🌄 Landscape Mode: Using fallback analysis...');

//   // TODO: Implement landscape-specific analysis
//   // For now, return mock data
//   return {
//     imageUri,
//     title: 'Landscape Placeholder',
//     artist: 'Nature',
//     type: 'Landscape',
//     description: 'This is a placeholder for landscape analysis. Implement Navigator AI analysis for landscape mode.',
//     emotions: ['peaceful', 'serene', 'natural'],
//     audioUri: null,
//   };
// }

// /**
//  * Helper: Extract emotion keywords from immersive description
//  */
// function extractEmotions(immersivePrompt: string): string[] {
//   const emotionKeywords = [
//     'calm', 'dreamy', 'melancholy', 'energetic', 'mysterious',
//     'romantic', 'joyful', 'somber', 'dramatic', 'peaceful',
//     'intense', 'serene', 'vibrant', 'haunting', 'ethereal'
//   ];

//   const text = immersivePrompt.toLowerCase();
//   const foundEmotions = emotionKeywords.filter(emotion =>
//     text.includes(emotion)
//   );

//   // Return found emotions or default ones
//   return foundEmotions.length > 0
//     ? foundEmotions.slice(0, 3)
//     : ['artistic', 'expressive', 'captivating'];
// }

// export default analyzeImage;











// utils/analyzeImage.ts
// Updated to handle Museum, Monument, and Landscape modes

import { AnalysisResult, analyzeImage as analyzeWithNavigator } from './analyzeImageWithNavigator';
import { ARTapi } from './api';

export interface AnalyzeImageResult {
  imageUri: string;
  title: string;
  artist: string;
  type: string;
  description: string;
  historicalPrompt?: string;
  immersivePrompt?: string;
  emotions: string[];
  audioUri: string | null;
  analysisId?: string;
}

/**
 * Main function to analyze images based on mode
 * Supports: museum, monuments, landscape
 */
export async function analyzeImage(
  imageUri: string,
  mode: 'museum' | 'monuments' | 'landscape'
): Promise<AnalyzeImageResult> {

  console.log(`🎯 Starting ${mode} analysis...`);

  try {
    // Step 1: Analyze with Navigator AI and generate music with Suno
    console.log(`🎨 ${mode.charAt(0).toUpperCase() + mode.slice(1)} Mode: Starting Navigator AI analysis...`);
    const analysisResult: AnalysisResult = await analyzeWithNavigator(imageUri, mode);

    // Step 2: Save to database
    console.log('💾 Saving analysis to database...');
    try {
      const savedData = await ARTapi.saveAnalysis(analysisResult);
      console.log('✅ Successfully saved to database with ID:', savedData.id);

      // Step 3: Format for ResultScreen
      const result: AnalyzeImageResult = {
        imageUri: analysisResult.imageUri,
        title: analysisResult.name,
        artist: analysisResult.creator,
        type: analysisResult.category,
        description: analysisResult.historicalPrompt,
        historicalPrompt: analysisResult.historicalPrompt,
        immersivePrompt: analysisResult.immersivePrompt,
        emotions: extractEmotions(analysisResult.immersivePrompt, mode),
        audioUri: analysisResult.audioUri,
        analysisId: savedData.id,
      };

      console.log(`✅ ${mode} analysis complete and saved!`);
      return result;

    } catch (dbError) {
      console.error('❌ Database save failed:', dbError);
      console.log('⚠️  Continuing without database save - data will not be in history');

      // Still return result so user can see analysis even if DB fails
      const result: AnalyzeImageResult = {
        imageUri: analysisResult.imageUri,
        title: analysisResult.name,
        artist: analysisResult.creator,
        type: analysisResult.category,
        description: analysisResult.historicalPrompt,
        historicalPrompt: analysisResult.historicalPrompt,
        immersivePrompt: analysisResult.immersivePrompt,
        emotions: extractEmotions(analysisResult.immersivePrompt, mode),
        audioUri: analysisResult.audioUri,
        analysisId: undefined,
      };

      console.log(`⚠️  ${mode} analysis complete but NOT saved to database`);
      return result;
    }

  } catch (error) {
    console.error(`❌ ${mode} mode analysis failed:`, error);
    throw new Error(`${mode} analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Helper: Extract emotion keywords based on mode and description
 */
function extractEmotions(immersivePrompt: string, mode: 'museum' | 'monuments' | 'landscape'): string[] {
  const text = immersivePrompt.toLowerCase();

  // Mode-specific emotion keywords
  const emotionKeywordsByMode = {
    museum: [
      'calm', 'dreamy', 'melancholy', 'energetic', 'mysterious',
      'romantic', 'joyful', 'somber', 'dramatic', 'peaceful',
      'intense', 'serene', 'vibrant', 'haunting', 'ethereal',
      'expressive', 'bold', 'delicate', 'passionate', 'contemplative'
    ],
    monuments: [
      'grand', 'historic', 'majestic', 'ancient', 'powerful',
      'monumental', 'imposing', 'timeless', 'sacred', 'legendary',
      'awe-inspiring', 'magnificent', 'architectural', 'enduring', 'symbolic',
      'mysterious', 'spiritual', 'cultural', 'proud', 'eternal'
    ],
    landscape: [
      'peaceful', 'serene', 'natural', 'wild', 'tranquil',
      'majestic', 'vast', 'untamed', 'pristine', 'breathtaking',
      'rugged', 'gentle', 'expansive', 'remote', 'dramatic',
      'scenic', 'lush', 'barren', 'sublime', 'harmonious'
    ]
  };

  const emotionKeywords = emotionKeywordsByMode[mode];
  const foundEmotions = emotionKeywords.filter(emotion =>
    text.includes(emotion)
  );

  // Return found emotions or mode-appropriate defaults
  if (foundEmotions.length > 0) {
    return foundEmotions.slice(0, 3);
  }

  // Mode-specific defaults if no emotions found
  const defaultEmotions = {
    museum: ['artistic', 'expressive', 'captivating'],
    monuments: ['historic', 'grand', 'impressive'],
    landscape: ['natural', 'peaceful', 'beautiful']
  };

  return defaultEmotions[mode];
}

export default analyzeImage;
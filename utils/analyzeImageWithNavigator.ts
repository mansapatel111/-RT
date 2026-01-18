// // utils/analyzeImageWithNavigator.ts


// // ============= TYPE DEFINITIONS =============
// interface ChatCompletionResponse {
//     choices: Array<{
//         message: {
//             role: string;
//             content: string;
//         };
//     }>;
// }

// interface SunoGenerateResponse {
//     code: number;
//     msg: string;
//     data: {
//         taskId: string;
//     };
// }

// interface SunoStatusResponse {
//     code: number;
//     msg: string;
//     data: {
//         taskId: string;
//         parentMusicId?: string;
//         param?: string;
//         response?: {
//             taskId: string;
//             sunoData?: Array<{
//                 id: string;
//                 audioUrl: string;
//                 streamAudioUrl?: string;
//                 imageUrl?: string;
//                 prompt?: string;
//                 modelName?: string;
//                 title?: string;
//                 tags?: string;
//                 createTime?: string;
//                 duration?: number;
//             }>;
//         };
//         status: 'PENDING' | 'TEXT_SUCCESS' | 'FIRST_SUCCESS' | 'SUCCESS' |
//         'CREATE_TASK_FAILED' | 'GENERATE_AUDIO_FAILED' |
//         'CALLBACK_EXCEPTION' | 'SENSITIVE_WORD_ERROR';
//         type?: string;
//         operationType?: string;
//         errorCode?: number | null;
//         errorMessage?: string | null;
//     };
// }

// export interface MuseumAnalysisResult {
//     paintingName: string;
//     artist: string;
//     genre: string;
//     historicalPrompt: string; // max 500 chars
//     immersivePrompt: string;  // max 400 chars
//     audioUri: string | null;
//     imageUri: string;
// }

// // ============= API CONFIGURATION =============
// const NAVIGATOR_API_KEY = 'sk-SwCA-nMn6Z1Zz1F0UXDzgQ'; // Your Navigator API Key
// const SUNO_API_KEY = '4acad3fb927c19ca28eadf14383da5e7'; // Your Suno API Key
// const NAVIGATOR_BASE_URL = 'https://api.ai.it.ufl.edu/v1/';
// const SUNO_BASE_URL = 'https://api.sunoapi.org';
// const MODEL = 'mistral-small-3.1';

// // ============= HELPER: Convert Image to Base64 =============
// const convertImageToBase64 = async (uri: string): Promise<string> => {
//     try {
//         const response = await fetch(uri);
//         const blob = await response.blob();

//         return new Promise<string>((resolve, reject) => {
//             const reader = new FileReader();
//             reader.onloadend = () => {
//                 if (typeof reader.result === 'string') {
//                     const base64 = reader.result.split(',')[1];
//                     resolve(base64);
//                 } else {
//                     reject(new Error('Failed to convert image to base64'));
//                 }
//             };
//             reader.onerror = reject;
//             reader.readAsDataURL(blob);
//         });
//     } catch (error) {
//         throw error;
//     }
// };

// // ============= HELPER: Get Quick Painting Metadata (Name Only) =============
// export async function getQuickPaintingMetadata(imageUri: string): Promise<{ paintingName: string } | null> {
//     try {
//         console.log('🔍 Getting quick painting metadata...');
//         const base64Image = await convertImageToBase64(imageUri);
//         const imageDataUrl = `data:image/jpeg;base64,${base64Image}`;

//         const metadataPrompt = `Analyze this artwork and provide ONLY the painting name in this EXACT JSON format (no additional text):
// {
//   "paintingName": "exact title of the painting"
// }`;

//         const metadataResponse = await fetch(NAVIGATOR_BASE_URL + 'chat/completions', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//                 'Authorization': `Bearer ${NAVIGATOR_API_KEY}`,
//             },
//             body: JSON.stringify({
//                 model: MODEL,
//                 messages: [
//                     {
//                         role: 'user',
//                         content: [
//                             { type: 'text', text: metadataPrompt },
//                             { type: 'image_url', image_url: { url: imageDataUrl } },
//                         ],
//                     },
//                 ],
//             }),
//         });

//         if (!metadataResponse.ok) {
//             console.warn('Failed to get quick metadata');
//             return null;
//         }

//         const metadataData: ChatCompletionResponse = await metadataResponse.json();
//         const metadataContent = metadataData.choices[0]?.message?.content || '';

//         try {
//             const parsed = JSON.parse(metadataContent);
//             return { paintingName: parsed.paintingName || 'Unknown' };
//         } catch {
//             return null;
//         }

//     } catch (error) {
//         console.warn('❌ Quick metadata fetch failed:', error);
//         return null;
//     }
// }

// // ============= STEP 1: Analyze Artwork with Navigator AI =============
// async function analyzeArtworkWithNavigator(imageUri: string): Promise<{
//     paintingName: string;
//     artist: string;
//     genre: string;
//     historicalPrompt: string;
//     immersivePrompt: string;
// }> {
//     try {
//         console.log('🎨 Step 1: Converting image to base64...');
//         const base64Image = await convertImageToBase64(imageUri);
//         const imageDataUrl = `data:image/jpeg;base64,${base64Image}`;

//         // PROMPT 1: Get painting metadata (name, artist, genre)
//         console.log('🎨 Step 2: Getting painting metadata...');
//         const metadataPrompt = `Analyze this artwork and provide ONLY the following information in this EXACT JSON format (no additional text):
// {
//   "paintingName": "exact title of the painting",
//   "artist": "full name of the artist",
//   "genre": "art movement or genre (e.g., Impressionism, Renaissance, Modern Art)"
// }`;

//         const metadataResponse = await fetch(NAVIGATOR_BASE_URL + 'chat/completions', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//                 'Authorization': `Bearer ${NAVIGATOR_API_KEY}`,
//             },
//             body: JSON.stringify({
//                 model: MODEL,
//                 messages: [
//                     {
//                         role: 'user',
//                         content: [
//                             { type: 'text', text: metadataPrompt },
//                             { type: 'image_url', image_url: { url: imageDataUrl } },
//                         ],
//                     },
//                 ],
//             }),
//         });

//         if (!metadataResponse.ok) {
//             throw new Error('Failed to get painting metadata');
//         }

//         const metadataData: ChatCompletionResponse = await metadataResponse.json();
//         const metadataContent = metadataData.choices[0]?.message?.content || '';

//         // Parse JSON from response
//         let metadata;
//         try {
//             metadata = JSON.parse(metadataContent);
//         } catch {
//             // If not valid JSON, try to extract from text
//             metadata = {
//                 paintingName: 'Unknown Artwork',
//                 artist: 'Unknown Artist',
//                 genre: 'Unknown Genre'
//             };
//         }

//         // PROMPT 2: Historical/Descriptive Analysis (500 chars)
//         console.log('🎨 Step 3: Getting historical description...');
//         const historicalPrompt = `Provide a historical and descriptive analysis of this artwork. Include:
// - Historical context and period
// - Artistic significance
// - What the image depicts
// - Cultural importance

// IMPORTANT: Your response must be EXACTLY 500 characters or less. Be concise and informative, like a museum description.`;

//         const historicalResponse = await fetch(NAVIGATOR_BASE_URL + 'chat/completions', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//                 'Authorization': `Bearer ${NAVIGATOR_API_KEY}`,
//             },
//             body: JSON.stringify({
//                 model: MODEL,
//                 messages: [
//                     {
//                         role: 'user',
//                         content: [
//                             { type: 'text', text: historicalPrompt },
//                             { type: 'image_url', image_url: { url: imageDataUrl } },
//                         ],
//                     },
//                 ],
//             }),
//         });

//         if (!historicalResponse.ok) {
//             throw new Error('Failed to get historical description');
//         }

//         const historicalData: ChatCompletionResponse = await historicalResponse.json();
//         let historicalDescription = historicalData.choices[0]?.message?.content || '';

//         // Ensure 500 char limit
//         if (historicalDescription.length > 500) {
//             historicalDescription = historicalDescription.substring(0, 497) + '...';
//         }

//         // PROMPT 3: Immersive/Emotional Description (400 chars)
//         console.log('🎨 Step 4: Getting immersive description...');
//         const immersivePrompt = `Describe this image in a poetic, immersive way that captures:
// - The color palette and lighting (be specific: "soft blues", "warm amber glow", etc.)
// - The setting and atmosphere
// - The emotions and mood evoked
// - The relationship between subjects or elements
// - The feeling of the scene
// - Movement and dynamics
// - Physical details that create emotion (posture, expressions, gestures)

// Write 3-4 sentences in present tense, as if describing a living moment. Focus on sensory details and emotional weight. Make it vivid and evocative while describing the movement and immersive elements of what's happening in the painting, like the example: "Soft hues of blue wash over a quiet room. A woman, draped in flowing indigo robes, bows gently toward a child..."

// IMPORTANT: Your response must be EXACTLY 400 characters or less. Focus on sensory details and emotional weight.`;

//         const immersiveResponse = await fetch(NAVIGATOR_BASE_URL + 'chat/completions', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//                 'Authorization': `Bearer ${NAVIGATOR_API_KEY}`,
//             },
//             body: JSON.stringify({
//                 model: MODEL,
//                 messages: [
//                     {
//                         role: 'user',
//                         content: [
//                             { type: 'text', text: immersivePrompt },
//                             { type: 'image_url', image_url: { url: imageDataUrl } },
//                         ],
//                     },
//                 ],
//             }),
//         });

//         if (!immersiveResponse.ok) {
//             throw new Error('Failed to get immersive description');
//         }

//         const immersiveData: ChatCompletionResponse = await immersiveResponse.json();
//         let immersiveDescription = immersiveData.choices[0]?.message?.content || '';

//         // Ensure 400 char limit
//         if (immersiveDescription.length > 400) {
//             immersiveDescription = immersiveDescription.substring(0, 397) + '...';
//         }

//         console.log('✅ Analysis complete:', {
//             name: metadata.paintingName,
//             artist: metadata.artist,
//             genre: metadata.genre,
//             historicalLength: historicalDescription.length,
//             immersiveLength: immersiveDescription.length
//         });

//         return {
//             paintingName: metadata.paintingName,
//             artist: metadata.artist,
//             genre: metadata.genre,
//             historicalPrompt: historicalDescription,
//             immersivePrompt: immersiveDescription,
//         };

//     } catch (error) {
//         console.error('❌ Navigator API analysis error:', error);
//         throw new Error(`Failed to analyze artwork: ${error instanceof Error ? error.message : 'Unknown error'}`);
//     }
// }

// // ============= STEP 2: Generate Music with Suno API =============
// async function generateMusicWithSuno(prompt: string): Promise<string | null> {
//     try {
//         console.log('🎵 Step 5: Starting Suno music generation...');
//         console.log('📝 Music prompt:', prompt);

//         const response = await fetch(`${SUNO_BASE_URL}/api/v1/generate`, {
//             method: 'POST',
//             headers: {
//                 'Authorization': `Bearer ${SUNO_API_KEY}`,
//                 'Content-Type': 'application/json',
//             },
//             body: JSON.stringify({
//                 prompt: prompt,
//                 customMode: false,
//                 instrumental: true,
//                 style: "Classical",
//                 negativeTags: "Heavy Metal, Upbeat Drums, Rock",
//                 model: 'V4_5',
//                 audioWeight: 0.65,
//                 // REQUIRED by Suno API, but we're polling so we use a dummy URL
//                 // This is a free webhook testing service that accepts POSTs but we don't use the data
//                 callBackUrl: 'https://webhook.site/#!/view/00000000-0000-0000-0000-000000000000',
//             }),
//         });

//         if (!response.ok) {
//             throw new Error(`HTTP ${response.status}: ${response.statusText}`);
//         }

//         const result: SunoGenerateResponse = await response.json();
//         console.log('📡 Suno API Response:', JSON.stringify(result, null, 2));

//         // Check response code
//         if (result.code !== 200) {
//             throw new Error(`Suno API Error (${result.code}): ${result.msg}`);
//         }

//         const taskId = result.data?.taskId;
//         if (!taskId) {
//             throw new Error('No taskId returned from Suno API');
//         }

//         console.log('✅ Task created successfully');
//         console.log(`   Task ID: ${taskId}`);
//         console.log('⏳ Starting polling for completion...');

//         // Poll for completion (we don't use the callback, just poll)
//         const audioUrl = await pollSunoTaskStatus(taskId);
//         return audioUrl;

//     } catch (error) {
//         console.error('❌ Suno music generation error:', error);
//         if (error instanceof Error) {
//             console.error('   Error details:', error.message);
//         }
//         return null; // Return null if music generation fails (non-critical)
//     }
// }

// // ============= HELPER: Poll Suno Task Status =============
// async function pollSunoTaskStatus(taskId: string): Promise<string | null> {
//     const maxAttempts = 120; // 10 minutes max
//     const pollInterval = 5000; // 5 seconds between checks
//     let attempts = 0;

//     console.log(`⏰ Starting polling (max ${maxAttempts * pollInterval / 1000 / 60} minutes)...`);

//     while (attempts < maxAttempts) {
//         try {
//             console.log(`🔍 Checking task status (attempt ${attempts + 1}/${maxAttempts})...`);

//             const response = await fetch(
//                 `${SUNO_BASE_URL}/api/v1/generate/record-info?taskId=${taskId}`,
//                 {
//                     headers: {
//                         'Authorization': `Bearer ${SUNO_API_KEY}`,
//                     },
//                 }
//             );

//             if (!response.ok) {
//                 console.warn(`⚠️  API returned status ${response.status}, retrying...`);
//                 attempts++;
//                 await new Promise(resolve => setTimeout(resolve, pollInterval));
//                 continue;
//             }

//             const result = await response.json();

//             // Check API response code first
//             if (result.code !== 200) {
//                 console.error(`❌ API Error: ${result.msg}`);
//                 return null;
//             }

//             const status = result.data?.status;
//             const errorMessage = result.data?.errorMessage;
//             const errorCode = result.data?.errorCode;

//             console.log(`📊 Status: ${status} | Attempt: ${attempts + 1}/${maxAttempts} | Time: ${Math.round((attempts + 1) * pollInterval / 1000)}s`);

//             // SUCCESS: All tracks generated successfully
//             if (status === 'SUCCESS') {
//                 const sunoData = result.data.response?.sunoData;
//                 if (sunoData && sunoData.length > 0) {
//                     const firstTrack = sunoData[0];
//                     const audioUrl = firstTrack.audioUrl;

//                     console.log('✅ Music generation SUCCESS!');
//                     console.log(`   Title: ${firstTrack.title || 'Untitled'}`);
//                     console.log(`   Duration: ${firstTrack.duration || 0}s`);
//                     console.log(`   Audio URL: ${audioUrl}`);
//                     console.log(`   Image URL: ${firstTrack.imageUrl || 'None'}`);
//                     console.log(`⏱️  Total time: ${(attempts * pollInterval) / 1000} seconds`);

//                     return audioUrl;
//                 } else {
//                     console.error('❌ SUCCESS status but no audio data found');
//                     return null;
//                 }
//             }

//             // FIRST_SUCCESS: First track completed (continue polling for all tracks)
//             if (status === 'FIRST_SUCCESS') {
//                 console.log('🎵 First track completed, waiting for all tracks...');
//             }

//             // TEXT_SUCCESS: Lyrics/text generation completed
//             if (status === 'TEXT_SUCCESS') {
//                 console.log('📝 Text generation completed, waiting for audio...');
//             }

//             // PENDING: Task is waiting to be processed
//             if (status === 'PENDING') {
//                 console.log(`⏳ Task pending... (${Math.round((attempts + 1) * pollInterval / 1000)}s elapsed)`);
//             }

//             // Error statuses - stop polling immediately
//             if (status === 'CREATE_TASK_FAILED') {
//                 console.error('❌ Failed to create generation task');
//                 console.error(`   Error: ${errorMessage || 'Unknown error'}`);
//                 return null;
//             }

//             if (status === 'GENERATE_AUDIO_FAILED') {
//                 console.error('❌ Failed to generate music tracks');
//                 console.error(`   Error: ${errorMessage || 'Unknown error'}`);
//                 return null;
//             }

//             if (status === 'CALLBACK_EXCEPTION') {
//                 console.error('❌ Callback error occurred');
//                 console.error(`   Error: ${errorMessage || 'Unknown error'}`);
//                 return null;
//             }

//             if (status === 'SENSITIVE_WORD_ERROR') {
//                 console.error('❌ Content contains prohibited words');
//                 console.error(`   Error: ${errorMessage || 'Content filtered'}`);
//                 return null;
//             }

//             // Wait before next check
//             await new Promise(resolve => setTimeout(resolve, pollInterval));
//             attempts++;

//         } catch (error) {
//             console.error('❌ Error checking task status:', error);
//             console.log('🔄 Retrying in 5 seconds...');
//             await new Promise(resolve => setTimeout(resolve, pollInterval));
//             attempts++;
//         }
//     }

//     console.error(`❌ Music generation timeout after ${maxAttempts * pollInterval / 1000 / 60} minutes`);
//     console.error('💡 Music generation can take 2-5 minutes. The task may still complete on Suno\'s servers.');
//     console.error(`💡 Check the Suno website for taskId: ${taskId}`);
//     return null;
// }

// // ============= MAIN EXPORT: Complete Museum Analysis =============
// export async function analyzeMuseumImage(imageUri: string): Promise<MuseumAnalysisResult> {
//     try {
//         console.log('🚀 Starting complete museum image analysis...');
//         console.log('Image URI:', imageUri);

//         // Step 1-4: Analyze artwork with Navigator AI
//         const analysis = await analyzeArtworkWithNavigator(imageUri);

//         // Step 5-6: Generate music with Suno API (using immersive prompt)
//         const audioUri = await generateMusicWithSuno(analysis.immersivePrompt);

//         const result: MuseumAnalysisResult = {
//             paintingName: analysis.paintingName,
//             artist: analysis.artist,
//             genre: analysis.genre,
//             historicalPrompt: analysis.historicalPrompt,
//             immersivePrompt: analysis.immersivePrompt,
//             audioUri: audioUri,
//             imageUri: imageUri,
//         };

//         console.log('🎉 Complete analysis finished!');
//         console.log('Result:', {
//             ...result,
//             audioUri: audioUri ? '✅ Generated' : '❌ Failed'
//         });

//         return result;

//     } catch (error) {
//         console.error('❌ Complete analysis failed:', error);
//         throw error;
//     }
// }

// // Export default for easy import
// export default analyzeMuseumImage;










// utils/analyzeImageWithNavigator.ts
// Updated to support Museum, Monument, and Landscape modes

import * as FileSystem from 'expo-file-system';

// ============= TYPE DEFINITIONS =============
interface ChatCompletionResponse {
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
  }>;
}

interface SunoGenerateResponse {
  code: number;
  msg: string;
  data: {
    taskId: string;
  };
}

interface SunoStatusResponse {
  code: number;
  msg: string;
  data: {
    taskId: string;
    parentMusicId?: string;
    param?: string;
    response?: {
      taskId: string;
      sunoData?: Array<{
        id: string;
        audioUrl: string;
        streamAudioUrl?: string;
        imageUrl?: string;
        prompt?: string;
        modelName?: string;
        title?: string;
        tags?: string;
        createTime?: string;
        duration?: number;
      }>;
    };
    status: 'PENDING' | 'TEXT_SUCCESS' | 'FIRST_SUCCESS' | 'SUCCESS' | 
            'CREATE_TASK_FAILED' | 'GENERATE_AUDIO_FAILED' | 
            'CALLBACK_EXCEPTION' | 'SENSITIVE_WORD_ERROR';
    type?: string;
    operationType?: string;
    errorCode?: number | null;
    errorMessage?: string | null;
  };
}

// Generic result type that works for all modes
export interface AnalysisResult {
  paintingName: string;
  name: string;           // Painting name / Monument name / Landscape name
  creator: string;        // Artist / Architect or Culture / Location
  category: string;       // Genre / Monument Type / Landscape Type
  historicalPrompt: string; // max 500 chars
  immersivePrompt: string;  // max 400 chars
  audioUri: string | null;
  imageUri: string;
  mode: 'museum' | 'monuments' | 'landscape';
}

// Legacy type for backwards compatibility
export type MuseumAnalysisResult = AnalysisResult;

// ============= API CONFIGURATION =============
const NAVIGATOR_API_KEY = 'sk-SwCA-nMn6Z1Zz1F0UXDzgQ';
const SUNO_API_KEY = '4acad3fb927c19ca28eadf14383da5e7';
const NAVIGATOR_BASE_URL = 'https://api.ai.it.ufl.edu/v1/';
const SUNO_BASE_URL = 'https://api.sunoapi.org';
const MODEL = 'mistral-small-3.1';

// ============= HELPER: Convert Image to Base64 =============
const convertImageToBase64 = async (uri: string): Promise<string> => {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();

    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        } else {
          reject(new Error('Failed to convert image to base64'));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    throw error;
  }
};

// ============= MODE-SPECIFIC PROMPTS =============
const getModePrompts = (mode: 'museum' | 'monuments' | 'landscape') => {
  if (mode === 'museum') {
    return {
      metadata: `Analyze this artwork and provide ONLY the following information in this EXACT JSON format (no additional text):
{
  "name": "exact title of the painting",
  "creator": "full name of the artist",
  "category": "art movement or genre (e.g., Impressionism, Renaissance, Modern Art)"
}`,
      historical: `Provide a historical and descriptive analysis of this artwork. Include:
- Historical context and period
- Artistic significance
- What the image depicts
- Cultural importance

IMPORTANT: Your response must be EXACTLY 500 characters or less. Be concise and informative, like a museum description.`,
      immersive: `Describe this image in a poetic, immersive way that captures:
- The color palette and lighting (be specific: "soft blues", "warm amber glow", etc.)
- The setting and atmosphere
- The emotions and mood evoked
- The relationship between subjects or elements
- The feeling of the scene
- Movement and dynamics
- Physical details that create emotion (posture, expressions, gestures)

Write 3-4 sentences in present tense, as if describing a living moment. Focus on sensory details and emotional weight.

IMPORTANT: Your response must be EXACTLY 400 characters or less. Focus on sensory details and emotional weight.`,
      musicStyle: 'Classical',
      musicNegativeTags: 'Heavy Metal, Upbeat Drums, Rock'
    };
  } else if (mode === 'monuments') {
    return {
      metadata: `Analyze this monument/landmark and provide ONLY the following information in this EXACT JSON format (no additional text):
{
  "name": "exact name of the monument or landmark",
  "creator": "architect name, culture, or 'Built by [civilization]' (e.g., 'Ancient Egyptians', 'Gustave Eiffel')",
  "category": "type of monument (e.g., Pyramid, Temple, Tower, Memorial, Ancient Wonder)"
}`,
      historical: `Provide historical information about this monument. Include:
- When it was built and by whom
- Historical significance and purpose
- Architectural features and construction methods
- Its role in history and culture
- Current status and importance

IMPORTANT: Your response must be EXACTLY 500 characters or less. Be informative like a historical placard.`,
      immersive: `Describe this monument in an evocative way that captures:
- The scale and grandeur of the structure
- The atmosphere and setting (time of day, weather, surroundings)
- The emotions it evokes (awe, reverence, mystery, power)
- The sense of history and timelessness
- Architectural details that stand out
- The feeling of standing before it

Write 3-4 sentences in present tense that transport the reader to the location.

IMPORTANT: Your response must be EXACTLY 400 characters or less. Focus on the immersive experience.`,
      musicStyle: 'Epic Orchestral, Cinematic',
      musicNegativeTags: 'Pop, Dance, Electronic'
    };
  } else { // landscape
    return {
      metadata: `Analyze this landscape/natural scene and provide ONLY the following information in this EXACT JSON format (no additional text):
{
  "name": "descriptive name of the landscape (e.g., 'Mountain Valley at Sunset', 'Coastal Cliffs')",
  "creator": "location or region (e.g., 'Yosemite National Park', 'Scottish Highlands', 'Nature')",
  "category": "landscape type (e.g., Mountains, Ocean, Forest, Desert, Valley, Lake)"
}`,
      historical: `Provide information about this natural landscape. Include:
- Geographic location and features
- Geological formation and natural history
- Ecological significance
- Any cultural or historical connections
- What makes this landscape unique or notable

IMPORTANT: Your response must be EXACTLY 500 characters or less. Be descriptive like a nature guide.`,
      immersive: `Describe this landscape in a poetic, sensory way that captures:
- The colors, textures, and natural elements
- The atmosphere (weather, light, time of day)
- The sounds, smells, and feeling of the place
- The sense of peace, grandeur, or wildness
- The relationship between earth, sky, and water
- The mood and emotions it evokes

Write 3-4 sentences in present tense that bring the landscape to life.

IMPORTANT: Your response must be EXACTLY 400 characters or less. Focus on sensory immersion.`,
      musicStyle: 'Ambient, Nature Sounds, Peaceful',
      musicNegativeTags: 'Heavy Metal, Aggressive, Loud Drums'
    };
  }
};

// ============= MAIN ANALYSIS FUNCTION =============
async function analyzeWithNavigator(
  imageUri: string,
  mode: 'museum' | 'monuments' | 'landscape'
): Promise<{
  name: string;
  creator: string;
  category: string;
  historicalPrompt: string;
  immersivePrompt: string;
}> {
  try {
    console.log(`🎨 Step 1: Converting image to base64 for ${mode} mode...`);
    const base64Image = await convertImageToBase64(imageUri);
    const imageDataUrl = `data:image/jpeg;base64,${base64Image}`;

    const prompts = getModePrompts(mode);

    // PROMPT 1: Get metadata (name, creator, category)
    console.log(`🎨 Step 2: Getting ${mode} metadata...`);
    const metadataResponse = await fetch(NAVIGATOR_BASE_URL + 'chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${NAVIGATOR_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompts.metadata },
              { type: 'image_url', image_url: { url: imageDataUrl } },
            ],
          },
        ],
      }),
    });

    if (!metadataResponse.ok) {
      throw new Error(`Failed to get ${mode} metadata`);
    }

    const metadataData: ChatCompletionResponse = await metadataResponse.json();
    const metadataContent = metadataData.choices[0]?.message?.content || '';
    
    let metadata;
    try {
      metadata = JSON.parse(metadataContent);
    } catch {
      metadata = {
        name: `Unknown ${mode === 'museum' ? 'Artwork' : mode === 'monuments' ? 'Monument' : 'Landscape'}`,
        creator: mode === 'museum' ? 'Unknown Artist' : mode === 'monuments' ? 'Unknown' : 'Nature',
        category: `Unknown ${mode === 'museum' ? 'Genre' : 'Type'}`
      };
    }

    // PROMPT 2: Historical/Descriptive Analysis (500 chars)
    console.log(`🎨 Step 3: Getting historical description for ${mode}...`);
    const historicalResponse = await fetch(NAVIGATOR_BASE_URL + 'chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${NAVIGATOR_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompts.historical },
              { type: 'image_url', image_url: { url: imageDataUrl } },
            ],
          },
        ],
      }),
    });

    if (!historicalResponse.ok) {
      throw new Error('Failed to get historical description');
    }

    const historicalData: ChatCompletionResponse = await historicalResponse.json();
    let historicalDescription = historicalData.choices[0]?.message?.content || '';
    
    if (historicalDescription.length > 500) {
      historicalDescription = historicalDescription.substring(0, 497) + '...';
    }

    // PROMPT 3: Immersive/Emotional Description (400 chars)
    console.log(`🎨 Step 4: Getting immersive description for ${mode}...`);
    const immersiveResponse = await fetch(NAVIGATOR_BASE_URL + 'chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${NAVIGATOR_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompts.immersive },
              { type: 'image_url', image_url: { url: imageDataUrl } },
            ],
          },
        ],
      }),
    });

    if (!immersiveResponse.ok) {
      throw new Error('Failed to get immersive description');
    }

    const immersiveData: ChatCompletionResponse = await immersiveResponse.json();
    let immersiveDescription = immersiveData.choices[0]?.message?.content || '';
    
    if (immersiveDescription.length > 400) {
      immersiveDescription = immersiveDescription.substring(0, 397) + '...';
    }

    console.log(`✅ ${mode} analysis complete:`, {
      name: metadata.name,
      creator: metadata.creator,
      category: metadata.category,
      historicalLength: historicalDescription.length,
      immersiveLength: immersiveDescription.length
    });

    return {
      name: metadata.name,
      creator: metadata.creator,
      category: metadata.category,
      historicalPrompt: historicalDescription,
      immersivePrompt: immersiveDescription,
    };

  } catch (error) {
    console.error(`❌ Navigator API ${mode} analysis error:`, error);
    throw new Error(`Failed to analyze ${mode}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// ============= MUSIC GENERATION =============
async function generateMusicWithSuno(
  prompt: string,
  mode: 'museum' | 'monuments' | 'landscape'
): Promise<string | null> {
  try {
    console.log(`🎵 Step 5: Starting Suno music generation for ${mode}...`);
    console.log('📝 Music prompt:', prompt);

    const prompts = getModePrompts(mode);

    const response = await fetch(`${SUNO_BASE_URL}/api/v1/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUNO_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt,
        customMode: false,
        instrumental: true,
        style: prompts.musicStyle,
        negativeTags: prompts.musicNegativeTags,
        model: 'V4_5',
        audioWeight: 0.65,
        callBackUrl: 'https://webhook.site/#!/view/00000000-0000-0000-0000-000000000000',
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result: SunoGenerateResponse = await response.json();
    console.log('📡 Suno API Response:', JSON.stringify(result, null, 2));

    if (result.code !== 200) {
      throw new Error(`Suno API Error (${result.code}): ${result.msg}`);
    }

    const taskId = result.data?.taskId;
    if (!taskId) {
      throw new Error('No taskId returned from Suno API');
    }

    console.log('✅ Task created successfully');
    console.log(`   Task ID: ${taskId}`);
    console.log('⏳ Starting polling for completion...');

    const audioUrl = await pollSunoTaskStatus(taskId);
    return audioUrl;

  } catch (error) {
    console.error('❌ Suno music generation error:', error);
    if (error instanceof Error) {
      console.error('   Error details:', error.message);
    }
    return null;
  }
}

// ============= HELPER: Poll Suno Task Status =============
async function pollSunoTaskStatus(taskId: string): Promise<string | null> {
  const maxAttempts = 120;
  const pollInterval = 5000;
  let attempts = 0;

  console.log(`⏰ Starting polling (max ${maxAttempts * pollInterval / 1000 / 60} minutes)...`);

  while (attempts < maxAttempts) {
    try {
      console.log(`🔍 Checking task status (attempt ${attempts + 1}/${maxAttempts})...`);

      const response = await fetch(
        `${SUNO_BASE_URL}/api/v1/generate/record-info?taskId=${taskId}`,
        {
          headers: {
            'Authorization': `Bearer ${SUNO_API_KEY}`,
          },
        }
      );

      if (!response.ok) {
        console.warn(`⚠️  API returned status ${response.status}, retrying...`);
        attempts++;
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        continue;
      }

      const result = await response.json();
      
      if (result.code !== 200) {
        console.error(`❌ API Error: ${result.msg}`);
        return null;
      }

      const status = result.data?.status;

      console.log(`📊 Status: ${status} | Attempt: ${attempts + 1}/${maxAttempts} | Time: ${Math.round((attempts + 1) * pollInterval / 1000)}s`);

      if (status === 'SUCCESS') {
        const sunoData = result.data.response?.sunoData;
        if (sunoData && sunoData.length > 0) {
          const firstTrack = sunoData[0];
          const audioUrl = firstTrack.audioUrl;
          
          console.log('✅ Music generation SUCCESS!');
          console.log(`   Title: ${firstTrack.title || 'Untitled'}`);
          console.log(`   Duration: ${firstTrack.duration || 0}s`);
          console.log(`   Audio URL: ${audioUrl}`);
          console.log(`⏱️  Total time: ${(attempts * pollInterval) / 1000} seconds`);
          
          return audioUrl;
        } else {
          console.error('❌ SUCCESS status but no audio data found');
          return null;
        }
      }

      if (status === 'FIRST_SUCCESS') {
        console.log('🎵 First track completed, waiting for all tracks...');
      }

      if (status === 'TEXT_SUCCESS') {
        console.log('📝 Text generation completed, waiting for audio...');
      }

      if (status === 'PENDING') {
        console.log(`⏳ Task pending... (${Math.round((attempts + 1) * pollInterval / 1000)}s elapsed)`);
      }

      if (status === 'CREATE_TASK_FAILED' || 
          status === 'GENERATE_AUDIO_FAILED' || 
          status === 'CALLBACK_EXCEPTION' || 
          status === 'SENSITIVE_WORD_ERROR') {
        console.error(`❌ Generation failed with status: ${status}`);
        console.error(`   Error: ${result.data?.errorMessage || 'Unknown error'}`);
        return null;
      }

      await new Promise(resolve => setTimeout(resolve, pollInterval));
      attempts++;

    } catch (error) {
      console.error('❌ Error checking task status:', error);
      console.log('🔄 Retrying in 5 seconds...');
      await new Promise(resolve => setTimeout(resolve, pollInterval));
      attempts++;
    }
  }

  console.error(`❌ Music generation timeout after ${maxAttempts * pollInterval / 1000 / 60} minutes`);
  return null;
}

// ============= MAIN EXPORTS =============

/**
 * Analyze any image (museum, monument, or landscape)
 */
export async function analyzeImage(
  imageUri: string,
  mode: 'museum' | 'monuments' | 'landscape'
): Promise<AnalysisResult> {
  try {
    console.log(`🚀 Starting complete ${mode} image analysis...`);
    console.log('Image URI:', imageUri);

    // Step 1-4: Analyze with Navigator AI
    const analysis = await analyzeWithNavigator(imageUri, mode);

    // Step 5-6: Generate music with Suno API
    const audioUri = await generateMusicWithSuno(analysis.immersivePrompt, mode);

    const result: AnalysisResult = {
      name: analysis.name,
      creator: analysis.creator,
      category: analysis.category,
      historicalPrompt: analysis.historicalPrompt,
      immersivePrompt: analysis.immersivePrompt,
      audioUri: audioUri,
      imageUri: imageUri,
      mode: mode,
    };

    console.log(`🎉 Complete ${mode} analysis finished!`);
    console.log('Result:', {
      ...result,
      audioUri: audioUri ? '✅ Generated' : '❌ Failed'
    });

    return result;

  } catch (error) {
    console.error(`❌ Complete ${mode} analysis failed:`, error);
    throw error;
  }
}

// Legacy export for backwards compatibility
export async function analyzeMuseumImage(imageUri: string): Promise<AnalysisResult> {
  return analyzeImage(imageUri, 'museum');
}

export default analyzeImage;
// // utils/api.ts
// // API utility for connecting to your FastAPI backend

// import { Platform } from 'react-native';

// // Automatically detect the correct URL based on platform
// const getApiBaseUrl = () => {
//   // For production, use your deployed backend URL
//   const PRODUCTION_URL = 'https://your-backend-url.com'; // TODO: Update this when deploying

//   // For development
//   if (__DEV__) {
//     // Android emulator needs special IP
//     if (Platform.OS === 'android') {
//       return 'http://10.0.2.2:8000';
//     }
//     // iOS simulator and web can use localhost
//     return 'http://10.138.236.106:8000';
//   }

//   // Production
//   return PRODUCTION_URL;
// };

// const API_BASE_URL = getApiBaseUrl();

// console.log(`🔗 API Base URL: ${API_BASE_URL}`);

// export interface ImageAnalysisData {
//   id?: string;
//   image_name: string;
//   analysis_type: string;
//   descriptions: string[];
//   metadata: {
//     artist?: string;
//     genre?: string;
//     imageUri?: string;
//     audioUri?: string;
//     historicalPrompt?: string;
//     immersivePrompt?: string;
//     type?: string;
//     emotions?: string[];
//     [key: string]: any;
//   };
//   created_at?: string;
//   updated_at?: string;
// }

// export class ARTapi {
//   /**
//    * Save museum analysis to database
//    */
//   static async saveMuseumAnalysis(data: {
//     paintingName: string;
//     artist: string;
//     genre: string;
//     historicalPrompt: string;
//     immersivePrompt: string;
//     audioUri: string | null;
//     imageUri: string;
//   }): Promise<ImageAnalysisData> {
//     try {
//       const payload: ImageAnalysisData = {
//         image_name: data.paintingName,
//         analysis_type: 'museum',
//         descriptions: [
//           data.historicalPrompt,
//           data.immersivePrompt,
//         ],
//         metadata: {
//           artist: data.artist,
//           genre: data.genre,
//           imageUri: data.imageUri,
//           audioUri: data.audioUri || undefined,
//           historicalPrompt: data.historicalPrompt,
//           immersivePrompt: data.immersivePrompt,
//           type: 'painting',
//         },
//       };

//       console.log('📤 Saving to database:', payload);

//       const response = await fetch(`${API_BASE_URL}/api/image-analysis`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(payload),
//       });

//       if (!response.ok) {
//         const errorText = await response.text();
//         throw new Error(`API Error: ${response.status} - ${errorText}`);
//       }

//       const result = await response.json();
//       console.log('✅ Saved to database with ID:', result.id);
//       return result;

//     } catch (error) {
//       console.error('❌ Failed to save analysis:', error);
//       throw error;
//     }
//   }

//   /**
//    * Get all analyses (with optional filter by type)
//    */
//   static async getAllAnalyses(analysisType?: string): Promise<ImageAnalysisData[]> {
//     try {
//       const url = analysisType
//         ? `${API_BASE_URL}/api/image-analysis?analysis_type=${analysisType}`
//         : `${API_BASE_URL}/api/image-analysis`;

//       const response = await fetch(url);

//       if (!response.ok) {
//         throw new Error(`Failed to fetch analyses: ${response.status}`);
//       }

//       const data = await response.json();
//       return data;

//     } catch (error) {
//       console.error('❌ Failed to fetch analyses:', error);
//       throw error;
//     }
//   }

//   /**
//    * Get specific analysis by ID
//    */
//   static async getAnalysisById(id: string): Promise<ImageAnalysisData> {
//     try {
//       const response = await fetch(`${API_BASE_URL}/api/image-analysis/${id}`);

//       if (!response.ok) {
//         throw new Error(`Failed to fetch analysis: ${response.status}`);
//       }

//       const data = await response.json();
//       return data;

//     } catch (error) {
//       console.error('❌ Failed to fetch analysis:', error);
//       throw error;
//     }
//   }

//   /**
//    * Search analyses by name
//    */
//   static async searchAnalysesByName(name: string): Promise<ImageAnalysisData[]> {
//     try {
//       const response = await fetch(
//         `${API_BASE_URL}/api/image-analysis/search/${encodeURIComponent(name)}`
//       );

//       if (!response.ok) {
//         throw new Error(`Failed to search analyses: ${response.status}`);
//       }

//       const data = await response.json();
//       return data;

//     } catch (error) {
//       console.error('❌ Failed to search analyses:', error);
//       throw error;
//     }
//   }

//   /**
//    * Search for existing analysis by image URI
//    * Returns the first match if found, null otherwise
//    */
//   static async findByImageUri(imageUri: string): Promise<ImageAnalysisData | null> {
//     try {
//       const response = await fetch(`${API_BASE_URL}/api/image-analysis`);

//       if (!response.ok) {
//         console.warn(`Backend returned ${response.status}, skipping cache lookup`);
//         return null;
//       }

//       const allAnalyses: ImageAnalysisData[] = await response.json();

//       // Find analysis with matching imageUri in metadata
//       const found = allAnalyses.find(
//         (analysis) => analysis.metadata?.imageUri === imageUri
//       );

//       return found || null;

//     } catch (error) {
//       console.warn('Cache lookup by URI failed (non-critical):', error);
//       return null; // Return null on error, don't block the flow
//     }
//   }

//   /**
//    * Search for existing analysis by painting name
//    * Returns the first match if found, null otherwise
//    */
//   static async findByPaintingName(paintingName: string): Promise<ImageAnalysisData | null> {
//     try {
//       const response = await fetch(`${API_BASE_URL}/api/image-analysis`);

//       if (!response.ok) {
//         console.warn(`Backend returned ${response.status}, skipping cache lookup`);
//         return null;
//       }

//       const allAnalyses: ImageAnalysisData[] = await response.json();

//       // Find analysis with matching painting name (case-insensitive)
//       const found = allAnalyses.find(
//         (analysis) => analysis.image_name.toLowerCase() === paintingName.toLowerCase()
//       );

//       return found || null;

//     } catch (error) {
//       console.warn('Cache lookup by name failed (non-critical):', error);
//       return null; // Return null on error, don't block the flow
//     }
//   }

//   /**
//    * Update existing analysis
//    */
//   static async updateAnalysis(
//     id: string,
//     updates: {
//       descriptions?: string[];
//       metadata?: any;
//     }
//   ): Promise<ImageAnalysisData> {
//     try {
//       const response = await fetch(`${API_BASE_URL}/api/image-analysis/${id}`, {
//         method: 'PUT',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(updates),
//       });

//       if (!response.ok) {
//         throw new Error(`Failed to update analysis: ${response.status}`);
//       }

//       const data = await response.json();
//       return data;

//     } catch (error) {
//       console.error('❌ Failed to update analysis:', error);
//       throw error;
//     }
//   }

//   /**
//    * Delete analysis
//    */
//   static async deleteAnalysis(id: string): Promise<void> {
//     try {
//       const response = await fetch(`${API_BASE_URL}/api/image-analysis/${id}`, {
//         method: 'DELETE',
//       });

//       if (!response.ok) {
//         throw new Error(`Failed to delete analysis: ${response.status}`);
//       }

//       console.log('✅ Analysis deleted');

//     } catch (error) {
//       console.error('❌ Failed to delete analysis:', error);
//       throw error;
//     }
//   }
// }

// export default ARTapi;







// utils/api.ts
// API utility for connecting to FastAPI backend - supports all modes

import { Platform } from 'react-native';
import { AnalysisResult } from './analyzeImageWithNavigator';

// Automatically detect the correct URL based on platform
const getApiBaseUrl = () => {
  const PRODUCTION_URL = 'https://your-backend-url.com'; // TODO: Update for production

  if (__DEV__) {
    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:8000';
    }
    return 'http://100.70.109.21:8000';
  }

  return PRODUCTION_URL;
};

const API_BASE_URL = getApiBaseUrl();

console.log(`🔗 API Base URL: ${API_BASE_URL}`);

export interface ImageAnalysisData {
  id?: string;
  image_name: string;
  analysis_type: string;
  descriptions: string[];
  metadata: {
    creator?: string;
    category?: string;
    imageUri?: string;
    audioUri?: string;
    historicalPrompt?: string;
    immersivePrompt?: string;
    type?: string;
    emotions?: string[];
    mode?: string;
    [key: string]: any;
  };
  created_at?: string;
  updated_at?: string;
}

export class ARTapi {
  /**
   * Save analysis to database (works for all modes)
   */
  static async saveAnalysis(data: AnalysisResult): Promise<ImageAnalysisData> {
    try {
      const payload: ImageAnalysisData = {
        image_name: data.name,
        analysis_type: data.mode,
        descriptions: [
          data.historicalPrompt,
          data.immersivePrompt,
        ],
        metadata: {
          creator: data.creator,
          category: data.category,
          imageUri: data.imageUri,
          audioUri: data.audioUri || undefined,
          historicalPrompt: data.historicalPrompt,
          immersivePrompt: data.immersivePrompt,
          mode: data.mode,
          type: data.mode === 'museum' ? 'painting' :
            data.mode === 'monuments' ? 'monument' : 'landscape',
        },
      };

      console.log(`📤 Saving ${data.mode} analysis to database:`, payload);

      const response = await fetch(`${API_BASE_URL}/api/image-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Saved to database with ID:', result.id);
      return result;

    } catch (error) {
      console.error('❌ Failed to save analysis:', error);
      throw error;
    }
  }

  /**
   * Legacy method for backwards compatibility
   */
  static async saveMuseumAnalysis(data: {
    paintingName: string;
    artist: string;
    genre: string;
    historicalPrompt: string;
    immersivePrompt: string;
    audioUri: string | null;
    imageUri: string;
  }): Promise<ImageAnalysisData> {
    const analysisResult: AnalysisResult = {
      name: data.paintingName,
      creator: data.artist,
      category: data.genre,
      historicalPrompt: data.historicalPrompt,
      immersivePrompt: data.immersivePrompt,
      audioUri: data.audioUri,
      imageUri: data.imageUri,
      mode: 'museum',
    };
    return this.saveAnalysis(analysisResult);
  }

  /**
   * Get all analyses (with optional filter by type)
   */
  static async getAllAnalyses(analysisType?: string): Promise<ImageAnalysisData[]> {
    try {
      const url = analysisType
        ? `${API_BASE_URL}/api/image-analysis?analysis_type=${analysisType}`
        : `${API_BASE_URL}/api/image-analysis`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch analyses: ${response.status}`);
      }

      const data = await response.json();
      return data;

    } catch (error) {
      console.error('❌ Failed to fetch analyses:', error);
      throw error;
    }
  }

  /**
   * Get specific analysis by ID
   */
  static async getAnalysisById(id: string): Promise<ImageAnalysisData> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/image-analysis/${id}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch analysis: ${response.status}`);
      }

      const data = await response.json();
      return data;

    } catch (error) {
      console.error('❌ Failed to fetch analysis:', error);
      throw error;
    }
  }

  /**
   * Search analyses by name
   */
  static async searchAnalysesByName(name: string): Promise<ImageAnalysisData[]> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/image-analysis/search/${encodeURIComponent(name)}`
      );

      if (!response.ok) {
        throw new Error(`Failed to search analyses: ${response.status}`);
      }

      const data = await response.json();
      return data;

    } catch (error) {
      console.error('❌ Failed to search analyses:', error);
      throw error;
    }
  }

  /**
   * Update existing analysis
   */
  static async updateAnalysis(
    id: string,
    updates: {
      descriptions?: string[];
      metadata?: any;
    }
  ): Promise<ImageAnalysisData> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/image-analysis/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(`Failed to update analysis: ${response.status}`);
      }

      const data = await response.json();
      return data;

    } catch (error) {
      console.error('❌ Failed to update analysis:', error);
      throw error;
    }
  }

  /**
   * Delete analysis
   */
  static async deleteAnalysis(id: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/image-analysis/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete analysis: ${response.status}`);
      }

      console.log('✅ Analysis deleted');

    } catch (error) {
      console.error('❌ Failed to delete analysis:', error);
      throw error;
    }
  }
}

export default ARTapi;
/**
 * Placeholder analyzer for captured/selected images.
 * Returns a mocked recognition result after a short delay.
 * Replace with real API integration (Suno for audio generation + Vision API or custom ML model).
 */
export type AnalysisResult = {
  imageUri: string;
  title: string;
  artist?: string;
  type?: string;
  description: string;
  emotions: string[]; // color-coded tags
  audioUri?: string; // optional preloaded audio fallback
};

export async function analyzeImage(imageUri: string, mode: 'museum' | 'monuments' | 'landscape'): Promise<AnalysisResult> {
  // Simulate processing time
  await new Promise((res) => setTimeout(res, 1800));

  // Mock results depending on mode
  if (mode === 'museum') {
    return {
      imageUri,
      title: 'Starry Night (demo)',
      artist: 'Vincent van Gogh',
      type: 'Post-Impressionism',
      description: 'A swirling night sky above a small town; emotions: wonder and longing.',
      emotions: ['calm', 'dreamy'],
      audioUri: undefined,
    };
  }

  if (mode === 'monuments') {
    return {
      imageUri,
      title: 'Eiffel Tower (demo)',
      artist: 'Gustave Eiffel (engineer)',
      type: 'Monument',
      description: 'A wrought-iron lattice tower in Paris; evokes romance and grandeur.',
      emotions: ['romantic', 'majestic'],
      audioUri: undefined,
    };
  }

  // landscape
  return {
    imageUri,
    title: 'Rolling Hills (demo)',
    type: 'Landscape',
    description: 'A peaceful green panorama; evokes calm and serenity.',
    emotions: ['calm', 'serene'],
    audioUri: undefined,
  };
}
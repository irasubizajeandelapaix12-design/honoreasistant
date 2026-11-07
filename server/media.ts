import { GoogleGenAI, Modality } from '@google/genai';
import { isValidGeminiApiKey } from './ai.js';

let aiClient: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI {
  const key = process.env.GEMINI_API_KEY;
  if (!isValidGeminiApiKey(key)) {
    throw new Error('Media creation requires a valid Gemini API key.');
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

/**
 * Generate music using Lyria (lyria-3-clip-preview or lyria-3-pro-preview)
 */
export async function generateMusicLyria(params: {
  prompt: string;
  model?: 'lyria-3-clip-preview' | 'lyria-3-pro-preview';
  imageBase64?: string;
  imageMimeType?: string;
}): Promise<{ audioBase64: string; mimeType: string; lyrics?: string }> {
  const ai = getAiClient();
  const model = params.model || 'lyria-3-clip-preview';

  let contents: any;
  if (params.imageBase64) {
    contents = {
      parts: [
        { text: params.prompt },
        {
          inlineData: {
            data: params.imageBase64,
            mimeType: params.imageMimeType || 'image/jpeg',
          },
        },
      ],
    };
  } else {
    contents = params.prompt;
  }

  const response = await ai.models.generateContentStream({
    model,
    contents,
    config: {
      responseModalities: [Modality.AUDIO],
    },
  });

  let audioBase64 = '';
  let lyrics = '';
  let mimeType = 'audio/wav';

  for await (const chunk of response) {
    const parts = (chunk as any).candidates?.[0]?.content?.parts;
    if (!parts) continue;

    for (const part of parts) {
      if (part.inlineData?.data) {
        if (!audioBase64 && part.inlineData.mimeType) {
          mimeType = part.inlineData.mimeType;
        }
        audioBase64 += part.inlineData.data;
      }
      if (part.text && !lyrics) {
        lyrics = part.text;
      }
    }
  }

  if (!audioBase64) {
    throw new Error('Music generation completed without audio data returned.');
  }

  return { audioBase64, mimeType, lyrics };
}

/**
 * Generate or edit images using gemini-nano-banana-2.1 or gemini-3.1-flash-lite-image
 */
export async function generateImageBanana(params: {
  prompt: string;
  model?: string;
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
  baseImageBase64?: string;
  baseImageMimeType?: string;
}): Promise<{ imageUrl: string; mimeType: string }> {
  const ai = getAiClient();
  const model = params.model || 'gemini-nano-banana-2.1';
  const aspectRatio = params.aspectRatio || '1:1';

  let input: any;
  if (params.baseImageBase64) {
    // Image editing mode
    input = [
      {
        type: 'image',
        data: params.baseImageBase64,
        mime_type: params.baseImageMimeType || 'image/png',
      },
      {
        type: 'text',
        text: params.prompt,
      },
    ];
  } else {
    input = params.prompt;
  }

  const interaction = await ai.interactions.create({
    model,
    input,
    response_modalities: ['image', 'text'],
    generation_config: {
      image_config: {
        aspect_ratio: aspectRatio,
        image_size: '1K',
      },
    },
  });

  for (const step of interaction.steps) {
    if (step.type === 'model_output') {
      const imgContent = step.content?.find(c => c.type === 'image');
      if (imgContent && imgContent.data) {
        const mimeType = imgContent.mime_type || 'image/png';
        const imageUrl = `data:${mimeType};base64,${imgContent.data}`;
        return { imageUrl, mimeType };
      }
    }
  }

  // Fallback to output_image helper
  if (interaction.output_image?.data) {
    const mimeType = interaction.output_image.mime_type || 'image/png';
    return {
      imageUrl: `data:${mimeType};base64,${interaction.output_image.data}`,
      mimeType,
    };
  }

  throw new Error('Image model did not produce an image. Please refine your prompt.');
}

/**
 * Generate or animate video using gemini-omni-1.1-flash (Interactions API)
 */
export async function generateVideoOmni(params: {
  prompt: string;
  aspectRatio?: '16:9' | '9:16';
  duration?: '5s' | '10s';
  resolution?: '720p' | '360p' | '1080p';
  startingFrameBase64?: string;
  startingFrameMimeType?: string;
}): Promise<{ videoUrl: string; mimeType: string }> {
  const ai = getAiClient();
  const aspectRatio = params.aspectRatio || '16:9';
  const duration = params.duration || '5s';
  const resolution = params.resolution || '720p';

  let input: any;
  if (params.startingFrameBase64) {
    // Image-to-video (animate image)
    input = [
      {
        type: 'image',
        mime_type: params.startingFrameMimeType || 'image/png',
        data: params.startingFrameBase64,
      },
      {
        type: 'text',
        text: params.prompt,
      },
    ];
  } else {
    // Text-to-video
    input = params.prompt;
  }

  const interaction = await ai.interactions.create(
    {
      model: 'gemini-omni-1.2-flash',
      input,
      background: false,
      store: false,
      stream: false,
      response_format: {
        type: 'video',
        aspect_ratio: aspectRatio,
        duration,
        resolution,
      },
    },
    { timeout: 300000 }
  );

  const videoPart = interaction.output_video;
  if (videoPart && videoPart.data) {
    const mimeType = videoPart.mime_type || 'video/mp4';
    return {
      videoUrl: `data:${mimeType};base64,${videoPart.data}`,
      mimeType,
    };
  }

  throw new Error('Video generation failed or timed out. Please try a shorter prompt.');
}

/**
 * Transcribe recorded or uploaded audio using gemini-3.5-transcribe
 */
export async function transcribeAudioGemini(params: {
  audioBase64: string;
  mimeType?: string;
  prompt?: string;
}): Promise<{ text: string }> {
  const ai = getAiClient();
  const mimeType = params.mimeType || 'audio/webm';

  const interaction = await ai.interactions.create({
    model: 'gemini-3.5-transcribe',
    input: [
      {
        type: 'audio',
        data: params.audioBase64,
        mime_type: mimeType,
      },
      {
        type: 'text',
        text: params.prompt || 'Please provide an exact, accurate verbatim transcription of this audio. Preserve punctuation and timestamps where relevant.',
      },
    ],
  });

  const outputText = interaction.output_text;
  if (outputText && outputText.trim()) {
    return { text: outputText.trim() };
  }

  // Iterate steps if output_text was null
  for (const step of interaction.steps) {
    if (step.type === 'model_output') {
      const textPart = step.content?.find(c => c.type === 'text');
      if (textPart?.text) {
        return { text: textPart.text.trim() };
      }
    }
  }

  return { text: 'No speech detected in audio file.' };
}

import express from 'express';
import { GoogleGenAI } from '@google/genai';

const router = express.Router();

// Get API key from environment
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error('GEMINI_API_KEY environment variable not set');
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

router.post('/generate-image', async (req, res) => {
  const { prompt, width = 512, height = 512 } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Missing prompt' });
  }

  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: 'Gemini API key not configured' });
  }

  try {
    console.log(`[Image API] Generating image for prompt: "${prompt}"`);

    // Use Gemini's image generation model
    const model = 'gemini-2.0-flash-exp'; // Use the experimental model that supports image generation

    const response = await ai.models.generateContent({
      model: model,
      contents: `Generate an image based on this prompt: ${prompt}. Make it ${width}x${height} pixels.`,
    });

    // Extract image data from response
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        // Convert base64 data to data URL
        const imageData = part.inlineData.data;
        const mimeType = part.inlineData.mimeType || 'image/png';
        const dataUrl = `data:${mimeType};base64,${imageData}`;

        console.log(`[Image API] Successfully generated image with Gemini`);

        return res.json({
          imageUrl: dataUrl,
          metadata: {
            model: model,
            provider: 'gemini',
            prompt: prompt,
            dimensions: `${width}x${height}`
          }
        });
      }
    }

    // If no image data found
    console.warn('[Image API] No image data received from Gemini');
    return res.status(500).json({ error: 'No image data returned from Gemini API' });

  } catch (err) {
    console.error('[Image API] Image generation failed:', err);
    return res.status(500).json({
      error: 'Image generation failed',
      details: err.message,
      prompt: prompt
    });
  }
});

export default router;

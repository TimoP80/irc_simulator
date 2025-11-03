import express from 'express';
import { getImageGenerationService } from '../dist-server/services/imageGenerationService.js';
import { imageDebug } from '../dist-server/utils/debugLogger.js';

const app = express();
const port = process.env.PORT || 3002;

app.use(express.json());

// Middleware to handle CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  next();
});

// Endpoint to generate an image
app.post('/generate-image', async (req, res) => {
  const { prompt, config } = req.body;

  if (!prompt) {
    return res.status(400).json({ success: false, error: 'Prompt is required' });
  }

  try {
    // Configure the service with the provided config
    const imageService = getImageGenerationService(config);
    
    imageDebug.log('Received request to generate image with prompt:', prompt);
    
    const result = await imageService.generateImage({ prompt });
    
    if (result.success) {
      imageDebug.log('Successfully generated image:', result.imageUrl);
      res.json(result);
    } else {
      imageDebug.error('Image generation failed:', result.error);
      res.status(500).json(result);
    }
  } catch (error) {
    imageDebug.error('Error in /generate-image endpoint:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Image generation proxy server listening on port ${port}`);
});
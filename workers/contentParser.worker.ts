// Web Worker for offloading heavy content parsing and formatting
// This worker extracts links and images from message content and returns cleaned content

export type ParseRequest = {
  id: number;
  type: 'process';
  content: string;
};

export type ParseResponse = {
  id: number;
  links: string[];
  images: string[];
  cleanedContent: string;
};

// Core parsing logic (ported from App.tsx extractLinksAndImages + removeUrlsFromContent)
function extractLinksAndImages(content: string): { links: string[]; images: string[] } {
  // Improved URL regex that handles more edge cases and doesn't truncate at common punctuation
  const urlRegex = /(https?:\/\/[^\s<>"]+)/gi;

  // List of unsafe domains to filter out
  const unsafeDomains = [
    '3lift.com',
    'ads.assemblyexchange.com',
    'doubleclick.net',
    'googlesyndication.com',
    'amazon-adsystem.com',
    'facebook.com/tr',
    'google-analytics.com',
    'googletagmanager.com',
    'imgur.com' // Block all imgur.com URLs to prevent JavaScript loading
  ];

  const isUnsafeUrl = (url: string): boolean => {
    return unsafeDomains.some(domain => url.toLowerCase().includes(domain.toLowerCase()));
  };

  // Function to detect Imgur URLs (for blocking)
  const isImgurUrl = (url: string): boolean => {
    return url.includes('imgur.com') || url.includes('i.imgur.com');
  };

  // Function to detect Rick Astley redirect URLs
  const isRickAstleyRedirect = (url: string): boolean => {
    const rickAstleyPatterns = [
      /dQw4w9WgXcQ/i,
      /rick.*astley/i,
      /never.*gonna.*give.*you.*up/i,
      /rickroll/i,
      /youtube\.com\/watch\?v=dQw4w9WgXcQ/i,
      /youtu\.be\/dQw4w9WgXcQ/i,
    ];
    return rickAstleyPatterns.some(pattern => pattern.test(url));
  };

  // Function to detect outdated YouTube links
  const isOutdatedYouTubeLink = (url: string): boolean => {
    if (!url.includes('youtube.com/') && !url.includes('youtu.be/')) return false;
    const outdatedPatterns = [
      /2010|2011|2012|2013|2014|2015/i,
      /old|classic|vintage|retro/i,
      /ancient|archived|deprecated/i,
      /legacy|obsolete|outdated/i,
    ];
    return outdatedPatterns.some(pattern => pattern.test(url));
  };

  // Function to detect potentially problematic YouTube links
  const isProblematicYouTubeLink = (url: string): boolean => {
    if (!url.includes('youtube.com/') && !url.includes('youtu.be/')) return false;
    const problematicPatterns = [
      /youtube\.com\/watch\?v=[a-zA-Z0-9_-]{11}/i,
      /youtu\.be\/[a-zA-Z0-9_-]{11}/i,
      /youtube\.com\/embed\/[a-zA-Z0-9_-]{11}/i,
      /youtube\.com\/v\/[a-zA-Z0-9_-]{11}/i,
    ];
    return problematicPatterns.some(pattern => pattern.test(url));
  };

  // Function to validate if URL is a direct image
  const isDirectImageUrl = (url: string): boolean => {
    if (url.includes('i.imgur.com/') && /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(url)) {
      return true;
    }
    const blockedDomains = [
      'imgbb.com',
      'imgur.com',
      'imgur.com/a/',
      'imgur.com/gallery/',
      'imgur.com/album/',
      'imgbox.com',
      '3lift.com',
      'eb2.3lift.com',
      'doubleclick.net',
      'googlesyndication.com',
      'googleadservices.com'
    ];
    if (blockedDomains.some(domain => url.includes(domain))) {
      return false;
    }

    // Only allow services with confirmed CORS support
    const corsCompliantPatterns = [
      /placehold\.co\/[0-9]+x[0-9]+(\/[a-fA-F0-9]{6})?(\/[a-fA-F0-9]{6})?(\/[a-z]+)?(\?.*)?$/i,
      /via\.placeholder\.com\/[0-9]+x[0-9]+(\/[a-fA-F0-9]{6})?(\/[a-fA-F0-9]{6})?(\?.*)?$/i,
    ];

    const problematicImageServices = [
      'gyazo.com', 'prnt.sc', 'postimg.cc', 'imgchest.com', 'freeimage.host',
      'imgbb.com', 'imgur.com', 'imgur.com/a/', 'imgur.com/gallery/', 'imgur.com/album/',
      'imgbox.com', '3lift.com', 'eb2.3lift.com', 'doubleclick.net', 'googlesyndication.com', 'googleadservices.com',
      'picsum.photos', 'httpbin.org', 'labs.google'
    ];
    if (problematicImageServices.some(service => url.includes(service))) {
      return false;
    }

    return corsCompliantPatterns.some(pattern => pattern.test(url));
  };

  // Extract all URLs once and process them efficiently
  const allUrls = content.match(urlRegex) || [];
  const uniqueUrls = Array.from(new Set(allUrls));

  const isImageUrl = (url: string): boolean => /\.(jpg|jpeg|png|gif|webp|svg)(\?[^\s<>"]*)?$/i.test(url);

  const safeImageUrls: string[] = [];
  const safeLinkUrls: string[] = [];

  for (const url of uniqueUrls) {
    if (isRickAstleyRedirect(url) || isOutdatedYouTubeLink(url) || isProblematicYouTubeLink(url) || isImgurUrl(url) || isUnsafeUrl(url)) {
      continue;
    }
    if (isImageUrl(url)) {
      if (isDirectImageUrl(url)) {
        safeImageUrls.push(url);
      }
    } else {
      safeLinkUrls.push(url);
    }
  }

  return { links: safeLinkUrls, images: safeImageUrls };
}

function removeUrlsFromContent(content: string, extractedUrls: string[]): string {
  if (extractedUrls.length === 0) return content;
  let cleanedContent = content;
  for (const url of extractedUrls) {
    const escapedUrl = url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const urlPattern = new RegExp(`\\s*${escapedUrl}\\s*`, 'gi');
    cleanedContent = cleanedContent.replace(urlPattern, ' ');
  }
  cleanedContent = cleanedContent.replace(/\s+/g, ' ').trim();
  return cleanedContent;
}

self.addEventListener('message', (event: MessageEvent<ParseRequest>) => {
  const data = event.data;
  if (!data || data.type !== 'process') return;
  try {
    const { links, images } = extractLinksAndImages(data.content);
    const allExtracted = [...links, ...images];
    const cleanedContent = allExtracted.length > 0 ? removeUrlsFromContent(data.content, allExtracted) : data.content;
    const response: ParseResponse = { id: data.id, links, images, cleanedContent };
    // @ts-ignore - web worker global
    (self as any).postMessage(response);
  } catch (err) {
    const response: ParseResponse = { id: data.id, links: [], images: [], cleanedContent: data.content };
    // @ts-ignore - web worker global
    (self as any).postMessage(response);
  }
});

export {};

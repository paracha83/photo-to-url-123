export interface Article {
  slug: string;
  title: string;
  excerpt: string;
  category: 'Guides' | 'Privacy' | 'Performance' | 'Developer' | 'Cheatsheet';
  readTime: string;
  date: string;
  author: string;
  tags: string[];
  featured?: boolean;
  content: {
    sectionTitle: string;
    paragraphs?: string[];
    codeBlock?: {
      language: string;
      title?: string;
      code: string;
    };
    codeBlocks?: {
      language: string;
      title?: string;
      code: string;
    }[];
    callout?: {
      type: 'tip' | 'warning' | 'info' | 'security';
      text: string;
    };
    listItems?: string[];
  }[];
}

export const ARTICLES: Article[] = [
  {
    slug: 'complete-guide-to-direct-image-linking-and-embeds',
    title: 'The Complete Guide to Direct Image Linking, HTML & Markdown Embeds',
    excerpt: 'Learn the exact difference between direct image URLs, webpage viewers, and how to properly embed hosted images into GitHub Readmes, Discord, Reddit, and HTML sites.',
    category: 'Guides',
    readTime: '4 min read',
    date: '2026-09-28',
    author: 'Image To URL Engineering',
    tags: ['Direct Link', 'Markdown', 'HTML', 'BBCode', 'Hotlinking'],
    featured: true,
    content: [
      {
        sectionTitle: 'What is a Direct Image Link?',
        paragraphs: [
          'A direct image link points straight to the raw binary image resource on the web server or CDN (for example, https://imglink.app/i/a1b2c3d4), rather than an HTML page full of advertisements, popups, or user navigation bars.',
          'When an application or browser requests a direct link, the server immediately returns the image with appropriate MIME headers (like image/webp or image/png) and cache directives, enabling third-party platforms to display the image inline without restriction.',
        ],
        callout: {
          type: 'info',
          text: 'Image To URL generates clean, permanent direct URLs that end without query string bloat, making them 100% compatible with Markdown renderers, Discord bots, and rich messaging embeds.',
        },
      },
      {
        sectionTitle: 'How to Embed Images in Markdown (GitHub, Reddit, Obsidian)',
        paragraphs: [
          'Markdown provides a concise syntax for embedding remote images. The standard structure consists of an exclamation point, bracketed alt text, and the direct URL in parentheses:',
        ],
        codeBlock: {
          language: 'markdown',
          title: 'Standard Markdown Embed',
          code: `![Descriptive Image Caption](https://imglink.app/i/demo_id)

<!-- Clickable Image (Image linked to full resolution) -->
[![Screenshot](https://imglink.app/i/demo_id)](https://imglink.app/i/demo_id)`,
        },
        listItems: [
          'GitHub Readmes: Displays inline in repo docs without broken badge icons.',
          'Reddit Posts: Renders automatically in markdown comments and self-posts.',
          'Obsidian & Notion: Syncs and renders fast without requiring heavy local attachments.',
        ],
      },
      {
        sectionTitle: 'HTML5 Responsive Embeds & Best Practices',
        paragraphs: [
          'For web developers inserting hosted images into landing pages or blog posts, the native HTML <img> tag with modern performance attributes provides the highest Lighthouse and PageSpeed scores:',
        ],
        codeBlock: {
          language: 'html',
          title: 'Optimized HTML5 Image Tag',
          code: `<figure class="my-6">
  <img 
    src="https://imglink.app/i/demo_id" 
    alt="System architecture diagram" 
    loading="lazy" 
    decoding="async" 
    class="rounded-xl shadow-lg w-full max-w-2xl h-auto"
  />
  <figcaption class="text-xs text-zinc-500 mt-2 text-center">
    Figure 1: High-throughput ingestion pipeline
  </figcaption>
</figure>`,
        },
        callout: {
          type: 'tip',
          text: 'Always include loading="lazy" for offscreen images and decoding="async" to keep main-thread rendering buttery smooth.',
        },
      },
      {
        sectionTitle: 'BBCode for Traditional Forums (phpBB, XenForo, vBulletin)',
        paragraphs: [
          'Many developer forums, gaming communities, and bulletin boards still rely on BBCode syntax. Use the [IMG] tag for instant rendering:',
        ],
        codeBlock: {
          language: 'bbcode',
          title: 'Forum BBCode Tag',
          code: `[img]https://imglink.app/i/demo_id[/img]

[url=https://imglink.app/i/demo_id][img]https://imglink.app/i/demo_id[/img][/url]`,
        },
      },
    ],
  },
  {
    slug: 'image-privacy-and-ephemeral-sharing-explained',
    title: 'Image Privacy & Ephemeral Sharing: How Delete Tokens & Expiry Work',
    excerpt: 'Understand how cryptographic 48-character delete tokens, automated expiration timers, and metadata stripping protect your personal security and confidential files.',
    category: 'Privacy',
    readTime: '5 min read',
    date: '2026-09-27',
    author: 'Security Team',
    tags: ['Privacy', 'Delete Token', 'Auto-Expiry', 'EXIF', 'Security'],
    content: [
      {
        sectionTitle: 'The Hidden Risks of Sharing Raw Images',
        paragraphs: [
          'Modern smartphones and DSLR cameras embed extensive hidden metadata (EXIF data) inside every photo taken. This includes exact GPS latitude/longitude coordinates, camera serial numbers, lens types, and timestamps.',
          'Uploading raw photos to insecure public services can accidentally expose your home address, workplace, or travel habits to anyone who downloads the file.',
        ],
        callout: {
          type: 'security',
          text: 'Image To URL strips dangerous EXIF metadata and geolocation tags during processing, ensuring only clean visual pixels are stored and distributed.',
        },
      },
      {
        sectionTitle: 'Anonymous Control via 48-Character Delete Tokens',
        paragraphs: [
          'Most image hosts require creating an account, confirming an email, and accepting tracking cookies just so you can delete an image later. Image To URL uses a privacy-first model powered by cryptographic tokens.',
          'Upon uploading an image, the server generates a 48-character cryptographically random token (e.g. 9f4a1c8b32e0...). This token acts as a bearer credential for deleting the image.',
        ],
        listItems: [
          'Zero account required: No email, passwords, or tracking cookies stored on our servers.',
          'Never exposed in URLs: The token is returned once in the upload response and saved to your browser session storage only.',
          'Public viewers cannot delete: Even if millions of people view the direct link, only the bearer of the delete token can trigger permanent removal.',
        ],
      },
      {
        sectionTitle: 'Automated Ephemeral Expiration Timers',
        paragraphs: [
          'For bug screenshots, sensitive design proofs, or temporary chat illustrations, keeping images online indefinitely creates unnecessary digital footprint and clutter.',
          'With Image To URL, you can choose an automatic expiration window at upload time:',
        ],
        listItems: [
          '1 Hour: Perfect for quick verification codes, transient bug captures, or sensitive clips.',
          '1 Day (24 Hours): Ideal for daily standup updates, peer review feedback, and pull requests.',
          '7 Days: Great for project sprints, release milestones, and collaborative demos.',
          'Never: Permanent hosting for docs, published articles, and static web assets.',
        ],
        callout: {
          type: 'tip',
          text: 'Once an image expires, it is permanently scrubbed from storage and direct URLs return a 404 response immediately.',
        },
      },
    ],
  },
  {
    slug: 'modern-image-optimization-webp-vs-png-vs-jpeg',
    title: 'Modern Image Optimization: WebP vs. PNG vs. JPEG Compared',
    excerpt: 'Comprehensive comparison of modern web image formats. Discover how converting to WebP shrinks file size by up to 40% without compromising visual clarity.',
    category: 'Performance',
    readTime: '6 min read',
    date: '2026-09-25',
    author: 'Performance Lab',
    tags: ['WebP', 'JPEG', 'PNG', 'Compression', 'Core Web Vitals'],
    content: [
      {
        sectionTitle: 'The State of Web Image Formats in 2026',
        paragraphs: [
          'Images account for over 60% of the total byte weight on an average website. Choosing the right format directly influences your Largest Contentful Paint (LCP) and bounce rate.',
          'While PNG and JPEG have served the web for decades, modern formats like WebP offer superior compression ratios and broad browser support across 99% of global traffic.',
        ],
      },
      {
        sectionTitle: 'Format Comparison Matrix',
        listItems: [
          'WebP: The optimal general-purpose web format. Supports lossy compression, lossless compression, and alpha transparency with 25-35% smaller file sizes than comparable JPEGs.',
          'PNG: Best reserved for lossless graphics, pixel art, or graphics requiring sharp text and transparency where re-encoding is strictly prohibited.',
          'JPEG: Traditional format best suited for continuous-tone photography when legacy browser compatibility is an absolute requirement.',
          'GIF: Legacy animation format; modern animated WebP or MP4 videos are 80-90% smaller for identical quality.',
        ],
        callout: {
          type: 'tip',
          text: 'Use the built-in Image To URL "WebP Converter" tool in the navigation menu to optimize any existing PNG or JPEG before embedding it into your website.',
        },
      },
      {
        sectionTitle: 'Lossless vs. Lossy Compression: Where is the Sweet Spot?',
        paragraphs: [
          'Human eyes are highly sensitive to sharp edges in text and high-contrast lines, but far less sensitive to subtle color gradations in natural scenes.',
          'Setting a lossy quality level of 80-85% typically reduces file size by 50-70% while resulting in an image that is visually indistinguishable from the uncompressed original under normal viewing conditions.',
        ],
      },
    ],
  },
  {
    slug: 'image-to-url-developer-api-and-programmatic-uploads',
    title: 'Image To URL Developer API: Automating Image Uploads via cURL, Python & JS',
    excerpt: 'Step-by-step developer tutorial for integrating Image To URL into CI/CD pipelines, Discord bots, CLI scripts, and static site builders with the REST API.',
    category: 'Developer',
    readTime: '5 min read',
    date: '2026-09-24',
    author: 'Image To URL DevRel',
    tags: ['API', 'cURL', 'Python', 'Node.js', 'Automation'],
    content: [
      {
        sectionTitle: 'REST API Overview',
        paragraphs: [
          'Image To URL features a clean, unauthenticated REST API designed for developer tooling, automated screenshot utilities, and continuous integration pipelines.',
          'All endpoints return standard JSON responses and support CORS out of the box.',
        ],
        codeBlock: {
          language: 'bash',
          title: 'Quick cURL Upload Example',
          code: `curl -X POST https://imglink.app/api/upload \\
  -F "image=@/path/to/screenshot.png" \\
  -F "expiry=86400"`,
        },
      },
      {
        sectionTitle: 'Understanding the API Response Structure',
        paragraphs: [
          'A successful POST /api/upload request yields an HTTP 201 Created status code with full metadata, dimensions, and delete token:',
        ],
        codeBlock: {
          language: 'json',
          title: 'API JSON Response',
          code: `{
  "success": true,
  "image": {
    "id": "7k9p2m4x1w",
    "url": "https://imglink.app/i/7k9p2m4x1w",
    "originalFilename": "screenshot.png",
    "mimeType": "image/png",
    "size": 184320,
    "width": 1920,
    "height": 1080,
    "expiresAt": 1790673400000,
    "createdAt": 1790587000000,
    "deleteToken": "a3f81e90b72c4518d6a09e..."
  }
}`,
        },
        callout: {
          type: 'warning',
          text: 'Store the deleteToken in your database or local config if your application needs to programmatically delete the image later.',
        },
      },
      {
        sectionTitle: 'Automating with Node.js / JavaScript Fetch',
        paragraphs: [
          'Uploading an image from a Node.js script or browser frontend requires standard FormData and fetch:',
        ],
        codeBlock: {
          language: 'typescript',
          title: 'Node.js / Browser Script',
          code: `import fs from 'fs';

async function uploadToImageToURL(filePath: string) {
  const fileBlob = new Blob([fs.readFileSync(filePath)]);
  const formData = new FormData();
  formData.append('image', fileBlob, 'architecture.png');
  formData.append('expiry', '0'); // 0 = permanent

  const response = await fetch('https://imglink.app/api/upload', {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();
  if (data.success) {
    console.log('Direct Image URL:', data.image.url);
    console.log('Delete Token:', data.image.deleteToken);
  }
}`,
        },
      },
      {
        sectionTitle: 'Python Upload Script for Build Pipelines',
        paragraphs: [
          'Here is a ready-to-run Python script using the requests library for automated release asset publishing:',
        ],
        codeBlock: {
          language: 'python',
          title: 'Python Script (upload.py)',
          code: `import requests

def upload_screenshot(image_path):
    url = "https://imglink.app/api/upload"
    with open(image_path, "rb") as f:
        files = {"image": f}
        data = {"expiry": "604800"} # 7 days in seconds
        res = requests.post(url, files=files, data=data)
        
    result = res.json()
    if result.get("success"):
        print(f"Uploaded: {result['image']['url']}")
        return result['image']['url']
    raise Exception("Upload failed: " + str(result))`,
        },
      },
    ],
  },
  {
    slug: 'markdown-and-embed-codes-cheatsheet',
    title: 'Markdown & Embed Codes Cheatsheet for Developers & Creators',
    excerpt: 'Copy-paste ready snippets for inserting hosted images into GitHub Readmes, Discord, Reddit, WordPress, Notion, and responsive CSS frameworks.',
    category: 'Cheatsheet',
    readTime: '3 min read',
    date: '2026-09-22',
    author: 'Community Team',
    tags: ['Cheatsheet', 'Markdown', 'HTML', 'Snippets', 'Discord'],
    content: [
      {
        sectionTitle: 'GitHub README Presentation Hacks',
        paragraphs: [
          'Make your open-source documentation shine with centered graphics, side-by-side comparison tables, and badge images:',
        ],
        codeBlocks: [
          {
            language: 'markdown',
            title: 'Centered Hero Banner in GitHub README',
            code: `<div align="center">
  <img src="https://imglink.app/i/your_id" alt="App Banner" width="800" />
  <p><em>Lightning-fast decentralized image delivery</em></p>
</div>`,
          },
          {
            language: 'markdown',
            title: 'Side-by-Side Image Comparison Table',
            code: `| Before Optimization | After WebP Compression |
|:---:|:---:|
| <img src="https://imglink.app/i/before_id" width="350"/> | <img src="https://imglink.app/i/after_id" width="350"/> |
| 2.4 MB (Raw PNG) | 240 KB (Optimized WebP) |`,
          },
        ],
      },
      {
        sectionTitle: 'Discord & Social Media Preview Cards',
        paragraphs: [
          'When posting direct links on Discord, Slack, Telegram, or Twitter, simply paste the clean link on its own line:',
        ],
        codeBlock: {
          language: 'text',
          title: 'Instant Unfurl in Chat',
          code: `Hey team, check out the updated mockups here:
https://imglink.app/i/your_image_id`,
        },
        callout: {
          type: 'tip',
          text: 'Because Image To URL responds with the correct Content-Type: image/png or image/webp header, chat clients automatically render the full preview without opening a separate browser tab.',
        },
      },
      {
        sectionTitle: 'Responsive Tailwind CSS Image Embed',
        paragraphs: [
          'For modern React or Vue apps utilizing Tailwind CSS, here is an elegant container with aspect ratio preservation and blur-up placeholder styling:',
        ],
        codeBlock: {
          language: 'html',
          title: 'Tailwind CSS Card Embed',
          code: `<div class="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-xl group">
  <img 
    src="https://imglink.app/i/your_id" 
    alt="Preview card" 
    class="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
    loading="lazy"
  />
</div>`,
        },
      },
    ],
  },
  {
    slug: 'image-seo-and-core-web-vitals-guide',
    title: 'Image SEO & Core Web Vitals: Boosting LCP and PageSpeed',
    excerpt: 'Actionable techniques to optimize remote images for Google Search indexing, prevent Cumulative Layout Shift (CLS), and maximize Largest Contentful Paint.',
    category: 'Performance',
    readTime: '6 min read',
    date: '2026-09-20',
    author: 'SEO & Performance Team',
    tags: ['SEO', 'PageSpeed', 'LCP', 'CLS', 'Core Web Vitals'],
    content: [
      {
        sectionTitle: 'Why Remote Image Speed Impacts Your Search Ranking',
        paragraphs: [
          'Google uses Core Web Vitals as a direct organic ranking signal. Among these metrics, Largest Contentful Paint (LCP) measures when the main content of a webpage has finished loading.',
          'In over 75% of web pages, the LCP element is a prominent hero image. Hosting on a fast CDN with aggressive cache headers eliminates slow server response times and boosts search authority.',
        ],
      },
      {
        sectionTitle: 'Preventing Cumulative Layout Shift (CLS)',
        paragraphs: [
          'A common cause of layout instability occurs when the browser does not know an image\'s dimensions before downloading the file, causing text below to jump around.',
          'Always declare explicit width and height attributes in HTML. Modern browsers calculate the aspect ratio before image bytes arrive:',
        ],
        codeBlock: {
          language: 'html',
          title: 'Dimension Reservation Syntax',
          code: `<!-- Explicit width/height prevents layout shifts -->
<img 
  src="https://imglink.app/i/demo_id" 
  width="1200" 
  height="630" 
  alt="Comprehensive guide to image SEO"
  class="w-full h-auto"
/>`,
        },
        callout: {
          type: 'info',
          text: 'Image To URL automatically records exact pixel dimensions (width & height) upon upload, which you can read directly from our API response or info panel.',
        },
      },
      {
        sectionTitle: 'Preloading Above-the-Fold Images',
        paragraphs: [
          'For hero images that appear in the immediate viewport, do NOT use loading="lazy". Instead, instruct the browser to preload the asset with high priority:',
        ],
        codeBlock: {
          language: 'html',
          title: 'HTML Head Preload Directive',
          code: `<link 
  rel="preload" 
  fetchpriority="high" 
  as="image" 
  href="https://imglink.app/i/hero_image_id" 
  type="image/webp"
/>`,
        },
      },
    ],
  },
];

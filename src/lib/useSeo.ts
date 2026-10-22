import { useEffect } from 'react';

interface SeoProps {
  title?: string;
  description?: string;
}

export function useSeo({ title, description }: SeoProps = {}) {
  useEffect(() => {
    const defaultTitle = 'Image To URL — Convert Images to Shareable URLs';
    const defaultDesc = 'Convert images into shareable URLs quickly and easily with Image To URL.';
    
    const fullTitle = title ? `${title} | Image To URL` : defaultTitle;
    const metaDesc = description || defaultDesc;

    document.title = fullTitle;

    // Update Meta Description
    const descTag = document.querySelector('meta[name="description"]');
    if (descTag) {
      descTag.setAttribute('content', metaDesc);
    }

    // Update OpenGraph Title & Description
    const ogTitleTag = document.querySelector('meta[property="og:title"]');
    if (ogTitleTag) {
      ogTitleTag.setAttribute('content', fullTitle);
    }

    const ogDescTag = document.querySelector('meta[property="og:description"]');
    if (ogDescTag) {
      ogDescTag.setAttribute('content', metaDesc);
    }

    const ogSiteName = document.querySelector('meta[property="og:site_name"]');
    if (ogSiteName) {
      ogSiteName.setAttribute('content', 'Image To URL');
    }

    // Update Twitter Title & Description
    const twTitleTag = document.querySelector('meta[name="twitter:title"]');
    if (twTitleTag) {
      twTitleTag.setAttribute('content', fullTitle);
    }

    const twDescTag = document.querySelector('meta[name="twitter:description"]');
    if (twDescTag) {
      twDescTag.setAttribute('content', metaDesc);
    }
  }, [title, description]);
}

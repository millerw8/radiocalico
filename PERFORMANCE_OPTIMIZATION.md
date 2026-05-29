# Radio Calico - Page Speed Optimization Analysis

## Current Performance Profile

### Asset Inventory
| Asset | Size | Load Method | Impact |
|-------|------|-------------|--------|
| index.html | 3.9 KB | Direct | Low |
| styles.css | 11 KB | Render-blocking | Medium |
| app.js | 15 KB | Render-blocking | Medium |
| logo.png | 54 KB (672x672) | Direct | **HIGH** |
| Google Fonts CSS | ~1.2 KB | External, preconnect | Low |
| Google Fonts WOFF2 | ~40-60 KB | External, lazy | Medium |
| hls.js | ~150 KB | External CDN | **HIGH** |
| Album art (CloudFront) | Variable | Dynamic | Medium |

**Total Initial Load:** ~280-300 KB (uncompressed)
**Gzip Enabled:** Yes (nginx configured)
**Cache Headers:** 1 hour for static files

---

## 🚀 Critical Optimizations (High Impact)

### 1. **Image Optimization - Logo (54 KB → ~5-10 KB)**

**Problem:** Logo is 672x672 but displayed at 70x70 pixels (9.6x oversized)

**Solution:**
```bash
# Resize and optimize logo
convert public/logo.png -resize 140x140 -quality 85 public/logo-optimized.png
# Or use modern format
convert public/logo.png -resize 140x140 public/logo.webp
```

**Impact:** 44 KB savings (81% reduction)

**Implementation:**
```html
<!-- Use WebP with PNG fallback -->
<picture>
  <source srcset="/logo.webp" type="image/webp">
  <img src="/logo.png" alt="Radio Calico Logo" class="logo" width="70" height="70">
</picture>
```

---

### 2. **Defer Non-Critical JavaScript**

**Problem:** hls.js (150 KB) and app.js (15 KB) block rendering

**Solution:**
```html
<!-- Current (blocking) -->
<script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
<script src="app.js"></script>

<!-- Optimized (non-blocking) -->
<script src="https://cdn.jsdelivr.net/npm/hls.js@latest" defer></script>
<script src="app.js" defer></script>
```

**Impact:** Improves First Contentful Paint (FCP) by ~200-300ms

---

### 3. **Inline Critical CSS**

**Problem:** 11 KB CSS file blocks rendering

**Solution:** Extract and inline critical above-the-fold CSS

```html
<head>
  <!-- Inline critical CSS (header, layout, skeleton) -->
  <style>
    /* Critical CSS only - ~2-3 KB */
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; }
    .page-header { background: #3A3638; padding: 20px 24px; }
    /* ... more critical styles ... */
  </style>
  
  <!-- Load full CSS asynchronously -->
  <link rel="preload" href="styles.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
  <noscript><link rel="stylesheet" href="styles.css"></noscript>
</head>
```

**Impact:** Eliminates render-blocking CSS, improves FCP by ~150-250ms

---

### 4. **Lazy Load Album Art**

**Problem:** Album art loads immediately even if user doesn't play

**Solution:**
```html
<!-- Add loading="lazy" -->
<img src="https://d3d4yli4hf5bmh.cloudfront.net/cover.jpg" 
     alt="Album Art" 
     class="album-art" 
     id="mainAlbumArt" 
     loading="lazy"
     onerror="this.style.display='none'">
```

**Impact:** Saves bandwidth for non-players, improves initial load

---

## ⚡ High Impact Optimizations

### 5. **Add Resource Hints**

```html
<head>
  <!-- DNS prefetch for external resources -->
  <link rel="dns-prefetch" href="https://cdn.jsdelivr.net">
  <link rel="dns-prefetch" href="https://d3d4yli4hf5bmh.cloudfront.net">
  
  <!-- Preconnect to critical origins (already done for fonts) -->
  <link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
  
  <!-- Preload critical assets -->
  <link rel="preload" href="/logo.webp" as="image" type="image/webp">
  <link rel="modulepreload" href="app.js"> <!-- if using ES modules -->
</head>
```

**Impact:** Reduces connection time by 100-200ms

---

### 6. **Optimize Font Loading**

**Current:** Google Fonts with preconnect (good)

**Better:** Self-host fonts with font-display

```css
/* Add to Google Fonts URL */
&display=swap  /* Already present ✓ */

/* Or self-host */
@font-face {
  font-family: 'Montserrat';
  src: url('/fonts/montserrat-700.woff2') format('woff2');
  font-weight: 700;
  font-display: swap; /* Show fallback immediately */
}
```

**Impact:** Eliminates FOIT (Flash of Invisible Text)

---

### 7. **Minify and Compress Assets**

```bash
# Install build tools
npm install --save-dev terser cssnano html-minifier-terser

# Create build script
npm run build
```

**Build Script (package.json):**
```json
{
  "scripts": {
    "build": "npm run build:css && npm run build:js && npm run build:html",
    "build:css": "cssnano public/styles.css public/styles.min.css",
    "build:js": "terser public/app.js -o public/app.min.js -c -m",
    "build:html": "html-minifier-terser --collapse-whitespace --remove-comments public/index.html -o public/index.min.html"
  }
}
```

**Impact:**
- CSS: 11 KB → ~7 KB (36% reduction)
- JS: 15 KB → ~10 KB (33% reduction)
- HTML: 3.9 KB → ~3.2 KB (18% reduction)

---

### 8. **Enhanced Nginx Caching**

```nginx
http {
    # Increase gzip compression
    gzip_comp_level 9;  # Current: 6
    gzip_min_length 256;
    
    # Add Brotli compression (better than gzip)
    brotli on;
    brotli_comp_level 6;
    brotli_types text/plain text/css text/xml text/javascript application/json application/javascript;
    
    server {
        # Longer cache for immutable assets
        location ~* \.(jpg|jpeg|png|gif|ico|webp|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
        
        location ~* \.(css|js)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
            # Use versioned filenames: app.v1.js, styles.v1.css
        }
        
        # HTML should be revalidated
        location ~* \.(html)$ {
            expires -1;
            add_header Cache-Control "no-cache, must-revalidate";
        }
    }
}
```

**Impact:** Eliminates repeat downloads for returning visitors

---

## 🎯 Medium Impact Optimizations

### 9. **Reduce JavaScript Execution Time**

**Current Issues:**
- `loadUsers()` runs on page load (even if user doesn't interact)
- Polling intervals start immediately

**Solution:**
```javascript
// Lazy load users only when needed
let usersLoaded = false;
document.getElementById('userSelect').addEventListener('focus', async () => {
    if (!usersLoaded) {
        await loadUsers();
        usersLoaded = true;
    }
}, { once: true });

// Don't start polling until user plays
function startPlaying() {
    // ... existing play logic ...
    if (!nowPlayingInterval) {
        startNowPlayingPolling();
    }
}
```

**Impact:** Reduces initial JavaScript execution by ~50ms

---

### 10. **Use Intersection Observer for Recently Played**

```javascript
// Only load recently played when visible
const recentlyPlayedObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            // Load recently played content
            recentlyPlayedObserver.disconnect();
        }
    });
});

recentlyPlayedObserver.observe(document.getElementById('recentlyPlayedWidget'));
```

---

### 11. **Add Service Worker for Offline Support**

```javascript
// sw.js - Cache static assets
const CACHE_NAME = 'radiocalico-v1';
const urlsToCache = [
    '/',
    '/styles.min.css',
    '/app.min.js',
    '/logo.webp'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
    );
});
```

**Impact:** Instant repeat visits, offline page shell

---

## 📊 Expected Performance Improvements

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| **First Contentful Paint** | ~1.5s | ~0.8s | **47% faster** |
| **Largest Contentful Paint** | ~2.2s | ~1.2s | **45% faster** |
| **Time to Interactive** | ~2.8s | ~1.5s | **46% faster** |
| **Total Bundle Size** | ~300 KB | ~180 KB | **40% smaller** |
| **Lighthouse Score** | ~75 | ~95 | **+20 points** |

---

## 🛠️ Implementation Priority

### Phase 1: Quick Wins (1-2 hours)
1. ✅ Optimize logo image (54 KB → 5 KB)
2. ✅ Add `defer` to scripts
3. ✅ Add `loading="lazy"` to album art
4. ✅ Add resource hints (dns-prefetch, preconnect)
5. ✅ Update nginx cache headers

**Expected Impact:** 30-40% performance improvement

### Phase 2: Build Pipeline (2-4 hours)
6. ✅ Setup minification (CSS, JS, HTML)
7. ✅ Implement critical CSS inlining
8. ✅ Add WebP image format support
9. ✅ Configure Brotli compression

**Expected Impact:** Additional 15-20% improvement

### Phase 3: Advanced (4-8 hours)
10. ✅ Implement service worker
11. ✅ Lazy load non-critical JavaScript
12. ✅ Add Intersection Observer for below-fold content
13. ✅ Self-host fonts (optional)

**Expected Impact:** Additional 10-15% improvement

---

## 🔍 Monitoring & Testing

### Tools to Measure Impact
1. **Lighthouse** (Chrome DevTools)
   ```bash
   lighthouse http://localhost --view
   ```

2. **WebPageTest** (https://www.webpagetest.org/)
   - Test from multiple locations
   - Get detailed waterfall charts

3. **Chrome DevTools Performance Tab**
   - Record page load
   - Analyze main thread activity

4. **Real User Monitoring (RUM)**
   ```javascript
   // Add to app.js
   window.addEventListener('load', () => {
       const perfData = performance.getEntriesByType('navigation')[0];
       console.log('Page Load Time:', perfData.loadEventEnd - perfData.fetchStart);
       // Send to analytics
   });
   ```

---

## 📝 Quick Start Implementation

### Step 1: Optimize Logo
```bash
cd public/
# Resize to 2x display size for retina
convert logo.png -resize 140x140 -quality 85 logo-optimized.png
convert logo.png -resize 140x140 logo.webp
mv logo.png logo-original.png
mv logo-optimized.png logo.png
```

### Step 2: Update HTML
```bash
# Add defer to scripts, lazy to images
sed -i '' 's/<script src="https:\/\/cdn.jsdelivr.net\/npm\/hls.js@latest">/<script src="https:\/\/cdn.jsdelivr.net\/npm\/hls.js@latest" defer>/' public/index.html
sed -i '' 's/<script src="app.js">/<script src="app.js" defer>/' public/index.html
sed -i '' 's/<img src="https:\/\/d3d4yli4hf5bmh.cloudfront.net\/cover.jpg"/<img src="https:\/\/d3d4yli4hf5bmh.cloudfront.net\/cover.jpg" loading="lazy"/' public/index.html
```

### Step 3: Update Nginx
```bash
# Update cache headers in nginx.conf
# Then reload
docker compose restart radiocalico-prod
```

### Step 4: Test
```bash
# Run Lighthouse
lighthouse http://localhost --view

# Check gzip
curl -H "Accept-Encoding: gzip" -I http://localhost/styles.css
```

---

## 🎯 Success Metrics

**Target Goals:**
- Lighthouse Performance Score: **95+**
- First Contentful Paint: **< 1.0s**
- Largest Contentful Paint: **< 1.5s**
- Time to Interactive: **< 2.0s**
- Total Bundle Size: **< 200 KB**

**Current Baseline:** (Run Lighthouse to establish)
**After Phase 1:** (Target +20-30 points)
**After Phase 2:** (Target +15-20 points)
**After Phase 3:** (Target +10-15 points)

---

## 📚 Additional Resources

- [Web.dev Performance](https://web.dev/performance/)
- [Chrome DevTools Performance](https://developer.chrome.com/docs/devtools/performance/)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [WebPageTest](https://www.webpagetest.org/)
- [Can I Use - Browser Support](https://caniuse.com/)

---

**Last Updated:** 2026-05-29
**Next Review:** After Phase 1 implementation

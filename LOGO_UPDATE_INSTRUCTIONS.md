# Logo Update Instructions

## Image Provided
You provided a circular logo with:
- **Green crown** with golden/amber accent
- **Cream/white background** circle
- **Dark green border** around the circle
- **Letter "U"** below the crown symbol

## How to Use the Logo

### 1. Save the Logo Image
Save the image file you provided as:
```
apps/web/public/logo.png
```

**Recommended specifications:**
- Size: 512x512 pixels (or larger, will be scaled)
- Format: PNG with transparency
- Aspect ratio: 1:1 (square)

### 2. The Logo is Already Referenced
The footer component already uses this logo:
```typescript
<img src="/logo.png" alt="Casa Corona" className="h-11 w-11 object-contain" />
```

**File:** `apps/web/src/components/layout/Footer.tsx` (line 42)

### 3. Generate Favicons (Optional but Recommended)
Use the logo to create favicons for all devices:

```bash
# Install favicon generator
npm install --save-dev favicons

# Generate favicons
npx favicons logo.png --path /icons
```

This will create:
- `favicon.ico` - Classic browser favicon
- `apple-touch-icon.png` - iOS home screen
- `android-chrome-*.png` - Android devices
- `favicon-*.png` - Various sizes

Then add to `apps/web/index.html`:
```html
<link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16x16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png">
```

### 4. Verify Logo Displays
After saving the file, rebuild and check:

```bash
cd apps/web
npm run build
npm run dev
```

Then visit:
- Homepage footer - Should show the logo
- Browser tab - Should show favicon (if generated)

## Alternative: Use as SVG

If you want sharper rendering at all sizes, convert to SVG:

1. Use an online tool like https://convertio.co/png-svg/
2. Save as `apps/web/public/logo.svg`
3. Update the Footer.tsx to use SVG:
   ```typescript
   <img src="/logo.svg" alt="Casa Corona" className="h-11 w-11 object-contain" />
   ```

## Logo Usage Throughout the App

The logo is currently used in:
- ✅ **Footer** - `components/layout/Footer.tsx` (line 42)
- **Header/Navbar** - Check if navbar exists and add logo there
- **Loading screens** - Can add logo to loading spinners
- **Email templates** - Add to email HTML templates for branding

## Brand Colors from Logo

Based on your logo, these are the brand colors:
- **Primary Green:** `#2d5f3f` (crown)
- **Accent Gold:** `#d4a017` (crown accent)
- **Background Cream:** `#f5f5dc`
- **Border Dark Green:** `#1a3a2a`

You can update these in your tailwind config to match the logo perfectly.

---

**Status:** Logo placeholder is referenced in code. Save your image file to `/apps/web/public/logo.png` and it will display automatically. ✅

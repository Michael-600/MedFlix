# Adding Images to MedFlix

## ⚠️ IMPORTANT: Copyright Notice

**You MUST obtain proper licenses for any images you use.** Do NOT use copyrighted images from TV shows, movies, or other media without permission.

## Where to Get Licensed Images

### Free Stock Photo Sites
- **Unsplash** (unsplash.com) - Free, high-quality images
- **Pexels** (pexels.com) - Free stock photos and videos
- **Pixabay** (pixabay.com) - Free images and videos
- **Freepik** (freepik.com) - Free vectors and photos (check license)

### Paid Stock Photo Sites
- **Shutterstock** (shutterstock.com)
- **Adobe Stock** (stock.adobe.com)
- **iStock** (istockphoto.com)
- **Getty Images** (gettyimages.com)

### AI-Generated Images
- **Midjourney** (midjourney.com)
- **DALL-E** (openai.com/dall-e)
- **Stable Diffusion** (stability.ai)

### Custom Illustrations
- Hire an illustrator on Fiverr, Upwork, or 99designs
- Commission custom artwork
- Create your own illustrations

## Image Specifications

### Visual Style Images
- **Size**: 400x300px (or larger)
- **Format**: JPG, PNG, or WebP
- **Aspect Ratio**: 4:3 or 16:9
- **Location**: `/public/images/styles/`

**Files needed:**
- `friends.jpg` - Live-action sitcom style
- `zootopia.jpg` - Disney 3D animation style
- `anime.jpg` - Japanese 2D animation style
- `the-office.jpg` - Mockumentary style
- `pixar.jpg` - 3D animation style
- `spider-verse.jpg` - Comic book animation style
- `south-park.jpg` - Cutout animation style

### Avatar Images
- **Size**: 200x200px (or larger)
- **Format**: JPG, PNG, or WebP
- **Aspect Ratio**: 1:1 (square)
- **Location**: `/public/images/avatars/`

**Files needed:**
- `angela.jpg` - Professional female presenter
- `josh.jpg` - Friendly male guide
- `anna.jpg` - Warm female presenter
- `edward.jpg` - Confident male expert
- `closeup.jpg` - Close-up style example
- `circle.jpg` - Circle overlay style example

## How to Add Images

### Step 1: Add Image Files
1. Place your licensed images in the appropriate folder:
   - Visual styles: `/public/images/styles/`
   - Avatars: `/public/images/avatars/`

### Step 2: Update mockData.js
Open `/src/data/mockData.js` and update the `image` property for each style:

```javascript
{
  id: 'friends',
  name: 'Friends',
  subtitle: 'Live-action sitcom',
  // ... other properties
  image: '/images/styles/friends.jpg', // ← Add this line
  emoji: '🎬',
}
```

### Step 3: Update CreateContent.jsx
Open `/src/components/CreateContent.jsx` and update the `image` property for each avatar:

```javascript
{
  id: 'angela',
  name: 'Angela',
  subtitle: 'Professional presenter',
  // ... other properties
  image: '/images/avatars/angela.jpg', // ← Add this line
  emoji: '👩‍⚕️',
}
```

## Example: Using AI to Generate Images

If you want to create unique, copyright-free images, you can use AI image generators:

### For Visual Styles:
```
Midjourney prompt: "professional medical education video screenshot in [style] aesthetic, warm lighting, friendly atmosphere, high quality, 4k --ar 4:3"
```

Replace `[style]` with:
- "friends sitcom" for Friends style
- "Disney Pixar animation" for Zootopia/Pixar
- "anime" for Anime
- "mockumentary office" for The Office
- "spider-verse comic book" for Spider-Verse
- "South Park cutout animation" for South Park

### For Avatars:
```
Midjourney prompt: "professional medical presenter avatar, friendly smile, neutral background, portrait photo, high quality, professional photography --ar 1:1"
```

## Legal Considerations

### ✅ SAFE TO USE:
- Stock photos with proper license
- AI-generated images you create
- Custom illustrations you commission
- Images you create yourself
- Creative Commons (CC0) images

### ❌ DO NOT USE:
- Screenshots from TV shows/movies
- Copyrighted character images
- Google Images without verification
- Fan art of copyrighted characters
- Unlicensed promotional materials

## Current Status

Right now, the app uses emoji placeholders:
- 🎬 Friends
- 🦊 Zootopia
- 🎨 Anime
- 📷 The Office
- 💡 Pixar
- ⚡ Spider-Verse
- ✂️ South Park

These will be replaced automatically when you add properly licensed images following the steps above.

## Questions?

If you need help:
1. Check the license of any image before using it
2. When in doubt, use free stock photos or AI-generated images
3. Keep receipts/licenses for any paid images
4. Consider hiring a designer for custom illustrations

---

**Remember**: Using copyrighted images without permission can result in legal action. Always verify you have the right to use an image before adding it to your application.

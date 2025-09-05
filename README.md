# Avarynx Avatar - Interactive 3D Avatar Platform

A cutting-edge 3D avatar animation platform featuring real-time lipsync, eye tracking, pose controls, and speech synthesis capabilities built with Three.js and Vite.

![Avarynx Avatar](https://img.shields.io/badge/Three.js-000000?style=for-the-badge&logo=three.js&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)

## ✨ Features

- **3D Avatar Rendering**: High-quality 3D avatar models with realistic lighting
- **Real-time Lipsync**: Advanced phoneme-based lip synchronization
- **Eye Tracking**: Dynamic eye movement and blinking controls
- **Pose Templates**: Pre-defined poses (neutral, wave, thinking, presenting)
- **Speech Synthesis**: Text-to-speech with synchronized mouth movements
- **Interactive Controls**: Real-time manipulation of avatar features
- **GLB Model Support**: Load custom avatar models in GLB/GLTF format
- **Responsive Design**: Optimized for desktop and mobile devices

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Local Development

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd Avarynx-Frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   - Navigate to `http://localhost:5173`
   - Click "Enable Audio" to activate WebAudio context

### Production Build

```bash
npm run build
npm run preview
```

## 🔧 Configuration

### Avatar Configuration
- **Default Avatar**: Configure in `public/siteconfig.json`
- **Custom Models**: Place GLB files in `public/assets/avatars/`
- **Supported Formats**: GLB, GLTF with standard or Mixamo bone naming

### Project Structure
```
├── src/
│   ├── main.js                 # Main application entry
│   ├── avatar_animation_core.js # Core animation system
│   ├── avatar_pose_templates.js # Pose definitions
│   ├── poses.js               # Pose utilities
│   ├── lang/
│   │   └── lipsync-en.mjs     # English phoneme mapping
│   └── utils/
│       ├── animator.js        # Animation controller
│       ├── audio.js          # Audio utilities
│       ├── faceIdle.js       # Facial idle animations
│       ├── lipsyncMap.js     # Lipsync mapping
│       ├── lipsyncPlayer.js  # Lipsync playback
│       ├── safeMorph.js      # Safe morph target handling
│       └── skeletonMap.js    # Bone mapping utilities
├── public/
│   ├── assets/avatars/       # Avatar GLB files
│   ├── styles/
│   │   ├── main.css         # Main stylesheet
│   │   ├── images/          # Image assets
│   │   └── video/           # Video assets
│   ├── favicon.svg          # Site favicon
│   └── siteconfig.json      # Site configuration
└── dist/                    # Production build output
```

## 🌐 Vercel Deployment

### Automatic Deployment (Recommended)

1. **Connect to Vercel**
   - Push your code to GitHub/GitLab/Bitbucket
   - Import project in [Vercel Dashboard](https://vercel.com/dashboard)
   - Vercel auto-detects Vite framework

2. **Build Settings** (Auto-configured)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### Manual Deployment

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   vercel --prod
   ```

### Environment Variables (Optional)
Set in Vercel Dashboard → Project Settings → Environment Variables:
- `NODE_VERSION`: `18.x` (if needed)

## 🎮 Usage Guide

### Loading Avatars
1. **Default Avatar**: Automatically loads on startup
2. **URL Loading**: Enter GLB URL in the input field
3. **File Upload**: Click "Upload GLB" to use local files

### Controls
- **Pose Selection**: Choose from predefined pose templates
- **Eye Movement**: Use sliders for Up/Down and Left/Right eye movement
- **Blinking**: Control blink intensity with slider
- **Speech**: Enter text and click "Speak" for TTS with lipsync

### Troubleshooting
- **Audio Issues**: Click "Enable Audio" button first
- **Avatar Loading**: Ensure GLB uses standard bone names (Hips, Spine, etc.)
- **Performance**: Reduce model complexity for better performance on mobile

## 🛠️ Development

### Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run format` - Format code with Prettier
- `npm run lint` - Lint code with ESLint

### Adding New Features
1. **New Poses**: Add to `src/avatar_pose_templates.js`
2. **Languages**: Create new files in `src/lang/`
3. **Animations**: Extend `src/utils/animator.js`

## 📦 Dependencies

### Core Libraries
- **Three.js**: 3D graphics and rendering
- **lil-gui**: Development controls interface

### Development Tools
- **Vite**: Build tool and dev server
- **ESLint**: Code linting
- **Prettier**: Code formatting

## 🔒 Browser Compatibility

- **Modern Browsers**: Chrome 88+, Firefox 85+, Safari 14+, Edge 88+
- **WebGL 2.0**: Required for optimal performance
- **Web Audio API**: Required for speech synthesis

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For support and questions:
- Create an issue in this repository
- Check the troubleshooting section above
- Review the Vite and Three.js documentation

---

Built with ❤️ using Three.js and Vite

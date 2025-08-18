This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## 🚀 **Cloud Storage Integration**

This application now uses **Cloudinary** for file storage, providing:
- **4MB file size limit** (optimized for Vercel compatibility)
- **Global CDN** for fast file delivery
- **Automatic image optimization**
- **Secure cloud storage**
- **Free tier**: 25GB storage, 25GB bandwidth/month

### **Cloudinary Setup**

1. **Create Cloudinary Account**:
   - Go to [cloudinary.com](https://cloudinary.com)
   - Sign up for a free account
   - Get your credentials from the dashboard

2. **Environment Variables**:
   ```bash
   # Copy env.example to .env.local
   cp env.example .env.local
   
   # Add your Cloudinary credentials
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

3. **Deploy to Vercel**:
   - Add the same environment variables in your Vercel project settings
   - Files will be automatically uploaded to Cloudinary

### **File Operations**

- **Upload**: Files are uploaded directly to Cloudinary
- **Preview**: Files are served from Cloudinary CDN
- **Download**: Files are downloaded from Cloudinary with proper headers
- **Storage**: All file metadata is stored in MongoDB

### **Benefits Over Local Storage**

✅ **Vercel optimized** - 4MB limit ensures compatibility with serverless functions  
✅ **Cloud storage** - Files stored securely in the cloud  
✅ **Better performance** - Global CDN delivery  
✅ **Automatic optimization** - Images are optimized automatically  
✅ **Scalable** - No server storage concerns  
✅ **Reliable** - 99.9% uptime SLA

### **Vercel Deployment Notes**

When deploying to Vercel, the application now uses cloud storage instead of local file system:
- **No uploads folder needed** - Files go directly to Cloudinary
- **No file size limits** - Cloudinary handles large files
- **Better performance** - Files served from global CDN
- **More reliable** - No serverless function file system issues

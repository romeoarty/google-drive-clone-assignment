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

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

### Vercel Deployment Notes

When deploying to Vercel, the application automatically handles file uploads using Vercel's temporary file system (`/tmp` directory). This ensures compatibility with Vercel's serverless environment.

#### File Upload Behavior:
- **Development**: Files are stored in the local `uploads/` directory
- **Vercel Production**: Files are stored in Vercel's `/tmp` directory (temporary storage)
- **Fallback**: If Vercel's temp directory is not accessible, the app falls back to local uploads

#### Important Considerations:
1. **Temporary Storage**: Files uploaded to Vercel are stored temporarily and may not persist between function invocations
2. **File Persistence**: For production use cases requiring persistent file storage, consider using:
   - Cloud storage services (AWS S3, Google Cloud Storage, Cloudinary)
   - Database storage for smaller files
   - External file hosting services

#### Troubleshooting:
If you encounter file upload errors on Vercel:
1. Check the build logs for any directory creation errors
2. Ensure the `vercel.json` configuration is properly set
3. Consider implementing cloud storage for production deployments

#### Build Process:
The build process automatically creates the `uploads/` directory to ensure local development works correctly:
```bash
npm run build  # Creates uploads/ directory after building
```

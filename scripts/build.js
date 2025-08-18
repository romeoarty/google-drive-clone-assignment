const fs = require('fs');
const path = require('path');

// Ensure uploads directory exists
function ensureUploadsDir() {
  const uploadsDir = path.join(process.cwd(), 'uploads');
  
  try {
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log('✅ Created uploads directory');
    } else {
      console.log('✅ Uploads directory already exists');
    }
  } catch (error) {
    console.error('❌ Error creating uploads directory:', error);
    process.exit(1);
  }
}

// Run the function
ensureUploadsDir();

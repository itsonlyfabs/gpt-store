const fs = require('fs');
const path = require('path');

function testLogo() {
  console.log('🔍 Testing Genio logo...\n');

  const logoPath = path.join(process.cwd(), 'public', 'genio-logo-dark.png');
  
  // Check if logo file exists
  if (fs.existsSync(logoPath)) {
    const stats = fs.statSync(logoPath);
    console.log('✅ Logo file exists:');
    console.log(`   Path: ${logoPath}`);
    console.log(`   Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Created: ${stats.birthtime}`);
    console.log(`   Modified: ${stats.mtime}`);
  } else {
    console.log('❌ Logo file not found!');
    console.log(`   Expected path: ${logoPath}`);
  }

  // Check public directory contents
  console.log('\n📁 Public directory contents:');
  const publicDir = path.join(process.cwd(), 'public');
  if (fs.existsSync(publicDir)) {
    const files = fs.readdirSync(publicDir);
    files.forEach(file => {
      const filePath = path.join(publicDir, file);
      const stats = fs.statSync(filePath);
      const isDir = stats.isDirectory();
      const size = isDir ? 'DIR' : `${(stats.size / 1024).toFixed(1)} KB`;
      console.log(`   ${file} (${size})`);
    });
  } else {
    console.log('❌ Public directory not found!');
  }

  console.log('\n📝 Logo should be accessible at:');
  console.log('   http://localhost:3002/genio-logo-dark.png');
  console.log('   https://yourdomain.com/genio-logo-dark.png');
}

testLogo();

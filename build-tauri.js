const fs = require('fs');
const path = require('path');

const dest = path.join(__dirname, 'dist_tauri');

// 清理旧的构建目录
if (fs.existsSync(dest)) {
    fs.rmSync(dest, { recursive: true, force: true });
}
fs.mkdirSync(dest);

const filesToCopy = [
    'control.html',
    'pet.html',
    'pet_v2.css',
    'pet_v3.js',
    'assets'
];

console.log('正在复制文件到 dist_tauri...');

filesToCopy.forEach(file => {
    const srcPath = path.join(__dirname, file);
    const destPath = path.join(dest, file);
    
    if (fs.existsSync(srcPath)) {
        if (fs.lstatSync(srcPath).isDirectory()) {
            fs.cpSync(srcPath, destPath, { recursive: true });
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
        console.log(`已复制: ${file}`);
    } else {
        console.warn(`警告: 文件未找到 ${file}`);
    }
});

console.log('文件复制完成！');

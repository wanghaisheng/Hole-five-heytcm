const fs = require('fs');
const path = require('path');

// Load and validate config.json
const configPath = path.resolve(__dirname, 'config.json');
let config;
try {
    const configData = fs.readFileSync(configPath, 'utf-8');
    config = JSON.parse(configData);
} catch (error) {
    console.error('Error reading or parsing config.json:', error.message);
    process.exit(1);
}

// Get rybbit ID from config or use a default
const rybbitId = config.rybbitId || 'XXXXXX';

//  rybbit script to be added if missing
const rybbitScript = `
  <!--  rybbit -->
  <script
    src="https://app.rybbit.io/api/script.js"
    data-site-id=${rybbitId}
    defer
></script>
  `;

const locales = ['', 'fr', 'zh', 'es', 'de'];
const baseDir = path.join(__dirname, '../');
const ignoreFolders = ['node_modules', 'template', 'assets', 'temp', '.git', 'scripts'];

function listHtmlFiles(dir) {
    return fs.readdirSync(dir).reduce((files, file) => {
        const filePath = path.join(dir, file);
        const isDirectory = fs.statSync(filePath).isDirectory();
        if (isDirectory && ignoreFolders.includes(file)) {
            return files;
        }
        if (isDirectory) {
            return files.concat(listHtmlFiles(filePath));
        }
        if (path.extname(file) === '.html') {
            return files.concat([filePath]);
        }
        return files;
    }, []);
}

// Process all HTML files
function processHtmlFiles() {
    let totalFiles = 0;
    let modifiedFiles = 0;

    locales.forEach(locale => {
        const localeDir = path.join(baseDir, locale);
        if (!fs.existsSync(localeDir)) return;

        const htmlFiles = listHtmlFiles(localeDir);
        totalFiles += htmlFiles.length;

        htmlFiles.forEach(filePath => {
            try {
                console.log(`Processing for rybbit: ${filePath}`);
                let content = fs.readFileSync(filePath, 'utf8');
                
                // Check if  rybbit is already present
                if (!content.includes('app.rybbit.io/api') && !content.includes('window.rybbit')) {
                    // Find the closing head tag
                    const headCloseIndex = content.indexOf('</head>');
                    
                    if (headCloseIndex !== -1) {
                        // Insert rybbit script before the closing head tag
                        const newContent = content.slice(0, headCloseIndex) + 
                                          rybbitScript + 
                                          content.slice(headCloseIndex);
                        
                        fs.writeFileSync(filePath, newContent, 'utf8');
                        console.log(`Added  rybbit to: ${filePath}`);
                        modifiedFiles++;
                    } else {
                        console.warn(`Could not find </head> tag in: ${filePath}`);
                    }
                }
            } catch (error) {
                console.error(`Error processing file ${filePath}:`, error.message);
            }
        });
    });

    console.log(`\nSummary:`);
    console.log(`Total HTML files processed: ${totalFiles}`);
    console.log(`Files modified with  rybbit: ${modifiedFiles}`);
    console.log(`Files already containing  rybbit: ${totalFiles - modifiedFiles}`);
}

// Run the script
console.log('Checking HTML files for  rybbit...');
processHtmlFiles();

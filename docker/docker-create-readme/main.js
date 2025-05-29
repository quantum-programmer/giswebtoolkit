const nunjucks = require('nunjucks');
const fs = require('fs');
const path = require('path');

const currentYear = new Date().getFullYear();

let versionNumber = process.env.GWTK_VERSION || '1.0.0';
while (versionNumber.length < 8) {
    versionNumber += ' ';
}

nunjucks.configure({ autoescape: true });

const outputPath = path.join(__dirname, 'result');

nunjucks.configure({autoescape: true});

createReadme('readme');

function createReadme(name) {
    const sourcePath = path.join(__dirname, name);
    const header = nunjucks.render(path.join(sourcePath, 'header.njk'), {currentYear, versionNumber});
    
    const description = fs.readFileSync(path.join(sourcePath, 'description.txt'), 'utf8');
    
    const changelog = fs.readFileSync(path.join(sourcePath, 'changelog.txt'), 'utf8');
    
    const resultFilePath = path.join(outputPath, name + '.txt');
    
    fs.writeFileSync(resultFilePath, header + description + changelog, 'utf8');
}

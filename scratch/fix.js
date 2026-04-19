const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory() && !file.includes('node_modules') && !file.includes('.next') && !file.includes('.git')) { 
            results = results.concat(walk(file));
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) { 
            results.push(file);
        }
    });
    return results;
}

const files = walk('./app').concat(walk('./components'));

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // First replace all instances of "text-foreground text-foreground" with "text-foreground"
    content = content.replace(/text-foreground text-foreground/g, 'text-foreground');
    content = content.replace(/dark:text-muted-foreground/g, ''); 

    // Find all className="xyz" where xyz contains bg-primary
    content = content.replace(/className=(["'])(.*?)(["'])/g, (match, quote1, classList, quote2) => {
        if (classList.includes('bg-primary')) {
            // Because it has bg-primary, we MUST ensure its text is text-primary-foreground
            // Strip out any conflicting text colors
            let newClasses = classList
                .replace(/text-foreground/g, '')
                .replace(/text-white/g, '')
                .replace(/text-slate-\d+/g, '')
                .replace(/text-muted-foreground/g, '')
                .replace(/text-primary-foreground/g, '');
            
            newClasses = newClasses.replace(/\s+/g, ' ').trim();
            newClasses += ' text-primary-foreground';
            return 'className=' + quote1 + newClasses + quote2;
        } else if (classList.includes('border-border')) {
             let newClasses = classList
                .replace(/text-foreground/g, '')
                .replace(/hover:text-foreground/g, '')
                .replace(/text-white/g, '')
                .replace(/text-primary-foreground/g, '');
            
            newClasses = newClasses.replace(/\s+/g, ' ').trim();
            newClasses += ' text-foreground';
            return 'className=' + quote1 + newClasses + quote2;
        }
        return match;
    });

    if (content !== original) {
        fs.writeFileSync(file, content);
        console.log('Fixed button text contrast in:', file);
    }
});

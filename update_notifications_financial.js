const fs = require('fs');

const path = 'functions/src/notifications_financial.ts';
let code = fs.readFileSync(path, 'utf8');

// Replace the end of onExpenseCreated
code = code.replace(
    /const response = await messaging\.sendEachForMulticast\(payload\)\n\s+console\.log\(`Sent expense notification to \$\{response\.successCount\} admins`\)\n\s+return \{ success: true \}/s,
    `const response = await messaging.sendEachForMulticast(payload)
            console.log(\`Sent expense notification to \${response.successCount} admins\`)

            // Cleanup invalid tokens (optional but good practice to avoid duplicate obsolete tokens)
            if (response.failureCount > 0) {
                // Since admins might have different tokens mixed, we could try to clean up
                // but we don't know which admin owns which token here easily without grouping by user.
                // It's safer to just log for now to avoid accidental deletions of valid tokens for other users.
                console.warn(\`Failed to send to \${response.failureCount} tokens in getOrgAdminTokens\`)
            }

            return { success: true }`
);

fs.writeFileSync(path, code);

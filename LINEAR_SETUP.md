# Linear.app Integration Setup

## Manual Setup Instructions

Since there were issues with the Linear CLI installation, here's how to set up the integration manually:

### 1. Create a Linear Team
1. Go to [Linear.app](https://linear.app)
2. Sign in or create an account
3. Create a new team named "MeseroApp"

### 2. Set Up Project Structure
1. Create a new project in your Linear team called "MeseroApp"
2. Configure the workflow states:
   - Backlog
   - Todo
   - In Progress
   - In Review
   - Done
   - Cancelled

### 3. Configure Labels
Add these standard labels:
- bug
- feature
- enhancement
- documentation
- performance

### 4. Create Issue Templates
Create templates for:
- **Bug Report**: Use the template from `linear.config.json`
- **Feature Request**: Use the template from `linear.config.json`
- **Enhancement**: Use the template from `linear.config.json`

### 5. Integration with Development Workflow
For Git integration, consider these options:

#### Option A: Linear GitHub/GitLab Integration
1. Connect your Git provider to Linear
2. Set up automatic issue creation from commits
3. Configure status updates

#### Option B: Manual Integration
1. Use the Linear web interface to create issues
2. Reference Linear issues in commit messages (e.g., "Fix #123")
3. Use the `linear.config.json` as a reference for issue structure

### 6. CLI Alternative (if needed)
If you still want to use the CLI, try:
```bash
# Install with yarn
yarn global add @linear/cli

# Or try different installation methods
npm install -g @linear/cli@latest

# Then authenticate
linear login
```

### 7. Development Workflow Integration
Add these to your development workflow:

1. **Pre-commit**: Reference Linear issue numbers
2. **Code Review**: Link PRs to Linear issues
3. **Deployment**: Update issue status when deploying

### 8. Issue Reference Convention
When creating commits, follow this format:
```
[Linear-123] Fix authentication bug in login component
```

### 9. Status Updates
Update issue status as you progress through development:
- Move from "Todo" to "In Progress" when starting work
- Move to "In Review" when ready for PR
- Move to "Done" when merged and deployed

### 10. Integration Files
- `linear.config.json`: Configuration for issue templates and workflow
- `LINEAR_SETUP.md`: This setup guide
- Consider adding a `.linearignore` file if needed
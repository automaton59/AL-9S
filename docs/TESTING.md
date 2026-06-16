# Testing Guide for Phase 1

## Manual Testing Checklist

### First-Time Setup
- [ ] Clear localStorage in browser DevTools
- [ ] Refresh page
- [ ] Verify Settings tab is active by default
- [ ] See "Configure first" badge on Chat tab
- [ ] See warning banner in Settings

### API Configuration
- [ ] Select provider (OpenAI/Deepseek/Custom)
- [ ] Enter API key
- [ ] Enter model name
- [ ] For Deepseek/Custom: Enter Base URL
- [ ] Click "Save Settings"
- [ ] Verify success message appears
- [ ] Verify Chat tab badge disappears

### Configuration Validation
- [ ] Try saving with empty API key → Error message
- [ ] Try saving with empty model → Error message
- [ ] For Deepseek: Try saving without Base URL → Error message

### Chat Functionality
- [ ] Send a simple message
- [ ] Verify loading animation appears
- [ ] Verify response appears
- [ ] Check if emotion tag appears (optional)
- [ ] Send multiline message (Shift+Enter)
- [ ] Verify multiline works

### Auto-scroll Behavior
- [ ] Send several messages
- [ ] Scroll up to read history
- [ ] Send new message
- [ ] Verify scroll position stays where you scrolled
- [ ] Scroll to bottom
- [ ] Send new message
- [ ] Verify auto-scroll works

### Error Handling
- [ ] Configure invalid API key
- [ ] Send message
- [ ] Verify friendly error message (not "401")
- [ ] Can retry after error

### Configuration Persistence
- [ ] Refresh page
- [ ] Verify settings persist
- [ ] Chat should work immediately

### Electron App
- [ ] Run `npm start`
- [ ] Electron window opens
- [ ] All features work same as web
- [ ] Close and reopen
- [ ] Settings persist

## Known Issues (Deferred to Phase 2)

See `docs/self-check-findings.md` for complete list.

**User-visible limitations:**
- Message history grows indefinitely (reload to clear)
- Multiple emotion tags not fully supported
- No message edit/delete functionality
- No conversation history management

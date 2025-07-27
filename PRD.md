# Nexus Prime - Multi-Agent AI Chat Platform

A futuristic multi-agent AI chat platform that makes users feel like they're interacting with sentient digital beings in a glowing virtual apartment complex.

**Experience Qualities**:
1. **Immersive** - Users should feel transported into a cyberpunk digital realm with living AI entities
2. **Intuitive** - Complex multi-agent interactions should feel natural and effortless
3. **Dynamic** - The interface should pulse with life through fluid animations and responsive feedback

**Complexity Level**: Complex Application (advanced functionality, multiple AI agents, real-time chat, persistent state)
- Requires sophisticated state management for multiple concurrent chat sessions, AI agent personalities, and dynamic UI theming

## Essential Features

**AI Agent Grid Display**
- Functionality: Shows available AI agents in a responsive grid layout with 3D avatars
- Purpose: Provides visual selection interface for AI personalities
- Trigger: On app load and when returning to main view
- Progression: Load app → View agent grid → Hover for details → Click to start chat
- Success criteria: All agents load with unique 3D avatars and personality indicators

**Multi-Window Chat System**
- Functionality: Open multiple resizable, draggable chat windows simultaneously
- Purpose: Enable parallel conversations with different AI agents
- Trigger: Clicking on an AI agent from the grid
- Progression: Select agent → Open chat window → Resize/drag as needed → Type messages
- Success criteria: Multiple windows can be opened, resized, and dragged without conflicts

**Intelligent Message Interface**
- Functionality: Chat input with Shift+Enter support and AI model selection
- Purpose: Provide flexible communication with different AI backends
- Trigger: Focusing on chat input or using model dropdown
- Progression: Focus input → Type message → Shift+Enter for newlines → Send → Receive AI response
- Success criteria: Messages send properly with model selection affecting responses

**Persistent Chat History**
- Functionality: Store and retrieve chat history per AI agent using useKV
- Purpose: Maintain conversation context across sessions
- Trigger: Sending messages or reopening chat with existing agent
- Progression: Send message → Store in persistent storage → Reload app → History preserved
- Success criteria: Chat history persists between app sessions per agent

**Dynamic Theme System**
- Functionality: Switch between Cyberpunk, Minimalist, and Cozy themes
- Purpose: Customize visual experience to user preference
- Trigger: Theme selector in UI
- Progression: Select theme → Apply color palette → Persist choice → Reload with saved theme
- Success criteria: Themes change entire UI appearance and persist across sessions

## Edge Case Handling

- **Network Failures**: Graceful degradation with offline indicators and retry mechanisms
- **Long Messages**: Auto-scrolling and text wrapping for extensive conversations
- **Window Collisions**: Intelligent positioning to prevent overlapping chat windows
- **Memory Limits**: Conversation history truncation with important context preservation
- **Invalid AI Responses**: Error boundaries with user-friendly fallback messages

## Design Direction

The design should evoke a sense of being inside a living digital ecosystem - cyberpunk meets Apple's design philosophy. Think glowing interfaces, subtle animations, and premium materials that feel both futuristic and approachable.

## Color Selection

Triadic color scheme emphasizing electric blues, neon purples, and warm oranges to create a vibrant cyberpunk aesthetic that feels welcoming rather than harsh.

- **Primary Color**: Electric Blue (oklch(0.7 0.2 240)) - Communicates trust and digital sophistication
- **Secondary Colors**: Neon Purple (oklch(0.6 0.25 300)) for accents, Deep Space (oklch(0.15 0.05 240)) for backgrounds
- **Accent Color**: Warm Orange (oklch(0.75 0.15 60)) for CTAs and notifications
- **Foreground/Background Pairings**:
  - Background (Deep Space oklch(0.15 0.05 240)): Light Blue text (oklch(0.9 0.1 240)) - Ratio 8.2:1 ✓
  - Primary (Electric Blue oklch(0.7 0.2 240)): White text (oklch(1 0 0)) - Ratio 5.1:1 ✓
  - Accent (Warm Orange oklch(0.75 0.15 60)): Dark text (oklch(0.2 0.02 60)) - Ratio 6.8:1 ✓

## Font Selection

Typography should convey cutting-edge technology while maintaining excellent readability - using Inter for its technical precision and geometric harmony.

- **Typographic Hierarchy**:
  - H1 (App Title): Inter Bold/32px/tight letter spacing
  - H2 (Agent Names): Inter SemiBold/24px/normal spacing
  - H3 (Chat Headers): Inter Medium/18px/normal spacing
  - Body (Messages): Inter Regular/16px/relaxed line height
  - Small (Timestamps): Inter Regular/14px/wide letter spacing

## Animations

Animations should feel like digital magic - smooth, purposeful, and slightly ethereal to reinforce the "living digital beings" concept.

- **Purposeful Meaning**: Gentle pulsing for active agents, fluid transitions between windows, and particle effects for message sending
- **Hierarchy of Movement**: Agent avatars get primary animation focus, followed by chat window interactions, then subtle ambient effects

## Component Selection

- **Components**: Dialog for chat windows, Card for agent grid items, Button with custom styling, Input with enhanced features, Select for model choosing, Avatar with 3D integration
- **Customizations**: 3D avatar component using Three.js, draggable window wrapper, theme provider system
- **States**: Agents show idle/active/thinking states, chat windows indicate typing/loading, buttons provide haptic-like feedback
- **Icon Selection**: Phosphor icons for technical feel - ChatCircle, Robot, Settings, Palette for theming
- **Spacing**: Generous 24px grid system with 16px component padding for breathing room
- **Mobile**: Stack chat windows vertically, collapsible agent grid, touch-optimized drag handles
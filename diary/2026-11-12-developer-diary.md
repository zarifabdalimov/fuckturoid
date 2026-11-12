surfaces: ios, android, macos, web
agent: Claude Code, Claude Opus 5.5 (the developer's own notes, not the agent's)
task: developer's experience building a small multi-screen app with an agent

### Developer's notes

- **Getting started was easy.** I had a hello-world app running with the agent very fast.
- **Code organisation.** I still read the code from time to time, so I was surprised the agent put everything in `app.ts` and `app.contract`. I had to explicitly ask it to split the contract into smaller files. I'm not sure which is more efficient or what Exact considers best practice, but I still feel code should be organised somehow. Guidance on project structure, or a default the agent follows, would help.
- **Platform-specific code.** I wanted a platform-specific implementation (a custom control on Android only). The agent came up with a workaround that didn't work well, so I dropped it. A supported way to do this would be handy in some cases.
- **Hot reload on native.** Hot reload (hot swap) for the native apps is badly missed. Every UI change meant a rebuild.
- **Tests.** The generated tests annoyed me a bit, so I asked the agent not to write them and to check changes on the simulator/emulator with Argent instead.
- **Feels close to native.** From the beginning it felt much closer to native than React Native. It used native components at first. Later I asked for some custom components, while keeping the native experience where it matters (back buttons, tabs and so on), and that worked well.
- **Open question.** I'm not sure how well it handles more complex cases (a video player, list virtualization, auth, camera…), but for smaller apps it works quite well.

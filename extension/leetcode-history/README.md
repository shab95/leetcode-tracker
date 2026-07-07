# DSA Tracker LeetCode Import Extension

This unpacked Chrome extension captures your signed-in LeetCode submission history, then
hands it to DSA Tracker Settings for review. You can click the extension from any Chrome
tab. It first reads LeetCode's submissions API with your existing LeetCode session, then
falls back to reading rendered `https://leetcode.com/progress/?page=N` pages if the API is
unavailable.

It does **not** ask for LeetCode credentials and does **not** capture submitted code.

## Install locally

1. Open Chrome and go to `chrome://extensions`.
2. Turn on `Developer mode`.
3. Choose `Load unpacked`.
4. Select this folder: `extension/leetcode-history`.

## Use

1. Sign in to LeetCode in the same Chrome profile.
2. Click the extension icon from any Chrome tab and choose `Capture Practice History`.
3. Open DSA Tracker Settings.
4. Review the captured rows and choose `Import history`.

Imported rows become `imported` review history only. They do not count as `Solved cleanly`,
do not create real graded sessions, and do not count toward Minimum Practice, Friend Pulse,
or leaderboard weekly activity.

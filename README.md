# Words into Music CLI

Create songs from an idea or your own lyrics, check your song credits and browse your private library from the terminal.

[Words into Music](https://wordsintomusic.com/) · [API documentation](https://wordsintomusic.com/developers/) · [Sign up](https://wordsintomusic.com/create/)

## Install

Requires Node.js 22 or later.

```sh
npm install -g words-into-music-cli
wim --help
```

## Connect your account

1. [Create a Words into Music account](https://wordsintomusic.com/create/) and verify your email.
2. Open [Settings](https://wordsintomusic.com/app/settings/) and create an API key. Enable song generation if you want to create recordings.
3. Pass the key through stdin. Avoid putting it in a command argument or shell history.

For Bash:

```sh
read -r -s -p 'API key: ' WIM_KEY; echo
printf '%s' "$WIM_KEY" | wim login --key-stdin
unset WIM_KEY
wim account
```

Alternatively, provide `WIM_API_KEY` through your environment or secret manager. It takes precedence over the saved key. The CLI saves credentials in `~/.config/words-into-music/credentials.json` with owner-only file permissions. This is a local credential file, not an encrypted operating-system keychain. Do not share or commit it. Keys expire after 90 days and can be revoked in Settings.

## Prepare and make a song

Save this as `brief.json`. Use a different stable `requestId` for each new song. The request ID is not a secret.

```json
{
  "requestId": "my-first-song-20261021",
  "input": {
    "mode": "idea",
    "idea": "A hopeful song about starting over in a new city",
    "direction": "Warm acoustic pop, steady drums, gentle vocals",
    "language": "en",
    "duration": 120
  },
  "uiLocale": "en"
}
```

```sh
wim prepare --file brief.json
wim start PREPARED_REQUEST_ID --confirm
wim job JOB_ID
```

Preparation does not spend a credit. Starting uses **one existing song credit** and shares your normal account limits. The CLI makes no purchases and has no automatic retry that starts another song. If a request times out, repeat the same preparation ID. Poll a job at least 15 seconds apart. A ready result contains your private library page, where you can listen and download after signing in.

To use your own lyrics, set `mode` to `lyrics`, provide `lyrics`, and leave `idea` empty. For instrumental music set `instrumental` to `true`. Supported languages are `en`, `es`, `de`, `fr` and `pt-BR`. Requested song durations range from 60 to 180 seconds.

## Library commands

```sh
wim songs --limit 10
wim songs --limit 10 --cursor CURSOR_FROM_PREVIOUS_PAGE
wim song SONG_ID
wim song SONG_ID --include-lyrics
```

Results are JSON for use in scripts. Only your own songs are accessible. Private audio storage URLs and third-party service credentials are never returned.

## Disconnect

```sh
wim logout
```

Logout removes the saved local credential. Revoke the key in [Settings](https://wordsintomusic.com/app/settings/) to disable it on every device. Environment variables are managed by your shell or secret manager.

## Cost and support

The CLI and API access have no separate subscription. Song generation uses your existing Words into Music allowance. There are no extra trial credits for installing the CLI. See [pricing](https://wordsintomusic.com/pricing/) for current account plans. Support: contact@wordsintomusic.com.

Only this API client is open source under MIT. The Words into Music application and backend are private.

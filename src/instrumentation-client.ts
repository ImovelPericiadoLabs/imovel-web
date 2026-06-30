import posthog from 'posthog-js'

const posthogKey =
  process.env.NEXT_PUBLIC_POSTHOG_KEY ??
  'phc_4gHXjcgJS80lAnFB6T0pfunjCUteyB7yR7ZohUptaQl'
const posthogHost =
  process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com'

posthog.init(posthogKey, {
  api_host: posthogHost,
  defaults: '2025-11-30',
  disable_session_recording: process.env.NEXT_PUBLIC_POSTHOG_SESSION_RECORDING !== 'true',
})

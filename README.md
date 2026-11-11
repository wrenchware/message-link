# Message Link website

The website for Message Link: what it is, how to choose a setup, a guide for each place Message Link Server runs (Windows,
Unraid, Proxmox, Docker, Linux), the Tailscale and Firebase guides the server's page links to, the page a server's
"Add a phone" code opens, and the privacy policy.

It's plain HTML with one stylesheet (`assets/site.css`), in the look of the server's own page, and its typeface, Inter
(`assets/inter.woff2`, SIL Open Font License in `assets/inter-OFL.txt`). There's no build step, no framework, nothing loaded from
another site, no analytics and no cookies. The only script is on the join page, which reads the code from the address's
`#` fragment on the visitor's own device and sends it nowhere.

## Published

GitHub Pages publishes the `main` branch, from the root, at https://wrenchware.github.io/messages/. `.nojekyll` makes
Pages serve the files as they are.

Every page is a folder with an `index.html`, so `/messages/unraid` works (Pages redirects it to `/messages/unraid/` and
keeps any `#` fragment). Links between pages are relative, except in `404.html`, which Pages serves at any missing
address and so links from `/messages/`.

The apps link here by these addresses, so keep them:

- `/messages/setup`, and `/messages/windows`, `unraid`, `proxmox`, `docker`, `linux`
- `/messages/join#v=1&n=…&a=…&f=…&c=…&u=…`, the code a server shows under "Add a phone"
- Custom Tailscale ports use `v=2` with `p=<port>`. Default-port codes remain version 1 for older phones.
- `/messages/tailscale`, `/messages/firebase` and `/messages/privacy`

## Working on it

```sh
node tools/serve.mjs        # http://localhost:8000/messages/, served the way Pages serves it
node tools/check-links.mjs  # every internal link and #anchor leads somewhere
node tools/check-join.mjs   # versioned join fragments stay local and require an explicit app open
```

## Still to fill in

- The Microsoft Store link (https://apps.microsoft.com/detail/9MZ2X0ZWHD9H) once the listing is live: `index.html`
  and `windows/index.html` say "coming soon".
- The Android download once the app leaves invite-only testing: `index.html` and `join/index.html`.
- The server image, the Linux package and the Proxmox script's address once they're public: the notes at the top of
  `unraid/`, `proxmox/`, `docker/` and `linux/`.
